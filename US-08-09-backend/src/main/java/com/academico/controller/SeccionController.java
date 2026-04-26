package com.academico.controller;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Controlador REST  |  Clase: SeccionController
// ============================================================

import com.academico.model.Seccion;
import com.academico.service.SeccionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * US-08 — Controlador REST para la consulta de secciones con cupos disponibles.
 *
 * Endpoint:
 *   GET /api/secciones/{materiaId}/disponibles
 *   → 200 OK con lista JSON de secciones disponibles (puede ser [])
 */
@RestController
@RequestMapping("/api/secciones")
public class SeccionController {

    private final SeccionService seccionService;

    public SeccionController(SeccionService seccionService) {
        this.seccionService = seccionService;
    }

    /**
     * Retorna las secciones con cupos disponibles para la materia indicada.
     *
     * Ejemplo: GET http://localhost:8080/api/secciones/3/disponibles
     *
     * @param materiaId ID de la materia (variable de ruta)
     * @return 200 OK con la lista de secciones disponibles
     */
    @GetMapping("/{materiaId}/disponibles")
    public ResponseEntity<List<Seccion>> obtenerSeccionesDisponibles(
            @PathVariable Long materiaId) {

        List<Seccion> disponibles = seccionService.obtenerSeccionesDisponibles(materiaId);
        return ResponseEntity.ok(disponibles);
    }
}
