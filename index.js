import {Router} from "express";
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const http = require("http");
const WebSocket = require('ws');

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

import VideosMapper from "./impl/VideosMapper";
let videoMapper = new VideosMapper(db, localStorage, false , true);

let filesRouter = new Router();
import FilesApi from "./apis/Files";
let filesApi = new FilesApi(videoMapper, filesRouter);
app.use("/api/v1.0/folders", filesRouter);

let profileRouter = new Router();
import ProfilesApi from "./apis/Profiles";
let profilesApi = new ProfilesApi(db, profileRouter);
app.use("/api/v1.0/profiles", profileRouter);

let videoRouter = new Router();
import VideosApi from "./apis/LocalVideos";
let videosApi = new VideosApi(localStorage, videoRouter);
app.use("/videos", videoRouter);

videoMapper.scanIndexedFolders();

let tvRouter = new Router();
import TvShowsApi from "./apis/TvShows";
let tvShowsApi = new TvShowsApi(videoMapper, db, tvRouter);
app.use("/api/v1.0/shows", tvRouter);


app.use(express.static('ui'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let ids = {};

wss.on('connection', function connection(ws, req) {

  ws.on('close', () => {
    if(ws.id) {
        delete ids[ws.id];
    }
  });
  ws.on('message', function incoming(message) {
    message = JSON.parse(message);
    if(message.action == "setId") {
        if(ws.id) {
            delete ids[ws.id];
        }

        ws.id = message.id;
        ids[ws.id] = true;

        for(let client of wss.clients) {
            if (client.keepUpdating) {
                client.send(JSON.stringify({"action": "list", ids: Object.keys(ids)}));
            }
        }
    } else if(message.action == "deregister") {
        if(ws.id) {
            delete ids[ws.id];
            delete ws.id;
        }
    } else if (message.client) {
        wss.clients.forEach(function each(client) {
            if (client.id == message.client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    } else if(message.action == "list") {
        if(message.keepUpdating) {
            ws.keepUpdating = true;
        }
        ws.send(JSON.stringify({"action": "list", ids: Object.keys(ids)}));
    }
  });
});

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});

module.exports = app;