import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { LigaPublica, LigaService } from '../../shared/services/liga';

type Step = 'codigo' | 'equipo' | 'cuenta' | 'perfil';

interface MockEquipo {
  id: number;
  nombre: string;
  abrev: string;
  subtitulo: string;
  color: string;
}

// TODO: reemplazar por GET real cuando exista el endpoint de equipos por liga (teams app, PLANNING.md #7-9).
const EQUIPOS_MOCK: MockEquipo[] = [
  { id: 1, nombre: 'Titanes FC', abrev: 'TF', subtitulo: 'División A · 22 jugadores', color: 'bg-secondary' },
  { id: 2, nombre: 'Dragones del Norte', abrev: 'DN', subtitulo: 'División A · 18 jugadores', color: 'bg-primary' },
  { id: 3, nombre: 'Halcones Galácticos', abrev: 'HG', subtitulo: 'División B · 20 jugadores', color: 'bg-tertiary' },
  { id: 4, nombre: 'Rayo Metropolitano', abrev: 'RM', subtitulo: 'División B · 15 jugadores', color: 'bg-error' },
  { id: 5, nombre: 'Puños Salvajes', abrev: 'PS', subtitulo: 'División B · 21 jugadores', color: 'bg-secondary' },
  { id: 6, nombre: 'Atlético Central', abrev: 'AC', subtitulo: 'División A · 22 jugadores', color: 'bg-primary' },
];

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmarPassword = group.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-join',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './join.html',
  styleUrl: './join.scss',
})
export class Join {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly ligaService = inject(LigaService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('codigo');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Paso 1: código de liga (real)
  readonly codigoForm = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
  });
  readonly liga = signal<LigaPublica | null>(null);

  // Paso 2: equipo (mock, sin backend todavía)
  readonly equipos = EQUIPOS_MOCK;
  readonly busqueda = signal('');
  readonly equiposFiltrados = signal<MockEquipo[]>(EQUIPOS_MOCK);
  readonly equipoSeleccionado = signal<MockEquipo | null>(null);

  // Paso 3: cuenta
  readonly cuentaForm = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmarPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  // Paso 4: perfil de jugador (nombre + dorsal) — sin backend todavía (no existe modelo Jugador)
  readonly perfilForm = this.fb.nonNullable.group({
    nombreCompleto: ['', Validators.required],
    dorsal: ['', Validators.required],
    aceptaTerminos: [false, Validators.requiredTrue],
  });

  buscar(termino: string): void {
    this.busqueda.set(termino);
    const q = termino.trim().toLowerCase();
    this.equiposFiltrados.set(
      q ? this.equipos.filter((e) => e.nombre.toLowerCase().includes(q)) : this.equipos,
    );
  }

  seleccionarEquipo(equipo: MockEquipo): void {
    this.equipoSeleccionado.set(equipo);
  }

  confirmarCodigo(): void {
    if (this.codigoForm.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.ligaService.validarCodigo(this.codigoForm.getRawValue().codigo).subscribe({
      next: (liga) => {
        this.loading.set(false);
        this.liga.set(liga);
        this.step.set('equipo');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Código de liga inválido.');
      },
    });
  }

  confirmarEquipo(): void {
    if (!this.equipoSeleccionado()) {
      return;
    }
    this.step.set('cuenta');
  }

  confirmarCuenta(): void {
    if (this.cuentaForm.invalid) {
      return;
    }
    this.step.set('perfil');
  }

  volver(): void {
    const anterior: Record<Step, Step> = { codigo: 'codigo', equipo: 'codigo', cuenta: 'equipo', perfil: 'cuenta' };
    this.step.set(anterior[this.step()]);
  }

  cancelar(): void {
    this.router.navigate(['/auth/login']);
  }

  registrarse(): void {
    if (this.perfilForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, email, password } = this.cuentaForm.getRawValue();
    const codigoLiga = this.liga()!.codigo;

    this.authService.registerJugador(username, email, password, codigoLiga).subscribe({
      next: () => {
        this.authService.login(username, password).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/jugador']);
          },
          error: () => {
            this.loading.set(false);
            this.router.navigate(['/auth/login']);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error;
        const messages = body && typeof body === 'object' ? Object.values(body).flat() : [];
        this.errorMessage.set(
          messages.length > 0 ? messages.join(' ') : 'No se pudo completar el registro. Intenta de nuevo.',
        );
      },
    });
  }
}
