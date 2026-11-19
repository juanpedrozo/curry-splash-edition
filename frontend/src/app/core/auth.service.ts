import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface Conta { id: number; nome: string; email: string }
interface Csrf { token: string; headerName: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly usuario = signal<Conta | null>(null);
  private verificacao?: Promise<void>;
  private token?: Promise<Csrf>;
  readonly conta = this.usuario.asReadonly();
  emailCadastro = '';

  verificarSessao(): Promise<void> {
    this.verificacao ??= firstValueFrom(this.http.get<Conta>('/api/auth/me')).then(conta => {
      this.usuario.set(conta);
    }).catch(erro => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) throw erro;
      this.usuario.set(null);
    });
    return this.verificacao;
  }

  csrf(): Promise<Csrf> {
    this.token ??= firstValueFrom(this.http.get<Csrf>('/api/auth/csrf')).catch(erro => {
      this.token = undefined;
      throw erro;
    });
    return this.token;
  }

  async entrar(email: string, senha: string): Promise<void> {
    const conta = await firstValueFrom(this.http.post<Conta>('/api/auth/login', { email: email.trim(), senha }));
    this.token = undefined;
    this.usuario.set(conta);
    this.verificacao = Promise.resolve();
  }

  async cadastrar(nome: string, email: string, senha: string): Promise<void> {
    await firstValueFrom(this.http.post<Conta>('/api/auth/cadastro', { nome: nome.trim(), email: email.trim(), senha }));
    this.emailCadastro = email.trim();
  }

  async sair(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/logout', {}));
    this.limpar();
    await this.router.navigateByUrl('/login');
  }

  sessaoExpirada(): void {
    if (!this.conta()) return;
    this.limpar();
    void this.router.navigate(['/login'], { queryParams: { sessao: 'expirada' } });
  }

  private limpar(): void {
    this.usuario.set(null);
    this.token = undefined;
    this.verificacao = Promise.resolve();
  }
}
