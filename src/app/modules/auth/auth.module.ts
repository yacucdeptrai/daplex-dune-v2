import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { RecaptchaModule } from '../../shared/components/recaptcha';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

import { AuthRoutingModule } from './auth-routing.module';






import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ConfirmEmailComponent } from './pages/confirm-email/confirm-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

@NgModule({
    imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    TranslocoModule,
    RecaptchaModule,
    LazyLoadImageModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    SignInComponent,
    SignUpComponent,
    ConfirmEmailComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent
],
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'auth'
        }
    ]
})
export class AuthModule { }
