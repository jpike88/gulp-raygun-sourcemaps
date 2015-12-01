'use strict';
var PLUGIN_NAME = 'gulp-raygunupload';

var path = require('path');
var request = require('request');

var through = require('through2');
var fs = require('fs');
var async = require('async');

module.exports.upload = function upload(options) {
	if (!options) {
		throw "RaygunUploader: options are required";
	}

	if (!options.app) {
		throw "RaygunUploader: options.app is required";
	}

	if (!options.key) {
		throw "RaygunUploader: options.key is required";
	}

	if (!options.minified) {
		throw "RaygunUploader: options.minified is required";
	}

	if (!options.src) {
		throw "RaygunUploader: options.src is required";
	}

	if (!options.url) {
		throw "RaygunUploader: options.url is required";
	}

	if (!options.root) {
		throw "RaygunUploader: options.root is required";
	}

	function doUpload() {
		console.log("RaygunUploader: Starting upload to Raygun...");

		async.waterfall(
			[
				// Get the files to upload
				function(callback) {
					getFiles(options.minified, callback)
				},
				// Get the src files
				function(files, callback) {
					getFiles(options.src, function(err, newFiles) {
						files = files.concat(newFiles);
						callback(err, files)
					});
				},
				// Upload the files
				function(files, callback) {
					async.eachSeries(
						files,
						function(item, cb) {
							console.log("RaygunUploader: Uploading", path.join(options.root, item));

							var formData = {
								url: options.url + item,
								file: fs.createReadStream(path.join(options.root, item))
							};

							request.post({
								url: 'https://app.raygun.io/upload/jssymbols/' + options.app + '?authToken=' + options.key,
								formData: formData
							}, function(err, httpResponse, body) {
								console.log("RaygunUploader:", body);
								cb();
							});
						},
						function(err) {
							if (err) {
								console.log("RaygunUploader: Error uploading");
								console.log("RaygunUploader:", err);
							}

							callback();
						}
					);
				}
			],
			function(err) {
				console.log("RaygunUploader: Done");
			}
		);
	};

	function getFiles(directory, callback) {
		var files = fs.readdirSync(path.join(options.root, directory));
		var filesToUpload = [];

		async.eachSeries(
			files,
			function(item, cb) {
				if (fs.lstatSync(path.join(options.root, directory, item)).isFile()) {
					filesToUpload.push(path.join(directory, item));
				}

				cb();
			},
			function(err) {
				callback(err, filesToUpload);
			}
		);
	};

	return through.obj(doUpload);
}