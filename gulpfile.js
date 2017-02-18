/* jshint node: true */

"use strict";

var _         = require('lodash'), 
  gulp        = require("gulp"),
  sass        = require("gulp-sass"),
  cleanCSS    = require("gulp-clean-css"),
  jshint      = require("gulp-jshint"),
  uglify      = require("gulp-uglify"),
  rename      = require("gulp-rename"),
  del         = require("del"),
  concat      = require("gulp-concat"),
  cache       = require("gulp-cache"),
  size        = require("gulp-size"),
  plumber     = require("gulp-plumber"),
  purify      = require("gulp-purifycss"),
  newer       = require("gulp-newer"),
  connect     = require("gulp-connect"),
  glob        = require("glob"),
  runSequence = require("run-sequence"),
  addsrc      = require("gulp-add-src"),
  XSSLint     = require("xsslint"),
  CSSfilter   = require("cssfilter"),
  validator   = require('validator'),
  stripCssComments = require("gulp-strip-css-comments"),
  safe        = require('safe-regex'),
  eslint = require('gulp-eslint');

var config = {
  src: "src", // source directory
  dist: "tacticalsales", // destination directory
  port: 3000
};

gulp.task('lint', () => {
    return gulp.src(['src/scripts/**/*.js','!node_modules/**'])
        .pipe(eslint({
        rules: {
            'no-evil-regex-rule': 1,
        },
        rulePaths:['./eslint-rules'],
        envs: ["browser"]
    }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Stylish reporter for JSHint
gulp.task('jshint', () =>
    gulp.src([
          "src/scripts/app/pages/*.js", 
           "src/scripts/app/config.js" , 
           "src/scripts/app/utils.js" , 
           "src/scripts/vendor/addclear.js",
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
);

// Fonts
gulp.task("fonts", function() {
  return gulp.src(_.flatten([config.src + "/fonts/**/*"]))
      .pipe(newer(config.dist + "/assets/fonts"))
      .pipe(gulp.dest(config.dist + "/assets/fonts"));
});

// Images
gulp.task("images", function() {
  return gulp.src(["src/images/**/*"])
    .pipe(gulp.dest(config.dist + "/assets/images"))
    .pipe(size());
});

// HTML
gulp.task("html", function() {
  return gulp.src(["src/html/**/*.html", "src/html/favicon.ico"])
      .pipe(newer(config.dist, ".html"))
      .pipe(gulp.dest(config.dist));
});

// Copy JS libraries 
gulp.task("libcopy", function() {
  return gulp.src([
                  "src/scripts/libs/**/*"
                  ], 
                  { base: "./src/scripts/libs" }
                  )
      .pipe(newer(config.dist + "/assets/libs"))
      .pipe(gulp.dest(config.dist + "/assets/libs"));
});

// Copy Custom JS 
gulp.task("jscopy", function() {
  return gulp.src(["src/scripts/app/pages/*.js", 
                   "src/scripts/app/config.js" , 
                   "src/scripts/app/utils.js" , 
                   "src/scripts/vendor/addclear.js",
                   "src/scripts/vendor/xss.js",
                   "node_modules/validator/validator.min.js"
                   ])
      .pipe(newer(config.dist + "/assets/js"))
      .pipe(gulp.dest(config.dist + "/assets/js"));
});

// Copy Css 
gulp.task("csscopy", function() {
  return gulp.src(["src/styles/style.css"])
      .pipe(newer(config.dist + "/assets/temp"))
      .pipe(gulp.dest(config.dist + "/assets/temp"));
});


// Clean-all
gulp.task("clean-all", function() {
  del.sync([
    config.dist
  ]);
});
 
// Strip comments from CSS using strip-css-comments
gulp.task("stripcss", function () {
    return gulp.src(config.dist + "/assets/temp/style.css")
        .pipe(stripCssComments())
        .pipe(gulp.dest(config.dist + "/assets/temp/"));
});

// Remove unnecessary css 
gulp.task("csspurify", function() {
  return gulp.src(config.dist + "/assets/temp/style.css")
    .pipe(purify(
        [
          "src/scripts/app/config.js",
          "src/scripts/app/utils.js",
          "src/scripts/app/pages/*.js",
          "src/html/*.html"
        ]
      ))
    .pipe(gulp.dest(config.dist + "/assets/css"))
    .pipe(cleanCSS({compatibility: "ie8"}))
    .pipe(gulp.dest(config.dist + "/assets/css"))
    .pipe(size());
});

// Clean Temp Dir
gulp.task("cleantemp" , function () {
  del.sync([config.dist + "/assets/temp"]);
});

// XSSLint - Find potential XSS vulnerabilities
gulp.task("xsslint", function() {
  var files = glob.sync("src/scripts/app/**/*.js");
  files.forEach(function(file) {
    var warnings = XSSLint.run(file);
    warnings.forEach(function(warning) {
      console.error(file + ":" + warning.line + ": possibly XSS-able `" + warning.method + "` call");
    });
  });
});

// String Validation and Sanitization
// https://www.npmjs.com/package/validator


// CSSFilter
// gulp.task("cssfilter", function() {
//   var files = glob.sync("src/scripts/app/**/*.css");
//   files.forEach(function(file) {
//     var warnings = CSSFilter.run(file);
//     warnings.forEach(function(warning) {
//       console.error(file + ":" + warning.line + ": possibly XSS-able `" + warning.method + "` style");
//     });
//   });
// });

// Build Task !
gulp.task("build", ["clean-all"], function(done) {
  runSequence(
    "jshint",
    "xsslint",
    "libcopy",
    "jscopy",
    "fonts",
    "images",
    "html",
    "csscopy",
    "stripcss",
    "csspurify",
    "cleantemp",
    function() {
      console.log("Build successful!");
      done();
    }
  );
});

gulp.task("serve", ["build"], function() {
  connect.server({
    root: "tacticalsales",
    port : 9000
  });
});

// Default task
gulp.task("default", ["build"]);
