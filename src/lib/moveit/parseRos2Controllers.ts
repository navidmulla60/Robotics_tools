import type { Ros2ControllersFile } from './types';

/**
 * Parser for ros2_controllers.yaml (the ros2_control controller_manager config — a
 * different file from moveit_controllers.yaml, though both list controllers and joints).
 * Verified against a real file, moveit/moveit_resources (ros2 branch)
 * panda_moveit_config/config/ros2_controllers.yaml:
 *
 * controller_manager:
 *   ros__parameters:
 *     update_rate: 100
 *     panda_arm_controller:
 *       type: joint_trajectory_controller/JointTrajectoryController
 *     joint_state_broadcaster:
 *       type: joint_state_broadcaster/JointStateBroadcaster
 *
 * panda_arm_controller:
 *   ros__parameters:
 *     joints:
 *       - panda_joint1
 *       - panda_joint2
 *
 * panda_hand_controller:
 *   ros__parameters:
 *     joint: panda_finger_joint1   # some controllers (e.g. a gripper action controller) use a single "joint:" instead of a "joints:" list
 */
export function parseRos2ControllersYaml(text: string): Ros2ControllersFile {
  const lines = text.split('\n');
  const types = new Map<string, string>();
  const jointsByController = new Map<string, string[]>();
  const orderedNames: string[] = [];

  let topKey: string | null = null;
  let inCmParams = false;
  let pendingCmName: string | null = null;
  let inOwnParams = false;
  let inJointsList = false;

  const remember = (name: string) => {
    if (!orderedNames.includes(name)) orderedNames.push(name);
  };

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').replace(/\r$/, '');
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (indent === 0) {
      const headerMatch = /^([A-Za-z0-9_]+):\s*$/.exec(trimmed);
      topKey = headerMatch ? headerMatch[1] : null;
      inCmParams = false;
      inOwnParams = false;
      inJointsList = false;
      pendingCmName = null;
      continue;
    }

    if (topKey === 'controller_manager') {
      if (indent === 2 && /^ros__parameters:\s*$/.test(trimmed)) {
        inCmParams = true;
        continue;
      }
      if (!inCmParams) continue;
      if (indent === 4) {
        const nameMatch = /^([A-Za-z0-9_]+):\s*$/.exec(trimmed);
        pendingCmName = nameMatch ? nameMatch[1] : null;
        if (pendingCmName) remember(pendingCmName);
        continue;
      }
      if (indent === 6 && pendingCmName) {
        const kv = /^type:\s*(.+)$/.exec(trimmed);
        if (kv) types.set(pendingCmName, kv[1].trim());
      }
      continue;
    }

    if (!topKey) continue;

    if (indent === 2 && /^ros__parameters:\s*$/.test(trimmed)) {
      inOwnParams = true;
      inJointsList = false;
      continue;
    }
    if (!inOwnParams) continue;

    if (indent === 4) {
      inJointsList = false;
      if (/^joints:\s*$/.test(trimmed)) {
        inJointsList = true;
        remember(topKey);
        continue;
      }
      const singularJoint = /^joint:\s*(.+)$/.exec(trimmed);
      if (singularJoint) {
        remember(topKey);
        if (!jointsByController.has(topKey)) jointsByController.set(topKey, []);
        jointsByController.get(topKey)!.push(singularJoint[1].trim());
      }
      continue;
    }

    if (indent === 6 && inJointsList) {
      const jointMatch = /^-\s*(.+)$/.exec(trimmed);
      if (jointMatch) {
        if (!jointsByController.has(topKey)) jointsByController.set(topKey, []);
        jointsByController.get(topKey)!.push(jointMatch[1].trim());
      }
    }
  }

  const controllers = orderedNames
    .filter((n) => n !== 'controller_manager')
    .map((n) => ({ name: n, type: types.get(n) ?? null, joints: jointsByController.get(n) ?? [] }));

  if (controllers.length === 0 && !/^\s*controller_manager:\s*$/m.test(text)) {
    return { controllers: [], parseError: 'No top-level "controller_manager:" key found — this doesn\'t look like a ros2_controllers.yaml file.' };
  }

  return { controllers, parseError: null };
}
