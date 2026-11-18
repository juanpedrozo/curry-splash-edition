import { Component, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { JogadoresStore } from '../../core/jogadores.store';
import { UiService } from '../../core/ui.service';
import { EstadoComponent } from '../../shared/estado.component';

@Component({
  selector: 'curry-jogador-form',
  imports: [ReactiveFormsModule, RouterLink, EstadoComponent],
  template: `
    <a class="back-link" routerLink="/jogadores"><i class="bi bi-arrow-left"></i> Jogadores</a>
    <header class="page-heading">
      <div><h1>{{ id() === undefined ? 'Novo jogador' : 'Editar jogador' }}</h1>
        <p>Personalize o perfil usado para acompanhar os treinos.</p></div>
    </header>
    @if (jogador.isLoading()) {
      <curry-estado [carregando]="true" titulo="Carregando jogador" />
    } @else if (jogador.error(); as erro) {
      <curry-estado [falha]="true" titulo="Não foi possível abrir o jogador" [texto]="mensagemErro(erro)">
        <button class="btn btn-outline-secondary" type="button" (click)="jogador.reload()">Tentar novamente</button>
      </curry-estado>
    } @else {
      <form class="card form-panel compact-form" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="nome">Nome completo <span class="required-mark">*</span></label>
            <input class="form-control" id="nome" formControlName="nome" placeholder="Ex. Gabriel Santos"
                   maxlength="120" autocomplete="off" [class.is-invalid]="form.controls.nome.touched && form.controls.nome.invalid"
                   [attr.aria-invalid]="form.controls.nome.touched && form.controls.nome.invalid" aria-describedby="erro-nome">
            @if (form.controls.nome.touched && form.controls.nome.invalid) {
              <div class="invalid-feedback" id="erro-nome">Informe o nome do jogador.</div>
            }
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label" for="apelido">Apelido</label>
            <input class="form-control" id="apelido" formControlName="apelido" maxlength="60" placeholder="Ex. Gabs">
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label" for="posicao">Posição</label>
            <input class="form-control" id="posicao" formControlName="posicao" maxlength="30" list="posicoes" placeholder="Escolha ou digite">
            <datalist id="posicoes">
              @for (posicao of posicoes; track posicao) { <option [value]="posicao"></option> }
            </datalist>
          </div>
        </div>
        @if (erroSalvar()) { <p class="alert alert-danger form-error" role="alert">{{ erroSalvar() }}</p> }
        <div class="form-actions">
          <a class="btn btn-outline-secondary" routerLink="/jogadores">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="salvando()">
            <i class="bi bi-check2"></i> {{ salvando() ? 'Salvando…' : 'Salvar jogador' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class JogadorFormComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(JogadoresStore);
  private readonly ui = inject(UiService);
  readonly id = toSignal(this.route.paramMap.pipe(map(params => params.has('id') ? Number(params.get('id')) : undefined)));
  readonly jogador = rxResource({ params: () => this.id(), stream: ({ params }) => this.api.jogador(params) });
  readonly salvando = signal(false);
  readonly erroSalvar = signal('');
  readonly mensagemErro = mensagemErro;
  readonly posicoes = ['Armador', 'Ala-armador', 'Ala', 'Ala-pivô', 'Pivô'];
  readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    apelido: ['', Validators.maxLength(60)],
    posicao: ['', Validators.maxLength(30)],
  });

  constructor() {
    effect(() => {
      if (this.jogador.hasValue()) {
        const jogador = this.jogador.value();
        this.form.reset({ nome: jogador.nome, apelido: jogador.apelido ?? '', posicao: jogador.posicao ?? '' });
      }
    });
  }

  async salvar(): Promise<void> {
    if (this.salvando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.salvando.set(true);
    this.erroSalvar.set('');
    try {
      const entrada = this.form.getRawValue();
      const jogador = await firstValueFrom(this.api.salvarJogador({
        nome: entrada.nome.trim(), apelido: entrada.apelido.trim() || null, posicao: entrada.posicao.trim() || null,
      }, this.id()));
      this.store.salvar(jogador);
      this.ui.sucesso(this.id() === undefined ? 'Jogador cadastrado.' : 'Jogador atualizado.');
      if (this.route.snapshot.queryParamMap.get('proximo') === 'treino') {
        this.store.selecionar(jogador.id);
        await this.router.navigate(['/treinos/novo']);
      } else {
        await this.router.navigate(['/jogadores']);
      }
    } catch (erro) {
      this.erroSalvar.set(mensagemErro(erro));
    } finally {
      this.salvando.set(false);
    }
  }
}
