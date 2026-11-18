import { AbstractControl, ValidationErrors } from '@angular/forms';

const numero = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const dataCompleta = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const dataReferencia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

export const inteiro = (valor: number): string => numero.format(valor);
export const percentual = (valor: number | null): string => valor === null ? '—' : `${decimal.format(valor)}%`;
export const formatarData = (valor: string): string => dataCompleta.format(new Date(valor.slice(0, 10) + 'T00:00:00Z'));
export const formatarDia = (valor: string): string => dataCurta.format(new Date(valor.slice(0, 10) + 'T00:00:00Z')).replace('.', '');
export const hoje = (): string => dataReferencia.format(new Date());
export const pontosPercentuais = (valor: number): string => `${valor > 0 ? '+' : ''}${decimal.format(valor)} p.p.`;
export const iniciais = (nome: string): string => nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();

export function inteiroValido(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  return valor == null || (Number.isInteger(valor) && valor <= 2147483647) ? null : { inteiro: true };
}

export function acertosValidos(controle: AbstractControl): ValidationErrors | null {
  const a = controle.get('acertos')?.value;
  const t = controle.get('tentativas')?.value;
  return a != null && t != null && a > t ? { acimaDasTentativas: true } : null;
}
