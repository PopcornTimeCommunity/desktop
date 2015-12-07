var gulp = require('gulp');
var NwBuilder = require('nw-builder');
var os = require('os');
var argv = require('yargs')
    .alias('p', 'platforms')
    .argv;
var del = require('del');
var nw = new NwBuilder({
    files: './**',
    version: '0.12.3',
    platforms: argv.p ? argv.p.split(',') : [getCurrentPlatform()]
});

/**
 * @return {string} nw-builder compatible platform string
 */
function getCurrentPlatform() {
    switch(os.platform() + os.arch()) {
        case 'win32ia32':
            return 'win32';
        case 'win32x64':
            return 'win64';
        case 'darwinia32':
            return 'osx32';
        case 'darwinx64':
            return 'osx64';
        case 'linuxia32':
            return 'linux32';
        case 'linuxx64':
            return 'linux64';
    }
}

gulp.task('build', ['clean'], function() {
    return nw.build().then(function() {
        console.log('Successfully built!')
    }).catch(function(error) {
        console.log(error);
    });
});

gulp.task('clean', function() {
    return del('build/');
});
