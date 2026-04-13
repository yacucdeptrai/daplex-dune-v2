import { Pipe, PipeTransform } from '@angular/core';

import { toHexColor } from '../../../../core/utils';

@Pipe({
    name: 'hexColor',
    standalone: false
})
export class HexColorPipe implements PipeTransform {

  transform(value: number): string {
    return toHexColor(value);
  }

}
