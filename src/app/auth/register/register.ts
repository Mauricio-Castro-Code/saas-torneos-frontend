import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';

type RoleTab = 'jugador' | 'admin';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedTab = signal<RoleTab>('jugador');

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  selectTab(tab: RoleTab): void {
    this.selectedTab.set(tab);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, email, password } = this.form.getRawValue();

    const onSuccess = () => this.autoLoginAndRedirect(username, password);
    const onError = (err: HttpErrorResponse) => {
      this.loading.set(false);
      this.errorMessage.set(this.extractErrorMessage(err));
    };

    if (this.selectedTab() === 'admin') {
      this.authService.registerAdmin(username, email, password).subscribe({ next: onSuccess, error: onError });
    } else {
      this.authService.registerJugador(username, email, password).subscribe({ next: onSuccess, error: onError });
    }
  }

  private autoLoginAndRedirect(username: string, password: string): void {
    // El registro no regresa JWT: hacemos login inmediatamente después para
    // dejar al usuario autenticado y decidir la ruta según el rol real del token.
    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate([`/${this.authService.role()}`]);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login']);
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object') {
      const messages = Object.values(body).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return 'No se pudo completar el registro. Intenta de nuevo.';
  }
}
