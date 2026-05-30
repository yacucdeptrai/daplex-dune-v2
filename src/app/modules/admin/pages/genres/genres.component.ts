import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { first } from 'rxjs';

import { PaginateGenresDto } from '../../../../core/dto/genres';
import { Genre, Paginated } from '../../../../core/models';
import { ConfirmActionService, GenresService } from '../../../../core/services';
import { CreateGenreComponent } from '../../dialogs/create-genre';
import { UpdateGenreComponent } from '../../dialogs/update-genre';
import { buildTablePaginationParams, translocoEscape } from '../../../../core/utils';

@Component({
    selector: 'app-genres',
    templateUrl: './genres.component.html',
    styleUrls: ['./genres.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class GenresComponent implements OnInit, OnDestroy {
  @ViewChild('genreTable') genreTable?: Table;
  loadingGenreList: boolean = false;
  rowsPerPage: number = 10;
  genreList?: Paginated<Genre>;
  selectedGenres?: Genre[];

  constructor(private ref: ChangeDetectorRef,
    public dialogService: DialogService, private confirmAction: ConfirmActionService, private genresService: GenresService,
    private translocoService: TranslocoService) { }

  ngOnInit(): void {
  }

  loadGenres(): void {
    const params: PaginateGenresDto = buildTablePaginationParams(this.genreTable, {
      rowsPerPage: this.rowsPerPage, searchField: 'name'
    });
    this.loadingGenreList = true;
    this.genresService.findPage(params).subscribe({
      next: (genreList) => {
        this.genreList = genreList;
        this.ref.markForCheck();
      }
    }).add(() => this.loadingGenreList = false);
  }

  showCreateGenreDialog(): void {
    const dialogRef = this.dialogService.open(CreateGenreComponent, {
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' },
      dismissableMask: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadGenres();
    });
  }

  showUpdateGenreDialog(genre: Genre): void {
    const dialogRef = this.dialogService.open(UpdateGenreComponent, {
      data: { ...genre },
      width: '500px',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' },
      dismissableMask: true
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadGenres();
    });
  }

  showDeleteGenreDialog(genre: Genre): void {
    const safeGenreName = translocoEscape(genre.name);
    this.confirmAction.confirmDelete({
      message: this.translocoService.translate('admin.genres.deleteConfirmation', { name: safeGenreName }),
      header: this.translocoService.translate('admin.genres.deleteConfirmationHeader'),
      accept: () => this.removeGenre(genre._id)
    });
  }

  removeGenre(id: string): void {
    this.genresService.remove(id).subscribe().add(() => this.loadGenres());
  }

  onPage() {
    this.genreTable?.el.nativeElement.scrollIntoView();
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
