import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [MatCardModule, RouterLink],
  template: `
    <mat-card class="page-card">
      <h2>Detalhe da avaliação #{{ manifestationId }}</h2>
      <a [routerLink]="['/manifestations', manifestationId, 'findings']">Abrir achados</a>
    </mat-card>
  `
})
export class ManifestationDetailComponent {
  private route = inject(ActivatedRoute);
  manifestationId = Number(this.route.snapshot.paramMap.get('mid'));
}
