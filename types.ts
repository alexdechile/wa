export type ContactButtonType =
  | 'store'
  | 'support'
  | 'sales'
  | 'materials'
  | 'email';

/** Línea a la que se derivó el contacto. */
export type TargetLine = 'web' | 'human' | 'assistant' | 'email';

export interface TrackEntry {
  timestamp: string;
  button: ContactButtonType;
  isHumanHours: boolean;
  /** true si el contacto ocurrió dentro de la pausa de almuerzo. */
  isLunchBreak?: boolean;
  targetLine: TargetLine;
}
