import IMetadataProvider from './IMetadataProvider';
import Metadata from '../models/Metadata';

const TMDB_KEY = process.env.TMDB_KEY;
const MovieDb = require("moviedb-promise");
const normalizedMatch = require("./NormalizedMatch");
const pattern1 = /(S[0-9]{2})?\s*EP?([0-9]{2})/i;
const pattern2 = /[0-9]{1,2}x([0-9]{2})/i;
const pattern3 = /(\s|[.])[1-9]([0-9]{2})(\s|[.])/i;

const yearPattern = /(.*) [(]?([0-9]{4})[)]?$/;
const IMAGE_ROOT = "http://image.tmdb.org/t/p/original";

function getEpisodeNumber(episode) {
  let episodeNumber;
  let result = pattern1.exec(episode);
  if (!result || result.length !== 3) {
    result = pattern2.exec(episode);
    if (!result || result.length !== 2) {
      result = pattern3.exec(episode);
      if (!result || result.length !== 4) {
        console.log("couldn't parse episode number from", episode);
        return null;
      } else {
        episodeNumber = result[2];
      }
    }
    else {
      episodeNumber = result[1];
    }
  } else {
    episodeNumber = result[2];
  }
  return episodeNumber;
}

export default class TheMovieDb implements IMetadataProvider {
  private movieDb: any;
  constructor(private db) {
    this.movieDb = new MovieDb(TMDB_KEY);
  }

  canRun() {
    return typeof TMDB_KEY === "string";
  }

  async getPossibleMovies(movieName: string): Promise<any[]> {
    let year = -1;
    const yearMatch = movieName.match(yearPattern);
    let searchName = movieName;
    if (yearMatch) {
      searchName = yearMatch[1];
      year = parseInt(yearMatch[2]);
    }
    const response = await this.movieDb.searchMovie({ query: searchName, });
    return response;
  }

  async searchForMovie(movieName: string): Promise<Metadata> {
    console.log("searching tmdb for movie", movieName);
    let year = -1;
    const yearMatch = movieName.match(yearPattern);
    let searchName = movieName;
    if (yearMatch) {
      searchName = yearMatch[1];
      year = parseInt(yearMatch[2]);
    }
    const response = await this.movieDb.searchMovie({ query: searchName, });
    let results = response.results.filter(m => normalizedMatch(m.title, searchName));
    if (results.length > 1 && year != -1) {
      const filtered = results.filter(r => r.release_date.startsWith(year));
      if (filtered.length === 1) {
        results = filtered;
      }
    }
    if (results.length === 0 && response.results.length === 1) {
      results = response.results;
    }
    if (results.length === 1) {
      const result = results[0];
      const detailedInfo = await this.movieDb.movieInfo({ id: result.id, });
      let collectionInfo = null;
      if (detailedInfo.belongs_to_collection) {
        const collectionName = detailedInfo.belongs_to_collection.name;
        const collectionDetails = await this.movieDb.collectionInfo({ id: detailedInfo.belongs_to_collection.id, });
        const poster = collectionDetails.poster_path ? `${IMAGE_ROOT}${collectionDetails.poster_path}` : null;
        collectionInfo = { collectionName, poster: poster, movies: collectionDetails.parts.map(m => m.title), };
        await this.db.set(collectionInfo, "collections", collectionName);
      }
      const poster = result.poster_path ? `${IMAGE_ROOT}${result.poster_path}` : null;
      return { "source": "TMDB", collectionInfo, overview: detailedInfo.overview, id: detailedInfo.id, poster, };
    } else if (response.results.length > 1) {
      console.log("multiple results found for movie", movieName);
      await this.db.set({ value: JSON.stringify({ results: response.results, }), }, "possible_metadata", "movie", movieName);
    }
    return { "source": "not found", };
  }

  async getPossibleTvShow(showName: string): Promise<any[]> {
    let year = -1;
    const yearMatch = showName.match(yearPattern);
    let searchName = showName;
    if (yearMatch) {
      searchName = yearMatch[1];
      year = parseInt(yearMatch[2]);
    }
    const response = await this.movieDb.searchTv({ query: searchName, });
    return response;
  }

  async searchForTvShow(showName: string): Promise<Metadata> {
    console.log("searching tmdb for show", showName);

    let year = -1;
    const yearMatch = showName.match(yearPattern);
    let searchName = showName;
    if (yearMatch) {
      searchName = yearMatch[1];
      year = parseInt(yearMatch[2]);
    }

    const response = await this.movieDb.searchTv({ query: searchName, });
    let results = response.results.filter(m => normalizedMatch(m.name, searchName));
    if (results.length > 1 && year != -1) {
      const filtered = results.filter(r => r.first_air_date.startsWith(year));
      if (filtered.length === 1) {
        results = filtered;
      }
    }
    if (results.length === 0 && response.results.length === 1) {
      results = response.results;
    }
    if (results.length === 1) {
      const result = results[0];
      const poster = result.poster_path ? `${IMAGE_ROOT}${result.poster_path}` : null;
      return { "source": "TMDB", id: result.id, poster, };
    } else if (results.length > 1) {
      console.log("multiple results found for show", showName);
      await this.db.set({ value: JSON.stringify(results), }, "possible_metadata", "tv", "show", showName);
    }
    else if (response.results.length > 1) {
      console.log("multiple results found for show", showName);
      await this.db.set({ value: JSON.stringify({ results: response.results, }), }, "possible_metadata", "tv", "show", showName);
    }
    return { "source": "not found", };
  }

  async getEpisodeInfo(showMetadata: Metadata, season: string, episode: string): Promise<Metadata> {
    const season_number = season.substring("Season ".length);
    const episode_number = getEpisodeNumber(episode);
    if (episode_number) {
      const result = await this.movieDb.tvEpisodeInfo({ id: showMetadata.id, season_number, episode_number, });
      if (result) {
        const poster = result.still_path ? `${IMAGE_ROOT}${result.still_path}` : null;
        return { "source": "TMDB", id: result.id, overview: result.overview, poster, };
      }
    }
    return { "source": "not found", };
  }
}
