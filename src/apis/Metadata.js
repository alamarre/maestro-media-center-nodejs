const fs = require("fs");
const path = require("path");

class MetadataApi {
    constructor(router, metadataProvider) {
        this.router = router;
        this.metadataProvider = metadataProvider;
        this.init();
    }
    async getImage(ctx) {
        const filePath = ctx.query.path;
        const showName = ctx.query.showName;
        let imagePath = "./images/nopicture.png";
        if(showName) {
            const showFile = `./images/tv/show/${showName}.jpg`;
            if(fs.existsSync(showFile)) {
                imagePath = showFile;
            }
        } else if(ctx.query.collectionName) {
            const movieFile = `./images/collections/${ctx.query.collectionName}.jpg`;
            if(fs.existsSync(movieFile)) {
                imagePath = movieFile;
            }
        } else {
            const movieName = this.metadataProvider.getMovienameFromPath(filePath);
            const movieFile = `./images/movies/${movieName}.jpg`;
            if(fs.existsSync(movieFile)) {
                imagePath = movieFile;
            }
        }
        const realImagePath = (path.join(__dirname, `../../${imagePath}`));
        if(fs.existsSync(realImagePath)) {
            ctx.body = fs.createReadStream(realImagePath);
        }
    }

    async getMovieMetadata(ctx) {
        const result = await this.metadataProvider.getMovieMetadata(ctx.params.movieName);
        if(!result) {
            ctx.status = 404;
        }
        ctx.body = result;
    }

    async getTvShowMetadata(ctx) {
        const result = await this.metadataProvider.getTvShowMetadata(ctx.params.show);
        if(!result) {
            ctx.status = 404;
        }
        ctx.body = result;
    }

    async getTvSeasonMetadata(ctx) {
        const result = await this.metadataProvider.getTvSeasonMetadata(ctx.params.show, ctx.params.season);
        if(!result) {
            ctx.status = 404;
        }
        ctx.body = result;
    }

    async getTvEpisodeMetadata(ctx) {
        const {show, season, episode,} = ctx.params;
        const result = await this.metadataProvider.getTvEpisodeMetadata(show, season, episode);
        if(!result) {
            ctx.status = 404;
        }
        ctx.body = result;
    }
    

    init() {
        this.router.get("/image", this.getImage.bind(this));
        this.router.get("/movie/:movieName", this.getMovieMetadata.bind(this));
        this.router.get("/tv/:show", this.getTvShowMetadata.bind(this));
        this.router.get("/tv/:show/:season", this.getTvSeasonMetadata.bind(this));
        this.router.get("/tv/:show/:season/:episode", this.getTvEpisodeMetadata.bind(this));
    }
}

module.exports=MetadataApi;