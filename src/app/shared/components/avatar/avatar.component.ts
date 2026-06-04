import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgStyle, NgIf } from '@angular/common';
import { CharColorPipe } from '../../pipes/string-pipe/char-color/char-color.pipe';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgStyle, NgIf, CharColorPipe]
})
export class AvatarComponent {
  @Input() label?: string;
  @Input() styleClass?: string;
  @Input() labelStyleClass?: string;
}
