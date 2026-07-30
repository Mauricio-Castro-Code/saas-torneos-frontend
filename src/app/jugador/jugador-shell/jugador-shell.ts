import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { EquipoCapitan, EquipoService } from '../../shared/services/equipo';
import { LigaPublica, LigaService } from '../../shared/services/liga';
import { Jornada, MatchesService, Partido } from '../../shared/services/matches';

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
  imports: [ReactiveFormsModule, NgClass, DatePipe],
  templateUrl: './jugador-shell.html',
  styleUrl: './jugador-shell.scss',
})
export class JugadorShell implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ligaService = inject(LigaService);
  private readonly equipoService = inject(EquipoService);
  private readonly matchesService = inject(MatchesService);

  // --- Estado real: ¿el usuario ya es capitán de un equipo? ---
  // GET /equipos/mi_equipo/ solo responde 200 para capitanes. Si el jugador
  // ya está en un equipo pero no es capitán, no hay forma de saberlo todavía
  // (no existe un endpoint "mi perfil de jugador" para ese caso).
  readonly cargandoEquipo = signal(true);
  readonly miEquipo = signal<EquipoCapitan | null>(null);

  readonly vista = signal<Vista>('partidos');
  readonly subTabEstadisticas = signal<SubTabEstadisticas>('posiciones');
  readonly notaAgregarJugador = signal<string | null>(null);

  // Reales: GET /jornadas/ y /partidos/ ya están escopados por el backend a la
  // liga del equipo del jugador autenticado.
  readonly jornadas = signal<Jornada[]>([]);
  readonly partidosReales = signal<Partido[]>([]);

  readonly jornadasConPartidos = computed(() => {
    const numeroPorJornadaId = new Map(this.jornadas().map((j) => [j.id, j.numero]));
    const grupos = new Map<number, Partido[]>();
    for (const partido of this.partidosReales()) {
      const lista = grupos.get(partido.jornada) ?? [];
      lista.push(partido);
      grupos.set(partido.jornada, lista);
    }
    return [...grupos.entries()]
      .map(([jornadaId, partidos]) => ({ numero: numeroPorJornadaId.get(jornadaId) ?? jornadaId, partidos }))
      .sort((a, b) => a.numero - b.numero);
  });

  readonly posiciones = computed(() => {
    const tabla = new Map<string, { equipo: string; gf: number; gc: number }>();
    for (const partido of this.partidosReales()) {
      if (!partido.jugado) {
        continue;
      }
      const local = tabla.get(partido.equipo_local_nombre) ?? {
        equipo: partido.equipo_local_nombre,
        gf: 0,
        gc: 0,
      };
      local.gf += partido.goles_local!;
      local.gc += partido.goles_visitante!;
      tabla.set(partido.equipo_local_nombre, local);

      const visitante = tabla.get(partido.equipo_visitante_nombre) ?? {
        equipo: partido.equipo_visitante_nombre,
        gf: 0,
        gc: 0,
      };
      visitante.gf += partido.goles_visitante!;
      visitante.gc += partido.goles_local!;
      tabla.set(partido.equipo_visitante_nombre, visitante);
    }
    return [...tabla.values()].sort((a, b) => b.gf - b.gc - (a.gf - a.gc));
  });

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
        this.matchesService.listarJornadas().subscribe({ next: (j) => this.jornadas.set(j) });
        this.matchesService.listarPartidos().subscribe({ next: (p) => this.partidosReales.set(p) });
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
