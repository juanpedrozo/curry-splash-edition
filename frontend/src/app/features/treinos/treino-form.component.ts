import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { hoje, inteiroValido } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { ArremessoDados, nomeZona, Zona, ZONAS, ZonaTotal } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { EstadoComponent } from '../../shared/estado.component';
import { QuadraComponent } from '../../shared/quadra.component';
import { CamposZona, criarCamposZona, ZonaCamposComponent } from '../../shared/zona-campos.component';

@Component({
  selector: 'curry-treino-form',
  imports: [ReactiveFormsModule, RouterLink, EstadoComponent, QuadraComponent, ZonaCamposComponent],
  templateUrl: './treino-form.component.html',
})
export class TreinoFormComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);
  readonly store = inject(JogadoresStore);
  readonly id = toSignal(this.route.paramMap.pipe(map(params => params.has('id') ? Number(params.get('id')) : undefined)));
  readonly cancelar = computed(() => this.id() === undefined ? ['/treinos'] : ['/treinos', this.id()]);
  readonly treino = rxResource({ params: () => this.id(), stream: ({ params }) => this.api.treino(params) });
  readonly zona = signal<Zona>('TOPO_DO_ARCO');
  readonly salvando = signal(false);
  readonly erroSalvar = signal('');
  readonly mensagemErro = mensagemErro;
  readonly nomeZona = nomeZona;
  readonly zonas = ZONAS;
  readonly controles = Object.fromEntries(ZONAS.map(item => [item.id, criarCamposZona(false)])) as Record<Zona, CamposZona>;
  readonly form = new FormGroup({
    jogadorId: new FormControl<number | null>(this.store.selecionadoId(), Validators.required),
    data: new FormControl(hoje(), { nonNullable: true, validators: [Validators.required] }),
    duracaoMinutos: new FormControl<number | null>(null, [Validators.required, Validators.min(1), inteiroValido]),
    observacoes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
    zonas: new FormGroup(this.controles),
  });
  private readonly mudancas = toSignal(this.form.valueChanges);
  readonly quadra = computed<ZonaTotal[]>(() => {
    this.mudancas();
    return ZONAS.flatMap(({ id }) => {
      const grupo = this.controles[id];
      const { tentativas, acertos } = grupo.getRawValue();
      if (!grupo.valid || tentativas === null || acertos === null) return [];
      return [{ zona: id, tentativas, acertos, percentual: tentativas > 0 ? 100 * acertos / tentativas : null }];
    });
  });

  constructor() {
    effect(() => {
      if (this.treino.hasValue()) {
        const { sessao, arremessos } = this.treino.value();
        this.form.reset({
          jogadorId: sessao.jogadorId, data: sessao.data, duracaoMinutos: sessao.duracaoMinutos,
          observacoes: sessao.observacoes ?? '',
          zonas: Object.fromEntries(arremessos.map(({ zona, tentativas, acertos }) => [zona, { tentativas, acertos }])),
        });
      } else if (this.id() === undefined) {
        const jogador = this.store.selecionadoId();
        const controle = this.form.controls.jogadorId;
        if (controle.pristine) controle.setValue(jogador);
      }
    });
  }

  async salvar(): Promise<void> {
    if (this.salvando()) return;
    this.form.markAllAsTouched();
    this.erroSalvar.set('');
    if (this.form.invalid) {
      const primeira = ZONAS.find(zona => this.controles[zona.id].invalid);
      if (primeira) this.zona.set(primeira.id);
      return;
    }
    const { data, jogadorId, duracaoMinutos, observacoes } = this.form.getRawValue();
    if (jogadorId === null || duracaoMinutos === null) return;
    const arremessos: ArremessoDados[] = this.quadra().map(({ zona, tentativas, acertos }) => ({ zona, tentativas, acertos }));
    this.salvando.set(true);
    try {
      const { sessao } = await firstValueFrom(this.api.salvarTreino({
        jogadorId, data, duracaoMinutos, observacoes: observacoes.trim() || null, arremessos,
      }, this.id()));
      this.store.selecionar(jogadorId);
      this.ui.sucesso(this.id() === undefined ? 'Treino registrado.' : 'Treino atualizado.');
      await this.router.navigate(['/treinos', sessao.id]);
    } catch (erro) {
      this.erroSalvar.set(mensagemErro(erro));
    } finally {
      this.salvando.set(false);
    }
  }
}
