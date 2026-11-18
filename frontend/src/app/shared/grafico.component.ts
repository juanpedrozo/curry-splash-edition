import { Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { CategoryScale, Chart, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';
import { formatarData, formatarDia, percentual } from '../core/format';
import { PontoEvolucao } from '../core/models';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

@Component({
  selector: 'curry-grafico',
  template: `<div class="chart-area"><canvas #canvas role="img" [attr.aria-label]="rotulo()"></canvas></div>`,
  styles: [`.chart-area { position: relative; min-width: 0; min-height: 215px; height: 100%; }`],
})
export class GraficoComponent {
  readonly pontos = input.required<PontoEvolucao[]>();
  readonly rotulo = input('Gráfico de aproveitamento por data. Os percentuais também estão disponíveis no histórico.');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(limpar => {
      const pontos = this.pontos();
      const grafico = new Chart(this.canvas().nativeElement, {
        type: 'line',
        data: {
          labels: pontos.map(ponto => formatarDia(ponto.data)),
          datasets: [{
            label: 'Aproveitamento',
            data: pontos.map(ponto => ponto.percentual),
            borderColor: '#1D4E89',
            pointBackgroundColor: '#1D4E89',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3.25,
            pointHoverRadius: 5,
            borderWidth: 2,
            spanGaps: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360 },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#596980', maxTicksLimit: 8, maxRotation: 0, padding: 8 },
              border: { color: '#c4cdd8' } },
            y: { min: 0, max: 100, ticks: { color: '#596980', maxTicksLimit: 6, padding: 9,
              callback: (tick) => `${tick}%` }, border: { display: false }, grid: { color: '#e2e7ed' } },
          },
          plugins: {
            tooltip: {
              backgroundColor: '#081a2f', borderColor: '#3a4f69', borderWidth: 1, padding: 12,
              titleColor: '#f7f9fd', bodyColor: '#d9e1ec',
              callbacks: {
                title: itens => itens.length ? formatarData(pontos[itens[0].dataIndex].data) : '',
                label: item => {
                  const ponto = pontos[item.dataIndex];
                  return ` ${percentual(ponto.percentual)} (${ponto.acertos}/${ponto.tentativas})`;
                },
              },
            },
          },
        },
      });
      limpar(() => grafico.destroy());
    });
  }
}
