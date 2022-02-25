const { URL, } = require("url");

const cf = require("aws-cloudfront-sign");

class DbVideoLister {

    constructor(db, sourcesDb, b2FileSource) {
        this.db = db;
        this.sourcesDb = sourcesDb;
        this.b2FileSource = b2FileSource;
    }

    getCache() {
        return this.db.get("video","cache");
    }

    async listFolders(path) {
        const cache = await this.db.get("video","cache");
        if(path.startsWith("/")) {
            path = path.substring("1");
        }
        const parts = path.split("/");
        let current = cache;
        for(let i=0; i<parts.length; i++) {
            if(current.folders[parts[i]]) {
                current = current.folders[parts[i]];
            } else {
                return {files:[], folders:[],};
            }
        }
        return {
            files: Object.keys(current.files),
            folders: Object.keys(current.folders),
        };
    }

    getRootFolders() {
        const result = [{"path":"Movies","name":"Movies","index":true,},{"path":"TV Shows","name":"TV Shows","type":"TV","index":true,},];
        return result;
    }

    async getVideoSources(path, ctx) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }
        const result = await this.sourcesDb.get.apply(this.sourcesDb, ["video_sources",].concat(path.split("/")));
        delete result.partition;
        delete result.sort;
        const updateSources = async s => {
          if(s.indexOf("backblaze:") == 0) {
            const [, bucket, file,] = s.split(":");
            if(this.b2FileSource) {
              return await this.b2FileSource.getSignedUrl(bucket, file, ctx["token"]);
            }
          } else {
            let urlFormat = new URL(s);
            if(urlFormat && urlFormat.protocol == "cloudfront:") {
              const url = s.replace("cloudfront://", "https://");
              urlFormat = new URL(s.replace("cloudfront://", "https://"));
              const host = urlFormat.host;
              //const path = urlFormat.pathname;

              const settings = await this.sourcesDb.get("cloudfront-settings" ,host);
              const signedUrl = cf.getSignedUrl(url, {
                expireTime: new Date().getTime() + (settings.expirationMs || 86400000),
                keypairId: settings.keypairId,
                privateKeyString: settings.privateKeyString,
              });
              return signedUrl;
            }
          }

          return s;
        };
        result.sources = await Promise.all(result.sources.map(updateSources));
        if(result.subtitles) {
          result.subtitles = await Promise.all(result.subtitles.map(updateSources));
        }
        return result;
    }
}

module.exports = DbVideoLister;
