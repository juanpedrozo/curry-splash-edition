package br.com.curry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SourceType;

import java.time.LocalDateTime;

@Entity
@Table(name = "jogadores")
public class Jogador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 60)
    private String apelido;

    @Column(length = 30)
    private String posicao;

    @CreationTimestamp(source = SourceType.DB)
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected Jogador() {}

    public Jogador(String nome, String apelido, String posicao) {
        atualizar(nome, apelido, posicao);
    }

    public void atualizar(String nome, String apelido, String posicao) {
        this.nome = nome;
        this.apelido = apelido;
        this.posicao = posicao;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getApelido() { return apelido; }
    public String getPosicao() { return posicao; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
