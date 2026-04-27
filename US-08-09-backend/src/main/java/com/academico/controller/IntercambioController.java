package com.academico.controller;

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Controlador REST  |  Clase: IntercambioController
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
 * US-09 — Controlador REST para el registro y matching de intercambios.
 *
 * Endpoint:
 *   POST /api/intercambios/registrar
 *   Body: { "estudianteId": 1, "materiaDeseadaId": 5, "materiaOfrecidaId": 3 }
 *   → 201 Created con el intercambio guardado (estado: "PENDIENTE" o "MATCHED")
 */
@RestController
@RequestMapping("/api/intercambios")
public class IntercambioController {

    private final IntercambioService intercambioService;

    public IntercambioController(IntercambioService intercambioService) {
        this.intercambioService = intercambioService;
    }

    /**
     * Registra un intercambio y ejecuta el algoritmo de matching automático.
     *
     * Ejemplo de body JSON:
     * {
     *   "estudianteId": 1,
     *   "materiaDeseadaId": 5,
     *   "materiaOfrecidaId": 3
     * }
     *
     * @param intercambio Datos del intercambio recibidos en el body JSON
     * @return 201 Created con el intercambio persistido (PENDIENTE o MATCHED)
     */
    @PostMapping("/registrar")
    public ResponseEntity<Intercambio> registrarIntercambio(
            @RequestBody Intercambio intercambio) {

        Intercambio resultado = intercambioService.registrarIntercambio(intercambio);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }
}
