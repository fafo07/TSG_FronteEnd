import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `<mat-card class="page-card"><h3>{{ title }}</h3><p style="font-size:1.25rem">{{ value }}</p></mat-card>`
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
}
