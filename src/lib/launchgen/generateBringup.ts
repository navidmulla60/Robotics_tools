import type { BringupConfig, CustomNode } from './types';

function pyStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function indentBlock(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((l) => (l.length ? pad + l : l))
    .join('\n');
}

function customNodeBlock(node: CustomNode, varName: string): string {
  const paramLines = node.paramsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(':');
      if (idx === -1) return null;
      const key = l.slice(0, idx).trim();
      const rawValue = l.slice(idx + 1).trim();
      const value =
        /^-?\d+(\.\d+)?$/.test(rawValue) || rawValue === 'true' || rawValue === 'false'
          ? rawValue.replace('true', 'True').replace('false', 'False')
          : pyStr(rawValue);
      return `${pyStr(key)}: ${value}`;
    })
    .filter((l): l is string => l !== null);

  const args = node.argumentsText
    .split(/\s+/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => pyStr(a));

  const lines = [`${varName} = Node(`, `    package=${pyStr(node.package)},`, `    executable=${pyStr(node.executable)},`, `    name=${pyStr(node.name)},`, `    output='screen',`];
  if (paramLines.length) {
    lines.push(`    parameters=[{`);
    for (const p of paramLines) lines.push(`        ${p},`);
    lines.push(`    }],`);
  }
  if (args.length) lines.push(`    arguments=[${args.join(', ')}],`);
  lines.push(`)`);
  return lines.join('\n');
}

/**
 * Generates a robot bringup launch file: robot_state_publisher (always), optionally Gazebo +
 * spawn, RViz, joint_state_publisher(_gui), a static_transform_publisher, and any custom node
 * templates — following the pattern verified against gazebosim.org's own ros_gz_sim_demos
 * launch file and the official "migrating to gz sim" env-var guidance.
 */
export function generateBringupLaunch(config: BringupConfig): string {
  const declaredArgs: string[] = [`DeclareLaunchArgument('use_sim_time', default_value=${pyStr(config.useGazebo ? 'true' : 'false')}, description='Use simulation (Gazebo) clock')`];
  const setupLines: string[] = [];
  const nodeBlocks: string[] = [];
  const returnItems: string[] = [];

  setupLines.push(`pkg_share = FindPackageShare(${pyStr(config.packageName)})`);
  setupLines.push(`xacro_path = PathJoinSubstitution([pkg_share, ${pyStr(config.xacroPath)}])`);

  if (config.useGazebo) {
    setupLines.push(
      '',
      "# Gazebo needs to find this package's meshes/models via package:// URIs, or you'll get",
      '# "mesh not found" / nothing-loads errors. This adds the share directory\'s parent to',
      "# Gazebo's resource search path without clobbering anything you've already sourced.",
      'set_gz_resource_path = AppendEnvironmentVariable(',
      "    'GZ_SIM_RESOURCE_PATH',",
      '    PathJoinSubstitution([pkg_share, os.pardir]),',
      ')',
    );
    returnItems.push('set_gz_resource_path');
  }

  setupLines.push('', `robot_description = {'robot_description': Command(['xacro ', xacro_path])}`);

  nodeBlocks.push(
    ['robot_state_publisher_node = Node(', "    package='robot_state_publisher',", "    executable='robot_state_publisher',", "    output='screen',", "    parameters=[robot_description, {'use_sim_time': LaunchConfiguration('use_sim_time')}],", ')'].join('\n'),
  );
  returnItems.push('robot_state_publisher_node');

  if (config.useGazebo) {
    declaredArgs.push(
      `DeclareLaunchArgument('use_gazebo', default_value='true', description='Launch Gazebo and spawn the robot')`,
      `DeclareLaunchArgument('world', default_value=${pyStr(config.gazeboWorld)}, description='Gazebo world file (bundled with ros_gz_sim, or an absolute path)')`,
      `DeclareLaunchArgument('x', default_value=${pyStr(String(config.spawnPose.x))}, description='Spawn X position (m)')`,
      `DeclareLaunchArgument('y', default_value=${pyStr(String(config.spawnPose.y))}, description='Spawn Y position (m)')`,
      `DeclareLaunchArgument('z', default_value=${pyStr(String(config.spawnPose.z))}, description='Spawn Z position (m)')`,
      `DeclareLaunchArgument('yaw', default_value=${pyStr(String(config.spawnPose.yaw))}, description='Spawn yaw (rad)')`,
    );

    nodeBlocks.push(
      [
        'gazebo = IncludeLaunchDescription(',
        '    PythonLaunchDescriptionSource(',
        "        PathJoinSubstitution([FindPackageShare('ros_gz_sim'), 'launch', 'gz_sim.launch.py'])",
        '    ),',
        "    launch_arguments={'gz_args': ['-r ', LaunchConfiguration('world')]}.items(),",
        "    condition=IfCondition(LaunchConfiguration('use_gazebo')),",
        ')',
      ].join('\n'),
    );
    returnItems.push('gazebo');

    nodeBlocks.push(
      [
        'spawn_robot_node = Node(',
        "    package='ros_gz_sim',",
        "    executable='create',",
        "    output='screen',",
        '    parameters=[{',
        `        'name': ${pyStr(config.entityName)},`,
        "        'topic': '/robot_description',",
        "        'x': LaunchConfiguration('x'),",
        "        'y': LaunchConfiguration('y'),",
        "        'z': LaunchConfiguration('z'),",
        "        'Y': LaunchConfiguration('yaw'),",
        '    }],',
        "    condition=IfCondition(LaunchConfiguration('use_gazebo')),",
        ')',
      ].join('\n'),
    );
    returnItems.push('spawn_robot_node');
  }

  if (config.useRviz) {
    declaredArgs.push(`DeclareLaunchArgument('use_rviz', default_value='true', description='Launch RViz')`);
    setupLines.push('', `rviz_config_path = PathJoinSubstitution([pkg_share, ${pyStr(config.rvizConfigPath)}])`);
    nodeBlocks.push(
      ['rviz_node = Node(', "    package='rviz2',", "    executable='rviz2',", "    name='rviz2',", "    output='screen',", "    arguments=['-d', rviz_config_path],", "    condition=IfCondition(LaunchConfiguration('use_rviz')),", ')'].join('\n'),
    );
    returnItems.push('rviz_node');
  }

  if (config.useJointStatePublisher) {
    declaredArgs.push(
      `DeclareLaunchArgument('use_joint_state_publisher', default_value='false', description='Publish fake joint states — skip if ros2_control/joint_state_broadcaster already does')`,
    );
    nodeBlocks.push(
      ['joint_state_publisher_node = Node(', "    package='joint_state_publisher',", "    executable='joint_state_publisher',", "    condition=IfCondition(LaunchConfiguration('use_joint_state_publisher')),", ')'].join('\n'),
    );
    returnItems.push('joint_state_publisher_node');
  }

  if (config.useJointStatePublisherGui) {
    declaredArgs.push(
      `DeclareLaunchArgument('use_joint_state_publisher_gui', default_value='false', description='Same, with sliders — for viewing/testing joints with no real/simulated hardware')`,
    );
    nodeBlocks.push(
      ['joint_state_publisher_gui_node = Node(', "    package='joint_state_publisher_gui',", "    executable='joint_state_publisher_gui',", "    condition=IfCondition(LaunchConfiguration('use_joint_state_publisher_gui')),", ')'].join('\n'),
    );
    returnItems.push('joint_state_publisher_gui_node');
  }

  if (config.useStaticTransformPublisher) {
    const args = config.staticTfArgs
      .split(/\s+/)
      .map((a) => a.trim())
      .filter(Boolean)
      .map((a) => pyStr(a));
    nodeBlocks.push(['static_tf_node = Node(', "    package='tf2_ros',", "    executable='static_transform_publisher',", `    arguments=[${args.join(', ')}],`, ')'].join('\n'));
    returnItems.push('static_tf_node');
  }

  config.customNodes
    .filter((n) => n.enabled)
    .forEach((n, i) => {
      const varName = `custom_node_${i + 1}`;
      nodeBlocks.push(customNodeBlock(n, varName));
      returnItems.push(varName);
    });

  const usesIfCondition = config.useGazebo || config.useRviz || config.useJointStatePublisher || config.useJointStatePublisherGui;
  const imports = [
    ...(config.useGazebo ? ['import os', ''] : []),
    'from launch import LaunchDescription',
    `from launch.actions import DeclareLaunchArgument${config.useGazebo ? ', AppendEnvironmentVariable, IncludeLaunchDescription' : ''}`,
    ...(usesIfCondition ? ['from launch.conditions import IfCondition'] : []),
    ...(config.useGazebo ? ['from launch.launch_description_sources import PythonLaunchDescriptionSource'] : []),
    'from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution',
    'from launch_ros.actions import Node',
    'from launch_ros.substitutions import FindPackageShare',
  ];

  const returnListItems = [...declaredArgs, ...returnItems];
  const bodyLines = [
    'def generate_launch_description():',
    indentBlock(setupLines.join('\n'), 4),
    '',
    indentBlock(nodeBlocks.join('\n\n'), 4),
    '',
    indentBlock('return LaunchDescription([', 4),
    indentBlock(returnListItems.map((item) => `${item},`).join('\n'), 8),
    indentBlock('])', 4),
  ];

  const header = ['#!/usr/bin/env python3', `"""Bringup launch file for ${config.packageName}, generated by RoboticsTools.in's ROS2 Launch File Generator."""`, '', ...imports, '', ''].join('\n');

  return `${header}${bodyLines.join('\n')}\n`;
}
