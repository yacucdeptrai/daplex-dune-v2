import { NgModule } from '@angular/core';

import { RecaptchaLoaderService } from './recaptcha-loader.service';
import { ReCaptchaV3Service } from './recaptcha-v3.service';

@NgModule({
  providers: [ReCaptchaV3Service, RecaptchaLoaderService]
})
export class RecaptchaV3Module { }
