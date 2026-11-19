package br.com.curry.service;

import br.com.curry.dto.ArremessoDto;
import br.com.curry.security.UsuarioAtual;
import br.com.curry.entity.Arremesso;
import br.com.curry.entity.Treino;
import br.com.curry.exception.CampoInvalidoException;
import br.com.curry.exception.ConflitoException;
import br.com.curry.exception.RecursoNaoEncontradoException;
import br.com.curry.repository.ArremessoRepository;
import br.com.curry.repository.TreinoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ArremessoService {
    private final UsuarioAtual atual;
    private final ArremessoRepository arremessos;
    private final TreinoRepository treinos;

    public ArremessoService(ArremessoRepository arremessos, TreinoRepository treinos, UsuarioAtual atual) {
        this.atual = atual;
        this.arremessos = arremessos;
        this.treinos = treinos;
    }

    public List<ArremessoDto.Saida> listar(Long treinoId, Long jogadorId) {
        return arremessos.listar(treinoId, jogadorId, atual.id()).stream().map(ArremessoService::saida).toList();
    }

    public ArremessoDto.Saida consultar(long id) {
        return saida(buscar(id));
    }

    @Transactional
    public ArremessoDto.Saida criar(ArremessoDto.Entrada entrada) {
        validarAcertos(entrada.dados(), "acertos");
        Treino treino = bloquearTreino(entrada.treinoId());
        verificarZonaLivre(entrada);
        return saida(arremessos.saveAndFlush(
                new Arremesso(treino, entrada.zona(), entrada.tentativas(), entrada.acertos())));
    }

    @Transactional
    public ArremessoDto.Saida atualizar(long id, ArremessoDto.Entrada entrada) {
        validarAcertos(entrada.dados(), "acertos");
        bloquearTreino(entrada.treinoId());
        Arremesso arremesso = buscar(id);
        if (!arremesso.getTreino().getId().equals(entrada.treinoId())) {
            throw new CampoInvalidoException("treinoId", "Selecione o treino original do arremesso.");
        }
        if (arremesso.getZona() != entrada.zona()) {
            verificarZonaLivre(entrada);
        }
        arremesso.atualizar(entrada.zona(), entrada.tentativas(), entrada.acertos());
        return saida(arremesso);
    }

    @Transactional
    public void excluir(long id) {
        long treinoId = arremessos.findTreinoId(id, atual.id())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Arremesso", id));
        bloquearTreino(treinoId);
        arremessos.delete(buscar(id));
    }

    static void validarAcertos(ArremessoDto.Dados dados, String campo) {
        if (dados.acertos() > dados.tentativas()) {
            throw new CampoInvalidoException(campo, "Os acertos devem ser menores ou iguais às tentativas.");
        }
    }

    static ArremessoDto.Saida saida(Arremesso arremesso) {
        int tentativas = arremesso.getTentativas();
        int acertos = arremesso.getAcertos();
        BigDecimal percentual = tentativas == 0 ? null : BigDecimal.valueOf(acertos * 100L)
                .divide(BigDecimal.valueOf(tentativas), 2, RoundingMode.HALF_UP);
        return new ArremessoDto.Saida(arremesso.getId(), arremesso.getTreino().getId(), arremesso.getZona(),
                tentativas, acertos, percentual);
    }

    private Arremesso buscar(long id) {
        return arremessos.findByIdAndTreino_Jogador_Usuario_Id(id, atual.id()).orElseThrow(() -> new RecursoNaoEncontradoException("Arremesso", id));
    }

    private Treino bloquearTreino(long id) {
        return treinos.findLockedById(id, atual.id()).orElseThrow(() -> new RecursoNaoEncontradoException("Treino", id));
    }

    private void verificarZonaLivre(ArremessoDto.Entrada entrada) {
        if (arremessos.existsByTreino_IdAndZona(entrada.treinoId(), entrada.zona())) {
            throw new ConflitoException("Já existe um registro para essa zona neste treino.");
        }
    }
}
