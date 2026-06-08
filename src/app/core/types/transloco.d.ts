import '@jsverse/transloco';

declare module '@jsverse/transloco' {
  type TranslocoTranslateFn = (key: string, params?: HashMap) => any;
}
