import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';

// El backend usa un único endpoint de login para todos los roles; el rol real
// viene del JWT. El toggle Jugador/Administrador filtra en el cliente después
// del login: si el rol del JWT no corresponde al tab elegido, se trata como
// credenciales inválidas (con logout inmediato) en vez de dejar entrar a
// un jugador por el tab de administrador o viceversa.
type RoleTab = 'jugador' | 'admin';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly selectedTab = signal<RoleTab>('jugador');

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  selectTab(tab: RoleTab): void {
    this.selectedTab.set(tab);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();
    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        const rol = this.authService.role();
        // El tab "jugador" también cubre a un capitán (mismo tipo de cuenta,
        // el rol de capitán no tiene tab propio en el login).
        const coincideConTab =
          this.selectedTab() === 'admin' ? rol === 'admin' : rol === 'jugador' || rol === 'capitan';

        if (!coincideConTab) {
          this.authService.logout();
          this.errorMessage.set(
            this.selectedTab() === 'admin'
              ? 'No existe una cuenta de administrador con esas credenciales.'
              : 'No existe una cuenta de jugador con esas credenciales.',
          );
          return;
        }

        this.router.navigate([`/${rol}`]);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Usuario o contraseña incorrectos.');
      },
    });
  }
}
