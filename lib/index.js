'use strict';
var PLUGIN_NAME = 'gulp-raygunupload';

var path = require('path');
var request = require('request');

var through = require('through2');
var fs = require('fs');
var async = require('async');
var gutil = require('gulp-util');
var urljoin = require('url-join');

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

    if (!options.url) {
        throw "RaygunUploader: options.url is required";
    }

    if (!options.root) {
        throw "RaygunUploader: options.root is required";
    }

    function doUpload(chunk, enc, finished) {
        gutil.log("RaygunUploader: Starting upload to Raygun...");

        async.waterfall(
            [
                // Get the files to upload
                function (callback) {
                    getFiles(options.minified, callback)
                },

                // Upload the files
                function (files, callback) {
                    async.eachSeries(
                        files,
                        function (item, cb) {

                            gutil.log("RaygunUploader: Uploading", urljoin(options.root, item));

                            // Tidy up Windows paths
                            while (item.indexOf('\\') !== -1) {
                                item = item.replace('\\', '/');
                            }

                            var formData = {
                                url: urljoin(options.url, item),
                                file: fs.createReadStream(urljoin(options.root, item))
                            };

                            request.post({
                                url: 'https://app.raygun.io/upload/jssymbols/' + options.app + '?authToken=' + options.key,
                                formData: formData
                            }, function (err, httpResponse, body) {
                                gutil.log("RaygunUploader:", body);
                                cb();
                            });
                        },
                        function (err) {
                            if (err) {
                                gutil.log("RaygunUploader: Error uploading");
                                gutil.log("RaygunUploader:", err);
                            }

                            callback();
                        }
                    );
                }
            ],
            function (err) {
                gutil.log("RaygunUploader: Done");
                finished();
            }
        );
    }

    function getFiles(directory, callback) {
        var files = fs.readdirSync(path.join(options.root, directory));
        var filesToUpload = [];

        async.eachSeries(
            files,
            function (item, cb) {
                if (fs.lstatSync(path.join(options.root, directory, item)).isFile() && (item.indexOf('js.map') != -1) ) {
                    filesToUpload.push(path.join(directory, item));
                }

                cb();
            },
            function (err) {
                callback(err, filesToUpload);
            }
        );
    }

    return through.obj(doUpload);
};
