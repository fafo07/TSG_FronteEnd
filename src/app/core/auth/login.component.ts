import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div style="display:grid;place-items:center;min-height:100vh;">
    <mat-card class="page-card" style="max-width:420px;width:100%">
      <h2>Entrar</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field class="full-width"><mat-label>Usuário</mat-label><input matInput formControlName="username" /></mat-form-field>
        <mat-form-field class="full-width"><mat-label>Senha</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
        <p *ngIf="error" style="color:#DC2626">Usuário ou senha inválidos</p>
        <button mat-flat-button color="primary" class="full-width">Acessar</button>
      </form>
    </mat-card>
  </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = false;

  form = this.fb.group({ username: ['', Validators.required], password: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();
    this.auth.login(username!, password!).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: () => (this.error = true)
    });
  }
}
