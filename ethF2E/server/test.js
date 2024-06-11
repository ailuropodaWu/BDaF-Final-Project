const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

let data = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'];

app.get('/api/data', (req, res) => {
  res.json(data);
});

app.post('/api/data', (req, res) => {
  const newData = req.body;
  data.push(newData);
  res.status(201).send('Data added successfully');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


