import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { of } from 'rxjs';

import { MediaFilterComponent } from './media-filter.component';
import { MediaFilterService } from './media-filter.service';
import { GenresService, TagsService } from '../../../core/services';
import { mockTranslocoService } from '../../../../testing/test-helpers';

describe('MediaFilterComponent', () => {
  let component: MediaFilterComponent;
  let fixture: ComponentFixture<MediaFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaFilterComponent],
      providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        {
          provide: MediaFilterService,
          useValue: { createYearList: () => [], createLanguageList: () => of([]) }
        },
        { provide: GenresService, useValue: { findAll: () => of([]), findGenreSuggestions: () => of([]) } },
        { provide: TagsService, useValue: { findTagSuggestions: () => of([]) } }
      ]
    })
      .overrideComponent(MediaFilterComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
