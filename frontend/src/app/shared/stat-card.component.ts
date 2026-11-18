import { Component, input } from '@angular/core';

@Component({
  selector: 'curry-stat-card',
  template: `
    <article class="stat-card" [class.stat-featured]="destaque()">
      <h2 class="stat-title">{{ titulo() }}</h2>
      <div class="stat-value" [attr.aria-label]="titulo() + ': ' + valor()">{{ valor() }}</div>
      @if (subtitulo()) { <div class="stat-subtitle">{{ subtitulo() }}</div> }
    </article>
  `,
})
export class StatCardComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string>();
  readonly subtitulo = input('');
  readonly destaque = input(false);
}
