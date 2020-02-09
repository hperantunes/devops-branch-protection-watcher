"use strict";
const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const sourceMaps = require('gulp-sourcemaps');
const filter = require("gulp-filter");
const rename = require("gulp-rename");
const lint = require("gulp-tslint");
const clean = require("del");
const exec = require("child_process").exec;

gulp.task("default", ["build"]);

const buildOutputDirectory = "buildOutput";
const deploymentDistDirectory = "deploy/dist";

gulp.task("clean", function () {
    return clean(["coverage", buildOutputDirectory, deploymentDistDirectory]);
});

gulp.task("build", ["clean"], function () {
    return tsProject.src()
        .pipe(sourceMaps.init())
        .pipe(tsProject())
        .on("error", function (error) {
            console.error(`Typescript build fail: ${error}`);
            process.exit(101);
        })
        .pipe(sourceMaps.mapSources(function (sourcePath, file) {
            return '../../' + sourcePath;
        }))
        .pipe(sourceMaps.write("."))
        .pipe(gulp.dest(buildOutputDirectory))
        .pipe(filter([buildOutputDirectory + "/src/**/*.js"]))
        .pipe(rename((file) =>
        {
            file.dirname = file.dirname.substring("src".length);
        }))
        .pipe(gulp.dest(deploymentDistDirectory));
});

gulp.task("lint", function () {
    return tsProject.src()
        .pipe(lint({
            formatter: "verbose"
        }))
        .pipe(lint.report());
});

gulp.task("test", ["build"], function (done) {
    exec("npm test", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task("cover", ["build"], function (done) {
    exec("npm run coverage", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task("acceptanceTest", ["build"], function (done) {
    exec("npm run acceptanceTest", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});
