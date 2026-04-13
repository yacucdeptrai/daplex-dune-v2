import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';

import { recaptchaLoader } from './load-script';
import {
  RECAPTCHA_BASE_URL,
  RECAPTCHA_LANGUAGE,
  RECAPTCHA_LOADER_OPTIONS,
  RECAPTCHA_NONCE,
  RECAPTCHA_V3_SITE_KEY,
  type RecaptchaLoaderOptions
} from './tokens';
import type { RecaptchaV2Api } from './recaptcha.types';

function toNonNullObservable<T>(subject: BehaviorSubject<T | null>): Observable<T> {
  return subject.asObservable().pipe(filter((value): value is T => value !== null));
}

@Injectable()
export class RecaptchaLoaderService {
  private static ready: BehaviorSubject<RecaptchaV2Api | null> | null = null;

  readonly ready: Observable<RecaptchaV2Api>;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Optional() @Inject(RECAPTCHA_LANGUAGE) private readonly language?: string,
    @Optional() @Inject(RECAPTCHA_BASE_URL) private readonly baseUrl?: string,
    @Optional() @Inject(RECAPTCHA_NONCE) private readonly nonce?: string,
    @Optional() @Inject(RECAPTCHA_V3_SITE_KEY) private readonly v3SiteKey?: string,
    @Optional() @Inject(RECAPTCHA_LOADER_OPTIONS) private readonly options?: RecaptchaLoaderOptions
  ) {
    const subject = this.init();
    this.ready = subject ? toNonNullObservable(subject) : of();
  }

  private init(): BehaviorSubject<RecaptchaV2Api | null> | undefined {
    if (RecaptchaLoaderService.ready) {
      return RecaptchaLoaderService.ready;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }

    const subject = new BehaviorSubject<RecaptchaV2Api | null>(null);
    RecaptchaLoaderService.ready = subject;

    recaptchaLoader.newLoadScript({
      v3SiteKey: this.v3SiteKey,
      onBeforeLoad: (url) => {
        if (this.options?.onBeforeLoad) {
          return this.options.onBeforeLoad(url);
        }

        const nextUrl = new URL(this.baseUrl ?? url);
        if (this.language) {
          nextUrl.searchParams.set('hl', this.language);
        }

        return { url: nextUrl, nonce: this.nonce };
      },
      onLoaded: (recaptcha) => {
        const value = this.options?.onLoaded ? this.options.onLoaded(recaptcha) : recaptcha;
        subject.next(value);
      }
    });

    return subject;
  }
}
