import type { Metadata } from "next";
import Link from "next/link";
import CameraCalibrationApp from "@/components/calibration/CameraCalibrationApp";

export const metadata: Metadata = {
  title: "Camera Calibration Tool",
  description:
    "Generate a print-accurate checkerboard or circle-grid calibration pattern (SVG/PNG, sized in real mm for OpenCV/ROS camera_calibration), plus an explainer on why RGB and depth images from RGB-D cameras like RealSense don't line up and how to fix it. Free, runs entirely in your browser.",
};

export default function CameraCalibrationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/tools/camera-fov-calibration" className="text-xs font-medium text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400">
          &larr; Camera FOV &amp; Calibration
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Camera Calibration Tool</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Generate a checkerboard or circle-grid calibration pattern sized in real millimeters — download it as SVG or PNG and
          print at actual size for use with OpenCV&apos;s <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">findChessboardCorners</code>{' '}
          / ROS&apos;s <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">camera_calibration</code>.
        </p>
      </div>
      <CameraCalibrationApp />
    </div>
  );
}
