"use strict";

var gulp       = require("gulp"),
    gutil      = require("gulp-util"),
    rev        = require("gulp-rev"),
    _          = require("lodash"),
    del        = require("del"),
    connect    = require("gulp-connect"),
    jshint     = require("gulp-jshint"),
    stylish    = require("jshint-stylish"),
    uglify     = require("gulp-uglify"),
    sass       = require("gulp-sass"),
    minifyCss  = require("gulp-minify-css"),
    usemin     = require("gulp-usemin"),
    karma      = require("karma").server,
    spawn      = require("child_process").spawn,
    readline   = require("readline");

var appConf = {
    servers: {
        dev: {
            root: ["app", ".tmp"],
            port: 8000,
            livereload: true
        },
        integration: {
            root: ["dist"],
            port: 8001
        }
    },
    files: {
        html: ["app/**/*.html"],
        sass: ["app/assets/**/*.scss"],
        img: ["app/assets/**/*.{png,jpg,jpeg}"],
        js: {
            all: [
                "gulpfile.js",
                "{app,test}/**/*.js",
                "!app/bower_components/**"
            ],
            src: ["app/components/{app,**/src/*}.js"],
            test: ["app/components/**/tests/*.js"]
        }
    }
};

var karmaConf = {
    browsers: ["PhantomJS"],
    frameworks: ["jasmine"],
    files: [
        "app/bower_components/angular/angular.js",
        "app/bower_components/angular-route/angular-route.js",
        "app/bower_components/angular-mocks/angular-mocks.js",
        "app/components/app.js",
        "app/components/**/src/*.js",
        "app/components/**/tests/*.spec.js"
    ]
};

gulp.task("karma", function(done) {
    karma.start(_.assign({}, karmaConf, {singleRun: true}), done);
});

gulp.task("devServer", function() {
    connect.server(appConf.servers.dev);
});

gulp.task("integrationServer", function() {
    connect.server(appConf.servers.integration);
});

gulp.task("clean", function(callback) {
    del([".tmp", "dist"], callback);
});

gulp.task("html", function() {
    return gulp.src(appConf.files.html)
        .pipe(connect.reload());
});

gulp.task("images", function() {
    return gulp.src(appConf.files.img)
        .pipe(connect.reload());
});

gulp.task("sass", ["clean"], function() {
    return gulp.src(appConf.files.sass)
        .pipe(sass())
        .pipe(gulp.dest(".tmp/assets/"))
        .pipe(connect.reload());
});

gulp.task("jshint", function() {
    gulp.src(appConf.files.js.all)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task("js", ["karma"], function() {
    return gulp.src(appConf.files.js.src)
        .pipe(connect.reload());
});

gulp.task("watch", function() {
    gulp.watch(appConf.files.html, ["html"]);
    gulp.watch(appConf.files.js.all, ["jshint"]);
    gulp.watch(appConf.files.js.test, ["karma"]);
    gulp.watch(appConf.files.js.src, ["js"]);
    gulp.watch(appConf.files.img, ["images"]);
    gulp.watch(appConf.files.sass, ["sass"]);
});

gulp.task("webdriver-start", function() {
    var webdriver = spawn(
        "node_modules/protractor/bin/webdriver-manager",
        ["start"]
    );

    readline.createInterface({
        input   : webdriver.stdout,
        terminal: false
    }).on("line", function(line) {
        gutil.log(line);
    });
});

gulp.task("e2e", ["build", "integrationServer"], function() {
    var protractor = spawn(
        "node_modules/protractor/bin/protractor",
        ["test/protractor.conf.js"]
    );

    readline.createInterface({
        input : protractor.stdout,
        terminal: false
    }).on("line", function(line) {
        gutil.log(line);
    });

    protractor.on("exit", function() {
        connect.serverClose();
    });
});

gulp.task("build", ["sass"], function() {
    return gulp.src(appConf.files.html)
        .pipe(usemin({
            css: [minifyCss(), rev()],
            js: [uglify(), rev()]
        }))
        .pipe(gulp.dest("dist/"));
});

gulp.task("default", ["devServer", "watch", "images", "sass", "js", "html"]);