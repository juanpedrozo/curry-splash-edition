import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { formatarData, iniciais } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { Jogador } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { EstadoComponent } from '../../shared/estado.component';

@Component({
  selector: 'curry-jogadores',
  imports: [RouterLink, EstadoComponent],
  template: `
    <header class="page-heading">
      <div><h1>Jogadores</h1><p>Cadastre os atletas e escolha quem você quer acompanhar.</p></div>
      <a class="btn btn-primary" routerLink="/jogadores/novo"><i class="bi bi-plus-lg"></i> Novo jogador</a>
    </header>
    @if (erro()) { <p class="alert alert-danger form-error" role="alert">{{ erro() }}</p> }

    @if (store.carregando()) {
      <curry-estado [carregando]="true" titulo="Carregando jogadores" />
    } @else if (store.erro()) {
      <curry-estado [falha]="true" titulo="Não foi possível carregar os jogadores" [texto]="store.erro()">
        <button class="btn btn-outline-secondary" type="button" (click)="store.atualizar()">Tentar novamente</button>
      </curry-estado>
    } @else if (store.lista().length) {
      @if (store.lista().length > 3) {
        <div class="search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input class="form-control" type="search" aria-label="Buscar jogador" placeholder="Buscar por nome ou apelido"
                 (input)="busca.set($any($event.target).value)">
        </div>
      }
      <div class="players-grid">
        @for (jogador of jogadores(); track jogador.id) {
          <article class="card player-card" [class.active-player]="store.selecionadoId() === jogador.id">
            <div class="player-top">
              <span class="avatar">{{ iniciais(jogador.nome) }}</span>
              @if (store.selecionadoId() === jogador.id) { <span class="badge rate-badge"><i class="bi bi-check-circle"></i> Ativo</span> }
            </div>
            <h2><a class="table-link" [routerLink]="['/jogadores', jogador.id]">{{ jogador.nome }}</a></h2>
            <p>{{ jogador.posicao || 'Posição em aberto' }} @if (jogador.apelido) { <span>· {{ jogador.apelido }}</span> }</p>
            <p class="player-date"><i class="bi bi-calendar3"></i> Desde {{ formatarData(jogador.criadoEm) }}</p>
            <div class="player-actions">
              @if (store.selecionadoId() === jogador.id) {
                <a class="btn btn-outline-secondary" routerLink="/">Ver dashboard</a>
              } @else {
                <button type="button" class="btn btn-outline-secondary" (click)="selecionar(jogador)">Selecionar</button>
              }
              <a class="btn btn-outline-secondary icon-button" [routerLink]="['/jogadores', jogador.id, 'editar']"
                 [attr.aria-label]="'Editar ' + jogador.nome"><i class="bi bi-pencil"></i></a>
              <button class="btn btn-outline-secondary icon-button delete-icon" type="button" [disabled]="excluindo() !== null"
                      (click)="excluir(jogador)" [attr.aria-label]="'Excluir ' + jogador.nome"><i class="bi bi-trash3"></i></button>
            </div>
          </article>
        } @empty {
          <curry-estado icone="search" titulo="Nenhum jogador encontrado" texto="Busque por outro nome ou apelido." />
        }
      </div>
    } @else {
      <curry-estado icone="people" titulo="Nenhum jogador cadastrado" texto="Use Novo jogador para criar o primeiro perfil." />
    }
  `,
})
export class JogadoresComponent {
  readonly store = inject(JogadoresStore);
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);
  readonly erro = signal('');
  readonly busca = signal('');
  readonly excluindo = signal<number | null>(null);
  readonly iniciais = iniciais;
  readonly formatarData = formatarData;
  readonly jogadores = computed(() => {
    const busca = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.store.lista().filter(jogador => `${jogador.nome} ${jogador.apelido ?? ''}`.toLocaleLowerCase('pt-BR').includes(busca));
  });

  selecionar(jogador: Jogador): void {
    this.store.selecionar(jogador.id);
    this.ui.sucesso(`${jogador.nome} selecionado.`);
  }

  async excluir(jogador: Jogador): Promise<void> {
    if (!await this.ui.confirmar('Excluir jogador?', `${jogador.nome} e todos os seus treinos e arremessos serão excluídos.`)) return;
    this.excluindo.set(jogador.id);
    this.erro.set('');
    try {
      await firstValueFrom(this.api.excluirJogador(jogador.id));
      this.store.remover(jogador.id);
      this.ui.sucesso('Jogador excluído.');
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.excluindo.set(null);
    }
  }
}
