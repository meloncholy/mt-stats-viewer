/*global _: true, Backbone: true, d3: true, mt: true */

$(function () {
	"use strict";

	mt.Graph = Backbone.Model.extend({

		defaults: function () {
			return {
				width: 940,
				height: 150,
				title: undefined,
				property: undefined,
				ticks: 4,
				colour: "#0072c6",
				log: false,
				minZero: false,
				logZero: 0.00001,
				order: 0
			};
		},

		initialize: function () {
			if (!this.has("colourRgba")) {
				this.set({ colourRgba: this.get("colour").replace(/#(\w{2})(\w{2})(\w{2})/, function () {
					return "rgba(" + Array.prototype.slice.call(arguments, 1, 4).map(function (col) { return parseInt(col, 16); }) + ",%)";
				}) }, { silent: true });
			}
		},

		change: function (attributes) {
			// Backbone.localStorage triggers this when adding id on save, so discount those.
			if (attributes && attributes.changes && Object.keys(attributes.changes).length > (attributes.changes.id ? 1 : 0)) this.save();
		}
	});


	mt.GraphView = Backbone.View.extend({
		tagName: "li",
		className: "graph-container",
		template: _.template($("#graph-template").html()),

		tension: 0.85,
		axisHeight: 20,
		graphPadding: 5,
		clippedPoints: 3,
		dotR: 5,
		transitionDuration: undefined,
		shortTransition: 500,
		graphHeight: undefined,
		extraWidth: 0,
		yDomain: undefined,
		logZero: undefined,
		dataStart: 0,
		dataEnd: 0,
		infoTracker: undefined,

		svg: undefined,
		g: undefined,
		slider: undefined,
		line: undefined,
		lineEl: undefined,
		area: undefined,
		areaEl: undefined,
		x: undefined,
		y: undefined,
		dot: undefined,
		xAxis: undefined,
		yAxis: undefined,
		yMin: undefined,
		yMax: undefined,

		events: {
			"click .graph-metric": "metric",
			"click .graph-log": "log",
			"click .graph-min-zero": "minZero",
			"click .graph-delete": "delete",
			"mouseenter .graph-frame": "dotEnter",
			"mouseleave .graph-frame": "dotLeave",
			"click .graph-metric-toggle": "metricToggle"
		},

		initialize: function (model) {
			var $metricEl;
			// Can't do above as will be shared between instances.
			this.yDomain = [0, 0];
			this.logZero = this.model.get("logZero");
			this.graphHeight = this.model.get("height") - this.axisHeight - this.graphPadding * 2;
			this.model.bind("destroy", this.remove, this);
			mt.stats.register(this.tick, this);
			this.transitionDuration = mt.settings.interval;

			if (this.model.get("property") === undefined) {
				$metricEl = $(this.template()).find("li:first a").eq(0);
				this.model.set("property", $metricEl.data("key"));
				this.model.set("title", $metricEl.html());
			}
		},

		metric: function (event) {
			var $target = $(event.target);
			var title = $target.html();
			
			this.model.set("title", title);
			this.$el.find(".graph-title").html(title);
			this.model.set("property", $target.data("key"));
			// Returning false stops Bootstrap doing this.
			$target.parents(".btn-group, .graph-container").removeClass("open");
			this.tick();
			return false;
		},

		metricToggle: function (event) {
			var $target = $(event.target);

			// Frustratingly, this fires before Bootstrap adds .open to .btn-group
			setTimeout(function () {
				if ($target.parent().hasClass("open")) {
					$target.parents(".graph-container").addClass("open");
				} else {
					$target.parents(".graph-container").removeClass("open");
				}
			});
		},

		log: function (event) {
			return this._radioButtons(event.target, "log", "minZero");
		},

		minZero: function (event) {
			return this._radioButtons(event.target, "minZero", "log");
		},

		_radioButtons: function (target, me, other) {
			var myVal = !this.model.get(me);
			var otherVal = this.model.get(other);
			var otherClass = other.replace(/[A-Z]/g, function (match) { return "-" + match.toLowerCase(); });

			this.model.set(me, myVal);

			$(target).toggleClass("active");

			if (myVal && otherVal) {
				this.model.set(other, false);
				this.$el.find(".graph-" + otherClass).removeClass("active");
			}

			this._setYAxis();
			this.tick();
			return false;
		},

		delete: function () {
			mt.stats.unregister(this.tick, this);
			this.model.destroy();
			this.$el.remove();
			return false;
		},

		dotEnter: function () {
			$(".graph-frame").on("mousemove", null, this, this.dotMove);
			this.dot.style("display", "inline");
		},

		dotLeave: function () {
			$(".graph-frame").off("mousemove");
			this.dot.style("display", "none");
			if (this.infoTracker) clearTimeout(this.infoTracker);
			this.$infoEl.fadeOut(250).visible = false;
		},

		dotMove: function (event) {
			var that = event.data;
			var offsetLeft = event.pageX - that.$el.offset().left; // that.dotR / 2
			var idx;
			var start;
			var end;

			// First stab at nearest point to cursor. Can be wildly off if timestamps are irregular.
			idx = Math.round((mt.stats.end - mt.stats.start) * offsetLeft / that.model.get("width")) + mt.stats.start;

			if (that.graphX(mt.stats.data[idx]) < offsetLeft) {
				start = Math.max(mt.stats.start, idx - 1);
				end = mt.stats.end;
			} else {
				start = mt.stats.start;
				end = Math.min(idx + 1, mt.stats.end);
			}

			while (start < end - 1) {
				idx = Math.round((start + end) / 2);

				if (that.graphX(mt.stats.data[idx]) < offsetLeft) {
					start = idx;
				} else {
					end = idx;
				}
			}

			idx = (offsetLeft - that.graphX(mt.stats.data[start]) < that.graphX(mt.stats.data[end]) - offsetLeft) ? start : end;

			that.dot
				.attr("cx", that.graphX(mt.stats.data[idx]))
				.attr("cy", that.graphY(mt.stats.data[idx]));

			if (that.infoTracker) clearTimeout(that.infoTracker);
			that.infoTracker = setTimeout(function () { that.showInfo(mt.stats.data[idx]); }, 500);
		},

		showInfo: function (d) {
			var left;
			var top;
			var dotX = Math.round(this.dot.attr("cx"));
			var dotY = Math.round(this.dot.attr("cy"));
			var date = new Date(d.time);

			this.$infoEl.children(".property").html(
				d[this.model.get("property")] + " " + this.model.get("title")
			).end().children(".time").html(["getHours", "getMinutes", "getSeconds"].map(function (f) { return "00".slice(date[f]().toString().length) + date[f](); }).join(":") +
				" " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()
			);

			left = dotX < this.$infoEl.width() / 2 ? 5 : dotX > this.model.get("width") - this.$infoEl.width() / 2 ? dotX - this.$infoEl.width() - 5: dotX - this.$infoEl.width() / 2;
			top = dotY < this.model.get("height") / 2 ? dotY + 15 : dotY - this.$infoEl.height() - 15;

			if (this.$infoEl.visible) {
				this.$infoEl.animate({ left: left, top: top }, 100);
			} else {
				this.$infoEl.css({ left: left, top: top }).fadeIn(250);
			}

			this.$infoEl.visible = true;
		},

		render: function () {
			this.$el.html(this.template());
			this.$el.find(".graph-title").html(this.model.get("title"));
			if (this.model.get("log")) this.$el.find(".graph-log").addClass("active");
			if (this.model.get("minZero")) this.$el.find(".graph-min-zero").addClass("active");
			this.$infoEl = this.$el.find(".graph-info");
			this.$infoEl.visible = false;
			if (mt.stats.data.length) this.tick();
			return this;
		},

		_renderGraph: function () {
			var that = this;
			var width = this.model.get("width");
			var colour = this.model.get("colour");
			var colourA = function (d) { return that.model.get("colourRgba").replace("%", 0.3); };
			var graphX = function (d) { return that.graphX(d); };
			var graphY = function (d) { return that.graphY(d); };

			this.dataStart = mt.stats.start;
			this.dataEnd = mt.stats.end;

			this.x = d3.time
				.scale()
				.range([0, width + this.extraWidth]);

			this.x.axis = d3.svg.axis()
				.scale(this.x)
				.tickFormat(d3.time.format("%H:%M"))
				.orient("bottom");
			
			this._setYAxis();

			this.svg = d3
				.select(this.el)
				.select(".graph-frame")
				.append("svg:svg")
				.attr("class", "graph");

			this.g = this.svg
				.selectAll("g")
				.data([mt.stats.data])
				.enter()
			.append("svg:g")
				.attr("transform", "translate(0, " + this.graphPadding + ")")
				.attr("clip-path", "url(#clip)");

			// Transform to stop lines clipping
			this.slider = this.g.append("svg:g");

			// d3 line
			this.line = d3.svg.line()
				.interpolate("cardinal")
				.tension(this.tension)
				.x(graphX)
				.y(graphY);

			// d3 area
			this.area = d3.svg.area()
				.interpolate("cardinal")
				.tension(this.tension)
				.x(graphX)
				.y0(this.graphHeight)
				.y1(graphY);

			this.areaStart = d3.svg.area()
				.interpolate("cardinal")
				.tension(this.tension)
				.x(graphX)
				.y0(graphY)
				.y1(graphY);

			// SVG els
			this.areaEl = this.slider.append("svg:path")
				.attr("class", "area")
				.style("fill", colourA);

			this.lineEl = this.slider.append("svg:path")
				.attr("class", "line")
				.style("stroke", colour)
				.attr("d", function (d) { return that.line(d); });

			// Dot
			this.dot = this.slider.append("svg:circle")
					.attr("r", this.dotR)
					.attr("class", "dot")
					.style("stroke", "#fff")
					.style("fill", colour);

			this.yAxis = this.g.append("g")
				.attr("class", "y axis")
				.attr("transform", "translate(0," + this.graphPadding + ")")
				.call(this.y.axis);

			this.xAxis = this.g.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + (this.graphHeight + this.graphPadding) + ")")
				.call(this.x.axis);

			this.yMin = this.g.append("text")
				.attr("class", "graph-val")
				.attr("x", width)
				.attr("y", this.graphHeight + this.graphPadding - 2);

			this.yMax = this.g.append("text")
				.attr("class", "graph-val")
				.attr("x", width)
				.attr("y", 10);

			// Limit viewport
			this.svg.append("defs").append("clipPath")
				.attr("id", "clip")
			.append("rect")
				.attr("width", width)
				.attr("height", this.model.get("height"));
		},

		tick: function () {
			var that = this;
			var property = this.model.get("property");
			var noGraph = this.svg === undefined;
			var dYAxis = false;
			var yDomain;
			var slideTransition;
			// Show seconds if < 5 mins
			var tickFormat = d3.time.format(mt.stats.data[mt.stats.end].time - mt.stats.data[mt.stats.start].time < 300000 ? "%X" : "%H:%M");
			var graphX = function (d) { return that.graphX(d); };
			var graphY = function (d) { return that.graphY(d); };

			if (noGraph) this._renderGraph();
			this.x.domain([mt.stats.data[mt.stats.start].time, mt.stats.data[mt.stats.end].time]);
			yDomain = this._getYDomain();

			slideTransition = function (transition) {
				transition
					.duration(that.transitionDuration)
					.ease("linear")
					.attr("transform", "translate(" + that.x(mt.stats.data[mt.stats.start - 1].time) + "," + that.graphPadding + ")");
			};

			// Reset axes to match new domains.
			if (noGraph) {
				this._setExtraWidth();
				this.svg.style("width", this.model.get("width") + this.extraWidth);
				this.x.range([0, this.model.get("width") + this.extraWidth]);
				this.x.axis.tickFormat(tickFormat);
				this.xAxis.call(this.x.axis);
				this.yAxis.call(this.y.axis);
			}

			// Adjust y-axis
			if (yDomain[0] !== this.yDomain[0] || yDomain[1] !== this.yDomain[1]) {
				dYAxis = true;
				this.yDomain = yDomain;
				this.y.domain(this.yDomain);

				this.yMax.text(yDomain[0].toPrecision(yDomain[0] < 1 ? 3 : 4));
				this.yMin.text(yDomain[1].toPrecision(yDomain[1] < 1 ? 3 : 4));

				this.yAxis.transition()
					.duration(this.shortTransition)
					.ease("linear")
					.call(this.y.axis);
			}

			// tick called from timed and user initiated triggers, so start time may not have changed.
			if (this.dataStart < mt.stats.start) this.dataStart++;
			if (this.dataEnd < mt.stats.end) this.dataEnd++;

			// Redraw line
			if (noGraph) {
				this._fancyLine();
			} else if (this.dataStart !== mt.stats.start || this.dataEnd !== mt.stats.end) {
				// Changed x range
				this._setExtraWidth();
				[this.g, this.lineEl, this.areaEl].forEach(function (el) { el.data([mt.stats.data]); });
				this._fancyLine();
				this.dataStart = mt.stats.start;
				this.dataEnd = mt.stats.end;
				this.x.axis.tickFormat(tickFormat);
				this.xAxis.call(this.x.axis);
			} else if (dYAxis) {
				// Adjust line for new scale
				this.areaEl
					.transition()
						.duration(this.shortTransition)
						.ease("linear")
						.attr("d", this.area)
					.attr("transform", null);

				this.lineEl
					.transition()
						.duration(this.shortTransition)
						.ease("linear")
						.attr("d", this.line)
					.attr("transform", null);
			} else {
				// No change; just add new point to end
				this.areaEl
					.attr("d", this.area)
					.attr("transform", null);

				this.lineEl
					.attr("d", this.line)
					.attr("transform", null);
			}

			// Reset slider to start as just lost data from front of graph.
			this.slider
				.attr("transform", "translate(0," + that.graphPadding + ")")
				.transition()
					.call(slideTransition);

			// Slide x-axis left
			this.xAxis.transition()
				.duration(this.transitionDuration)
				.ease("linear")
				.call(this.x.axis);
		},

		_getYDomain: function () {
			var that = this;
			var property = this.model.get("property");
			var log = this.model.get("log");
			var end = Math.max(mt.stats.end - 2, mt.stats.start - 1);
			var getProp = function (d, idx) { return idx < mt.stats.start - 1 || idx > end ? undefined: Math.max(log ? that.logZero : -Infinity, d[property]); };
			// Assume all are +ve when non-log
			var yMin = this.model.get("minZero") && !log ? 0 : d3.min(mt.stats.data, getProp);

			return [Math.max(d3.max(mt.stats.data, getProp), yMin + 0.1), yMin];
		},

		_setYAxis: function () {
			var log = this.model.get("log");

			if (log) {
				this.y = d3.scale.log().range([0, this.graphHeight]).clamp(true);
			} else {
				this.y = d3.scale.linear().range([0, this.graphHeight]).clamp(true);
			}
			
			this.y.axis = d3.svg.axis().scale(this.y).orient("right");
			this.y.axis.ticks(this.model.get("ticks"));
			this.yDomain = [0, 0];
		},

		_setExtraWidth: function () {
			// Have 3 control points off screen to prevent wiggle when adding. http://bost.ocks.org/mike/path/
			this.extraWidth = Math.round(this.x(mt.stats.data[Math.min(mt.stats.start + this.clippedPoints, mt.stats.end)].time));
		},

		_fancyLine: function () {
			var that = this;
			var k = mt.stats.start;
			var step = Math.max(Math.round((mt.stats.end - mt.stats.start) / 15), 1);

			d3.timer(function () {
				if ((k += step) > mt.stats.end) {
					// that.areaEl.transition().duration(0);
					that.lineEl
						.attr("d", that.line)
						.attr("transform", null);

					that.areaEl
						.attr("d", that.areaStart)
						.attr("transform", null)
						.transition()
							.duration(that.shortTransition)
							.ease("linear")
							.style("opacity", 1)
							.attr("d", that.area);

					return true;
				}

				that.lineEl
					.attr("d", function (d) { return that.line(mt.stats.data.slice(mt.stats.start, k)); })
					.attr("transform", null);
			});
		},

		graphX: function (d) {
			return this.x(d.time);
		},

		graphY: function (d) {
			return this.y(Math.max(this.model.get("log") ? this.logZero : -Infinity, d[this.model.get("property")]));
		}
	});
});
