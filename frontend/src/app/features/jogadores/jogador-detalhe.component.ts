import { Component, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { formatarData, iniciais, inteiro, percentual } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { EstadoComponent } from '../../shared/estado.component';

@Component({
  selector: 'curry-jogador-detalhe',
  imports: [RouterLink, EstadoComponent],
  template: `
    <a class="back-link" routerLink="/jogadores"><i class="bi bi-arrow-left"></i> Jogadores</a>
    @if (resumo.isLoading()) {
      <curry-estado [carregando]="true" titulo="Carregando perfil" />
    } @else if (resumo.error(); as erro) {
      <curry-estado [falha]="true" titulo="Não foi possível abrir o perfil" [texto]="mensagemErro(erro)">
        <button type="button" class="btn btn-outline-secondary" (click)="resumo.reload()">Tentar novamente</button>
      </curry-estado>
    } @else if (resumo.hasValue()) {
      @let dados = resumo.value();
      @let jogador = dados.jogador;
      <header class="page-heading">
        <div><h1>{{ jogador.nome }}</h1><p>Perfil do jogador</p></div>
        <a class="btn btn-outline-secondary" [routerLink]="['/jogadores', jogador.id, 'editar']"><i class="bi bi-pencil"></i> Editar jogador</a>
      </header>
      <section class="card form-panel compact-form">
        <div class="identity-row">
          <span class="avatar">{{ iniciais(jogador.nome) }}</span>
          <div><h2>{{ jogador.apelido || jogador.nome }}</h2><p>{{ jogador.posicao || 'Posição em aberto' }}</p></div>
        </div>
        <dl class="details-grid">
          <div><dt>Cadastro</dt><dd>{{ formatarData(jogador.criadoEm) }}</dd></div>
          <div><dt>Treinos</dt><dd>{{ inteiro(dados.totais.totalTreinos) }}</dd></div>
          <div><dt>Aproveitamento</dt><dd>{{ percentual(dados.totais.percentual) }}</dd></div>
        </dl>
        <div class="form-actions">
          <a class="btn btn-primary" routerLink="/" (click)="store.selecionar(jogador.id)">Acompanhar desempenho <i class="bi bi-arrow-right"></i></a>
        </div>
      </section>
    }
  `,
})
export class JogadorDetalheComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(JogadoresStore);
  readonly id = toSignal(this.route.paramMap.pipe(map(params => Number(params.get('id')))));
  readonly resumo = rxResource({ params: () => this.id(), stream: ({ params }) => this.api.resumo(params) });
  readonly formatarData = formatarData;
  readonly inteiro = inteiro;
  readonly iniciais = iniciais;
  readonly percentual = percentual;
  readonly mensagemErro = mensagemErro;
}
