# apiSnips

Using Snips as an API. This app is of course a prototype, it pretends to be a music marketplace .

Intents are to replace routes in a traditional REST API to interact with the database and different services:
- POST/PUT: Upsert a product by saying something like "Je veux créer un produit" and follow the different steps to set its characteristics (addTitle - addPrice - addStock)

- GET: get the website status, similar to a get all or get the id of a particular product based on its name ("Quel est l'identifiant de la batterie ?").

- DELETE: delete a product using its Id.

- Clean the database

- For the fun: you can display real time temperature/humidity/pressure data.
(Optional: it uses sensors from the Sense Hat raspi add-on).

The app's port is 3000 by default (modifiable via the parameter). You can connect any front on a local network to get the data from 'http://yourRaspi.local:3000'.

Check this basic front made for the app (https://github.com/Zaimwa9/frontRasp/) 

# Prerequisites

 To be able to broadcast realtime data you will need a Sense HAT plugin for raspberry.

# How to use

Everything happens on [Snips](https://snips.ai/). Link an app to this repo and you are all set up.

To fully benefit from the data, you can plug a front (e.g https://github.com/Zaimwa9/frontRasp/)

If the port is busy you can change it in `/var/lib/snips/skills/yourAction/config.ini`
and restart `sudo systemctl restart 'snips-*'`
