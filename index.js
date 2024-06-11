const llama = require("./nodejs/llama");
const trade = require("./nodejs/trade");

async function main() {
  const example =
    "I want to send 1 usdc in my wallet address 0xfe44D275fA324F059c3b673577334aAaC09B706A on sepolia testnet to my avalanche testnet address 0xfe44D275fA324F059c3b673577334aAaC09B706A";
  const instruction = process.argv[2] || example;
  result = await llama.oao(instruction);
  [state, hash] = await trade.transfer.apply(this, result);
  console.log(state);
  return state;
}

// main();
