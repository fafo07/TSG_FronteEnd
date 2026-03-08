import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { filter } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatButtonModule],
  template: `
  <mat-sidenav-container style="height:100vh">
    <mat-sidenav #sidenav [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile" class="app-sidebar">
      <h3 class="app-brand">Dashboard</h3>
      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard" routerLinkActive="is-active" (click)="closeOnMobile(sidenav)">Dashboard</a>
        <a mat-list-item routerLink="/patients" routerLinkActive="is-active" (click)="closeOnMobile(sidenav)">Patients</a>
        <div class="menu-group-title">Catalogs</div>
        <a mat-list-item routerLink="/catalogs/systems" routerLinkActive="is-active" (click)="closeOnMobile(sidenav)">Systems</a>
        <a mat-list-item routerLink="/catalogs/findings" routerLinkActive="is-active" (click)="closeOnMobile(sidenav)">Findings</a>
        <a mat-list-item routerLink="/catalogs/countries" routerLinkActive="is-active" (click)="closeOnMobile(sidenav)">Countries</a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content>
      <mat-toolbar class="app-topbar">
        <div style="display:flex;align-items:center;gap:.5rem">
          <button *ngIf="isMobile" mat-icon-button (click)="sidenav.toggle()" aria-label="Open menu">☰</button>
          <span>{{ pageTitle }}</span>
        </div>
        <button mat-stroked-button (click)="logout()">Logout</button>
      </mat-toolbar>
      <div style="padding:1rem"><router-outlet /></div>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  isMobile = typeof window !== 'undefined' ? window.innerWidth <= 900 : false;
  pageTitle = 'Dashboard';

  constructor() {
    this.updatePageTitle(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updatePageTitle(this.router.url));
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 900;
  }

  closeOnMobile(sidenav: { close: () => void }): void {
    if (this.isMobile) sidenav.close();
  }

  private updatePageTitle(url: string): void {
    if (url.includes('/catalogs/')) this.pageTitle = 'Catalogs';
    else if (url.includes('/patients/')) this.pageTitle = 'Patient details';
    else if (url.includes('/patients')) this.pageTitle = 'Patients';
    else this.pageTitle = 'Dashboard';
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
