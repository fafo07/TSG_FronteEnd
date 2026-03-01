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
    return this.http.post<UserSession>(`${environment.apiBaseUrl}/auth/login`, { username, password }).pipe(
      tap((session) => this.store.set(session))
    );
  }

  refreshToken(): Observable<string | null> {
    const refreshToken = this.store.session$.value?.refresh_token;
    if (!refreshToken) return of(null);
    return this.http.post<UserSession>(`${environment.apiBaseUrl}/auth/refresh`, { refresh_token: refreshToken }).pipe(
      tap((session) => this.store.set(session)),
      map((s) => s.access_token),
      catchError(() => of(null))
    );
  }

  logout(): void { this.store.clear(); }
  getToken(): string | null { return this.store.token; }
  isAuthenticated(): boolean { return !!this.store.token; }
}
