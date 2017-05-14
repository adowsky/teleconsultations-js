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
import os from 'os';
import nodeStatic  from'node-static';
import http from 'http';
import socketIO from 'socket.io';
import replace from 'gulp-string-replace';
import uuid from 'uuid/v4';
import https from 'https';

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
    gulp.run("build:html");
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

});

gulp.task('build:html', () => {
    const version = uuid();
        return gulp.src(PATHS.htmlInput)
            .pipe(replace(/\\?v={version}/g, `?v=${version}`))
            .pipe(htmlmin({ collapseWhitespace: true }))
            .pipe(gulp.dest(basePath));
    }
);

gulp.task('build:images', () => {
    gulp.src(PATHS.imagesInput)
        .pipe(image())
        .pipe(gulp.dest(PATHS.imagesOutput));
});

const clients = {};
gulp.task("socket", () => {
    const fileServer = new(nodeStatic.Server)("./target/_build/");
    const app = http.createServer(function(req, res) {
        res.removeHeader("Cache-Control");
        res.setHeader("Cache-Control", "no-cache");
        fileServer.serve(req, res);
    });

    const io = socketIO.listen(app);
    app.listen(8080);
    io.sockets.on('connection', function(socket) {
    let nextId = 0;

        // convenience function to log server messages on the client
        function log() {
            const array = ['Message from server:'];
            array.push.apply(array, arguments);
            socket.emit('log', array);
            // console.log(array);
        }

        socket.on('message', function(message) {
            // log('Client said: ', message);
            // console.log(message);
            if(message.type === 'bye') {
                delete clients[message.ownerId];
            }

            if(message.to) {
                if(!message.type) {
                    console.log(message);
                }
                io.sockets.connected[clients[message.to]].emit('message', message);
                console.log(`Routed ${message.type} from ${message.ownerId}(${clients[message.ownerId]}) to  ${message.to}(${clients[message.to]})`)
            } else {
                socket.broadcast.emit('message', message);
            }
        });

        socket.on('join', function(room) {
            log('Received request to create or join room ' + room.room);
            console.log(room);
            const numClients = Object.keys(io.sockets.sockets).length;
            console.log(`Client connections: ${Object.keys(io.sockets.sockets)}`);
            log('Room ' + room.room + ' now has ' + numClients + ' client(s)');
            clients[room.ownerId] = socket.id;
            console.log("New client", clients);
            if (numClients === 1) {
                socket.join(room.room);
                log('Client ID ' + socket.id + ' created room ' + room.room);
                socket.emit('created', room.room, socket.id);
            } else if (numClients <= 5) {
                console.log("joining");
                log('Client sock ID ' + socket.id + ' joined room ' + room.room);
                io.sockets.in(room.room).emit('join', room.room);
                socket.join(room.room);
                socket.emit('joined', room.room, socket.id);
                io.sockets.in(room.room).emit('ready', room.id);
                // socket.broadcast.emit('ready', room);
            } else { // max two clients
                socket.emit('full', room);
            }
        });

        socket.on('ipaddr', function() {
            const ifaces = os.networkInterfaces();
            for (let dev in ifaces) {
                ifaces[dev].forEach(function(details) {
                    if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                        socket.emit('ipaddr', details.address);
                    }
                });
            }
        });


    });
    // new Promise(() => {
    //     gulp.watch(["js/**/*.jsx"], ["build:js"]);
    //     gulp.watch(["css/*.css"], ["build:css"]);
    //     gulp.watch(["**/*.html"], ["build:html"]);
    // });
});
