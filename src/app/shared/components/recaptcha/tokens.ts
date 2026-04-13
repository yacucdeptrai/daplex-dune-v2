import { InjectionToken } from '@angular/core';

import type { RecaptchaSettings } from './recaptcha-settings';
import type { RecaptchaV2Api } from './recaptcha.types';

export const RECAPTCHA_LANGUAGE = new InjectionToken<string>('recaptcha-language');
export const RECAPTCHA_BASE_URL = new InjectionToken<string>('recaptcha-base-url');
export const RECAPTCHA_NONCE = new InjectionToken<string>('recaptcha-nonce-tag');
export const RECAPTCHA_SETTINGS = new InjectionToken<RecaptchaSettings>('recaptcha-settings');
export const RECAPTCHA_V3_SITE_KEY = new InjectionToken<string>('recaptcha-v3-site-key');

export type RecaptchaLoaderOptions = {
  onBeforeLoad?(url: URL): { url: URL; nonce?: string };
  onLoaded?(recaptcha: RecaptchaV2Api): RecaptchaV2Api;
};

export const RECAPTCHA_LOADER_OPTIONS = new InjectionToken<RecaptchaLoaderOptions>('recaptcha-loader-options');
