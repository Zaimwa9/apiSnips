const fs = require('fs');
const mqtt = require('mqtt');
const HOST = 'localhost';
const db = '/home/pi/apiRasp/data.json';

var client = mqtt.connect('mqtt://' + HOST, {port: 1883});

function initDb(db, payload) {
	if (!fs.existsSync(db)) {
		console.log('No file, creating...');
		var content = {
			"website": {
				"sockets": [
					{
						"name": "temperature",
						"active": false,
					},
					{
						"name": "humidity",
						"active": true
					},
					{
						"name": "pressure",
						"active": true
					}
				],
				"products": [
				]
			}
		}
		try {
			fs.writeFileSync(db, content);
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
			newProduct['id'] = Math.floor(products.length * (Math.random * 5));
			var products = data.website.products;
			products.push(newProduct);
		}
		data = {...data, website: {...data.website, products: products}}
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': answers[Math.floor(Math.random() * answers.length)],
			'intentFilters': ['wzaim:addTitle']
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
				'text': `Le prix de: ${products[products.length - 1].name} est maintenant de ${newPrice} euros`,
				'intentFilters': ['wzaim:addStocks', 'wzaim:cancel']
			}
			client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
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
		var newStock = payload.slots.length > 0 ? payload.slots[0].value.value : "";

		if (products[product.length - 1].name.length > 0 && products[products.length - 1].price.length > 0 && products[products.length - 1].stock.length == 0) {
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
		} else {
			var resp = {
				'sessionId': payload.sessionId,
				'text': "Aucun produit en cours de creation, merci d'en creer un avant de vouloir ajouter son stock"
			}
		}
	}

	if (topic == 'hermes/intent/wzaim:cancel') {
		initDb(db, payload);
		var data = fs.readFileSync(db);
		data = JSON.parse(data);
		var products = data.website.products;
		products = products.filter(product => product.name.length > 0 && product.price > 0 && product.stock >= 0);
		data = {...data, website: {...data.website, products: products}};
		fs.writeFileSync(db, JSON.stringify(data));
		var resp = {
			'sessionId': payload.sessionId,
			'text': `Creation de produit annulee et base de donnees nettoyee.`
		}
		client.publish('hermes/dialogueManager/endSession', JSON.stringify(resp));
	}
})
