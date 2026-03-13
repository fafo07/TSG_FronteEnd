import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { Treatment } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<PaginatedResponse<Treatment> | Treatment[]> {
    return this.http
      .get<PaginatedResponse<Treatment> | Treatment[]>(`${environment.apiBaseUrl}/patients/${patientId}/treatments`)
      .pipe(
        map((data) => {
          const list = unwrapResults(data).map((item) => this.normalize(item));
          return Array.isArray(data) ? list : { ...data, results: list };
        })
      );
  }

  create(patientId: number, manifestationId: number, treatment: Partial<Treatment>): Observable<Treatment> {
    return this.http.post<Treatment>(
      `${environment.apiBaseUrl}/patients/${patientId}/manifestations/${manifestationId}/treatments`,
      this.toApiPayload({ ...treatment, patient_id: patientId, manifestation_id: manifestationId })
    );
  }

  update(treatmentId: number, payload: Partial<Treatment>): Observable<Treatment> {
    return this.http.put<Treatment>(`${environment.apiBaseUrl}/treatments/${treatmentId}`, this.toApiPayload(payload));
  }

  delete(treatmentId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/treatments/${treatmentId}`);
  }

  private normalize(item: Treatment): Treatment {
    const anyItem = item as Treatment & { manifestation?: number; patient?: number };
    return {
      ...anyItem,
      manifestation_id: anyItem.manifestation_id ?? anyItem.manifestation ?? 0,
      patient_id: anyItem.patient_id ?? anyItem.patient ?? 0
    };
  }

  private toApiPayload(payload: Partial<Treatment>): Partial<Treatment> & { patient?: number; manifestation_id?: number | null } {
    const optionalText = (value?: string | null): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    };

    return {
      medication: optionalText(payload.medication) ?? '',
      dose: optionalText(payload.dose),
      indication: optionalText(payload.indication),
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      status: optionalText(payload.status),
      notes: optionalText(payload.notes),
      patient: payload.patient_id,
      manifestation_id: payload.manifestation_id ?? null
    };
  }
}
