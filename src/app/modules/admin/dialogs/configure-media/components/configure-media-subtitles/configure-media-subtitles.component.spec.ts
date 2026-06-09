import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, throwError } from 'rxjs';

import { ConfigureMediaSubtitlesComponent } from './configure-media-subtitles.component';
import { ConfirmActionService, MediaService } from '../../../../../../core/services';
import { MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaSubtitlesComponent (movie subtitle tab).
 * Mirror the parent/Images stub pattern: behavior is driven through methods + service spies, not
 * rendered DOM. Beyond the moved behavior, these prove the NG0201-relevant DI — the child injects
 * the route-scoped ConfirmActionService / DialogService from the surrounding injector tree (never
 * re-provided in the child), exactly as it would inside the dialog.
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE,
    status: MediaStatus.RELEASED,
    movie: { status: MediaSourceStatus.DONE, subtitles: [{ _id: 'a', lang: 'en' }, { _id: 'b', lang: 'fr' }] },
    ...overrides
  };
}

describe('ConfigureMediaSubtitlesComponent', () => {
  let component: ConfigureMediaSubtitlesComponent;
  let fixture: ComponentFixture<ConfigureMediaSubtitlesComponent>;
  let mediaService: any;
  let dialogService: any;
  let confirmationService: ConfirmationService;

  function create(media: any = makeMovieMedia()) {
    mediaService = {
      deleteMovieSubtitle: jasmine.createSpy('deleteMovieSubtitle').and.returnValue(of(undefined))
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaSubtitlesComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ConfigureMediaSubtitlesComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaSubtitlesComponent);
        component = fixture.componentInstance;
        dialogService = TestBed.inject(DialogService) as any;
        confirmationService = TestBed.inject(ConfirmationService);
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  it('should create (injects route-scoped ConfirmActionService/DialogService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('showAddSubtitleDialog opens AddSubtitleComponent and emits merged subtitles on close', async () => {
    await create();
    const newSubs = [{ _id: 'a', lang: 'en' }, { _id: 'b', lang: 'fr' }, { _id: 'c', lang: 'de' }];
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(newSubs) };
    dialogService.open.and.returnValue(closeRef);
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.showAddSubtitleDialog();
    expect(dialogService.open).toHaveBeenCalled();
    expect(merged.movie.subtitles).toBe(newSubs);
  });

  it('showAddSubtitleDialog onClose no-ops when the dialog returns no subtitles', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(undefined) };
    dialogService.open.and.returnValue(closeRef);
    let emitted = false;
    component.mediaChange.subscribe(() => (emitted = true));
    component.showAddSubtitleDialog();
    expect(emitted).toBeFalse();
  });

  it('showAddSubtitleDialog throws when the chosen file exceeds UPLOAD_SUBTITLE_SIZE', async () => {
    await create();
    const big = new File([''], 's.vtt');
    Object.defineProperty(big, 'size', { value: 8388608 + 1 });
    expect(() => component.showAddSubtitleDialog(big)).toThrowError(/uploadSubtitleTooLarge/);
  });

  it('deleteSubtitle confirms with key:"inModal" and the delete-subtitle header', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    component.deleteSubtitle({ _id: 'a' } as any, { target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deleteSubtitleConfirmationHeader');
    expect(typeof arg.accept).toBe('function');
  });

  it('deleteSubtitle accept deletes via service and emits the filtered subtitles', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.deleteSubtitle({ _id: 'a' } as any, { target: document.createElement('button') } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(mediaService.deleteMovieSubtitle).toHaveBeenCalledWith(MEDIA_ID, 'a');
    expect(merged.movie.subtitles.map((s: any) => s._id)).toEqual(['b']);
  });

  it('deleteSubtitle error path re-enables the trigger element', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    mediaService.deleteMovieSubtitle.and.returnValue(throwError(() => new Error('nope')));
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deleteSubtitle({ _id: 'a' } as any, { target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });
});
