import { Component, input } from '@angular/core';

@Component({
  selector: 'curry-estado',
  template: `
    <div class="card empty-state" [attr.role]="falha() ? 'alert' : 'status'" [attr.aria-busy]="carregando()">
      @if (carregando()) {
        <span class="spinner-border spinner-border-sm text-warning" aria-hidden="true"></span>
      } @else {
        <span class="icon-tile" [class.destructive]="falha()"><i [class]="'bi bi-' + icone()" aria-hidden="true"></i></span>
      }
      <h2>{{ titulo() }}</h2>
      @if (texto()) { <p>{{ texto() }}</p> }
      <ng-content />
    </div>
  `,
})
export class EstadoComponent {
  readonly titulo = input.required<string>();
  readonly texto = input('');
  readonly icone = input('inbox');
  readonly carregando = input(false);
  readonly falha = input(false);
}
