import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';

import { CollectionListComponent } from './collection-list.component';
import { DestroyService } from '../../../../core/services';

describe('CollectionListComponent', () => {
  let component: CollectionListComponent;
  let fixture: ComponentFixture<CollectionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CollectionListComponent],
    providers: [
        DestroyService,
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
    ]
})
      .overrideComponent(CollectionListComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CollectionListComponent);
    component = fixture.componentInstance;
    // `t` and `collectionList` are required signal inputs; supply them before change detection.
    fixture.componentRef.setInput('t', (key: string) => key);
    fixture.componentRef.setInput('collectionList', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
