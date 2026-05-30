import { Renderer2 } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogComponent, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumber } from 'primeng/inputnumber';
import { Table } from 'primeng/table';
import { TabMenu } from 'primeng/tabmenu';
import { ZIndexUtils } from 'primeng/utils';
import { first } from 'rxjs';

export function fixNestedDialogFocus(dialogRef: DynamicDialogRef, parent: DynamicDialogRef, dialogService: DialogService, renderer: Renderer2, document: Document) {
  const dialogComponent = dialogService.dialogComponentRefMap.get(parent)?.instance;
  if (dialogComponent) dialogComponent.unbindGlobalListeners();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  dialogRef.onDestroy.pipe(first()).subscribe(() => {
    if (!dialogComponent?.container) return;
    blockScroll(renderer, document);
    dialogComponent.moveOnTop();
    dialogComponent.bindGlobalListeners();
    dialogComponent.focus();
  });
}

export function blockScroll(renderer: Renderer2, document: Document) {
  renderer.addClass(document.body, 'p-overflow-hidden');
}

export function bindDocumentEscapeListener(dialogService: DialogService, renderer: Renderer2, escapeCallback: () => void, parent?: DynamicDialogRef, dialogComponent?: DynamicDialogComponent) {
  if (!dialogComponent && parent)
    dialogComponent = dialogService.dialogComponentRefMap.get(parent)?.instance;
  if (!dialogComponent) return;
  const documentTarget = dialogComponent.maskViewChild ? dialogComponent.maskViewChild.nativeElement.ownerDocument : 'document';
  dialogComponent.documentEscapeListener = renderer.listen(documentTarget, 'keydown', (event) => {
    if (event.which == 27) {
      if (dialogComponent?.container && parseInt(dialogComponent.container.style.zIndex) == ZIndexUtils.getCurrent()) {
        escapeCallback();
      }
    }
  });
}

export function replaceDialogHideMethod(dialogService: DialogService, replaceTo: () => void, parent?: DynamicDialogRef, dialogComponent?: DynamicDialogComponent) {
  if (!dialogComponent && parent)
    dialogComponent = dialogService.dialogComponentRefMap.get(parent)?.instance;
  if (!dialogComponent) return;
  dialogComponent.hide = replaceTo;
}

const DEFAULT_TABLE_SORT = 'desc(createdAt)';

export interface TableOffsetPaginationParams {
  limit: number;
  page: number;
  sort: string;
  search?: string;
}

export interface TablePaginationOptions {
  /** Page size used when the table is not yet initialised (no lazy event fired). */
  rowsPerPage: number;
  /** Filter key whose value becomes the `search` param (e.g. 'name', 'title'). */
  searchField: string;
  /** Sort applied when the table has no explicit sort field. Defaults to `desc(createdAt)`. */
  defaultSort?: string;
  /** Minimum search-value length before `search` is sent. 0 (default) always sends it. */
  minSearchLength?: number;
}

/**
 * Builds the offset-pagination query params (limit/page/sort/search) shared by the
 * admin PrimeNG-table list pages (genres, productions, media). Preserves each page's
 * original behaviour: the search field key is configurable and an optional minimum
 * length gates whether `search` is sent (media requires >= 2 chars; others always send).
 */
export function buildTablePaginationParams(
  table: Table | undefined,
  options: TablePaginationOptions
): TableOffsetPaginationParams {
  const defaultSort = options.defaultSort ?? DEFAULT_TABLE_SORT;
  if (!table) {
    return { page: 1, limit: options.rowsPerPage, sort: defaultSort };
  }
  const limit = table.rows || 0;
  const page = table.first ? table.first / limit + 1 : 1;
  const sortOrder = table.sortOrder === -1 ? 'desc' : 'asc';
  const sort = table.sortField ? `${sortOrder}(${table.sortField})` : defaultSort;
  const params: TableOffsetPaginationParams = { limit, page, sort };
  const filter = table.filters[options.searchField];
  if (filter && !Array.isArray(filter)) {
    const minLength = options.minSearchLength ?? 0;
    if (minLength === 0 || (filter.value?.length ?? 0) >= minLength) {
      params.search = filter.value;
    }
  }
  return params;
}

export function applyPrimeNGPatches() {
  TabMenu.prototype.isActive = function (item: MenuItem): boolean {
    if (item.routerLink) {
      const routerLink = Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink];
      const router = (this as any).router;
      return router.isActive(router.createUrlTree(routerLink, { relativeTo: (this as any).route }).toString(),
        item.routerLinkActiveOptions?.exact ?? item.routerLinkActiveOptions ?? false);
    }
    return item === this.activeItem;
  };
  InputNumber.prototype.validateValue = function (value: any) {
    if (value === '-' || value == null) {
      return null;
    }
    if (this.min != null && value < this.min) {
      if (this.max)
        return this.max;
      return this.min;
    }
    if (this.max != null && value > this.max) {
      if (this.min)
        return this.min;
      return this.max;
    }
    return value;
  }
}
