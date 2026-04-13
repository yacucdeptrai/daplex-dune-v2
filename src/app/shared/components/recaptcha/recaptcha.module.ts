import { NgModule } from '@angular/core';

import { RecaptchaCommonModule } from './recaptcha-common.module';
import { RecaptchaLoaderService } from './recaptcha-loader.service';

@NgModule({
  imports: [RecaptchaCommonModule],
  exports: [RecaptchaCommonModule],
  providers: [RecaptchaLoaderService]
})
export class RecaptchaModule { }
