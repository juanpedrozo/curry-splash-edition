import { Component, input, output } from '@angular/core';
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
      <div class="sidebar-footer mt-auto">Every Shot Counts.</div>
    </aside>
  `,
})
export class SidebarComponent {
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
