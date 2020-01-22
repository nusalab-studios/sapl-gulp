const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('gulp-browserify');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const rename = require('gulp-rename');
const image = require('gulp-image');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const runSequence = require('run-sequence');
const del = require('del');
const browserSync = require('browser-sync').create();
const browsers = 'last 50 versions';

// task
const tasks = {
    default: 'default',
    clean: 'clean:dist',
    html: 'htmlmin',
    images: 'imagemin',
    sprites: 'sprites',
    fonts: 'fonts',
    videos: 'videos',
    css: 'cssnano',
    sass: 'sass',
    javascript: 'babelify',
    javascriptVendors: 'jsvendors',
    eslint: 'eslint',
    watch: 'watch',
};

// source files
const inputPath = {
    html: 'src/views/*.html',
    images: 'src/assets/images/*',
    sprites: 'src/assets/fonts/sprites/*.svg',
    fonts: 'src/assets/fonts/*.{eot,ttf,woff,woff2,svg}',
    videos: 'src/assets/videos/*',
    css: 'src/assets/css/*.css',
    sass: 'src/assets/sass/**/*.scss',
    javascript: 'src/assets/js/*.js',
    javascriptVendors: 'src/assets/js/vendors/*.js',
    eslint: ['src/assets/js/**/*.js', '!src/assets/js/vendors/*.js'],
};

const outputPath = {
    html: 'dist',
    images: 'dist/images',
    sprites: 'dist/fonts',
    fonts: 'dist/fonts',
    videos: 'dist/videos',
    css: 'dist/css/vendors',
    sass: 'dist/css',
    javascript: 'dist/js',
    javascriptVendors: 'dist/js/vendors',
};

const watchPath = {
    html: 'src/views/*.html',
    sass: 'src/assets/sass/**/*.scss',
    javascript: 'src/assets/js/**/*.js',
    eslint: 'src/assets/js/**/*.js',
};

// automatic minifying html
gulp.task(tasks.html, () => {
    if (process.env.NODE_ENV === 'production') {
        return gulp.src(inputPath.html)
            .pipe(htmlmin({
                removeComments: true,
                collapseWhitespace: true
            }))
            .pipe(gulp.dest(outputPath.html));
    } else {
        return gulp.src(inputPath.html)
            .pipe(gulp.dest(outputPath.html));
    }
});

// minify images
gulp.task(tasks.images, () => {
    gulp.src(inputPath.images)
        .pipe(image())
        .pipe(gulp.dest(outputPath.images));
});

// svg sprites
gulp.task(tasks.sprites, () => {
    gulp.src(inputPath.sprites)
        .pipe(rename({
            prefix: 'si-'
        }))
        .pipe(svgmin({
            plugins: [
                {
                    removeViewBox: false
                },
            ]
        }))
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename((path) => {
            path.basename = 'sapl-' + path.basename;
        }))
        .pipe(gulp.dest(outputPath.sprites));
});

// fonts
gulp.task(tasks.fonts, () => {
    gulp.src(inputPath.fonts)
        .pipe(gulp.dest(outputPath.fonts));
});

// videos
gulp.task(tasks.videos, () => {
    gulp.src(inputPath.videos)
        .pipe(gulp.dest(outputPath.videos));
});

// css
gulp.task(tasks.css, () => {
    gulp.src(inputPath.css)
        .pipe(cssnano())
        .pipe(rename((path) => {
            path.basename += '.min';
        }))
        .pipe(gulp.dest(outputPath.css));
});

// compile sass
// automatic browser prefixing
gulp.task(tasks.sass, () => {
    if (process.env.NODE_ENV === 'production') {
        return gulp.src(inputPath.sass)
            .pipe(sass({
                outputStyle: 'compressed'
            }).on('error', sass.logError))
            .pipe(autoprefixer({
                browsers
            }))
            .pipe(rename(function (path) {
                path.basename += '.min';
            }))
            .pipe(gulp.dest(outputPath.sass));
    } else {
        return gulp.src(inputPath.sass)
            .pipe(sourcemaps.init())
            .pipe(sass({
                outputStyle: 'expanded'
            }).on('error', sass.logError))
            .pipe(sourcemaps.write())
            .pipe(rename(function (path) {
                path.basename += '.min';
            }))
            .pipe(gulp.dest(outputPath.sass));
    }
});

// babelify
gulp.task(tasks.javascript, () => {
    if (process.env.NODE_ENV === 'production') {
        return gulp.src(inputPath.javascript)
            .pipe(browserify({
                transform: ['babelify']
            }).on('error', console.error.bind(console)))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(rename((path) => {
                path.basename += '.bundle';
            }))
            .pipe(gulp.dest(outputPath.javascript));
    } else {
        return gulp.src(inputPath.javascript)
            .pipe(browserify({
                insertGlobals: true,
                debug: true,
                transform: ['babelify']
            }).on('error', console.error.bind(console)))
            .pipe(rename((path) => {
                path.basename += '.bundle';
            }))
            .pipe(gulp.dest(outputPath.javascript));
    }
});

// javascript vendors
gulp.task(tasks.javascriptVendors, () => {
    gulp.src(inputPath.javascriptVendors)
        .pipe(gulp.dest(outputPath.javascriptVendors));
});

// eslint
gulp.task(tasks.eslint, () => {
    return gulp.src(inputPath.eslint)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// watch
gulp.task(tasks.watch, () => {
    browserSync.init({
        server: {
            baseDir: './dist',
            routes: {
                "/node_modules": "node_modules"
            },
        },
    });
    gulp.watch(watchPath.html, [tasks.html]).on('change', browserSync.reload);
    gulp.watch(watchPath.sass, [tasks.sass]).on('change', browserSync.reload);
    gulp.watch(watchPath.javascript, [tasks.javascript, tasks.eslint]).on('change', browserSync.reload);
});

gulp.task(tasks.clean, () => {
    return del.sync('dist');
});

gulp.task(tasks.default, (callback) => {
    if (process.env.NODE_ENV === 'production') {
        runSequence(tasks.clean,
            [
                tasks.html,
                tasks.images,
                tasks.sprites,
                tasks.fonts,
                tasks.videos,
                tasks.css,
                tasks.sass,
                tasks.javascript,
                tasks.javascriptVendors,
            ],
            callback
        );
    } else {
        runSequence(tasks.watch, callback);
    }
});
