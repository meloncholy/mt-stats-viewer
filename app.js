/*!
* (mt) Stats Viewer
*
* Visualise your MediaTemple stats with some gorgeous D3 graphs.
*
* Copyright (c) 2012 Andrew Weeks http://meloncholy.com
* Licensed under the MIT licence. See http://meloncholy.com/licence
* Version 0.0.1
*/

"use strict";

var config = require("konphyg")(__dirname + "/config/");
// There must be a better way to do this.
global.appPath = __dirname;
global.mtSettings = { app: config("app") };

var express = require("express");
var mtStats = require("mt-stats");

var routes = {};
routes.site = require("./routes/site");

var app = module.exports = express.createServer();

app.configure(function () {
	app.set("env", global.mtSettings.mode);
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	// Put static before router to check for real files first, a la .htaccess
	app.use(express.static(__dirname + "/public"));
	app.use(app.router);
	app.use(express.compiler({ src: __dirname + "/public", enable: ["less"] }));
});

app.configure("development", function() {
	app.use(express.logger());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function() {
	app.use(express.errorHandler());
});


// Routes
app.get("/api/:range?", mtStats);
app.get("/", routes.site.index);

app.listen(config("app").localPort);
console.log("We're up on port %d in %s mode.", app.address().port, app.settings.env);
