import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpCacheManager } from '@ngneat/cashew';
import { TranslocoService } from '@jsverse/transloco';
import { map, tap } from 'rxjs';

import { CreateGenreDto, CursorPageGenresDto, CursorPageMediaDto, FindGenresDto, PaginateGenresDto, RemoveGenresDto, UpdateGenreDto } from '../dto/genres';
import { CursorPaginated, Genre, GenreDetails, Media, Paginated } from '../models';
import { FindSuggestionsOptions } from '../interfaces/options';
import { CacheKey } from '../enums';
import { toTruthyHttpParams } from '../utils';

@Injectable({ providedIn: 'root' })
export class GenresService {
  constructor(private http: HttpClient, private translocoService: TranslocoService, private httpCacheManager: HttpCacheManager) { }

  create(createGenreDto: CreateGenreDto) {
    return this.http.post<GenreDetails>('genres', createGenreDto).pipe(tap(() => {
      this.invalidateAllGenresCache();
    }));
  }

  findPage(paginateGenresDto: PaginateGenresDto) {
    const params = toTruthyHttpParams(paginateGenresDto);
    return this.http.get<Paginated<Genre>>('genres', { params });
  }

  findPageCursor(cursorPageGenresDto: CursorPageGenresDto) {
    const params = toTruthyHttpParams(cursorPageGenresDto);
    return this.http.get<CursorPaginated<Genre>>('genres/cursor', { params });
  }

  findAll(findGenresDto: FindGenresDto, context?: HttpContext) {
    const params = toTruthyHttpParams(findGenresDto);
    return this.http.get<Genre[]>('genres/all', { params, context });
  }

  findOne(id: string) {
    return this.http.get<GenreDetails>(`genres/${id}`);
  }

  update(id: string, updateGenreDto: UpdateGenreDto) {
    return this.http.patch<GenreDetails>(`genres/${id}`, updateGenreDto).pipe(tap(() => {
      this.invalidateAllGenresCache();
    }));
  }

  remove(id: string) {
    return this.http.delete(`genres/${id}`).pipe(tap(() => {
      this.invalidateAllGenresCache();
    }));
  }

  removeMany(removeGenresDto: RemoveGenresDto) {
    const { ids } = removeGenresDto;
    const params: any = { ids };
    return this.http.delete('genres', { params }).pipe(tap(() => {
      this.invalidateAllGenresCache();
    }));
  }

  findAllMedia(id: string, cursorPageMediaDto: CursorPageMediaDto) {
    const params = toTruthyHttpParams(cursorPageMediaDto);
    return this.http.get<CursorPaginated<Media>>(`genres/${id}/media`, { params });
  }

  findGenreSuggestions(search?: string, options: FindSuggestionsOptions = {}) {
    options = Object.assign({}, { limit: 10, withCreateOption: true }, options);
    return this.findPage({ limit: options.limit, search, sort: 'asc(name)' }).pipe(map(genres => {
      const genreSuggestions = genres.results;
      if (options.withCreateOption) {
        const hasMatch = genres.results.find(g => g.name === search);
        if (search && search.length <= 32 && !hasMatch) {
          const encodedName = encodeURIComponent(search);
          genreSuggestions.push({
            _id: `create:name=${encodedName}`,
            name: this.translocoService.translate('admin.createMedia.createGenreByName', { name: search })
          });
        }
      }
      return genreSuggestions;
    }));
  }

  invalidateAllGenresCache() {
    this.httpCacheManager.delete(CacheKey.ALL_GENRES);
  }
}
