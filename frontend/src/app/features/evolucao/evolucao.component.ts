import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { formatarData, inteiro, percentual, pontosPercentuais } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { Treino } from '../../core/models';
import { EstadoComponent } from '../../shared/estado.component';
import { GraficoComponent } from '../../shared/grafico.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { TreinosTabelaComponent } from '../../shared/treinos-tabela.component';
import { ZonasListaComponent } from '../../shared/zonas-lista.component';

@Component({
  selector: 'curry-evolucao',
  imports: [RouterLink, EstadoComponent, GraficoComponent, StatCardComponent, TreinosTabelaComponent, ZonasListaComponent],
  templateUrl: './evolucao.component.html',
})
export class EvolucaoComponent {
  readonly store = inject(JogadoresStore);
  private readonly api = inject(ApiService);
  readonly dados = rxResource({
    params: () => this.store.selecionadoId() ?? undefined,
    stream: ({ params: id }) => forkJoin({ evolucao: this.api.evolucao(id), zonas: this.api.zonas(id) }),
  });
  readonly sessaoAId = signal<number | null>(null);
  readonly sessaoBId = signal<number | null>(null);
  readonly sessoes = computed(() => this.dados.hasValue() ? this.dados.value().evolucao.sessoes : []);
  readonly sessaoA = computed<Treino | undefined>(() => this.sessoes().find(sessao => sessao.id === this.sessaoAId()) ?? this.sessoes().at(0));
  readonly sessaoB = computed<Treino | undefined>(() => this.sessoes().find(sessao => sessao.id === this.sessaoBId()) ?? this.sessoes().at(-1));
  readonly temGrafico = computed(() => this.dados.hasValue() &&
    this.dados.value().evolucao.pontos.some(ponto => ponto.percentual !== null));
  readonly formatarData = formatarData;
  readonly inteiro = inteiro;
  readonly percentual = percentual;
  readonly pontosPercentuais = pontosPercentuais;
  readonly mensagemErro = mensagemErro;

  legenda(sessao: Treino): string {
    return `${formatarData(sessao.data)} · ${sessao.duracaoMinutos} min · #${sessao.id}`;
  }
}
