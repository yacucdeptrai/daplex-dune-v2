// Dedicated provider-scan shapes. NOT the local Media/MediaDetails models: the scanner entity
// keys an id:number, dates as 'YYYY-MM-DD' strings, runtime in seconds and genres by name — the
// app model uses _id:string, ShortDate and Genre[]. Reusing the local model mis-types these.

export interface ScannerMedia {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;          // 'YYYY-MM-DD'
  adult: boolean;
  posterUrl: string;            // absolute, provider-correct
}

export interface ScannerExternalIds {
  imdb?: string;
  tmdb?: number;
  tvdb?: number;
  aniList?: number;
  mal?: number;
}

// One provider trailer/teaser (GET media-scanner/:id `videos`). The wire shape — NOT the local
// MediaVideo: no _id (never persisted) and no site (always YouTube; both providers pre-filter to it).
// The key is the 11-char YouTube id; the watch URL is reconstructed on import.
export interface ScannerVideoItem {
  name: string;
  key: string;
  type: string;       // 'Trailer' | 'Teaser' (free-form provider label)
  official: boolean;
}

// Auto-fill source (GET media-scanner/:id). Movie-only / tv-only fields are optional: the
// server serializes per Expose group, so the absent type's fields never arrive.
export interface ScannerMediaDetails {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  originalLanguage: string;     // ISO-639-1
  genres: string[];             // NAMES only
  studios?: string[];           // NAMES only
  producers?: string[];         // NAMES only
  tags?: string[];              // NAMES only
  runtime: number;              // SECONDS
  status: string;               // free-form provider label
  releaseDate: string;
  adult: boolean;
  externalIds: ScannerExternalIds;
  posterUrl: string;
  backdropUrl: string;
  videos?: ScannerVideoItem[];  // YouTube trailers/teasers — absent when a provider has none
  // tv-only:
  firstAirDate?: string;
  lastAirDate?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

// Query DTOs — every field a string on the wire (no global transform:true); falsy values are
// dropped by toTruthyHttpParams so includeAdult:false is never sent.
export interface ScannerSearchDto {
  provider?: string;
  type: string;
  query?: string;
  page?: number;
  year?: number;
  language?: string;
  includeAdult?: boolean;
}

export interface ScannerDetailsDto {
  provider?: string;
  type: string;
  language?: string;
}

// One serialized provider episode (GET .../episodes/:e). airDate is a 'YYYY-MM-DD' STRING, NOT the
// local ShortDate object — the string type makes a wrong .day/.month/.year access a compile error.
export interface ScannerEpisode {
  episodeNumber: number;
  name: string;
  overview: string;
  runtime: number;              // SECONDS
  airDate: string;              // 'YYYY-MM-DD'
  stillUrl?: string;
}

// Per-episode scan query — provider+language only (no type; the endpoint rejects it).
export interface ScannerEpisodeDto {
  provider?: string;
  language?: string;
}

// GET media-scanner/:id/images — provider image candidates. fileUrl is the absolute provider URL
// (image.tmdb.org / artworks.thetvdb.com); aspectRatio can be NaN (TVDB). The chosen fileUrl is sent
// as the { url } PATCH body to media/:id/poster|backdrop.
export interface ScannerImageItem {
  aspectRatio: number;   // may be NaN (TVDB)
  height: number;
  width: number;
  fileUrl: string;       // absolute provider URL — the value sent as { url }
}

export interface ScannerImages {
  posters: ScannerImageItem[];
  backdrops: ScannerImageItem[];
}
