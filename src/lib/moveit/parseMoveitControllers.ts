import type { MoveitControllerEntry, MoveitControllersFile } from './types';

/**
 * Parser for the moveit_controllers.yaml / simple_moveit_controllers.yaml shape used by
 * moveit_simple_controller_manager (verified against a real Setup-Assistant-generated file,
 * moveit/moveit_resources panda_moveit_config/config/simple_moveit_controllers.yaml):
 *
 * controller_list:
 *   - name: arm_controller
 *     action_ns: follow_joint_trajectory
 *     type: FollowJointTrajectory
 *     joints:
 *       - panda_joint1
 *       - panda_joint2
 *
 * Only handles this specific list-of-maps shape, not general YAML.
 */
export function parseMoveitControllersYaml(text: string): MoveitControllersFile {
  const lines = text.split('\n');
  const controllers: MoveitControllerEntry[] = [];

  let inControllerList = false;
  let itemIndent: number | null = null;
  let fieldIndent: number | null = null;
  let inJointsList = false;
  let jointsListIndent: number | null = null;
  let current: MoveitControllerEntry | null = null;

  const flush = () => {
    if (current) controllers.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\r$/, '');
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (indent === 0) {
      if (/^controller_list:\s*$/.test(trimmed)) {
        inControllerList = true;
        itemIndent = null;
        fieldIndent = null;
        inJointsList = false;
        flush();
      } else {
        inControllerList = false;
        flush();
      }
      continue;
    }

    if (!inControllerList) continue;

    const newEntryMatch = /^(\s*)-\s+name:\s*(.+)$/.exec(line);
    if (newEntryMatch && (itemIndent === null || newEntryMatch[1].length === itemIndent)) {
      itemIndent = newEntryMatch[1].length;
      fieldIndent = itemIndent + 2;
      inJointsList = false;
      flush();
      current = { name: newEntryMatch[2].trim(), actionNs: null, type: '', joints: [] };
      continue;
    }

    if (inJointsList && current && jointsListIndent !== null && indent === jointsListIndent) {
      const jointMatch = /^-\s*(.+)$/.exec(trimmed);
      if (jointMatch) {
        current.joints.push(jointMatch[1].trim());
        continue;
      }
    }

    if (current && fieldIndent !== null && indent === fieldIndent) {
      const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(trimmed);
      if (kv) {
        const [, key, rawValue] = kv;
        const value = rawValue.trim();
        if (key === 'action_ns') current.actionNs = value.length > 0 ? value : '';
        else if (key === 'type') current.type = value;
        else if (key === 'joints' && value === '') {
          inJointsList = true;
          jointsListIndent = fieldIndent + 2;
        } else {
          inJointsList = false;
        }
      }
    }
  }
  flush();

  if (controllers.length === 0 && !/controller_list:/.test(text)) {
    return { controllers: [], parseError: 'No top-level "controller_list:" key found — this doesn\'t look like a moveit_controllers.yaml file.' };
  }

  return { controllers, parseError: null };
}
