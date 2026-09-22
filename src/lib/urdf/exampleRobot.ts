export const SAMPLE_URDF_NAME = 'sample_3dof_arm.urdf';

export const SAMPLE_URDF = `<?xml version="1.0"?>
<robot name="sample_3dof_arm">

  <link name="base_link">
    <visual>
      <geometry><cylinder radius="0.08" length="0.05"/></geometry>
      <material name="grey"><color rgba="0.6 0.6 0.6 1"/></material>
    </visual>
    <collision>
      <geometry><cylinder radius="0.08" length="0.05"/></geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.002" ixy="0" ixz="0" iyy="0.002" iyz="0" izz="0.003"/>
    </inertial>
  </link>

  <link name="shoulder_link">
    <visual>
      <origin xyz="0 0 0.15" rpy="0 0 0"/>
      <geometry><box size="0.06 0.06 0.3"/></geometry>
      <material name="blue"><color rgba="0.2 0.4 0.9 1"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0.15" rpy="0 0 0"/>
      <geometry><box size="0.06 0.06 0.3"/></geometry>
    </collision>
    <inertial>
      <mass value="0.6"/>
      <origin xyz="0 0 0.15" rpy="0 0 0"/>
      <inertia ixx="0.005" ixy="0" ixz="0" iyy="0.005" iyz="0" izz="0.001"/>
    </inertial>
  </link>

  <joint name="shoulder_joint" type="revolute">
    <parent link="base_link"/>
    <child link="shoulder_link"/>
    <origin xyz="0 0 0.025" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14159" upper="3.14159" effort="10" velocity="2.0"/>
  </joint>

  <link name="elbow_link">
    <visual>
      <origin xyz="0 0 0.12" rpy="0 0 0"/>
      <geometry><box size="0.05 0.05 0.24"/></geometry>
      <material name="orange"><color rgba="0.95 0.55 0.1 1"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0.12" rpy="0 0 0"/>
      <geometry><box size="0.05 0.05 0.24"/></geometry>
    </collision>
    <inertial>
      <mass value="0.4"/>
      <origin xyz="0 0 0.12" rpy="0 0 0"/>
      <inertia ixx="0.003" ixy="0" ixz="0" iyy="0.003" iyz="0" izz="0.0006"/>
    </inertial>
  </link>

  <joint name="elbow_joint" type="revolute">
    <parent link="shoulder_link"/>
    <child link="elbow_link"/>
    <origin xyz="0 0 0.3" rpy="0 1.0 0"/>
    <axis xyz="0 1 0"/>
    <limit lower="-2.5" upper="2.5" effort="8" velocity="2.0"/>
  </joint>

  <link name="wrist_link">
    <visual>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <geometry><cylinder radius="0.02" length="0.1"/></geometry>
      <material name="grey"/>
    </visual>
  </link>

  <joint name="wrist_joint" type="revolute">
    <parent link="elbow_link"/>
    <child link="wrist_link"/>
    <origin xyz="0 0 0.24" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14159" upper="3.14159" effort="4" velocity="3.0"/>
  </joint>

</robot>
`;
