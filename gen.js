const jsesc = require('jsesc');
const util = require('util');
const fs = require('fs');

const [mkdir, writeFile] = [fs.mkdir, fs.writeFile].map(v => util.promisify(v));

let promise = new Promise((resolve) => resolve())
		.catch((err) => { if(err) throw err });


let hexToUnicodeEscape = (str) => str.replace(
	/\\x([A-Fa-f0-9]{2})/g,
	(_, hex) => `\\u00${hex}`
);

let gen = (version) => {
	let code = require(version);

	Object.keys(code).forEach(property => {
			code[property].forEach(value => {
			let pkg;
			try {
				pkg = require([version, property, value].join("/") + "/symbols.js");
			} catch (e) {
				return console.log(e);
			}

			let string = [...pkg].map(
				symbol => jsesc(symbol, {
					quotes: 'double',
					wrap: true
				})
			).join(" | ");


			let content = `${[version, property, value].join("_").toLowerCase().replace(/\./g, "-").replace(/-/g, "_")} -> ${string} {% id %}`

			promise.then(mkdir(__dirname + "/"+[version, property].join("/"), {recursive: true }))
				.then(writeFile( __dirname + "/"+ [version, property, value].join("/") + ".ne", hexToUnicodeEscape(content) + "\n"))
			})
	});
}


["unicode-11.0.0", "unicode-9.0.0"].forEach(version => gen(version))

