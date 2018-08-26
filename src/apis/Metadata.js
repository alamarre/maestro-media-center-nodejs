const fs = require("fs");
const path = require("path");

class MetadataApi {
    constructor(router, metadataProvider) {
        this.router = router;
        this.metadataProvider = metadataProvider;
        this.init();
    }
    getImage(req, res) {
        const filePath = req.query.path;
        const showName = req.query.showName;
        let imagePath = "./images/nopicture.png";
        if(showName) {
            const showFile = `./images/tv/show/${showName}.jpg`;
            if(fs.existsSync(showFile)) {
                imagePath = showFile;
            }
        } else if(req.query.collectionName) {
            const movieFile = `./images/collections/${req.query.collectionName}.jpg`;
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
        res.sendFile(imagePath, { root: path.join(__dirname, "../../"), });
    }

    init() {
        this.router.get("/image", this.getImage.bind(this));
    }
}

module.exports=MetadataApi;