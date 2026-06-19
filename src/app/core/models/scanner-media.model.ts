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
