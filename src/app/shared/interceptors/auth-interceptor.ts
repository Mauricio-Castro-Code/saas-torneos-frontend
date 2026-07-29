import { HttpInterceptorFn } from '@angular/common/http';

// TODO (Sprint 1): adjuntar `Authorization: Bearer <access>` desde AuthService
// y manejar 401 (refresh o logout).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
