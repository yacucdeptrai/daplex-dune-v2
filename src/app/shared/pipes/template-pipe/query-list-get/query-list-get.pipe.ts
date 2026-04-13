import { Pipe, PipeTransform, QueryList } from '@angular/core';

@Pipe({
    name: 'queryListGet',
    standalone: false
})
export class QueryListGetPipe implements PipeTransform {

  transform<T>(value: QueryList<T>, index?: number): T | undefined {
    if (index === undefined) return undefined;
    return value.get(index);
  }

}
