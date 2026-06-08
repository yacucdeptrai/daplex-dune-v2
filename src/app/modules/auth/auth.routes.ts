import { Routes } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ConfirmEmailComponent } from './pages/confirm-email/confirm-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

const authProvider = {
  provide: TRANSLOCO_SCOPE,
  useValue: 'auth'
};

export const AUTH_ROUTES: Routes = [
  {
    path: 'sign-in',
    component: SignInComponent,
    data: {
      title: 'signIn'
    },
    providers: [authProvider]
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    data: {
      title: 'signUp'
    },
    providers: [authProvider]
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent,
    data: {
      title: 'confirmEmail'
    },
    providers: [authProvider]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: {
      title: 'forgotPassword'
    },
    providers: [authProvider]
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: {
      title: 'resetPassword'
    },
    providers: [authProvider]
  }
];
