import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../config/environment';
import { UserSession } from '../../shared/models/models';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private store = inject(SessionStore);

  login(username: string, password: string): Observable<UserSession> {
    return this.http.post<Record<string, unknown>>(`${environment.apiBaseUrl}/auth/login`, { username: username.trim(), password }).pipe(
      map((raw) => this.normalizeSession(raw)),
      tap((session) => this.store.set(session))
    );
  }

  refreshToken(): Observable<string | null> {
    const refreshToken = this.store.session$.value?.refresh_token;
    if (!refreshToken) return of(null);

    const refreshPayload = { refresh: refreshToken, refresh_token: refreshToken };

    return this.http.post<UserSession>(`${environment.apiBaseUrl}/auth/refresh`, refreshPayload).pipe(
      tap((session) => this.store.set(session)),
      map((s) => s.access_token),
      catchError(() => of(null))
    );
  }

  logout(): void { this.store.clear(); }
  getToken(): string | null { return this.store.token; }
  isAuthenticated(): boolean { return !!this.store.token; }

  private normalizeSession(raw: Record<string, unknown>): UserSession {
    const access_token = (raw['access_token'] as string | undefined) ?? (raw['accessToken'] as string | undefined) ?? (raw['token'] as string | undefined) ?? (raw['access'] as string | undefined);
    const refresh_token = (raw['refresh_token'] as string | undefined) ?? (raw['refreshToken'] as string | undefined) ?? (raw['refresh'] as string | undefined);
    const username = raw['username'] as string | undefined;
    const role = raw['role'] as string | undefined;

    if (!access_token) {
      throw new Error('Resposta de login sem access_token.');
    }

    return { access_token, refresh_token, username, role };
  }
}
