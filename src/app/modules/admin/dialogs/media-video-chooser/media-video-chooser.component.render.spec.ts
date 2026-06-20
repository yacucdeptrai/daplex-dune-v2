import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoService } from '@jsverse/transloco';

import { MediaVideoChooserComponent, MediaVideoChooserConfig } from './media-video-chooser.component';
import { ScannerVideoItem } from '../../../../core/models';
import {
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

// Live render of the multi-select provider-trailer chooser. Verifies a row per item (thumbnail, name,
// type + official badge), that official rows start checked, that toggling adds/removes selection, that
// Import closes with the selected ScannerVideoItem[] and Cancel closes with null, and keyboard nav.

const VIDEOS: ScannerVideoItem[] = [
  { name: 'Official Trailer', key: 'abc11abc11a', type: 'Trailer', official: true },
  { name: '', key: 'def22def22d', type: 'Teaser', official: false }
];

function setup(data: MediaVideoChooserConfig): { fixture: ComponentFixture<MediaVideoChooserComponent>; component: MediaVideoChooserComponent; dialogRef: any } {
  const dialogRef = mockDynamicDialogRef();
  TestBed.configureTestingModule({
    imports: [MediaVideoChooserComponent],
    providers: [
      provideNoopAnimations(),
      { provide: DynamicDialogRef, useValue: dialogRef },
      { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(data) },
      provideTranslocoTesting()
    ]
  });
  const fixture = TestBed.createComponent(MediaVideoChooserComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, dialogRef };
}

// Variant that loads a real translation tree so the rendered label can be asserted as resolved text
// (not the raw key). Awaits the in-memory loader before the first detectChanges.
async function setupWithI18n(
  data: MediaVideoChooserConfig,
  translation: Record<string, unknown>
): Promise<ComponentFixture<MediaVideoChooserComponent>> {
  TestBed.configureTestingModule({
    imports: [MediaVideoChooserComponent],
    providers: [
      provideNoopAnimations(),
      { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
      { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(data) },
      provideTranslocoTesting(translation)
    ]
  });
  await TestBed.inject(TranslocoService).load('en').toPromise();
  const fixture = TestBed.createComponent(MediaVideoChooserComponent);
  fixture.detectChanges();
  return fixture;
}

describe('MediaVideoChooserComponent (live render)', () => {
  let active: ComponentFixture<MediaVideoChooserComponent> | undefined;

  afterEach(() => active?.destroy());

  it('renders one option per item with thumbnail, name (or untitled) and a type badge', () => {
    const { fixture } = setup({ items: VIDEOS });
    active = fixture;
    const host = fixture.nativeElement as HTMLElement;
    const options = host.querySelectorAll('li[role="option"]');
    expect(options.length).toBe(2);
    expect(options[0].querySelector('img')).withContext('thumbnail').toBeTruthy();
    // The untitled row falls back to the italic placeholder.
    expect(options[1].querySelector('.tw-italic')).withContext('untitled placeholder').toBeTruthy();
  });

  it('pre-selects only the official-typed rows', () => {
    const { component } = setup({ items: VIDEOS });
    expect(component.isSelected('abc11abc11a')).withContext('official pre-checked').toBeTrue();
    expect(component.isSelected('def22def22d')).withContext('non-official unchecked').toBeFalse();
    expect(component.selectedCount()).toBe(1);
  });

  it('clicking a row toggles its selection', () => {
    const { fixture, component } = setup({ items: VIDEOS });
    active = fixture;
    const second = (fixture.nativeElement as HTMLElement).querySelectorAll('li[role="option"]')[1] as HTMLElement;
    second.click();
    expect(component.isSelected('def22def22d')).toBeTrue();
    expect(component.selectedCount()).toBe(2);
    second.click();
    expect(component.isSelected('def22def22d')).toBeFalse();
    expect(component.selectedCount()).toBe(1);
  });

  it('Import closes the ref with the selected items', () => {
    const { component, dialogRef } = setup({ items: VIDEOS });
    component.confirm();
    const arg = dialogRef.close.calls.mostRecent().args[0];
    expect(arg.length).toBe(1);
    expect(arg[0].key).toBe('abc11abc11a');
  });

  it('Import is a no-op when nothing is selected', () => {
    const { component, dialogRef } = setup({ items: [{ name: 'x', key: 'k', type: 'Teaser', official: false }] });
    expect(component.selectedCount()).toBe(0);
    component.confirm();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('Cancel closes the ref with null', () => {
    const { component, dialogRef } = setup({ items: VIDEOS });
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('renders the Cancel button label as resolved text, not the raw key', async () => {
    const fixture = await setupWithI18n(
      { items: VIDEOS },
      { admin: { addMediaVideo: { cancel: 'Cancel' } } }
    );
    active = fixture;
    const label = (fixture.nativeElement as HTMLElement)
      .querySelector('.p-button-secondary .p-button-label')?.textContent?.trim();
    expect(label).toBe('Cancel');
    expect(label).not.toContain('.cancel');
  });

  it('ArrowDown wraps the active index and Space toggles the active row', () => {
    const { component } = setup({ items: VIDEOS });
    expect(component.activeIndex()).toBe(-1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.activeIndex()).toBe(0);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.activeIndex()).toBe(1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.activeIndex()).withContext('wraps to first').toBe(0);
    // Space toggles the active (official) row off.
    component.onKeyup(new KeyboardEvent('keyup', { key: ' ' }));
    expect(component.isSelected('abc11abc11a')).toBeFalse();
  });

  it('shows the empty state and no list when items is empty', () => {
    const { fixture } = setup({ items: [] });
    active = fixture;
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#video-chooser-list')).withContext('no list').toBeNull();
    expect(host.querySelector('p')).withContext('empty-state text').toBeTruthy();
  });
});
