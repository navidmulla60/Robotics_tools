import Link from "next/link";
import ToolCard from "@/components/site/ToolCard";

const TOOLS = [
  {
    title: "URDF Visualizer",
    description: "Drop in a URDF (+ meshes), see it rendered in 3D, inspect the TF tree, move joints, and catch setup issues before MoveIt does.",
    href: "/tools/urdf-visualizer",
    status: "live" as const,
  },
  {
    title: "Quaternion ↔ Euler Converter",
    description: "Live bidirectional conversion between quaternions and roll/pitch/yaw, using the ROS/URDF convention, with axis-angle, rotation matrix, and a 3D preview.",
    href: "/tools/quaternion-euler-converter",
    status: "live" as const,
  },
  {
    title: "ROS2 QoS Calculator",
    description: "Check whether a publisher and subscription QoS profile will actually connect — reliability, durability, deadline, and liveliness — using the same rules ROS2 itself does.",
    href: "/tools/ros2-qos-calculator",
    status: "live" as const,
  },
  {
    title: "DH Parameter Calculator",
    description: "Build a Denavit-Hartenberg parameter table and get forward kinematics — end-effector pose plus a live 3D chain preview.",
    href: "/tools/dh-parameter-calculator",
    status: "live" as const,
  },
  {
    title: "Camera FOV & Calibration",
    description: "Field of view / imaged coverage calculator, plus a print-accurate checkerboard/circle-grid calibration pattern generator and RGB-D alignment notes.",
    href: "/tools/camera-fov-calibration",
    status: "live" as const,
  },
  {
    title: "Coordinate Transform Calculator",
    description: "Build a tree of coordinate frames and look up the transform between any two of them, or transform a point between frames.",
    href: "/tools/coordinate-transform-calculator",
    status: "live" as const,
  },
  {
    title: "ROS2 Launch File Generator",
    description: "Generate a bringup launch file (Gazebo, RViz, robot_state_publisher) and a controller launch file with correctly exported Gazebo resource paths and sequenced controller spawners.",
    href: "/tools/ros2-launch-file-generator",
    status: "live" as const,
  },
  {
    title: "Nav2 Parameter Helper",
    description: "Upload a map, set your robot's footprint, and tune AMCL/costmap parameters with a live inflation-layer preview.",
    href: "/tools/nav2-parameter-helper",
    status: "live" as const,
  },
  { title: "MoveIt Configuration Helper", description: "Sanity-check a MoveIt config package before running Setup Assistant." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="mb-14 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl">
          Free tools for people building robots
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          No installs, no accounts. Utilities for ROS 2, URDF, kinematics, and more &mdash; runs entirely in your browser.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-500 dark:text-neutral-500">
          Every file you upload &mdash; maps, URDFs, meshes, param files &mdash; stays on your machine and is processed locally in
          your browser. Nothing is sent to a server; the server here only hosts this website.
        </p>
        <div className="mt-8">
          <Link
            href="/tools/urdf-visualizer"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try the URDF Visualizer
          </Link>
        </div>
      </section>

      <section id="tools">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">All tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
