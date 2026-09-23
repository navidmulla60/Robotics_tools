import type { ControllerConfig } from './types';

function pyStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toIdentifier(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1');
  return cleaned || fallback;
}

function indentBlock(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((l) => (l.length ? pad + l : l))
    .join('\n');
}

/**
 * Generates a controller launch file: joint_state_broadcaster plus one spawner per configured
 * ros2_control controller, chained via RegisterEventHandler(OnProcessExit(...)) so each
 * spawner only starts once the previous one has finished — spawning them all at once races
 * against controller_manager and fails intermittently (a well-known ros2_control gotcha).
 * Optionally includes an explicit ros2_control_node — only when NOT using a Gazebo plugin
 * (gz_ros2_control / gazebo_ros2_control) that already starts its own controller_manager,
 * since launching a second one conflicts with it.
 */
export function generateControllerLaunch(config: ControllerConfig): string {
  const setupLines: string[] = [];
  const nodeBlocks: string[] = [];
  const returnItems: string[] = [];

  if (config.standaloneControllerManager) {
    setupLines.push(
      `pkg_share = FindPackageShare(${pyStr(config.packageName)})`,
      `xacro_path = PathJoinSubstitution([pkg_share, ${pyStr(config.xacroPath)}])`,
      `controller_params_path = PathJoinSubstitution([pkg_share, ${pyStr(config.controllerParamsPath)}])`,
      '',
      `robot_description = {'robot_description': Command(['xacro ', xacro_path])}`,
    );
    nodeBlocks.push(
      [
        '# Only needed on real hardware, or when nothing else starts a controller_manager for',
        "# you. If you're using Gazebo's gz_ros2_control / gazebo_ros2_control plugin, IT",
        '# already starts one inside the simulator — launching another here will conflict',
        '# with it; leave this node out in that case.',
        'controller_manager_node = Node(',
        "    package='controller_manager',",
        "    executable='ros2_control_node',",
        '    parameters=[robot_description, controller_params_path],',
        "    output='screen',",
        ')',
      ].join('\n'),
    );
    returnItems.push('controller_manager_node');
  } else {
    setupLines.push(
      '',
      "# No ros2_control_node here on purpose: Gazebo's gz_ros2_control / gazebo_ros2_control",
      '# plugin already starts a controller_manager inside the simulator. These spawners just',
      '# connect to it.',
    );
  }

  nodeBlocks.push(
    ['joint_state_broadcaster_spawner = Node(', "    package='controller_manager',", "    executable='spawner',", "    arguments=['joint_state_broadcaster'],", "    output='screen',", ')'].join('\n'),
  );
  returnItems.push('joint_state_broadcaster_spawner');

  const controllers = config.controllerNames.map((name, i) => ({ name, varBase: toIdentifier(name, `controller_${i + 1}`) }));

  if (controllers.length === 0) {
    nodeBlocks.push(
      [
        '# <<< Add your controller names in the tool above, or fill these in by hand — one',
        '# spawner per ros2_control controller you configured in your controllers.yaml. >>>',
        'example_controller_spawner = Node(',
        "    package='controller_manager',",
        "    executable='spawner',",
        "    arguments=['your_controller_name_here'],",
        "    output='screen',",
        ')',
        '',
        'delayed_example_controller_spawner = RegisterEventHandler(',
        '    event_handler=OnProcessExit(',
        '        target_action=joint_state_broadcaster_spawner,',
        '        on_exit=[example_controller_spawner],',
        '    )',
        ')',
      ].join('\n'),
    );
    returnItems.push('delayed_example_controller_spawner');
  } else {
    let previousSpawnerVar = 'joint_state_broadcaster_spawner';
    controllers.forEach(({ name, varBase }) => {
      const spawnerVar = `${varBase}_spawner`;
      const delayedVar = `delayed_${spawnerVar}`;
      nodeBlocks.push(
        [`${spawnerVar} = Node(`, "    package='controller_manager',", "    executable='spawner',", `    arguments=[${pyStr(name)}],`, "    output='screen',", ')'].join('\n'),
      );
      nodeBlocks.push(
        [`${delayedVar} = RegisterEventHandler(`, '    event_handler=OnProcessExit(', `        target_action=${previousSpawnerVar},`, `        on_exit=[${spawnerVar}],`, '    )', ')'].join('\n'),
      );
      returnItems.push(delayedVar);
      previousSpawnerVar = spawnerVar;
    });
  }

  const imports = [
    'from launch import LaunchDescription',
    'from launch.actions import RegisterEventHandler',
    'from launch.event_handlers import OnProcessExit',
    ...(config.standaloneControllerManager ? ['from launch.substitutions import Command, PathJoinSubstitution'] : []),
    'from launch_ros.actions import Node',
    ...(config.standaloneControllerManager ? ['from launch_ros.substitutions import FindPackageShare'] : []),
  ];

  const bodyLines = [
    'def generate_launch_description():',
    indentBlock(setupLines.join('\n'), 4),
    '',
    indentBlock(nodeBlocks.join('\n\n'), 4),
    '',
    indentBlock('return LaunchDescription([', 4),
    indentBlock(returnItems.map((item) => `${item},`).join('\n'), 8),
    indentBlock('])', 4),
  ];

  const header = ['#!/usr/bin/env python3', `"""Controller launch file for ${config.packageName}, generated by RoboticsTools.in's ROS2 Launch File Generator."""`, '', ...imports, '', ''].join('\n');

  return `${header}${bodyLines.join('\n')}\n`;
}
