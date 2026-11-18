package br.com.curry.exception;

public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String recurso, long id) {
        super(recurso + " #" + id + " não encontrado.");
    }
}
