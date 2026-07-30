import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { LigaPublica, LigaService } from '../../shared/services/liga';
import { EquipoPublico, EquipoService } from '../../shared/services/equipo';

type Step = 'codigo' | 'equipo' | 'cuenta' | 'perfil';

const COLORES_EQUIPO = ['bg-secondary', 'bg-primary', 'bg-tertiary', 'bg-error'];

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
  private readonly equipoService = inject(EquipoService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('codigo');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Paso 1: código de liga
  readonly codigoForm = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
  });
  readonly liga = signal<LigaPublica | null>(null);

  // Paso 2: equipo (real, GET /equipos/por_liga/<codigo>/)
  readonly equipos = signal<EquipoPublico[]>([]);
  readonly busqueda = signal('');
  readonly equiposFiltrados = signal<EquipoPublico[]>([]);
  readonly equipoSeleccionado = signal<EquipoPublico | null>(null);

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

  // Paso 4: perfil de jugador (nombre + dorsal) — solo visual todavía,
  // el modelo Jugador no tiene esos campos en el backend.
  readonly perfilForm = this.fb.nonNullable.group({
    nombreCompleto: ['', Validators.required],
    dorsal: ['', Validators.required],
    aceptaTerminos: [false, Validators.requiredTrue],
  });

  inicial(nombre: string): string {
    return nombre
      .split(' ')
      .map((palabra) => palabra[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  colorEquipo(id: number): string {
    return COLORES_EQUIPO[id % COLORES_EQUIPO.length];
  }

  buscar(termino: string): void {
    this.busqueda.set(termino);
    const q = termino.trim().toLowerCase();
    this.equiposFiltrados.set(
      q ? this.equipos().filter((e) => e.nombre.toLowerCase().includes(q)) : this.equipos(),
    );
  }

  seleccionarEquipo(equipo: EquipoPublico): void {
    this.equipoSeleccionado.set(equipo);
  }

  confirmarCodigo(): void {
    if (this.codigoForm.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const codigo = this.codigoForm.getRawValue().codigo;
    this.ligaService.validarCodigo(codigo).subscribe({
      next: (liga) => {
        this.liga.set(liga);
        this.equipoService.porLiga(codigo).subscribe({
          next: (equipos) => {
            this.loading.set(false);
            this.equipos.set(equipos);
            this.equiposFiltrados.set(equipos);
            this.step.set('equipo');
          },
          error: () => {
            this.loading.set(false);
            this.errorMessage.set('No se pudieron cargar los equipos de la liga.');
          },
        });
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
    const equipo = this.equipoSeleccionado();
    if (this.perfilForm.invalid || !equipo) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, email, password } = this.cuentaForm.getRawValue();
    const codigoLiga = this.liga()!.codigo;

    this.authService.registerJugador(username, email, password).subscribe({
      next: () => {
        this.authService.login(username, password).subscribe({
          next: () => {
            this.equipoService.unirse(codigoLiga, equipo.id).subscribe({
              next: () => {
                this.loading.set(false);
                this.router.navigate(['/jugador']);
              },
              error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                // La cuenta ya se creó y el login funcionó; solo falló unirse al equipo.
                this.errorMessage.set(this.extractErrorMessage(err));
              },
            });
          },
          error: () => {
            this.loading.set(false);
            this.router.navigate(['/auth/login']);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    const messages = body && typeof body === 'object' ? Object.values(body).flat() : [];
    return messages.length > 0 ? messages.join(' ') : 'No se pudo completar el registro. Intenta de nuevo.';
  }
}
