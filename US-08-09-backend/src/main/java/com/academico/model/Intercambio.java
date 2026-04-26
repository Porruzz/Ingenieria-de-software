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
 * US-09 — Entidad JPA que representa una solicitud de intercambio de sección.
 *
 * Estados posibles del campo {@code estado}:
 *   - "PENDIENTE" → No se encontró match todavía.
 *   - "MATCHED"   → Se encontró un intercambio cruzado exitoso.
 *
 * Tabla en BD: {@code intercambios}
 * Endpoint relacionado: POST /api/intercambios/registrar
 */
@Entity
@Table(name = "intercambios")
public class Intercambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID del estudiante que solicita el intercambio */
    @Column(name = "estudiante_id", nullable = false)
    private Long estudianteId;

    /** ID de la sección/materia que el estudiante DESEA obtener */
    @Column(name = "materia_deseada_id", nullable = false)
    private Long materiaDeseadaId;

    /** ID de la sección/materia que el estudiante OFRECE a cambio */
    @Column(name = "materia_ofrecida_id", nullable = false)
    private Long materiaOfrecidaId;

    /** Estado del intercambio: "PENDIENTE" o "MATCHED" */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE";

    // ── Constructor vacío requerido por JPA ──────────────────────────────────
    public Intercambio() {}

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
