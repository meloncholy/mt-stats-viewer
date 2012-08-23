/*!
* (mt) Stats Viewer
*
* Visualise your MediaTemple stats with some gorgeous D3 graphs.
*
* @package mt-stats
* @subpackage app
*
* App container. Handles navbar.
*
* Copyright (c) 2012 Andrew Weeks http://meloncholy.com
* Licensed under the MIT licence. See http://meloncholy.com/licence
* Version 0.0.1
*/

/*global _: true, Backbone: true, d3: true, mt: true */

$(function () {
	"use strict";

	mt.AppView = Backbone.View.extend({
		el: $(document),
		graphs: undefined,
		$rangeVal: $("#graph-range-val"),
		rangeValTracker: undefined,

		events: {
			"click #new-graph": "newGraph",
			"slide #graph-range": "slide",
			"slidestop #graph-range": "slideStop"
		},

		initialize: function () {
			this.graphs = new mt.GraphsView({ collection: new mt.Graphs(), el: $("#graphs") });
			this.graphs.fetch();
			$("#graphs").sortable({ delay: 300, placeholder: "graph-placeholder", forcePlaceholderSize: true, containment: "parent", axis: "y" });
			$("#graph-range").slider({ value: mt.settings.graphRanges.indexOf(mt.settings.graphRange), min: 0, max: mt.settings.graphRanges.length - 1, step: 1 });
			this.$rangeVal.html(this._prettyRange(mt.settings.graphRange));
		},

		newGraph: function () {
			this.graphs.new();
			return false;
		},

		slide: function (event, ui) {
			var ms = +mt.settings.graphRanges[ui.value];

			this.$rangeVal.html(this._prettyRange(ms)).addClass("active");
		},

		slideStop: function (event, ui) {
			var that = this;
			var ms = +mt.settings.graphRanges[ui.value];

			$(".graph-overlay").addClass("active");
			mt.stats.load(mt.stats.data[mt.stats.end].time - ms, mt.stats.data[0].time, this._refreshedGraphs);
			mt.stats.save("graphRange", ms);
			if (this.rangeValTracker) clearTimeout(this.rangeValTracker);

			this.rangeValTracker = setTimeout(function () {
				that.$rangeVal.removeClass("active");
			}, 2000);
		},

		_prettyRange: function (ms) {
			var range = new Date(ms);
			var days = Math.floor(ms / 86400000);

			return days !== 0 ? days + "d" : "00".slice(range.getUTCHours().toString().length) + range.getUTCHours() + ":" + "00".slice(range.getUTCMinutes().toString().length) + range.getUTCMinutes();
		},

		_refreshedGraphs: function () {
			$(".graph-overlay").removeClass("active");
		}
	});
});
