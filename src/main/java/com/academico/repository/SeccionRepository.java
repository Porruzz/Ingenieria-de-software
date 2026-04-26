package com.academico.repository;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Repositorio (Spring Data JPA)  |  Clase: SeccionRepository
// ============================================================

import com.academico.model.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * US-08 — Repositorio Spring Data JPA para la entidad {@link Seccion}.
 *
 * Extiende {@link JpaRepository} para heredar todas las operaciones CRUD
 * estándar. El método derivado {@code findByMateriaIdAndCuposDisponiblesGreaterThan}
 * implementa el requerimiento central de US-08: devolver únicamente las
 * secciones de una materia que tengan al menos un cupo libre.
 *
 * Spring Data JPA traduce la firma del método a la siguiente JPQL:
 * <pre>
 *   SELECT s FROM Seccion s
 *    WHERE s.materiaId = :materiaId
 *      AND s.cuposDisponibles > :minimo
 * </pre>
 */
@Repository
public interface SeccionRepository extends JpaRepository<Seccion, Long> {

    /**
     * Consulta derivada (Derived Query) — US-08.
     *
     * Devuelve todas las secciones cuyo {@code materiaId} coincide con el
     * valor dado Y cuyo {@code cuposDisponibles} es estrictamente mayor
     * que {@code minimo} (el servicio pasa {@code 0}).
     *
     * @param materiaId  ID de la materia a consultar
     * @param minimo     Umbral mínimo de cupos (exclusivo); se usa 0 para filtrar > 0
     * @return Lista de {@link Seccion} que cumplen ambos criterios; vacía si ninguna
     */
    List<Seccion> findByMateriaIdAndCuposDisponiblesGreaterThan(Long materiaId, int minimo);
}
