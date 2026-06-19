import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, signal, viewChild, viewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { MediaType } from '../../../../core/enums';
import { ScannerMedia } from '../../../../core/models';
import { DestroyService, MediaScannerService } from '../../../../core/services';
import { DialogDismissDirective } from '../../../../shared/directives/dialog-dismiss/dialog-dismiss.directive';

interface ScannerImportConfig { type: string; }

// Provider-search dialog opened on top of the media create/edit form. Picks a provider match, fetches
// its details and closes with a ScannerMediaDetails for the opener to auto-fill. Modeled on
// SearchOverlayComponent (debounced query + keyboard nav). TMDB is the default lane.
@Component({
  selector: 'app-media-scanner-import',
  templateUrl: './media-scanner-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  hostDirectives: [DialogDismissDirective],
  imports: [TranslocoDirective, FormsModule, DynamicDialogModule, InputTextModule, SelectModule, ButtonModule, LazyLoadImageModule]
})
export class MediaScannerImportComponent {
  MediaType = MediaType;

  provider = signal<string>('tmdb');
  type = signal<string>(MediaType.MOVIE);
  query = signal<string>('');
  loading = signal<boolean>(false);
  results = signal<ScannerMedia[]>([]);
  selectedIndex = signal<number>(-1);

  providerOptions = [{ label: 'TMDB', value: 'tmdb' }, { label: 'TVDB', value: 'tvdb' }];
  typeOptions = [{ label: 'Movie', value: MediaType.MOVIE }, { label: 'TV', value: MediaType.TV }];

  private input$ = new Subject<string>();
  resultItems = viewChildren<ElementRef<HTMLElement>>('resultItem');
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig<ScannerImportConfig>, private scannerService: MediaScannerService,
    private destroyService: DestroyService) {
    this.type.set(this.config.data?.type || MediaType.MOVIE);
    this.input$.pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroyService))
      .subscribe(value => this.search(value));
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.resetResults();
    this.input$.next(value.trim());
  }

  onProviderChange(value: string): void {
    this.provider.set(value);
    this.rerunSearch();
  }

  onTypeChange(value: string): void {
    this.type.set(value);
    this.rerunSearch();
  }

  // Guard the request until a term is typed (a blank query hits the provider with undefined).
  search(query: string): void {
    if (!query) {
      this.resetResults();
      return;
    }
    this.loading.set(true);
    this.scannerService.search({ provider: this.provider(), type: this.type(), query, page: 1 })
      .pipe(takeUntil(this.destroyService)).subscribe(paginated => {
        this.results.set(paginated.results);
      }).add(() => {
        this.loading.set(false);
        this.ref.markForCheck();
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }

  onKeyup(event: KeyboardEvent): void {
    const length = this.results().length;
    switch (event.key) {
      case 'ArrowUp':
        this.selectedIndex.update(i => i - 1 < 0 ? length - 1 : i - 1);
        this.scrollToSelected();
        break;
      case 'ArrowDown':
        this.selectedIndex.update(i => i + 1 >= length ? 0 : i + 1);
        this.scrollToSelected();
        break;
      case 'Enter':
        const selected = this.results()[this.selectedIndex()];
        if (selected) this.pick(selected);
        break;
    }
  }

  pick(media: ScannerMedia): void {
    this.loading.set(true);
    this.scannerService.findOne(media.id, { provider: this.provider(), type: this.type() })
      .pipe(takeUntil(this.destroyService)).subscribe(details => {
        this.dialogRef.close(details);
      }).add(() => {
        this.loading.set(false);
        this.ref.markForCheck();
      });
  }

  private rerunSearch(): void {
    this.resetResults();
    this.search(this.query().trim());
  }

  private resetResults(): void {
    this.results.set([]);
    this.selectedIndex.set(-1);
  }

  private scrollToSelected(): void {
    const el = this.resultItems()[this.selectedIndex()];
    el?.nativeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
