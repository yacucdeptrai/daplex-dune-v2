import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { CreateGenreComponent } from './create-genre.component';
import { GenresService } from '../../../../core/services';
import { mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('CreateGenreComponent', () => {
  let component: CreateGenreComponent;
  let fixture: ComponentFixture<CreateGenreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateGenreComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: GenresService, useValue: {} }
      ]
    })
      .overrideComponent(CreateGenreComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(CreateGenreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
