import { Component, input } from '@angular/core';
import { inteiro, percentual } from '../core/format';
import { nomeZona, ZonaTotal } from '../core/models';

@Component({
  selector: 'curry-zonas-lista',
  template: `
    <div class="table-responsive">
      <table class="table table-splash align-middle zone-table" aria-label="Aproveitamento por zona">
        <thead>
          <tr>
            <th scope="col">Zona</th>
            <th scope="col" class="text-end" aria-label="Acertos sobre tentativas">Acertos / tent.</th>
            <th scope="col" class="text-end" aria-label="Aproveitamento">%</th>
          </tr>
        </thead>
        <tbody>
          @for (zona of zonas(); track zona.zona) {
            <tr>
              <th scope="row">{{ nomeZona(zona.zona) }}</th>
              <td class="text-end">{{ inteiro(zona.acertos) }} / {{ inteiro(zona.tentativas) }}</td>
              <td class="text-end fw-semibold">{{ percentual(zona.percentual) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ZonasListaComponent {
  readonly zonas = input.required<ZonaTotal[]>();
  readonly nomeZona = nomeZona;
  readonly inteiro = inteiro;
  readonly percentual = percentual;
}
