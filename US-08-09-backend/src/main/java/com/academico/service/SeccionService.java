package com.academico.service;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Servicio  |  Clase: SeccionService
// ============================================================

import com.academico.model.Seccion;
import com.academico.repository.SeccionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * US-08 — Servicio que encapsula la lógica de consulta de secciones disponibles.
 *
 * Historia de Usuario (US-08):
 *   "Como estudiante, quiero ver qué secciones de una materia tienen
 *    cupos disponibles para evaluar un posible cambio de sección."
 */
@Service
public class SeccionService {

    private final SeccionRepository seccionRepository;

    public SeccionService(SeccionRepository seccionRepository) {
        this.seccionRepository = seccionRepository;
    }

    /**
     * Retorna las secciones de una materia con cuposDisponibles > 0.
     *
     * @param materiaId ID de la materia (no nulo)
     * @return Lista de secciones disponibles; vacía si ninguna cumple
     * @throws IllegalArgumentException si materiaId es nulo
     */
    public List<Seccion> obtenerSeccionesDisponibles(Long materiaId) {
        if (materiaId == null) {
            throw new IllegalArgumentException("El ID de la materia no puede ser nulo.");
        }
        return seccionRepository.findByMateriaIdAndCuposDisponiblesGreaterThan(materiaId, 0);
    }
}
