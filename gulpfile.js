/*
 * Website Name
 *
 * @description     Gulp file for minification and deployment
 * @file            gulpfile.js
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
    autoprefixer = require('gulp-autoprefixer'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    fs = require('fs'),
    templateData = JSON.parse(fs.readFileSync('./src/data/data.json')),
    ftp = require('gulp-ftp');

// paths
var path = {
  asset: {
    dest: '/asset/',
    src: ['./src/asset/**']
  },
  styl: {
    dest: '/css/',
    main: './src/styl/app.styl',
    watch: ['./src/styl/**/*.styl']
  },
  js: {
    dest: '/js/',
    main: './src/js/App.js',
    watch: ['./src/js/*.js', './src/asset/*.json'],
    lib: {
      src: ['src/js/lib/*.js'],
      name: 'lib.min.js'
    }
  },
  jade: {
    src: ['src/jade/*.jade', '!src/jade/template.jade'],
    dest: '',
    watch: ['./src/jade/**/*.jade', 'src/data/*.json']
  }
}

var config = {
  dest: "dist",
  ftp: {
    host: "",
    remotePath: "",
    user: "",
    pass: "",
  }
}

// tasks
gulp.task('copy', function() {
  // copying over asset files
  gutil.log('Copying asset for', gutil.colors.cyan(config.dest), "environment.");
  gulp.src(path.asset.src)
      .pipe(gulp.dest(config.dest + path.asset.dest));

  // copying over javascript library files and uglifying
  gutil.log('Copying JavaScript libraries for', gutil.colors.cyan(config.dest), 'environment.');
  gulp.src(path.js.lib.src)
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(concat(path.js.lib.name))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.dest + path.js.dest));
});

gulp.task('compileJade', function() {
  gutil.log('Compiling HTML for', gutil.colors.cyan(config.dest), 'environment.');
  gulp.src(path.jade.src)
      .pipe(jade({
        locals: {
          data: templateData
        }
      }))
      .on('error', function () {
        gutil.beep()
      })
      .on('error', gutil.log)
      .pipe(gulp.dest(config.dest))
      .pipe(reload({stream:true}));
});

gulp.task('compileStylus', function() {
  gutil.log('Compiling CSS for', gutil.colors.cyan(config.dest), 'environment');
  gulp.src(path.styl.main)
      .pipe(styl({
        container:'gulp-styl-'
      }))
      .pipe(autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
      .on('error', function () {
        gutil.beep()
      })
      .on('error', gutil.log)
      .pipe(gulp.dest(config.dest + path.styl.dest))
      .pipe(reload({stream:true}));
});

gulp.task('compileJS', function() {
  gutil.log('Compiling JavaScript for', gutil.colors.cyan(config.dest + path.js.dest), 'environment.');
  return browserify(path.js.main, {debug: true, extensions: ['es6']})
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.dest + path.js.dest))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: config.dest
    }
  });
});

gulp.task('clean', function(cb) {
  del([config.dest+'/**'], cb);
});

gulp.task('ftp', function () {
  gulp.src('dist/**')
    .pipe(ftp(config.ftp))
});

gulp.task('watch',function(){
  gulp.watch(path.jade.watch, ['compileJade']);
  gulp.watch(path.styl.watch, ['compileStylus']);
  gulp.watch(path.js.watch, ['compileJS']);
  gulp.watch(path.asset.watch, ['copy']);
});

// LOCAL DEV
gulp.task('default', function() {
  runSequence('build', 'browser-sync', 'watch');
});

// BUILD TO ENV
gulp.task('build', function(){
  runSequence(
    'clean',
    'copy',
    'compileJade',
    'compileStylus',
    'compileJS'
  );
});

// deploy
gulp.task('deploy', function (callback) {
  runSequence(
      'clean',
      'copy',
      'compileJade',
      'compileStylus',
      'compileJS',
      'ftp'
  );
});
