import { toTruthyHttpParams } from './http-params-helper';

describe('toTruthyHttpParams', () => {
  it('returns an empty object for an empty DTO', () => {
    expect(toTruthyHttpParams({})).toEqual({});
  });

  it('keeps truthy string and number values', () => {
    expect(toTruthyHttpParams({ page: 2, limit: 10, sort: 'asc(name)' }))
      .toEqual({ page: 2, limit: 10, sort: 'asc(name)' });
  });

  it('omits undefined, null, empty string, zero and false (the falsy values)', () => {
    const result = toTruthyHttpParams({
      page: 0,
      limit: undefined,
      search: '',
      sort: null,
      flag: false,
      keep: 'x'
    } as Record<string, unknown>);
    expect(result).toEqual({ keep: 'x' });
  });

  it('keeps boolean true', () => {
    expect(toTruthyHttpParams({ active: true })).toEqual({ active: true });
  });

  it('keeps a non-empty array as-is', () => {
    expect(toTruthyHttpParams({ ids: ['a', 'b'] })).toEqual({ ids: ['a', 'b'] });
  });

  it('keeps a (truthy) empty array — matching the original `ids && ...` convention', () => {
    expect(toTruthyHttpParams({ ids: [] as string[] })).toEqual({ ids: [] });
  });

  it('does not mutate the input and returns a new object', () => {
    const input = { page: 1 };
    const result = toTruthyHttpParams(input);
    expect(result).not.toBe(input);
    expect(input).toEqual({ page: 1 });
  });

  it('copies only own-enumerable keys (ignores the prototype chain)', () => {
    const input = Object.create({ inherited: 'nope' });
    input.page = 1;
    expect(toTruthyHttpParams(input)).toEqual({ page: 1 });
  });
});
