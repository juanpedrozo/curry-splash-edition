import { expect, test, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test.beforeEach(async ({ page }) => { await criarConta(page); });

async function csrfHeaders(page: Page): Promise<Record<string, string>> {
  const resposta = await page.request.get('/api/auth/csrf');
  expect(resposta.status()).toBe(200);
  const csrf = await resposta.json();
  return { [csrf.headerName]: csrf.token };
}

async function criarConta(page: Page) {
  const email = `e2e-${randomUUID()}@curry.test`;
  const senha = `Teste-${randomUUID()}`;
  await page.goto('/cadastro');
  await page.getByLabel('Seu nome').fill('Conta de teste');
  await page.getByLabel(/^E-mail/).fill(email);
  await page.getByLabel(/^Senha/).fill(senha);
  await page.getByLabel('Confirme a senha').fill(senha);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByText('Conta criada. Entre com seu e-mail e senha.')).toBeVisible();
  await page.getByLabel(/^Senha/).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sair da conta', exact: true })).toBeVisible();
  return { email, senha };
}

test('cadastra jogador, registra cinco zonas, atualiza gráficos e gerencia os registros', async ({ page }) => {
  const request = page.request;
  const nome = `Atleta E2E ${Date.now()}`;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const erros: string[] = [];
  page.on('pageerror', erro => erros.push(erro.message));
  let jogadorId: number | undefined;

  try {
    await page.goto('/jogadores/novo');
    await page.getByRole('button', { name: 'Salvar jogador' }).click();
    await expect(page.getByText('Informe o nome do jogador.')).toBeVisible();
    await page.getByLabel('Nome completo').fill(nome);
    await page.getByLabel('Apelido').fill('Splash');
    await page.getByLabel('Posição', { exact: true }).fill('Armador');
    const jogadorResponse = page.waitForResponse(res =>
      res.url().endsWith('/api/jogadores') && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'Salvar jogador' }).click();
    const jogador = await jogadorResponse;
    expect(jogador.status()).toBe(201);
    await expect(page.getByRole('link', { name: nome, exact: true })).toBeVisible();
    jogadorId = Number((await page.getByRole('link', { name: nome, exact: true }).getAttribute('href'))!.split('/').pop());
    await page.getByRole('link', { name: nome, exact: true }).click();
    await page.getByRole('link', { name: 'Acompanhar desempenho' }).click();
    await expect(page.getByText('Splash', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Novo treino' }).click();
    await page.getByLabel('Data').fill('2026-11-01');
    await page.getByLabel('Duração (min)').fill('45');
    await page.getByLabel('Observações').fill('Primeira sessão de três pontos.');

    const zonas = ['Canto esquerdo', 'Ala esquerda', 'Topo do arco', 'Ala direita', 'Canto direito'];
    for (const [i, zona] of zonas.entries()) {
      const ponto = page.getByRole('button', { name: new RegExp(`^${zona},`) });
      await ponto.click();
      await expect(ponto).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('heading', { name: zona, exact: true })).toBeVisible();
      await page.getByLabel('Tentativas', { exact: true }).fill('10');
      await page.getByLabel('Acertos', { exact: true }).fill(i === 4 ? '11' : String(i + 3));
    }
    await page.getByRole('button', { name: 'Salvar treino' }).click();
    await expect(page.getByText('Os acertos devem ser menores ou iguais às tentativas.')).toBeVisible();
    await page.getByLabel('Acertos', { exact: true }).fill('7');
    await expect(page.getByText('5 de 5 zonas', { exact: true })).toBeVisible();
    const treinoResponse = page.waitForResponse(res =>
      res.url().endsWith('/api/treinos') && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'Salvar treino' }).click();
    const treino = await treinoResponse;
    expect(treino.status()).toBe(201);
    await expect(page).toHaveURL(/\/treinos\/\d+$/);
    const treinoId = Number(new URL(page.url()).pathname.split('/').pop());
    await expect(page.getByRole('heading', { name: 'Resumo do treino' })).toBeVisible();
    await expect(page.getByText('5 de 5 zonas registradas')).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByLabel('Aproveitamento: 50%', { exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    const graficoAntes = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    await page.getByRole('button', { name: /^Canto esquerdo,/ }).click();
    await expect(page.locator('.court-details')).toContainText('30%');

    await page.goto(`/arremessos/${treinoId}`);
    await page.getByRole('button', { name: /^Ala direita,/ }).click();
    await expect(page.getByLabel('Acertos', { exact: true })).toHaveValue('6');
    await page.getByLabel('Acertos', { exact: true }).fill('9');
    await page.getByRole('button', { name: 'Salvar zona' }).click();
    await expect(page.getByText('Arremessos atualizados.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ala direita, 10 tentativas, 9 acertos/ })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByLabel('Aproveitamento: 56%', { exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    await expect.poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
      .not.toBe(graficoAntes);
    await page.getByRole('link', { name: 'Evolução', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Histórico cronológico' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '56%' })).toBeVisible();
    await page.getByRole('link', { name: 'Ranking', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: nome })).toContainText('56%');

    await page.goto(`/arremessos/${treinoId}`);
    await page.getByRole('button', { name: /^Ala direita,/ }).click();
    await page.getByRole('button', { name: 'Excluir registro' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByText('4 de 5 zonas nesta sessão')).toBeVisible();

    await page.getByRole('link', { name: 'Ver treino' }).click();
    await page.getByRole('link', { name: 'Editar treino' }).click();
    await expect(page.getByLabel('Duração (min)')).toHaveValue('45');
    await page.getByLabel('Duração (min)').fill('50');
    await page.getByRole('button', { name: 'Salvar treino' }).click();
    await expect(page.getByText('50 min', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Excluir treino' }).click();
    await dialogo.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByText('Nenhum treino registrado.')).toBeVisible();

    await page.getByRole('link', { name: 'Jogadores', exact: true }).click();
    await page.getByRole('link', { name: `Editar ${nome}` }).click();
    await expect(page.getByLabel('Nome completo')).toHaveValue(nome);
    await page.getByLabel('Posição', { exact: true }).fill('Ala');
    await page.getByRole('button', { name: 'Salvar jogador' }).click();
    await expect(page.getByText('Jogador atualizado.')).toBeVisible();
    await page.getByRole('button', { name: `Excluir ${nome}` }).click();
    await dialogo.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByRole('link', { name: nome, exact: true })).toHaveCount(0);
    expect(erros).toEqual([]);
  } finally {
    if (jogadorId !== undefined) await request.delete(`/api/jogadores/${jogadorId}`, { headers: await csrfHeaders(page) });
  }
});

test('a navegação e a quadra são acessíveis em tela estreita', async ({ page }) => {
  const request = page.request;
  const response = await request.post('/api/jogadores', { headers: await csrfHeaders(page), data: { nome: `Mobile E2E ${Date.now()}` } });
  expect(response.status()).toBe(201);
  const jogadorId = (await response.json()).id;
  try {
    const treino = await request.post('/api/treinos', { headers: await csrfHeaders(page), data: {
      jogadorId, data: '2026-11-02', duracaoMinutos: 35,
      arremessos: [{ zona: 'ALA_ESQUERDA', tentativas: 10, acertos: 4 }],
    } });
    expect(treino.status()).toBe(201);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByLabel('Jogador ativo').selectOption(String(jogadorId));
    await page.getByRole('button', { name: /^Ala esquerda,/ }).click();
    await expect(page.locator('.court-details')).toContainText('Ala esquerda');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('link', { name: 'Treinos', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Treinos', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  } finally {
    await request.delete(`/api/jogadores/${jogadorId}`, { headers: await csrfHeaders(page) });
  }
});


test('isola as contas na interface e compartilha somente o ranking', async ({ page, browser, baseURL }) => {
  const nomeA = `Privado A ${randomUUID()}`;
  const nomeB = `Privado B ${randomUUID()}`;
  const a = await page.request.post('/api/jogadores', { headers: await csrfHeaders(page), data: { nome: nomeA } });
  expect(a.status()).toBe(201);
  const idA = (await a.json()).id;
  const outroContexto = await browser.newContext({ baseURL });
  const outra = await outroContexto.newPage();
  let idB: number | undefined;
  try {
    await criarConta(outra);
    const b = await outra.request.post('/api/jogadores', { headers: await csrfHeaders(outra), data: { nome: nomeB } });
    expect(b.status()).toBe(201);
    idB = (await b.json()).id;
    await page.goto('/jogadores');
    await expect(page.getByRole('link', { name: nomeA, exact: true })).toBeVisible();
    await expect(page.getByText(nomeB, { exact: true })).toHaveCount(0);
    await outra.goto('/jogadores');
    await expect(outra.getByRole('link', { name: nomeB, exact: true })).toBeVisible();
    await expect(outra.getByText(nomeA, { exact: true })).toHaveCount(0);
    await page.goto('/ranking');
    await expect(page.getByRole('row').filter({ hasText: nomeB })).toBeVisible();
    await expect(page.getByRole('link', { name: nomeB, exact: true })).toHaveCount(0);
    expect((await page.request.get(`/api/jogadores/${idB}`)).status()).toBe(404);
    await page.goto(`/jogadores/${idB}`);
    await expect(page.getByRole('heading', { name: 'Não foi possível abrir o perfil' })).toBeVisible();
    await page.reload();
    expect((await page.request.get('/api/auth/me')).status()).toBe(200);
    await page.goto('/jogadores');
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Entre no CURRY' })).toBeVisible();
    expect((await page.request.get('/api/jogadores')).status()).toBe(401);
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Entre no CURRY' })).toBeVisible();
    await expect(page.getByText(nomeA, { exact: true })).toHaveCount(0);
  } finally {
    if (idB !== undefined) await outra.request.delete(`/api/jogadores/${idB}`, { headers: await csrfHeaders(outra) });
    await outroContexto.close();
    // A conta saiu. O esquema PostgreSQL descartável é removido pelo executor dos testes.
  }
});
