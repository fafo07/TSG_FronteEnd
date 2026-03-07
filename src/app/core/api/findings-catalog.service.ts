import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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
    return this.http.get<PaginatedResponse<FindingCatalog>>(`${environment.apiBaseUrl}/findings`, { params });
  }

  create(payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.post<FindingCatalog>(`${environment.apiBaseUrl}/findings`, payload);
  }

  update(findingCode: string, payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.patch<FindingCatalog>(`${environment.apiBaseUrl}/findings/${findingCode}`, payload);
  }
}
