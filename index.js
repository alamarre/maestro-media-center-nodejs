import {Router} from "express";
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");

import LocalStorage from "./impl/local/LocalStorage";
import FileBasedDb from "./impl/local/FileBasedDb";
const app = express();
let port = 3000;
let portString = process.env.PORT;
if (portString) {
    port = parseInt(portString);
}

var cors = require("cors");
 
app.use(cors())

app.set("port", port);
app.use(compression());
app.use(bodyParser.json());
let db = new FileBasedDb("./db");
let localStorage = new LocalStorage(db);

import SimplePasswordAuth from "./impl/Local/SimplePasswordAuth";
import LocalLogin from "./apis/LocalLogin";
let loginRouter = new Router();
let loginApi = new LocalLogin(db, new SimplePasswordAuth(db), loginRouter);
app.use("/api/v1.0/login", loginRouter);
app.use(loginApi.validateAuth.bind(loginApi));

import healthApi from "./apis/Health";
app.get("/health", healthApi);

import IpsApi from "./apis/Ips";
app.get("/api/v1.0/server/ips", IpsApi);

let filesRouter = new Router();
import FilesApi from "./apis/Files";
let filesApi = new FilesApi(localStorage, filesRouter);
app.use("/api/v1.0/folders", filesRouter);

let videoRouter = new Router();
import VideosApi from "./apis/LocalVideos";
let videosApi = new VideosApi(localStorage, videoRouter);
app.use("/videos", videoRouter);

import VideosMapper from "./impl/VideosMapper";
let videoMapper = new VideosMapper(db, localStorage);

videoMapper.scanIndexedFolders();

let tvRouter = new Router();
import TvShowsApi from "./apis/TvShows";
let tvShowsApi = new TvShowsApi(videoMapper, tvRouter);
app.use("/api/v1.0/shows", tvRouter);


app.use(express.static('ui'));

app.listen(app.get("port"), () => {
    console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
    console.log("  Press CTRL-C to stop\n");
});

let ws = require("nodejs-websocket");
 
// Scream server example: "hi" -> "HI!!!" 
var server = ws.createServer(function (conn) {
    console.log("New connection")
    conn.on("text", function (str) {
        console.log("Received "+str)
        conn.sendText(str.toUpperCase())
    })
    conn.on("close", function (code, reason) {
        console.log("Connection closed")
    })
    conn.on('error', function (err) {
    if (err.code !== 'ECONNRESET') {
            // Ignore ECONNRESET and re throw anything else
            throw err
        }
    })
}).listen(port +1);

module.exports = app;