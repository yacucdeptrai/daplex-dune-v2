import type { RecaptchaLoaderOptions } from './tokens';
import type { RecaptchaV2Api } from './recaptcha.types';

export type RenderMode = 'explicit' | { key: string };

function loadScript(
  renderMode: RenderMode,
  onBeforeLoad: (url: URL) => { url: URL; nonce?: string },
  onLoaded: (recaptcha: RecaptchaV2Api) => void,
  options: { url?: string; lang?: string; nonce?: string } = {}
): void {
  window.ng2recaptchaloaded = () => {
    if (window.grecaptcha) {
      onLoaded(window.grecaptcha);
    }
  };

  const script = document.createElement('script');
  script.innerHTML = '';

  const initialUrl = new URL(options.url ?? 'https://www.google.com/recaptcha/api.js');
  const { url: baseUrl, nonce: optionNonce } = onBeforeLoad(initialUrl);

  baseUrl.searchParams.set('render', renderMode === 'explicit' ? renderMode : renderMode.key);
  baseUrl.searchParams.set('onload', 'ng2recaptchaloaded');
  baseUrl.searchParams.set('trustedtypes', 'true');

  if (options.lang) {
    baseUrl.searchParams.set('hl', options.lang);
  }

  script.src = baseUrl.href;
  const nonceValue = optionNonce ?? options.nonce;
  if (nonceValue) {
    script.setAttribute('nonce', nonceValue);
  }
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function newLoadScript(params: {
  v3SiteKey?: string;
  onBeforeLoad: Required<RecaptchaLoaderOptions>['onBeforeLoad'];
  onLoaded(recaptcha: RecaptchaV2Api): void;
}): void {
  const renderMode: RenderMode = params.v3SiteKey ? { key: params.v3SiteKey } : 'explicit';
  loadScript(renderMode, params.onBeforeLoad, params.onLoaded);
}

export const recaptchaLoader = {
  loadScript,
  newLoadScript
};
