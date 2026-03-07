import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  template: `
    <mat-card class="page-card">
      <h2>Assessment #{{ manifestationId }} details</h2>
      <a [routerLink]="['/manifestations', manifestationId, 'findings']">Open findings</a>
    </mat-card>
  `
})
export class ManifestationDetailComponent {
  private route = inject(ActivatedRoute);
  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));
}
