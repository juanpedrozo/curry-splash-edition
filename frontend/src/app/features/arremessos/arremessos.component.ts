import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ApiService, mensagemErro } from '../../core/api.service';
import { formatarData, inteiro, percentual } from '../../core/format';
import { JogadoresStore } from '../../core/jogadores.store';
import { Arremesso, nomeZona, Zona, ZONAS } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { EstadoComponent } from '../../shared/estado.component';
import { QuadraComponent } from '../../shared/quadra.component';
import { criarCamposZona, ZonaCamposComponent } from '../../shared/zona-campos.component';

@Component({
  selector: 'curry-arremessos',
  imports: [RouterLink, ReactiveFormsModule, EstadoComponent, QuadraComponent, ZonaCamposComponent],
  templateUrl: './arremessos.component.html',
})
export class ArremessosComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(JogadoresStore);
  private readonly ui = inject(UiService);

  readonly treinoDaRota = toSignal(this.route.paramMap.pipe(map(params => params.has('treinoId') ? Number(params.get('treinoId')) : null)));
  readonly treinos = rxResource({ stream: () => this.api.treinos() });
  readonly treinoAtivo = computed(() => {
    if (!this.treinos.hasValue()) return null;
    const lista = this.treinos.value();
    const id = this.treinoDaRota();
    return id != null ? lista.find(treino => treino.id === id) ?? null
      : lista.find(treino => treino.jogadorId === this.store.selecionadoId()) ?? lista[0] ?? null;
  });
  readonly arremessos = rxResource({
    params: () => this.treinoAtivo()?.id,
    stream: ({ params }) => this.api.arremessos(params),
  });
  readonly zona = signal<Zona>('TOPO_DO_ARCO');
  readonly registros = computed(() => {
    const arremessos = this.arremessos.hasValue() ? this.arremessos.value() : [];
    return ZONAS.flatMap(({ id }) => arremessos.filter(arremesso => arremesso.zona === id));
  });
  readonly atual = computed(() => this.registros().find(item => item.zona === this.zona()));
  readonly form = criarCamposZona(true);
  readonly erroAlteracao = signal('');
  readonly operando = signal(false);
  readonly formatarData = formatarData;
  readonly percentual = percentual;
  readonly nomeZona = nomeZona;
  readonly inteiro = inteiro;
  readonly mensagemErro = mensagemErro;

  constructor() {
    effect(() => {
      this.zona();
      this.treinoAtivo();
      const item = this.atual();
      this.form.reset({ tentativas: item?.tentativas ?? null, acertos: item?.acertos ?? null });
      this.erroAlteracao.set('');
    });
  }

  trocarTreino(id: number): void {
    void this.router.navigate(['/arremessos', id]);
  }

  async salvar(): Promise<void> {
    this.form.markAllAsTouched();
    const treinoId = this.treinoAtivo()?.id;
    const { tentativas, acertos } = this.form.getRawValue();
    if (this.form.invalid || treinoId === undefined || tentativas === null || acertos === null || this.operando()) return;
    const id = this.atual()?.id;
    this.operando.set(true);
    this.erroAlteracao.set('');
    try {
      await firstValueFrom(this.api.salvarArremesso({ treinoId, zona: this.zona(), tentativas, acertos }, id));
      this.arremessos.reload();
      this.ui.sucesso(id === undefined ? 'Zona registrada.' : 'Arremessos atualizados.');
    } catch (erro) {
      this.erroAlteracao.set(mensagemErro(erro));
    } finally {
      this.operando.set(false);
    }
  }

  async excluir(item: Arremesso): Promise<void> {
    if (!await this.ui.confirmar('Excluir registro da zona?', `Os arremessos de ${nomeZona(item.zona)} serão removidos deste treino.`)) return;
    this.operando.set(true);
    this.erroAlteracao.set('');
    try {
      await firstValueFrom(this.api.excluirArremesso(item.id));
      this.arremessos.reload();
      this.ui.sucesso('Registro excluído.');
    } catch (erro) {
      this.erroAlteracao.set(mensagemErro(erro));
    } finally {
      this.operando.set(false);
    }
  }
}
