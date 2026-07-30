import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Equipo {
  id: number;
  categoria: number;
  nombre: string;
  logo: string | null;
  capitan: number | null;
  creado_en: string;
}

export interface EquipoPublico {
  id: number;
  nombre: string;
  logo: string | null;
  capitan: number | null;
}

export interface UnirseResponse {
  equipo: EquipoPublico;
  es_capitan: boolean;
}

export interface EquipoCapitan {
  id: number;
  categoria: number;
  nombre: string;
  logo: string | null;
  capitan: number | null;
}

interface Temporada {
  id: number;
  liga: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  activa: boolean;
}

interface Categoria {
  id: number;
  temporada: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private readonly http = inject(HttpClient);

  // La jerarquía real es Liga > Temporada > Categoria > Equipo. Para el flujo
  // simple de "crear equipo dentro de una liga" armamos una Temporada y
  // Categoria por defecto detrás de escena.
  crearCategoriaPorDefecto(ligaId: number): Observable<Categoria> {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.http
      .post<Temporada>(`${environment.apiUrl}/temporadas/`, {
        liga: ligaId,
        nombre: 'Temporada 1',
        fecha_inicio: hoy,
      })
      .pipe(
        switchMap((temporada) =>
          this.http.post<Categoria>(`${environment.apiUrl}/categorias/`, {
            temporada: temporada.id,
            nombre: 'General',
          }),
        ),
      );
  }

  crear(categoriaId: number, nombre: string): Observable<Equipo> {
    return this.http.post<Equipo>(`${environment.apiUrl}/equipos/`, {
      categoria: categoriaId,
      nombre,
    });
  }

  listar(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${environment.apiUrl}/equipos/`);
  }

  porLiga(codigo: string): Observable<EquipoPublico[]> {
    return this.http.get<EquipoPublico[]>(`${environment.apiUrl}/equipos/por_liga/${codigo}/`);
  }

  unirse(codigoLiga: string, equipoId: number): Observable<UnirseResponse> {
    return this.http.post<UnirseResponse>(`${environment.apiUrl}/equipos/unirse/`, {
      codigo_liga: codigoLiga,
      equipo_id: equipoId,
    });
  }

  // Solo responde 200 si el usuario autenticado es capitán de un equipo.
  // No existe endpoint para que un jugador (no capitán) consulte su propio equipo.
  miEquipo(): Observable<EquipoCapitan> {
    return this.http.get<EquipoCapitan>(`${environment.apiUrl}/equipos/mi_equipo/`);
  }
}
