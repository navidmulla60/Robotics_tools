import type { TfNode } from './types';

/** Builds the link/joint hierarchy (the TF tree) directly from URDF XML. */
export function buildTfTree(xmlText: string): TfNode | null {
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
  const linkNames = new Set(linkEls.map((l) => l.getAttribute('name') || ''));

  const childToParent = new Map<string, { jointName: string; jointType: string }>();
  const parentToChildren = new Map<string, { child: string; jointName: string; jointType: string }[]>();

  jointEls.forEach((j) => {
    const jointName = j.getAttribute('name') || '(unnamed joint)';
    const jointType = j.getAttribute('type') || 'fixed';
    const parent = j.querySelector(':scope > parent')?.getAttribute('link');
    const child = j.querySelector(':scope > child')?.getAttribute('link');
    if (!parent || !child) return;
    childToParent.set(child, { jointName, jointType });
    if (!parentToChildren.has(parent)) parentToChildren.set(parent, []);
    parentToChildren.get(parent)!.push({ child, jointName, jointType });
  });

  const rootName = [...linkNames].find((n) => !childToParent.has(n));
  if (!rootName) return null;

  const visited = new Set<string>();
  function build(linkName: string, joint?: { name: string; type: string }): TfNode {
    visited.add(linkName);
    const kids = (parentToChildren.get(linkName) || [])
      .filter((k) => !visited.has(k.child))
      .map((k) => build(k.child, { name: k.jointName, type: k.jointType }));
    return { link: linkName, joint, children: kids };
  }

  return build(rootName);
}

export function tfTreeToText(root: TfNode): string {
  const lines: string[] = [root.link];
  function walk(node: TfNode, prefix: string) {
    node.children.forEach((child, i) => {
      const isLast = i === node.children.length - 1;
      const connector = isLast ? '└─ ' : '├─ ';
      const label = child.joint ? `[${child.joint.type}] ${child.joint.name}  →  ${child.link}` : child.link;
      lines.push(prefix + connector + label);
      walk(child, prefix + (isLast ? '   ' : '│  '));
    });
  }
  walk(root, '');
  return lines.join('\n');
}

export function tfTreeToJson(root: TfNode): string {
  return JSON.stringify(root, null, 2);
}

export function countNodes(node: TfNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}
