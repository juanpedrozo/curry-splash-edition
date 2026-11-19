package br.com.curry.service;

import br.com.curry.dto.JogadorDto;
import br.com.curry.security.UsuarioAtual;
import br.com.curry.entity.Jogador;
import br.com.curry.exception.RecursoNaoEncontradoException;
import br.com.curry.repository.JogadorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class JogadorService {
    private final JogadorRepository jogadores;

    private final UsuarioAtual atual;

    public JogadorService(JogadorRepository jogadores, UsuarioAtual atual) {
        this.atual = atual;
        this.jogadores = jogadores;
    }

    public List<JogadorDto.Saida> listar() {
        return jogadores.findByUsuario_IdOrderByNomeAscIdAsc(atual.id()).stream().map(this::saida).toList();
    }

    public JogadorDto.Saida consultar(long id) {
        return saida(buscar(id));
    }

    @Transactional
    public JogadorDto.Saida criar(JogadorDto.Entrada entrada) {
        Jogador jogador = new Jogador(atual.conta(), entrada.nome().strip(), opcional(entrada.apelido()), opcional(entrada.posicao()));
        return saida(jogadores.saveAndFlush(jogador));
    }

    @Transactional
    public JogadorDto.Saida atualizar(long id, JogadorDto.Entrada entrada) {
        Jogador jogador = buscar(id);
        jogador.atualizar(entrada.nome().strip(), opcional(entrada.apelido()), opcional(entrada.posicao()));
        return saida(jogador);
    }

    @Transactional
    public void excluir(long id) {
        jogadores.delete(buscar(id));
    }

    Jogador buscar(long id) {
        return jogadores.findByIdAndUsuario_Id(id, atual.id()).orElseThrow(() -> new RecursoNaoEncontradoException("Jogador", id));
    }

    static String opcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.strip();
    }

    private JogadorDto.Saida saida(Jogador jogador) {
        return new JogadorDto.Saida(jogador.getId(), jogador.getNome(), jogador.getApelido(),
                jogador.getPosicao(), jogador.getCriadoEm());
    }
}
