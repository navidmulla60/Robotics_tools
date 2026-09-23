import type { SrdfData, SrdfGroup } from './types';

/**
 * Parses SRDF XML into structured data. Schema verified against MoveIt's own
 * generated files (moveit/moveit_resources panda.srdf, ipa320/automatica2014 ur5.srdf):
 * <group name> holding <link>/<joint>/<chain base_link tip_link>/<group name> (subgroup refs),
 * <group_state name group> holding <joint name value>, <end_effector name parent_link group parent_group?>,
 * <virtual_joint name type parent_frame child_link>, <passive_joint name>, <disable_collisions link1 link2 reason?>.
 */
export function parseSrdf(xmlText: string): SrdfData {
  const empty: SrdfData = {
    robotName: null,
    groups: [],
    groupStates: [],
    endEffectors: [],
    virtualJoints: [],
    passiveJoints: [],
    disableCollisions: [],
    parseError: null,
  };

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    return { ...empty, parseError: 'Could not parse this file as XML.' };
  }

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return { ...empty, parseError: `XML is not well-formed: ${parserError.textContent?.trim().slice(0, 200) ?? 'unknown error'}` };
  }

  const robotEl = doc.querySelector('robot');
  if (!robotEl) {
    return { ...empty, parseError: 'No <robot> root element found — this does not look like an SRDF file.' };
  }

  const groups: SrdfGroup[] = Array.from(robotEl.querySelectorAll(':scope > group')).map((g) => ({
    name: g.getAttribute('name') || '',
    links: Array.from(g.querySelectorAll(':scope > link')).map((l) => l.getAttribute('name') || ''),
    joints: Array.from(g.querySelectorAll(':scope > joint')).map((j) => j.getAttribute('name') || ''),
    chains: Array.from(g.querySelectorAll(':scope > chain')).map((c) => ({
      baseLink: c.getAttribute('base_link') || '',
      tipLink: c.getAttribute('tip_link') || '',
    })),
    subgroups: Array.from(g.querySelectorAll(':scope > group')).map((sg) => sg.getAttribute('name') || ''),
  }));

  const groupStates = Array.from(robotEl.querySelectorAll(':scope > group_state')).map((gs) => ({
    name: gs.getAttribute('name') || '',
    group: gs.getAttribute('group') || '',
    joints: Array.from(gs.querySelectorAll(':scope > joint')).map((j) => ({
      name: j.getAttribute('name') || '',
      value: j.getAttribute('value') || '',
    })),
  }));

  const endEffectors = Array.from(robotEl.querySelectorAll(':scope > end_effector')).map((ee) => ({
    name: ee.getAttribute('name') || '',
    parentLink: ee.getAttribute('parent_link') || '',
    group: ee.getAttribute('group') || '',
    parentGroup: ee.getAttribute('parent_group') || undefined,
  }));

  const virtualJoints = Array.from(robotEl.querySelectorAll(':scope > virtual_joint')).map((vj) => ({
    name: vj.getAttribute('name') || '',
    type: vj.getAttribute('type') || '',
    parentFrame: vj.getAttribute('parent_frame') || '',
    childLink: vj.getAttribute('child_link') || '',
  }));

  const passiveJoints = Array.from(robotEl.querySelectorAll(':scope > passive_joint')).map((pj) => pj.getAttribute('name') || '');

  const disableCollisions = Array.from(robotEl.querySelectorAll(':scope > disable_collisions')).map((dc) => ({
    link1: dc.getAttribute('link1') || '',
    link2: dc.getAttribute('link2') || '',
    reason: dc.getAttribute('reason') || undefined,
  }));

  return {
    robotName: robotEl.getAttribute('name'),
    groups,
    groupStates,
    endEffectors,
    virtualJoints,
    passiveJoints,
    disableCollisions,
    parseError: null,
  };
}
