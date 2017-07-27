import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";

import LocalStorage from "./impl/local/LocalStorage";
import FileBasedDb from "./impl/local/FileBasedDb";

const app = express();
let port : number = 3000;
let portString = process.env.PORT;

if(portString) {
  port = parseInt(portString);
}

app.set("port", port);
app.use(compression());
app.use(bodyParser.json());

let db : FileBasedDb = new FileBasedDb("./db");
let localStorage = new LocalStorage(db);
import UserManagement from "./impl/Local/SimplePasswordAuth";
import LoginApi from "./apis/LocalLogin";
let loginApi = new LoginApi(db, new UserManagement(db));
app.use("/api/v1.0/login", loginApi.router);

app.use(loginApi.validateAuth.bind(loginApi));

import * as healthApi from "./apis/Health";

app.get("/health", healthApi.health);

import ipsApi from "./apis/Ips";

app.get("/api/v1.0/server/ips", ipsApi);

import FilesApi from "./apis/Files";
let filesApi = new FilesApi(localStorage);
app.use("/api/v1.0/folders", filesApi.router);

import VideosApi from "./apis/Videos";
let videosApi = new VideosApi(localStorage);
app.use("/videos", videosApi.router);



app.use(express.static('ui'))

app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

let WebSocketServer = require('websocket').server;

let http = require('http');

import {ServerRequest, ServerResponse} from "http";

import {request, IMessage} from "websocket";

let server = http.createServer(function(request : ServerRequest, response : ServerResponse) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port+1, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

let wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request : request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message: IMessage) {
        if (message.type === 'utf8' && message.utf8Data) {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary' && message.binaryData) {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

module.exports = app;
