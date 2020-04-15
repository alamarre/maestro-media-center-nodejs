import Metadata from '../models/Metadata';

export default interface ITheMovieDb {
  getPossibleMovies(movieName: string): Promise<any[]>;
  searchForMovie(movieName: string): Promise<Metadata>;
  getPossibleTvShow(showName: string): Promise<any[]>;
  searchForTvShow(showName: string): Promise<Metadata>;
  getEpisodeInfo(showMetadata: Metadata, season: string, episode: string): Promise<Metadata>;
}
