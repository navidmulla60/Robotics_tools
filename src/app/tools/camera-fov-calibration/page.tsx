import type { Metadata } from "next";
import ToolCard from "@/components/site/ToolCard";

export const metadata: Metadata = {
  title: "Camera FOV & Calibration",
  description:
    "Two camera tools in one place: a field-of-view / coverage calculator, and a printable checkerboard/circle-grid calibration pattern generator with RGB-D alignment notes. Free, runs entirely in your browser.",
};

const CHILD_TOOLS = [
  {
    title: "FOV Calculator",
    description: "Compute horizontal/vertical/diagonal field of view and imaged coverage at a working distance from sensor size and focal length.",
    href: "/tools/camera-fov-calibration/fov-calculator",
    status: "live" as const,
  },
  {
    title: "Calibration Patterns",
    description: "Generate a print-accurate checkerboard or circle-grid calibration pattern, plus why RGB and depth images from RGB-D cameras don't line up.",
    href: "/tools/camera-fov-calibration/calibration-patterns",
    status: "live" as const,
  },
];

export default function CameraFovCalibrationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Camera FOV &amp; Calibration</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Two camera tools: work out field of view and imaged coverage for a lens/sensor combo, or generate a print-accurate
          calibration pattern for OpenCV/ROS camera calibration.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHILD_TOOLS.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  );
}
