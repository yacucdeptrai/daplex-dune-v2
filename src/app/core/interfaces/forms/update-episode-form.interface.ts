import { FormControl, FormGroup } from '@angular/forms';

import { ShortDateForm } from './short-date-form.interface';

export interface UpdateEpisodeForm {
  episodeNumber: FormControl<number>;
  name: FormControl<string>;
  overview: FormControl<string>;
  runtime: FormControl<string | null>;
  airDate: FormGroup<ShortDateForm>;
  visibility: FormControl<number>;
  translate: FormControl<string>;
}
