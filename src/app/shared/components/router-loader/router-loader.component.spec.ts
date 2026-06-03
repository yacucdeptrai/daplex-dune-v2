import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { RouterLoaderComponent } from './router-loader.component';
import { RouterLoaderService } from './router-loader.service';
import { mockRouter } from '../../../../testing/test-helpers';

describe('RouterLoaderComponent', () => {
  let component: RouterLoaderComponent;
  let fixture: ComponentFixture<RouterLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RouterLoaderComponent],
    providers: [
        { provide: Router, useValue: { ...mockRouter(), events: EMPTY, getCurrentNavigation: () => null } },
        {
            provide: RouterLoaderService,
            useValue: {
                value$: of(0),
                useRef: () => ({ value$: of(0), start: () => undefined, complete: () => undefined })
            }
        }
    ]
})
      .overrideComponent(RouterLoaderComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(RouterLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
