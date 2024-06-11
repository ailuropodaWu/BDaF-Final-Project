require("dotenv").config();
const { Web3 } = require("web3");
const ethers = require("ethers");
const concat = require("concat-stream");
const netlist = ["sepolia", "avalanche", "op", "base"];
const network = require("../network.json");
const web3 = new Web3(process.env.DEFAULT_TESTNET_RPC);
const oaocabi = require("../build/contracts/OAOCircle.json")["abi"]; // OAOCircle
const OAOC_ADDRESS = "0xf59eBE57B47c51f8583264be7e21692fCB211AB4";
// const oaocabi = require("../build/contracts/Prompt.json")["abi"]; // Prompt
// const OAOC_ADDRESS = "0x64BF816c3b90861a489A8eDf3FEA277cE1Fa0E82"

const SENDER = web3.eth.accounts.privateKeyToAccount(
  process.env.FROM_PRIVATE_KEY,
);
web3.eth.accounts.wallet.add(SENDER);
const OAOCircle = new web3.eth.Contract(oaocabi, OAOC_ADDRESS, {
  from: SENDER.address,
});
const TO = 3600 * 1000; // Due to LLama inference
const MSG_VALUE = 0.05;

async function waitForTransaction(web3, txHash) {
  let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
  while (transactionReceipt != null && transactionReceipt.status === "FALSE") {
    transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    await new Promise((r) => setTimeout(r, TO));
  }
  return transactionReceipt;
}

async function parseResult(row_data) {
  datas = [];
  for (var question = 1; question <= 5; question++) {
    start_idx = row_data.indexOf(`${question}.`) + 2;
    end_idx = question == 5 ? -1 : row_data.indexOf(`${question + 1}.`);
    data = row_data.slice(start_idx, end_idx).replace("\n", "").split(" ");
    if (question == 1 || question == 3) {
      // console.log(`${data}\n`)
      const found = data.find((element) =>
        netlist.includes(element.toLowerCase()),
      );
      // console.log(found)
      if (found) {
        data = found.toLowerCase();
      } else {
        data = "sepolia";
      }
    } else {
      data = data[1];
    }
    datas.push(data);
  }
  console.log(`parse:\n${datas}`);

  return datas;
}

async function oao(_instruction) {
  const condition =
    "1. from which network\n" +
    "2. from which address\n" +
    "3. to which network\n" +
    "4. to which address\n" +
    "5. transaction amount\n" +
    "Answer about the transaction detail.\n" +
    "Give me totaly only five words answer!\n";
  var prompt = await condition.concat(_instruction);
  console.log(`prompt:\n${prompt}`);
  const tx = await OAOCircle.methods
    .calculateAIResult(prompt)
    .send({ value: web3.utils.toWei(`${MSG_VALUE}`, "ether") });
  const receipt = await waitForTransaction(web3, tx.transactionHash);
  console.log(receipt);
  const result = await OAOCircle.methods.getAIResult(prompt).call();
  console.log(`result:\n${result}`);
  return await parseResult(result);
}

async function llama() {
  const example = "this is a test example.";
  var instruction = process.argv[2] || example;
  result = await oao(instruction);
  console.log(result);
}
// llama();
module.exports = { oao };
