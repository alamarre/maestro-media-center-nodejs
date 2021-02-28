var fs = require("fs");
var parseRange = require("range-parser");

class VideosApi {
    constructor(storageProvider, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
    }
    async get(ctx, next) {
        let path = ctx.params.path;
        if (ctx.params[0]) {
            path += ctx.params[0];
        }
        const listing = await this.storageProvider.getRealPath(path);

        if (path.endsWith(".mp4")) {
            const stat = fs.lstatSync(listing);
            //const stream = fs.createReadStream(listing);
            this.sendSeekable(listing, "video/mp4", stat.size, ctx, next);
        } else if (path.endsWith(".vtt")) {
            if(!fs.existsSync(listing)) {
                ctx.status = 404;
            } else {
                ctx.type = "text/vtt";
                ctx.body = fs.readFileSync(listing);
            }
        }
    }
    init() {
        this.router.get("/:path*", this.get.bind(this));
    }
    //taken from send-seekable 
    sendSeekable(file, type, length, ctx, next) {
        let stream;
        // indicate this resource can be partially requested
        ctx.set("Accept-Ranges", "bytes");
        // incorporate config
        if (length)
            ctx.set("Content-Length", "" + length);
        if (type)
            ctx.set("Content-Type", type);
        // if this is a partial request
        if (ctx.headers.range) {
            // parse ranges
            var ranges = parseRange(length, ctx.headers.range);
            if (ranges === -2)
                return ctx.status = 400; // malformed range
            if (ranges === -1) {
                // unsatisfiable range
                ctx.set("Content-Range", "*/" + length);
                return ctx.status = 416;
            }
            if (ranges.type !== "bytes") {
                stream = fs.createReadStream(file);
                return ctx.body = stream;
            }
            if (ranges.length > 1) {
                return next(new Error("send-seekable can only serve single ranges"));
            }
            var start = ranges[0].start;
            var end = ranges[0].end;
            if (end === length - 1 && ctx.headers.range.endsWith("-")) {
                end = Math.min(end, start + 5000000);
            }
            // formatting response
            ctx.status = 206;
            ctx.set("Content-Length", "" + (end - start + 1)); // end is inclusive
            ctx.set("Content-Range", "bytes " + start + "-" + end + "/" + length);
            // slicing the stream to partial content
            stream = fs.createReadStream(file, { start, end, });
            //stream = stream.pipe(rangeStream(start, end));
        } else {
            stream = fs.createReadStream(file);
        }
        return ctx.body = stream;
    }
}

module.exports = VideosApi;