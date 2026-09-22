import type { Metadata } from "next";
import CoordinateTransformCalculatorApp from "@/components/tf/CoordinateTransformCalculatorApp";

export const metadata: Metadata = {
  title: "Coordinate Transform Calculator",
  description:
    "Build a tree of coordinate frames and look up the transform between any two of them, or transform a point from one frame to another — matches ROS 2's tf2 lookupTransform semantics. Free, runs entirely in your browser.",
};

export default function CoordinateTransformCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Coordinate Transform Calculator</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Define a tree of coordinate frames (each relative to a parent, like a URDF or a set of{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">static_transform_publisher</code>{' '}
          nodes), then look up the transform between any two frames or transform a point between them — with a live 3D tree preview.
        </p>
      </div>
      <CoordinateTransformCalculatorApp />
    </div>
  );
}
