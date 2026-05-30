import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { of } from 'rxjs';

import { SettingsLayoutComponent } from './settings-layout.component';
import { mockTranslocoService } from '../../../../../testing/test-helpers';

describe('SettingsLayoutComponent', () => {
  let component: SettingsLayoutComponent;
  let fixture: ComponentFixture<SettingsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SettingsLayoutComponent],
      providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
      ]
    })
      .overrideComponent(SettingsLayoutComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(SettingsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
