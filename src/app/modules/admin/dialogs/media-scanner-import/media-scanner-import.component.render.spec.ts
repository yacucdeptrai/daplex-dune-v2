import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { MediaScannerImportComponent } from './media-scanner-import.component';
import { MediaScannerService } from '../../../../core/services';
import { MediaType } from '../../../../core/enums';
import {
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

// Live render of the provider-search dialog with MediaScannerService MOCKED — never hits a provider.
// Verifies the labelled search input + selects + a result row render, typing debounces into search(),
// a pick fetches details and closes the ref, and the keyboard nav moves/selects.

const SEARCH_RESULT = {
  page: 1, totalPages: 1, totalResults: 2,
  results: [
    { id: 1, title: 'Dune', originalTitle: 'Dune', overview: 'o', releaseDate: '2021-09-15', adult: false, posterUrl: '' },
    { id: 2, title: 'Dune: Part Two', originalTitle: 'Dune: Part Two', overview: 'o', releaseDate: '2024-02-27', adult: false, posterUrl: '' }
  ]
};
const DETAILS = { id: 1, title: 'Dune', genres: [], runtime: 9300, status: 'Released', releaseDate: '2021-09-15' };

describe('MediaScannerImportComponent (live render, mocked service)', () => {
  let fixture: ComponentFixture<MediaScannerImportComponent>;
  let component: MediaScannerImportComponent;
  let scannerService: any;
  let dialogRef: any;

  beforeEach(() => {
    scannerService = {
      search: jasmine.createSpy('search').and.returnValue(of(SEARCH_RESULT)),
      findOne: jasmine.createSpy('findOne').and.returnValue(of(DETAILS))
    };
    dialogRef = mockDynamicDialogRef();
    TestBed.configureTestingModule({
      imports: [MediaScannerImportComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MediaScannerService, useValue: scannerService },
        { provide: DynamicDialogRef, useValue: dialogRef },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ type: MediaType.MOVIE }) },
        provideTranslocoTesting()
      ]
    });
    fixture = TestBed.createComponent(MediaScannerImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Tear the view down so a deferred markForCheck/ng-lazyload-image task can't render into the next spec.
  afterEach(() => fixture.destroy());

  it('renders a labelled search input and provider/type selects', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('input#scanner-query')).withContext('search input').toBeTruthy();
    expect(host.querySelector('label[for="scanner-query"]')).withContext('input label').toBeTruthy();
    expect(host.querySelectorAll('p-select').length).withContext('provider + type selects').toBe(2);
  });

  it('renders a result row per match once results populate', fakeAsync(() => {
    component.onQueryInput('dune');
    tick(250);
    fixture.detectChanges();
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li[role="option"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Dune');
    flush();
  }));

  it('aria-activedescendant on the combobox tracks the selected row id', fakeAsync(() => {
    component.onQueryInput('dune');
    tick(250);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input#scanner-query') as HTMLInputElement;
    // nothing highlighted -> no active descendant
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    // highlight the second row
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('scanner-result-1');
    expect(host.querySelector('#scanner-result-1')?.getAttribute('role')).toBe('option');
    flush();
  }));

  it('typing debounces then calls the mocked search() with the exact dto', fakeAsync(() => {
    component.onQueryInput('dune');
    expect(scannerService.search).not.toHaveBeenCalled();   // inside the debounce window
    tick(250);
    expect(scannerService.search).toHaveBeenCalled();
    const dto = scannerService.search.calls.mostRecent().args[0];
    expect(dto.query).toBe('dune');
    expect(dto.type).toBe(MediaType.MOVIE);
    expect(component.results().length).toBe(2);
    flush();
  }));

  it('does not call search for a blank query', fakeAsync(() => {
    component.onQueryInput('   ');
    tick(250);
    expect(scannerService.search).not.toHaveBeenCalled();
    flush();
  }));

  it('picking a result fetches details and closes the ref with the details object', fakeAsync(() => {
    component.pick(SEARCH_RESULT.results[0]);
    const [id, dto] = scannerService.findOne.calls.mostRecent().args;
    expect(id).toBe(1);
    expect(dto.type).toBe(MediaType.MOVIE);
    expect(dto.provider).toBe('tmdb');
    expect(dialogRef.close).toHaveBeenCalledWith(DETAILS);
    flush();
  }));

  it('Enter on the highlighted row picks it', () => {
    component.results.set(SEARCH_RESULT.results as any);
    component.selectedIndex.set(1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'Enter' }));
    const [id] = scannerService.findOne.calls.mostRecent().args;
    expect(id).toBe(2);
  });

  it('ArrowDown wraps the selected index across the result list', () => {
    component.results.set(SEARCH_RESULT.results as any);
    expect(component.selectedIndex()).toBe(-1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).toBe(0);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).toBe(1);
    component.onKeyup(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(component.selectedIndex()).withContext('wraps back to first').toBe(0);
  });
});
