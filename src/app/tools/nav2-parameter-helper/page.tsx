import type { Metadata } from "next";
import Nav2ParamHelperApp from "@/components/nav2/Nav2ParamHelperApp";

export const metadata: Metadata = {
  title: "Nav2 Parameter Helper",
  description:
    "Upload a SLAM map, set your robot's footprint, and tune AMCL and costmap parameters with live visual feedback — see the inflation layer's effect on the map as you adjust it. Free, runs entirely in your browser.",
};

export default function Nav2ParameterHelperPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Nav2 Parameter Helper</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Upload your map (<code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">.yaml</code> +{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">.pgm</code>/
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">.png</code>) or an existing param
          file, set your robot&apos;s footprint, and tune AMCL &amp; costmap parameters — the inflation layer&apos;s effect updates
          live on the map as you adjust it.
        </p>
      </div>
      <Nav2ParamHelperApp />
    </div>
  );
}
