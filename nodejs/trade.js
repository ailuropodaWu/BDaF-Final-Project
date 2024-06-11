require("dotenv").config();
const { Web3 } = require("web3");
const ethers = require("ethers");
const tokenMessengerAbi = require("../abis/cctp/TokenMessenger.json");
const usdcAbi = require("../abis/Usdc.json");
const messageTransmitterAbi = require("../abis/cctp/MessageTransmitter.json");
const network = require("../network.json");

const TO = 100000; // Due to llama inference
async function waitForTransaction(web3, txHash) {
  let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
  while (transactionReceipt != null && transactionReceipt.status === "FALSE") {
    transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    await new Promise((r) => setTimeout(r, TO));
  }
  return transactionReceipt;
}

async function transfer(fromNet, fromAddr, toNet, toAddr, amount) {
  const fromNetRPC = network[fromNet.toLowerCase()]["rpcURL"];
  const toNetRPC = network[toNet.toLowerCase()]["rpcURL"];
  const to_DOMAIN = network[toNet.toLowerCase()]["domain"];
  const web3 = new Web3(fromNetRPC);
  amount = BigInt(web3.utils.toWei(amount.toString(), "wei"));

  // Add ETH private key used for signing transactions
  const fromSigner = web3.eth.accounts.privateKeyToAccount(
    process.env.FROM_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(fromSigner);
  const toSigner = web3.eth.accounts.privateKeyToAccount(
    process.env.TO_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(toSigner);

  // Testnet Contract Addresses
  const from_TOKEN_MESSENGER_CONTRACT_ADDRESS =
    network[fromNet]["tokenMessenger"];
  const USDC_CONTRACT_ADDRESS = network[fromNet]["urcToken"];
  const to_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS =
    network[toNet]["messageTransmitter"];

  // initialize contracts using address and ABI
  const fromTokenMessengerContract = new web3.eth.Contract(
    tokenMessengerAbi,
    from_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    { from: fromAddr }
  );
  const usdcContract = new web3.eth.Contract(usdcAbi, USDC_CONTRACT_ADDRESS, {
    from: fromAddr,
  });
  const toMessageTransmitterContract = new web3.eth.Contract(
    messageTransmitterAbi,
    to_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
    { from: toAddr }
  );

  // Check USDC Balance
  const usdcBalance = BigInt(
    await usdcContract.methods.balanceOf(fromAddr).call()
  );
  if (usdcBalance < amount) {
    console.log("current balance: ", usdcBalance);
    console.log("amount: ", amount);
    throw new Error("Insufficient USDC balance for transfer.");
  }

  // OP destination address
  // const toAddr = process.env.RECIPIENT_ADDRESS;
  // const destinationAddressInBytes32 = await ethMessageContract.methods.addressToBytes32(toAddr).call();
  const abiCoder = new ethers.AbiCoder();
  const destinationAddressInBytes32 = abiCoder.encode(["address"], [toAddr]);

  await new Promise((r) => setTimeout(r, 30000));
  console.log("=============== Step 1 ===============");
  try {
    // STEP 1: Approve messenger contract to withdraw from our active eth address
    const approveTxGas = await usdcContract.methods
      .approve(from_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount)
      .estimateGas();
    const approveTx = await usdcContract.methods
      .approve(from_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount)
      .send({ gas: approveTxGas });
    const approveTxReceipt = await waitForTransaction(
      web3,
      approveTx.transactionHash
    );
    console.log("ApproveTxReceipt: ", approveTxReceipt);

    await new Promise((r) => setTimeout(r, 30000));
    console.log("=============== Step 2 ===============");
    // STEP 2: Burn USDC
    const burnTxGas = await fromTokenMessengerContract.methods
      .depositForBurn(
        amount,
        to_DOMAIN,
        destinationAddressInBytes32,
        USDC_CONTRACT_ADDRESS
      )
      .estimateGas();
    const burnTx = await fromTokenMessengerContract.methods
      .depositForBurn(
        amount,
        to_DOMAIN,
        destinationAddressInBytes32,
        USDC_CONTRACT_ADDRESS
      )
      .send({ gas: burnTxGas });
    const burnTxReceipt = await waitForTransaction(
      web3,
      burnTx.transactionHash
    );
    console.log("BurnTxReceipt: ", burnTxReceipt);

    await new Promise((r) => setTimeout(r, 30000));
    console.log("=============== Step 3 ===============");
    // STEP 3: Retrieve message bytes from logs
    const transactionReceipt = await web3.eth.getTransactionReceipt(
      burnTx.transactionHash
    );
    const eventTopic = web3.utils.keccak256("MessageSent(bytes)");
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic);
    const messageBytes = web3.eth.abi.decodeParameters(["bytes"], log.data)[0];
    const messageHash = web3.utils.keccak256(messageBytes);

    console.log(`MessageBytes: ${messageBytes}`);
    console.log(`MessageHash: ${messageHash}`);

    await new Promise((r) => setTimeout(r, 30000));
    console.log("=============== Step 4 ===============");
    // STEP 4: Fetch attestation signature
    let attestationResponse = { status: "pending" };
    while (attestationResponse.status != "complete") {
      const response = await fetch(
        `https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`
      );
      attestationResponse = await response.json();
      await new Promise((r) => setTimeout(r, 30000));
    }

    const attestationSignature = attestationResponse.attestation;
    console.log(`Signature: ${attestationSignature}`);

    await new Promise((r) => setTimeout(r, 30000));
    console.log("=============== Step 5 ===============");
    // STEP 5: Using the message bytes and signature receive the funds on destination chain and address
    web3.setProvider(toNetRPC); // Connect web3 to OP testnet
    const receiveTxGas = await toMessageTransmitterContract.methods
      .receiveMessage(messageBytes, attestationSignature)
      .estimateGas();
    const receiveTx = await toMessageTransmitterContract.methods
      .receiveMessage(messageBytes, attestationSignature)
      .send({ gas: receiveTxGas });
    const receiveTxReceipt = await waitForTransaction(
      web3,
      receiveTx.transactionHash
    );
    console.log("ReceiveTxReceipt: ", receiveTxReceipt);
    console.log(receiveTx.transactionHash);
    return [receiveTx.status, receiveTx.transactionHash];
  } catch (error) {
    console.log(error);
  }
}

async function main() {
  [state, txHash] = await transfer(
    "sepolia",
    "0x7b62a3C5A32a5A7c6744265A1012f7A1dB0a1d2F",
    "avalanche",
    "0x7b62a3C5A32a5A7c6744265A1012f7A1dB0a1d2F",
    1
  );
  console.log(state);
  console.log(txHash);
}

main();
module.exports = { transfer };
