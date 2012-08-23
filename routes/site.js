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

var mtStats = require("mt-stats");

var site = {};

site.index = function (req, res) {
	var settings = global.mtSettings.app;
	var locals = {
		metrics: mtStats.metrics,
		appSettings: JSON.stringify({ url: settings.url + "/api",
			interval: mtStats.interval,
			retry: settings.retryInterval,
			graphRanges: settings.graphRanges,
			graphRange: settings.graphRanges[0]
		})
	};

	res.render("index", { locals: locals, settings: settings });
};

module.exports = site;
