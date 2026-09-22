import RgbdParallaxDiagram from './RgbdParallaxDiagram';

export default function RgbdAlignmentInfo() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        Why don&apos;t my RGB and depth images line up? (RealSense and other RGB-D cameras)
      </h2>

      <div className="mb-4 h-56 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
        <RgbdParallaxDiagram />
      </div>

      <div className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
        <p>
          On a RealSense (and most RGB-D cameras), depth comes from a separate stereo IR pair, while color comes from its own
          imager processed through an ISP — two physically distinct sensors mounted a few centimeters apart on the same rigid
          board, each with its own resolution, field of view, and principal point. Pixel (u, v) in the depth image and pixel
          (u, v) in the color image are <em>not</em> the same physical ray. If you compute a centroid in each stream
          independently and compare their pixel coordinates directly, you&apos;ll see an offset that roughly tracks that
          baseline — which is almost certainly what you&apos;re running into.
        </p>
        <p>
          The fix is to request depth <span className="font-medium">aligned to the color frame</span>, not raw depth. The SDK
          (via <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">rs2::align</code>) does
          this per pixel: it deprojects each depth pixel to a 3D point using the depth intrinsics, transforms that point into the
          color camera&apos;s coordinate frame using the factory-calibrated extrinsics (translation + rotation between the two
          imagers), then reprojects it into the color image using the color intrinsics. The result is a depth image that shares
          the color image&apos;s resolution and is pixel-registered with it.
        </p>
        <p>
          In ROS 2, the easiest way to get this is the launch argument you already found:
        </p>
        <pre className="overflow-x-auto rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
          ros2 launch realsense2_camera rs_launch.py align_depth.enable:=true
        </pre>
        <p>
          which publishes the reprojected depth on an <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aligned_depth_to_color/image_raw</code>{' '}
          topic — sample <em>that</em> topic at the same (u, v) as your color-space centroid, rather than computing a centroid in
          raw depth space and comparing pixel coordinates across the two streams.
        </p>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          Even after aligning, expect residual &quot;fringing&quot; right at object edges — a single reprojected depth sample
          can&apos;t fully resolve what the color camera sees just behind a foreground boundary (occlusion/parallax), so
          alignment is most accurate over continuous surfaces and least accurate exactly at depth discontinuities. If your
          measurement point sits on an edge, a millimeter-scale residual offset there is expected, not a bug.
        </p>
        <p className="text-xs text-neutral-500">
          This isn&apos;t RealSense-specific — the same separate-imager-plus-extrinsics setup (and the same fix) applies to any
          stereo-depth-plus-color rig: ZED, OAK-D, Kinect, Orbbec, etc.
        </p>
      </div>
    </div>
  );
}
