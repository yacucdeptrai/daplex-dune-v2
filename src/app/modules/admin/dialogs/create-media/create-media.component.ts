import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, Renderer2, Inject, AfterViewInit, DOCUMENT } from '@angular/core';

import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EMPTY, first, Observable, switchMap, takeUntil } from 'rxjs';
import { cloneDeep } from 'lodash-es';

import { AddVideoComponent } from '../add-video';
import { AddSubtitleComponent } from '../add-subtitle';
import { CreateEpisodeComponent } from '../create-episode';
import { StepperComponent } from '../../../../shared/components/stepper';
import { ImageEditorComponent, ImageEditorConfig } from '../../../../shared/dialogs/image-editor';
import { FileUploadComponent } from '../../../../shared/components/file-upload';
import { CreateMediaDto, DropdownOptionDto } from '../../../../core/dto/media';
import { AppErrorCode, MediaStatus, MediaType } from '../../../../core/enums';
import { ShortDateForm } from '../../../../core/interfaces/forms';
import { ExtStreamSelected } from '../../../../core/interfaces/events';
import { Genre, MediaCollection, MediaDetails, MediaSubtitle, MediaVideo, Production, ScannerMediaDetails, Tag } from '../../../../core/models';
import { DestroyService, ItemDataService, MediaService, QueueUploadService } from '../../../../core/services';
import { MediaFormHelperService, UpdateMediaForm as UpdateMediaFormHelper } from '../../../../core/services/media-form-helper.service';
import { MediaScannerImportComponent } from '../media-scanner-import';
import { shortDate } from '../../../../core/validators';
import { openDialog, dataURItoBlob, detectFormChange, fixNestedDialogFocus, replaceDialogHideMethod, timeStringToSeconds } from '../../../../core/utils';
import {
  IMAGE_PREVIEW_MIMES, IMAGE_PREVIEW_SIZE, UPLOAD_BACKDROP_ASPECT_HEIGHT, UPLOAD_BACKDROP_ASPECT_WIDTH, UPLOAD_BACKDROP_MIN_HEIGHT,
  UPLOAD_BACKDROP_MIN_WIDTH, UPLOAD_BACKDROP_SIZE, UPLOAD_POSTER_ASPECT_HEIGHT, UPLOAD_POSTER_ASPECT_WIDTH, UPLOAD_POSTER_MIN_HEIGHT,
  UPLOAD_POSTER_MIN_WIDTH, UPLOAD_POSTER_SIZE, UPLOAD_SUBTITLE_SIZE
} from '../../../../../environments/config';
import { StepperComponent as StepperComponent_1 } from '../../../../shared/components/stepper/stepper.component';
import { CdkStep, CdkStepperPrevious, CdkStepperNext } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { TextareaModule } from 'primeng/textarea';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { AltAutoComplete } from '../../../../core/utils/primeng/autocomplete';
import { SharedModule } from 'primeng/api';
import { ChipModule } from 'primeng/chip';
import { FileUploadComponent as FileUploadComponent_1 } from '../../../../shared/components/file-upload/file-upload.component';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface CreateMediaForm {
  type: FormControl<string>;
  title: FormControl<string>;
  originalTitle: FormControl<string | null>;
  overview: FormControl<string>;
  originalLanguage: FormControl<string | null>;
  genres: FormControl<Genre[] | null>;
  producers: FormControl<Production[] | null>;
  studios: FormControl<Production[] | null>;
  tags: FormControl<Tag[] | null>;
  collections: FormControl<MediaCollection[] | null>;
  runtime: FormControl<string | null>;
  adult: FormControl<boolean>;
  releaseDate: FormGroup<ShortDateForm>;
  lastAirDate?: FormGroup<ShortDateForm>;
  visibility: FormControl<number>;
  status: FormControl<string>;
}

interface UpdateMediaForm extends Omit<CreateMediaForm, 'type'> { }

@Component({
    selector: 'app-create-media',
    templateUrl: './create-media.component.html',
    styleUrls: ['./create-media.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ItemDataService,
        DestroyService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'common'
        }
    ],
    imports: [TranslocoDirective, StepperComponent_1, CdkStep, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, TextareaModule, InputMaskModule, SelectModule, NgTemplateOutlet, RadioButtonModule, ButtonModule, AltAutoComplete, SharedModule, ChipModule, FileUploadComponent_1, CdkStepperPrevious, CdkStepperNext, FirstErrorKeyPipe]
})
export class CreateMediaComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper?: StepperComponent;
  @ViewChild('posterFileUpload') posterFileUpload?: FileUploadComponent;
  @ViewChild('backdropFileUpload') backdropFileUpload?: FileUploadComponent;
  @ViewChild('subtitleFileUpload') subtitleFileUpload?: FileUploadComponent;
  MediaType = MediaType;
  media?: MediaDetails;
  hasPoster: boolean = false;
  isUpdatingPoster: boolean = false;
  hasBackdrop: boolean = false;
  isUpdatingBackdrop: boolean = false;
  videoCount: number = 0;
  subtitleCount: number = 0;
  episodeCount: number = 0;
  isUploadingSource: boolean = false;
  updateFormChanged: boolean = false;
  createMediaForm: FormGroup<CreateMediaForm>;
  updateMediaForm: FormGroup<UpdateMediaForm>;
  updateMediaInitValue: {} = {};
  days: DropdownOptionDto[] = [];
  months: DropdownOptionDto[] = [];
  years: DropdownOptionDto[] = [];
  languages: DropdownOptionDto[] = [];
  genreSuggestions: Genre[] = [];
  productionSuggestions: Production[] = [];
  tagSuggestions: Tag[] = [];
  collectionSuggestions: MediaCollection[] = [];

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef,
    private dialogRef: DynamicDialogRef, private dialogService: DialogService, private config: DynamicDialogConfig<{ type: string }>,
    private renderer: Renderer2, private translocoService: TranslocoService,
    private mediaService: MediaService, private mediaFormHelper: MediaFormHelperService,
    private queueUploadService: QueueUploadService, private itemDataService: ItemDataService,
    private destroyService: DestroyService) {
    const mediaType = this.config.data!.type || MediaType.MOVIE;
    // Create media form
    this.createMediaForm = new FormGroup<CreateMediaForm>({
      type: new FormControl(mediaType, { nonNullable: true }),
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      originalTitle: new FormControl(null, [Validators.maxLength(500)]),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] }),
      originalLanguage: new FormControl(null),
      genres: new FormControl(null),
      producers: new FormControl(null),
      studios: new FormControl(null),
      tags: new FormControl(null),
      collections: new FormControl(null),
      runtime: new FormControl(null, [Validators.required]),
      adult: new FormControl(false, { nonNullable: true, validators: Validators.required }),
      releaseDate: new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', true), updateOn: 'change' }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required }),
      status: new FormControl(MediaStatus.RELEASED, { nonNullable: true, validators: Validators.required })
    }, { updateOn: 'change' });
    // Update media form
    this.updateMediaForm = new FormGroup<UpdateMediaForm>({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      originalTitle: new FormControl('', [Validators.maxLength(500)]),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] }),
      originalLanguage: new FormControl(''),
      genres: new FormControl(null),
      producers: new FormControl(null),
      studios: new FormControl(null),
      tags: new FormControl(null),
      collections: new FormControl(null),
      runtime: new FormControl(null, [Validators.required]),
      adult: new FormControl(false, { nonNullable: true, validators: Validators.required }),
      releaseDate: new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', true), updateOn: 'change' }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required }),
      status: new FormControl(MediaStatus.RELEASED, { nonNullable: true, validators: Validators.required })
    }, { updateOn: 'change' });
    if (mediaType === MediaType.TV) {
      // Add last air date control for TV Show
      this.createMediaForm.addControl('lastAirDate', new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', false), updateOn: 'change' }));
      this.createMediaForm.get('status')?.setValue(MediaStatus.AIRED);
      this.updateMediaForm.addControl('lastAirDate', new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', false), updateOn: 'change' }));
    }
  }

  ngOnInit(): void {
    const { days, months, years } = this.mediaFormHelper.buildDateLists(this.itemDataService);
    this.days = days;
    this.months = months;
    this.years = years;
    this.mediaFormHelper.createLanguageList(this.itemDataService).subscribe(languages => {
      this.languages = languages
    });
  }

  ngAfterViewInit(): void {
    replaceDialogHideMethod(this.dialogService, () => {
      this.closeDialog();
    }, this.dialogRef);
  }

  loadGenreSuggestions(search?: string): void {
    this.mediaFormHelper.findGenreSuggestions(search).subscribe({
      next: genres => this.genreSuggestions = genres
    }).add(() => this.ref.markForCheck());
  }

  loadProductionSuggestions(search?: string): void {
    this.mediaFormHelper.findProductionSuggestions(search).subscribe({
      next: productions => this.productionSuggestions = productions
    }).add(() => this.ref.markForCheck());
  }

  loadTagSuggestions(search?: string): void {
    this.mediaFormHelper.findTagSuggestions(search).subscribe({
      next: tags => this.tagSuggestions = tags
    }).add(() => this.ref.markForCheck());
  }

  loadCollectionSuggestions(search?: string): void {
    this.mediaFormHelper.findCollectionSuggestions(search).subscribe({
      next: collections => this.collectionSuggestions = collections
    }).add(() => this.ref.markForCheck());
  }

  onCreateMediaFormSubmit(): void {
    if (this.createMediaForm.invalid) return;
    this.createMediaForm.disable({ emitEvent: false });
    const formValue = this.createMediaForm.getRawValue();
    const genreIds = formValue.genres?.map(g => g._id) || [];
    const studioIds = formValue.studios?.map(p => p._id) || [];
    const producerIds = formValue.producers?.map(p => p._id) || [];
    const tagIds = formValue.tags?.map(p => p._id) || [];
    // Existing collections only — drop any create-on-the-fly sentinel (backend has no find-or-create).
    const collectionIds = formValue.collections?.map(c => c._id).filter(id => !id.startsWith('create:name=')) || [];
    const runtimeValue = timeStringToSeconds(formValue.runtime)!;
    const createMediaDto: CreateMediaDto = {
      type: formValue.type,
      title: formValue.title,
      originalTitle: formValue.originalTitle || null,
      overview: formValue.overview,
      genres: genreIds,
      originalLang: formValue.originalLanguage,
      producers: producerIds,
      studios: studioIds,
      tags: tagIds,
      inCollections: collectionIds,
      runtime: runtimeValue,
      adult: formValue.adult,
      releaseDate: {
        day: formValue.releaseDate.day!,
        month: formValue.releaseDate.month!,
        year: formValue.releaseDate.year!
      },
      visibility: formValue.visibility,
      status: formValue.status
    };
    if (createMediaDto.type === MediaType.TV) {
      if (formValue.lastAirDate && formValue.lastAirDate.day && formValue.lastAirDate.month && formValue.lastAirDate.year) {
        createMediaDto.lastAirDate = {
          day: formValue.lastAirDate.day,
          month: formValue.lastAirDate.month,
          year: formValue.lastAirDate.year
        }
      } else {
        createMediaDto.lastAirDate = null;
      }
    }
    this.mediaService.create(createMediaDto).pipe(takeUntil(this.destroyService)).subscribe({
      next: (media) => {
        this.media = media;
        this.patchUpdateMediaForm(media);
        this.ref.markForCheck();
        this.stepper?.next();
      }
    }).add(() => {
      this.createMediaForm.enable({ emitEvent: false });
    });
  }

  // Opens the provider-search dialog; on pick, auto-fills the create form's text/date/genre controls
  // (no externalIds control on the create form — applyScannedData skips it).
  openScannerImport(): void {
    const type = this.createMediaForm.controls.type.value;
    const dialogRef = openDialog(this.dialogService, MediaScannerImportComponent, {
      data: { type },
      header: this.translocoService.translate('admin.scannerImport.header'),
      width: '560px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
    dialogRef.onClose.pipe(first()).subscribe((details: ScannerMediaDetails | undefined) => {
      if (!details) return;
      // CreateMediaForm is structurally UpdateMediaForm plus `type`; cast to the helper's shared shape.
      const form = this.createMediaForm as unknown as FormGroup<UpdateMediaFormHelper>;
      this.mediaFormHelper.applyScannedData(form, details, type as MediaType, this.languages)
        .pipe(takeUntil(this.destroyService)).subscribe().add(() => this.ref.markForCheck());
    });
  }

  onCreateMediaFormCancel(): void {
    this.dialogRef.close(this.media);
  }

  patchUpdateMediaForm(media: MediaDetails): void {
    this.mediaFormHelper.patchUpdateMediaForm(this.updateMediaForm, media);
    this.updateMediaInitValue = cloneDeep(this.updateMediaForm.value);
    this.detectUpdateMediaFormChange();
  }

  detectUpdateMediaFormChange(): void {
    detectFormChange(this.updateMediaForm, this.updateMediaInitValue, () => {
      this.updateFormChanged = false;
    }, () => {
      this.updateFormChanged = true;
    }).pipe(takeUntil(this.destroyService)).subscribe().add(() => {
      this.ref.markForCheck();
    });
  }

  onUpdateMediaFormSubmit(): void {
    if (!this.updateFormChanged)
      return this.stepper?.next();
    if (!this.media || this.updateMediaForm.invalid) return;
    this.updateMediaForm.disable({ emitEvent: false });
    const mediaId = this.media._id;
    const formValue = this.updateMediaForm.getRawValue();
    const updateMediaDto = this.mediaFormHelper.toUpdateMediaDto(formValue, this.media);
    this.mediaService.update(mediaId, updateMediaDto).pipe(takeUntil(this.destroyService)).subscribe(media => {
      this.media = media;
      this.updateMediaInitValue = cloneDeep(this.updateMediaForm.value);
      this.detectUpdateMediaFormChange();
      this.ref.markForCheck();
      this.stepper?.next()
    }).add(() => {
      this.updateMediaForm.enable({ emitEvent: false });
    });
  }

  onUpdateMediaFormReset(): void {
    this.updateMediaForm.reset(this.updateMediaInitValue);
    this.detectUpdateMediaFormChange();
  }

  onInputPosterChange(file: File): void {
    if (!this.media) return;
    if (file.size > IMAGE_PREVIEW_SIZE)
      throw new Error(AppErrorCode.UPLOAD_POSTER_TOO_LARGE);
    if (!IMAGE_PREVIEW_MIMES.includes(file.type))
      throw new Error(AppErrorCode.UPLOAD_POSTER_UNSUPORTED);
    this.editImage({
      aspectRatioWidth: UPLOAD_POSTER_ASPECT_WIDTH, aspectRatioHeight: UPLOAD_POSTER_ASPECT_HEIGHT,
      minWidth: UPLOAD_POSTER_MIN_WIDTH, minHeight: UPLOAD_POSTER_MIN_HEIGHT,
      imageFile: file, maxSize: UPLOAD_POSTER_SIZE
    }).pipe(switchMap(result => {
      if (!result) return EMPTY;
      const [previewUri, name] = result;
      const posterBlob = dataURItoBlob(previewUri);
      return this.mediaService.uploadPoster(this.media!._id, posterBlob, name);
    })).subscribe(paritalMedia => {
      this.posterFileUpload?.clear();
      this.media = { ...this.media, ...paritalMedia };
      this.hasPoster = true;
      this.ref.markForCheck();
    });
  }

  onInputBackdropChange(file: File): void {
    if (!this.media) return;
    if (file.size > IMAGE_PREVIEW_SIZE)
      throw new Error(AppErrorCode.UPLOAD_BACKDROP_TOO_LARGE);
    if (!IMAGE_PREVIEW_MIMES.includes(file.type))
      throw new Error(AppErrorCode.UPLOAD_BACKDROP_UNSUPORTED);
    this.editImage({
      aspectRatioWidth: UPLOAD_BACKDROP_ASPECT_WIDTH, aspectRatioHeight: UPLOAD_BACKDROP_ASPECT_HEIGHT,
      minWidth: UPLOAD_BACKDROP_MIN_WIDTH, minHeight: UPLOAD_BACKDROP_MIN_HEIGHT,
      imageFile: file, maxSize: UPLOAD_BACKDROP_SIZE
    }).pipe(switchMap(result => {
      if (!result) return EMPTY;
      const [previewUri, name] = result;
      const backdropBlob = dataURItoBlob(previewUri);
      return this.mediaService.uploadBackdrop(this.media!._id, backdropBlob, name);
    })).subscribe(paritalMedia => {
      this.backdropFileUpload?.clear();
      this.media = { ...this.media, ...paritalMedia };
      this.hasBackdrop = true;
      this.ref.markForCheck();
    });
  }

  editImage(data: ImageEditorConfig): Observable<string[] | null> {
    const dialogRef = openDialog(this.dialogService, ImageEditorComponent, {
      data: data,
      header: this.translocoService.translate('common.imageEditor.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
    return dialogRef.onClose.pipe(first());
  }

  showAddVideoDialog(): void {
    if (!this.media) return;
    const dialogRef = openDialog(this.dialogService, AddVideoComponent, {
      data: { ...this.media },
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm app-form-dialog'
    });
    dialogRef.onClose.pipe(first()).subscribe((videos: MediaVideo[]) => {
      if (!videos || !this.media) return;
      this.media.videos = videos;
      this.videoCount++;
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
  }

  showAddSubtitleDialog(file?: File): void {
    if (this.media?.type !== MediaType.MOVIE) return;
    if (file && file.size > UPLOAD_SUBTITLE_SIZE)
      throw new Error(AppErrorCode.UPLOAD_SUBTITLE_TOO_LARGE);
    this.subtitleFileUpload?.clear();
    const dialogRef = openDialog(this.dialogService, AddSubtitleComponent, {
      data: { media: { ...this.media }, file: file },
      width: '500px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm app-form-dialog'
    });
    dialogRef.onClose.pipe(first()).subscribe((subtitles: MediaSubtitle[]) => {
      if (!subtitles || !this.media) return;
      this.media.movie.subtitles = subtitles;
      this.subtitleCount++;
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
  }

  showAddEpisodeDialog(): void {
    if (this.media?.type !== MediaType.TV) return;
    const dialogRef = openDialog(this.dialogService, CreateEpisodeComponent, {
      data: { media: { ...this.media }, episodes: [...this.media.tv.episodes] },
      width: '980px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm app-form-dialog',
      contentStyle: { 'overflow-y': 'hidden', 'padding': '0px' }
    });
    dialogRef.onClose.pipe(first()).subscribe((episode: any) => {
      if (!episode || !this.media) return;
      this.media.tv.episodes.push(episode);
      this.episodeCount++;
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
  }

  uploadSource(file: File): void {
    if (this.media?.type !== MediaType.MOVIE) return;
    this.queueUploadService.addToQueue(this.media._id, file, `media/${this.media._id}/movie/source`, `media/${this.media._id}/movie/source/:id`);
    this.isUploadingSource = true;
    this.ref.markForCheck();
  }

  updateExtStreams(event: ExtStreamSelected): void {
    if (this.media?.type !== MediaType.MOVIE) return;
    this.mediaService.update(this.media._id, { extStreams: event.streams }).subscribe({
      next: () => event.next(),
      error: () => event.error()
    });
  }

  closeDialog(): void {
    this.dialogRef.close(this.media);
  }

}
