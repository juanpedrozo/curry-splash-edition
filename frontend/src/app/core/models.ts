export const ZONAS = [
  { id: 'CANTO_ESQUERDO', nome: 'Canto esquerdo', curto: 'Canto esq.', x: 50, y: 81 },
  { id: 'ALA_ESQUERDA', nome: 'Ala esquerda', curto: 'Ala esq.', x: 105, y: 207 },
  { id: 'TOPO_DO_ARCO', nome: 'Topo do arco', curto: 'Topo', x: 250, y: 272 },
  { id: 'ALA_DIREITA', nome: 'Ala direita', curto: 'Ala dir.', x: 395, y: 207 },
  { id: 'CANTO_DIREITO', nome: 'Canto direito', curto: 'Canto dir.', x: 450, y: 81 },
] as const;

export type Zona = typeof ZONAS[number]['id'];
export const nomeZona = (id: Zona): string => ZONAS.find(zona => zona.id === id)?.nome ?? id;

export interface JogadorEntrada {
  nome: string;
  apelido: string | null;
  posicao: string | null;
}

export interface Jogador extends JogadorEntrada {
  id: number;
  criadoEm: string;
}

export interface ArremessoDados {
  zona: Zona;
  tentativas: number;
  acertos: number;
}

export interface ArremessoEntrada extends ArremessoDados {
  treinoId: number;
}

export interface Arremesso extends ArremessoEntrada {
  id: number;
  percentual: number | null;
}

export interface TreinoEntrada {
  jogadorId: number;
  data: string;
  duracaoMinutos: number;
  observacoes: string | null;
  arremessos?: ArremessoDados[];
}

export interface Treino extends Omit<TreinoEntrada, 'arremessos'> {
  id: number;
  jogadorNome: string;
  criadoEm: string;
  tentativas: number;
  acertos: number;
  percentual: number | null;
}

export interface TreinoDetalhe {
  sessao: Treino;
  arremessos: Arremesso[];
}

export interface Totais {
  totalTreinos: number;
  tentativas: number;
  acertos: number;
  percentual: number | null;
}

export interface ZonaTotal extends ArremessoDados {
  percentual: number | null;
}

export interface Resumo {
  jogador: Jogador;
  totais: Totais;
  melhorZona: ZonaTotal | null;
  ultimosTreinos: Treino[];
}

export interface PontoEvolucao extends Totais {
  data: string;
}

export interface Evolucao {
  pontos: PontoEvolucao[];
  sessoes: Treino[];
  melhorTreino: Treino | null;
  variacaoPp: number | null;
  dataInicial: string | null;
  dataFinal: string | null;
}

export interface Ranking {
  colocacao: number | null;
  jogadorId: number;
  nome: string;
  apelido: string | null;
  posicao: string | null;
  totais: Totais;
  melhorZona: ZonaTotal | null;
}
