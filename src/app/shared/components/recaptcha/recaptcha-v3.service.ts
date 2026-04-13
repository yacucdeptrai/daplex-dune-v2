import { Inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { RecaptchaLoaderService } from './recaptcha-loader.service';
import { RECAPTCHA_V3_SITE_KEY } from './tokens';
import type { RecaptchaV2Api } from './recaptcha.types';

export interface OnExecuteData {
  action: string;
  token: string;
}

export interface OnExecuteErrorData {
  action: string;
  error: unknown;
}

type ActionBacklogEntry = [string, Subject<string>];

@Injectable()
export class ReCaptchaV3Service {
  private actionBacklog?: ActionBacklogEntry[];
  private grecaptcha?: RecaptchaV2Api;

  private onExecuteSubject?: Subject<OnExecuteData>;
  private onExecuteErrorSubject?: Subject<OnExecuteErrorData>;

  constructor(
    private readonly zone: NgZone,
    private readonly recaptchaLoader: RecaptchaLoaderService,
    @Inject(RECAPTCHA_V3_SITE_KEY) private readonly siteKey: string
  ) {
    this.init();
  }

  get onExecute(): Observable<OnExecuteData> {
    if (!this.onExecuteSubject) {
      this.onExecuteSubject = new Subject<OnExecuteData>();
    }
    return this.onExecuteSubject.asObservable();
  }

  get onExecuteError(): Observable<OnExecuteErrorData> {
    if (!this.onExecuteErrorSubject) {
      this.onExecuteErrorSubject = new Subject<OnExecuteErrorData>();
    }
    return this.onExecuteErrorSubject.asObservable();
  }

  execute(action: string): Observable<string> {
    const subject = new Subject<string>();
    if (!this.grecaptcha) {
      this.actionBacklog ??= [];
      this.actionBacklog.push([action, subject]);
    } else {
      this.executeActionWithSubject(action, subject);
    }
    return subject.asObservable();
  }

  private executeActionWithSubject(action: string, subject: Subject<string>): void {
    const onError = (error: unknown) => {
      this.zone.run(() => {
        subject.error(error);
        this.onExecuteErrorSubject?.next({ action, error });
      });
    };

    this.zone.runOutsideAngular(() => {
      if (!this.grecaptcha) {
        onError(new Error('reCAPTCHA not loaded'));
        return;
      }
      try {
        this.grecaptcha.execute(this.siteKey, { action }).then((token: string) => {
          this.zone.run(() => {
            subject.next(token);
            subject.complete();
            this.onExecuteSubject?.next({ action, token });
          });
        }, onError);
      } catch (error) {
        onError(error);
      }
    });
  }

  private init(): void {
    this.recaptchaLoader.ready.subscribe((value) => {
      this.grecaptcha = value;
      if (this.actionBacklog?.length) {
        this.actionBacklog.forEach(([action, subject]) => this.executeActionWithSubject(action, subject));
        this.actionBacklog = undefined;
      }
    });
  }
}
