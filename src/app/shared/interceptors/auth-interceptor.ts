import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth';

// TODO: manejar 401 (refresh o logout) cuando el endpoint de refresh esté conectado.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getAccessToken();
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
