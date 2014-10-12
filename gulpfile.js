var fs = require("fs");
var gulp = require('gulp');
var jade = require('gulp-jade');
var clean = require('gulp-clean');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var sass = require('gulp-ruby-sass');
var runSequence = require('run-sequence');
var open = require('gulp-open');
var watch = require('gulp-watch');
var tinypng = require('gulp-tinypng');
var awspublish = require('gulp-awspublish');
var config = JSON.parse(fs.readFileSync('./gulpconfig.json'));
var s3 = require('gulp-s3');
var args = require('yargs').argv;
var awspublish = require('gulp-awspublish');

// paths
var path = {
  asset: {
    dest: "/asset/",
    src: ["./src/asset/**"]
  },
  sass: {
    dest: "/css/",
    controller: "./src/sass/main.sass",
    watch: ['./src/sass/*.sass']
  },
  js: {
    dest: "/js/",
    controller: "./src/js/Controller.js",
    watch: ['./src/js/*.js', './src/asset/*.json'],
    lib: {
      src: ["src/js/lib/*.js"],
      name: "lib.min.js"
    }
  },
  jade: {
    src: ["src/jade/*.jade", "!src/jade/template.jade"],
    dest: "",
    watch: ['./src/jade/*.jade']
  },
  tinypng: {
    src: ['./src/asset/*.png'],
    dest: './src/asset/',
    key: 'W7NHTatmADKsasAP-Pfr32p1426-hoT5'
  }
}

// default args
args.env = args.env ? args.env : 'local';

// functions
var copyFiles = function() {
  gutil.log("Copying asset for", "'" + gutil.colors.cyan(config[args.env].dest) + "'", "environment.");
  gulp.src(path.asset.src)
  		.pipe(gulp.dest(config[args.env].dest + path.asset.dest));
  
  gutil.log("Copying JavaScript libraries for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.js.lib.src)
  		.pipe(uglify())
      .pipe(concat(path.js.lib.name))
  		.pipe(gulp.dest(config[args.env].dest + path.js.dest));
};

var compileHTML = function() {
  gutil.log("Compiling HTML for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.jade.src)
    .pipe(jade({
      locals: {
        env: config[args.env]
      }
    }))
    .on('error', gutil.log)
    .on('error', gutil.beep)
    .pipe(gulp.dest(config[args.env].dest));
};

var compileCSS = function() {
  gutil.log("Compiling CSS for", gutil.colors.cyan(config[args.env].dest), "environment. On ");
  gulp.src(path.sass.controller)
  		.pipe(sass({
        container:'gulp-sass-'
      }))
  		.on('error', gutil.log)
  		.on('error', gutil.beep)
  		.pipe(gulp.dest(config[args.env].dest + path.sass.dest));
};

var compileJSBrowserify = function() {
  gutil.log("Compiling JavaScript for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.js.controller, {read: false})
      .pipe(browserify({
        insertGlobals: true,
        debug: true
      }))
      .on('error', gutil.log)
      .on('error', gutil.beep)
      .pipe(gulp.dest(config[args.env].dest + path.js.dest));
};

var watchMe = function() {
	watch(path.jade.watch, function(file) {
    compileHTML();
    copyFiles();
  });
  watch(path.sass.watch, function(file) {
    compileCSS();
    copyFiles();
  });
  watch(path.js.watch, function(file) {
    compileJSBrowserify();
    copyFiles();
  });
}

// tiny png
gulp.task('tinypng', function () {
  gulp.src(path.tinypng.src)
      .pipe(tinypng(path.tinypng.key))
      .pipe(gulp.dest(path.tinypng.dest));
});

/*
 * 
 * LOCAL DEV
 * start developing by typing in ``` gulp ``` in your terminal
 *
 */ 
gulp.task('connect', function() {
  connect.server({
    root: 'deploy/local/',
    livereload: true,
    port: 9000
  });
  gulp.watch('deploy/local' + '**').on('change', function(file) {
    connect.reload();
  });
  var options = {
    url: "http://localhost:9000",
    app: "google-chrome"
  };
  gulp.src("deploy/local/index.html")
      .pipe(open("", options));
});
gulp.task('local', function() {
  compileHTML();
  compileCSS();
  compileJSBrowserify();
  copyFiles();
  watchMe();
});
gulp.task('default', function() {
  runSequence('connect', 'local');
});

/*
 * 
 * BUILD TO ENV
 * --env params: dev, stage, prod
 *
 * ``` gulp build --env dev ```
 *
 */ 
gulp.task('build', function(){
  compileHTML(config[args.env]);
  compileCSS(config[args.env]);
  compileJSBrowserify(config[args.env]);
  copyFiles(config[args.env]);
});
gulp.task('deploy', function(){
  return gulp.src(config[args.env].deployFolder)
             .pipe(s3(config[args.env].aws, { read: false }));
});