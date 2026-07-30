import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Jornada {
  id: number;
  categoria: number;
  numero: number;
  fecha: string | null;
}

export interface Partido {
  id: number;
  jornada: number;
  equipo_local: number;
  equipo_local_nombre: string;
  equipo_visitante: number;
  equipo_visitante_nombre: string;
  cancha: string;
  horario: string | null;
  nombre_arbitro: string;
  goles_local: number | null;
  goles_visitante: number | null;
  jugado: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  private readonly http = inject(HttpClient);

  crearJornada(categoriaId: number, numero: number): Observable<Jornada> {
    return this.http.post<Jornada>(`${environment.apiUrl}/jornadas/`, {
      categoria: categoriaId,
      numero,
    });
  }

  listarJornadas(): Observable<Jornada[]> {
    return this.http.get<Jornada[]>(`${environment.apiUrl}/jornadas/`);
  }

  crearPartido(jornadaId: number, equipoLocalId: number, equipoVisitanteId: number): Observable<Partido> {
    return this.http.post<Partido>(`${environment.apiUrl}/partidos/`, {
      jornada: jornadaId,
      equipo_local: equipoLocalId,
      equipo_visitante: equipoVisitanteId,
    });
  }

  // Cualquier jugador autenticado ve solo los partidos de la liga de su propio
  // equipo (lo escopa el backend); el admin ve los de sus propias ligas.
  listarPartidos(): Observable<Partido[]> {
    return this.http.get<Partido[]>(`${environment.apiUrl}/partidos/`);
  }

  capturarResultado(partidoId: number, golesLocal: number, golesVisitante: number): Observable<Partido> {
    return this.http.patch<Partido>(`${environment.apiUrl}/partidos/${partidoId}/`, {
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
    });
  }
}
