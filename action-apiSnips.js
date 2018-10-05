const fs = require('fs');
const mqtt = require('mqtt');
const HOST = 'localhost';
const db = '/home/pi/apiRasp/data.json';

var client = mqtt.connect('mqtt://' + HOST, {port: 1883});

client.on('connect', function() {
	console.log('connected to ' + HOST);
	client.subscribe('hermes/hotword/default/detected');
	client.subscribe('hermes/intent/#');
})

client.on('message', function(topic, message) {
	var payload = JSON.parse(message);

	if (topic == 'hermes/intent/wzaim:getWebsite') {
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		if (data.length === 0 || data.website.length === 0) {
			console.log('Empty');
			var resp = {
				'sessionId': payload.sessionId,
				'text': 'Ton site est completement vide'
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
		if (data.website.sockets.length > 0) {
			var activeSensors = data.website.sockets.filter(sensor => sensor.active === true);
		}
		var status = {
			'header': 'header' in data.website ? 1 : 0,
			'products': data.website.products.length,
			'sensors': activeSensors.length
		}
		var resp = {
			'sessionId': payload.sessionId,
			'text': `Tu as ${status.header} section titre, ${status.products} produits et ${status.sensors} capteurs actifs.`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}

})
