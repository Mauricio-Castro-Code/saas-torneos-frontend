import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { EquipoCapitan, EquipoService } from '../../shared/services/equipo';
import { LigaPublica, LigaService } from '../../shared/services/liga';

type Step = 'codigo' | 'equipo' | 'listo';
type Vista = 'partidos' | 'estadisticas' | 'equipo';
type SubTabEstadisticas = 'posiciones' | 'goleo';

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

interface PartidoMock {
  local: string;
  visitante: string;
  golesLocal?: number;
  golesVisitante?: number;
  hora: string;
  cancha: string;
  jugado: boolean;
}

// Mock: la app `matches` ya tiene los modelos Jornada/Partido en el backend,
// pero todavía no tiene views/urls (sin endpoints). En cuanto existan, esto
// se reemplaza por un GET real a /jornadas/ y /partidos/.
const JORNADA_MOCK = {
  torneo: 'Torneo Apertura 2024',
  numero: 1,
  estado: 'PUBLICADO',
};

const PARTIDOS_MOCK: PartidoMock[] = [
  { local: 'Crystal', visitante: 'Mero Puerto', hora: '8:00', cancha: 'Cancha CEUNI', jugado: false },
  { local: 'Rep Congo', visitante: 'BUAP', hora: '9:00', cancha: 'Cancha 3 Alpha', jugado: false },
  { local: 'Realzaeestra', visitante: 'Impresa', hora: '10:00', cancha: 'Cancha 2 Alpha', jugado: false },
];

interface PosicionMock {
  equipo: string;
  gf: number;
  gc: number;
}

// Mock: no existe endpoint de tabla de posiciones (se calcularía a partir de
// resultados de Partido, que tampoco tiene endpoint todavía).
const POSICIONES_MOCK: PosicionMock[] = [
  { equipo: 'Galgos FC', gf: 32, gc: 12 },
  { equipo: 'Lobos Árticos', gf: 28, gc: 14 },
  { equipo: 'Tigres de Bengala', gf: 25, gc: 18 },
  { equipo: 'Rayos FC', gf: 22, gc: 15 },
  { equipo: 'Halcones Dorados', gf: 20, gc: 19 },
];

interface GoleadorMock {
  jugador: string;
  equipo: string;
  goles: number;
}

// Mock: no existe endpoint de goleo (dependería de Estadística_partido, que no existe todavía).
const GOLEO_MOCK: GoleadorMock[] = [
  { jugador: 'Carlos Ruiz', equipo: 'Galgos FC', goles: 12 },
  { jugador: 'Miguel Ángel', equipo: 'Lobos Árticos', goles: 10 },
  { jugador: 'Jorge Silva', equipo: 'Rayos Jalisco', goles: 9 },
  { jugador: 'Fernando G.', equipo: 'Titanes del Sur', goles: 8 },
];

interface JugadorPlantillaMock {
  nombre: string;
  posicion: string;
  dorsal: number;
}

// Mock: no existe endpoint que devuelva la plantilla (jugadores) de un
// equipo — ni para el capitán ni para nadie más. El modelo Jugador tampoco
// tiene campos de posición/dorsal todavía.
const PLANTILLA_MOCK: JugadorPlantillaMock[] = [
  { nombre: 'Juan Pérez', posicion: 'Delantero', dorsal: 10 },
  { nombre: 'Carlos Ruiz', posicion: 'Portero', dorsal: 1 },
  { nombre: 'Miguel Ángel', posicion: 'Defensa', dorsal: 4 },
  { nombre: 'Luis García', posicion: 'Defensa', dorsal: 5 },
  { nombre: 'Diego Sánchez', posicion: 'Medio', dorsal: 8 },
];

@Component({
  selector: 'app-jugador-shell',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './jugador-shell.html',
  styleUrl: './jugador-shell.scss',
})
export class JugadorShell implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ligaService = inject(LigaService);
  private readonly equipoService = inject(EquipoService);

  // --- Estado real: ¿el usuario ya es capitán de un equipo? ---
  // GET /equipos/mi_equipo/ solo responde 200 para capitanes. Si el jugador
  // ya está en un equipo pero no es capitán, no hay forma de saberlo todavía
  // (no existe un endpoint "mi perfil de jugador" para ese caso).
  readonly cargandoEquipo = signal(true);
  readonly miEquipo = signal<EquipoCapitan | null>(null);

  readonly vista = signal<Vista>('partidos');
  readonly subTabEstadisticas = signal<SubTabEstadisticas>('posiciones');
  readonly notaAgregarJugador = signal<string | null>(null);

  readonly jornada = JORNADA_MOCK;
  readonly partidos = PARTIDOS_MOCK;
  readonly posiciones = POSICIONES_MOCK;
  readonly goleo = GOLEO_MOCK;
  readonly plantilla = PLANTILLA_MOCK;

  // --- Wizard viejo de unirse (fallback mientras no hay equipo confirmado) ---
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

  ngOnInit(): void {
    this.equipoService.miEquipo().subscribe({
      next: (equipo) => {
        this.miEquipo.set(equipo);
        this.cargandoEquipo.set(false);
      },
      error: () => {
        // No es capitán de ningún equipo (o no tiene equipo todavía): cae al wizard de unirse.
        this.cargandoEquipo.set(false);
      },
    });
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
  }

  cambiarSubTabEstadisticas(tab: SubTabEstadisticas): void {
    this.subTabEstadisticas.set(tab);
  }

  agregarJugador(): void {
    this.notaAgregarJugador.set(
      'No existe todavía un endpoint para agregar jugadores directamente: hoy se unen ellos mismos con el código de la liga.',
    );
  }

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
