-- Opcional. Rode depois que a API tiver aplicado as migrações.
BEGIN;

DO $demo$
DECLARE
    atleta record;
    sessao record;
    jogador bigint;
    treino bigint;
    zona text;
    numero_zona integer;
    zonas text[] := ARRAY['CANTO_ESQUERDO', 'ALA_ESQUERDA', 'TOPO_DO_ARCO', 'ALA_DIREITA', 'CANTO_DIREITO'];
BEGIN
    -- Serializa duas execuções simultâneas do próprio script de demonstração.
    PERFORM pg_advisory_xact_lock(90851, 3);

    FOR atleta IN
        SELECT * FROM (VALUES (1, 'Gabriel Santos', 'Gabs', 'Armador'),
                              (2, 'Lívia Costa', 'Lívia', 'Ala'),
                              (3, 'Rafael Lima', 'Rafa', 'Ala-armador'))
                         AS dados(numero, nome, apelido, posicao)
    LOOP
        IF EXISTS (SELECT 1 FROM jogadores j WHERE j.nome = atleta.nome AND j.apelido = atleta.apelido) THEN
            CONTINUE;
        END IF;

        INSERT INTO jogadores(nome, apelido, posicao)
        VALUES (atleta.nome, atleta.apelido, atleta.posicao) RETURNING id INTO jogador;

        FOR sessao IN
            SELECT * FROM (VALUES
                (1, 35, 42, 15, ARRAY[4, 4, 7, 4, 5]),
                (1, 29, 45, 16, ARRAY[5, 6, 9, 6, 5]),
                (1, 24, 50, 18, ARRAY[7, 8, 12, 8, 6]),
                (1, 20, 38, 13, ARRAY[4, 4, 8, 4, 5]),
                (1, 16, 48, 16, ARRAY[7, 9, 12, 8, 7]),
                (1, 10, 52, 19, ARRAY[8, 9, 15, 9, 8]),
                (1,  7, 42, 14, ARRAY[6, 7, 10, 7, 5]),
                (1,  4, 55, 19, ARRAY[10, 9, 15, 10, 9]),
                (1,  1, 48, 18, ARRAY[9, 11, 16, 11, 10]),
                (2, 23, 40, 14, ARRAY[6, 7, 6, 8, 9]),
                (2, 12, 48, 17, ARRAY[8, 8, 9, 10, 11]),
                (2,  2, 50, 19, ARRAY[10, 11, 11, 12, 13]),
                (3, 21, 38, 12, ARRAY[5, 5, 6, 6, 4]),
                (3, 11, 43, 14, ARRAY[5, 8, 7, 7, 5]),
                (3,  3, 47, 15, ARRAY[7, 9, 8, 8, 7]))
                  AS dados(numero, dias_atras, minutos, tentativas, acertos)
            WHERE numero = atleta.numero
            ORDER BY dias_atras DESC
        LOOP
            INSERT INTO treinos(jogador_id, data_treino, duracao_minutos, observacoes)
            VALUES (jogador, CURRENT_DATE - sessao.dias_atras, sessao.minutos,
                    'Treino demonstrativo. Arremessos de três pontos em cinco zonas.')
            RETURNING id INTO treino;

            numero_zona := 0;
            FOREACH zona IN ARRAY zonas LOOP
                numero_zona := numero_zona + 1;
                INSERT INTO arremessos(treino_id, zona, tentativas, acertos)
                VALUES (treino, zona, sessao.tentativas + (ARRAY[0, 2, 5, 2, 0])[numero_zona],
                        sessao.acertos[numero_zona]);
            END LOOP;
        END LOOP;
    END LOOP;
END
$demo$;

COMMIT;
