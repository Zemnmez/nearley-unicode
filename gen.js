const util = require('util');
const fs = require('fs');

const [mkdir, writeFile] = [fs.mkdir, fs.writeFile].map(v => util.promisify(v));

let promise = new Promise((resolve) => resolve())
		.catch((err) => { if(err) throw err });


let hexToUnicodeEscape = (str) => str.replace(
	/\\x([A-Fa-f0-9]{2})/g,
	(_, hex) => `\\u00${hex}`
);

// make a very poor attempt at quoting any values outside a [] block
let quoteOutsideGroup = (str) => {
	// quote all literal strings
	str = str.replace(
		/(?:\\u[A-Fa-f0-9]{4})+/g,
		(unicodeLiteral) => `"${unicodeLiteral}"`
	);

	// find all bracketed literals
	str = str.replace(
		/\[[^\]]*?\]/g,
		// and remove any quotes. put some space around them just to be nice
		(group) => " " + group.replace(/"/g, "") + " "
	)

	// also put some place around choice thingys
	str = str.replace(
		/\|/g,
		" | "
	)

	return str;
}

let gen = (version) => {
	let code = require(version);

	Object.keys(code).forEach(property => {
			code[property].forEach(value => {
			let pkg;
			try {
				pkg = require([version, property, value].join("/") + "/regex.js");
			} catch (e) {
				return console.log(e);
			}

			// we just hope and pray there aren't any advanced regex things in there
			let content = `${[version, property, value].join("_").toLowerCase().replace(/\./g, "-").replace(/-/g, "_")} -> ${pkg.source} {% id %}`;

			[hexToUnicodeEscape, quoteOutsideGroup].forEach(f => content = f(content));

			promise.then(mkdir(__dirname + "/"+[version, property].join("/"), {recursive: true }))
				.then(writeFile( __dirname + "/"+ [version, property, value].join("/") + ".ne", content + "\n"))
			})
	});
}


["unicode-11.0.0", "unicode-9.0.0"].forEach(version => gen(version))

