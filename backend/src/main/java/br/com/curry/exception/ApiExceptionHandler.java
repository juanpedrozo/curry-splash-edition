package br.com.curry.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.security.core.AuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "br.com.curry.controller")
public class ApiExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail autenticacao() {
        return problema(HttpStatus.UNAUTHORIZED, "Não autenticado", "E-mail ou senha incorretos, ou sessão encerrada.");
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ProblemDetail naoEncontrado(RecursoNaoEncontradoException erro) {
        return problema(HttpStatus.NOT_FOUND, "Registro não encontrado", erro.getMessage());
    }

    @ExceptionHandler(ConflitoException.class)
    ProblemDetail conflito(ConflitoException erro) {
        return problema(HttpStatus.CONFLICT, "Conflito de dados", erro.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integridade() {
        return problema(HttpStatus.CONFLICT, "Conflito de dados",
                "A operação conflitou com os registros atuais. Atualize a página e tente novamente.");
    }

    @ExceptionHandler(CampoInvalidoException.class)
    ProblemDetail campo(CampoInvalidoException erro) {
        return validacao(Map.of(erro.getCampo(), erro.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail campos(MethodArgumentNotValidException erro) {
        Map<String, String> campos = new LinkedHashMap<>();
        erro.getBindingResult().getFieldErrors().forEach(campo ->
                campos.putIfAbsent(campo.getField(), campo.getDefaultMessage()));
        return validacao(campos);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, ConstraintViolationException.class,
            HandlerMethodValidationException.class, HttpMessageNotReadableException.class})
    ProblemDetail formato() {
        return problema(HttpStatus.BAD_REQUEST, "Dados inválidos",
                "Verifique os identificadores, a data e o formato dos campos enviados.");
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail inesperado(Exception erro) {
        if (erro instanceof ErrorResponse resposta) {
            return resposta.getBody();
        }
        logger.error("Falha ao processar a requisição.", erro);
        return problema(HttpStatus.INTERNAL_SERVER_ERROR, "Falha no servidor",
                "Não foi possível concluir a operação. Tente novamente.");
    }

    private ProblemDetail validacao(Map<String, String> campos) {
        ProblemDetail corpo = problema(HttpStatus.BAD_REQUEST, "Dados inválidos", "Confira os campos indicados.");
        corpo.setProperty("campos", campos);
        return corpo;
    }

    private ProblemDetail problema(HttpStatus status, String titulo, String detalhe) {
        ProblemDetail corpo = ProblemDetail.forStatusAndDetail(status, detalhe);
        corpo.setTitle(titulo);
        return corpo;
    }
}
