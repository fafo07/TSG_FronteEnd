import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { environment } from '../config/environment';
import { FindingCatalog } from '../../shared/models/models';
import { PaginatedResponse } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class FindingsCatalogService {
  private http = inject(HttpClient);

  list(page = 1, system?: string, isActive?: boolean): Observable<PaginatedResponse<FindingCatalog>> {
    let params = new HttpParams().set('page', page);
    if (system) params = params.set('system', system);
    if (isActive !== undefined) params = params.set('is_active', isActive);
    return this.http.get<PaginatedResponse<FindingCatalog>>(`${environment.apiBaseUrl}/findings`, { params }).pipe(
      map((res) => ({ ...res, results: res.results.map((item) => this.normalize(item)) }))
    );
  }

  create(payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.post<FindingCatalog>(`${environment.apiBaseUrl}/findings`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  update(findingCode: string, payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.patch<FindingCatalog>(`${environment.apiBaseUrl}/findings/${findingCode}`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  getByCode(findingCode: string): Observable<FindingCatalog> {
    return this.http.get<FindingCatalog>(`${environment.apiBaseUrl}/findings/${findingCode}`).pipe(map((item) => this.normalize(item)));
  }

  getAllFindings(isActive?: boolean): Observable<FindingCatalog[]> {
    return this.list(1, undefined, isActive).pipe(
      expand((response) => {
        if (!response.next) return EMPTY;
        const match = /[?&]page=(\d+)/.exec(response.next);
        const nextPage = Number(match?.[1] ?? 0);
        return nextPage > 0 ? this.list(nextPage, undefined, isActive) : EMPTY;
      }),
      map((response) => response.results),
      reduce((all, pageResults) => [...all, ...pageResults], [] as FindingCatalog[])
    );
  }

  private normalize(item: FindingCatalog): FindingCatalog {
    const anyItem = item as FindingCatalog & { finding?: string; code?: string; name?: string; active?: boolean };
    const system = anyItem.system ?? anyItem.system_code;
    const finding_code = anyItem.finding_code ?? anyItem.finding ?? anyItem.code ?? '';
    const finding_name = anyItem.finding_name ?? anyItem.name ?? finding_code;
    const is_active = anyItem.is_active ?? anyItem.active ?? true;
    return { ...anyItem, finding_code, finding_name, is_active, system, system_code: anyItem.system_code ?? system ?? '' };
  }

  private toApiPayload(payload: Partial<FindingCatalog>): Partial<FindingCatalog> & { system?: string } {
    const system = payload.system ?? payload.system_code;
    return {
      ...payload,
      system,
      system_code: undefined
    };
  }
}
