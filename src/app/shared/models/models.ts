export interface Patient {
  patient_id: number;
  full_name: string;
  date_of_birth?: string;
  country_code?: string;
  family_history?: string;
  diagnosis_date?: string;
  created_at?: string;
}

export interface Country {
  country_code: string;
  country_name: string;
}

export interface System {
  system_code: string;
  system_name: string;
}

export interface FindingCatalog {
  finding_code: string;
  system_code: string;
  finding_name: string;
  description?: string;
  is_active: boolean;
}

export interface GeneticTest {
  test_id: number;
  patient_id: number;
  test_date?: string;
  gene: 'TSC1' | 'TSC2';
  variant?: string;
  lab_name?: string;
  notes?: string;
}

export interface Manifestation {
  manifestation_id: number;
  patient_id: number;
  system_code: string;
  evaluation_date: string;
  notes?: string;
}

export interface ManifestationFinding {
  manifestation_id: number;
  finding_code: string;
  is_present: boolean;
}

export interface Treatment {
  treatment_id: number;
  patient_id: number;
  manifestation_id: number;
  medication: string;
  dose?: string;
  indication?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
}

export interface AdverseEvent {
  ae_id: number;
  patient_id: number;
  treatment_id?: number | null;
  event_date: string;
  event_name: string;
  severity?: string;
  action_taken?: string;
  notes?: string;
}

export interface Contact {
  contact_id: number;
  full_name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

export interface PatientContact {
  patient_id: number;
  contact_id: number;
  is_primary: boolean;
}

export interface UserSession {
  access_token: string;
  refresh_token?: string;
  username?: string;
  role?: string;
}


export interface AuthMeResponse {
  username?: string;
  role?: string;
}
