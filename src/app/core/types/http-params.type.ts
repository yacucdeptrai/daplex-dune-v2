// Object shape accepted by Angular HttpClient's `params` option. Mirrors the
// `{ [param: string]: string | number | boolean | ReadonlyArray<...> }` form so
// query-param builders are typed without resorting to `any`.
export type HttpParamsObject = Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
