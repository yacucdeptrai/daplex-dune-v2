import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Paginated, ScannerDetailsDto, ScannerEpisode, ScannerEpisodeDto, ScannerMedia, ScannerMediaDetails, ScannerSearchDto } from '../models';
import { toTruthyHttpParams } from '../utils';

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
    return this.http.get<ScannerMediaDetails>(`media-scanner/${id}`, { params });
  }

  findEpisode(id: number, season: number, episode: number, dto: ScannerEpisodeDto) {
    const params = toTruthyHttpParams(dto);
    return this.http.get<ScannerEpisode>(`media-scanner/${id}/seasons/${season}/episodes/${episode}`, { params });
  }

  // sub-slice 2 — image import:
  // findImages(id: number, dto: ScannerDetailsDto) { return this.http.get<ScannerImages>(`media-scanner/${id}/images`, { params: toTruthyHttpParams(dto) }); }
}
