export type Reliability = 'reliable' | 'best_effort' | 'system_default';
export type Durability = 'transient_local' | 'volatile' | 'system_default';
export type LivelinessKind = 'automatic' | 'manual_by_topic' | 'system_default';
export type HistoryKind = 'keep_last' | 'keep_all' | 'system_default';

export interface QosProfile {
  reliability: Reliability;
  durability: Durability;
  history: HistoryKind;
  /** Only meaningful when history === 'keep_last'. */
  depth: number;
  /** null = no deadline set (RMW_QOS_DEADLINE_DEFAULT, i.e. infinite). */
  deadlineMs: number | null;
  livelinessKind: LivelinessKind;
  /** null = no lease duration set (infinite). */
  livelinessLeaseMs: number | null;
  /** Informational only — doesn't affect pub/sub compatibility. null = no limit. */
  lifespanMs: number | null;
}

export type Verdict = 'ok' | 'warning' | 'error';

export interface Finding {
  policy: string;
  verdict: Verdict;
  message: string;
}

export interface CompatibilityReport {
  overall: Verdict;
  findings: Finding[];
}
