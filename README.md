(mt) Stats Viewer
=================

(mt) Stats Viewer uses the [(mt) Stats](https://github.com/meloncholy/mt-stats) module to show graphs of (nearly) realtime stats for MediaTemple webservers using the wonderful [D3](http://d3js.org). 

If you want to read more about how it works and some potential problems, there's a surprisingly (to me, at least) long post [here](http://meloncholy.com/blog/using-d3-for-realtime-webserver-stats).


Setting up (mt) Stats on your server
------------------------------------

- [Get an API key](https://ac.mediatemple.net/api) for your MediaTemple server. You'll also need your service ID later, which you can get by visiting `https://api.mediatemple.net/api/v1/services/ids.json?apikey=XXXXX` (I only have one service ID as I have one server, but apparently you could see more.)

- [Get a copy of Node.js](http://nodejs.org/). You can put (mt) Stats on your server if you want to access your stats from anywhere, or run it locally on your machine if you prefer. If you haven't got Node already and you're using Linux, there's an installation guide [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). If you're running Windows or OSX then you can just download the installer from the Node site.

- [Download (mt) Stats Viewer](https://github.com/meloncholy/mt-stats-viewer) from Github and run `npm install` in the folder where you put it to get the packages it needs (list further down for reference).

- You should now have a copy of `mt-stats`. Rename the config file `node_modules/mt-stats/config/mt-stats-sample.json` to `mt-stats.json` and change the service ID and API key to match your server and key.

- Rename the config file `config/app-sample.json` to `app.json` and change the URL and port. `localPort` is the internal port on which the service runs and `url ` is the external URL for the service. Also edit `gaAccount` and `gaDomain` to match your Google Analytics details if you want to track usage.

- Run `app.js` and you should be good to go.


Settings
--------

Please rename `app-sample.json` to `app.json`.

- **localPort** - Local port on which the app is running
- **url** - Public URL for the app
- **mode** - `development` uses uncompressed and (many) separate JavaScript files, while `production` uses Google's CDN for jQuery
- **title** - Page title
- **description** - Meta description contents
- **graphRanges** - Timespans that are sent to the client for the range slider. Currently 5 mins - 1 week in ms
- **author** - Meta author contents
- **jQueryCdnUrl** - Yup
- **gaAccount** - Your Google Analytics account
- **gaDomain** - Your Google Analytics domain

Example

```javascript
{
	"localPort": 3000,
	"url": "http://bits.meloncholy.com/mt-stats",
	"mode": "production",
	"title": "(mt) Stats",
	"description": "Visualise your MediaTemple stats with some gorgeous D3 graphs.",
	"graphRanges": [
		300000,
		600000,
		900000,
		1200000,
		1500000,
		1800000,
		2700000,
		3600000,
		5400000,
		7200000,
		10800000,
		14400000,
		18000000,
		21600000,
		32400000,
		43200000,
		54000000,
		64800000,
		75600000,
		86400000,
		172800000,
		259200000,
		345600000,
		432000000,
		518400000,
		604800000
	],
	"author": "Andrew Weeks",
	"jQueryCdnUrl": "http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js",
	"gaAccount": "UA-XXXXXXXX-X",
	"gaDomain": "meloncholy.com"
}
```

Dependencies
------------

- [Express](https://github.com/visionmedia/express)
- [Jade](https://github.com/visionmedia/jade)
- [Konphyg](https://github.com/pgte/konphyg)
- [Less](https://github.com/cloudhead/less.js)
- [(mt) Stats](https://github.com/meloncholy/mt-stats)


Legal fun
---------

Copyright &copy; 2012 Andrew Weeks http://meloncholy.com

(mt) Stats Viewer is licensed under the [MIT licence](http://meloncholy.com/licence).


Me
--

I have a [website](http://meloncholy.com) and a [Twitter](https://twitter.com/meloncholy). Please come and say hi if you'd like or if something's not working; be lovely to hear from you. 
