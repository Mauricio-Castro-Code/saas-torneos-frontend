import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { LigaPublica, LigaService } from '../../shared/services/liga';

type Step = 'codigo' | 'equipo' | 'listo';

interface MockEquipo {
  id: number;
  nombre: string;
  abrev: string;
  subtitulo: string;
  color: string;
}

// TODO: reemplazar por GET real cuando exista el endpoint de equipos por liga (teams app, PLANNING.md #7-9).
// Tampoco existe todavía un endpoint para "unirse a equipo" (join): confirmar equipo aquí
// solo actualiza estado local, no persiste nada en el backend.
const EQUIPOS_MOCK: MockEquipo[] = [
  { id: 1, nombre: 'Titanes FC', abrev: 'TF', subtitulo: 'División A · 22 jugadores', color: 'bg-secondary' },
  { id: 2, nombre: 'Dragones del Norte', abrev: 'DN', subtitulo: 'División A · 18 jugadores', color: 'bg-primary' },
  { id: 3, nombre: 'Halcones Galácticos', abrev: 'HG', subtitulo: 'División B · 20 jugadores', color: 'bg-tertiary' },
  { id: 4, nombre: 'Rayo Metropolitano', abrev: 'RM', subtitulo: 'División B · 15 jugadores', color: 'bg-error' },
];

@Component({
  selector: 'app-jugador-shell',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './jugador-shell.html',
  styleUrl: './jugador-shell.scss',
})
export class JugadorShell {
  private readonly fb = inject(FormBuilder);
  private readonly ligaService = inject(LigaService);

  readonly step = signal<Step>('codigo');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly codigoForm = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
  });
  readonly liga = signal<LigaPublica | null>(null);

  readonly equipos = EQUIPOS_MOCK;
  readonly busqueda = signal('');
  readonly equiposFiltrados = signal<MockEquipo[]>(EQUIPOS_MOCK);
  readonly equipoSeleccionado = signal<MockEquipo | null>(null);

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
    this.step.set('listo');
  }

  volver(): void {
    this.step.set('codigo');
  }
}
