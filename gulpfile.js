/*
 * Website Name
 * 
 * @description     Gulp file for minification and deployment
 * @file            gulpfile.js
 * @author          Joanna Ong
 * @required        gulpconfig.json
 * 
 * @usage
 *  -- local development
 *    ``` gulp ```
 *
 *  -- build to env
 *     @params dev, stage, prod
 *    ``` gulp build --env dev ```
 *
 */

var gulp        = require('gulp'),
    args        = require('yargs').argv,
    jade        = require('gulp-jade'),
    styl        = require('gulp-stylus'),
    gutil       = require('gulp-util'),
    watch       = require('gulp-watch'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    runSequence = require('run-sequence'),
    sourcemaps  = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    del         = require('del'),
    reload      = browserSync.reload,
    jsdoc       = require("gulp-jsdoc"),
    ngAnnotate  = require('gulp-ng-annotate'),
    autoprefixer = require('gulp-autoprefixer')
    browserify = require('gulp-browserify');

// paths
var path = {
  asset: {
    dest: "/asset/",
    src: ["./src/asset/**"]
  },
  styl: {
    dest: "/css/",
    main: './src/styl/app.styl',
    watch: ['./src/styl/**/*.styl']
  },
  js: {
    dest: "/js/",
    main: "./src/js/App.js",
    watch: ['./src/js/*.js', './src/asset/*.json'],
    lib: {
      src: ["src/js/lib/*.js"],
      name: "lib.min.js"
    }
  },
  jade: {
    src: ["src/jade/*.jade", "!src/jade/template.jade"],
    dest: "",
    watch: ['./src/jade/**/*.jade']
  }
}

var config = {
  "local": {
    "dest": "dist/local/",
    "env": {
      "host": "http://localhost:3000/",
      "api": "",
      "GA": ""
    }
  },
  "dev": {
    "dest": "dist/dev/",
    "env": {
      "host": "",
      "api": "",
      "GA": ""
    }
  },
  "test": {
    "dest": "dist/test/",
    "env": {
      "host": "",
      "api": "",
      "GA": ""
    }
  },
  "prod": {
    "dest": "dist/prod/",
    "env": {
      "host": "",
      "api": "",
      "GA": ""
    }
  }
}

// default args, use local if no environment is speified
args.env = args.env ? args.env : 'local';

// more vars
var isDropConsole = args.env == "local" || args.env == "dev" ? false : true;

// tasks
gulp.task('copy', function() {
  // copying over asset files
  gutil.log("Copying asset for", "'" + gutil.colors.cyan(config[args.env].dest) + "'", "environment.");
  gulp.src(path.asset.src)
      .pipe(gulp.dest(config[args.env].dest + path.asset.dest));
  
  // copying over javascript library files and uglifying 
  gutil.log("Copying JavaScript libraries for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.js.lib.src)
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(concat(path.js.lib.name))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config[args.env].dest + path.js.dest));
});

gulp.task("compileJade", function() {
  gutil.log("Compiling HTML for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.jade.src)
      .pipe(jade({
        locals: {
          env: config[args.env].env
        }
      }))
      .on('error', gutil.log)
      .on('error', gutil.beep)
      .pipe(gulp.dest(config[args.env].dest))
      .pipe(reload({stream:true}));
});

gulp.task('compileStylus', function() {
  gutil.log("Compiling CSS for", gutil.colors.cyan(config[args.env].dest), "environment. On ");
  gulp.src(path.styl.main)
      .pipe(styl({
        container:'gulp-styl-'
      }))
      .pipe(autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
      .on('error', gutil.log)
      .on('error', gutil.beep)
      .pipe(gulp.dest(config[args.env].dest + path.styl.dest))
      .pipe(reload({stream:true}));
});

gulp.task('compileJSBrowserify', function() {
  gutil.log("Compiling JavaScript for", gutil.colors.cyan(config[args.env].dest), "environment.");
  gulp.src(path.js.main, {read: false})
      .pipe(browserify({
        insertGlobals: true,
        debug: true
      }))
      .on('error', gutil.log)
      .on('error', gutil.beep)
      .pipe(gulp.dest(config[args.env].dest + path.js.dest));
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: config['local'].dest
    }
  });
});

gulp.task('clean', function(cb) {
  del([config[args.env].dest+"/**"], cb);
});

gulp.task('watch',function(){
  gulp.watch(path.jade.watch, ['compileJade']);
  gulp.watch(path.styl.watch, ['compileStylus']);
  gulp.watch(path.js.watch, ['compileJSBrowserify']);
  gulp.watch(path.asset.watch, ['copy']);
});

// LOCAL DEV
gulp.task('default', function() {
  runSequence("build", "browser-sync", "watch");
});

// BUILD TO ENV
gulp.task('build', function(){
  runSequence(
    'clean',
    'copy',
    'compileJade',
    'compileStylus',
    'compileJSBrowserify'
  );
});