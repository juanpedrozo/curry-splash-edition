import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { formatarData, inteiro, percentual } from '../../core/format';
import { nomeZona, Treino, Zona } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { EstadoComponent } from '../../shared/estado.component';
import { QuadraComponent } from '../../shared/quadra.component';

@Component({
  selector: 'curry-treino-detalhe',
  imports: [RouterLink, EstadoComponent, QuadraComponent],
  template: `
    <a class="back-link" routerLink="/treinos"><i class="bi bi-arrow-left"></i> Histórico de treinos</a>
    @if (treino.isLoading()) {
      <curry-estado [carregando]="true" titulo="Carregando treino" />
    } @else if (treino.error(); as erro) {
      <curry-estado [falha]="true" titulo="Não foi possível abrir o treino" [texto]="mensagemErro(erro)">
        <button class="btn btn-outline-secondary" type="button" (click)="treino.reload()">Tentar novamente</button>
      </curry-estado>
    } @else if (treino.hasValue()) {
      @let dados = treino.value();
      @let sessao = dados.sessao;
      <header class="page-heading">
        <div><h1>Treino de {{ formatarData(sessao.data) }}</h1><p>{{ sessao.jogadorNome }}</p></div>
        <div class="heading-actions">
          <a class="btn btn-outline-secondary" [routerLink]="['/treinos', sessao.id, 'editar']"><i class="bi bi-pencil"></i> Editar treino</a>
          <button type="button" class="btn btn-outline-danger" [disabled]="excluindo()" (click)="excluir(sessao)">
            <i class="bi bi-trash3"></i> Excluir treino
          </button>
        </div>
      </header>
      @if (erroExcluir()) { <p class="alert alert-danger form-error" role="alert">{{ erroExcluir() }}</p> }
      <div class="workspace-grid">
        <section class="card form-panel">
          <header class="section-head"><div><h2>Resumo do treino</h2></div><i class="bi bi-calendar4-week section-icon"></i></header>
          <dl class="details-grid session-metrics">
            <div><dt>Duração</dt><dd>{{ inteiro(sessao.duracaoMinutos) }} min</dd></div>
            <div><dt>Acertos</dt><dd>{{ inteiro(sessao.acertos) }} / {{ inteiro(sessao.tentativas) }}</dd></div>
            <div><dt>Aproveitamento</dt><dd class="color-gold">{{ percentual(sessao.percentual) }}</dd></div>
          </dl>
          @if (sessao.observacoes) {
            <h3 class="small-heading">Observações</h3><p class="session-notes">{{ sessao.observacoes }}</p>
          }
        </section>

        <section class="card form-panel">
          <header class="section-head">
            <div><h2>Arremessos por zona</h2><p>{{ dados.arremessos.length }} de 5 zonas registradas</p></div>
            <a class="text-action" [routerLink]="['/arremessos', sessao.id]">Gerenciar <i class="bi bi-arrow-right"></i></a>
          </header>
          <curry-quadra [dados]="zonas()" [selecionada]="zona()" (selecionar)="zona.set($event)" />
          @if (dados.arremessos.length) {
            <div class="table-responsive mt-3">
              <table class="table table-hover table-splash">
                <thead><tr><th scope="col">Zona</th><th scope="col">Acertos / tentativas</th><th scope="col">Aprov.</th></tr></thead>
                <tbody>
                  @for (item of dados.arremessos; track item.id) {
                    <tr><td>{{ nomeZona(item.zona) }}</td><td>{{ inteiro(item.acertos) }} / {{ inteiro(item.tentativas) }}</td>
                      <td>{{ percentual(item.percentual) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    }
  `,
})
export class TreinoDetalheComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);
  readonly id = toSignal(this.route.paramMap.pipe(map(params => Number(params.get('id')))));
  readonly treino = rxResource({ params: () => this.id(), stream: ({ params }) => this.api.treino(params) });
  readonly zonas = computed(() => this.treino.hasValue() ? this.treino.value().arremessos : []);
  readonly zona = signal<Zona>('TOPO_DO_ARCO');
  readonly erroExcluir = signal('');
  readonly excluindo = signal(false);
  readonly nomeZona = nomeZona;
  readonly inteiro = inteiro;
  readonly percentual = percentual;
  readonly formatarData = formatarData;
  readonly mensagemErro = mensagemErro;

  async excluir(treino: Treino): Promise<void> {
    if (!await this.ui.confirmar('Excluir treino?', 'A sessão e seus arremessos serão excluídos.')) return;
    this.excluindo.set(true);
    this.erroExcluir.set('');
    try {
      await firstValueFrom(this.api.excluirTreino(treino.id));
      this.ui.sucesso('Treino excluído.');
      await this.router.navigate(['/treinos']);
    } catch (erro) {
      this.erroExcluir.set(mensagemErro(erro));
    } finally {
      this.excluindo.set(false);
    }
  }
}
