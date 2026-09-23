import type {
  InitialPositionsFile,
  JointLimitsFile,
  KinematicsFile,
  MoveitControllersFile,
  MoveitIssue,
  Ros2ControllersFile,
  SrdfData,
  UrdfSummary,
} from './types';
import { buildParentMap, walkChainJoints } from './chainUtils';

function expandGroupJoints(groupName: string, groupsByName: Map<string, SrdfData['groups'][number]>, parentMap: Map<string, { joint: string; parentLink: string }>, seen: Set<string> = new Set()): Set<string> {
  const out = new Set<string>();
  if (seen.has(groupName)) return out;
  seen.add(groupName);
  const group = groupsByName.get(groupName);
  if (!group) return out;
  group.joints.forEach((j) => out.add(j));
  // SRDF semantics: listing a <link> implicitly includes that link's parent joint.
  group.links.forEach((l) => {
    const step = parentMap.get(l);
    if (step) out.add(step.joint);
  });
  group.chains.forEach((c) => {
    const { joints } = walkChainJoints(parentMap, c.baseLink, c.tipLink);
    joints.forEach((j) => out.add(j));
  });
  group.subgroups.forEach((sg) => {
    expandGroupJoints(sg, groupsByName, parentMap, seen).forEach((j) => out.add(j));
  });
  return out;
}

export function crossValidateSrdf(urdf: UrdfSummary, srdf: SrdfData): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const linkSet = new Set(urdf.linkNames);
  const jointSet = new Set(urdf.joints.map((j) => j.name));
  const groupsByName = new Map(srdf.groups.map((g) => [g.name, g]));
  const parentMap = buildParentMap(urdf);

  const unknownGroupLinks: string[] = [];
  const unknownGroupJoints: string[] = [];

  srdf.groups.forEach((g) => {
    if (!g.name) {
      issues.push({ id: 'srdf-group-no-name', severity: 'error', source: 'srdf', message: 'A <group> element is missing its name attribute.' });
    }
    g.links.forEach((l) => {
      if (!linkSet.has(l)) unknownGroupLinks.push(`${g.name}.${l}`);
    });
    g.joints.forEach((j) => {
      if (!jointSet.has(j)) unknownGroupJoints.push(`${g.name}.${j}`);
    });
    g.chains.forEach((c) => {
      const baseOk = linkSet.has(c.baseLink);
      const tipOk = linkSet.has(c.tipLink);
      if (!baseOk) {
        issues.push({ id: 'srdf-chain-unknown-base', severity: 'error', source: 'cross', message: `Group "${g.name}" has a <chain> with base_link "${c.baseLink}", which doesn't exist in the URDF.` });
      }
      if (!tipOk) {
        issues.push({ id: 'srdf-chain-unknown-tip', severity: 'error', source: 'cross', message: `Group "${g.name}" has a <chain> with tip_link "${c.tipLink}", which doesn't exist in the URDF.` });
      }
      if (baseOk && tipOk) {
        const { reached } = walkChainJoints(parentMap, c.baseLink, c.tipLink);
        if (!reached) {
          issues.push({
            id: 'srdf-chain-not-connected',
            severity: 'error',
            source: 'cross',
            message: `Group "${g.name}": tip_link "${c.tipLink}" is not reachable from base_link "${c.baseLink}" by walking up parent joints in the URDF tree — this chain won't resolve in MoveIt.`,
          });
        }
      }
    });
    g.subgroups.forEach((sg) => {
      if (sg === g.name) {
        issues.push({ id: 'srdf-group-self-reference', severity: 'error', source: 'srdf', message: `Group "${g.name}" references itself as a subgroup.` });
      } else if (!groupsByName.has(sg)) {
        issues.push({ id: 'srdf-group-unknown-subgroup', severity: 'error', source: 'cross', message: `Group "${g.name}" references subgroup "${sg}", which isn't defined anywhere in this SRDF.` });
      }
    });
  });

  if (unknownGroupLinks.length > 0) {
    issues.push({
      id: 'srdf-group-unknown-link',
      severity: 'error',
      source: 'cross',
      message: `${unknownGroupLinks.length} group.link reference(s) don't exist in the URDF: ${unknownGroupLinks.join(', ')}.`,
    });
  }
  if (unknownGroupJoints.length > 0) {
    issues.push({
      id: 'srdf-group-unknown-joint',
      severity: 'error',
      source: 'cross',
      message: `${unknownGroupJoints.length} group.joint reference(s) don't exist in the URDF: ${unknownGroupJoints.join(', ')}.`,
    });
  }

  // cycle detection across subgroup references (e.g. A -> B -> A), reported once per group
  {
    const reportedCycle = new Set<string>();
    srdf.groups.forEach((g) => {
      const path: string[] = [];
      function dfs(name: string): string[] | null {
        const idx = path.indexOf(name);
        if (idx !== -1) return path.slice(idx).concat(name);
        path.push(name);
        const grp = groupsByName.get(name);
        if (grp) {
          for (const sg of grp.subgroups) {
            if (sg === name) continue; // already reported as self-reference above
            const cycle = dfs(sg);
            if (cycle) return cycle;
          }
        }
        path.pop();
        return null;
      }
      const cycle = dfs(g.name);
      if (cycle) {
        const key = [...cycle].sort().join('>');
        if (!reportedCycle.has(key)) {
          reportedCycle.add(key);
          issues.push({
            id: 'srdf-group-subgroup-cycle',
            severity: 'error',
            source: 'srdf',
            message: `Subgroup reference cycle detected: ${cycle.join(' -> ')}. Groups can't contain themselves, even indirectly.`,
          });
        }
      }
    });
  }

  const unknownGroupStateJoints: string[] = [];
  const groupStateJointsNotInGroup: string[] = [];
  const badGroupStateValues: string[] = [];

  srdf.groupStates.forEach((gs) => {
    if (!groupsByName.has(gs.group)) {
      issues.push({ id: 'srdf-groupstate-unknown-group', severity: 'error', source: 'cross', message: `group_state "${gs.name}" refers to group "${gs.group}", which isn't defined in this SRDF.` });
      return;
    }
    const groupJoints = expandGroupJoints(gs.group, groupsByName, parentMap);
    gs.joints.forEach((j) => {
      if (!jointSet.has(j.name)) {
        unknownGroupStateJoints.push(`${gs.name}.${j.name}`);
      } else if (!groupJoints.has(j.name)) {
        groupStateJointsNotInGroup.push(`${gs.name}.${j.name} (group "${gs.group}")`);
      }
      if (Number.isNaN(parseFloat(j.value))) {
        badGroupStateValues.push(`${gs.name}.${j.name} = "${j.value}"`);
      }
    });
  });

  if (unknownGroupStateJoints.length > 0) {
    issues.push({ id: 'srdf-groupstate-unknown-joint', severity: 'error', source: 'cross', message: `${unknownGroupStateJoints.length} group_state joint(s) don't exist in the URDF: ${unknownGroupStateJoints.join(', ')}.` });
  }
  if (groupStateJointsNotInGroup.length > 0) {
    issues.push({ id: 'srdf-groupstate-joint-not-in-group', severity: 'warning', source: 'cross', message: `${groupStateJointsNotInGroup.length} group_state joint(s) aren't part of their own group (based on that group's links/joints/chains): ${groupStateJointsNotInGroup.join(', ')}.` });
  }
  if (badGroupStateValues.length > 0) {
    issues.push({ id: 'srdf-groupstate-bad-value', severity: 'error', source: 'srdf', message: `${badGroupStateValues.length} group_state joint value(s) aren't numeric: ${badGroupStateValues.join(', ')}.` });
  }

  srdf.endEffectors.forEach((ee) => {
    if (!linkSet.has(ee.parentLink)) {
      issues.push({ id: 'srdf-ee-unknown-parent-link', severity: 'error', source: 'cross', message: `end_effector "${ee.name}" has parent_link "${ee.parentLink}", which doesn't exist in the URDF.` });
    }
    if (!groupsByName.has(ee.group)) {
      issues.push({ id: 'srdf-ee-unknown-group', severity: 'error', source: 'cross', message: `end_effector "${ee.name}" refers to group "${ee.group}", which isn't defined in this SRDF.` });
    }
    if (ee.parentGroup && !groupsByName.has(ee.parentGroup)) {
      issues.push({ id: 'srdf-ee-unknown-parent-group', severity: 'error', source: 'cross', message: `end_effector "${ee.name}" has parent_group "${ee.parentGroup}", which isn't defined in this SRDF.` });
    }
  });

  srdf.virtualJoints.forEach((vj) => {
    if (!linkSet.has(vj.childLink)) {
      issues.push({ id: 'srdf-virtualjoint-unknown-child', severity: 'error', source: 'cross', message: `virtual_joint "${vj.name}" has child_link "${vj.childLink}", which doesn't exist in the URDF.` });
    }
  });

  const unknownPassiveJoints = srdf.passiveJoints.filter((pj) => !jointSet.has(pj));
  if (unknownPassiveJoints.length > 0) {
    issues.push({ id: 'srdf-passivejoint-unknown', severity: 'error', source: 'cross', message: `${unknownPassiveJoints.length} passive_joint(s) don't exist in the URDF: ${unknownPassiveJoints.join(', ')}.` });
  }

  const unknownDisableCollisionsLinks = new Set<string>();
  srdf.disableCollisions.forEach((dc) => {
    if (!linkSet.has(dc.link1)) unknownDisableCollisionsLinks.add(dc.link1);
    if (!linkSet.has(dc.link2)) unknownDisableCollisionsLinks.add(dc.link2);
  });
  if (unknownDisableCollisionsLinks.size > 0) {
    issues.push({
      id: 'srdf-disablecollisions-unknown-link',
      severity: 'warning',
      source: 'cross',
      message: `disable_collisions references ${unknownDisableCollisionsLinks.size} link(s) that don't exist in the URDF: ${[...unknownDisableCollisionsLinks].join(', ')}.`,
    });
  }

  if (srdf.groups.length === 0) {
    issues.push({ id: 'srdf-no-groups', severity: 'warning', source: 'srdf', message: 'This SRDF defines no <group> elements — MoveIt needs at least one planning group.' });
  }
  if (srdf.virtualJoints.length === 0) {
    issues.push({
      id: 'srdf-no-virtual-joint',
      severity: 'info',
      source: 'srdf',
      message: 'No <virtual_joint> found. Fine for an arm attached to a fixed base already in the URDF — needed if this robot should plan relative to a world/map frame (e.g. a mobile-base-mounted arm).',
    });
  }

  return issues;
}

export function crossValidateJointLimits(urdf: UrdfSummary, jointLimits: JointLimitsFile): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const jointByName = new Map(urdf.joints.map((j) => [j.name, j]));

  const unknownJoints: string[] = [];
  const accelDisabled: string[] = [];
  const accelZero: string[] = [];
  const intLiterals: string[] = [];

  jointLimits.entries.forEach((entry) => {
    const joint = jointByName.get(entry.jointName);
    if (!joint) {
      unknownJoints.push(entry.jointName);
      return;
    }

    if (entry.hasAccelerationLimits !== true) {
      accelDisabled.push(entry.jointName);
    } else if (entry.maxAcceleration === undefined || entry.maxAcceleration.num <= 0) {
      accelZero.push(entry.jointName);
    }

    Object.entries(entry.allNumericValues).forEach(([key, v]) => {
      if (v.isIntLiteral) intLiterals.push(`${entry.jointName}.${key} (${v.raw})`);
    });
  });

  if (unknownJoints.length > 0) {
    issues.push({
      id: 'jointlimits-unknown-joint',
      severity: 'error',
      source: 'cross',
      message: `joint_limits.yaml has ${unknownJoints.length === 1 ? 'an entry' : `${unknownJoints.length} entries`} for a joint that doesn't exist in the URDF: ${unknownJoints.join(', ')}.`,
    });
  }
  if (accelDisabled.length > 0) {
    issues.push({
      id: 'jointlimits-accel-disabled',
      severity: 'warning',
      source: 'joint_limits',
      message: `${accelDisabled.length} joint(s) have has_acceleration_limits false or unset: ${accelDisabled.join(', ')}. Time-parameterization (TOTG) needs an acceleration bound to produce a smooth trajectory — set has_acceleration_limits: true and give each a max_acceleration (start around 0.2–0.3 rad/s² if you don't have a real spec, then tune).`,
    });
  }
  if (accelZero.length > 0) {
    issues.push({
      id: 'jointlimits-accel-zero',
      severity: 'warning',
      source: 'joint_limits',
      message: `${accelZero.length} joint(s) have has_acceleration_limits: true but max_acceleration missing or <= 0: ${accelZero.join(', ')}. Give each a real value (e.g. 0.2–0.3 rad/s² as a starting point).`,
    });
  }
  if (intLiterals.length > 0) {
    issues.push({
      id: 'jointlimits-int-literal',
      severity: 'info',
      source: 'joint_limits',
      message: `${intLiterals.length} value(s) in this file are written as bare integers (e.g. "${intLiterals[0]}"). Write every numeric value here as a float — 5 → 5.0 — to avoid a runtime "InvalidParameterTypeException": ROS 2 infers a parameter's type from the YAML literal, and mixing int/double for what should be a double parameter throws at load time.`,
    });
  }

  const limitedNames = new Set(jointLimits.entries.map((e) => e.jointName));
  const actuatedJoints = urdf.joints.filter((j) => (j.type === 'revolute' || j.type === 'continuous' || j.type === 'prismatic') && !j.mimic);
  const missing = actuatedJoints.filter((j) => !limitedNames.has(j.name));
  if (missing.length > 0) {
    issues.push({
      id: 'jointlimits-missing-entries',
      severity: 'info',
      source: 'cross',
      message: `${missing.length} actuated joint(s) have no entry in joint_limits.yaml: ${missing.map((j) => j.name).join(', ')}. They'll fall back to whatever limits (if any) are in the URDF's <limit> tag.`,
    });
  }

  return issues;
}

export function crossValidateMoveitControllers(urdf: UrdfSummary, controllers: MoveitControllersFile): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const jointSet = new Set(urdf.joints.map((j) => j.name));

  const controllersMissingActionNs: string[] = [];
  const unknownControllerJoints: string[] = [];

  controllers.controllers.forEach((c) => {
    if (c.type === 'FollowJointTrajectory' && (c.actionNs === null || c.actionNs === '')) {
      controllersMissingActionNs.push(c.name);
    }
    c.joints.forEach((j) => {
      if (!jointSet.has(j)) unknownControllerJoints.push(`${c.name}.${j}`);
    });
  });

  if (controllersMissingActionNs.length > 0) {
    issues.push({
      id: 'controller-missing-action-ns',
      severity: 'warning',
      source: 'cross',
      message: `${controllersMissingActionNs.length} FollowJointTrajectory controller(s) have no action_ns: ${controllersMissingActionNs.join(', ')}. moveit_simple_controller_manager needs this to find the action server — add "action_ns: follow_joint_trajectory" to each (it's easy to leave out when hand-editing this file, and the failure mode — MoveIt reporting the controller as unavailable or execution silently not starting — doesn't point back at this line).`,
    });
  }
  if (unknownControllerJoints.length > 0) {
    issues.push({
      id: 'controller-unknown-joint',
      severity: 'error',
      source: 'cross',
      message: `${unknownControllerJoints.length} controller.joint reference(s) don't exist in the URDF: ${unknownControllerJoints.join(', ')}.`,
    });
  }

  if (controllers.controllers.length > 0) {
    const controlledJoints = new Set(controllers.controllers.flatMap((c) => c.joints));
    const actuatedJoints = urdf.joints.filter((j) => (j.type === 'revolute' || j.type === 'continuous' || j.type === 'prismatic') && !j.mimic);
    const uncontrolled = actuatedJoints.filter((j) => !controlledJoints.has(j.name));
    if (uncontrolled.length > 0) {
      issues.push({
        id: 'controller-joint-not-covered',
        severity: 'info',
        source: 'cross',
        message: `${uncontrolled.length} actuated joint(s) aren't listed in any controller: ${uncontrolled.map((j) => j.name).join(', ')}. MoveIt won't be able to execute trajectories that move them.`,
      });
    }
  }

  return issues;
}

export function crossValidateKinematics(srdf: SrdfData, kinematics: KinematicsFile): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const groupSet = new Set(srdf.groups.map((g) => g.name));

  kinematics.groupNames.forEach((name) => {
    if (!groupSet.has(name)) {
      issues.push({
        id: 'kinematics-unknown-group',
        severity: 'error',
        source: 'cross',
        message: `kinematics.yaml has a solver configured for group "${name}", which isn't defined in the SRDF.`,
      });
    }
  });

  const kinematicsGroups = new Set(kinematics.groupNames);
  const uncovered = srdf.groups.filter((g) => !kinematicsGroups.has(g.name));
  if (uncovered.length > 0) {
    issues.push({
      id: 'kinematics-group-not-covered',
      severity: 'info',
      source: 'cross',
      message: `${uncovered.length} SRDF group(s) have no kinematics solver configured: ${uncovered.map((g) => g.name).join(', ')}. Fine if you only plan with OMPL's sampling-based planners for them, but IK-dependent features (e.g. Cartesian planning, servoing) need a solver here.`,
    });
  }

  return issues;
}

export function crossValidateInitialPositions(urdf: UrdfSummary, initialPositions: InitialPositionsFile): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const jointSet = new Set(urdf.joints.map((j) => j.name));

  const unknownJoints: string[] = [];
  const badValues: string[] = [];
  initialPositions.joints.forEach((j) => {
    if (!jointSet.has(j.name)) {
      unknownJoints.push(j.name);
    } else if (Number.isNaN(parseFloat(j.value))) {
      badValues.push(`${j.name} = "${j.value}"`);
    }
  });

  if (unknownJoints.length > 0) {
    issues.push({ id: 'initialpositions-unknown-joint', severity: 'error', source: 'cross', message: `initial_positions.yaml sets ${unknownJoints.length} joint(s) that don't exist in the URDF: ${unknownJoints.join(', ')}.` });
  }
  if (badValues.length > 0) {
    issues.push({ id: 'initialpositions-bad-value', severity: 'error', source: 'cross', message: `initial_positions.yaml has ${badValues.length} non-numeric value(s): ${badValues.join(', ')}.` });
  }

  return issues;
}

export function crossValidateRos2Controllers(urdf: UrdfSummary, ros2Controllers: Ros2ControllersFile): MoveitIssue[] {
  const issues: MoveitIssue[] = [];
  const jointSet = new Set(urdf.joints.map((j) => j.name));

  const unknownJoints: string[] = [];
  ros2Controllers.controllers.forEach((c) => {
    c.joints.forEach((j) => {
      if (!jointSet.has(j)) unknownJoints.push(`${c.name}.${j}`);
    });
  });
  if (unknownJoints.length > 0) {
    issues.push({
      id: 'ros2controllers-unknown-joint',
      severity: 'error',
      source: 'cross',
      message: `${unknownJoints.length} ros2_controllers.yaml controller.joint reference(s) don't exist in the URDF: ${unknownJoints.join(', ')}.`,
    });
  }

  if (ros2Controllers.controllers.length > 0) {
    const controlledJoints = new Set(ros2Controllers.controllers.flatMap((c) => c.joints));
    const actuatedJoints = urdf.joints.filter((j) => (j.type === 'revolute' || j.type === 'continuous' || j.type === 'prismatic') && !j.mimic);
    const uncontrolled = actuatedJoints.filter((j) => !controlledJoints.has(j.name));
    if (uncontrolled.length > 0) {
      issues.push({
        id: 'ros2controllers-joint-not-covered',
        severity: 'warning',
        source: 'cross',
        message: `${uncontrolled.length} actuated joint(s) aren't claimed by any ros2_control controller: ${uncontrolled.map((j) => j.name).join(', ')}. Without a controller claiming its command interface, ros2_control can't move it at all — this one's worth checking even outside MoveIt.`,
      });
    }
  }

  return issues;
}
