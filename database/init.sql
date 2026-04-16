-- init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de la tabla Estudiante
CREATE TABLE IF NOT EXISTS estudiante (
    id_estudiante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_universidad UUID,
    id_programa UUID,
    identificacion_universidad VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email_institucional VARCHAR(255) UNIQUE NOT NULL,
    creditos_aprobados INTEGER NOT NULL DEFAULT 0,
    promedio_acumulado NUMERIC(3, 2),
    trabaja BOOLEAN NOT NULL DEFAULT FALSE,
    horas_trabajo_semanal INTEGER,
    tiempo_traslado_min INTEGER NOT NULL DEFAULT 0,
    buffer_seguridad_min INTEGER NOT NULL DEFAULT 0,
    fecha_ingreso DATE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Creación de la tabla de Bloques de Tiempo Prohibido
-- Relacionada con el estudiante
CREATE TABLE IF NOT EXISTS bloque_tiempo_prohibido (
    id_bloque UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_estudiante UUID NOT NULL REFERENCES estudiante(id_estudiante) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL,
    hora_inicio VARCHAR(255) NOT NULL, -- Cifrado
    hora_fin VARCHAR(255) NOT NULL,    -- Cifrado
    iv VARCHAR(64) NOT NULL,           -- Meta cifrado
    auth_tag VARCHAR(64) NOT NULL,     -- Meta cifrado
    tipo VARCHAR(50) NOT NULL,         -- 'TRABAJO' o 'BIENESTAR'
    es_recurrente BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_inicio_recurrencia DATE,
    fecha_fin_recurrencia DATE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
