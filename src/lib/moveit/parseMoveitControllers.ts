import type { MoveitControllerEntry, MoveitControllersFile } from './types';

/**
 * Parser for moveit_controllers.yaml as MoveIt2 Setup Assistant actually generates it —
 * verified against a real file, moveit/moveit_resources (ros2 branch)
 * panda_moveit_config/config/moveit_controllers.yaml:
 *
 * moveit_controller_manager: moveit_simple_controller_manager/MoveItSimpleControllerManager
 *
 * moveit_simple_controller_manager:
 *   controller_names:
 *     - panda_arm_controller
 *
 *   panda_arm_controller:
 *     action_ns: follow_joint_trajectory
 *     type: FollowJointTrajectory
 *     default: true
 *     joints:
 *       - panda_joint1
 *       - panda_joint2
 *
 * The top-level key holding the controllers (here "moveit_simple_controller_manager") is
 * derived from moveit_controller_manager's value — everything before the "/" — rather than
 * hardcoded, since that's a plugin classname and other controller manager plugins use their
 * own package name as the namespace the same way.
 *
 * (An earlier version of this parser assumed a flat `controller_list:` list-of-maps shape —
 * that's the ROS 1 / MoveIt1 format and doesn't match what MoveIt2's Setup Assistant emits.)
 */
export function parseMoveitControllersYaml(text: string): MoveitControllersFile {
  const lines = text.split('\n');

  let managerNamespace: string | null = null;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\r$/, '');
    const m = /^moveit_controller_manager:\s*(\S+)/.exec(line);
    if (m) {
      managerNamespace = m[1].split('/')[0].trim();
      break;
    }
  }
  if (!managerNamespace) {
    return { controllers: [], parseError: 'No "moveit_controller_manager:" key found — this doesn\'t look like a moveit_controllers.yaml file.' };
  }

  const namespaceHeaderRe = new RegExp(`^${managerNamespace}:\\s*$`);
  const controllerNames: string[] = [];
  const controllers: MoveitControllerEntry[] = [];
  let inNamespace = false;
  let current: MoveitControllerEntry | null = null;
  let joinsFieldSeen = false;

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
      flush();
      inNamespace = namespaceHeaderRe.test(trimmed);
      continue;
    }
    if (!inNamespace) continue;

    if (indent === 2) {
      flush();
      joinsFieldSeen = false;
      if (/^controller_names:\s*$/.test(trimmed)) continue;
      const headerMatch = /^([A-Za-z0-9_]+):\s*$/.exec(trimmed);
      if (headerMatch) current = { name: headerMatch[1], actionNs: null, type: '', joints: [] };
      continue;
    }

    if (indent === 4 && !current) {
      const nameMatch = /^-\s*(.+)$/.exec(trimmed);
      if (nameMatch) controllerNames.push(nameMatch[1].trim());
      continue;
    }

    if (indent === 4 && current) {
      const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(trimmed);
      if (kv) {
        const [, key, rawValue] = kv;
        const value = rawValue.trim();
        if (key === 'action_ns') current.actionNs = value;
        else if (key === 'type') current.type = value;
        else if (key === 'joints' && value === '') joinsFieldSeen = true;
      }
      continue;
    }

    if (indent === 6 && current && joinsFieldSeen) {
      const jointMatch = /^-\s*(.+)$/.exec(trimmed);
      if (jointMatch) current.joints.push(jointMatch[1].trim());
    }
  }
  flush();

  const filtered = controllerNames.length > 0 ? controllers.filter((c) => controllerNames.includes(c.name)) : controllers;

  return { controllers: filtered, parseError: null };
}
