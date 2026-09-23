import type { UrdfSummary } from './types';

export function buildParentMap(urdf: UrdfSummary): Map<string, { joint: string; parentLink: string }> {
  const map = new Map<string, { joint: string; parentLink: string }>();
  for (const j of urdf.joints) {
    if (j.childLink && j.parentLink && !map.has(j.childLink)) {
      map.set(j.childLink, { joint: j.name, parentLink: j.parentLink });
    }
  }
  return map;
}

/** Walks up from tipLink toward baseLink, collecting joints along the way. Guards against cycles. */
export function walkChainJoints(parentMap: Map<string, { joint: string; parentLink: string }>, baseLink: string, tipLink: string): { joints: string[]; reached: boolean } {
  const joints: string[] = [];
  const visited = new Set<string>();
  let current = tipLink;
  while (current !== baseLink) {
    if (visited.has(current)) return { joints, reached: false };
    visited.add(current);
    const step = parentMap.get(current);
    if (!step) return { joints, reached: false };
    joints.push(step.joint);
    current = step.parentLink;
  }
  return { joints, reached: true };
}

/** Links that are never a joint's child — i.e. roots of the URDF tree (normally exactly one). */
export function findRootLinks(urdf: UrdfSummary): string[] {
  const childLinks = new Set(urdf.joints.map((j) => j.childLink).filter((v): v is string => !!v));
  return urdf.linkNames.filter((l) => !childLinks.has(l));
}
