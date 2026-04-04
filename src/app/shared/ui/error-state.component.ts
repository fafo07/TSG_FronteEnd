import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div style="padding:1rem;border:1px solid #fecaca;background:#fff1f2;border-radius:.5rem;color:#991b1b;display:flex;justify-content:space-between;align-items:center;gap:1rem">
      <span>{{ message }}</span>
      <button mat-stroked-button color="warn" (click)="retry.emit()">Retry</button>
    </div>
  `
})
export class ErrorStateComponent {
  @Input() message = 'Failed to load data';
  @Output() retry = new EventEmitter<void>();
}
