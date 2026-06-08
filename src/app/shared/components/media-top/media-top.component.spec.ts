import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { MediaTopComponent } from './media-top.component';
import { provideTranslocoTesting } from '../../../../testing/test-helpers';

describe('MediaTopComponent', () => {
  let component: MediaTopComponent;
  let fixture: ComponentFixture<MediaTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaTopComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [provideTranslocoTesting()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
