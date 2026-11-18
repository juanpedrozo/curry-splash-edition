CREATE VIEW vw_treino_totais AS
SELECT t.id, t.jogador_id, t.data_treino,
       COALESCE(SUM(a.tentativas), 0) AS tentativas,
       COALESCE(SUM(a.acertos), 0) AS acertos,
       ROUND(100.0 * SUM(a.acertos) / NULLIF(SUM(a.tentativas), 0), 2) AS percentual
FROM treinos t
LEFT JOIN arremessos a ON a.treino_id = t.id
GROUP BY t.id;

CREATE VIEW vw_jogador_totais AS
SELECT j.id AS jogador_id, COUNT(t.id) AS total_treinos,
       COALESCE(SUM(t.tentativas), 0)::bigint AS tentativas,
       COALESCE(SUM(t.acertos), 0)::bigint AS acertos,
       ROUND(100.0 * SUM(t.acertos) / NULLIF(SUM(t.tentativas), 0), 2) AS percentual
FROM jogadores j
LEFT JOIN vw_treino_totais t ON t.jogador_id = j.id
GROUP BY j.id;

CREATE VIEW vw_jogador_zonas AS
SELECT t.jogador_id, a.zona,
       SUM(a.tentativas) AS tentativas, SUM(a.acertos) AS acertos,
       ROUND(100.0 * SUM(a.acertos) / NULLIF(SUM(a.tentativas), 0), 2) AS percentual
FROM treinos t
JOIN arremessos a ON a.treino_id = t.id
GROUP BY t.jogador_id, a.zona;

CREATE VIEW vw_jogador_evolucao AS
SELECT jogador_id, data_treino, COUNT(*) AS total_treinos,
       SUM(tentativas)::bigint AS tentativas, SUM(acertos)::bigint AS acertos,
       ROUND(100.0 * SUM(acertos) / NULLIF(SUM(tentativas), 0), 2) AS percentual
FROM vw_treino_totais
GROUP BY jogador_id, data_treino;

CREATE VIEW vw_jogador_melhor_zona AS
SELECT DISTINCT ON (jogador_id) jogador_id, zona, tentativas, acertos, percentual
FROM vw_jogador_zonas
WHERE tentativas > 0
ORDER BY jogador_id, acertos::numeric / tentativas DESC, tentativas DESC, zona;
