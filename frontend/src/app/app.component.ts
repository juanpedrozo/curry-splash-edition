import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JogadoresStore } from './core/jogadores.store';
import { UiService } from './core/ui.service';
import { HeaderComponent } from './layout/header.component';
import { SidebarComponent } from './layout/sidebar.component';

@Component({
  selector: 'curry-root',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <curry-header [menuAberto]="menuAberto()" (abrirMenu)="menuAberto.update(aberto => !aberto)"
                  (fecharMenu)="menuAberto.set(false)" />
    <curry-sidebar [aberta]="menuAberto()" (fechar)="menuAberto.set(false)" />
    @if (menuAberto()) {
      <button type="button" class="menu-backdrop" aria-label="Fechar navegação" (click)="menuAberto.set(false)"></button>
    }
    <div class="app-frame" (keydown.escape)="menuAberto.set(false)">
      <main class="container-fluid main-content" id="conteudo" tabindex="-1"><router-outlet /></main>
    </div>

    @if (ui.aviso(); as texto) {
      <div class="alert alert-success toast-splash" role="status">
        <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        <span>{{ texto }}</span>
        <button type="button" aria-label="Dispensar mensagem" (click)="ui.aviso.set('')"><i class="bi bi-x-lg"></i></button>
      </div>
    }

    <dialog #dialogo class="dialog-splash" aria-labelledby="confirmar-titulo" (cancel)="cancelar($event)">
      @if (ui.confirmacao(); as confirmacao) {
        <span class="icon-tile destructive"><i class="bi bi-trash3"></i></span>
        <h2 id="confirmar-titulo">{{ confirmacao.titulo }}</h2>
        <p>{{ confirmacao.texto }}</p>
        <div class="form-actions">
          <button class="btn btn-outline-secondary" type="button" autofocus (click)="ui.responder(false)">Cancelar</button>
          <button class="btn btn-outline-danger" type="button" (click)="ui.responder(true)">Excluir</button>
        </div>
      }
    </dialog>
  `,
})
export class AppComponent {
  readonly ui = inject(UiService);
  private readonly jogadores = inject(JogadoresStore);
  private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');
  readonly menuAberto = signal(false);

  constructor() {
    void this.jogadores.atualizar();
    effect(() => {
      const dialogo = this.dialogo()?.nativeElement;
      const confirmacao = this.ui.confirmacao();
      if (!dialogo) return;
      if (confirmacao && !dialogo.open) dialogo.showModal();
      else if (!confirmacao && dialogo.open) dialogo.close();
    });
  }

  cancelar(evento: Event): void {
    evento.preventDefault();
    this.ui.responder(false);
  }
}
