package com.academico.service;

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Servicio  |  Clase: IntercambioService
// ============================================================

import com.academico.model.Intercambio;
import com.academico.repository.IntercambioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * US-09 — Servicio que implementa la lógica de matching de intercambios.
 *
 * Historia de Usuario (US-09):
 *   "Como estudiante, quiero registrar un deseo de intercambio de sección y
 *    que el sistema me empareje automáticamente con otro estudiante compatible."
 *
 * Algoritmo de matching:
 *   1. Se recibe nuevo intercambio (deseada=B, ofrecida=A).
 *   2. Se busca en BD un intercambio PENDIENTE con (deseada=A, ofrecida=B).
 *   3. Si hay match → ambos pasan a "MATCHED" (transacción atómica).
 *   4. Si no hay match → se guarda como "PENDIENTE".
 */
@Service
public class IntercambioService {

    private final IntercambioRepository intercambioRepository;

    public IntercambioService(IntercambioRepository intercambioRepository) {
        this.intercambioRepository = intercambioRepository;
    }

    /**
     * Registra un intercambio y ejecuta la lógica de matching.
     *
     * @Transactional garantiza que la actualización de ambos registros
     * (match existente + nuevo) sea atómica.
     *
     * @param nuevoIntercambio Datos del intercambio a registrar
     * @return El intercambio guardado, con estado "PENDIENTE" o "MATCHED"
     */
    @Transactional
    public Intercambio registrarIntercambio(Intercambio nuevoIntercambio) {

        // Garantizar estado inicial correcto independientemente del body enviado
        nuevoIntercambio.setEstado("PENDIENTE");

        // Buscar match cruzado en BD
        Optional<Intercambio> matchOpt = intercambioRepository.buscarMatchCruzado(
                nuevoIntercambio.getMateriaDeseadaId(),
                nuevoIntercambio.getMateriaOfrecidaId()
        );

        if (matchOpt.isPresent()) {
            // MATCH ENCONTRADO: actualizar el intercambio existente a MATCHED
            Intercambio match = matchOpt.get();
            match.setEstado("MATCHED");
            nuevoIntercambio.setEstado("MATCHED");
            intercambioRepository.save(match);
        }

        // Guardar el nuevo intercambio (MATCHED o PENDIENTE)
        return intercambioRepository.save(nuevoIntercambio);
    }
}
