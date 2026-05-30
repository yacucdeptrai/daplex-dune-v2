import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { SearchOverlayComponent } from './search-overlay.component';
import { MediaService } from '../../../core/services';
import { mockRouter } from '../../../../testing/test-helpers';

describe('SearchOverlayComponent', () => {
  let component: SearchOverlayComponent;
  let fixture: ComponentFixture<SearchOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchOverlayComponent],
      providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: MediaService, useValue: { findPage: () => of({ results: [], totalResults: 0 }) } }
      ]
    })
      .overrideComponent(SearchOverlayComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(SearchOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
