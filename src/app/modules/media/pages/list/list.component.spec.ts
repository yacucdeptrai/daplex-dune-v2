import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { ListComponent } from './list.component';
import {
  MediaService,
  GenresService,
  ProductionsService,
  TagsService,
  CollectionService
} from '../../../../core/services';
import {
  provideMockActivatedRoute,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ListComponent],
    providers: [
        provideMockActivatedRoute({ params: {} }),
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MediaService, useValue: {} },
        { provide: GenresService, useValue: {} },
        { provide: ProductionsService, useValue: {} },
        { provide: TagsService, useValue: {} },
        { provide: CollectionService, useValue: {} }
    ]
})
      .overrideComponent(ListComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
