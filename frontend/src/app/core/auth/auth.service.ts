import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { components } from '../api/generated';

export type UserResponse = components['schemas']['UserResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];

/**
 * Llamadas de sesión al backend. El token vive solo en la cookie HttpOnly:
 * este servicio nunca lo guarda ni lo lee (constitution.md, sección 2 y 6.2).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/v1/auth/login', credentials);
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout', null);
  }

  currentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/v1/auth/me');
  }
}
