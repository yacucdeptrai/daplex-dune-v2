export type RecaptchaTheme = 'light' | 'dark';
export type RecaptchaType = 'image' | 'audio';
export type RecaptchaSize = 'normal' | 'compact' | 'invisible';
export type RecaptchaBadge = 'bottomright' | 'bottomleft' | 'inline';

export interface RecaptchaV2RenderParameters {
  sitekey?: string;
  theme?: RecaptchaTheme;
  type?: RecaptchaType;
  size?: RecaptchaSize;
  badge?: RecaptchaBadge;
  tabindex?: number;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (...args: unknown[]) => void;
}

export interface RecaptchaV2Api {
  render(container: string | HTMLElement, parameters: RecaptchaV2RenderParameters): number;
  reset(widgetId?: number): void;
  execute(widgetId?: number): PromiseLike<unknown> | void;
  execute(siteKey: string, options: { action: string }): PromiseLike<string>;
  getResponse(widgetId?: number): string;
}

declare global {
  interface Window {
    ng2recaptchaloaded?: () => void;
    grecaptcha?: RecaptchaV2Api & { enterprise?: RecaptchaV2Api };
  }
}
