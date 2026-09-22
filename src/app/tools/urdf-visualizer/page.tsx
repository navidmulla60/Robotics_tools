import type { Metadata } from "next";
import UrdfVisualizerApp from "@/components/urdf/UrdfVisualizerApp";

export const metadata: Metadata = {
  title: "URDF Visualizer",
  description:
    "Free online URDF visualizer: render your robot in 3D, inspect the TF tree, drive joints with sliders, and get suggestions for missing inertia or collision geometry before you run MoveIt Setup Assistant.",
};

export default function UrdfVisualizerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">URDF Visualizer</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Upload a URDF (with its mesh files, or as a .zip), see it rendered in 3D, expand the TF tree, drive every joint
          with a slider, and get flagged on common issues &mdash; like links missing an{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">&lt;inertial&gt;</code>{" "}
          tag, which will break MoveIt Setup Assistant. Everything runs locally in your browser; nothing is uploaded to a server.
        </p>
      </div>
      <UrdfVisualizerApp />
    </div>
  );
}
