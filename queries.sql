-- 1. JOIN entre as três tabelas. Acrescente WHERE j.id = <id> para filtrar por atleta.
SELECT j.id AS jogador_id, j.nome AS jogador, t.id AS treino_id, t.data_treino,
       a.zona, a.tentativas, a.acertos
FROM jogadores j
JOIN treinos t ON t.jogador_id = j.id
JOIN arremessos a ON a.treino_id = t.id
ORDER BY j.nome, t.data_treino DESC, t.id DESC, a.zona;

-- 2. Agregação por jogador. COUNT(DISTINCT) evita contar o treino uma vez por zona.
SELECT j.id, j.nome, COUNT(DISTINCT t.id) AS total_treinos,
       COALESCE(SUM(a.tentativas), 0) AS tentativas,
       COALESCE(SUM(a.acertos), 0) AS acertos,
       ROUND(100.0 * SUM(a.acertos) / NULLIF(SUM(a.tentativas), 0), 2) AS aproveitamento
FROM jogadores j
LEFT JOIN treinos t ON t.jogador_id = j.id
LEFT JOIN arremessos a ON a.treino_id = t.id
GROUP BY j.id
ORDER BY j.nome, j.id;

-- 3. Aproveitamento por zona e por jogador.
SELECT t.jogador_id, a.zona, SUM(a.tentativas) AS tentativas, SUM(a.acertos) AS acertos,
       ROUND(100.0 * SUM(a.acertos) / NULLIF(SUM(a.tentativas), 0), 2) AS aproveitamento
FROM treinos t
JOIN arremessos a ON a.treino_id = t.id
GROUP BY t.jogador_id, a.zona
ORDER BY t.jogador_id, a.zona;

-- 4. Evolução por data. Sessões do mesmo dia são agrupadas por volume.
SELECT t.jogador_id, t.data_treino, COUNT(DISTINCT t.id) AS total_treinos,
       COALESCE(SUM(a.tentativas), 0) AS tentativas,
       COALESCE(SUM(a.acertos), 0) AS acertos,
       ROUND(100.0 * SUM(a.acertos) / NULLIF(SUM(a.tentativas), 0), 2) AS aproveitamento
FROM treinos t
LEFT JOIN arremessos a ON a.treino_id = t.id
GROUP BY t.jogador_id, t.data_treino
ORDER BY t.jogador_id, t.data_treino;

-- 5. Subconsulta correlacionada. Treinos acima da taxa geral do próprio jogador.
SELECT t.id, t.jogador_id, t.data_treino, t.percentual
FROM vw_treino_totais t
WHERE t.acertos::numeric / NULLIF(t.tentativas, 0) > (
    SELECT j.acertos::numeric / NULLIF(j.tentativas, 0)
    FROM vw_jogador_totais j
    WHERE j.jogador_id = t.jogador_id
)
ORDER BY t.jogador_id, t.data_treino, t.id;
