package br.com.curry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "arremessos", uniqueConstraints = @UniqueConstraint(
        name = "arremesso_treino_zona_unica", columnNames = {"treino_id", "zona"}))
public class Arremesso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "treino_id", nullable = false)
    private Treino treino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Zona zona;

    @Column(nullable = false)
    private int tentativas;

    @Column(nullable = false)
    private int acertos;

    protected Arremesso() {}

    public Arremesso(Treino treino, Zona zona, int tentativas, int acertos) {
        this.treino = treino;
        atualizar(zona, tentativas, acertos);
    }

    public void atualizar(Zona zona, int tentativas, int acertos) {
        this.zona = zona;
        this.tentativas = tentativas;
        this.acertos = acertos;
    }

    public Long getId() { return id; }
    public Treino getTreino() { return treino; }
    public Zona getZona() { return zona; }
    public int getTentativas() { return tentativas; }
    public int getAcertos() { return acertos; }
}
