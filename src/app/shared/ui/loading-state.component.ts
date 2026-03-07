import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `<div style="padding:1rem;color:#334155">{{ message }}</div>`
})
export class LoadingStateComponent {
  @Input() message = 'Carregando...';
}
