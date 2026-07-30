import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LigaPublica {
  id: number;
  nombre: string;
  codigo: string;
}

@Injectable({
  providedIn: 'root',
})
export class LigaService {
  private readonly http = inject(HttpClient);

  validarCodigo(codigo: string): Observable<LigaPublica> {
    return this.http.get<LigaPublica>(`${environment.apiUrl}/ligas/validar/${codigo}/`);
  }
}
