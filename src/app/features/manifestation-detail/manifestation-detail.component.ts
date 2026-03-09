import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <mat-card class="page-card">
      <h2>Assessment #{{ manifestationId }} details</h2>
      <p>Findings are now managed directly from the Manifestations screen.</p>
      <button mat-stroked-button type="button" (click)="back()">Back</button>
    </mat-card>
  `
})
export class ManifestationDetailComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));

  back(): void {
    this.location.back();
  }
}
