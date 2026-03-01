import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { ManifestationFindingsService } from '../../core/api/manifestation-findings.service';
import { FindingCatalog, ManifestationFinding } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatCheckboxModule, MatButtonModule],
  template: `
    <mat-card class="page-card">
      <h2>Achados</h2>
      <div *ngFor="let item of findingsCatalog" style="margin:.5rem 0">
        <mat-checkbox [checked]="selected[item.finding_code]" (change)="toggle(item.finding_code, $event.checked)">{{ item.finding_name }}</mat-checkbox>
      </div>
      <button mat-flat-button color="primary" (click)="save()">Salvar</button>
      <p *ngIf="saved" style="color:#16A34A">Salvo</p>
    </mat-card>
  `
})
export class FindingsComponent {
  private route = inject(ActivatedRoute);
  private catalogService = inject(FindingsCatalogService);
  private mfService = inject(ManifestationFindingsService);

  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));
  findingsCatalog: FindingCatalog[] = [];
  selected: Record<string, boolean> = {};
  saved = false;

  constructor() {
    this.catalogService.list(undefined, true).subscribe((data) => (this.findingsCatalog = data));
    this.mfService.get(this.manifestationId).subscribe((data) => {
      data.forEach((d) => (this.selected[d.finding_code] = d.is_present));
    });
  }

  toggle(code: string, checked: boolean): void {
    this.selected[code] = checked;
  }

  save(): void {
    const payload: ManifestationFinding[] = Object.keys(this.selected).map((finding_code) => ({
      manifestation_id: this.manifestationId,
      finding_code,
      is_present: this.selected[finding_code]
    }));

    this.mfService.replace(this.manifestationId, payload).subscribe(() => (this.saved = true));
  }
}
