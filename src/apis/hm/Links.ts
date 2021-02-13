import HMObject, { HMLink } from "../../models/HMObject";
import canonicalize from "./canonicalize";

export const HMRootPath: string = "/api/hm";
export const RootLink: HMLink = { rel: ["root"], href: canonicalize(HMRootPath) };

export const HMVideosRoot: string = HMRootPath.concat("/videos");
export const HMVideoLink: HMLink = { rel: ["videos"], href: canonicalize(HMVideosRoot) };



export const HMHomePageCollection: string = HMRootPath.concat("/homepage/collections");
export const HMHomePageCollectionLink: HMLink = { rel: ["homepage-collections"], href: canonicalize(HMHomePageCollection) };

export const HMCollectionRoot: string = HMRootPath.concat("/collections");
export const HMCollectionPath: string = HMCollectionRoot.concat("/:collectionId");
export const HMCollectionLink = (collectionId: string, collectionType: string): HMLink => {
  return {
    rel: [collectionType],
    href: canonicalize(mapPath(HMCollectionPath, { collectionId }))
  }
};

function mapPath(pattern, params): string {
  let result = pattern;
  for (const key in params) {
    result = result.replace(`:${key}`, params[key]);
  }
  return result;
}

export const HMVideoInfoPath: string = HMVideosRoot.concat("/:type/:videoId");
export const HMVideoInfoLink = (type: string, videoId: string): HMLink => {
  return {
    rel: ["video"],
    href: canonicalize(mapPath(HMVideoInfoPath, { type, videoId }))
  }
};

export const HMTVShowInfo: string = HMVideosRoot.concat("/tv/:show/:season/:episode");
export const HMTVShowInfoLink = (show: string, season: string, episode: string): HMLink => {
  return {
    rel: ["tv-episode"],
    href: canonicalize(mapPath(HMTVShowInfo, { show, season, episode }))
  }
};

export const HMVideoSourcesPath: string = HMVideosRoot.concat("/:type/:videoId/sources");
export const HMVideoSourceLink = (type: string, videoId: string): HMLink => {
  return {
    rel: ["video-sources"],
    href: canonicalize(mapPath(HMVideoSourcesPath, { type, videoId }))
  }
};

export const HMMovieSourceLink = (movieName): HMLink => HMVideoSourceLink("Movies", movieName);

export const HMVTvShowSourceLink = (show: string, season: string, episode: string): HMLink => {
  return HMVideoSourceLink("TV Shows", `${show}/${season}/${episode}`)
};

export const HMVideosTypePath: string = HMVideosRoot.concat("/types/:videoType");
export const HMVideoTypeEntity = (videoType: string): HMObject => {
  return {
    class: ["video-type", `video-type-${videoType}`],
    href: canonicalize(mapPath(HMVideosTypePath, { videoType }))
  }
};

export const HMFilePath: string = HMRootPath.concat("/files/:file");
export const HMFileLink = (fileId: string): HMLink => {
  return {
    rel: ["file"],
    href: canonicalize(mapPath(HMFilePath, { fileId }))
  }
};
