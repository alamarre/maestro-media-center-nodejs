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
        const stat = fs.lstatSync(listing);
        const stream = fs.createReadStream(listing);
        this.sendSeekable(stream, "video/mp4", stat.size, req, res, next);
    }
    init() {
        this.router.get("/:path*", this.get.bind(this));
    }
    //taken from send-seekable 
    sendSeekable(stream, type, length, req, res, next) {
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
            if (ranges.type !== "bytes")
                return stream.pipe(res);
            if (ranges.length > 1) {
                return next(new Error("send-seekable can only serve single ranges"));
            }
            var start = ranges[0].start;
            var end = ranges[0].end;
            // formatting response
            res.status(206);
            res.set("Content-Length", "" + (end - start + 1)); // end is inclusive
            res.set("Content-Range", "bytes " + start + "-" + end + "/" + length);
            // slicing the stream to partial content
            stream = stream.pipe(rangeStream(start, end));
        }
        return stream.pipe(res);
    }
}

module.exports=VideosApi;