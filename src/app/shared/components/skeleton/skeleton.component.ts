import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

@Component({
    selector: 'app-skeleton',
    templateUrl: './skeleton.component.html',
    styleUrls: ['./skeleton.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, NgStyle]
})
export class SkeletonComponent {
  @Input() styleClass?: string;

  @Input() shape: string = 'rectangle';

  @Input() width?: string;

  @Input() height?: string;
}
