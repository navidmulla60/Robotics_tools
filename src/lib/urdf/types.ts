export interface CollectedFile {
  /** Relative path as given by the source (folder upload / zip / drag-drop). May equal name. */
  relativePath: string;
  name: string;
  file: File;
}

export interface LintIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  scope: 'link' | 'joint' | 'robot';
  target: string;
  message: string;
}

export interface TfNode {
  link: string;
  joint?: { name: string; type: string };
  children: TfNode[];
}
