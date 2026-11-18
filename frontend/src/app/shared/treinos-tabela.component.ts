import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatarData, inteiro, percentual } from '../core/format';
import { Treino } from '../core/models';

@Component({
  selector: 'curry-treinos-tabela',
  imports: [RouterLink],
  template: `
    <div class="table-responsive">
      <table class="table table-hover table-splash align-middle">
        <thead>
          <tr>
            <th scope="col">Data</th>
            @if (jogador()) { <th scope="col" class="d-none d-sm-table-cell">Jogador</th> }
            <th scope="col" class="d-none d-sm-table-cell">Duração</th>
            <th scope="col" class="text-end" aria-label="Acertos / tentativas">
              <span class="d-none d-sm-inline">Acertos / tentativas</span><span class="d-sm-none">Acertos / tent.</span>
            </th>
            <th scope="col" class="text-end" aria-label="Aproveitamento">%</th>
          </tr>
        </thead>
        <tbody>
          @for (treino of treinos(); track treino.id) {
            <tr>
              <th scope="row">
                <a class="table-link" [routerLink]="['/treinos', treino.id]">{{ formatarData(treino.data) }}</a>
                @if (jogador()) { <small class="d-block d-sm-none text-body-secondary">{{ treino.jogadorNome }}</small> }
              </th>
              @if (jogador()) { <td class="d-none d-sm-table-cell">{{ treino.jogadorNome }}</td> }
              <td class="d-none d-sm-table-cell">{{ inteiro(treino.duracaoMinutos) }} min</td>
              <td class="text-end">{{ inteiro(treino.acertos) }} / {{ inteiro(treino.tentativas) }}</td>
              <td class="text-end fw-semibold">{{ percentual(treino.percentual) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TreinosTabelaComponent {
  readonly treinos = input.required<Treino[]>();
  readonly jogador = input(false);
  readonly formatarData = formatarData;
  readonly inteiro = inteiro;
  readonly percentual = percentual;
}
