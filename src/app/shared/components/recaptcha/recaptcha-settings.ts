import type { RecaptchaBadge, RecaptchaSize, RecaptchaTheme, RecaptchaType } from './recaptcha.types';

export interface RecaptchaSettings {
  siteKey?: string;
  theme?: RecaptchaTheme;
  type?: RecaptchaType;
  size?: RecaptchaSize;
  badge?: RecaptchaBadge;
}
