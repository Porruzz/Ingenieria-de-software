package com.academico.service;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Servicio (Lógica de negocio)  |  Clase: SeccionService
// ============================================================

import com.academico.model.Seccion;
import com.academico.repository.SeccionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * US-08 — Servicio que encapsula la lógica de negocio para la consulta
 * de secciones con cupos disponibles.
 *
 * Historia de Usuario (US-08):
 *   "Como estudiante, quiero ver qué secciones de una materia tienen
 *    cupos disponibles para evaluar un posible cambio de sección."
 *
 * Orquesta la validación de parámetros y delega la persistencia
 * al {@link SeccionRepository}, desacoplando así el controlador
 * de los detalles de acceso a datos.
 */
@Service
public class SeccionService {

    /** Repositorio JPA que provee acceso a la tabla {@code secciones} */
    private final SeccionRepository seccionRepository;

    /**
     * Inyección de dependencias por constructor (práctica recomendada en Spring).
     *
     * @param seccionRepository Repositorio gestionado por Spring
     */
    public SeccionService(SeccionRepository seccionRepository) {
        this.seccionRepository = seccionRepository;
    }

    /**
     * US-08 — Método principal del servicio.
     *
     * Retorna todas las secciones de la materia con {@code materiaId} que
     * tienen al menos un cupo disponible ({@code cuposDisponibles > 0}).
     *
     * Flujo:
     * <ol>
     *   <li>Valida que el ID no sea nulo.</li>
     *   <li>Delega la consulta al repositorio con el método derivado.</li>
     *   <li>Retorna la lista resultante (vacía si no hay secciones disponibles).</li>
     * </ol>
     *
     * @param materiaId ID de la materia a consultar (no nulo, positivo)
     * @return Lista de {@link Seccion} con cupos disponibles; vacía si ninguna cumple
     * @throws IllegalArgumentException si {@code materiaId} es nulo
     */
    public List<Seccion> obtenerSeccionesDisponibles(Long materiaId) {
        if (materiaId == null) {
            throw new IllegalArgumentException("El ID de la materia no puede ser nulo.");
        }
        // Filtra: WHERE materia_id = ? AND cupos_disponibles > 0
        return seccionRepository.findByMateriaIdAndCuposDisponiblesGreaterThan(materiaId, 0);
    }
}
