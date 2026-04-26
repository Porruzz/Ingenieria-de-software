package com.academico.controller;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Controlador (REST)  |  Clase: SeccionController
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
 * US-08 — Controlador REST que expone el endpoint de consulta de secciones
 * con cupos disponibles para una materia específica.
 *
 * Ruta base: {@code /api/secciones}
 *
 * <pre>
 * GET /api/secciones/{materiaId}/disponibles
 *   → 200 OK  con lista JSON de secciones disponibles (puede ser [])
 *   → 400 Bad Request si {materiaId} tiene formato inválido
 * </pre>
 */
@RestController
@RequestMapping("/api/secciones")
public class SeccionController {

    /** Servicio con la lógica de negocio de US-08 */
    private final SeccionService seccionService;

    /**
     * Inyección por constructor.
     *
     * @param seccionService Servicio gestionado por Spring
     */
    public SeccionController(SeccionService seccionService) {
        this.seccionService = seccionService;
    }

    /**
     * US-08 — Endpoint principal.
     *
     * Recibe el ID de una materia como variable de ruta y retorna en JSON
     * todas las secciones de esa materia con al menos un cupo disponible.
     *
     * Ejemplo de petición:
     * <pre>GET http://localhost:8080/api/secciones/3/disponibles</pre>
     *
     * Ejemplo de respuesta (200 OK):
     * <pre>
     * [
     *   { "id": 5, "nombre": "Sección B", "materiaId": 3, "cuposDisponibles": 12 },
     *   { "id": 7, "nombre": "Sección D", "materiaId": 3, "cuposDisponibles": 3  }
     * ]
     * </pre>
     *
     * @param materiaId ID de la materia extraído de la URL
     * @return 200 OK con la lista de {@link Seccion} disponibles
     */
    @GetMapping("/{materiaId}/disponibles")
    public ResponseEntity<List<Seccion>> obtenerSeccionesDisponibles(
            @PathVariable Long materiaId) {

        List<Seccion> disponibles = seccionService.obtenerSeccionesDisponibles(materiaId);
        return ResponseEntity.ok(disponibles);
    }
}
