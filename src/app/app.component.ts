import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent {
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

  constructor() {
    this.translate.setDefaultLang('pt-BR');
    this.translate.use('pt-BR');
    this.auth.hydrateUserFromApi().subscribe();
  }
}
