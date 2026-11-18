import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, mensagemErro } from './api.service';
import { Jogador } from './models';

const CHAVE = 'curry.jogadorAtivo';
function lerSelecao(): number | null {
  try {
    const id = Number(localStorage.getItem(CHAVE));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class JogadoresStore {
  private readonly api = inject(ApiService);
  private readonly jogadores = signal<Jogador[]>([]);
  private readonly ativoId = signal<number | null>(lerSelecao());
  private pedido = 0;

  readonly lista = this.jogadores.asReadonly();
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly ativo = computed(() => this.jogadores().find(jogador => jogador.id === this.ativoId()) ?? null);
  readonly selecionadoId = computed(() => this.ativo()?.id ?? null);

  async atualizar(): Promise<void> {
    const pedido = ++this.pedido;
    this.carregando.set(true);
    this.erro.set('');
    try {
      const jogadores = await firstValueFrom(this.api.jogadores());
      if (pedido !== this.pedido) return;
      this.jogadores.set(jogadores);
      this.selecionar(jogadores.find(jogador => jogador.id === this.ativoId())?.id ?? jogadores[0]?.id ?? null);
    } catch (erro) {
      if (pedido === this.pedido) this.erro.set(mensagemErro(erro));
    } finally {
      if (pedido === this.pedido) this.carregando.set(false);
    }
  }

  selecionar(id: number | null): void {
    if (id !== null && !this.jogadores().some(jogador => jogador.id === id)) return;
    this.ativoId.set(id);
    try {
      if (id === null) localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, String(id));
    } catch {
      // A seleção continua disponível nesta aba.
    }
  }

  salvar(jogador: Jogador): void {
    this.jogadores.update(lista => [...lista.filter(item => item.id !== jogador.id), jogador]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.id - b.id));
    if (this.ativo() === null) this.selecionar(jogador.id);
  }

  remover(id: number): void {
    this.jogadores.update(lista => lista.filter(jogador => jogador.id !== id));
    if (this.ativoId() === id) this.selecionar(this.jogadores()[0]?.id ?? null);
  }
}
