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
    const body = this.toApiPayload({ ...treatment, manifestation_id: manifestationId });
    console.log('Payload enviado a la API:', body);
    console.log('Payload JSON:', JSON.stringify(body, null, 2));
    return this.http.post<Treatment>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations/${manifestationId}/treatments`, body);
  }

  update(treatmentId: number, payload: Partial<Treatment>): Observable<Treatment> {
    const body = this.toApiPayload(payload);
    console.log('Payload enviado a la API:', body);
    console.log('Payload JSON:', JSON.stringify(body, null, 2));
    return this.http.patch<Treatment>(`${environment.apiBaseUrl}/treatments/${treatmentId}`, body);
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

  private toApiPayload(payload: Partial<Treatment>): Partial<Treatment> {
    const optionalText = (value?: string | null): string | undefined => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    };

    return {
      medication: optionalText(payload.medication) ?? '',
      dose: optionalText(payload.dose),
      indication: optionalText(payload.indication),
      start_date: payload.start_date ?? undefined,
      end_date: payload.end_date ?? undefined,
      status: optionalText(payload.status),
      notes: optionalText(payload.notes),
      patient_id: undefined,
      manifestation_id: payload.manifestation_id ?? undefined,
      treatment_id: undefined
    };
  }
}
