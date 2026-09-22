import type { AmclParams, CostmapCommonParams, InflationLayerParams, ObstacleLayerParams, RobotFootprint } from './types';

export interface Nav2ExportInputs {
  amcl: AmclParams;
  footprint: RobotFootprint;
  inflation: InflationLayerParams;
  obstacle: ObstacleLayerParams;
  local: CostmapCommonParams;
  global: CostmapCommonParams;
}

function yamlScalar(v: string | number | boolean): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return `"${v}"`;
}

function footprintLines(footprint: RobotFootprint): string {
  if (footprint.type === 'circular') return `      robot_radius: ${footprint.radiusM}`;
  const hw = footprint.sideAM / 2;
  const hh = footprint.sideBM / 2;
  const pts = `[[${hw},${hh}],[${-hw},${hh}],[${-hw},${-hh}],[${hw},${-hh}]]`;
  return `      footprint: "${pts}"`;
}

function costmapBlock(
  nodeName: 'local_costmap' | 'global_costmap',
  common: CostmapCommonParams,
  footprint: RobotFootprint,
  inflation: InflationLayerParams,
  obstacle: ObstacleLayerParams,
  plugins: string[],
): string {
  const lines: string[] = [];
  lines.push(`${nodeName}:`);
  lines.push(`  ${nodeName}:`);
  lines.push(`    ros__parameters:`);
  lines.push(`      update_frequency: ${common.update_frequency}`);
  lines.push(`      publish_frequency: ${common.publish_frequency}`);
  lines.push(`      global_frame: ${nodeName === 'local_costmap' ? 'odom' : 'map'}`);
  lines.push(`      robot_base_frame: base_link`);
  lines.push(`      transform_tolerance: ${common.transform_tolerance}`);
  lines.push(`      rolling_window: ${yamlScalar(common.rolling_window)}`);
  if (common.rolling_window) {
    lines.push(`      width: ${common.width}`);
    lines.push(`      height: ${common.height}`);
  }
  lines.push(`      resolution: ${common.resolution}`);
  lines.push(footprintLines(footprint));
  lines.push(`      track_unknown_space: ${yamlScalar(common.track_unknown_space)}`);
  lines.push(`      plugins: [${plugins.map((p) => `"${p}"`).join(', ')}]`);
  if (plugins.includes('static_layer')) {
    lines.push(`      static_layer:`);
    lines.push(`        plugin: "nav2_costmap_2d::StaticLayer"`);
    lines.push(`        map_subscribe_transient_local: true`);
  }
  if (plugins.includes('obstacle_layer')) {
    lines.push(`      obstacle_layer:`);
    lines.push(`        plugin: "nav2_costmap_2d::ObstacleLayer"`);
    lines.push(`        enabled: ${yamlScalar(obstacle.enabled)}`);
    lines.push(`        footprint_clearing_enabled: ${yamlScalar(obstacle.footprint_clearing_enabled)}`);
    lines.push(`        max_obstacle_height: ${obstacle.max_obstacle_height}`);
    lines.push(`        min_obstacle_height: ${obstacle.min_obstacle_height}`);
    lines.push(`        combination_method: ${obstacle.combination_method}`);
    lines.push(`        observation_sources: scan`);
    lines.push(`        scan:`);
    lines.push(`          topic: /scan`);
    lines.push(`          max_obstacle_height: ${obstacle.max_obstacle_height}`);
    lines.push(`          obstacle_max_range: ${obstacle.obstacle_max_range}`);
    lines.push(`          obstacle_min_range: ${obstacle.obstacle_min_range}`);
    lines.push(`          raytrace_max_range: ${obstacle.raytrace_max_range}`);
    lines.push(`          raytrace_min_range: ${obstacle.raytrace_min_range}`);
    lines.push(`          clearing: true`);
    lines.push(`          marking: true`);
    lines.push(`          data_type: "LaserScan"`);
  }
  lines.push(`      inflation_layer:`);
  lines.push(`        plugin: "nav2_costmap_2d::InflationLayer"`);
  lines.push(`        enabled: ${yamlScalar(inflation.enabled)}`);
  lines.push(`        inflation_radius: ${inflation.inflation_radius}`);
  lines.push(`        cost_scaling_factor: ${inflation.cost_scaling_factor}`);
  lines.push(`        inflate_unknown: ${yamlScalar(inflation.inflate_unknown)}`);
  lines.push(`        inflate_around_unknown: ${yamlScalar(inflation.inflate_around_unknown)}`);
  lines.push(`      always_send_full_costmap: true`);
  return lines.join('\n');
}

/** Generates a nav2_params.yaml-shaped snippet (amcl, local_costmap, global_costmap) matching
 * the structure of nav2_bringup's sample params file, e.g. costmap nodes are double-nested
 * under their own name before ros__parameters. */
export function generateNav2ParamsYaml(inputs: Nav2ExportInputs): string {
  const { amcl } = inputs;
  const amclLines: string[] = ['amcl:', '  ros__parameters:'];
  const push = (k: string, v: string | number | boolean) => amclLines.push(`    ${k}: ${yamlScalar(v)}`);
  push('alpha1', amcl.alpha1);
  push('alpha2', amcl.alpha2);
  push('alpha3', amcl.alpha3);
  push('alpha4', amcl.alpha4);
  push('alpha5', amcl.alpha5);
  push('base_frame_id', amcl.base_frame_id);
  push('beam_skip_distance', amcl.beam_skip_distance);
  push('beam_skip_error_threshold', amcl.beam_skip_error_threshold);
  push('beam_skip_threshold', amcl.beam_skip_threshold);
  push('do_beamskip', amcl.do_beamskip);
  push('global_frame_id', amcl.global_frame_id);
  push('lambda_short', amcl.lambda_short);
  push('laser_likelihood_max_dist', amcl.laser_likelihood_max_dist);
  push('laser_max_range', amcl.laser_max_range);
  push('laser_min_range', amcl.laser_min_range);
  push('laser_model_type', amcl.laser_model_type);
  push('max_beams', amcl.max_beams);
  push('max_particles', amcl.max_particles);
  push('min_particles', amcl.min_particles);
  push('odom_frame_id', amcl.odom_frame_id);
  push('pf_err', amcl.pf_err);
  push('pf_z', amcl.pf_z);
  push('recovery_alpha_fast', amcl.recovery_alpha_fast);
  push('recovery_alpha_slow', amcl.recovery_alpha_slow);
  push('resample_interval', amcl.resample_interval);
  push('robot_model_type', amcl.robot_model_type);
  push('save_pose_rate', amcl.save_pose_rate);
  push('sigma_hit', amcl.sigma_hit);
  push('tf_broadcast', amcl.tf_broadcast);
  push('transform_tolerance', amcl.transform_tolerance);
  push('update_min_a', amcl.update_min_a);
  push('update_min_d', amcl.update_min_d);
  push('z_hit', amcl.z_hit);
  push('z_max', amcl.z_max);
  push('z_rand', amcl.z_rand);
  push('z_short', amcl.z_short);
  push('scan_topic', amcl.scan_topic);
  push('map_topic', amcl.map_topic);
  push('set_initial_pose', amcl.set_initial_pose);
  if (amcl.set_initial_pose) {
    amclLines.push('    initial_pose:');
    amclLines.push(`      x: ${amcl.initial_pose_x}`);
    amclLines.push(`      y: ${amcl.initial_pose_y}`);
    amclLines.push(`      z: ${amcl.initial_pose_z}`);
    amclLines.push(`      yaw: ${amcl.initial_pose_yaw}`);
  }
  push('first_map_only', amcl.first_map_only);
  push('always_reset_initial_pose', amcl.always_reset_initial_pose);

  const local = costmapBlock('local_costmap', inputs.local, inputs.footprint, inputs.inflation, inputs.obstacle, ['obstacle_layer', 'inflation_layer']);
  const global = costmapBlock('global_costmap', inputs.global, inputs.footprint, inputs.inflation, inputs.obstacle, ['static_layer', 'obstacle_layer', 'inflation_layer']);

  return `${amclLines.join('\n')}\n\n${local}\n\n${global}\n`;
}

export interface ParsedNav2Params {
  amcl: Partial<AmclParams>;
  inflation: Partial<InflationLayerParams>;
  obstacle: Partial<ObstacleLayerParams>;
  local: Partial<CostmapCommonParams>;
  global: Partial<CostmapCommonParams>;
  footprint: Partial<RobotFootprint> | null;
}

function coerceScalar(raw: string): string | number | boolean {
  const v = raw.trim().replace(/#.*$/, '').trim();
  if (v === 'true' || v === 'True') return true;
  if (v === 'false' || v === 'False') return false;
  if (/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(v)) return parseFloat(v);
  return v.replace(/^["']|["']$/g, '');
}

/**
 * A targeted parser for nav2_params.yaml's known shape (see generateNav2ParamsYaml) — tracks
 * section/plugin context from indentation and known header lines, rather than implementing a
 * general YAML engine.
 */
export function parseNav2ParamsYaml(text: string): ParsedNav2Params {
  const result: ParsedNav2Params = { amcl: {}, inflation: {}, obstacle: {}, local: {}, global: {}, footprint: null };

  type Section = 'none' | 'amcl' | 'local' | 'global';
  let section: Section = 'none';
  let inRosParams = false;
  let plugin: 'none' | 'inflation_layer' | 'obstacle_layer' | 'scan' = 'none';

  const amclNumeric = new Set(['alpha1', 'alpha2', 'alpha3', 'alpha4', 'alpha5', 'beam_skip_distance', 'beam_skip_error_threshold', 'beam_skip_threshold', 'lambda_short', 'laser_likelihood_max_dist', 'laser_max_range', 'laser_min_range', 'max_beams', 'max_particles', 'min_particles', 'pf_err', 'pf_z', 'recovery_alpha_fast', 'recovery_alpha_slow', 'resample_interval', 'save_pose_rate', 'sigma_hit', 'transform_tolerance', 'update_min_a', 'update_min_d', 'z_hit', 'z_max', 'z_rand', 'z_short']);

  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    const trimmed = rawLine.trim();

    if (/^amcl:\s*$/.test(trimmed) && indent === 0) {
      section = 'amcl';
      inRosParams = false;
      plugin = 'none';
      continue;
    }
    if (/^local_costmap:\s*$/.test(trimmed) && indent === 0) {
      section = 'local';
      inRosParams = false;
      plugin = 'none';
      continue;
    }
    if (/^global_costmap:\s*$/.test(trimmed) && indent === 0) {
      section = 'global';
      inRosParams = false;
      plugin = 'none';
      continue;
    }
    if (/^ros__parameters:\s*$/.test(trimmed)) {
      inRosParams = true;
      continue;
    }
    if (section === 'none' || !inRosParams) continue;

    if (/^inflation_layer:\s*$/.test(trimmed)) {
      plugin = 'inflation_layer';
      continue;
    }
    if (/^obstacle_layer:\s*$/.test(trimmed)) {
      plugin = 'obstacle_layer';
      continue;
    }
    if (/^scan:\s*$/.test(trimmed)) {
      plugin = 'scan';
      continue;
    }
    if (/^(static_layer|filters|keepout_filter|speed_filter):\s*$/.test(trimmed)) {
      plugin = 'none'; // unhandled sub-block; ignore its keys without crashing the parser
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const valueRaw = trimmed.slice(colonIdx + 1).trim();
    if (!valueRaw) continue; // a nested-object header we don't specifically handle
    const value = coerceScalar(valueRaw);

    if (section === 'amcl') {
      if (key === 'x' || key === 'y' || key === 'z' || key === 'yaw') {
        const field = `initial_pose_${key}` as keyof AmclParams;
        (result.amcl as Record<string, unknown>)[field] = value;
      } else if (typeof value === 'number' && amclNumeric.has(key)) {
        (result.amcl as Record<string, unknown>)[key] = value;
      } else {
        (result.amcl as Record<string, unknown>)[key] = value;
      }
      continue;
    }

    const commonTarget = section === 'local' ? result.local : result.global;
    if (plugin === 'inflation_layer') {
      if (key in { enabled: 1, inflation_radius: 1, cost_scaling_factor: 1, inflate_unknown: 1, inflate_around_unknown: 1 }) {
        (result.inflation as Record<string, unknown>)[key] = value;
      }
      continue;
    }
    if (plugin === 'obstacle_layer' || plugin === 'scan') {
      if (key in { enabled: 1, footprint_clearing_enabled: 1, max_obstacle_height: 1, min_obstacle_height: 1, combination_method: 1, obstacle_max_range: 1, obstacle_min_range: 1, raytrace_max_range: 1, raytrace_min_range: 1 }) {
        (result.obstacle as Record<string, unknown>)[key] = value;
      }
      continue;
    }
    if (key === 'robot_radius' && typeof value === 'number') {
      result.footprint = { type: 'circular', radiusM: value };
      continue;
    }
    if (key === 'footprint' && typeof value === 'string') {
      const nums = Array.from(value.matchAll(/-?\d+(\.\d+)?/g)).map((m) => parseFloat(m[0]));
      if (nums.length >= 4) {
        const width = Math.abs(nums[0]) * 2;
        const height = Math.abs(nums[1]) * 2;
        result.footprint = { type: 'rectangular', sideAM: width, sideBM: height };
      }
      continue;
    }
    if (key in { update_frequency: 1, publish_frequency: 1, transform_tolerance: 1, rolling_window: 1, width: 1, height: 1, resolution: 1, track_unknown_space: 1 }) {
      (commonTarget as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
