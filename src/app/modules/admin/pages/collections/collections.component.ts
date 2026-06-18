import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { first } from 'rxjs';

import { PaginateCollectionsDto } from '../../../../core/dto/collections';
import { MediaCollection, Paginated } from '../../../../core/models';
import { CollectionService, ConfirmActionService } from '../../../../core/services';
import { CreateCollectionComponent } from '../../dialogs/create-collection';
import { UpdateCollectionComponent } from '../../dialogs/update-collection';
import { openDialog, buildTablePaginationParams, translocoEscape } from '../../../../core/utils';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-collections',
    templateUrl: './collections.component.html',
    styleUrls: ['./collections.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, InputTextModule, ButtonModule, TableModule, SharedModule, ConfirmDialogModule]
})
export class CollectionsComponent implements OnInit, OnDestroy {
  @ViewChild('collectionTable') collectionTable?: Table;
  loadingCollectionList: boolean = false;
  rowsPerPage: number = 10;
  collectionList?: Paginated<MediaCollection>;
  selectedCollections?: MediaCollection[];

  constructor(private ref: ChangeDetectorRef,
    public dialogService: DialogService, private confirmAction: ConfirmActionService, private collectionService: CollectionService,
    private translocoService: TranslocoService) { }

  ngOnInit(): void {
  }

  loadCollections(): void {
    const params: PaginateCollectionsDto = buildTablePaginationParams(this.collectionTable, {
      rowsPerPage: this.rowsPerPage, searchField: 'name'
    });
    this.loadingCollectionList = true;
    this.collectionService.findPage(params).subscribe({
      next: (collectionList) => {
        this.collectionList = collectionList;
        this.ref.markForCheck();
      }
    }).add(() => {
      this.loadingCollectionList = false;
      this.ref.markForCheck();
    });
  }

  showCreateCollectionDialog(): void {
    const dialogRef = openDialog(this.dialogService, CreateCollectionComponent, {
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      dismissableMask: true,
      closeOnEscape: true,
      closable: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadCollections();
    });
  }

  showUpdateCollectionDialog(collection: MediaCollection): void {
    const dialogRef = openDialog(this.dialogService, UpdateCollectionComponent, {
      data: { ...collection },
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      dismissableMask: true,
      closable: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadCollections();
    });
  }

  showDeleteCollectionDialog(collection: MediaCollection): void {
    const safeCollectionName = translocoEscape(collection.name);
    this.confirmAction.confirmDelete({
      message: this.translocoService.translate('admin.collections.deleteConfirmation', { name: safeCollectionName }),
      header: this.translocoService.translate('admin.collections.deleteConfirmationHeader'),
      accept: () => this.removeCollection(collection._id)
    });
  }

  removeCollection(id: string): void {
    this.collectionService.remove(id).subscribe().add(() => this.loadCollections());
  }

  onPage() {
    this.collectionTable?.el.nativeElement.scrollIntoView();
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
