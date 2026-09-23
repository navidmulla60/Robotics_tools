export interface SrdfGroup {
  name: string;
  links: string[];
  joints: string[];
  chains: { baseLink: string; tipLink: string }[];
  subgroups: string[];
}

export interface SrdfGroupState {
  name: string;
  group: string;
  joints: { name: string; value: string }[];
}

export interface SrdfEndEffector {
  name: string;
  parentLink: string;
  group: string;
  parentGroup?: string;
}

export interface SrdfVirtualJoint {
  name: string;
  type: string;
  parentFrame: string;
  childLink: string;
}

export interface SrdfDisableCollisions {
  link1: string;
  link2: string;
  reason?: string;
}

export interface SrdfData {
  robotName: string | null;
  groups: SrdfGroup[];
  groupStates: SrdfGroupState[];
  endEffectors: SrdfEndEffector[];
  virtualJoints: SrdfVirtualJoint[];
  passiveJoints: string[];
  disableCollisions: SrdfDisableCollisions[];
  parseError: string | null;
}

export interface UrdfSummary {
  linkNames: string[];
  joints: {
    name: string;
    type: string;
    parentLink: string | null;
    childLink: string | null;
    hasAxis: boolean;
    mimic: { joint: string } | null;
    limitVelocity: number | null;
  }[];
  linksWithoutVisualOrCollision: string[];
}

export interface JointLimitNumericValue {
  raw: string;
  num: number;
  isIntLiteral: boolean;
}

export interface JointLimitEntry {
  jointName: string;
  hasVelocityLimits?: boolean;
  hasAccelerationLimits?: boolean;
  maxVelocity?: JointLimitNumericValue;
  maxAcceleration?: JointLimitNumericValue;
  /** every numeric leaf under this joint, keyed by yaml key — used for the generic int-literal check */
  allNumericValues: Record<string, JointLimitNumericValue>;
}

export interface JointLimitsFile {
  entries: JointLimitEntry[];
  parseError: string | null;
}

export interface MoveitControllerEntry {
  name: string;
  actionNs: string | null;
  type: string;
  joints: string[];
}

export interface MoveitControllersFile {
  controllers: MoveitControllerEntry[];
  parseError: string | null;
}

export interface KinematicsFile {
  groupNames: string[];
  parseError: string | null;
}

export interface InitialPositionsFile {
  joints: { name: string; value: string }[];
  parseError: string | null;
}

export interface Ros2ControllerEntry {
  name: string;
  type: string | null;
  joints: string[];
}

export interface Ros2ControllersFile {
  controllers: Ros2ControllerEntry[];
  parseError: string | null;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface MoveitIssue {
  id: string;
  severity: IssueSeverity;
  source: 'urdf' | 'srdf' | 'joint_limits' | 'cross';
  message: string;
}
