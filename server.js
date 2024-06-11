const express = require("express");
const bodyParser = require("body-parser");
const app = express();
// const lib = require("./index");
const llama = require("./nodejs/llama");
const trade = require("./nodejs/trade");

// Parse JSON bodies
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});
app.use(bodyParser.json());

app.get("/prompt", (req, res) => {
  // Send a response back to the client
  res.send("Data received successfully!");
});

// POST route to handle incoming data
app.post("/api/data", async (req, res) => {
  instruction = await req.body["prompt"];
  console.log(instruction);
  response = await llama.oao(instruction);
  res.send(response);
});

app.post("/api/transfer", async (req, res) => {
  params = await req.body;
  let [status_code, hash] = await trade.transfer(
    params["networkFrom"],
    params["addressFrom"],
    params["networkTo"],
    params["addressTo"],
    params["amount"],
  );
  res.send([status_code, hash]);
});

// Start the server
const PORT = 3000; // You can change the port number if needed
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
