import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RecaptchaCommonModule } from './recaptcha-common.module';
import { RecaptchaValueAccessorDirective } from './recaptcha-value-accessor.directive';

@NgModule({
  declarations: [RecaptchaValueAccessorDirective],
  imports: [FormsModule, RecaptchaCommonModule],
  exports: [RecaptchaValueAccessorDirective]
})
export class RecaptchaFormsModule { }
