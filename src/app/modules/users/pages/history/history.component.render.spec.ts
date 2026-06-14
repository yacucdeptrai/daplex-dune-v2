import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { HistoryComponent } from './history.component';
import {
  AuthService,
  ConfirmActionService,
  DestroyService,
  GenresService,
  HistoryService,
  ItemDataService,
  MediaService
} from '../../../../core/services';
import { provideMockActivatedRoute, provideTranslocoTesting } from '../../../../../testing/test-helpers';

/**
 * v21 runtime render guard for the History filter form (PrimeNG v17->v21 migration).
 *
 * History is the single richest migrated page: it mounts p-datepicker x2 (both with
 * [showIcon] + a custom `icon` + [baseZIndex]), p-autoComplete x2 ([multiple] in-field
 * chips), p-select x2 (with [overlayOptions]), p-multiSelect zone, and p-confirmDialog.
 * `showFilterForm` defaults true so the whole form renders on first detectChanges.
 *
 * The component-scoped HistoryService/ItemDataService are replaced with light stubs via
 * overrideComponent (DestroyService kept real), so the spec exercises the real v21 DOM
 * with no network. The global console-error guard fails this spec on ANY NG runtime
 * error (NG0201/NG0300/NG0303/NG0304/...) emitted while these controls initialize.
 */
describe('HistoryComponent — v21 datepicker/select/autocomplete render', () => {
  let fixture: ComponentFixture<HistoryComponent>;

  const emptyPage = { hasNextPage: false, nextPageToken: null, prevPageToken: null, totalResults: 0, results: [] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideNoopAnimations(),
        provideMockActivatedRoute(),
        provideTranslocoTesting(),
        { provide: DialogService, useValue: { open: () => undefined, dialogComponentRefMap: new Map() } },
        ConfirmationService,
        ConfirmActionService,
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: GenresService, useValue: { findPage: () => of(emptyPage) } },
        { provide: MediaService, useValue: { findPage: () => of(emptyPage) } }
      ]
    })
      .overrideComponent(HistoryComponent, {
        set: {
          providers: [
            DestroyService,
            { provide: HistoryService, useValue: { findPage: () => of(emptyPage) } },
            {
              provide: ItemDataService,
              useValue: { createYearList: () => [], createLanguageList: () => of([]) }
            }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
  });

  it('renders the two p-datepickers with the calendar trigger icon ([showIcon] x2)', () => {
    const host: HTMLElement = fixture.nativeElement;
    const pickers = host.querySelectorAll('p-datepicker');
    expect(pickers.length).withContext('both startDate and endDate datepickers render').toBe(2);
    // [showIcon]="true" makes each datepicker render an input-group button trigger.
    const triggers = host.querySelectorAll('p-datepicker button, p-datepicker .p-datepicker-dropdown, p-datepicker .p-datepicker-trigger');
    expect(triggers.length).withContext('each [showIcon] datepicker renders a trigger button').toBeGreaterThanOrEqual(2);
  });

  it('renders the two p-selects and the multiple p-autoCompletes (in-field chip inputs)', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('p-select').length).withContext('mediaOriginalLanguage + mediaYear selects render').toBe(2);
    const autocompletes = host.querySelectorAll('p-autocomplete, p-autoComplete');
    expect(autocompletes.length).withContext('media + mediaGenres autocompletes render').toBe(2);
  });

  it('renders the p-confirmDialog host with no NG runtime error', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('p-confirmdialog, p-confirmDialog')).withContext('confirm dialog host present').toBeTruthy();
  });
});
