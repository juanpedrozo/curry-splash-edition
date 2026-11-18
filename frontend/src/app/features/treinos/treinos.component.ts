import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, mensagemErro } from '../../core/api.service';
import { JogadoresStore } from '../../core/jogadores.store';
import { EstadoComponent } from '../../shared/estado.component';
import { TreinosTabelaComponent } from '../../shared/treinos-tabela.component';

@Component({
  selector: 'curry-treinos',
  imports: [RouterLink, EstadoComponent, TreinosTabelaComponent],
  template: `
    <header class="page-heading">
      <div><h1>Treinos</h1><p>Consulte as sessões registradas e abra os resultados por zona.</p></div>
    </header>
    @if (store.carregando() || treinos.isLoading()) {
      <curry-estado [carregando]="true" titulo="Carregando treinos" />
    } @else if (store.erro()) {
      <curry-estado [falha]="true" titulo="Não foi possível carregar os jogadores" [texto]="store.erro()">
        <button class="btn btn-outline-secondary" type="button" (click)="store.atualizar()">Tentar novamente</button>
      </curry-estado>
    } @else if (treinos.error(); as erro) {
      <curry-estado [falha]="true" titulo="Não foi possível carregar os treinos" [texto]="mensagemErro(erro)">
        <button class="btn btn-outline-secondary" type="button" (click)="treinos.reload()">Tentar novamente</button>
      </curry-estado>
    } @else {
      <section class="card dashboard-panel">
        <header class="section-head">
          <div><h2>Histórico de treinos</h2><p>{{ todas() ? 'Todos os jogadores' : store.ativo()?.nome }}</p></div>
          @if (store.lista().length > 1) {
            <div class="btn-group btn-group-sm segmented" role="group" aria-label="Filtrar treinos">
              <button class="btn btn-outline-secondary" type="button" [attr.aria-pressed]="!todas()" (click)="todas.set(false)">Jogador ativo</button>
              <button class="btn btn-outline-secondary" type="button" [attr.aria-pressed]="todas()" (click)="todas.set(true)">Todos</button>
            </div>
          }
        </header>
        @if (treinos.hasValue() && treinos.value().length) {
          <curry-treinos-tabela [treinos]="treinos.value()" [jogador]="todas()" />
        } @else {
          <div class="panel-empty">
            <i class="bi bi-calendar4-week"></i><p>Nenhum treino registrado.</p>
            <a class="text-action" [routerLink]="store.lista().length ? '/treinos/novo' : '/jogadores/novo'"
               [queryParams]="store.lista().length ? null : { proximo: 'treino' }">
              {{ store.lista().length ? 'Registrar treino' : 'Cadastrar jogador' }} <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        }
      </section>
    }
  `,
})
export class TreinosComponent {
  readonly store = inject(JogadoresStore);
  private readonly api = inject(ApiService);
  readonly todas = signal(false);
  readonly treinos = rxResource({
    params: () => this.store.lista().length ? { id: this.todas() ? undefined : this.store.selecionadoId() ?? undefined } : undefined,
    stream: ({ params }) => this.api.treinos(params.id),
  });
  readonly mensagemErro = mensagemErro;
}
