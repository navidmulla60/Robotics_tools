import type { Metadata } from "next";

const TARGET = "/tools/camera-fov-calibration/fov-calculator";

export const metadata: Metadata = {
  title: "Redirecting…",
  robots: { index: false, follow: true },
};

export default function CameraFovCalculatorRedirectPage() {
  const target = `${process.env.PAGES_BASE_PATH ?? ""}${TARGET}`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This tool moved to <a href={target} className="font-medium text-blue-600 hover:underline dark:text-blue-400">{TARGET}</a>.
        </p>
      </div>
    </>
  );
}
