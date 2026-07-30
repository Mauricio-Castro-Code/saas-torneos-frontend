import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LigaPublica {
  id: number;
  nombre: string;
  codigo: string;
}

export type FormatoLiga = 'liga' | 'liguilla';

export interface Liga extends LigaPublica {
  admin: number;
  activa: boolean;
  creada_en: string;
  sede: string;
  formato: FormatoLiga;
  cupos_maximos: number | null;
}

export interface CrearLigaPayload {
  nombre: string;
  sede?: string;
  formato?: FormatoLiga;
  cuposMaximos?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class LigaService {
  private readonly http = inject(HttpClient);

  validarCodigo(codigo: string): Observable<LigaPublica> {
    return this.http.get<LigaPublica>(`${environment.apiUrl}/ligas/validar/${codigo}/`);
  }

  crear(payload: CrearLigaPayload): Observable<Liga> {
    return this.http.post<Liga>(`${environment.apiUrl}/ligas/`, {
      nombre: payload.nombre,
      sede: payload.sede,
      formato: payload.formato,
      cupos_maximos: payload.cuposMaximos,
    });
  }

  listar(): Observable<Liga[]> {
    return this.http.get<Liga[]>(`${environment.apiUrl}/ligas/`);
  }
}
