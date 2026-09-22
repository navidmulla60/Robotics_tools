import type { Metadata } from "next";
import CameraFovCalculatorApp from "@/components/camerafov/CameraFovCalculatorApp";

export const metadata: Metadata = {
  title: "Camera FOV Calculator",
  description:
    "Compute horizontal, vertical, and diagonal field of view from sensor size and focal length, plus imaged coverage at a working distance and ground sample distance. Free, runs entirely in your browser.",
};

export default function CameraFovCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Camera FOV Calculator</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Pick a sensor size (or enter your own), a focal length, and a working distance to get the field of view and the imaged
          coverage at that distance — useful for picking a lens/camera combo or planning where to mount one.
        </p>
      </div>
      <CameraFovCalculatorApp />
    </div>
  );
}
