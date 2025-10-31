export interface TrackEntry {
  timestamp: string;
  button: 'store' | 'support' | 'sales' | 'email';
  isHumanHours: boolean;
}