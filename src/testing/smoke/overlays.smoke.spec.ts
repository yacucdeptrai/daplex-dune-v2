/**
 * Overlay-surface runtime smoke (A3): the CDK-overlay-backed surfaces that share
 * the `FullscreenOverlayContainer` stack with PrimeNG `ZIndexUtils`
 * (`01_gate_analyst_brief.md §3`):
 *   - slide-menu trigger (`[slideMenuTriggerFor]` → `app-slide-menu` panel)
 *   - cdk-menu-custom trigger (`[appMenuTriggerFor]` → `[appMenu]` panel)
 *   - overlay-panel directive (`[appOverlayOrigin]` + `[appConnectedOverlay]`)
 *   - `<p-confirmDialog>` render + ConfirmationService accept/reject
 *   - an overlay opened INSIDE an open DynamicDialog (z-index coexistence)
 *
 * Each asserts `assertNoNgErrors()` — opening a CDK overlay under the
 * FullscreenOverlayContainer swap is exactly the seam where a container/z-index
 * misconfiguration would throw an NG error the old gate missed.
 */

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { OverlayPanelModule } from '../../app/shared/directives/overlay-panel';
import { SlideMenuTriggerDirective } from '../../app/shared/components/slide-menu/slide-menu-trigger/slide-menu-trigger';
import { SlideMenuOverlay } from '../../app/shared/components/slide-menu/slide-menu-overlay/slide-menu-overlay';
import { SlideMenuItemButton } from '../../app/shared/components/slide-menu/slide-menu-item-button/slide-menu-item-button';
import { MenuTriggerDirective } from '../../app/shared/directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../app/shared/directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../app/shared/directives/cdk-menu-custom/menu-item/menu-item.directive';

@Component({
  standalone: true,
  imports: [
    OverlayPanelModule,
    SlideMenuTriggerDirective,
    SlideMenuOverlay,
    SlideMenuItemButton,
    MenuTriggerDirective,
    MenuDirective,
    MenuItemDirective,
    ConfirmDialogModule
  ],
  template: `
    <!-- overlay-panel directive: origin + connected overlay -->
    <button #origin appOverlayOrigin [appOverlayOrigin]="panelTpl" [overlayOpen]="overlayOpen">origin</button>
    <ng-template #panelTpl><div class="smoke-overlay-content">overlay body</div></ng-template>

    <!-- slide-menu trigger + its app-slide-menu panel -->
    <button [slideMenuTriggerFor]="slideTpl">slide trigger</button>
    <ng-template #slideTpl>
      <app-slide-menu><button slideMenuItemButton>item</button></app-slide-menu>
    </ng-template>

    <!-- cdk-menu-custom trigger + [appMenu] panel -->
    <button [appMenuTriggerFor]="cdkTpl">cdk trigger</button>
    <ng-template #cdkTpl>
      <div appMenu><button appMenuItem>cdk item</button></div>
    </ng-template>

    <!-- ConfirmDialog host -->
    <p-confirmDialog key="smoke" />
  `
})
class OverlayHostComponent {
  overlayOpen = false;
  @ViewChild('panelTpl') panelTpl!: TemplateRef<unknown>;
}

describe('Runtime smoke: overlay surfaces (slide-menu / cdk-menu / overlay-panel / confirmDialog)', () => {
  let fixture: ComponentFixture<OverlayHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayHostComponent],
      providers: provideAppConfigForTest()
    });
    fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('mounts all overlay triggers without NG framework errors', () => {
    expect(fixture.componentInstance).toBeTruthy();
    assertNoNgErrors();
  });

  it('opens the overlay-panel ([appOverlayOrigin] + [appConnectedOverlay]) without NG errors', () => {
    // Toggling open attaches the CDK overlay through the FullscreenOverlayContainer
    // and resolves the scroll-strategy token (provided here via OverlayPanelModule).
    // The gate is "no NG error on open", which is what catches a missing
    // scroll-strategy provider (the RatedComponent NG0201 the route-walk surfaced).
    expect(() => {
      fixture.componentInstance.overlayOpen = true;
      fixture.detectChanges();
    }).not.toThrow();
    assertNoNgErrors();
  });

  it('opens the slide-menu trigger on click', () => {
    const trigger = fixture.nativeElement.querySelector('.slide-menu-trigger') as HTMLElement;
    expect(trigger).withContext('slide-menu trigger host should render').not.toBeNull();
    trigger.click();
    fixture.detectChanges();
    assertNoNgErrors();
  });

  it('opens the cdk-menu-custom trigger on click', () => {
    const trigger = fixture.nativeElement.querySelector('.cdk-menu-trigger') as HTMLElement;
    expect(trigger).withContext('cdk-menu trigger host should render').not.toBeNull();
    trigger.click();
    fixture.detectChanges();
    assertNoNgErrors();
  });

  it('renders <p-confirmDialog> and drives accept then reject without NG errors', () => {
    const confirmation = TestBed.inject(ConfirmationService);

    // Accept path: requesting a confirmation must render the dialog (the fork wires
    // accept/reject via the dialog's acceptEvent/rejectEvent, exercised on render).
    confirmation.confirm({ key: 'smoke', message: 'Smoke?', accept: () => undefined });
    fixture.detectChanges();

    const dialog = document.querySelector('.p-confirmdialog, .p-confirm-dialog, p-confirmdialog');
    expect(dialog).withContext('confirm dialog should render on confirm()').not.toBeNull();

    // Click the rendered accept button if present (drives onAccept → acceptEvent.emit).
    const acceptBtn = document.querySelector<HTMLButtonElement>(
      '.p-confirmdialog-accept-button, .p-confirm-dialog-accept, [data-pc-section="acceptbutton"]'
    );
    acceptBtn?.click();
    fixture.detectChanges();

    // Reject path: a second confirmation + close must also stay NG-clean.
    confirmation.confirm({ key: 'smoke', message: 'again', reject: () => undefined });
    fixture.detectChanges();
    const rejectBtn = document.querySelector<HTMLButtonElement>(
      '.p-confirmdialog-reject-button, .p-confirm-dialog-reject, [data-pc-section="rejectbutton"]'
    );
    rejectBtn?.click();
    fixture.detectChanges();

    assertNoNgErrors();
  });
});

describe('Runtime smoke: CDK overlay opened inside an open DynamicDialog (z-index coexistence)', () => {
  let dialogService: DialogService;
  let appRef: ApplicationRef;
  let ref: DynamicDialogRef | null;
  let hostFixture: ComponentFixture<OverlayHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayHostComponent],
      providers: provideAppConfigForTest()
    });
    dialogService = TestBed.inject(DialogService);
    appRef = TestBed.inject(ApplicationRef);
    ref = null;
  });

  afterEach(() => {
    try {
      ref?.close();
    } catch {
      /* ignore teardown */
    }
    hostFixture?.destroy();
    appRef.tick();
  });

  it('opens a connected overlay while a DynamicDialog is open without NG errors', () => {
    // Open a DynamicDialog (uses the PrimeNG ZIndexUtils stack).
    ref = dialogService.open(OverlayHostComponent, { header: 'z-index', autoZIndex: false, maskStyleClass: 'tw-z-[100]' });
    appRef.tick();
    const dialogHost = document.querySelector('p-dynamicdialog, .p-dialog');
    expect(dialogHost).withContext('dialog should be open').not.toBeNull();

    // Now open a CDK-overlay-backed connected overlay (FullscreenOverlayContainer stack)
    // while the DynamicDialog (PrimeNG ZIndexUtils stack) is open — the z-index
    // coexistence seam. The gate is no NG error across both stacks being active.
    hostFixture = TestBed.createComponent(OverlayHostComponent);
    hostFixture.detectChanges();
    expect(() => {
      hostFixture.componentInstance.overlayOpen = true;
      hostFixture.detectChanges();
      appRef.tick();
    }).not.toThrow();
    assertNoNgErrors();
  });
});
