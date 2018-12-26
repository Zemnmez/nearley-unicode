const jsesc = require('jsesc');
const base = 'unicode-9.0.0';
const unicode = require(base);
const util = require('util');
const fs = require('fs');

let symbols = Object.keys(unicode).map(property =>
	unicode[property].map(value => {
		let pkg = require([base, property, value].join("/") + "/symbols.js");

		let string = [...pkg].map(
			symbol => jsesc(symbol, {
				quotes: 'double',
				wrap: true
			} )
		).join(" | ");

		return {path: [base,property,value], content:`unicode_${property}_${value} -> ${string}`}
	})
)

const [mkdir, writeFile] = [fs.mkdir, fs.writeFile].map(v => util.promisify(v));

let promise = new Promise((resolve) => resolve())
		.catch((err) => { if(err) throw err });

let hexToUnicodeEscape = (str) => str.replace(
	/\\x([A-Fa-f0-9]{2})/g,
	(_, hex) => `\\u00${hex}`
);


[].concat(...symbols).forEach(({path: [base, property, value], content}) => {
	promise.then(mkdir("./"+[base, property].join("/"), {recursive: true }))
		.then(writeFile("./"+ [base, property, value].join("/") + ".ne", hexToUnicodeEscape(content) + "\n"))
})
