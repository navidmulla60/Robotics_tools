import type { UrdfSummary } from './types';

/**
 * Extracts the subset of URDF structure that MoveIt-specific checks (SRDF cross-validation,
 * joint_limits.yaml cross-validation, axis/mimic checks) need. Complements — does not
 * duplicate — src/lib/urdf/lint.ts, which covers generic URDF sanity (mass/inertia/collision/limits).
 */
export function parseUrdfSummary(xmlText: string): UrdfSummary | null {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    return null;
  }
  if (doc.querySelector('parsererror')) return null;

  const robotEl = doc.querySelector('robot');
  if (!robotEl) return null;

  const linkEls = Array.from(robotEl.querySelectorAll(':scope > link'));
  const jointEls = Array.from(robotEl.querySelectorAll(':scope > joint'));

  const linkNames = linkEls.map((l) => l.getAttribute('name') || '');

  const joints = jointEls.map((j) => {
    const mimicEl = j.querySelector(':scope > mimic');
    const limitEl = j.querySelector(':scope > limit');
    const velocityAttr = limitEl?.getAttribute('velocity');
    const velocity = velocityAttr ? parseFloat(velocityAttr) : NaN;
    return {
      name: j.getAttribute('name') || '',
      type: j.getAttribute('type') || '',
      parentLink: j.querySelector(':scope > parent')?.getAttribute('link') || null,
      childLink: j.querySelector(':scope > child')?.getAttribute('link') || null,
      hasAxis: !!j.querySelector(':scope > axis'),
      mimic: mimicEl ? { joint: mimicEl.getAttribute('joint') || '' } : null,
      limitVelocity: Number.isFinite(velocity) && velocity > 0 ? velocity : null,
    };
  });

  const linksWithoutVisualOrCollision = linkEls
    .filter((l) => !l.querySelector(':scope > visual') && !l.querySelector(':scope > collision'))
    .map((l) => l.getAttribute('name') || '');

  return { linkNames, joints, linksWithoutVisualOrCollision };
}
