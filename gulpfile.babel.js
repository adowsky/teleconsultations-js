'use strict';

import gulp from "gulp";
import concat from "gulp-concat";
import babelify from "babelify";
import browserify from "browserify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import htmlmin from "gulp-htmlmin";
import image from "gulp-image";
import uglify from "gulp-uglify";
import gulpif from "gulp-if";
import browsersync from "browser-sync";
import proxyMiddleware from "http-proxy-middleware";
import cleanCSS from "gulp-clean-css";
import restify from "restify";
import inquirer from "inquirer";
import clear from "cli-clear";
import sleep from "system-sleep";

const basePath = "target/_build/";
const SOURCE_PATH = "";

const PATHS = {
    entryPoint: `${SOURCE_PATH}js/start.jsx`,
    jsOut: `${basePath}js/all.js`,
    cssInput: [
        `${SOURCE_PATH}css/reset.css`
    ],
    cssOutput: `${basePath}css`,
    htmlInput: `${SOURCE_PATH}*.html`,
    imagesInput: `${SOURCE_PATH}/images/`,
    imagesOutput: `${basePath}/images/`,

};
const options = {
    browserify: {
        entries: PATHS.entryPoint,
        extensions: ['.jsx'],
        debug: true
    }
};

const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};

gulp.task('prod', () => {
    process.env.NODE_ENV = 'production';
});


let syncInstance = browsersync.create();

gulp.task('build:js', () => {
    return browserify(options.browserify)
        .transform(babelify)
        .bundle()
        .on("error", function (err) {
            console.log("Error : " + err.message);
        })
        .pipe(source(PATHS.jsOut))
        .pipe(buffer())
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest('.'));
});

gulp.task("build:css", () => {
    gulp.src(PATHS.cssInput)
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat('all.css'))
        .pipe(gulp.dest(PATHS.cssOutput))
        .pipe(syncInstance.stream())

});

gulp.task('build:html', () =>
    gulp.src(PATHS.htmlInput)
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(basePath))
);

gulp.task('build:images', () => {
    gulp.src(PATHS.imagesInput)
        .pipe(image())
        .pipe(gulp.dest(PATHS.imagesOutput));
});

gulp.task("watch", function () {
    const proxy = proxyMiddleware("/api", {target: "http://localhost:8080/"});
    syncInstance.init({
        server: {
            port: 3000,
            host: 'localhost',
            baseDir: "target/_build",
            online: true,
            middleware: [proxy]
        }
    });
    new Promise(() => {
        gulp.watch(["js/**/*.jsx"], ["js-watch"]);
        gulp.watch(["css/*.css"], ["build:css"]);
        gulp.watch(["**/*.html"], ["html-watch"]);
    });

});

gulp.task("server", () => {
    const server = restify.createServer({
        name: "timetable-front",
        version: "1.0.0"
    });

    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.queryParser());
    server.use(restify.bodyParser({
        multipartHandler: function (part) {
            part.on('data', function (data) {
                /* do something with the multipart data */
            });
        },
        multipartFileHandler: function (part) {
            part.on('data', function (data) {
                /* do something with the multipart file data */
            });
        },
        uploadDir: "target/tmp",
        multiples: true
    }));
    server.use(restify.CORS());

    const values = {
        "delay": [0, 250, 500, 1000, 5000]

    };

    let currentValue = {
        "delay": 0

    };

    server.listen(8080, () => {
        console.log("Server mock running on port: 8080");
    });


    const toggle = (key) => {
        if (currentValue[key] + 1 === values[key].length) {
            currentValue[key] = 0;
        } else {
            currentValue[key] += 1;
        }
    };

    const menu = () => {
        clear();
        Object.keys(values).forEach((val) => {
            console.info(`${val}: [${values[val][currentValue[val]]}]`);
        });
        let choices = Object.keys(values).concat(new inquirer.Separator(), "exit");
        inquirer.prompt([
            {
                type: "list",
                name: "api",
                message: "Change API",
                choices: choices
            }
        ]).then((answers) => {
            if (answers.api === "exit") {
                process.exit();
            } else {
                toggle(answers.api);
                menu();
            }

        });
    };

    menu();
});

gulp.task("js-watch", ["build:js"], () => syncInstance.reload());
gulp.task("html-watch", ["build:html"], () => syncInstance.reload);

gulp.task('build', ['build:css', 'build:html', 'build:js', 'build:images']);

gulp.task('build:prod', ['prod', 'build:css', 'build:html', 'build:js', 'build:images']);

gulp.task('default', ['build:html', 'build:css', 'build:js', 'watch']);
