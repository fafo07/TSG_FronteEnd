import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, MatCardModule, MatCheckboxModule, MatButtonModule],
  template: `
    <mat-card class="page-card">
      <h2>Manifestation findings</h2>
      <p *ngIf="loading">Loading...</p>
      <p *ngIf="error" style="color:#DC2626">Failed to load manifestation data.</p>

      <div *ngIf="!loading && !findingsCatalog.length">No findings available for this manifestation system.</div>

      <div *ngFor="let item of findingsCatalog" style="margin:.5rem 0">
        <mat-checkbox [checked]="selected[item.finding_code]" (change)="toggle(item.finding_code, $event.checked)">{{ item.finding_name }}</mat-checkbox>
      </div>

      <button mat-flat-button color="primary" (click)="save()" [disabled]="loading || !!error">Save</button>
      <p *ngIf="saved" style="color:#16A34A">Saved</p>
    </mat-card>
  `
})
export class FindingsComponent {
  private route = inject(ActivatedRoute);
  private catalogService = inject(FindingsCatalogService);
  private mfService = inject(ManifestationFindingsService);
  private manifestationsService = inject(ManifestationsService);

  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));
  findingsCatalog: FindingCatalog[] = [];
  selected: Record<string, boolean> = {};
  saved = false;
  loading = true;
  error: string | null = null;

  constructor() {
    this.manifestationsService.getById(this.manifestationId).subscribe({
      next: (manifestation) => {
        this.catalogService.list(1, manifestation.system_code, true).subscribe({
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

  toggle(code: string, checked: boolean): void {
    this.selected[code] = checked;
  }

  save(): void {
    const findings = this.findingsCatalog.map((item) => ({
      finding_code: item.finding_code,
      is_present: !!this.selected[item.finding_code]
    }));

    this.mfService.replace(this.manifestationId, findings).subscribe(() => (this.saved = true));
  }
}
