import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UpdateGenreComponent } from './update-genre.component';
import { GenresService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('UpdateGenreComponent', () => {
  let component: UpdateGenreComponent;
  let fixture: ComponentFixture<UpdateGenreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpdateGenreComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'g1', name: 'Action' }) },
        { provide: GenresService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(UpdateGenreComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdateGenreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
