var fs = require("fs");
var rangeStream = require("range-stream");
var parseRange = require("range-parser");

class VideosApi {
    constructor(storageProvider, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
    }
    get(req, res, next) {
        let path = req.params.path;
        if (req.params[0]) {
            path += req.params[0];
        }
        const listing = this.storageProvider.getRealPath(path);

        if (path.endsWith(".mp4")) {
            const stat = fs.lstatSync(listing);
            //const stream = fs.createReadStream(listing);
            this.sendSeekable(listing, "video/mp4", stat.size, req, res, next);
        } else if (path.endsWith(".vtt")) {
            res.type = "text/vtt";
            res.sendFile(listing);
        }
    }
    init() {
        this.router.get("/:path*", this.get.bind(this));
    }
    //taken from send-seekable 
    sendSeekable(file, type, length, req, res, next) {
        let stream;
        // indicate this resource can be partially requested
        res.set("Accept-Ranges", "bytes");
        // incorporate config
        if (length)
            res.set("Content-Length", "" + length);
        if (type)
            res.set("Content-Type", type);
        // if this is a partial request
        if (req.headers.range) {
            // parse ranges
            var ranges = parseRange(length, req.headers.range);
            if (ranges === -2)
                return res.sendStatus(400); // malformed range
            if (ranges === -1) {
                // unsatisfiable range
                res.set("Content-Range", "*/" + length);
                return res.sendStatus(416);
            }
            if (ranges.type !== "bytes") {
                stream = fs.createReadStream(file);
                return stream.pipe(res);
            }
            if (ranges.length > 1) {
                return next(new Error("send-seekable can only serve single ranges"));
            }
            var start = ranges[0].start;
            var end = ranges[0].end;
            if (end === length - 1 && req.headers.range.endsWith("-")) {
                end = Math.min(end, start + 5000000);
            }
            // formatting response
            res.status(206);
            res.set("Content-Length", "" + (end - start + 1)); // end is inclusive
            res.set("Content-Range", "bytes " + start + "-" + end + "/" + length);
            // slicing the stream to partial content
            stream = fs.createReadStream(file, { start, end, });
            //stream = stream.pipe(rangeStream(start, end));
        } else {
            stream = fs.createReadStream(file);
        }
        return stream.pipe(res);
    }
}

module.exports = VideosApi;