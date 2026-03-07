import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div style="padding:1.25rem;border:1px dashed #cbd5e1;border-radius:.5rem;display:flex;justify-content:space-between;align-items:center;gap:1rem">
      <span>{{ message }}</span>
      <button *ngIf="actionLabel" mat-flat-button color="primary" (click)="action.emit()">{{ actionLabel }}</button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() message = 'Nenhum registro encontrado';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
