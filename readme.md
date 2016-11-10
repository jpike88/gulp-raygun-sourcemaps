# gulp-raygun-sourcemaps

Uploads source maps and source files from gulp to Raygun.

#### To install

	npm install gulp-raygun-sourcemaps --save-dev

#### Using

	.pipe(raygunUpload.upload({
	   app: '' // Your app id,
	   key: '' // Your external access token (https://app.raygun.io/user),
	   root: __dirname // This probably doesn't need changing,
	   minified: 'dist' // The directory that has your minified JS and .map files in it,
	   src: 'src/' // Where your unminified source lives,
	   url: 'http://localhost:8000/' // The URL of your site
	}))


#### Complete gulpfile.js sample

	var gulp = require('gulp');
	
	var uglify = require('gulp-uglify');
	var sourcemaps = require('gulp-sourcemaps');
	var raygunUpload = require('gulp-raygun-sourcemaps');
	
	gulp.task('default', function() {
		gulp.src('src/*.js')
			.pipe(sourcemaps.init())
			.pipe(uglify())
			.pipe(sourcemaps.write('.', {
				sourceRoot: '/src/'
			}))
			.pipe(gulp.dest('dist'))
			.pipe(raygunUpload.upload({
				app: '123456',
				key: '12345678912345678923456789',
				root: __dirname,
				minified: 'dist',
				src: 'src/',
				recursive: true,
				url: 'http://localhost:8000/'
			}));
	});
