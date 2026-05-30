import { TestBed } from '@angular/core/testing';

import { RouterLoaderService } from './router-loader.service';

describe('RouterLoaderService', () => {
  let service: RouterLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RouterLoaderService] });
    service = TestBed.inject(RouterLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
