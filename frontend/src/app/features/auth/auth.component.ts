import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemErro } from '../../core/api.service';

function tamanhoSenha(control: AbstractControl): ValidationErrors | null {
  return new TextEncoder().encode(control.value ?? '').length > 72 ? { bytes: true } : null;
}

@Component({
  selector: 'curry-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly cadastro = this.route.snapshot.data['cadastro'] === true;
  readonly criada = this.route.snapshot.queryParamMap.has('cadastro');
  readonly expirada = this.route.snapshot.queryParamMap.has('sessao');
  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly mostrarSenha = signal(false);
  readonly form = this.fb.group({
    nome: ['', this.cadastro ? [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)] : []],
    email: [this.auth.emailCadastro, [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', [Validators.required, Validators.maxLength(72), tamanhoSenha,
      ...(this.cadastro ? [Validators.minLength(8)] : [])]],
    confirmacao: ['', this.cadastro ? [Validators.required] : []],
  }, { validators: control => this.cadastro && control.get('senha')?.value !== control.get('confirmacao')?.value
      ? { diferentes: true } : null });

  invalido(campo: 'nome' | 'email' | 'senha' | 'confirmacao'): boolean {
    const control = this.form.controls[campo];
    return control.touched && (control.invalid || campo === 'confirmacao' && this.form.hasError('diferentes'));
  }

  async salvar(): Promise<void> {
    if (this.enviando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.enviando.set(true);
    this.erro.set('');
    const { nome, email, senha } = this.form.getRawValue();
    try {
      if (this.cadastro) {
        await this.auth.cadastrar(nome, email, senha);
        this.form.controls.senha.reset();
        this.form.controls.confirmacao.reset();
        await this.router.navigate(['/login'], { queryParams: { cadastro: '1' } });
      } else {
        await this.auth.entrar(email, senha);
        this.form.controls.senha.reset();
        const destino = this.route.snapshot.queryParamMap.get('voltar') ?? '/';
        await this.router.navigateByUrl(destino.startsWith('/') && !destino.startsWith('//')
          && !/^\/(login|cadastro)([/?#]|$)/.test(destino) ? destino : '/');
      }
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.enviando.set(false);
    }
  }
}
