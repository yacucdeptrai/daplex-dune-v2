import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { MediaImageChooserComponent, MediaImageChooserConfig } from './media-image-chooser.component';
import { ScannerImageItem } from '../../../../core/models';
import {
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

// Live render of the provider-image chooser. Verifies the thumbnail grid renders an option per item
// (including a TVDB NaN-aspectRatio item — the fixed aspect box never reads item.aspectRatio), that a
// click and Enter close the ref with the chosen fileUrl, keyboard nav wraps, and an empty list shows
// the empty state instead of the grid.

const POSTERS: ScannerImageItem[] = [
  { aspectRatio: 0.667, height: 1500, width: 1000, fileUrl: 'https://image.tmdb.org/a.jpg' },
  { aspectRatio: NaN, height: 1500, width: 1000, fileUrl: 'https://artworks.thetvdb.com/b.jpg' }
];

function setup(data: MediaImageChooserConfig): { fixture: ComponentFixture<MediaImageChooserComponent>; component: MediaImageChooserComponent; dialogRef: any } {
  const dialogRef = mockDynamicDialogRef();
  TestBed.configureTestingModule({
    imports: [MediaImageChooserComponent],
    providers: [
      provideNoopAnimations(),
      { provide: DynamicDialogRef, useValue: dialogRef },
      { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(data) },
      provideTranslocoTesting()
    ]
  });
  const fixture = TestBed.createComponent(MediaImageChooserComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, dialogRef };
}

describe('MediaImageChooserComponent (live render)', () => {
  let active: ComponentFixture<MediaImageChooserComponent> | undefined;

  afterEach(() => active?.destroy());

  it('renders one option per item including a NaN-aspectRatio item (fixed box, no crash)', () => {
    const { fixture } = setup({ items: POSTERS, kind: 'poster' });
    active = fixture;
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll('li[role="option"]');
    expect(options.length).toBe(2);
    // The fixed aspect box is applied, not item.aspectRatio.
    expect(options[1].querySelector('.tw-aspect-w-2')).withContext('poster aspect box').toBeTruthy();
  });

  it('uses the 16:9 box for backdrops', () => {
    const { fixture } = setup({ items: POSTERS, kind: 'backdrop' });
    active = fixture;
    const box = (fixture.nativeElement as HTMLElement).querySelector('li[role="option"] .tw-aspect-w-16');
    expect(box).toBeTruthy();
  });

  it('clicking an option closes the ref with that item fileUrl', () => {
    const { fixture, dialogRef } = setup({ items: POSTERS, kind: 'poster' });
    active = fixture;
    const first = (fixture.nativeElement as HTMLElement).querySelector('li[role="option"]') as HTMLElement;
    first.click();
    expect(dialogRef.close).toHaveBeenCalledWith('https://image.tmdb.org/a.jpg');
  });

  it('Enter on the highlighted option closes with its fileUrl', () => {
    const { component, dialogRef } = setup({ items: POSTERS, kind: 'poster' });
    component.selectedIndex.set(1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(dialogRef.close).toHaveBeenCalledWith('https://artworks.thetvdb.com/b.jpg');
  });

  it('ArrowDown wraps the selected index across the option list', () => {
    const { component } = setup({ items: POSTERS, kind: 'poster' });
    expect(component.selectedIndex()).toBe(-1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).toBe(0);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).toBe(1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).withContext('wraps to first').toBe(0);
  });

  it('shows the empty state and no grid when items is empty', () => {
    const { fixture } = setup({ items: [], kind: 'poster' });
    active = fixture;
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#image-chooser-grid')).withContext('no grid').toBeNull();
    expect(host.querySelector('p')).withContext('empty-state text').toBeTruthy();
  });
});
