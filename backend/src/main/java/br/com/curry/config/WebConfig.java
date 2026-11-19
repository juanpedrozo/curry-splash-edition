package br.com.curry.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String[] origins;

    public WebConfig(@Value("${curry.cors-origins}") String[] origins) {
        this.origins = origins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "X-CSRF-TOKEN")
                .allowCredentials(true)
                .exposedHeaders("Location");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        for (String path : new String[] {
                "/jogadores", "/jogadores/novo", "/jogadores/{id}/editar", "/jogadores/{id}",
                "/treinos", "/treinos/novo", "/treinos/{id}", "/treinos/{id}/editar",
                "/login", "/cadastro", "/arremessos", "/arremessos/{treinoId}", "/evolucao", "/ranking"
        }) {
            registry.addViewController(path).setViewName("forward:/index.html");
        }
    }
}
