# apiRasp

Basic API that is part of a music instrument marketplace prototype powered by a fully voice-controlled (Snips) back-office.

The apiRasp serves the website template stored in a data.json file and broadcasts live temperature, pressure and humidity data.

The sample app comes along with a [React front](https://github.com/Zaimwa9/frontRasp) and a node.js [Snips app](https://github.com/Zaimwa9/apiSnips).

Check out [Snips](https://snips.ai/) for more info.

# Prerequisites

The API is to be run on a Raspberry Pi 3 equipped with a [Sense Hat](https://www.kubii.fr/cartes-extension-cameras-raspberry-pi/1081-raspberry-pi-sense-hat-kubii-640522710799.html).

You need to have a Snips account and an assistant with the Snips app linked to fully use the features.

Additionally, the frontRasp will let you have a sweeter view of what is happening under the hood.

# Getting Started

Connect to the Raspberry using ssh and clone the repository.

`git clone git@github.com:Zaimwa9/apiRasp.git`
`cd path/to/your/folder`

Select the port you wish to expose, by default 3000 (don't forget to modify frontRasp accordingly):

```javascript
Server.listen(3000, function () {
	console.log('Up and running');
})
```

Run the app:
### Node
`node app.js`

### [PM2](https://pm2.io/doc/en/runtime/quick-start/)
`pm2 start app.js`
