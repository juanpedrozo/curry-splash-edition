import { Component, computed, input, output } from '@angular/core';
import { inteiro, percentual } from '../core/format';
import { Zona, ZonaTotal, ZONAS } from '../core/models';

@Component({
  selector: 'curry-quadra',
  template: `
    <div class="court">
      <svg viewBox="0 0 500 320" aria-hidden="true" class="court-svg">
        <rect class="court-floor" x="18" y="22" width="464" height="281"/>
        <path class="court-lane-fill" d="M 180 23 H 320 V 147 H 180 Z"/>
        <path class="court-line" d="M 180 23 V 147 H 320 V 23
          M 195 53 H 180 M 195 75 H 180 M 195 97 H 180 M 195 119 H 180
          M 305 53 H 320 M 305 75 H 320 M 305 97 H 320 M 305 119 H 320
          M 180 147 A 70 59 0 0 0 320 147
          M 211 67 A 39 36 0 0 0 289 67
          M 199 303 A 51 44 0 0 1 301 303"/>
        <path class="court-dash" d="M 180 147 A 70 59 0 0 1 320 147"/>
        <path class="court-three" d="M 55 23 V 105 C 55 194 142 265 250 265 S 445 194 445 105 V 23"/>
        <path class="court-rim" d="M 227 49 H 273 M 250 49 V 55"/>
        <circle class="court-rim" cx="250" cy="65" r="10"/>
      </svg>

      <div class="court-points" role="group" aria-label="Zonas de arremesso">
        @for (zona of marcadores(); track zona.id) {
          <button type="button" class="court-point" [class]="'court-point ' + tom(zona.total?.percentual)"
                  [class.selected]="zona.id === selecionada()"
                  [style.left.%]="zona.x / 5" [style.top.%]="zona.y / 3.2"
                  [attr.aria-pressed]="zona.id === selecionada()"
                  [attr.aria-label]="zona.nome + ', ' + (zona.total?.tentativas ?? 0) + ' tentativas, ' +
                    (zona.total?.acertos ?? 0) + ' acertos, ' + percentual(zona.total?.percentual ?? null)"
                  (click)="selecionar.emit(zona.id)">
            <span>{{ percentual(zona.total?.percentual ?? null) }}</span>
          </button>
        }
      </div>
    </div>
    @if (exibirDetalhes() && atual(); as zona) {
      <div class="court-details" aria-live="polite">
        <span>{{ zona.nome }}</span>
        <div>
          <span><strong>{{ inteiro(zona.total?.acertos ?? 0) }}</strong> acertos</span>
          <span><strong>{{ inteiro(zona.total?.tentativas ?? 0) }}</strong> tentativas</span>
          <strong class="court-percent">{{ percentual(zona.total?.percentual ?? null) }}</strong>
        </div>
      </div>
    }
  `,
  styleUrl: './quadra.component.css',
})
export class QuadraComponent {
  readonly dados = input<ZonaTotal[]>([]);
  readonly selecionada = input<Zona>('TOPO_DO_ARCO');
  readonly exibirDetalhes = input(true);
  readonly selecionar = output<Zona>();
  readonly marcadores = computed(() => ZONAS.map(zona => ({
    ...zona, total: this.dados().find(total => total.zona === zona.id),
  })));
  readonly atual = computed(() => this.marcadores().find(zona => zona.id === this.selecionada()));
  readonly percentual = percentual;
  readonly inteiro = inteiro;

  tom(valor: number | null | undefined): string {
    if (valor == null) return 'point-empty';
    if (valor >= 50) return 'point-high';
    return valor >= 35 ? 'point-middle' : 'point-low';
  }
}
