const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));
app.use('js', express.static(__dirname + '/public/js'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/map', (req, res) => {
  let mapData = fs.readFileSync('./map/mapdata.txt', 'utf8');
  res.status(200).json({ mapData: mapData });
});

app.listen(port, () => {
  console.log('server is running on port ', port);
});
