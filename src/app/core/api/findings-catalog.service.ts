import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { FindingCatalog } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class FindingsCatalogService {
  private http = inject(HttpClient);

  list(system_code?: string, is_active?: boolean, search?: string): Observable<FindingCatalog[]> {
    let params = new HttpParams();
    if (system_code) params = params.set('system_code', system_code);
    if (is_active !== undefined) params = params.set('is_active', is_active);
    if (search) params = params.set('search', search);
    return this.http.get<FindingCatalog[]>(`${environment.apiBaseUrl}/catalogs/findings`, { params });
  }

  create(payload: FindingCatalog): Observable<FindingCatalog> {
    return this.http.post<FindingCatalog>(`${environment.apiBaseUrl}/catalogs/findings`, payload);
  }

  update(findingCode: string, payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.put<FindingCatalog>(`${environment.apiBaseUrl}/catalogs/findings/${findingCode}`, payload);
  }
}
