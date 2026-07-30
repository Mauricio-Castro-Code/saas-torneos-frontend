import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export type Role = 'admin' | 'capitan' | 'jugador';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface JwtClaims {
  username: string;
  role: Role;
}

interface RegistroAdminResponse {
  id: number;
  username: string;
  email: string;
}

interface RegistroJugadorResponse {
  id: number;
  username: string;
  email: string;
}

// Estado en memoria (no localStorage) para minimizar exposición del token ante XSS.
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessToken = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(null);
  private readonly claims = signal<JwtClaims | null>(null);

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly username = computed(() => this.claims()?.username ?? null);
  readonly role = computed(() => this.claims()?.role ?? null);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        tap((response) => {
          this.accessToken.set(response.access);
          this.refreshToken.set(response.refresh);
          this.claims.set(this.decodeClaims(response.access));
        }),
      );
  }

  registerAdmin(username: string, email: string, password: string): Observable<RegistroAdminResponse> {
    return this.http.post<RegistroAdminResponse>(`${environment.apiUrl}/auth/registro/admin/`, {
      username,
      email,
      password,
    });
  }

  registerJugador(username: string, email: string, password: string): Observable<RegistroJugadorResponse> {
    return this.http.post<RegistroJugadorResponse>(`${environment.apiUrl}/auth/registro/jugador/`, {
      username,
      email,
      password,
    });
  }

  logout(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.claims.set(null);
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  private decodeClaims(token: string): JwtClaims {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}
