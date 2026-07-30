import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';

type RoleTab = 'jugador' | 'admin';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmarPassword = group.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordMismatch: true };
}

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

  // Solo para admin: jugador se registra con el wizard de /auth/unirse (código -> equipo -> cuenta -> perfil).
  readonly form = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmarPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

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

    this.authService.registerAdmin(username, email, password).subscribe({
      next: () => this.autoLoginAndRedirect(username, password),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
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
