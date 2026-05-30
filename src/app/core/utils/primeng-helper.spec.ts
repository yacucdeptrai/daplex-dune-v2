import { Table } from 'primeng/table';

import { buildTablePaginationParams } from './primeng-helper';

/** Minimal Table stand-in: buildTablePaginationParams only reads these five fields. */
function fakeTable(partial: Partial<Table>): Table {
  return { filters: {}, ...partial } as unknown as Table;
}

describe('buildTablePaginationParams', () => {
  it('returns rowsPerPage defaults when the table is not yet initialised', () => {
    const params = buildTablePaginationParams(undefined, { rowsPerPage: 10, searchField: 'name' });
    expect(params).toEqual({ page: 1, limit: 10, sort: 'desc(createdAt)' });
  });

  it('honours a custom defaultSort when no table is present', () => {
    const params = buildTablePaginationParams(undefined, {
      rowsPerPage: 25, searchField: 'name', defaultSort: 'asc(name)'
    });
    expect(params.sort).toBe('asc(name)');
  });

  it('derives page from first/rows and uses asc when sortOrder is not -1', () => {
    const params = buildTablePaginationParams(
      fakeTable({ rows: 20, first: 40, sortOrder: 1, sortField: 'title' }),
      { rowsPerPage: 10, searchField: 'title' }
    );
    expect(params.limit).toBe(20);
    expect(params.page).toBe(3); // 40 / 20 + 1
    expect(params.sort).toBe('asc(title)');
  });

  it('uses desc when sortOrder is -1 and defaultSort when no sortField', () => {
    const desc = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, sortOrder: -1, sortField: 'name' }),
      { rowsPerPage: 10, searchField: 'name' }
    );
    expect(desc.sort).toBe('desc(name)');
    expect(desc.page).toBe(1); // first is 0 -> falsy -> page 1

    const noField = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, sortOrder: 1, sortField: undefined }),
      { rowsPerPage: 10, searchField: 'name' }
    );
    expect(noField.sort).toBe('desc(createdAt)');
  });

  it('always sends search when no minSearchLength (genres/productions behaviour)', () => {
    const params = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, filters: { name: { value: 'a', matchMode: 'contains' } } }),
      { rowsPerPage: 10, searchField: 'name' }
    );
    expect(params.search).toBe('a');
  });

  it('gates search behind minSearchLength (media requires >= 2 chars)', () => {
    const tooShort = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, filters: { title: { value: 'a', matchMode: 'contains' } } }),
      { rowsPerPage: 10, searchField: 'title', minSearchLength: 2 }
    );
    expect(tooShort.search).toBeUndefined();

    const longEnough = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, filters: { title: { value: 'ab', matchMode: 'contains' } } }),
      { rowsPerPage: 10, searchField: 'title', minSearchLength: 2 }
    );
    expect(longEnough.search).toBe('ab');
  });

  it('ignores an array-valued filter (no search set)', () => {
    const params = buildTablePaginationParams(
      fakeTable({ rows: 10, first: 0, filters: { name: [{ value: 'x', matchMode: 'in' }] } }),
      { rowsPerPage: 10, searchField: 'name' }
    );
    expect(params.search).toBeUndefined();
  });
});
