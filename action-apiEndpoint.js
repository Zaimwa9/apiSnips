#!/usr/bin/env node

const express = require('express');
const app = express();
const Server = require('http').Server(app);
const io = require('socket.io')(Server);
const imu = require('node-sense-hat').Imu;
const fs = require('fs');
const cors = require('cors');
const ini = require('ini');

const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

const port = config.secret.port.length > 0 ? parseInt(config.secret.port) : 3000;
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

Server.listen(port, function () {
	console.log('Up and running');
})
