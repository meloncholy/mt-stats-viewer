/*global _: true, Backbone: true, d3: true, mt: true, Store: true */

$(function () {
	"use strict";

	mt.Graphs = Backbone.Collection.extend({
		model: mt.Graph,
		localStorage: new Store("mt-stats"),

		add: function (models, options) {
			// options.parse should be true when this is called from a fetch; only save if new and has no id yet.
			// http://documentcloud.github.com/backbone/#Collection-parse
			if (options && !options.parse && !Array.isArray(models)) models.save(undefined, { silent: true });
			return Backbone.Collection.prototype.add.call(this, models, options);
		},

		comparator: function(graph) {
			return graph.get("order");
		},

		nextOrder: function() {
			return this.length ? this.last().get("order") + 1 : 0;
		}
	});


	mt.GraphsView = Backbone.View.extend({
		initialize: function () {
			var that = this;
			// jQuery doesn't like me passing a different context.
			this.$el.on("sortstop", function () { that.sortstop(); });
			this.collection.on("add", this._add, this);
			this.collection.on("reset", this._reset, this);
		},

		new: function () {
			return this.collection.create({ order: this.collection.nextOrder(), silent: true });
		},

		_add: function (model, options) {
			var el;

			this.$el.append(el = (new mt.GraphView({ model: model })).render().el);
			el.id = model.get("id");
		},

		_reset: function () {
			this.collection.forEach(this._add, this);
		},

		fetch: function () {
			this.collection.fetch();
		},

		sortstop: function () {
			for (var i = 0, len = this.$el.children().length; i < len; i++) {
				this.collection.get(this.el.childNodes[i].id).set("order", i);
			}
		}
	});
});
