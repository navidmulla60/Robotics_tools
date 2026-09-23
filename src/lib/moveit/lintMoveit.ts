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
 * forgiving than RViz or Gazebo: a <gazebo>/<plugin> block that doesn't resolve cleanly, or
 * any link with visual/collision geometry but no <inertial>, routinely crashes it outright
 * (rather than warning and continuing). These are the things worth fixing *before* opening
 * Setup Assistant, not after it crashes.
 */
export function checkSetupAssistantReadiness(xmlText: string, genericLintIssueIds: Set<string>): MoveitIssue[] {
  const issues: MoveitIssue[] = [];

  const gazeboTagCount = (xmlText.match(/<gazebo[\s>]/g) || []).length;
  if (gazeboTagCount > 0) {
    issues.push({
      id: 'gazebo-tags-present',
      severity: 'error',
      source: 'urdf',
      message: `Found ${gazeboTagCount} <gazebo> block(s) in this file. Setup Assistant expects a plain URDF — <gazebo>/<plugin> blocks (sensor plugins, ros2_control plugins, etc.) have been known to crash it outright, not just warn. Export a plain-robot-description copy (no simulation tags) before loading it into Setup Assistant. Check it first in the URDF Visualizer — /tools/urdf-visualizer.`,
    });
  } else {
    const pluginTagCount = (xmlText.match(/<plugin[\s>]/g) || []).length;
    if (pluginTagCount > 0) {
      issues.push({
        id: 'plugin-tags-present',
        severity: 'warning',
        source: 'urdf',
        message: `Found ${pluginTagCount} <plugin> block(s) outside a <gazebo> tag. Strip simulation-only tags before loading this into Setup Assistant — it parses the URDF itself and non-standard blocks are a common cause of crashes.`,
      });
    }
  }

  if (genericLintIssueIds.has('missing-inertial')) {
    issues.push({
      id: 'missing-inertial-blocks-setup-assistant',
      severity: 'error',
      source: 'urdf',
      message: `This URDF has links with geometry but no <inertial> tag (see the checks below). This is one of the most common Setup Assistant crash causes — add mass + inertia to every non-fixed link first. Visualize/check it in the URDF Visualizer — /tools/urdf-visualizer.`,
    });
  }

  if (genericLintIssueIds.has('xacro-detected')) {
    issues.push({
      id: 'xacro-blocks-setup-assistant',
      severity: 'error',
      source: 'urdf',
      message: `This looks like an unexpanded xacro file. Setup Assistant needs a plain URDF — run it through \`xacro\` first (see the note below), then load the generated .urdf.`,
    });
  }

  return issues;
}
