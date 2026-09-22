import type { Metadata } from "next";
import QuaternionEulerApp from "@/components/quaternion/QuaternionEulerApp";

export const metadata: Metadata = {
  title: "Quaternion ↔ Euler Converter",
  description:
    "Free online quaternion to Euler angle converter using the ROS/URDF convention (geometry_msgs/Quaternion, <origin rpy=\"\"/>). Live bidirectional conversion with axis-angle, rotation matrix, and a 3D orientation preview.",
};

export default function QuaternionEulerConverterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Quaternion ↔ Euler Converter</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Edit either representation and the other updates live. Uses the same roll-pitch-yaw convention as ROS/URDF (fixed-axis
          X-Y-Z), so values copy straight into <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">geometry_msgs/Quaternion</code>{' '}
          or a URDF <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">&lt;origin rpy=&quot;&quot;/&gt;</code>. Runs entirely in
          your browser.
        </p>
      </div>
      <QuaternionEulerApp />
    </div>
  );
}
