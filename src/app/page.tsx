import Link from "next/link";
import ToolCard from "@/components/site/ToolCard";

const TOOLS = [
  {
    title: "URDF Visualizer",
    description: "Drop in a URDF (+ meshes), see it rendered in 3D, inspect the TF tree, move joints, and catch setup issues before MoveIt does.",
    href: "/tools/urdf-visualizer",
    status: "live" as const,
  },
  { title: "Quaternion ↔ Euler Converter", description: "Convert between quaternions, Euler angles, and rotation matrices." },
  { title: "ROS2 QoS Calculator", description: "Understand and configure QoS profile compatibility between publishers and subscribers." },
  { title: "DH Parameter Calculator", description: "Compute Denavit-Hartenberg parameters and forward kinematics for a manipulator." },
  { title: "Camera FOV Calculator", description: "Work out field of view, focal length, and sensor coverage for a camera setup." },
  { title: "Coordinate Transform Calculator", description: "Chain and visualize coordinate frame transforms." },
  { title: "ROS2 Launch File Generator", description: "Generate boilerplate Python launch files from a simple form." },
  { title: "Nav2 Parameter Helper", description: "Tune and validate Nav2 costmap and planner parameters." },
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
