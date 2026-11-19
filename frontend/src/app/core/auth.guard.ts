import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const contaObrigatoria: CanActivateChildFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try { await auth.verificarSessao(); } catch { /* O formulário informa falhas de conexão ao entrar. */ }
  return auth.conta() ? true : router.createUrlTree(['/login'], { queryParams: { voltar: state.url } });
};

export const apenasVisitantes: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try { await auth.verificarSessao(); } catch { /* Permite tentar entrar novamente. */ }
  return auth.conta() ? router.createUrlTree(['/']) : true;
};
