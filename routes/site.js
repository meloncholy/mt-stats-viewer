"use strict";

var mtStats = require("mt-stats");

var site = {};

site.index = function (req, res) {
	var settings = global.mtSettings.app;
	var locals = {
		metrics: mtStats.metrics,
		appSettings: JSON.stringify({ url: settings.url + "/api",
			interval: mtStats.interval,
			retry: 1000,
			graphRanges: settings.graphRanges,
			graphRange: settings.graphRanges[0]
		})
	};

	res.render("index", { locals: locals, settings: settings });
};

module.exports = site;