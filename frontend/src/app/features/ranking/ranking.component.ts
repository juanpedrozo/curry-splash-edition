import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, mensagemErro } from '../../core/api.service';
import { iniciais, inteiro, percentual } from '../../core/format';
import { nomeZona } from '../../core/models';
import { EstadoComponent } from '../../shared/estado.component';

@Component({
  selector: 'curry-ranking',
  imports: [EstadoComponent, RouterLink],
  template: `
    <header class="page-heading">
      <div><h1>Ranking</h1><p>Compare os resultados gerais dos jogadores. Os treinos individuais são privados.</p></div>
    </header>
    @if (ranking.isLoading()) {
      <curry-estado [carregando]="true" titulo="Carregando ranking" />
    } @else if (ranking.error(); as erro) {
      <curry-estado [falha]="true" titulo="Não foi possível carregar o ranking" [texto]="mensagemErro(erro)">
        <button class="btn btn-outline-secondary" type="button" (click)="ranking.reload()">Tentar novamente</button>
      </curry-estado>
    } @else if (ranking.hasValue() && ranking.value().length) {
      <section class="card dashboard-panel">
        <header class="section-head"><div><h2>Classificação de jogadores</h2>
          <p>A colocação considera a taxa de acerto. O volume de tentativas dá contexto ao resultado.</p></div>
          <i class="bi bi-trophy section-icon"></i>
        </header>
        <div class="table-responsive">
          <table class="table table-hover table-splash align-middle">
            <thead><tr><th scope="col">Pos.</th><th scope="col">Jogador</th><th scope="col">Aproveitamento</th>
              <th scope="col">Treinos</th><th scope="col">Acertos</th><th scope="col">Tentativas</th><th scope="col">Melhor zona</th></tr></thead>
            <tbody>
              @for (item of ranking.value(); track item.jogadorId) {
                <tr>
                  <td><span class="rank-position" [class.rank-first]="item.colocacao === 1">{{ item.colocacao ?? '—' }}</span></td>
                  <td><span class="ranking-player">
                    <span class="avatar avatar-small">{{ iniciais(item.nome) }}</span>{{ item.nome }}
                  </span></td>
                  <td><span class="badge rate-badge" [class.no-rate]="item.totais.percentual === null">{{ percentual(item.totais.percentual) }}</span></td>
                  <td>{{ inteiro(item.totais.totalTreinos) }}</td><td>{{ inteiro(item.totais.acertos) }}</td>
                  <td>{{ inteiro(item.totais.tentativas) }}</td><td>{{ item.melhorZona ? nomeZona(item.melhorZona.zona) : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else {
      <curry-estado icone="trophy" titulo="Nenhum jogador para comparar">
        <a class="btn btn-primary" routerLink="/jogadores/novo">Novo jogador</a>
      </curry-estado>
    }
  `,
})
export class RankingComponent {
  private readonly api = inject(ApiService);
  readonly ranking = rxResource({ stream: () => this.api.ranking() });
  readonly iniciais = iniciais;
  readonly inteiro = inteiro;
  readonly percentual = percentual;
  readonly nomeZona = nomeZona;
  readonly mensagemErro = mensagemErro;
}
