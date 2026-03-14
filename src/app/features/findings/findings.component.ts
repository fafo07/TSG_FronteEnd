import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { ManifestationFindingsService } from '../../core/api/manifestation-findings.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { FindingCatalog } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatCheckboxModule, MatButtonModule],
  template: `
    <mat-card class="page-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem"><h2 style="margin:0">Manifestation findings</h2><button mat-stroked-button type="button" (click)="back()">Back</button></div>
      <p *ngIf="loading">Loading...</p>
      <p *ngIf="error" style="color:#DC2626">Failed to load manifestation data.</p>

      <div *ngIf="!loading && !findingsCatalog.length">No findings available for this manifestation system.</div>

      <div *ngFor="let item of findingsCatalog" style="margin:.5rem 0">
        <mat-checkbox [(ngModel)]="selected[item.finding_code]" [ngModelOptions]="{standalone: true}">{{ item.finding_name }}</mat-checkbox>
      </div>

      <div style="display:flex;gap:.5rem;align-items:center">
        <button mat-flat-button color="primary" (click)="save()" [disabled]="loading || !!error">Save</button>
        <button mat-stroked-button type="button" (click)="back()">Cancel</button>
      </div>
      <p *ngIf="saved" style="color:#16A34A">Saved</p>
      <p *ngIf="saveError" style="color:#DC2626">{{ saveError }}</p>
    </mat-card>
  `
})
export class FindingsComponent {
  private route = inject(ActivatedRoute);
  private catalogService = inject(FindingsCatalogService);
  private mfService = inject(ManifestationFindingsService);
  private manifestationsService = inject(ManifestationsService);
  private location = inject(Location);

  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));
  selectedManifestation: { manifestation_id?: number; system?: string; system_code?: string } | null = null;
  findingsCatalog: FindingCatalog[] = [];
  selected: Record<string, boolean> = {};
  saved = false;
  loading = true;
  error: string | null = null;
  saveError: string | null = null;

  constructor() {
    if (!this.manifestationId) {
      this.error = 'Could not identify selected manifestation.';
      this.loading = false;
      return;
    }

    this.manifestationsService.getById(this.manifestationId).subscribe({
      next: (manifestation) => {
        this.selectedManifestation = manifestation;
        const manifestationId = manifestation.manifestation_id ?? this.manifestationId;
        const systemCode = manifestation.system ?? manifestation.system_code;

        console.log('Selected manifestation:', this.selectedManifestation);
        console.log('Manifestation ID used for findings:', manifestationId);

        if (!manifestationId) {
          this.error = 'Could not identify selected manifestation.';
          this.loading = false;
          return;
        }

        this.manifestationId = manifestationId;

        this.catalogService.list(1, systemCode, true).subscribe({
          next: (catalogPage) => {
            this.findingsCatalog = catalogPage.results;
            this.findingsCatalog.forEach((f) => {
              if (this.selected[f.finding_code] === undefined) this.selected[f.finding_code] = false;
            });

            this.mfService.get(this.manifestationId).subscribe({
              next: (data) => {
                data.forEach((d) => (this.selected[d.finding_code] = d.is_present));
                this.loading = false;
              },
              error: () => {
                this.error = 'Failed to load linked findings';
                this.loading = false;
              }
            });
          },
          error: () => {
            this.error = 'Failed to load findings catalog';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Failed to load manifestation';
        this.loading = false;
      }
    });
  }

  save(): void {
    const manifestationId = this.selectedManifestation?.manifestation_id ?? this.manifestationId;
    if (!manifestationId) {
      console.error('Missing manifestation_id');
      this.saveError = 'No se pudo identificar la manifestación seleccionada.';
      return;
    }

    const findings = this.findingsCatalog.map((item) => ({
      finding_code: item.finding_code,
      is_present: !!this.selected[item.finding_code]
    }));

    const uniqueCodes = new Set(findings.map((item) => item.finding_code));
    if (uniqueCodes.size !== findings.length) {
      this.saveError = 'Duplicate findings detected. Please review selection.';
      return;
    }

    console.log('Selected manifestation:', this.selectedManifestation);
    console.log('Manifestation ID used for findings:', manifestationId);
    console.log('Payload findings:', findings);

    this.mfService.replace(manifestationId, findings).subscribe({
      next: () => {
        this.saved = true;
        this.saveError = null;
      },
      error: () => {
        this.saveError = 'No se pudo guardar los findings de la manifestación.';
      }
    });
  }

  back(): void {
    this.location.back();
  }
}
