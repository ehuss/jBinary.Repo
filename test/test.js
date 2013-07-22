var hasNodeRequire = typeof require === 'function' && !require.isBrowser;

if (hasNodeRequire) {
	if (typeof JSHINT === 'undefined') {
		JSHINT = require('jshint').JSHINT;
	}

	if (typeof requirejs === 'undefined') {
		requirejs = require('requirejs');
	}
}

if (typeof JSHINT !== 'undefined') {
	asyncTest('JSHint', function () {
		var paths = {
			source: '../src/jBinary.Repo.js',
			options: '../src/.jshintrc'
		},
		contents = {};

		function onLoad(err, name, text) {
			if (err) {
				start();
				return ok(false, 'Error while loading ' + name + ': ' + err);
			}

			contents[name] = text;
			for (var name in paths) {
				if (!(name in contents)) {
					return;
				}
			}

			var options = JSON.parse(contents.options), globals = options.globals;
			delete options.globals;

			start();

			if (JSHINT(contents.source, options, globals)) {
				ok(true);
			} else {
				var errors = JSHINT.errors, skipLines = [], errorCount = errors.length;
				for (var i = 0, length = errors.length; i < length; i++) {
					var error = errors[i];
					if (error) {
						if (error.code === 'E001' && /\/\/\s*jshint:\s*skipline/.test(error.evidence)) {
							skipLines.push(error.line + 1);
							errorCount--;
							continue;
						}
						if (skipLines.indexOf(error.line) >= 0) {
							errorCount--;
							continue;
						}
						ok(false, 'Line ' + error.line + ', character ' + error.character + ': ' + error.reason);
						console.log(error);
					} else {
						errorCount--;
					}
				}
				if (!errorCount) {
					ok(true);
				}
			}
		}

		function load(name) {
			if (typeof XMLHttpRequest !== 'undefined') {
				var ajax = new XMLHttpRequest();
				ajax.onload = function () {
					(this.status === 0 || this.status === 200) ? onLoad(null, name, this.responseText) : onLoad(this.statusText, name);
				};
				ajax.open('GET', paths[name], true);
				ajax.send();
			} else {
				require('fs').readFile(paths[name], function (err, data) {
					onLoad(err, name, String(data));
				});
			}
		}

		for (var name in paths) {
			load(name);
		}
	});
}

requirejs.config({
	baseUrl: '..',
	paths: {
		'jBinary': '../jBinary/src/jBinary',
		'jDataView': '../jDataView/src/jDataView',
		'jBinary.Repo': 'src/jBinary.Repo'
	}
});

requirejs(['jBinary', 'jBinary.Repo'], function (jBinary, Repo) {

//-----------------------------------------------------------------

module('Loading from Repo');

asyncTest('List of names', function () {
	jBinary.Repo(['bmp', 'mp3'], function (BMP, MP3) {
		start();
		equal(this, jBinary.Repo);
		ok(BMP); equal(this.BMP, BMP);
		ok(MP3); equal(this.MP3, MP3);
	});
});

asyncTest('Single name', function () {
	jBinary.Repo('bmp', function (BMP) {
		start();
		equal(this, jBinary.Repo);
		ok(BMP); equal(this.BMP, BMP);
	});
});

asyncTest('Cached type', function () {
	jBinary.Repo('bmp', function (BMP) {
		jBinary.Repo('bmp', function (BMP2) {
			start();
			equal(BMP, BMP2);
		});
	});
});

//-----------------------------------------------------------------

module('File associations');

asyncTest('Loading list', function () {
	jBinary.Repo.getAssociations(function (assoc) {
		start();
		ok(assoc);
		ok(assoc.extensions);
		ok(assoc.mimeTypes);

		// check caching
		stop();
		jBinary.Repo.getAssociations(function (assoc2) {
			start();
			equal(assoc, assoc2);
		});
	});
});

asyncTest('By file extension', function () {
	jBinary.Repo.getAssociation({name: 'sample.mp3'}, function (typeSet) {
		start();
		ok(typeSet);
		equal(typeSet, jBinary.Repo.MP3);
	});
});

asyncTest('By mime-type', function () {
	jBinary.Repo.getAssociation({type: 'image/bmp'}, function (typeSet) {
		start();
		ok(typeSet);
		equal(typeSet, jBinary.Repo.BMP);
	});
});

//-----------------------------------------------------------------

module('Loading data');

asyncTest('load with given typeSet', function () {
	jBinary.load('123.tar', 'tar', function (err, binary) {
		start();
		ok(!err);
		equal(binary.view.byteLength, 512);
		equal(binary.typeSet.File, jBinary.Repo.TAR.File);
	});
});

asyncTest('load with auto-detection by file name extension', function () {
	jBinary.load('123.tar', function (err, binary) {
		start();
		ok(!err);
		equal(binary.view.byteLength, 512);
		equal(binary.typeSet.File, jBinary.Repo.TAR.File);
	});
});

asyncTest('load with auto-detection by mime-type', function () {
	jBinary.load('data:application/x-tar;base64,MTIzLnR4dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDA2NDQAMDAwMDc2NAAwMDAxMDQwADAwMDAwMDAwMDAwADEyMTY0MTY0NzUzADAxMzYyMwAgMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1c3RhciAgAFJSZXZlcnNlcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQWRtaW5pc3RyYXRvcnMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', function (err, binary) {
		start();
		ok(!err);
		equal(binary.view.byteLength, 512);
		equal(binary.typeSet.File, jBinary.Repo.TAR.File);
	});
});

});