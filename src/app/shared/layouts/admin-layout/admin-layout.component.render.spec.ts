import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EMPTY, of } from 'rxjs';

import { AdminLayoutComponent } from './admin-layout.component';
import { QueueUploadService } from '../../../core/services';
import { provideTranslocoTesting } from '../../../../testing/test-helpers';

/**
 * v21 runtime render guard for the admin-layout standalone p-menu (menu migration).
 *
 * The default spec blanks the template; this one mounts it un-stubbed so the
 * sidebar p-menu ([model]="sideBarItems") actually renders its v21 menu DOM.
 * The global console-error guard fails on any NG runtime error.
 */
describe('AdminLayoutComponent — v21 p-menu render', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslocoTesting(),
        provideRouter([]),
        {
          provide: QueueUploadService,
          useValue: { displayQueue: of(false), timeRemaining: of(0), uploadQueue: EMPTY }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
  });

  it('renders the sidebar p-menu with its v21 menu items', () => {
    const host: HTMLElement = fixture.nativeElement;
    const menu = host.querySelector('p-menu');
    expect(menu).withContext('sidebar p-menu host renders').toBeTruthy();
    // v21 menu renders item links as .p-menu-item-link (v17 was .p-menuitem-link).
    const links = host.querySelectorAll('p-menu .p-menu-item-link, p-menu .p-menu-item');
    expect(links.length).withContext('p-menu renders at least one v21 menu item').toBeGreaterThan(0);
  });
});
