import { computed, Injectable, signal } from '@angular/core';

// Estado en memoria (no localStorage) para minimizar exposición del token ante XSS.
// Login, refresh y decodificación de JWT se implementan en Sprint 1.
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly accessToken = signal<string | null>(null);
  private readonly role = signal<'admin' | 'capitan' | 'jugador' | null>(null);

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
}
