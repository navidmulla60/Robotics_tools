import type { InitialPositionsFile } from './types';

/**
 * Parser for initial_positions.yaml — verified against a real file, moveit/moveit_resources
 * (ros2 branch) panda_moveit_config/config/initial_positions.yaml:
 *
 * initial_positions:
 *   panda_joint1: 0.0
 *   panda_joint2: -0.785
 *   ...
 */
export function parseInitialPositionsYaml(text: string): InitialPositionsFile {
  const lines = text.split('\n');
  const joints: { name: string; value: string }[] = [];
  let inBlock = false;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\r$/, '');
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (indent === 0) {
      inBlock = /^initial_positions:\s*$/.test(trimmed);
      continue;
    }
    if (!inBlock || indent !== 2) continue;
    const kv = /^([A-Za-z0-9_]+):\s*(.+)$/.exec(trimmed);
    if (kv) joints.push({ name: kv[1], value: kv[2].trim() });
  }

  if (!/^\s*initial_positions:\s*$/m.test(text)) {
    return { joints: [], parseError: 'No top-level "initial_positions:" key found — this doesn\'t look like an initial_positions.yaml file.' };
  }
  return { joints, parseError: null };
}
