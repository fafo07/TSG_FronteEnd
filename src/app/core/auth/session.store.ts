import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserSession } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly key = 'tsc.session';
  session$ = new BehaviorSubject<UserSession | null>(this.load());

  set(session: UserSession): void {
    localStorage.setItem(this.key, JSON.stringify(session));
    this.session$.next(session);
  }

  clear(): void {
    localStorage.removeItem(this.key);
    this.session$.next(null);
  }

  get token(): string | null {
    return this.session$.value?.access_token ?? null;
  }

  private load(): UserSession | null {
    const raw = localStorage.getItem(this.key);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  }
}
