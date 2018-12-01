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

    init() {
        this.router.get("/image", this.getImage.bind(this));
    }
}

module.exports=MetadataApi;