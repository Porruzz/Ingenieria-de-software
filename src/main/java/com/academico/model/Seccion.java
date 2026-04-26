package com.academico.model;

// ============================================================
//  US-08 | Consulta de Cupos Disponibles
//  Capa: Modelo (Entity JPA)  |  Clase: Seccion
// ============================================================

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * US-08 — Entidad JPA que representa una sección de una materia universitaria.
 *
 * Cada materia puede tener múltiples secciones (A, B, C…), cada una con su
 * propio cupo de inscripción. El campo {@code cuposDisponibles} es el criterio
 * central de filtrado de la historia de usuario US-08.
 *
 * Tabla en BD: {@code secciones}
 */
@Entity
@Table(name = "secciones")
public class Seccion {

    /** Identificador único autogenerado */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre descriptivo de la sección (ej: "Sección A", "Grupo 02") */
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    /**
     * FK lógica hacia la tabla de materias.
     * Se modela como Long simple para mantener la entidad desacoplada
     * y permitir consultas derivadas simples en el repositorio.
     */
    @Column(name = "materia_id", nullable = false)
    private Long materiaId;

    /** Cupos todavía disponibles para inscripción (debe ser >= 0) */
    @Column(name = "cupos_disponibles", nullable = false)
    private int cuposDisponibles;

    // ── Constructor vacío requerido por JPA ──────────────────────────────────
    public Seccion() {}

    /** Constructor completo (útil en pruebas) */
    public Seccion(Long id, String nombre, Long materiaId, int cuposDisponibles) {
        this.id = id;
        this.nombre = nombre;
        this.materiaId = materiaId;
        this.cuposDisponibles = cuposDisponibles;
    }

    // ── Getters y Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Long getMateriaId() { return materiaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }

    public int getCuposDisponibles() { return cuposDisponibles; }
    public void setCuposDisponibles(int cuposDisponibles) { this.cuposDisponibles = cuposDisponibles; }

    @Override
    public String toString() {
        return "Seccion{id=" + id + ", nombre='" + nombre + "', materiaId=" + materiaId
                + ", cuposDisponibles=" + cuposDisponibles + '}';
    }
}
