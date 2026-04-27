package com.academico.repository;

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Repositorio  |  Clase: IntercambioRepository
// ============================================================

import com.academico.model.Intercambio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * US-09 — Repositorio Spring Data JPA para {@link Intercambio}.
 *
 * La consulta JPQL {@code buscarMatchCruzado} detecta un "match cruzado":
 * busca un intercambio PENDIENTE donde:
 *   - su materiaDeseadaId  == materiaOfrecidaId del solicitante, Y
 *   - su materiaOfrecidaId == materiaDeseadaId  del solicitante.
 *
 * Esto garantiza que ambos estudiantes obtienen exactamente lo que el otro ofrece.
 */
@Repository
public interface IntercambioRepository extends JpaRepository<Intercambio, Long> {

    /**
     * US-09 — Busca un match cruzado compatible con el nuevo intercambio.
     *
     * Lógica: "Yo ofrezco A y deseo B → busco a alguien que ofrezca B y desee A"
     *
     * @param materiaDeseada  materiaDeseadaId  del solicitante (lo que quiere obtener)
     * @param materiaOfrecida materiaOfrecidaId del solicitante (lo que pone a disposición)
     * @return Primer intercambio PENDIENTE compatible; vacío si no existe ninguno
     */
    @Query("SELECT i FROM Intercambio i " +
           "WHERE i.estado = 'PENDIENTE' " +
           "  AND i.materiaDeseadaId  = :materiaOfrecida " +
           "  AND i.materiaOfrecidaId = :materiaDeseada")
    Optional<Intercambio> buscarMatchCruzado(
            @Param("materiaDeseada")  Long materiaDeseada,
            @Param("materiaOfrecida") Long materiaOfrecida);
}
