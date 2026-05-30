import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

const DELETE_ICON = 'ms ms-delete';
const DELETE_DEFAULT_FOCUS = 'reject';

export interface ConfirmDeleteOptions {
  /** Already-translated confirmation message. */
  message: string;
  /** Already-translated confirmation header. */
  header: string;
  /** Invoked when the user confirms the deletion. */
  accept: () => void;
  /** PrimeNG confirm-dialog key, when the dialog is scoped (e.g. 'default', 'inModal'). */
  key?: string;
}

/**
 * Thin wrapper over PrimeNG's {@link ConfirmationService} that centralizes the
 * delete-confirmation dialog configuration (icon + default focus) shared across
 * the admin and user list/detail pages. Keeps call sites expressing intent
 * (`confirmDelete`) instead of repeating the PrimeNG confirm config.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmActionService {
  constructor(private readonly confirmationService: ConfirmationService) {}

  confirmDelete(options: ConfirmDeleteOptions): void {
    this.confirmationService.confirm({
      ...(options.key !== undefined ? { key: options.key } : {}),
      message: options.message,
      header: options.header,
      icon: DELETE_ICON,
      defaultFocus: DELETE_DEFAULT_FOCUS,
      accept: options.accept
    });
  }
}
