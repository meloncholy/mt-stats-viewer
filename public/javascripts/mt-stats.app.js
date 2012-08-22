/*global _: true, Backbone: true, d3: true, mt: true */

$(function () {
	"use strict";

	mt.AppView = Backbone.View.extend({
		el: $(document),
		graphs: undefined,
		$rangeVal: $("#graph-range-val"),
		rangeTracker: undefined,
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

				// .fadeIn(250, function () {
				// 	if (that.rangeTracker) {
				// 		clearTimeout(that.rangeTracker);
				// 	}
				// 	that.rangeTracker = setTimeout(function () {
				// 		$(".graph-overlay").fadeIn(250);
				// 		mt.stats.load(mt.stats.data[mt.stats.end].time - ms, mt.stats.data[0].time, that._refreshedGraphs);
				// 		if (that.rangeValTracker) clearTimeout(that.rangeValTracker);

				// 		that.rangeValTracker = setTimeout(function () {
				// 			// that.$rangeVal.delay(250).fadeOut(500);
				// 			that.$rangeVal.removeClass("active");
				// 		}, 2000);

				// 		that.$rangeVal.addClass("active");
				// 	}, 1000);
				// });

		// showRangeVal: function () {
		// 	// this.$rangeVal.stop(true).delay(250).fadeIn(250);
		// },

		// hideRangeVal: function () {
		// 	// if (!this.rangeValTracker) this.$rangeVal.delay(500).fadeOut(500);
		// }
