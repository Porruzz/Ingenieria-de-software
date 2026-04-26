package com.academico.model;

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Modelo (Entity JPA)  |  Clase: Intercambio
// ============================================================

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * US-09 — Entidad JPA que representa una solicitud de intercambio de sección
 * entre estudiantes.
 *
 * Un estudiante ofrece su sección en {@code materiaOfrecidaId} y desea
 * obtener una sección en {@code materiaDeseadaId}. El sistema busca
 * automáticamente un "match" cruzado (otro estudiante que ofrezca lo que
 * este desea y desee lo que este ofrece).
 *
 * Estados posibles:
 * <ul>
 *   <li>{@code "PENDIENTE"} — No se encontró match todavía.</li>
 *   <li>{@code "MATCHED"}  — Se encontró un intercambio cruzado exitoso.</li>
 * </ul>
 *
 * Tabla en BD: {@code intercambios}
 */
@Entity
@Table(name = "intercambios")
public class Intercambio {

    /** Identificador único autogenerado */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID del estudiante que solicita el intercambio */
    @Column(name = "estudiante_id", nullable = false)
    private Long estudianteId;

    /** ID de la materia/sección que el estudiante DESEA obtener */
    @Column(name = "materia_deseada_id", nullable = false)
    private Long materiaDeseadaId;

    /** ID de la materia/sección que el estudiante OFRECE a cambio */
    @Column(name = "materia_ofrecida_id", nullable = false)
    private Long materiaOfrecidaId;

    /**
     * Estado actual del intercambio.
     * Valor inicial: {@code "PENDIENTE"}. Cambia a {@code "MATCHED"} cuando
     * el sistema encuentra un intercambio cruzado compatible.
     */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE";

    // ── Constructor vacío requerido por JPA ──────────────────────────────────
    public Intercambio() {}

    /** Constructor completo (útil en pruebas y en el servicio) */
    public Intercambio(Long estudianteId, Long materiaDeseadaId, Long materiaOfrecidaId) {
        this.estudianteId = estudianteId;
        this.materiaDeseadaId = materiaDeseadaId;
        this.materiaOfrecidaId = materiaOfrecidaId;
        this.estado = "PENDIENTE";
    }

    // ── Getters y Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }

    public Long getMateriaDeseadaId() { return materiaDeseadaId; }
    public void setMateriaDeseadaId(Long materiaDeseadaId) { this.materiaDeseadaId = materiaDeseadaId; }

    public Long getMateriaOfrecidaId() { return materiaOfrecidaId; }
    public void setMateriaOfrecidaId(Long materiaOfrecidaId) { this.materiaOfrecidaId = materiaOfrecidaId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    @Override
    public String toString() {
        return "Intercambio{id=" + id + ", estudianteId=" + estudianteId
                + ", materiaDeseadaId=" + materiaDeseadaId
                + ", materiaOfrecidaId=" + materiaOfrecidaId
                + ", estado='" + estado + "'}";
    }
}
