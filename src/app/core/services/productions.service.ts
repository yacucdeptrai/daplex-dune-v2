import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { map } from 'rxjs';

import { CreateProductionDto, CursorPageMediaDto, CursorPageProductionsDto, PaginateProductionsDto, RemoveProductionsDto, UpdateProductionDto } from '../dto/productions';
import { FindSuggestionsOptions } from '../interfaces/options';
import { CursorPaginated, Media, Paginated, Production, ProductionDetails } from '../models';
import { toTruthyHttpParams } from '../utils';

@Injectable({ providedIn: 'root' })
export class ProductionsService {

  constructor(private http: HttpClient, private translocoService: TranslocoService) { }

  create(createProductionDto: CreateProductionDto) {
    return this.http.post<ProductionDetails>('productions', createProductionDto);
  }

  findPage(paginateProductionsDto: PaginateProductionsDto) {
    const params = toTruthyHttpParams(paginateProductionsDto);
    return this.http.get<Paginated<Production>>('productions', { params });
  }

  findPageCursor(cursorPageProductionsDto: CursorPageProductionsDto) {
    const params = toTruthyHttpParams(cursorPageProductionsDto);
    return this.http.get<Paginated<Production>>('productions/cursor', { params });
  }

  findOne(id: string) {
    return this.http.get<ProductionDetails>(`productions/${id}`);
  }

  update(id: string, updateProductionDto: UpdateProductionDto) {
    return this.http.patch<ProductionDetails>(`productions/${id}`, updateProductionDto);
  }

  remove(id: string) {
    return this.http.delete(`productions/${id}`);
  }

  removeMany(removeProductionsDto: RemoveProductionsDto) {
    const { ids } = removeProductionsDto;
    const params: any = { ids };
    return this.http.delete('productions', { params });
  }

  findAllMedia(id: string, cursorPageMediaDto: CursorPageMediaDto) {
    const params = toTruthyHttpParams(cursorPageMediaDto);
    return this.http.get<CursorPaginated<Media>>(`productions/${id}/media`, { params });
  }

  findProductionSuggestions(search?: string, options: FindSuggestionsOptions = {}) {
    options = Object.assign({}, { limit: 10, withCreateOption: true }, options);
    return this.findPage({ limit: options.limit, search, sort: 'asc(name)' }).pipe(map(productions => {
      const productionSuggestions = productions.results;
      if (options.withCreateOption) {
        const hasMatch = productions.results.find(p => p.name === search);
        if (search && search.length <= 150 && !hasMatch) {
          const encodedName = encodeURIComponent(search);
          productionSuggestions.push({
            _id: `create:name=${encodedName}`,
            name: this.translocoService.translate('admin.createMedia.createProductionByName', { name: search })
          });
        }
      }
      return productionSuggestions;
    }));
  }
}
