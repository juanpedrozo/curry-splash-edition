import { Component, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { mensagemErro } from '../core/api.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'curry-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="app-sidebar d-flex flex-column" id="menu-principal" [class.open]="aberta()" (keydown.escape)="fechar.emit()">
      <nav aria-label="Navegação principal">
        @for (grupo of grupos; track $index) {
          <div class="nav nav-pills flex-column nav-group">
            @for (rota of grupo; track rota.path) {
              <a class="nav-link d-flex align-items-center" [routerLink]="rota.path" routerLinkActive="active" ariaCurrentWhenActive="page"
                 [routerLinkActiveOptions]="{ exact: rota.path === '/' }" (click)="fechar.emit()">
                <i [class]="'bi bi-' + rota.icone" aria-hidden="true"></i>{{ rota.nome }}
              </a>
            }
          </div>
        }
      </nav>
      <div class="sidebar-footer mt-auto">
        @if (auth.conta(); as conta) {
          <div class="sidebar-account"><strong>{{ conta.nome }}</strong><span [title]="conta.email">{{ conta.email }}</span></div>
          @if (erro()) { <p class="small text-warning mb-2" role="alert">{{ erro() }}</p> }
          <button class="btn btn-outline-light btn-sm w-100" type="button" [disabled]="saindo()" (click)="sair()">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>{{ saindo() ? 'Saindo…' : 'Sair da conta' }}
          </button>
        }
        <p class="mt-3">Every Shot Counts.</p>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly saindo = signal(false);
  readonly erro = signal('');

  async sair(): Promise<void> {
    if (this.saindo()) return;
    this.saindo.set(true);
    this.erro.set('');
    try { await this.auth.sair(); this.fechar.emit(); }
    catch (erro) { this.erro.set(mensagemErro(erro)); }
    finally { this.saindo.set(false); }
  }

  readonly aberta = input(false);
  readonly fechar = output<void>();

  readonly grupos = [
    [
      { nome: 'Dashboard', path: '/', icone: 'grid-1x2' },
      { nome: 'Jogadores', path: '/jogadores', icone: 'people' },
      { nome: 'Treinos', path: '/treinos', icone: 'calendar4-week' },
      { nome: 'Arremessos', path: '/arremessos', icone: 'bullseye' },
    ],
    [
      { nome: 'Evolução', path: '/evolucao', icone: 'graph-up' },
      { nome: 'Ranking', path: '/ranking', icone: 'list-ol' },
    ],
  ];
}
