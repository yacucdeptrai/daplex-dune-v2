import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChildren } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { ScannerImageItem } from '../../../../core/models';
import { DialogDismissDirective } from '../../../../shared/directives/dialog-dismiss/dialog-dismiss.directive';

export interface MediaImageChooserConfig {
  items: ScannerImageItem[];
  kind: 'poster' | 'backdrop';
}

// Thumbnail picker opened on top of the configure-media dialog. The opener fetches findImages and passes
// the already-resolved array + which aspect to render, so the chooser is dumb: pure input -> close with
// the chosen fileUrl. Modeled on MediaScannerImportComponent (listbox + arrow/Enter keyboard nav). Fixed
// aspect boxes (never item.aspectRatio, NaN for TVDB) prevent CLS.
@Component({
  selector: 'app-media-image-chooser',
  templateUrl: './media-image-chooser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DialogDismissDirective],
  imports: [TranslocoDirective, DynamicDialogModule, LazyLoadImageModule]
})
export class MediaImageChooserComponent {
  items: ScannerImageItem[];
  kind: 'poster' | 'backdrop';
  selectedIndex = signal<number>(-1);

  imageItems = viewChildren<ElementRef<HTMLElement>>('imageItem');

  constructor(private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<MediaImageChooserConfig>) {
    this.items = this.config.data?.items ?? [];
    this.kind = this.config.data?.kind ?? 'poster';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }

  onKeyup(event: KeyboardEvent): void {
    const length = this.items.length;
    switch (event.key) {
      case 'ArrowUp':
        this.selectedIndex.update(i => i - 1 < 0 ? length - 1 : i - 1);
        this.scrollToSelected();
        break;
      case 'ArrowDown':
        this.selectedIndex.update(i => i + 1 >= length ? 0 : i + 1);
        this.scrollToSelected();
        break;
      case 'Enter': {
        const selected = this.items[this.selectedIndex()];
        if (selected) this.pick(selected);
        break;
      }
    }
  }

  pick(item: ScannerImageItem): void {
    this.dialogRef.close(item.fileUrl);
  }

  private scrollToSelected(): void {
    const el = this.imageItems()[this.selectedIndex()];
    el?.nativeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
