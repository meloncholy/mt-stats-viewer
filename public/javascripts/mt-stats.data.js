/*global _: true, Backbone: true, d3: true, mt: true */

$(function () {
	"use strict";

	mt.stats = {};
	mt.stats.start = 1;
	mt.stats.functions = [];
	mt.stats.data = [];
	Object.defineProperty(mt.stats, "end", { get: function () { return this.data.length - 1; }, enumerable: true });

	var returned = true;
	var savedSettings;

	mt.settings = JSON.parse($("#app-settings").html());

	if ((savedSettings = localStorage.getItem("mt-stats-settings")) !== null) {
		savedSettings = JSON.parse(savedSettings);
		for (var s in savedSettings) mt.settings[s] = savedSettings[s];
	}

	localStorage.setItem("mt-stats-settings", JSON.stringify(mt.settings));

	var Stats = function (obj) {
		for (var prop in obj) this[prop] = obj[prop];
	};

	Object.defineProperty(Stats.prototype, "time", { get: function () { return this.timeStamp * 1000; }, enumerable: true });

	mt.stats.register = function (f, t) {
		if (!mt.stats.functions.some(function (e) { return e.f === f && e.t === t; })) mt.stats.functions.push({ f: f, t: t });
	};

	mt.stats.unregister = function (f, t) {
		mt.stats.functions = mt.stats.functions.filter(function (e) { return !(e.f === f && e.t === t); });

		// var idx = mt.stats.functions.indexOf(f);
		// if (idx !== -1) {
		// 	mt.stats.functions.splice(idx, 1);
		// }
	};

	mt.stats.save = function (key, val) {
		mt.settings[key] = val;
		localStorage.setItem("mt-stats-settings", JSON.stringify(mt.settings));
	};

	$.getJSON(mt.settings.url + "/" + mt.settings.graphRange / 1000, function (data) {
		for (var i = 0, len = data.statsList.stats.length; i < len; i++) {
			// Give it a prototype.
			// http://stackoverflow.com/a/5873875/648802
			mt.stats.data.push(new Stats(data.statsList.stats[i]));
		}

		setInterval(tick, mt.settings.interval);
		tick();
	});

	// This will be (at least) 15 sec behind realtime.
	function tick() {
		if (!returned) {
			setTimeout(tick, mt.settings.retry);
			return;
		}

		returned = false;
		updateGraphs();

		$.getJSON(mt.settings.url, function (data) {
			returned = true;
			mt.stats.start++;
			// console.log("start++", mt.stats.start, mt.stats.end, new Date(mt.stats.data[mt.stats.start].timeStamp * 1000), new Date(mt.stats.data[mt.stats.end].timeStamp * 1000));
			if (mt.stats.start >= mt.stats.end - 1) {
				console.log("start oops");
			}

			mt.stats.data.push(new Stats(data.stats));
		});
	}

	mt.stats.load = function (start, end, callback) {
		// Got enough data cached?
		if (mt.stats.data[0].time > start) {
			$.getJSON(mt.settings.url + "/" + start / 1000 + "-" + end / 1000, function (data) {
				var t = [];
				var end = data.statsList.stats.length - 1;

				// Remove any duplicates from end. API does not always return exact range requested.
				while (data.statsList.stats[end].timeStamp >= mt.stats.data[0].timeStamp && --end >= 0);

				for (var i = 0; i <= end; i++) {
					t.push(new Stats(data.statsList.stats[i]));
				}

				mt.stats.data = t.concat(mt.stats.data);
				mt.stats.start = 1;
				updateGraphs();
				callback();
			});
		} else {
			mt.stats.start = 0;
			// Find new start point for range.
			while (mt.stats.data[mt.stats.start].time < start && mt.stats.start++ < mt.stats.end);
			updateGraphs();
			callback();
		}
	};

	function updateGraphs() {
		for (var i = 0, len = mt.stats.functions.length; i < len; i++) {
			mt.stats.functions[i].f.apply(mt.stats.functions[i].t);
		}
	}
});
