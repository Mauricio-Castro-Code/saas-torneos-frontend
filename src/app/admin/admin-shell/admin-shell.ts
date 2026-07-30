import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { Liga, LigaService } from '../../shared/services/liga';
import { Equipo, EquipoService } from '../../shared/services/equipo';
import { Jornada, MatchesService, Partido } from '../../shared/services/matches';

// Vista improvisada para probar el flujo Liga -> Equipo -> Jugador end-to-end
// mientras no existe el mockup definitivo de gestión de equipos. Oculta la
// jerarquía real Liga > Temporada > Categoria > Equipo detrás de "crear equipo".
@Component({
  selector: 'app-admin-shell',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ligaService = inject(LigaService);
  private readonly equipoService = inject(EquipoService);
  private readonly matchesService = inject(MatchesService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly role = this.authService.role;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly copiado = signal(false);

  readonly liga = signal<Liga | null>(null);
  private readonly categoriaId = signal<number | null>(null);
  readonly equipos = signal<Equipo[]>([]);

  readonly jornada = signal<Jornada | null>(null);
  readonly partidos = signal<Partido[]>([]);

  readonly ligaForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });

  readonly equipoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });

  readonly jornadaForm = this.fb.nonNullable.group({
    numero: [1, Validators.required],
  });

  readonly partidoForm = this.fb.nonNullable.group({
    equipoLocal: ['', Validators.required],
    equipoVisitante: ['', Validators.required],
  });

  crearLiga(): void {
    if (this.ligaForm.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { nombre } = this.ligaForm.getRawValue();
    this.ligaService.crear({ nombre }).subscribe({
      next: (liga) => {
        this.liga.set(liga);
        this.equipoService.crearCategoriaPorDefecto(liga.id).subscribe({
          next: (categoria) => {
            this.loading.set(false);
            this.categoriaId.set(categoria.id);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.errorMessage.set(this.extractErrorMessage(err));
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  crearEquipo(): void {
    const categoriaId = this.categoriaId();
    if (this.equipoForm.invalid || categoriaId === null) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { nombre } = this.equipoForm.getRawValue();
    this.equipoService.crear(categoriaId, nombre).subscribe({
      next: (equipo) => {
        this.loading.set(false);
        this.equipos.update((actuales) => [...actuales, equipo]);
        this.equipoForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  refrescarEquipos(): void {
    const categoriaId = this.categoriaId();
    if (categoriaId === null) {
      return;
    }
    this.loading.set(true);
    this.equipoService.listar().subscribe({
      next: (todos) => {
        this.loading.set(false);
        this.equipos.set(todos.filter((e) => e.categoria === categoriaId));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  crearJornada(): void {
    const categoriaId = this.categoriaId();
    if (this.jornadaForm.invalid || categoriaId === null) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { numero } = this.jornadaForm.getRawValue();
    this.matchesService.crearJornada(categoriaId, numero).subscribe({
      next: (jornada) => {
        this.loading.set(false);
        this.jornada.set(jornada);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  crearPartido(): void {
    const jornada = this.jornada();
    if (this.partidoForm.invalid || !jornada) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { equipoLocal, equipoVisitante } = this.partidoForm.getRawValue();
    this.matchesService.crearPartido(jornada.id, Number(equipoLocal), Number(equipoVisitante)).subscribe({
      next: (partido) => {
        this.loading.set(false);
        this.partidos.update((actuales) => [...actuales, partido]);
        this.partidoForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  guardarResultado(partidoId: number, golesLocalStr: string, golesVisitanteStr: string): void {
    const golesLocal = Number(golesLocalStr);
    const golesVisitante = Number(golesVisitanteStr);
    if (Number.isNaN(golesLocal) || Number.isNaN(golesVisitante)) {
      return;
    }
    this.errorMessage.set(null);

    this.matchesService.capturarResultado(partidoId, golesLocal, golesVisitante).subscribe({
      next: (actualizado) => {
        this.partidos.update((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  copiarCodigo(): void {
    const codigo = this.liga()?.codigo;
    if (!codigo) {
      return;
    }
    navigator.clipboard.writeText(codigo);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 1500);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object') {
      const messages = Object.values(body).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return 'Algo salió mal. Intenta de nuevo.';
  }
}
