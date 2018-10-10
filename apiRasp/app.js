const express = require('express');
const app = express();
const Server = require('http').Server(app);
const io = require('socket.io')(Server);
const imu = require('node-sense-hat').Imu;
const fs = require('fs');
const cors = require('cors');

const IMU = new imu.IMU();

// Enabling cors
app.use(cors());

app.use(express.static('public'));

// Serving data.json on client landpage
app.get('/', function (req, res) {
	var content = fs.readFileSync('./data.json');
	res.send(content);
})

// Start fetching data when a socket connection opens, 1500ms delay between each fetch
io.on('connect', function (socket) {
	fetchData(socket);
	setInterval(
		() => fetchData(socket),
		1500
	);
})

function fetchData(socket) {
	IMU.getValue((err, data) => {
		socket.emit('fetchData', data);
	})
}

Server.listen(3000, function () {
	console.log('Up and running');
})
