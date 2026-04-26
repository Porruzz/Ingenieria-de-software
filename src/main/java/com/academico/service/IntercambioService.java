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
 *    que el sistema me empare automáticamente con otro estudiante compatible."
 *
 * Algoritmo de matching:
 * <ol>
 *   <li>Se recibe un nuevo intercambio (deseada=B, ofrecida=A).</li>
 *   <li>Se busca en BD un intercambio PENDIENTE con (deseada=A, ofrecida=B).</li>
 *   <li>Si existe match: ambos registros pasan a estado "MATCHED" y se persisten.</li>
 *   <li>Si no existe: el nuevo intercambio se guarda como "PENDIENTE".</li>
 * </ol>
 */
@Service
public class IntercambioService {

    private final IntercambioRepository intercambioRepository;

    public IntercambioService(IntercambioRepository intercambioRepository) {
        this.intercambioRepository = intercambioRepository;
    }

    /**
     * US-09 — Registra un intercambio y ejecuta la lógica de matching.
     *
     * La anotación {@link Transactional} garantiza que la actualización de
     * ambos registros (el match y el nuevo) sea atómica: si falla cualquier
     * operación, se revierte todo.
     *
     * @param nuevoIntercambio Intercambio a registrar (estado inicial: PENDIENTE)
     * @return El intercambio guardado, con estado "PENDIENTE" o "MATCHED"
     */
    @Transactional
    public Intercambio registrarIntercambio(Intercambio nuevoIntercambio) {

        // Asegurar estado inicial correcto
        nuevoIntercambio.setEstado("PENDIENTE");

        // Buscar un intercambio cruzado compatible en la base de datos
        Optional<Intercambio> matchOpt = intercambioRepository.buscarMatchCruzado(
                nuevoIntercambio.getMateriaDeseadaId(),
                nuevoIntercambio.getMateriaOfrecidaId()
        );

        if (matchOpt.isPresent()) {
            // ── MATCH ENCONTRADO ──────────────────────────────────────────────
            Intercambio match = matchOpt.get();

            // Actualizar ambos intercambios a "MATCHED"
            match.setEstado("MATCHED");
            nuevoIntercambio.setEstado("MATCHED");

            // Persistir el intercambio ya existente con el nuevo estado
            intercambioRepository.save(match);
        }

        // Persistir el nuevo intercambio (MATCHED o PENDIENTE)
        return intercambioRepository.save(nuevoIntercambio);
    }
}
