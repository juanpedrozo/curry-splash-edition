package br.com.curry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SourceType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "treinos")
public class Treino {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false)
    private Jogador jogador;

    @Column(name = "data_treino", nullable = false)
    private LocalDate data;

    @Column(name = "duracao_minutos", nullable = false)
    private int duracaoMinutos;

    @Column(columnDefinition = "text")
    private String observacoes;

    @CreationTimestamp(source = SourceType.DB)
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected Treino() {}

    public Treino(Jogador jogador, LocalDate data, int duracaoMinutos, String observacoes) {
        atualizar(jogador, data, duracaoMinutos, observacoes);
    }

    public void atualizar(Jogador jogador, LocalDate data, int duracaoMinutos, String observacoes) {
        this.jogador = jogador;
        this.data = data;
        this.duracaoMinutos = duracaoMinutos;
        this.observacoes = observacoes;
    }

    public Long getId() { return id; }
}
