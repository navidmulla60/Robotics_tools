export interface MapYaml {
  image: string;
  resolution: number;
  origin: [number, number, number];
  negate: 0 | 1;
  occupied_thresh: number;
  free_thresh: number;
  mode: 'trinary' | 'scale' | 'raw';
}

/** A parsed ROS occupancy grid: `data[y * width + x]` is -1 (unknown), 0 (free), or 1-100
 * (occupancy percent, 100 = fully occupied) — the nav_msgs/OccupancyGrid convention. Row 0 is
 * the BOTTOM row of the map (image is stored top-to-bottom, so it's flipped on load). */
export interface OccupancyGrid {
  width: number;
  height: number;
  resolution: number;
  origin: [number, number, number];
  data: Int16Array;
}

export type FootprintType = 'circular' | 'rectangular';

export interface RobotFootprint {
  type: FootprintType;
  /** Circular footprint radius, meters. */
  radiusM: number;
  /** Rectangular footprint, meters (full length/width, robot centered on its origin). */
  sideAM: number;
  sideBM: number;
}

/** The inscribed radius Nav2 derives from the footprint — the largest circle fully contained
 * within it — used by the inflation layer's cost formula. */
export function inscribedRadiusM(footprint: RobotFootprint): number {
  if (footprint.type === 'circular') return footprint.radiusM;
  return Math.min(footprint.sideAM, footprint.sideBM) / 2;
}

export interface AmclParams {
  alpha1: number;
  alpha2: number;
  alpha3: number;
  alpha4: number;
  alpha5: number;
  base_frame_id: string;
  beam_skip_distance: number;
  beam_skip_error_threshold: number;
  beam_skip_threshold: number;
  do_beamskip: boolean;
  global_frame_id: string;
  lambda_short: number;
  laser_likelihood_max_dist: number;
  laser_max_range: number;
  laser_min_range: number;
  laser_model_type: 'likelihood_field' | 'beam' | 'likelihood_field_prob';
  max_beams: number;
  max_particles: number;
  min_particles: number;
  odom_frame_id: string;
  pf_err: number;
  pf_z: number;
  recovery_alpha_fast: number;
  recovery_alpha_slow: number;
  resample_interval: number;
  robot_model_type: 'nav2_amcl::DifferentialMotionModel' | 'nav2_amcl::OmniMotionModel';
  save_pose_rate: number;
  sigma_hit: number;
  tf_broadcast: boolean;
  transform_tolerance: number;
  update_min_a: number;
  update_min_d: number;
  z_hit: number;
  z_max: number;
  z_rand: number;
  z_short: number;
  scan_topic: string;
  map_topic: string;
  set_initial_pose: boolean;
  initial_pose_x: number;
  initial_pose_y: number;
  initial_pose_z: number;
  initial_pose_yaw: number;
  first_map_only: boolean;
  always_reset_initial_pose: boolean;
}

/** Verified against nav2_amcl/src/amcl_node.cpp's initParameters(). */
export const AMCL_DEFAULTS: AmclParams = {
  alpha1: 0.2,
  alpha2: 0.2,
  alpha3: 0.2,
  alpha4: 0.2,
  alpha5: 0.2,
  base_frame_id: 'base_footprint',
  beam_skip_distance: 0.5,
  beam_skip_error_threshold: 0.9,
  beam_skip_threshold: 0.3,
  do_beamskip: false,
  global_frame_id: 'map',
  lambda_short: 0.1,
  laser_likelihood_max_dist: 2.0,
  laser_max_range: 100.0,
  laser_min_range: -1.0,
  laser_model_type: 'likelihood_field',
  max_beams: 60,
  max_particles: 2000,
  min_particles: 500,
  odom_frame_id: 'odom',
  pf_err: 0.05,
  pf_z: 0.99,
  recovery_alpha_fast: 0.0,
  recovery_alpha_slow: 0.0,
  resample_interval: 1,
  robot_model_type: 'nav2_amcl::DifferentialMotionModel',
  save_pose_rate: 0.5,
  sigma_hit: 0.2,
  tf_broadcast: true,
  transform_tolerance: 1.0,
  update_min_a: 0.2,
  update_min_d: 0.25,
  z_hit: 0.5,
  z_max: 0.05,
  z_rand: 0.5,
  z_short: 0.05,
  scan_topic: 'scan',
  map_topic: 'map',
  set_initial_pose: false,
  initial_pose_x: 0.0,
  initial_pose_y: 0.0,
  initial_pose_z: 0.0,
  initial_pose_yaw: 0.0,
  first_map_only: false,
  always_reset_initial_pose: false,
};

export interface InflationLayerParams {
  enabled: boolean;
  inflation_radius: number;
  cost_scaling_factor: number;
  inflate_unknown: boolean;
  inflate_around_unknown: boolean;
}

/** Verified against nav2_costmap_2d/plugins/inflation_layer.cpp's onInitialize(). */
export const INFLATION_DEFAULTS: InflationLayerParams = {
  enabled: true,
  inflation_radius: 0.55,
  cost_scaling_factor: 10.0,
  inflate_unknown: false,
  inflate_around_unknown: false,
};

export interface ObstacleLayerParams {
  enabled: boolean;
  footprint_clearing_enabled: boolean;
  max_obstacle_height: number;
  min_obstacle_height: number;
  combination_method: 0 | 1;
  obstacle_max_range: number;
  obstacle_min_range: number;
  raytrace_max_range: number;
  raytrace_min_range: number;
}

/** Verified against nav2_costmap_2d/plugins/obstacle_layer.cpp's onInitialize() (top-level +
 * default single observation source). */
export const OBSTACLE_LAYER_DEFAULTS: ObstacleLayerParams = {
  enabled: true,
  footprint_clearing_enabled: true,
  max_obstacle_height: 2.0,
  min_obstacle_height: 0.0,
  combination_method: 1,
  obstacle_max_range: 2.5,
  obstacle_min_range: 0.0,
  raytrace_max_range: 3.0,
  raytrace_min_range: 0.0,
};

export interface CostmapCommonParams {
  resolution: number;
  update_frequency: number;
  publish_frequency: number;
  transform_tolerance: number;
  rolling_window: boolean;
  /** Local costmap only (global costmap sizes itself from the map). */
  width: number;
  height: number;
  track_unknown_space: boolean;
}

/** Verified against nav2_costmap_2d/src/costmap_2d_ros.cpp's getParameters(); width/height
 * here default to the "local costmap" defaults (rolling_window: true, 3x3m) since that's the
 * more commonly tuned of the two. */
export const LOCAL_COSTMAP_DEFAULTS: CostmapCommonParams = {
  resolution: 0.05,
  update_frequency: 5.0,
  publish_frequency: 2.0,
  transform_tolerance: 0.3,
  rolling_window: true,
  width: 3,
  height: 3,
  track_unknown_space: false,
};

export const GLOBAL_COSTMAP_DEFAULTS: CostmapCommonParams = {
  resolution: 0.05,
  update_frequency: 1.0,
  publish_frequency: 1.0,
  transform_tolerance: 0.3,
  rolling_window: false,
  width: 5,
  height: 5,
  track_unknown_space: false,
};
