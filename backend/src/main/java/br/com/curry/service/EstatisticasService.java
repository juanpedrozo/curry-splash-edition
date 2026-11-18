package br.com.curry.service;

import br.com.curry.dto.EstatisticasDto;
import br.com.curry.dto.TreinoDto;
import br.com.curry.entity.Zona;
import br.com.curry.repository.EstatisticasRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class EstatisticasService {
    private final JogadorService jogadores;
    private final EstatisticasRepository estatisticas;

    public EstatisticasService(JogadorService jogadores, EstatisticasRepository estatisticas) {
        this.jogadores = jogadores;
        this.estatisticas = estatisticas;
    }

    public EstatisticasDto.Resumo resumo(long id) {
        var jogador = jogadores.consultar(id);
        return new EstatisticasDto.Resumo(jogador, estatisticas.totais(id),
                estatisticas.melhorZona(id).orElse(null), estatisticas.sessoes(id, null, true, 5));
    }

    public List<EstatisticasDto.ZonaTotal> zonas(long id) {
        jogadores.buscar(id);
        Map<Zona, EstatisticasDto.ZonaTotal> porZona = new EnumMap<>(Zona.class);
        estatisticas.zonas(id).forEach(item -> porZona.put(item.zona(), item));
        return Arrays.stream(Zona.values()).map(zona ->
                porZona.getOrDefault(zona, new EstatisticasDto.ZonaTotal(zona, 0, 0, null))).toList();
    }

    public EstatisticasDto.Evolucao evolucao(long id) {
        jogadores.buscar(id);
        var pontos = estatisticas.evolucao(id);
        var sessoes = estatisticas.sessoes(id, null, false, null);

        var validos = pontos.stream().filter(ponto -> ponto.percentual() != null).toList();
        var melhor = sessoes.stream().filter(sessao -> sessao.tentativas() > 0)
                .max(Comparator.comparing(EstatisticasService::taxaExata)
                        .thenComparingLong(TreinoDto.Sessao::tentativas)
                        .thenComparing(TreinoDto.Sessao::data)
                        .thenComparingLong(TreinoDto.Sessao::id))
                .orElse(null);

        if (validos.isEmpty()) {
            return new EstatisticasDto.Evolucao(pontos, sessoes, melhor, null, null, null);
        }
        var primeiro = validos.getFirst();
        var ultimo = validos.getLast();
        BigDecimal variacao = validos.size() < 2 ? null : ultimo.percentual().subtract(primeiro.percentual());
        return new EstatisticasDto.Evolucao(pontos, sessoes, melhor, variacao, primeiro.data(), ultimo.data());
    }

    public List<EstatisticasDto.Ranking> ranking() {
        return estatisticas.ranking();
    }

    private static BigDecimal taxaExata(TreinoDto.Sessao sessao) {
        return BigDecimal.valueOf(sessao.acertos())
                .divide(BigDecimal.valueOf(sessao.tentativas()), 24, java.math.RoundingMode.HALF_UP);
    }
}
