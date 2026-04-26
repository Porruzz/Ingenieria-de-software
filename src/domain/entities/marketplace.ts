export type OfferStatus = 'EN_OFERTA' | 'MATCH_PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export interface OfficialEnrollment {
  enrollmentId: string;
  studentId: string;
  sectionId: string; // id_grupo en el diseño
  courseId: string;
  academicPeriod: string;
  status: 'ACTIVO' | 'CANCELADO' | 'EN_PROCESO_CAMBIO';
}

export interface OfferPublication {
  offerId: string;
  issuerStudentId: string;     // id_estudiante_emisor
  sourceEnrollmentId: string;  // id_inscripcion_origen
  forbiddenBlockId?: string;   // id_bloque_prohibido (Opcional, RF-12.2)
  status: OfferStatus;         // estado_oferta (RF-12.4)
  publicationDate: Date;
  validationToken: string;     // RNF-12.2: Para verificar la autenticidad sin revelar ID rápido
}

export interface ProactiveInterest {
  interestId: string;
  offerId: string;
  interestedStudentId: string; // id_estudiante_interesado
  exchangeEnrollmentId?: string; // id_inscripcion_cambio (La materia que ofrece a cambio el interesado)
  systemPriorityScore: number; // prioridad_sistema (Generado por el motor)
  requestDate: Date;
}
