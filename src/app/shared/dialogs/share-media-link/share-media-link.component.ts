import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import { SharingOption } from './interfaces';
import { trackLabel } from '../../../core/utils';
import { NgFor, NgClass } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-share-media-link',
    templateUrl: './share-media-link.component.html',
    styleUrls: ['./share-media-link.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgFor, NgClass, InputTextModule, ButtonModule, CdkCopyToClipboard]
})
export class ShareMediaLinkComponent {
  trackLabel = trackLabel;
  options: SharingOption[];

  constructor(private config: DynamicDialogConfig<SharingOption[]>) {
    this.options = this.config.data || [];
  }
}
