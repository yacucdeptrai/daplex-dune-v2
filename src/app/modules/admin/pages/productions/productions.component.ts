import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { first } from 'rxjs';

import { ConfirmActionService, ProductionsService } from '../../../../core/services';
import { Paginated, Production } from '../../../../core/models';
import { PaginateProductionsDto } from '../../../../core/dto/productions';
import { CreateProductionComponent } from '../../dialogs/create-production';
import { UpdateProductionComponent } from '../../dialogs/update-production';
import { openDialog, buildTablePaginationParams, translocoEscape } from '../../../../core/utils';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-productions',
    templateUrl: './productions.component.html',
    styleUrls: ['./productions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, InputTextModule, ButtonModule, TableModule, SharedModule, ConfirmDialogModule]
})
export class ProductionsComponent implements OnInit, OnDestroy {
  @ViewChild('productionTable') productionTable?: Table;
  loadingProductionList: boolean = false;
  rowsPerPage: number = 10;
  productionList?: Paginated<Production>;
  selectedProductions?: Production[];

  constructor(private ref: ChangeDetectorRef,
    public dialogService: DialogService, private confirmAction: ConfirmActionService,
    private productionsService: ProductionsService, private translocoService: TranslocoService) { }

  ngOnInit(): void {
  }

  loadProductions(): void {
    const params: PaginateProductionsDto = buildTablePaginationParams(this.productionTable, {
      rowsPerPage: this.rowsPerPage, searchField: 'name'
    });
    this.loadingProductionList = true;
    this.productionsService.findPage(params).subscribe({
      next: (productionList) => {
        this.productionList = productionList;
        this.ref.markForCheck();
      }
    }).add(() => this.loadingProductionList = false);
  }

  showCreateProductionDialog(): void {
    const dialogRef = openDialog(this.dialogService, CreateProductionComponent, {
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      dismissableMask: true,
      closeOnEscape: true,
      closable: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadProductions();
    });
  }

  showUpdateProductionDialog(production: Production): void {
    const dialogRef = openDialog(this.dialogService, UpdateProductionComponent, {
      data: { ...production },
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      dismissableMask: true,
      closable: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadProductions();
    });
  }

  showDeleteProductionDialog(production: Production): void {
    const safeProductionName = translocoEscape(production.name);
    this.confirmAction.confirmDelete({
      message: this.translocoService.translate('admin.productions.deleteConfirmation', { name: safeProductionName }),
      header: this.translocoService.translate('admin.productions.deleteConfirmationHeader'),
      accept: () => this.removeProduction(production._id)
    });
  }

  removeProduction(id: string): void {
    this.productionsService.remove(id).subscribe().add(() => this.loadProductions());
  }

  onPage() {
    this.productionTable?.el.nativeElement.scrollIntoView();
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }

  ngOnDestroy(): void {
    this.dialogService.dialogComponentRefMap.forEach(dialogRef => {
      dialogRef.instance.close();
    });
  }

}
