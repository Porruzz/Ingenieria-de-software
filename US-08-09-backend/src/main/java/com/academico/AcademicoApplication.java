package com.academico;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicación Spring Boot.
 * US-08: Consulta de cupos disponibles por sección.
 * US-09: Matching de intercambios de secciones entre estudiantes.
 */
@SpringBootApplication
public class AcademicoApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademicoApplication.class, args);
    }
}
