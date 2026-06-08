import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { HttpParamsObject } from '../types/http-params.type';
import { CreateRatingDto, CursorPageRatingsDto, FindRatedMediaDto } from '../dto/ratings';
import { CursorPaginated, Rating, RatingDetails } from '../models';

@Injectable()
export class RatingsService {
  constructor(private http: HttpClient) { }

  create(createRatingDto: CreateRatingDto) {
    return this.http.post<Rating>('ratings', createRatingDto);
  }

  findPage(cursorPageRatingsDto?: CursorPageRatingsDto) {
    const params: HttpParamsObject = {};
    if (cursorPageRatingsDto) {
      const { pageToken, limit, sort, user } = cursorPageRatingsDto;
      pageToken && (params['pageToken'] = pageToken);
      limit && (params['limit'] = limit);
      sort && (params['sort'] = sort);
      user && (params['user'] = user);
    }
    return this.http.get<CursorPaginated<RatingDetails>>('ratings', { params });
  }

  remove(id: string) {
    return this.http.delete(`ratings/${id}`);
  }

  findMedia(findRatedMediaDto: FindRatedMediaDto) {
    const params: HttpParamsObject = { media: findRatedMediaDto.media };
    return this.http.get<Rating | null>('ratings/find_media', { params });
  }
}
