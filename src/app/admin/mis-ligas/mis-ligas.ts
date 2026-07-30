import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { Liga, LigaService } from '../../shared/services/liga';

@Component({
  selector: 'app-mis-ligas',
  imports: [RouterLink],
  templateUrl: './mis-ligas.html',
  styleUrl: './mis-ligas.scss',
})
export class MisLigas implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ligaService = inject(LigaService);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly role = this.authService.role;

  readonly cargando = signal(true);
  readonly ligas = signal<Liga[]>([]);

  ngOnInit(): void {
    if (!this.isAuthenticated() || this.role() !== 'admin') {
      this.cargando.set(false);
      return;
    }
    this.ligaService.listar().subscribe({
      next: (ligas) => {
        this.ligas.set(ligas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
