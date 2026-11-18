import { Component, input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { acertosValidos, inteiroValido, percentual } from '../core/format';

export type CamposZona = FormGroup<{
  tentativas: FormControl<number | null>;
  acertos: FormControl<number | null>;
}>;

export function criarCamposZona(obrigatorio: boolean): CamposZona {
  const validadores = [Validators.min(0), inteiroValido];
  if (obrigatorio) validadores.push(Validators.required);
  return new FormGroup({
    tentativas: new FormControl<number | null>(null, validadores),
    acertos: new FormControl<number | null>(null, validadores),
  }, controle => {
    const { tentativas, acertos } = controle.value;
    if ((tentativas === null) !== (acertos === null)) return { zonaIncompleta: true };
    return acertosValidos(controle);
  });
}

@Component({
  selector: 'curry-zona-campos',
  imports: [ReactiveFormsModule],
  template: `
    <div class="zone-inputs">
      <div>
        <label class="form-label" [for]="prefixo() + '-tentativas'">Tentativas</label>
        <input class="form-control" [id]="prefixo() + '-tentativas'" type="number" min="0" step="1"
               inputmode="numeric" placeholder="0" [formControl]="campos().controls.tentativas" [class.is-invalid]="invalido(campos().controls.tentativas)"
               [attr.aria-invalid]="invalido(campos().controls.tentativas)" [attr.aria-describedby]="prefixo() + '-erro'">
      </div>
      <div>
        <label class="form-label" [for]="prefixo() + '-acertos'">Acertos</label>
        <input class="form-control" [id]="prefixo() + '-acertos'" type="number" min="0" step="1"
               inputmode="numeric" placeholder="0" [formControl]="campos().controls.acertos"
               [class.is-invalid]="invalido(campos().controls.acertos) || (campos().touched && campos().hasError('acimaDasTentativas'))"
               [attr.aria-invalid]="invalido(campos().controls.acertos) || (campos().touched && campos().hasError('acimaDasTentativas'))"
               [attr.aria-describedby]="prefixo() + '-erro'">
      </div>
      <p class="zone-preview"><span>Aproveitamento</span><strong>{{ previa() }}</strong></p>
    </div>
    @if (campos().touched && campos().invalid) {
      <p class="field-error" [id]="prefixo() + '-erro'" role="alert">{{ erro() }}</p>
    }
  `,
})
export class ZonaCamposComponent {
  readonly campos = input.required<CamposZona>();
  readonly prefixo = input.required<string>();

  invalido(controle: AbstractControl): boolean {
    return controle.touched && (controle.invalid || this.campos().hasError('zonaIncompleta') && controle.value === null);
  }

  previa(): string {
    const { tentativas, acertos } = this.campos().getRawValue();
    return percentual(this.campos().valid && tentativas && acertos !== null ? 100 * acertos / tentativas : null);
  }

  erro(): string {
    if (this.campos().hasError('acimaDasTentativas')) return 'Os acertos devem ser menores ou iguais às tentativas.';
    if (this.campos().hasError('zonaIncompleta') || Object.values(this.campos().controls).some(c => c.hasError('required'))) {
      return 'Informe as tentativas e os acertos.';
    }
    return 'Use números inteiros de 0 a 2.147.483.647.';
  }
}
