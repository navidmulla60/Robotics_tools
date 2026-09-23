import type { KinematicsFile } from './types';

/**
 * Parser for kinematics.yaml — verified against a real file, moveit/moveit_resources
 * (ros2 branch) panda_moveit_config/config/kinematics.yaml:
 *
 * panda_arm:
 *   kinematics_solver: kdl_kinematics_plugin/KDLKinematicsPlugin
 *   kinematics_solver_search_resolution: 0.005
 *   kinematics_solver_timeout: 0.05
 *
 * Top-level keys are planning group names (no fixed wrapper key), so this can't be
 * content-sniffed the same way as the others — classifyPackageFiles looks for the
 * "kinematics_solver:" leaf instead.
 */
export function parseKinematicsYaml(text: string): KinematicsFile {
  const lines = text.split('\n');
  const groupNames: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\r$/, '');
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    const headerMatch = /^([A-Za-z0-9_]+):\s*$/.exec(trimmed);
    if (indent === 0 && headerMatch) groupNames.push(headerMatch[1]);
  }

  if (groupNames.length === 0) {
    return { groupNames: [], parseError: "Couldn't find any top-level group entries — this doesn't look like a kinematics.yaml file." };
  }
  return { groupNames, parseError: null };
}
