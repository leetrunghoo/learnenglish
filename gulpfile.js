var gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    // sass = require('gulp-sass'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');


/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: 'app'
        },
        online: true, // Will not attempt to determine your network status, assumes you're ONLINE.
        port: 8080,
        startPath: "/index.html",
        ghostMode: false, // Clicks, Scrolls & Form inputs on any device will be mirrored to all others.
        notify: {
            styles: {
                top: 'auto',
                bottom: '20px',
                left: '0',
                width: '100px',
                fontSize: '0.5em',
                padding: "5px"
            }
        }
    });
});

/**
 * Compile files from sass
 */
gulp.task('styles', function() {
    return sass('app/css/main.scss',{ style: 'compressed' })
        .on('error', sass.logError)
        .pipe(autoprefixer({ browsers: ['last 2 versions', 'Firefox ESR', 'safari 5', 'ie 9', 'opera 12.1'] }))
        .pipe(minifycss())
        // .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/css'));
});


// currently, not use
// gulp.task('uncss', ['styles'], function() {
//   return gulp.src(['app/css/main.css'])
//         .pipe(uncss({
//           html: [
//             'https://learnenglish.leetrunghoo.com'
//           ]
//         }))
//         .pipe(gulp.dest('app/css'));
// });


/**
 * concat all js files then minify it
 */
gulp.task('scripts', function() {
    return gulp.src(['app/js/*.js'])
        // .pipe(concat('scripts.js'))
        // .pipe(gulp.dest('app/js'))
        // .pipe(rename('scripts.min.js'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('app/js/min'));
});


/**
 * Default task, running just `gulp` will compile the sass,
 * launch BrowserSync & watch files.
 * Watch scss files for changes & recompile
 * Watch files, reload BrowserSync
 */
gulp.task('default', ['styles', 'scripts', 'browser-sync'], function() {
    gulp.watch('app/js/*.js', ['scripts']); 
    gulp.watch('app/css/**/*.scss', ['styles']);
    gulp.watch(['app/*.html',
        'app/img/**',
        '_layouts/**',
        '_includes/**'
    ], ['jekyll-build']);
    gulp.watch(['app/data/**/*.json, app/*.html, app/css/main.min.css, app/js/min/*.js']).on('change', browserSync.reload);
});
