import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-patient-tabs',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule],
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin:.5rem 0 1rem">
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'overview']" routerLinkActive="mdc-button--unelevated">Overview</a>
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'manifestations']" routerLinkActive="mdc-button--unelevated">Manifestations</a>
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'treatments']" routerLinkActive="mdc-button--unelevated">Treatments</a>
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'adverse-events']" routerLinkActive="mdc-button--unelevated">Adverse events</a>
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'genetic-tests']" routerLinkActive="mdc-button--unelevated">Genetic tests</a>
      <a mat-stroked-button [routerLink]="['/patients', patientId, 'contacts']" routerLinkActive="mdc-button--unelevated">Contacts</a>
    </div>
  `
})
export class PatientTabsComponent {
  @Input({ required: true }) patientId!: number;
}
