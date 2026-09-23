import type { Metadata } from "next";
import MoveitConfigHelperApp from "@/components/moveit/MoveitConfigHelperApp";

export const metadata: Metadata = {
  title: "MoveIt Configuration Helper",
  description:
    "Upload the moveit_config package MoveIt Setup Assistant generated and sanity-check it: catch URDF issues that crash Setup Assistant outright, cross-validate the SRDF's groups/chains/end effectors against the URDF, and check joint_limits.yaml and moveit_controllers.yaml for common mistakes. No package yet? Generate a starting SRDF and config files instead.",
};

export default function MoveitConfigHelperPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">MoveIt Configuration Helper</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Upload the moveit_config package folder MoveIt Setup Assistant generated for you (or a .zip of it) &mdash; this
          matches up the URDF, SRDF,{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">joint_limits.yaml</code>,
          and{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">moveit_controllers.yaml</code>{" "}
          automatically and checks them against each other: the things that crash Setup Assistant outright, every SRDF
          reference that doesn&apos;t actually match the URDF, missing acceleration limits, and more. Haven&apos;t run Setup
          Assistant yet? Upload just your URDF and generate a starting SRDF/config right here instead. Everything runs
          locally in your browser; nothing is uploaded to a server.
        </p>
      </div>
      <MoveitConfigHelperApp />
    </div>
  );
}
