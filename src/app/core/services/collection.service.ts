import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { map } from 'rxjs';

import { CreateCollectionDto, CursorPageCollectionsDto, CursorPageMediaDto, PaginateCollectionsDto, RemoveCollectionsDto, UpdateCollectionDto } from '../dto/collections';
import { CursorPaginated, Media, MediaCollection, MediaCollectionDetails, Paginated } from '../models';
import { FindSuggestionsOptions } from '../interfaces/options';
import { toTruthyHttpParams } from '../utils';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  constructor(private http: HttpClient, private translocoService: TranslocoService) { }

  create(createCollectionDto: CreateCollectionDto) {
    return this.http.post<MediaCollectionDetails>('collections', createCollectionDto);
  }

  findPage(paginateCollectionsDto: PaginateCollectionsDto) {
    const params = toTruthyHttpParams(paginateCollectionsDto);
    return this.http.get<Paginated<MediaCollection>>('collections', { params });
  }

  findPageCursor(cursorPageCollectionsDto: CursorPageCollectionsDto) {
    const params = toTruthyHttpParams(cursorPageCollectionsDto);
    return this.http.get<CursorPaginated<MediaCollection>>('collections/cursor', { params });
  }

  findOne(id: string) {
    return this.http.get<MediaCollectionDetails>(`collections/${id}`);
  }

  update(id: string, updateCollectionDto: UpdateCollectionDto) {
    return this.http.patch<MediaCollectionDetails>(`collections/${id}`, updateCollectionDto);
  }

  remove(id: string) {
    return this.http.delete(`collections/${id}`);
  }

  removeMany(removeCollectionsDto: RemoveCollectionsDto) {
    const { ids } = removeCollectionsDto;
    const params: any = { ids };
    return this.http.delete('collections', { params });
  }

  findAllMedia(id: string, cursorPageMediaDto: CursorPageMediaDto) {
    const params = toTruthyHttpParams(cursorPageMediaDto);
    return this.http.get<CursorPaginated<Media>>(`collections/${id}/media`, { params });
  }

  findCollectionSuggestions(search?: string, options: FindSuggestionsOptions = {}) {
    options = Object.assign({}, { limit: 10, withCreateOption: true }, options);
    return this.findPage({ limit: options.limit, search, sort: 'asc(name)' }).pipe(map(collections => {
      const collectionSuggestions = collections.results;
      if (options.withCreateOption) {
        const hasMatch = collections.results.find(p => p.name === search);
        if (search && search.length <= 150 && !hasMatch) {
          const encodedName = encodeURIComponent(search);
          collectionSuggestions.push({
            _id: `create:name=${encodedName}`,
            name: this.translocoService.translate('admin.createMedia.createCollectionByName', { name: search }),
            createdAt: new Date(),
            updatedAt: new Date(),
            mediaCount: 0
          });
        }
      }
      return collectionSuggestions;
    }));
  }
}
