/** Tipos compartidos entre servidor y navegador (sin lógica). */

export type Invite = {
  code: string;
  slug: string;
  /** Nombre del comprador, para precargar el formulario. */
  buyer?: string;
  /** Nota privada: número de pedido, canal de venta… */
  note?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  slug: string;
  code: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Lo que se muestra en el sitio público (sin el código de la invitación). */
export type PublicReview = Omit<Review, "code">;
