import type { Metadata } from "next";
import Ros2QosCalculatorApp from "@/components/ros2qos/Ros2QosCalculatorApp";

export const metadata: Metadata = {
  title: "ROS2 QoS Calculator",
  description:
    "Check whether a ROS2 publisher and subscription QoS profile are compatible — reliability, durability, deadline, and liveliness — using the same rules as rmw_dds_common. Free, runs entirely in your browser.",
};

export default function Ros2QosCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">ROS2 QoS Calculator</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Set a publisher and subscription QoS profile and see whether they&apos;ll actually connect. The compatibility rules here mirror{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">rmw_dds_common::qos_profile_check_compatible</code>{' '}
          policy-for-policy, so the verdict matches what ROS2 itself would report.
        </p>
      </div>
      <Ros2QosCalculatorApp />
    </div>
  );
}
