export interface CustomNode {
  id: string;
  /** e.g. "my_robot_nav" */
  package: string;
  /** e.g. "my_node" */
  executable: string;
  /** ROS node name override — optional */
  name: string;
  /** One "key: value" per line, dropped into the Node's parameters dict as-is. */
  paramsText: string;
  /** Extra CLI arguments, space-separated. */
  argumentsText: string;
  enabled: boolean;
}

export function createCustomNode(n: number): CustomNode {
  return {
    id: `node-${Date.now()}-${n}`,
    package: 'my_package',
    executable: 'my_node',
    name: `my_node_${n}`,
    paramsText: '',
    argumentsText: '',
    enabled: true,
  };
}

export interface SpawnPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface BringupConfig {
  packageName: string;
  /** Path to the xacro/URDF file, relative to the package share root, e.g. "urdf/robot.xacro". */
  xacroPath: string;
  entityName: string;

  useGazebo: boolean;
  gazeboWorld: string;
  spawnPose: SpawnPose;

  useRviz: boolean;
  rvizConfigPath: string;

  useJointStatePublisher: boolean;
  useJointStatePublisherGui: boolean;

  useStaticTransformPublisher: boolean;
  staticTfArgs: string;

  customNodes: CustomNode[];
}

export const DEFAULT_BRINGUP_CONFIG: BringupConfig = {
  packageName: 'my_robot_description',
  xacroPath: 'urdf/robot.xacro',
  entityName: 'my_robot',

  useGazebo: true,
  gazeboWorld: 'empty.sdf',
  spawnPose: { x: 0, y: 0, z: 0.1, yaw: 0 },

  useRviz: true,
  rvizConfigPath: 'rviz/config.rviz',

  useJointStatePublisher: false,
  useJointStatePublisherGui: false,

  useStaticTransformPublisher: false,
  staticTfArgs: '--x 0 --y 0 --z 0 --yaw 0 --pitch 0 --roll 0 --frame-id base_link --child-frame-id sensor_link',

  customNodes: [],
};

export interface ControllerConfig {
  /** true = you're launching on real hardware (or otherwise need your own controller_manager);
   * false = a Gazebo plugin (gz_ros2_control / gazebo_ros2_control) already starts one, and
   * launching another here would conflict with it. */
  standaloneControllerManager: boolean;
  packageName: string;
  xacroPath: string;
  controllerParamsPath: string;
  /** Names of ros2_control controllers to spawn, in addition to joint_state_broadcaster. */
  controllerNames: string[];
}

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  standaloneControllerManager: false,
  packageName: 'my_robot_description',
  xacroPath: 'urdf/robot.xacro',
  controllerParamsPath: 'config/controllers.yaml',
  controllerNames: [],
};

export interface NodePreset {
  key: string;
  title: string;
  description: string;
}

export const NODE_PRESETS: NodePreset[] = [
  { key: 'robot_state_publisher', title: 'robot_state_publisher', description: 'Publishes TF + /robot_description from your xacro/URDF. Always included.' },
  { key: 'gazebo', title: 'Gazebo (gz sim) + spawn', description: 'Launches the simulator and spawns your robot from /robot_description.' },
  { key: 'rviz', title: 'RViz2', description: 'Visualization, with a use_rviz launch argument to toggle it off.' },
  { key: 'joint_state_publisher', title: 'joint_state_publisher', description: 'Publishes fake joint states — for viewing a robot with no real/simulated hardware.' },
  { key: 'joint_state_publisher_gui', title: 'joint_state_publisher_gui', description: 'Same, with slider sliders. Don’t use this alongside ros2_control controllers.' },
  { key: 'static_transform_publisher', title: 'static_transform_publisher', description: 'A fixed TF, e.g. between a sensor frame and base_link.' },
];
