package br.com.curry.service;

import br.com.curry.dto.ArremessoDto;
import br.com.curry.security.UsuarioAtual;
import br.com.curry.dto.TreinoDto;
import br.com.curry.entity.Arremesso;
import br.com.curry.entity.Treino;
import br.com.curry.entity.Zona;
import br.com.curry.exception.CampoInvalidoException;
import br.com.curry.exception.RecursoNaoEncontradoException;
import br.com.curry.repository.ArremessoRepository;
import br.com.curry.repository.EstatisticasRepository;
import br.com.curry.repository.TreinoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class TreinoService {
    private final UsuarioAtual atual;
    private final TreinoRepository treinos;
    private final ArremessoRepository arremessos;
    private final JogadorService jogadores;
    private final EstatisticasRepository estatisticas;

    public TreinoService(TreinoRepository treinos, ArremessoRepository arremessos,
                         JogadorService jogadores, EstatisticasRepository estatisticas, UsuarioAtual atual) {
        this.atual = atual;
        this.treinos = treinos;
        this.arremessos = arremessos;
        this.jogadores = jogadores;
        this.estatisticas = estatisticas;
    }

    public List<TreinoDto.Sessao> listar(Long jogadorId) {
        return estatisticas.sessoes(jogadorId, null, true, null);
    }

    public TreinoDto.Detalhe consultar(long id) {
        return detalhe(id);
    }

    @Transactional
    public TreinoDto.Detalhe criar(TreinoDto.Entrada entrada) {
        var zonas = validarZonas(entrada.arremessos());
        var jogador = jogadores.buscar(entrada.jogadorId());
        Treino treino = treinos.save(new Treino(jogador, entrada.data(), entrada.duracaoMinutos(),
                JogadorService.opcional(entrada.observacoes())));
        if (zonas != null) {
            salvarZonas(treino, zonas);
        }
        treinos.flush();
        return detalhe(treino.getId());
    }

    @Transactional
    public TreinoDto.Detalhe atualizar(long id, TreinoDto.Entrada entrada) {
        var zonas = validarZonas(entrada.arremessos());
        Treino treino = buscarComBloqueio(id);
        var jogador = jogadores.buscar(entrada.jogadorId());
        treino.atualizar(jogador, entrada.data(), entrada.duracaoMinutos(),
                JogadorService.opcional(entrada.observacoes()));
        if (zonas != null) {
            salvarZonas(treino, zonas);
        }
        treinos.flush();
        return detalhe(id);
    }

    @Transactional
    public void excluir(long id) {
        treinos.delete(buscarComBloqueio(id));
    }

    private Treino buscarComBloqueio(long id) {
        return treinos.findLockedById(id, atual.id()).orElseThrow(() -> new RecursoNaoEncontradoException("Treino", id));
    }

    private TreinoDto.Detalhe detalhe(long id) {
        TreinoDto.Sessao sessao = estatisticas.sessoes(null, id, true, 1).stream().findFirst()
                .orElseThrow(() -> new RecursoNaoEncontradoException("Treino", id));
        List<ArremessoDto.Saida> zonas = arremessos.findByTreino_Id(id).stream()
                .sorted(Comparator.comparing(Arremesso::getZona)).map(ArremessoService::saida).toList();
        return new TreinoDto.Detalhe(sessao, zonas);
    }

    private Map<Zona, ArremessoDto.Dados> validarZonas(List<ArremessoDto.Dados> dados) {
        if (dados == null) {
            return null;
        }
        Map<Zona, ArremessoDto.Dados> porZona = new EnumMap<>(Zona.class);
        for (ArremessoDto.Dados item : dados) {
            ArremessoService.validarAcertos(item, "arremessos." + item.zona().name() + ".acertos");
            if (porZona.putIfAbsent(item.zona(), item) != null) {
                throw new CampoInvalidoException("arremessos", "Informe cada zona apenas uma vez.");
            }
        }
        return porZona;
    }

    private void salvarZonas(Treino treino, Map<Zona, ArremessoDto.Dados> novas) {
        Map<Zona, Arremesso> existentes = new EnumMap<>(Zona.class);
        arremessos.findByTreino_Id(treino.getId()).forEach(item -> existentes.put(item.getZona(), item));

        existentes.values().stream().filter(item -> !novas.containsKey(item.getZona())).forEach(arremessos::delete);
        novas.forEach((zona, dados) -> {
            Arremesso atual = existentes.get(zona);
            if (atual == null) {
                arremessos.save(new Arremesso(treino, zona, dados.tentativas(), dados.acertos()));
            } else {
                atual.atualizar(zona, dados.tentativas(), dados.acertos());
            }
        });
    }
}
