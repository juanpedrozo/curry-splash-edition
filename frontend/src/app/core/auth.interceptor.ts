import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  const auth = inject(AuthService);
  const pedido = req.clone({ withCredentials: true });
  const seguro = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const resposta = seguro ? next(pedido) : from(auth.csrf()).pipe(
    switchMap(csrf => next(pedido.clone({ setHeaders: { [csrf.headerName]: csrf.token } }))),
  );
  return resposta.pipe(catchError(erro => {
    if (erro instanceof HttpErrorResponse && erro.status === 401 && !req.url.startsWith('/api/auth/')) {
      auth.sessaoExpirada();
    }
    return throwError(() => erro);
  }));
};
