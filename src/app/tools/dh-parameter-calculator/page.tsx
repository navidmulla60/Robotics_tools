import type { Metadata } from "next";
import DhParameterCalculatorApp from "@/components/dh/DhParameterCalculatorApp";

export const metadata: Metadata = {
  title: "DH Parameter Calculator",
  description:
    "Build a Denavit-Hartenberg parameter table for a robot arm and see the forward kinematics — end-effector position, orientation, and a live 3D chain preview. Free, runs entirely in your browser.",
};

export default function DhParameterCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">DH Parameter Calculator</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Enter a standard Denavit-Hartenberg parameter table for your manipulator and get the forward kinematics — end-effector
          position, quaternion, and roll/pitch/yaw — with a live 3D preview of the joint chain. Drag the joint sliders to move it.
        </p>
      </div>
      <DhParameterCalculatorApp />
    </div>
  );
}
