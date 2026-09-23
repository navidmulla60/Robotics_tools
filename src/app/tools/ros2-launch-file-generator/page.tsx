import type { Metadata } from "next";
import LaunchFileGeneratorApp from "@/components/launchgen/LaunchFileGeneratorApp";

export const metadata: Metadata = {
  title: "ROS2 Launch File Generator",
  description:
    "Generate a robot bringup launch file (robot_state_publisher, Gazebo + spawn with correct GZ_SIM_RESOURCE_PATH exports, RViz, joint state publishers) and a controller launch file (controller_manager, joint_state_broadcaster, and your ros2_control controllers, correctly sequenced). Free, runs entirely in your browser.",
};

export default function Ros2LaunchFileGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">ROS2 Launch File Generator</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Pick the nodes you need and generate a bringup launch file and a controller launch file as a starting point — including
          the Gazebo resource-path exports that avoid the classic &quot;mesh not found&quot; / nothing-loads errors, and
          correctly-sequenced controller spawners.
        </p>
      </div>
      <LaunchFileGeneratorApp />
    </div>
  );
}
