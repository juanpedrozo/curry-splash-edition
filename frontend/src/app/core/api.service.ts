import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Arremesso, ArremessoEntrada, Evolucao, Jogador, JogadorEntrada, Ranking, Resumo,
  Treino, TreinoDetalhe, TreinoEntrada, ZonaTotal,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  jogadores() { return this.http.get<Jogador[]>('/api/jogadores'); }
  jogador(id: number) { return this.http.get<Jogador>(`/api/jogadores/${id}`); }
  salvarJogador(entrada: JogadorEntrada, id?: number) {
    return id === undefined ? this.http.post<Jogador>('/api/jogadores', entrada)
      : this.http.put<Jogador>(`/api/jogadores/${id}`, entrada);
  }
  excluirJogador(id: number) { return this.http.delete<void>(`/api/jogadores/${id}`); }

  treinos(jogadorId?: number) {
    const params = jogadorId === undefined ? new HttpParams() : new HttpParams().set('jogadorId', jogadorId);
    return this.http.get<Treino[]>('/api/treinos', { params });
  }
  treino(id: number) { return this.http.get<TreinoDetalhe>(`/api/treinos/${id}`); }
  salvarTreino(entrada: TreinoEntrada, id?: number) {
    return id === undefined ? this.http.post<TreinoDetalhe>('/api/treinos', entrada)
      : this.http.put<TreinoDetalhe>(`/api/treinos/${id}`, entrada);
  }
  excluirTreino(id: number) { return this.http.delete<void>(`/api/treinos/${id}`); }

  arremessos(treinoId?: number, jogadorId?: number) {
    let params = new HttpParams();
    if (treinoId !== undefined) params = params.set('treinoId', treinoId);
    if (jogadorId !== undefined) params = params.set('jogadorId', jogadorId);
    return this.http.get<Arremesso[]>('/api/arremessos', { params });
  }
  salvarArremesso(entrada: ArremessoEntrada, id?: number) {
    return id === undefined ? this.http.post<Arremesso>('/api/arremessos', entrada)
      : this.http.put<Arremesso>(`/api/arremessos/${id}`, entrada);
  }
  excluirArremesso(id: number) { return this.http.delete<void>(`/api/arremessos/${id}`); }

  resumo(id: number) { return this.http.get<Resumo>(`/api/estatisticas/jogadores/${id}/resumo`); }
  zonas(id: number) { return this.http.get<ZonaTotal[]>(`/api/estatisticas/jogadores/${id}/zonas`); }
  evolucao(id: number) { return this.http.get<Evolucao>(`/api/estatisticas/jogadores/${id}/evolucao`); }
  ranking() { return this.http.get<Ranking[]>('/api/estatisticas/ranking'); }
}

export function mensagemErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0 || erro.status === 502 || erro.status === 503 || erro.status === 504) {
      return 'A API está indisponível. Verifique a conexão e tente novamente.';
    }
    const campos = erro.error?.campos;
    if (campos && typeof campos === 'object') {
      const primeira = Object.values(campos).find(valor => typeof valor === 'string');
      if (typeof primeira === 'string') return primeira;
    }
    if (typeof erro.error?.detail === 'string') return erro.error.detail;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
