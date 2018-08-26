const fetch = require("node-fetch");
const fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

class BackgroundMetadataFetcher {
    constructor(cache, metadataManager, metadataFetcher) {
        this.cache = cache;
        this.metadataManager = metadataManager;
        this.metadataFetcher = metadataFetcher;
    }

    async fetch() {
        const rootFolders = this.cache.getRootFolders();
        this.cache.listenForChanges(async (rootFolderName, relativePath) => {
            const rootFolder = rootFolders.filter(r => r.name === rootFolderName)[0];
            const folderType = (rootFolder.type || "movies").toLowerCase();
            if(folderType === "tv") {
                const showName = relativePath.split("/")[0];
                await this.addTvShow(showName);
            } else {
                await this.addMovie(relativePath);
            }
        });
        const movies = this.cache.getMovies();
        for(const movie of movies) {
            if(movie.relativePath) {
                await this.addMovie(movie.relativePath);
            }
        }

        for(const show of this.cache.getTvShows()) {
            await this.addTvShow(show);
        }
    }

    async addTvShow(showName) {
        const data = this.metadataManager.getTvShowMetadata(showName);
        if(!data) {
            const metadata = await this.metadataFetcher.searchForTvShow(showName);
            if(metadata.poster) {
                const res = await fetch(metadata.poster);
                const file = `./images/tv/show/${showName}.jpg`;
                const parentDir = path.dirname(file);
                mkdirp.sync(parentDir);
                await new Promise((resolve, reject) => {
                    const dest = fs.createWriteStream(file);
                    res.body.pipe(dest);
                    res.body.on("error", err => {
                        reject(err);
                    });
                    dest.on("finish", () => {
                        resolve();
                    });
                    dest.on("error", err => {
                        reject(err);
                    });
                });
            }
            this.metadataManager.saveTvShowMetadata(showName, metadata);
        }
    }

    async addMovie(relativePath) {
        const movieName = this.metadataManager.getMovienameFromPath(relativePath);
        const data = this.metadataManager.getMovieMetadata(movieName);
        if(!data) {
            const metadata = await this.metadataFetcher.searchForMovie(movieName);
            if(metadata.poster) {
                const res = await fetch(metadata.poster);
                const file = `./images/movies/${movieName}.jpg`;
                const parentDir = path.dirname(file);
                mkdirp.sync(parentDir);
                await new Promise((resolve, reject) => {
                    const dest = fs.createWriteStream(file);
                    res.body.pipe(dest);
                    res.body.on("error", err => {
                        reject(err);
                    });
                    dest.on("finish", () => {
                        resolve();
                    });
                    dest.on("error", err => {
                        reject(err);
                    });
                });
            }

            if(metadata.collectionInfo && metadata.collectionInfo.poster) {
                const res = await fetch(metadata.collectionInfo.poster);
                const file = `./images/collections/${metadata.collectionInfo.collectionName}.jpg`;
                const parentDir = path.dirname(file);
                mkdirp.sync(parentDir);
                await new Promise((resolve, reject) => {
                    const dest = fs.createWriteStream(file);
                    res.body.pipe(dest);
                    res.body.on("error", err => {
                        reject(err);
                    });
                    dest.on("finish", () => {
                        resolve();
                    });
                    dest.on("error", err => {
                        reject(err);
                    });
                });
            }
            this.metadataManager.saveMovieMetadata(movieName, metadata);
        }
    }
}

module.exports = BackgroundMetadataFetcher;