import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Country, System } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private http = inject(HttpClient);
  list(): Observable<Country[]> { return this.http.get<Country[]>(`${environment.apiBaseUrl}/catalogs/countries`); }
  create(payload: Country): Observable<Country> { return this.http.post<Country>(`${environment.apiBaseUrl}/catalogs/countries`, payload); }
  update(code: string, payload: Partial<Country>): Observable<Country> { return this.http.put<Country>(`${environment.apiBaseUrl}/catalogs/countries/${code}`, payload); }
  delete(code: string): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/catalogs/countries/${code}`); }
}

@Injectable({ providedIn: 'root' })
export class SystemsService {
  private http = inject(HttpClient);
  list(): Observable<System[]> { return this.http.get<System[]>(`${environment.apiBaseUrl}/catalogs/systems`); }
  create(payload: System): Observable<System> { return this.http.post<System>(`${environment.apiBaseUrl}/catalogs/systems`, payload); }
  update(code: string, payload: Partial<System>): Observable<System> { return this.http.put<System>(`${environment.apiBaseUrl}/catalogs/systems/${code}`, payload); }
  delete(code: string): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/catalogs/systems/${code}`); }
}
