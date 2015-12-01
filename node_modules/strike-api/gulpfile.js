'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');

var paths = {
    scripts: ['lib/**/*.js'],
    tests: ['test/*.js']
};

gulp.task('lint', function () {
    return gulp.src(paths.scripts)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('test', ['lint'], function() {
    return gulp.src(paths.tests, {read: false})
        .pipe(mocha({reporter: 'spec'}));
});

gulp.task('default', ['lint', 'test']);

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['lint']);
});
