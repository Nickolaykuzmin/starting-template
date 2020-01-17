"use strict";

var gulp = require("gulp"); // для работы с gulp
var plumber = require("gulp-plumber"); // выводит ошибки в консоль
var server = require("browser-sync").create(); // сервер для онлайн отслеживания изменений в
var del = require("del"); // удаление папок
var sass = require("gulp-sass"); // компилирует из sass в css
var htmlmin = require('gulp-htmlmin'); // минификация html
var uglify = require('gulp-uglify'); // минификация js
var concat = require('gulp-concat'); // для сборки всех js в один файл с переименованием
var sourcemap = require("gulp-sourcemaps"); // для отладки кода
var postcss = require("gulp-postcss"); // для работы с autoprefixer
var autoprefixer = require("autoprefixer"); // прописывает стили для кроссбраузерности
var csso = require("gulp-csso"); // минификация css
var rename = require("gulp-rename"); // переименование файлов
var imagemin = require("gulp-imagemin"); // оптимизация картинок
var webp = require("gulp-webp"); // конвертация картинок в формат webp
var svgstore = require("gulp-svgstore"); // создание спрайта для иконок SVG
var posthtml = require("gulp-posthtml"); // для вставки спрайта через include
var include = require("posthtml-include"); // для вставки спрайта

// Удаляет папку build
gulp.task("clean", function () {
  return del("build");
});

// Вставляет (include) SVG-спрайты и создает минифицированный HTML
gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest("build"));
});

// Проверяет на ошибки, переводит scss в css, прописывает стили для разных браузеров и минифицирует css
gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

// Собираем все js файлы в один и минифицирует
gulp.task('js', function () {
  return gulp.src("source/js/*.js")
    .pipe(sourcemap.init())
    .pipe(concat("script.min.js"))
    .pipe(uglify())
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest('build/js'))
    .pipe(server.stream());
});

// Оптимизируем все картинки и делаем правильную загрузку
gulp.task("images", function () {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      })
    ]))
    .pipe(gulp.dest("build/img"));
});

// Конвертируем изображения в формат webp
gulp.task("webp", function () {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest("build/img/webp"));
});

// Сжимаем иконки и создаём спрайт из них
gulp.task("sprite", function () {
  return gulp.src("source/img/sprite-svg/*.svg")
    .pipe(imagemin([
      imagemin.svgo()
    ]))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

// Копируем файлы
gulp.task("copy", function () {
  return gulp.src([
      "source/fonts/**/*.{woff,woff2}",
      "source/img/**"
    ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

// Запускаем сервер
gulp.task("server", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/img/*.{png,jpg,svg}", gulp.series("images", "refresh"));
  gulp.watch("source/img/webp/*.webp", gulp.series("webp", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
  gulp.watch("source/js/*.js", gulp.series("js", "refresh"));
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("build", gulp.series("clean", "sprite", "html", "css", "js", "images", "webp", "copy"));
gulp.task("start", gulp.series("build", "server"));
