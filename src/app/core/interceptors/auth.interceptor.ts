import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';

const AUTH_WHITELIST = ['/auth/login', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthRequest = AUTH_WHITELIST.some((path) => req.url.includes(path));
  const token = auth.getToken();
  const authReq = !isAuthRequest && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401 || isAuthRequest) return throwError(() => error);

      return auth.refreshToken().pipe(
        switchMap((newToken) => {
          if (!newToken) {
            auth.logout();
            void router.navigate(['/login']);
            return throwError(() => error);
          }

          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        })
      );
    })
  );
};
