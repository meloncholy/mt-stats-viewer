/*!
* (mt) Stats Viewer
*
* Visualise your MediaTemple stats with some gorgeous D3 graphs.
*
* @package mt-stats
* @subpackage ?
*
* Meh. Load stuff I guess.
*
* Copyright (c) 2012 Andrew Weeks http://meloncholy.com
* Licensed under the MIT licence. See http://meloncholy.com/licence
* Version 0.0.1
*/

/*global _: true, Backbone: true, d3: true */

var mt = {};

$(function () {
	"use strict";

	// Must wait until doc has loaded or D3 is unhappy.
	$(window).load(function () { mt.app = new mt.AppView(); });
});
