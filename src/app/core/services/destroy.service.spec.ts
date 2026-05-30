import { TestBed } from '@angular/core/testing';

import { DestroyService } from './destroy.service';

describe('DestroyService', () => {
  let service: DestroyService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DestroyService] });
    service = TestBed.inject(DestroyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('emits and completes when destroyed', () => {
    const emitted: boolean[] = [];
    let completed = false;
    service.subscribe({ next: () => emitted.push(true), complete: () => (completed = true) });

    service.ngOnDestroy();

    expect(emitted.length).toBe(1);
    expect(completed).toBe(true);
  });
});
