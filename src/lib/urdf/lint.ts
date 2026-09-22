import type { LintIssue } from './types';

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) out[item] = (out[item] || 0) + 1;
  return out;
}

/**
 * Static analysis of raw URDF XML, independent of whether meshes load.
 * Catches the issues that commonly break Gazebo physics or MoveIt Setup Assistant.
 */
export function lintUrdf(xmlText: string): LintIssue[] {
  const issues: LintIssue[] = [];

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    return [
      { id: 'parse-error', severity: 'error', scope: 'robot', target: 'robot', message: 'Could not parse this file as XML.' },
    ];
  }

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    issues.push({
      id: 'parse-error',
      severity: 'error',
      scope: 'robot',
      target: 'robot',
      message: `XML is not well-formed: ${parserError.textContent?.trim().slice(0, 200) ?? 'unknown error'}`,
    });
    return issues;
  }

  const robotEl = doc.querySelector('robot');
  if (!robotEl) {
    issues.push({ id: 'no-robot-tag', severity: 'error', scope: 'robot', target: 'robot', message: 'No <robot> root element found — this does not look like a URDF file.' });
    return issues;
  }

  if (/xacro:/i.test(xmlText) || /\$\{/.test(xmlText)) {
    issues.push({
      id: 'xacro-detected',
      severity: 'warning',
      scope: 'robot',
      target: 'robot',
      message: 'This file appears to use xacro macros (xacro: tags or ${} expressions). Run it through `xacro` to generate plain URDF first, or visualization/joint values may be wrong.',
    });
  }

  const linkEls = Array.from(robotEl.querySelectorAll(':scope > link'));
  const jointEls = Array.from(robotEl.querySelectorAll(':scope > joint'));

  const linkNameCounts = countBy(linkEls.map((l) => l.getAttribute('name') || ''));
  Object.entries(linkNameCounts).forEach(([name, count]) => {
    if (count > 1) {
      issues.push({ id: 'duplicate-link', severity: 'error', scope: 'link', target: name, message: `Link name "${name}" is used ${count} times. Link names must be unique.` });
    }
  });

  const jointNameCounts = countBy(jointEls.map((j) => j.getAttribute('name') || ''));
  Object.entries(jointNameCounts).forEach(([name, count]) => {
    if (count > 1) {
      issues.push({ id: 'duplicate-joint', severity: 'error', scope: 'joint', target: name, message: `Joint name "${name}" is used ${count} times. Joint names must be unique.` });
    }
  });

  linkEls.forEach((link) => {
    const name = link.getAttribute('name') || '(unnamed link)';
    const visual = link.querySelector(':scope > visual');
    const collision = link.querySelector(':scope > collision');
    const inertial = link.querySelector(':scope > inertial');
    const hasGeometry = !!(visual || collision);

    if (hasGeometry && !inertial) {
      issues.push({
        id: 'missing-inertial',
        severity: 'error',
        scope: 'link',
        target: name,
        message: `Link "${name}" has visual/collision geometry but no <inertial> tag. MoveIt Setup Assistant and Gazebo require mass + inertia on every non-fixed link — expect "link ... has no inertia" warnings or unstable physics until this is added.`,
      });
    }

    if (inertial) {
      const massEl = inertial.querySelector(':scope > mass');
      const mass = massEl ? parseFloat(massEl.getAttribute('value') || '0') : NaN;
      if (!massEl || Number.isNaN(mass) || mass <= 0) {
        issues.push({
          id: 'invalid-mass',
          severity: 'error',
          scope: 'link',
          target: name,
          message: `Link "${name}" has zero, negative, or missing mass in <inertial>. Physics engines require mass > 0.`,
        });
      }

      const inertiaEl = inertial.querySelector(':scope > inertia');
      if (!inertiaEl) {
        issues.push({
          id: 'missing-inertia-tensor',
          severity: 'error',
          scope: 'link',
          target: name,
          message: `Link "${name}" <inertial> is missing the <inertia> tensor (ixx/iyy/izz/ixy/ixz/iyz attributes).`,
        });
      } else {
        const ixx = parseFloat(inertiaEl.getAttribute('ixx') || '0');
        const iyy = parseFloat(inertiaEl.getAttribute('iyy') || '0');
        const izz = parseFloat(inertiaEl.getAttribute('izz') || '0');
        if ([ixx, iyy, izz].every((v) => v === 0)) {
          issues.push({
            id: 'zero-inertia',
            severity: 'error',
            scope: 'link',
            target: name,
            message: `Link "${name}" has a zero inertia tensor (ixx = iyy = izz = 0). This will cause instability or crashes in Gazebo/MoveIt.`,
          });
        } else if ([ixx, iyy, izz].some((v) => v < 0)) {
          issues.push({
            id: 'negative-inertia',
            severity: 'error',
            scope: 'link',
            target: name,
            message: `Link "${name}" has a negative diagonal inertia value, which is physically invalid.`,
          });
        }
      }
    }

    if (hasGeometry && !collision) {
      issues.push({
        id: 'missing-collision',
        severity: 'warning',
        scope: 'link',
        target: name,
        message: `Link "${name}" has visual geometry but no <collision> geometry. It will be invisible to collision checking in MoveIt and won't physically collide in Gazebo.`,
      });
    }
  });

  jointEls.forEach((joint) => {
    const name = joint.getAttribute('name') || '(unnamed joint)';
    const type = joint.getAttribute('type') || '';
    const limit = joint.querySelector(':scope > limit');
    const parent = joint.querySelector(':scope > parent');
    const child = joint.querySelector(':scope > child');

    if (!parent || !parent.getAttribute('link')) {
      issues.push({ id: 'missing-parent', severity: 'error', scope: 'joint', target: name, message: `Joint "${name}" is missing a <parent link="..."/> reference.` });
    }
    if (!child || !child.getAttribute('link')) {
      issues.push({ id: 'missing-child', severity: 'error', scope: 'joint', target: name, message: `Joint "${name}" is missing a <child link="..."/> reference.` });
    }

    if ((type === 'revolute' || type === 'prismatic') && !limit) {
      issues.push({
        id: 'missing-limit',
        severity: 'error',
        scope: 'joint',
        target: name,
        message: `Joint "${name}" is type "${type}" but has no <limit> tag. The URDF spec requires lower/upper/effort/velocity limits for revolute and prismatic joints.`,
      });
    }

    if (limit) {
      const effort = parseFloat(limit.getAttribute('effort') || '0');
      const velocity = parseFloat(limit.getAttribute('velocity') || '0');
      if (!(effort > 0)) {
        issues.push({ id: 'zero-effort', severity: 'warning', scope: 'joint', target: name, message: `Joint "${name}" has effort <= 0 in its <limit>, which may prevent it from being actuated in simulation/MoveIt.` });
      }
      if (!(velocity > 0)) {
        issues.push({ id: 'zero-velocity', severity: 'warning', scope: 'joint', target: name, message: `Joint "${name}" has velocity <= 0 in its <limit>.` });
      }
    }

    if (type === 'planar' || type === 'floating') {
      issues.push({ id: 'unusual-joint-type', severity: 'info', scope: 'joint', target: name, message: `Joint "${name}" is type "${type}". This is rendered but not exposed as a slider (only revolute/continuous/prismatic joints are).` });
    }
  });

  const childLinkNames = new Set(
    jointEls.map((j) => j.querySelector(':scope > child')?.getAttribute('link')).filter((v): v is string => !!v),
  );
  const roots = linkEls.filter((l) => !childLinkNames.has(l.getAttribute('name') || ''));
  if (linkEls.length > 0 && roots.length === 0) {
    issues.push({ id: 'no-root-link', severity: 'error', scope: 'robot', target: 'robot', message: 'No root link found — every link is a child of some joint, which usually means there is a cycle.' });
  } else if (roots.length > 1) {
    issues.push({
      id: 'multiple-roots',
      severity: 'warning',
      scope: 'robot',
      target: 'robot',
      message: `Found ${roots.length} disconnected root links (${roots.map((r) => r.getAttribute('name')).join(', ')}). Parts of the tree may not be connected by joints.`,
    });
  }

  return issues;
}

export function severityWeight(s: LintIssue['severity']): number {
  return s === 'error' ? 0 : s === 'warning' ? 1 : 2;
}
