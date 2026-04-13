import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output
} from '@angular/core';
import { Subscription } from 'rxjs';

import { RecaptchaLoaderService } from './recaptcha-loader.service';
import type { RecaptchaSettings } from './recaptcha-settings';
import { RECAPTCHA_SETTINGS } from './tokens';
import type { RecaptchaBadge, RecaptchaSize, RecaptchaTheme, RecaptchaType, RecaptchaV2Api } from './recaptcha.types';

let nextId = 0;

export type RecaptchaErrorParameters = unknown[];

@Component({
  selector: 're-captcha',
  exportAs: 'reCaptcha',
  template: '',
  standalone: false
})
export class RecaptchaComponent implements AfterViewInit, OnDestroy {
  @Input()
  @HostBinding('attr.id')
  id: string = `ngrecaptcha-${nextId++}`;

  @Input() siteKey?: string;
  @Input() theme?: RecaptchaTheme;
  @Input() type?: RecaptchaType;
  @Input() size?: RecaptchaSize;
  @Input() tabIndex?: number;
  @Input() badge?: RecaptchaBadge;
  @Input() errorMode: 'handled' | 'default' = 'default';

  @Output() resolved = new EventEmitter<string | null>();
  @Output() error = new EventEmitter<unknown[]>();
  @Output() errored = new EventEmitter<unknown[]>();

  private subscription?: Subscription;
  private widget?: number;
  private grecaptcha?: RecaptchaV2Api;
  private executeRequested: boolean = false;

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly loader: RecaptchaLoaderService,
    private readonly zone: NgZone,
    @Optional() @Inject(RECAPTCHA_SETTINGS) settings?: RecaptchaSettings
  ) {
    if (settings) {
      this.siteKey = settings.siteKey;
      this.theme = settings.theme;
      this.type = settings.type;
      this.size = settings.size;
      this.badge = settings.badge;
    }
  }

  ngAfterViewInit(): void {
    this.subscription = this.loader.ready.subscribe((grecaptcha) => {
      if (grecaptcha && typeof grecaptcha.render === 'function') {
        this.grecaptcha = grecaptcha;
        this.renderRecaptcha();
      }
    });
  }

  ngOnDestroy(): void {
    this.grecaptchaReset();
    this.subscription?.unsubscribe();
  }

  execute(): void {
    if (this.size !== 'invisible') {
      return;
    }

    if (this.widget != null && this.grecaptcha) {
      void this.grecaptcha.execute(this.widget);
    } else {
      this.executeRequested = true;
    }
  }

  reset(): void {
    if (this.widget == null || !this.grecaptcha) {
      return;
    }

    if (this.grecaptcha.getResponse(this.widget)) {
      this.resolved.emit(null);
    }
    this.grecaptchaReset();
  }

  get __unsafe_widgetValue(): string | null {
    if (this.widget == null || !this.grecaptcha) {
      return null;
    }
    return this.grecaptcha.getResponse(this.widget);
  }

  private expired(): void {
    this.resolved.emit(null);
  }

  private onError(args: unknown[]): void {
    this.error.emit(args);
    this.errored.emit(args);
  }

  private captchaResponseCallback(response: string): void {
    this.resolved.emit(response);
  }

  private grecaptchaReset(): void {
    if (this.widget != null && this.grecaptcha) {
      this.zone.runOutsideAngular(() => this.grecaptcha?.reset(this.widget));
    }
  }

  private renderRecaptcha(): void {
    if (!this.grecaptcha) {
      return;
    }

    const options: Record<string, unknown> = {
      badge: this.badge,
      callback: (response: string) => this.zone.run(() => this.captchaResponseCallback(response)),
      'expired-callback': () => this.zone.run(() => this.expired()),
      sitekey: this.siteKey,
      size: this.size,
      tabindex: this.tabIndex,
      theme: this.theme,
      type: this.type
    };

    if (this.errorMode === 'handled') {
      options['error-callback'] = (...args: unknown[]) => {
        this.zone.run(() => this.onError(args));
      };
    }

    this.widget = this.grecaptcha.render(this.elementRef.nativeElement, options);

    if (this.executeRequested) {
      this.executeRequested = false;
      this.execute();
    }
  }
}
