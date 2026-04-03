import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { environment } from '../config/environment';
import { Country, System } from '../../shared/models/models';
import { PaginatedResponse } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private http = inject(HttpClient);
  list(page = 1): Observable<PaginatedResponse<Country>> {
    return this.http.get<PaginatedResponse<Country>>(`${environment.apiBaseUrl}/countries`, { params: new HttpParams().set('page', page) });
  }
  create(payload: Country): Observable<Country> { return this.http.post<Country>(`${environment.apiBaseUrl}/countries`, payload); }
  update(code: string, payload: Partial<Country>): Observable<Country> { return this.http.patch<Country>(`${environment.apiBaseUrl}/countries/${code}`, payload); }
  delete(code: string): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/countries/${code}`); }
}

@Injectable({ providedIn: 'root' })
export class SystemsService {
  private http = inject(HttpClient);
  list(page = 1): Observable<PaginatedResponse<System>> {
    return this.http.get<PaginatedResponse<System>>(`${environment.apiBaseUrl}/systems`, { params: new HttpParams().set('page', page) });
  }
  create(payload: System): Observable<System> { return this.http.post<System>(`${environment.apiBaseUrl}/systems`, payload); }
  update(code: string, payload: Partial<System>): Observable<System> { return this.http.patch<System>(`${environment.apiBaseUrl}/systems/${code}`, payload); }
  delete(code: string): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/systems/${code}`); }

  getAllSystems(): Observable<System[]> {
    return this.list(1).pipe(
      expand((response) => {
        if (!response.next) return EMPTY;
        const match = /[?&]page=(\d+)/.exec(response.next);
        const nextPage = Number(match?.[1] ?? 0);
        return nextPage > 0 ? this.list(nextPage) : EMPTY;
      }),
      map((response) => response.results),
      reduce((all, pageResults) => [...all, ...pageResults], [] as System[])
    );
  }
}
