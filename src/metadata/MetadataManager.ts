export default class MetadataManager {
  constructor(private db) {
  }

  getTvShowMetadata(showName) {
    return this.db.get("metadata", "tv", "show", showName);
  }

  getTvSeasonMetadata(showName, season) {
    return this.db.list("metadata", "tv", "episode", showName, season);
  }

  getTvEpisodeMetadata(showName, season, episode) {
    return this.db.get("metadata", "tv", "episode", showName, season, episode);
  }

  getMovieMetadata(movieName) {
    return this.db.get("metadata", "movie", movieName);
  }

  getMovienameFromPath(path) {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
    const movieName = fileName.substring(0, fileName.lastIndexOf("."));
    return movieName;
  }

  async saveMovieMetadata(movieName, metadata) {
    await this.db.set(metadata, "metadata", "movie", movieName);
    if (metadata.source === "not found") {
      await this.db.set({ movieName, type: "movie", }, "metadata_missing", "movie", movieName);
    } else {
      await this.db.delete("possible_metadata", "movie", movieName);
    }
  }

  async saveTvShowMetadata(showName, metadata) {
    await this.db.set(metadata, "metadata", "tv", "show", showName);

    if (metadata.source === "not found") {
      await this.db.set({ showName, type: "tv_show", }, "metadata_missing", "tv_show", showName);
    } else {
      await this.db.delete("possible_metadata", "tv", "show", showName);
    }
  }

  async saveTvEpisodeMetadata(showName, season, episode, metadata) {
    await this.db.set(metadata, "metadata", "tv", "episode", showName, season, episode);
  }
}
