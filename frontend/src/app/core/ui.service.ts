import { Injectable, signal } from '@angular/core';

interface Confirmacao {
  titulo: string;
  texto: string;
  resolver: (confirmado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly aviso = signal('');
  readonly confirmacao = signal<Confirmacao | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  sucesso(mensagem: string): void {
    clearTimeout(this.timer);
    this.aviso.set(mensagem);
    this.timer = setTimeout(() => this.aviso.set(''), 4500);
  }

  confirmar(titulo: string, texto: string): Promise<boolean> {
    return new Promise(resolve => this.confirmacao.set({ titulo, texto, resolver: resolve }));
  }

  responder(confirmado: boolean): void {
    this.confirmacao()?.resolver(confirmado);
    this.confirmacao.set(null);
  }
}
