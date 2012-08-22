var less = require("less");
var fs = require("fs");
var t = fs.readFileSync("./public/stylesheets/custom.less", "utf8");

less.render(t, function (e, css) {
	if (e) return console.error(e);
	fs.writeFileSync("./public/stylesheets/custom.css", css, "utf8");
	console.log("done");
});
