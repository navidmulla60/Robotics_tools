import type { MoveitIssue, UrdfSummary } from './types';

/**
 * MoveIt-specific URDF checks that go beyond src/lib/urdf/lint.ts's generic sanity checks
 * (mass/inertia/collision/limits). These are informational — they don't affect whether the
 * URDF loads, but they're things worth knowing before running Setup Assistant.
 */
export function lintMoveitUrdf(urdf: UrdfSummary): MoveitIssue[] {
  const issues: MoveitIssue[] = [];

  const movingJointsWithoutAxis = urdf.joints.filter(
    (j) => (j.type === 'revolute' || j.type === 'continuous' || j.type === 'prismatic') && !j.hasAxis,
  );
  if (movingJointsWithoutAxis.length > 0) {
    issues.push({
      id: 'joints-default-axis',
      severity: 'info',
      source: 'urdf',
      message: `${movingJointsWithoutAxis.length} joint(s) have no <axis> tag and will default to (1, 0, 0): ${movingJointsWithoutAxis
        .map((j) => j.name)
        .join(', ')}. Fine if that's intentional, easy to miss if it isn't.`,
    });
  }

  const mimicJoints = urdf.joints.filter((j) => j.mimic);
  if (mimicJoints.length > 0) {
    issues.push({
      id: 'mimic-joints',
      severity: 'info',
      source: 'urdf',
      message: `${mimicJoints.length} mimic joint(s) found: ${mimicJoints
        .map((j) => `${j.name} (mimics ${j.mimic?.joint})`)
        .join(', ')}. Setup Assistant excludes these from planning group DOF automatically — make sure your controller config accounts for them too (ros2_control needs a mimic-aware hardware interface or a MimicJoint plugin).`,
    });
  }

  const continuousJoints = urdf.joints.filter((j) => j.type === 'continuous');
  if (continuousJoints.length > 0) {
    issues.push({
      id: 'continuous-joints',
      severity: 'info',
      source: 'urdf',
      message: `${continuousJoints.length} continuous joint(s) found: ${continuousJoints
        .map((j) => j.name)
        .join(', ')}. These have no position limits — OMPL plans for them on (-pi, pi], which is usually fine, but double-check if you need bounded motion.`,
    });
  }

  if (urdf.linksWithoutVisualOrCollision.length > 0) {
    issues.push({
      id: 'links-no-geometry',
      severity: 'info',
      source: 'urdf',
      message: `${urdf.linksWithoutVisualOrCollision.length} link(s) have neither <visual> nor <collision>: ${urdf.linksWithoutVisualOrCollision.join(
        ', ',
      )}. Fine for pure TF frames (e.g. a tool0/tip frame), but check none of these were meant to have geometry.`,
    });
  }

  return issues;
}

/**
 * Setup Assistant loads the URDF through its own URDF/KDL parsing, which is far less
 * forgiving than RViz or Gazebo: a <gazebo>/<plugin> block that doesn't resolve cleanly
 * routinely crashes it outright (rather than warning and continuing).
 */
export function checkSetupAssistantReadiness(xmlText: string): MoveitIssue[] {
  const hasGazeboOrPlugin = /<gazebo[\s>]/.test(xmlText) || /<plugin[\s>]/.test(xmlText);
  if (!hasGazeboOrPlugin) return [];

  return [
    {
      id: 'gazebo-plugin-tags-present',
      severity: 'error',
      source: 'urdf',
      message: 'This URDF has <gazebo>/<plugin> tags. If Setup Assistant crashes, try removing all plugin tags — <gazebo> blocks, <plugin> blocks, and all — first, then re-run it.',
    },
  ];
}
