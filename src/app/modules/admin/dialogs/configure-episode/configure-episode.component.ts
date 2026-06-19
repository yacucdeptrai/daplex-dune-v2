
import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef, Renderer2, ViewChild, AfterViewInit, DOCUMENT } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { first, takeUntil } from 'rxjs';
import { cloneDeep } from 'lodash-es';

import { DropdownOptionDto, UpdateTVEpisodeDto } from '../../../../core/dto/media';
import { ConfirmActionService, DestroyService, ItemDataService, MediaFormHelperService, MediaScannerService, MediaService, QueueUploadService } from '../../../../core/services';
import { fileExtension, maxFileSize, shortDate } from '../../../../core/validators';
import { MediaDetails, MediaStream, MediaSubtitle, TVEpisodeDetails } from '../../../../core/models';
import { AddSubtitleForm, ShortDateForm, UpdateEpisodeForm } from '../../../../core/interfaces/forms';
import { FileUploadComponent } from '../../../../shared/components/file-upload';
import { AddSubtitleComponent } from '../add-subtitle';
import { ImageEditorComponent } from '../../../../shared/dialogs/image-editor';
import { AppErrorCode, MediaPStatus, MediaSourceStatus } from '../../../../core/enums';
import { openDialog, dataURItoBlob, translocoEscape, fixNestedDialogFocus, replaceDialogHideMethod, detectFormChange, secondsToTimeString, timeStringToSeconds } from '../../../../core/utils';
import {
  IMAGE_PREVIEW_SIZE, UPLOAD_STILL_ASPECT_HEIGHT, UPLOAD_STILL_ASPECT_WIDTH, UPLOAD_STILL_MIN_HEIGHT,
  UPLOAD_STILL_MIN_WIDTH, UPLOAD_STILL_SIZE, UPLOAD_SUBTITLE_EXT, UPLOAD_SUBTITLE_SIZE
} from '../../../../../environments/config';
import { ExtStreamSelected } from '../../../../core/interfaces/events';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { NgTemplateOutlet } from '@angular/common';
import { VerticalTabComponent } from '../../../../shared/components/vertical-tab/vertical-tab.component';
import { TabPanelDirective } from '../../../../shared/components/vertical-tab/tab-panel.directive';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { InputNumberModule } from 'primeng/inputnumber';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { PanelToastDirective } from '../../../../shared/components/vertical-tab/panel-toast.directive';
import { FileUploadComponent as FileUploadComponent_1 } from '../../../../shared/components/file-upload/file-upload.component';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { VideoPlayerComponent } from '../../../../shared/components/video-player/video-player.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';


@Component({
    selector: 'app-configure-episode',
    templateUrl: './configure-episode.component.html',
    styleUrls: ['./configure-episode.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ItemDataService,
        DestroyService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: ['common', 'media', 'languages']
        }
    ],
    imports: [TranslocoDirective, ButtonModule, TooltipModule, VerticalTabComponent, TabPanelDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, InputNumberModule, DisabledControlDirective, InvalidControlDirective, InputMaskModule, InputTextModule, LazyLoadImageModule, TextareaModule, SelectModule, RadioButtonModule, PanelToastDirective, FileUploadComponent_1, TableModule, SharedModule, NgTemplateOutlet, VideoPlayerComponent, ConfirmDialogModule, ProgressSpinnerModule, FirstErrorKeyPipe, ThumbhashUrlPipe]
})
export class ConfigureEpisodeComponent implements OnInit, AfterViewInit {
  @ViewChild('subtitleFileUpload') subtitleFileUpload?: FileUploadComponent;
  MediaSourceStatus = MediaSourceStatus;
  loadingEpisode: boolean = false;
  episode?: TVEpisodeDetails;
  previewStream?: MediaStream;
  updateEpisodeForm: FormGroup<UpdateEpisodeForm>;
  addSubtitleLanguages?: DropdownOptionDto[];
  addSubtitleForm: FormGroup<AddSubtitleForm>;
  updateEpisodeInitValue = {};
  updateEpisodeFormChanged: boolean = false;
  isScanning: boolean = false;
  isUpdatingStill: boolean = false;
  isUpdated: boolean = false;
  isUploadingSource: boolean = false;
  showEpisodePlayer: boolean = false;
  stillPreviewName?: string;
  stillPreviewUri?: string;
  days: DropdownOptionDto[] = [];
  months: DropdownOptionDto[] = [];
  years: DropdownOptionDto[] = [];
  languages: DropdownOptionDto[] = [];

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<{ media: MediaDetails, episode: TVEpisodeDetails }>,
    private dialogService: DialogService, private confirmAction: ConfirmActionService, private mediaService: MediaService,
    private itemDataService: ItemDataService, private queueUploadService: QueueUploadService,
    private mediaScannerService: MediaScannerService, private mediaFormHelper: MediaFormHelperService,
    private translocoService: TranslocoService, private destroyService: DestroyService) {
    const lang = this.translocoService.getActiveLang();
    this.addSubtitleForm = new FormGroup<AddSubtitleForm>({
      language: new FormControl(lang, Validators.required),
      file: new FormControl(null, [Validators.required, maxFileSize(UPLOAD_SUBTITLE_SIZE), fileExtension(UPLOAD_SUBTITLE_EXT)])
    }, { updateOn: 'change' });
    this.updateEpisodeForm = new FormGroup<UpdateEpisodeForm>({
      episodeNumber: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(10000)] }),
      name: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.minLength(10), Validators.maxLength(2000)] }),
      runtime: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(10000)]),
      airDate: new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', true), updateOn: 'change' }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required }),
      translate: new FormControl(lang, { nonNullable: true })
    }, { updateOn: 'change' });
  }

  ngOnInit(): void {
    this.loadEpisode();
    this.days = this.itemDataService.createDateList();
    this.months = this.itemDataService.createMonthList();
    this.years = this.itemDataService.createYearList();
    this.itemDataService.createLanguageList().subscribe(languages => this.languages = languages);
  }

  ngAfterViewInit(): void {
    replaceDialogHideMethod(this.dialogService, () => {
      this.closeDialog();
    }, this.dialogRef);
  }

  loadEpisode(): void {
    if (!this.config.data) return;
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.loadingEpisode = true;
    this.mediaService.findOneTVEpisode(mediaId, episodeId).subscribe(episode => {
      this.episode = episode;
      this.patchUpdateEpisodeForm(episode);
      this.loadSubtitleFormData(episode);
    }).add(() => {
      this.loadingEpisode = false;
      this.ref.markForCheck();
    });
  }

  onUpdateEpisodeFormSubmit(): void {
    if (this.updateEpisodeForm.invalid) return;
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.updateEpisodeForm.disable({ emitEvent: false });
    const formValue = this.updateEpisodeForm.getRawValue();
    const runtimeValue = timeStringToSeconds(formValue.runtime)!;
    const updateTVEpisodeDto: UpdateTVEpisodeDto = {
      epNumber: formValue.episodeNumber,
      name: formValue.name,
      overview: formValue.overview,
      runtime: runtimeValue,
      airDate: {
        day: formValue.airDate.day!,
        month: formValue.airDate.month!,
        year: formValue.airDate.year!
      },
      visibility: formValue.visibility
    };
    this.mediaService.updateTVEpisode(mediaId, episodeId, updateTVEpisodeDto).pipe(takeUntil(this.destroyService)).subscribe({
      next: (episode) => {
        this.episode = episode;
        this.updateEpisodeInitValue = cloneDeep(this.updateEpisodeForm.value);
        this.detectUpdateEpisodeFormChange();
        this.isUpdated = true;
      }
    }).add(() => {
      this.updateEpisodeForm.enable({ emitEvent: false });
      this.ref.markForCheck();
    });
  }

  onUpdateEpisodeFormReset(): void {
    this.updateEpisodeForm.reset(this.updateEpisodeInitValue);
    this.detectUpdateEpisodeFormChange();
  }

  // Scan is per-episode but the season is GLOBAL on the media, so it needs both a tmdb id and a set
  // tvSeason — there is no per-episode fallback.
  get canScanEpisode(): boolean {
    const media = this.config.data?.media;
    return !!media?.externalIds?.tmdb && media?.scanner?.tvSeason != null;
  }

  // Fetches one provider episode and auto-fills the general tab. The detect re-run (no init re-snapshot)
  // arms the unsaved-changes footer; the http-error interceptor owns the 503 toast.
  scanEpisode(): void {
    if (!this.canScanEpisode || this.isScanning || !this.episode) return;
    const media = this.config.data!.media;
    this.isScanning = true;
    this.mediaScannerService.findEpisode(media.externalIds.tmdb, media.scanner!.tvSeason!, this.episode.epNumber, { provider: 'tmdb' })
      .pipe(takeUntil(this.destroyService)).subscribe({
        next: (episode) => {
          this.detectUpdateEpisodeFormChange();
          this.mediaFormHelper.applyScannedEpisode(this.updateEpisodeForm, episode);
        }
      }).add(() => {
        this.isScanning = false;
        this.ref.markForCheck();
      });
  }

  detectUpdateEpisodeFormChange(): void {
    detectFormChange(this.updateEpisodeForm, this.updateEpisodeInitValue, () => {
      this.updateEpisodeFormChanged = false;
    }, () => {
      this.updateEpisodeFormChanged = true;
    }).pipe(takeUntil(this.destroyService)).subscribe();
  }

  onInputStillChange(event: Event): void {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length || !this.episode) return;
    if (element.files[0].size > IMAGE_PREVIEW_SIZE)
      throw new Error(AppErrorCode.UPLOAD_STILL_TOO_LARGE);
    const dialogRef = openDialog(this.dialogService, ImageEditorComponent, {
      data: {
        aspectRatioWidth: UPLOAD_STILL_ASPECT_WIDTH, aspectRatioHeight: UPLOAD_STILL_ASPECT_HEIGHT,
        minWidth: UPLOAD_STILL_MIN_WIDTH, minHeight: UPLOAD_STILL_MIN_HEIGHT,
        imageFile: element.files[0], maxSize: UPLOAD_STILL_SIZE
      },
      header: this.translocoService.translate('common.imageEditor.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    dialogRef.onClose.pipe(first()).subscribe((result: string[] | null) => {
      if (!result) return;
      const [previewUri, name] = result;
      this.stillPreviewName = name;
      this.stillPreviewUri = previewUri;
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
  }

  onUpdateStillSubmit(): void {
    if (!this.stillPreviewName) return;
    this.isUpdatingStill = true;
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    const stillBlob = dataURItoBlob(this.stillPreviewUri!);
    this.mediaService.uploadStill(mediaId, episodeId, stillBlob, this.stillPreviewName).subscribe({
      next: (paritalEpisode) => {
        this.stillPreviewName = undefined;
        this.stillPreviewUri = undefined;
        if (!this.episode) return;
        this.episode = { ...this.episode, ...paritalEpisode };
        this.isUpdated = true;
      }
    }).add(() => {
      this.isUpdatingStill = false;
      this.ref.markForCheck();
    });
  }

  onUpdateStillCancel(): void {
    this.stillPreviewName = undefined;
    this.stillPreviewUri = undefined;
    this.ref.markForCheck();
  }

  deleteStill(event: Event): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    const episodeNumber = this.config.data!.episode.epNumber;
    this.confirmAction.confirmDelete({
      key: 'inModalEpisode',
      message: this.translocoService.translate('admin.episode.deleteStillConfirmation', { episode: episodeNumber }),
      header: this.translocoService.translate('admin.episode.deleteStillConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteStill(mediaId, episodeId).subscribe({
          next: () => {
            if (!this.episode) return;
            this.episode = {
              ...this.episode, stillUrl: undefined, thumbnailStillUrl: undefined, smallStillUrl: undefined, fullStillUrl: undefined,
              stillColor: undefined, stillPlaceholder: undefined
            };
            this.isUpdated = true;
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  patchUpdateEpisodeForm(episode: TVEpisodeDetails): void {
    const runtimeValue = secondsToTimeString(episode.runtime);
    this.updateEpisodeForm.patchValue({
      episodeNumber: episode.epNumber,
      name: episode.name,
      overview: episode.overview || '',
      runtime: runtimeValue,
      airDate: {
        day: episode.airDate.day,
        month: episode.airDate.month,
        year: episode.airDate.year
      },
      visibility: episode.visibility
    });
    this.updateEpisodeInitValue = cloneDeep(this.updateEpisodeForm.value);
    this.detectUpdateEpisodeFormChange();
  }

  loadSubtitleFormData(episode: TVEpisodeDetails): void {
    const disabledLanguages = episode.subtitles.map((s: MediaSubtitle) => s.lang);
    this.itemDataService.createLanguageList(disabledLanguages).subscribe({
      next: languages => this.addSubtitleLanguages = languages
    });
  }

  showAddSubtitleDialog(file: File): void {
    if (!this.episode) return;
    if (file.size > UPLOAD_SUBTITLE_SIZE)
      throw new Error(AppErrorCode.UPLOAD_SUBTITLE_TOO_LARGE);
    this.subtitleFileUpload?.clear();
    const media = this.config.data!.media;
    const dialogRef = openDialog(this.dialogService, AddSubtitleComponent, {
      data: { media: { ...media }, episode: { ...this.episode }, file },
      width: '500px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    dialogRef.onClose.pipe(first()).subscribe((subtitles: MediaSubtitle[]) => {
      if (!subtitles || !this.episode) return;
      this.episode = { ...this.episode, subtitles };
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.dialogRef, this.dialogService, this.renderer, this.document);
  }

  deleteSubtitle(subtitle: MediaSubtitle, event: Event): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.confirmAction.confirmDelete({
      key: 'inModalEpisode',
      message: this.translocoService.translate('admin.media.deleteSubtitleConfirmation'),
      header: this.translocoService.translate('admin.media.deleteSubtitleConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteTVSubtitle(mediaId, episodeId, subtitle._id).subscribe({
          next: () => {
            if (!this.episode) return;
            const subtitles = this.episode.subtitles.filter(v => v._id !== subtitle._id);
            this.episode = { ...this.episode, subtitles };
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  checkUploadInQueue(): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.isUploadingSource = this.queueUploadService.isMediaInQueue(`${mediaId}:${episodeId}`);
  }

  uploadSource(file: File): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.queueUploadService.addToQueue(`${mediaId}:${episodeId}`, file, `media/${mediaId}/tv/episodes/${episodeId}/source`, `media/${mediaId}/tv/episodes/${episodeId}/source/:id`);
    this.isUploadingSource = true;
    this.ref.markForCheck();
  }

  showSourcePreview(): void {
    this.showEpisodePlayer = true;
    const mediaId = this.config.data!.media._id;
    const episodeNumber = this.config.data!.episode.epNumber;
    this.mediaService.findTVStreams(mediaId, episodeNumber, { preview: true }).subscribe((episode) => {
      this.previewStream = episode;
      this.ref.markForCheck();
    });
  }

  deleteSource(event: Event): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    const safeEpisodeName = translocoEscape(this.config.data!.episode.epNumber.toString());
    this.confirmAction.confirmDelete({
      key: 'inModalEpisode',
      message: this.translocoService.translate('admin.media.deleteSourceConfirmation', { name: safeEpisodeName }),
      header: this.translocoService.translate('admin.media.deleteSourceConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteTVSource(mediaId, episodeId).subscribe({
          next: () => {
            if (!this.episode) return;
            this.episode = { ...this.episode, status: MediaSourceStatus.PENDING, pStatus: MediaPStatus.PENDING };
            this.checkUploadInQueue();
            this.isUpdated = true;
          }
        }).add(() => {
          this.renderer.setProperty(element, 'disabled', false);
          this.ref.markForCheck();
        });
      }
    });
  }

  updateExtStreams(event: ExtStreamSelected): void {
    const mediaId = this.config.data!.media._id;
    const episodeId = this.config.data!.episode._id;
    this.mediaService.updateTVEpisode(mediaId, episodeId, { extStreams: event.streams }).subscribe({
      next: () => event.next(),
      error: () => event.error()
    });
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }

  closeDialog(): void {
    this.dialogRef.close(this.isUpdated);
  }

}
