import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChildren } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { ScannerVideoItem } from '../../../../core/models';
import { YOUTUBE_THUMBNAIL_URL } from '../../../../../environments/config';
import { DialogDismissDirective } from '../../../../shared/directives/dialog-dismiss/dialog-dismiss.directive';

export interface MediaVideoChooserConfig {
  items: ScannerVideoItem[];
}

// Multi-select trailer picker opened on top of the configure-media dialog. The opener fetches the
// provider videos, dedups against the media's existing keys, and passes the importable array; the
// chooser is dumb input -> close with the chosen ScannerVideoItem[] (null on cancel). Official-typed
// rows start selected. Modeled on MediaImageChooserComponent (listbox + arrow nav) but multi-select:
// Space/Enter toggle the active row, the footer Import (N) confirms. Fixed 16:9 thumbnail boxes
// (aspect-ratio plugin, iOS-13-safe) prevent CLS.
@Component({
  selector: 'app-media-video-chooser',
  templateUrl: './media-video-chooser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DialogDismissDirective],
  imports: [TranslocoDirective, DynamicDialogModule, ButtonModule, LazyLoadImageModule]
})
export class MediaVideoChooserComponent {
  items: ScannerVideoItem[];
  thumbnailUrl = YOUTUBE_THUMBNAIL_URL;
  activeIndex = signal<number>(-1);
  selectedKeys = signal<Set<string>>(new Set());

  videoItems = viewChildren<ElementRef<HTMLElement>>('videoItem');

  constructor(private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<MediaVideoChooserConfig>) {
    this.items = this.config.data?.items ?? [];
    // Official trailers are pre-checked.
    this.selectedKeys.set(new Set(this.items.filter(v => v.official).map(v => v.key)));
  }

  selectedCount(): number {
    return this.selectedKeys().size;
  }

  isSelected(key: string): boolean {
    return this.selectedKeys().has(key);
  }

  toggle(item: ScannerVideoItem): void {
    // Immutable Set update so OnPush recomputes the count + checkbox states.
    const next = new Set(this.selectedKeys());
    if (next.has(item.key)) next.delete(item.key); else next.add(item.key);
    this.selectedKeys.set(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
    }
  }

  onKeyup(event: KeyboardEvent): void {
    const length = this.items.length;
    switch (event.key) {
      case 'ArrowUp':
        this.activeIndex.update(i => i - 1 < 0 ? length - 1 : i - 1);
        this.scrollToActive();
        break;
      case 'ArrowDown':
        this.activeIndex.update(i => i + 1 >= length ? 0 : i + 1);
        this.scrollToActive();
        break;
      case ' ':
      case 'Enter': {
        const active = this.items[this.activeIndex()];
        if (active) this.toggle(active);
        break;
      }
    }
  }

  confirm(): void {
    if (!this.selectedKeys().size) return;
    const selected = this.items.filter(v => this.selectedKeys().has(v.key));
    this.dialogRef.close(selected);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  private scrollToActive(): void {
    const el = this.videoItems()[this.activeIndex()];
    el?.nativeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
