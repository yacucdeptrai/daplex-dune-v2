import { Directive, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { RecaptchaComponent } from './recaptcha.component';

@Directive({
  selector: 're-captcha[formControlName],re-captcha[formControl],re-captcha[ngModel]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RecaptchaValueAccessorDirective),
      multi: true
    }
  ],
  standalone: false
})
export class RecaptchaValueAccessorDirective implements ControlValueAccessor {
  private onChange?: (value: string | null) => void;
  private onTouched?: () => void;
  private requiresControllerReset: boolean = false;

  constructor(private readonly host: RecaptchaComponent) { }

  writeValue(value: string): void {
    if (!value) {
      this.host.reset();
      return;
    }

    if (this.host.__unsafe_widgetValue !== value && !this.host.__unsafe_widgetValue) {
      this.requiresControllerReset = true;
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
    if (this.requiresControllerReset && this.onChange) {
      this.requiresControllerReset = false;
      this.onChange(null);
    }
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  @HostListener('resolved', ['$event'])
  onResolve(value: unknown): void {
    this.onChange?.(typeof value === 'string' ? value : null);
    this.onTouched?.();
  }
}
