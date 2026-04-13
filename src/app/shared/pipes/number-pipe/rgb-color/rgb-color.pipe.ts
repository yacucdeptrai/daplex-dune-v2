import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'rgbColor',
    standalone: false
})
export class RgbColorPipe implements PipeTransform {

  transform(value?: number, opacity?: number): string {
    if (!value) return 'rgb(0, 0, 0)';
    const r = Math.floor(value / (256 * 256));
    const g = Math.floor(value / 256) % 256;
    const b = value % 256;
    if (opacity)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    return `rgb(${r}, ${g}, ${b})`;
  }

}
