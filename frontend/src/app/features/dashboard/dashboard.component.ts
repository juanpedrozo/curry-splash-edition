import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { hoje, inteiro, percentual } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { nomeZona, Zona } from '../../core/models';
import { EstadoComponent } from '../../shared/estado.component';
import { GraficoComponent } from '../../shared/grafico.component';
import { QuadraComponent } from '../../shared/quadra.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { TreinosTabelaComponent } from '../../shared/treinos-tabela.component';
import { ZonasListaComponent } from '../../shared/zonas-lista.component';

@Component({
  selector: 'curry-dashboard',
  imports: [EstadoComponent, GraficoComponent, QuadraComponent, RouterLink, StatCardComponent,
    TreinosTabelaComponent, ZonasListaComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly store = inject(JogadoresStore);
  private readonly api = inject(ApiService);
  readonly selecionada = signal<Zona>('TOPO_DO_ARCO');
  readonly periodo = signal<'tudo' | '30-dias'>('tudo');
  readonly dados = rxResource({
    params: () => this.store.selecionadoId() ?? undefined,
    stream: ({ params: id }) => forkJoin({
      resumo: this.api.resumo(id), zonas: this.api.zonas(id), evolucao: this.api.evolucao(id),
    }),
  });
  readonly pontos = computed(() => {
    if (!this.dados.hasValue()) return [];
    const pontos = this.dados.value().evolucao.pontos;
    if (this.periodo() === 'tudo') return pontos;
    const dataAtual = hoje();
    const limite = new Date(dataAtual + 'T00:00:00Z');
    limite.setUTCDate(limite.getUTCDate() - 29);
    const dataInicial = limite.toISOString().slice(0, 10);
    return pontos.filter(ponto => ponto.data >= dataInicial && ponto.data <= dataAtual);
  });
  readonly temGrafico = computed(() => this.pontos().some(ponto => ponto.percentual !== null));
  readonly inteiro = inteiro;
  readonly percentual = percentual;
  readonly nomeZona = nomeZona;
  readonly mensagemErro = mensagemErro;
}
