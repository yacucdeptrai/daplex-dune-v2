import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { EpisodeListComponent } from './episode-list.component';
import { provideTranslocoTesting } from '../../../../testing/test-helpers';

describe('EpisodeListComponent', () => {
  let component: EpisodeListComponent;
  let fixture: ComponentFixture<EpisodeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [EpisodeListComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [provideTranslocoTesting()]
})
    .compileComponents();

    fixture = TestBed.createComponent(EpisodeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
