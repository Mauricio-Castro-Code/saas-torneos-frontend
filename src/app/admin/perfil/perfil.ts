import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { EquipoService } from '../../shared/services/equipo';
import { LigaService } from '../../shared/services/liga';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ligaService = inject(LigaService);
  private readonly equipoService = inject(EquipoService);
  private readonly router = inject(Router);

  readonly username = this.authService.username;
  readonly email = this.authService.email;
  readonly role = this.authService.role;

  readonly iniciales = computed(() => (this.username() ?? '?').slice(0, 2).toUpperCase());

  readonly cargando = signal(true);
  readonly totalLigas = signal(0);
  readonly totalEquipos = signal(0);
  readonly notaFoto = signal<string | null>(null);

  ngOnInit(): void {
    this.ligaService.listar().subscribe({
      next: (ligas) => this.totalLigas.set(ligas.length),
    });
    this.equipoService.listar().subscribe({
      next: (equipos) => {
        this.totalEquipos.set(equipos.length);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  editarFoto(): void {
    this.notaFoto.set('Subir foto de perfil: próximamente (el modelo de usuario no tiene ese campo todavía).');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
