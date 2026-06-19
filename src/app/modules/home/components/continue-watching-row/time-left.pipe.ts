import { Pipe, PipeTransform } from '@angular/core';

// Remaining watch time as `mm:ss` (clamped to >= 0). Seconds-based, matching the
// History `time`/`runtime` units; no date-fns dependency for a single rail label.
@Pipe({ name: 'timeLeft' })
export class TimeLeftPipe implements PipeTransform {
  transform(time: number, runtime: number): string {
    const remaining = Math.max(0, Math.round(runtime - time));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}
