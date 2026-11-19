import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JogadoresStore } from '../core/jogadores.store';

@Component({
  selector: 'curry-header',
  imports: [RouterLink],
  template: `
    <header class="navbar app-header" (keydown.escape)="fecharMenu.emit()">
      <div class="header-context d-flex align-items-center">
        <button class="btn btn-outline-secondary icon-button mobile-menu" type="button" [attr.aria-expanded]="menuAberto()"
                aria-controls="menu-principal" [attr.aria-label]="menuAberto() ? 'Fechar menu' : 'Abrir menu'"
                (click)="abrirMenu.emit()">
          <i class="bi bi-list" aria-hidden="true"></i>
        </button>
        <a class="navbar-brand brand d-flex align-items-center" routerLink="/" aria-label="CURRY Splash Edition, início"
           (click)="fecharMenu.emit()">
          <img src="marca.svg" width="32" height="32" alt="">
          <strong>CURRY</strong>
          <span class="brand-edition d-none d-sm-inline">Splash Edition</span>
        </a>
      </div>

      <div class="header-actions d-flex align-items-center">
        @if (store.lista().length) {
          <div class="athlete-picker">
            <label class="athlete-label" for="jogador-ativo">Jogador ativo</label>
            <select class="form-select form-select-sm" id="jogador-ativo" [value]="store.selecionadoId()"
                    (change)="store.selecionar(+$any($event.target).value)">
              @for (jogador of store.lista(); track jogador.id) {
                <option [value]="jogador.id" [selected]="jogador.id === store.selecionadoId()">{{ jogador.nome }}</option>
              }
            </select>
          </div>
        }
        <a class="btn btn-primary btn-sm header-new" [routerLink]="store.lista().length ? '/treinos/novo' : '/jogadores/novo'"
           [queryParams]="store.lista().length ? null : { proximo: 'treino' }" (click)="fecharMenu.emit()">
          <i class="bi bi-plus-lg" aria-hidden="true"></i><span>Novo treino</span>
        </a>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly menuAberto = input(false);
  readonly abrirMenu = output<void>();
  readonly fecharMenu = output<void>();
  readonly store = inject(JogadoresStore);
}
