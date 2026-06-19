import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { Paginated, ScannerDetailsDto, ScannerEpisode, ScannerEpisodeDto, ScannerMedia, ScannerMediaDetails, ScannerSearchDto } from '../models';
import { toTruthyHttpParams } from '../utils';

// Raw GET media-scanner/:id shape. The server serializes studios/productions as Production objects
// ({name,country}) and names the producer list `productions` — unlike the name-array genres/tags. The
// adapter below flattens both to name-arrays and renames productions->producers so the rest of the app
// (ScannerMediaDetails, applyScannedData) only ever sees the clean name-array contract.
interface RawScannerMediaDetails extends Omit<ScannerMediaDetails, 'studios' | 'producers'> {
  studios?: { name: string }[];
  productions?: { name: string }[];
}

// Thin root client for the MANAGE_MEDIA-gated provider scan (TMDB/TVDB). Mirrors the truthy-param
// resource services: relative URLs, no error handling — interceptors own base-url/auth/toasts/401.
@Injectable({ providedIn: 'root' })
export class MediaScannerService {
  constructor(private http: HttpClient) { }

  search(dto: ScannerSearchDto) {
    const params = toTruthyHttpParams(dto);
    return this.http.get<Paginated<ScannerMedia>>('media-scanner', { params });
  }

  findOne(id: number, dto: ScannerDetailsDto) {
    const params = toTruthyHttpParams(dto);
    return this.http.get<RawScannerMediaDetails>(`media-scanner/${id}`, { params }).pipe(
      // Drop the raw `productions` key; expose only the normalized studios/producers name-arrays.
      map(({ studios, productions, ...rest }) => ({
        ...rest,
        studios: studios?.map(p => p.name) ?? [],
        producers: productions?.map(p => p.name) ?? []
      }) as ScannerMediaDetails)
    );
  }

  findEpisode(id: number, season: number, episode: number, dto: ScannerEpisodeDto) {
    const params = toTruthyHttpParams(dto);
    return this.http.get<ScannerEpisode>(`media-scanner/${id}/seasons/${season}/episodes/${episode}`, { params });
  }

  // sub-slice 2 — image import:
  // findImages(id: number, dto: ScannerDetailsDto) { return this.http.get<ScannerImages>(`media-scanner/${id}/images`, { params: toTruthyHttpParams(dto) }); }
}
