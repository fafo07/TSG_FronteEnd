import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatSidenavModule, MatToolbarModule, MatListModule, MatButtonModule],
  template: `
  <mat-sidenav-container style="height:100vh">
    <mat-sidenav mode="side" opened style="width:260px;background:#0F172A;color:#fff;padding-top:.5rem">
      <h3 style="padding:1rem;margin:0">TSC Registry</h3>
      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard">Painel</a>
        <a mat-list-item routerLink="/patients">Pacientes</a>
        <a mat-list-item routerLink="/catalogs">Catálogos</a>
      </mat-nav-list>
      <div style="padding:1rem;font-size:.85rem;opacity:.9">
        Acesse manifestações, tratamentos, efeitos adversos e contatos pela tela de detalhe do paciente.
      </div>
    </mat-sidenav>
    <mat-sidenav-content>
      <mat-toolbar color="primary" style="display:flex;justify-content:space-between">
        <span>TSC Registry</span>
        <button mat-button (click)="logout()">Sair</button>
      </mat-toolbar>
      <div style="padding:1rem"><router-outlet /></div>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
