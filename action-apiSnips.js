const fs = require('fs');
const mqtt = require('mqtt');
const HOST = 'localhost';
const db = '/home/pi/apiRasp/data.json';

var client = mqtt.connect('mqtt://' + HOST, {port: 1883});

const sensEng = {
	'temperature': 'temperature',
	'pression': 'pressure',
	'humidite': 'humidity'
}

function initDb(db, payload, destroy) {
	if (!fs.existsSync(db) || destroy == true) {
		console.log('No file, creating...');
		var content = {
			"website": {
				"header": {
					"title": "Welcome to MusicLand",
					"color": "grey"
				},
				"sockets": [
					{
						"name": "temperature",
						"active": false,
					},
					{
						"name": "humidity",
						"active": false
					},
					{
						"name": "pressure",
						"active": false
					}
				],
				"products": [
				]
			}
		}
		try {
			fs.writeFileSync(db, JSON.stringify(content));
		} catch (e) {
			throw (e);
			console.log(e);
			var resp = {
				"sessionId": payload.sessionId,
				"text": "Erreur lors de l'initialisation de la base de donnees"
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
	}
}

client.on('connect', function() {
	console.log('connected to ' + HOST);
	client.subscribe('hermes/hotword/default/detected');
	client.subscribe('hermes/intent/#');
})

client.on('message', function(topic, message) {
	var payload = JSON.parse(message);

	if (topic == 'hermes/intent/wzaim:getWebsite') {
		initDb(db, payload);
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
		var products = data.website.products.filter(product => product.name.length > 0 && product.price > 0);
		var status = {
			'header': 'header' in data.website ? 1 : 0,
			'products': products.length,
			'sensors': activeSensors.length
		}
		var resp = {
			'sessionId': payload.sessionId,
			'text': `Actuellement ton site se compose de ${status.header} section titre, ${status.products} produits et ${status.sensors} capteurs actifs.`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}	

	if (topic == 'hermes/intent/wzaim:displaySensors') {
		initDb(db, payload);
		var nbSlots = payload.slots.length;
		var sensors = [];
		var answer = "";
		var data = fs.readFileSync(db);
		data = JSON.parse(data);

		for (var i = 0; i < nbSlots; i++) {
			sensors[i] = sensEng[payload.slots[i].value.value];
			answer += `${sensors[i]}, `;
			for (j = 0; j < data.website.sockets.length; j++) {
				if (sensors[i] == data.website.sockets[j].name) {
					data.website.sockets[j].active = true;
				}
			}
		}
		data = {...data, website: {...data.website, sockets: data.website.sockets}};
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': `J'ai activé les capteurs ${answer}`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}

	if (topic == 'hermes/intent/wzaim:hideSensors') {
		initDb(db, payload);
		var nbSlots = payload.slots.length;
		var sensors = [];
		var answer = "";
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		
		for (var i = 0; i < nbSlots; i++) {
			sensors[i] = sensEng[payload.slots[i].value.value];
			answer += `${sensors[i]}, `;
			for (j = 0; j < data.website.sockets.length; j++) {
				if (sensors[i] == data.website.sockets[j].name) {
					data.website.sockets[j].active = false;
				}
			}
		}
		data = {...data, website: {...data.website, sockets: data.website.sockets}};
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': `J'ai desactive les capteurs ${answer}`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}

	if (topic == 'hermes/intent/wzaim:getId') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		var name = payload.slots.length > 0 ? payload.slots[0].value.value : "";
		var id = -1;
		data = JSON.parse(data);
		products = data.website.products;
		for (var i = 0; i < products.length; i++) {
			if (products[i].name == name) {
				var id = products[i].id;
			}
		}
		if (id > 0) {
			var resp = {
				'sessionId': payload.sessionId,
				'text': `L'identifiant du produit ${name} est: ${id}.`
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		} else {
			var resp = {
				'sessionId': payload.sessionId,
				'text': `Ce produit n'existe pas dans la base de donnees`
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
	}

	if (topic == 'hermes/intent/wzaim:deleteById') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		var idRemove = payload.slots.length > 0 ? parseInt(payload.slots[0].value.value): "";
		data = JSON.parse(data);
		products = data.website.products;
		products = products.filter(product => product.id != idRemove);
		data = {...data, website: {...data.website, products: products}};
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': `Le produit dont l'identifiant est ${idRemove} a ete supprime`
		};
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}

	if (topic == 'hermes/intent/wzaim:addProduct') {
		initDb(db, payload);
		var answers = ["Comment veux tu l'appeler ?", "Quel est le nom du nouveau produit ?", "Quel titre veux tu lui donner ?", "Comment dois-je appeler ce produit ?", "quel est son titre ?"];
		var newProduct = {
			"name": "",
			"price": "",
			"stock": ""
		}

		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		if (!('products' in data.website)) {
			newProduct['id'] = 1;
			var products = [newProduct];
		} else {
			var products = data.website.products;
			newProduct['id'] = Math.floor(products.length * (Math.random() * 10));
			products.push(newProduct);
		}
		data = {...data, website: {...data.website, products: products}}
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': answers[Math.floor(Math.random() * answers.length)],
			'intentFilters': ['wzaim:addTitle', 'wzaim:cancel']
		};
		client.publish('hermes/dialogueManager/continueSession', JSON.stringify(resp));
	}

	if (topic == 'hermes/intent/wzaim:addTitle') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		var products = data.website.products;
		var newName = (payload.slots.length > 0) ? payload.slots[0].rawValue : "";
		if (products[products.length - 1].name.length == 0) {
			if (payload.slots.length > 0) {
				for (var i = 0; i < products.length; i++) {
					if (products[i].name == newName) {
						products[products.length - 1].id = products[i].id;
						products.splice(i, 1);
					}
				}	
				products[products.length - 1].name = newName;
			}
			products = products.filter(product => product.name.length > 0);
			data = {...data, website: {...data.website, products: products}};
			fs.writeFileSync(db, JSON.stringify(data));
			var resp = {
				'sessionId': payload.sessionId,
				'text': `Le nouveau produit se nomme ${newName}, a quel prix veux tu le vendre ?`,
				'intentFilters': ['wzaim:addPrice', 'wzaim:addStocks', 'wzaim:cancel']
			}
			client.publish('hermes/dialogueManager/continueSession', JSON.stringify(resp));
		} else {
			var resp = {
				'sessionId': payload.sessionId,
				'text': "Il n'y a pas de produit en cours de creation, merci de creer un produit avant ou modifier un produit en particulier"
			}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
	}
	
	if (topic == 'hermes/intent/wzaim:addPrice') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		var products = data.website.products;
		var newPrice = payload.slots.length > 0 ? payload.slots[0].value.value : "";
		
		if (products[products.length - 1].name.length > 0 && products[products.length - 1].price.length == 0) {
			if (payload.slots.length > 0) {
				products[products.length - 1].price = newPrice;
			}
			products = products.filter(product => product.name.length > 0 && product.price > 0);
			console.log(products);
			data = {...data, website: {...data.website, products: products}};
			fs.writeFileSync(db, JSON.stringify(data));
			var resp = {
				'sessionId': payload.sessionId,
				'text': `Le prix de: ${products[products.length - 1].name} est maintenant de ${newPrice} euros, combien en as tu a vendre ?`,
				'intentFilters': ['wzaim:addStock', 'wzaim:cancel']
			}
			client.publish('hermes/dialogueManager/continueSession', JSON.stringify(resp));
		} else {
			var resp = {
				'sessionId': payload.sessionId,
				'text': "Aucun produit en cours de creation, merci d'en creer un avant de vouloir ajouter son prix"
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
	}

	if (topic == 'hermes/intent/wzaim:addStock') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		var products = data.website.products;
		var newStock = payload.slots.length > 0 ? parseInt(payload.slots[0].value.value) : "";

		if (products[products.length - 1].name.length > 0 && products[products.length - 1].price > 0 && products[products.length - 1].stock.length == 0) {
			if (payload.slots.length > 0) {
				products[products.length - 1].stock = newStock;
			}
			products = products.filter(product => product.name.length > 0 && product.price > 0 && product.stock >= 0);
			console.log(products);
			data = {...data, website: {...data.website, products: products}};
			fs.writeFileSync(db, JSON.stringify(data));
			var resp = {
				'sessionId': payload.sessionId,
				'text': `Le produit ${products[products.length - 1].name} a ete ajoute avec succes au prix de ${products[products.length - 1].price} avec un stock de ${newStock}.`
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		} else {
			var resp = {
				'sessionId': payload.sessionId,
				'text': "Aucun produit en cours de creation, merci d'en creer un avant de vouloir ajouter son stock"
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
		}
	}

	if (topic == 'hermes/intent/wzaim:cancel') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		var products = data.website.products;
		products = products.filter(product => product.name.length > 0 && product.price > 0 && product.stock.length != 0);
		data = {...data, website: {...data.website, products: products}};
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': `Base de donnees nettoyee.`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}

	if (topic == 'hermes/intent/wzaim:destroy') {
		initDb(db, payload, true);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		console.log(data);
		var resp = {
			'sessionId': payload.sessionId,
			'text': 'La base de donnee a ete correctement remise a zero.'
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}
})
