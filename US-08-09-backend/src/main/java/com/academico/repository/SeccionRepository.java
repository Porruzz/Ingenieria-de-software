package com.academico.repository;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Repositorio  |  Clase: SeccionRepository
// ============================================================

import com.academico.model.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * US-08 — Repositorio Spring Data JPA para {@link Seccion}.
 *
 * El método derivado {@code findByMateriaIdAndCuposDisponiblesGreaterThan}
 * genera automáticamente la JPQL:
 *   SELECT s FROM Seccion s
 *    WHERE s.materiaId = :materiaId AND s.cuposDisponibles > :minimo
 */
@Repository
public interface SeccionRepository extends JpaRepository<Seccion, Long> {

    /**
     * Devuelve las secciones de una materia con cupos > minimo.
     * El servicio invoca este método pasando minimo = 0.
     *
     * @param materiaId  ID de la materia
     * @param minimo     Umbral mínimo exclusivo (se pasa 0)
     * @return Lista de secciones disponibles; vacía si ninguna cumple
     */
    List<Seccion> findByMateriaIdAndCuposDisponiblesGreaterThan(Long materiaId, int minimo);
}
