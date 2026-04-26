package com.academico.controller;

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Controlador (REST)  |  Clase: IntercambioController
// ============================================================

import com.academico.model.Intercambio;
import com.academico.service.IntercambioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-09 — Controlador REST que expone el endpoint de registro de intercambios.
 *
 * Ruta base: {@code /api/intercambios}
 *
 * <pre>
 * POST /api/intercambios/registrar
 *   Body (JSON): { "estudianteId": 1, "materiaDeseadaId": 5, "materiaOfrecidaId": 3 }
 *   → 201 Created con el intercambio guardado (estado: "PENDIENTE" o "MATCHED")
 * </pre>
 */
@RestController
@RequestMapping("/api/intercambios")
public class IntercambioController {

    private final IntercambioService intercambioService;

    public IntercambioController(IntercambioService intercambioService) {
        this.intercambioService = intercambioService;
    }

    /**
     * US-09 — Endpoint principal: registra un intercambio y ejecuta el matching.
     *
     * Ejemplo de petición:
     * <pre>POST http://localhost:8080/api/intercambios/registrar
     * Content-Type: application/json
     * {
     *   "estudianteId": 1,
     *   "materiaDeseadaId": 5,
     *   "materiaOfrecidaId": 3
     * }
     * </pre>
     *
     * Respuesta si hay match (201 Created):
     * <pre>{ "id": 4, "estudianteId": 1, "materiaDeseadaId": 5,
     *         "materiaOfrecidaId": 3, "estado": "MATCHED" }</pre>
     *
     * Respuesta si no hay match (201 Created):
     * <pre>{ "id": 4, "estudianteId": 1, "materiaDeseadaId": 5,
     *         "materiaOfrecidaId": 3, "estado": "PENDIENTE" }</pre>
     *
     * @param intercambio Datos del intercambio recibidos en el cuerpo JSON
     * @return 201 Created con el {@link Intercambio} persistido
     */
    @PostMapping("/registrar")
    public ResponseEntity<Intercambio> registrarIntercambio(
            @RequestBody Intercambio intercambio) {

        Intercambio resultado = intercambioService.registrarIntercambio(intercambio);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }
}
