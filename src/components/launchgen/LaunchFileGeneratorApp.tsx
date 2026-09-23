'use client';

import { useMemo, useState } from 'react';
import BringupConfigPanel from './BringupConfigPanel';
import ControllerConfigPanel from './ControllerConfigPanel';
import CodePreviewPanel from './CodePreviewPanel';
import { generateBringupLaunch } from '@/lib/launchgen/generateBringup';
import { generateControllerLaunch } from '@/lib/launchgen/generateController';
import { DEFAULT_BRINGUP_CONFIG, DEFAULT_CONTROLLER_CONFIG } from '@/lib/launchgen/types';

export default function LaunchFileGeneratorApp() {
  const [bringup, setBringup] = useState(DEFAULT_BRINGUP_CONFIG);
  const [controller, setController] = useState(DEFAULT_CONTROLLER_CONFIG);

  const bringupCode = useMemo(() => generateBringupLaunch(bringup), [bringup]);
  const controllerCode = useMemo(() => generateControllerLaunch(controller), [controller]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="min-w-0 space-y-4">
        <BringupConfigPanel config={bringup} onChange={setBringup} />
        <ControllerConfigPanel config={controller} onChange={setController} />

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <p className="font-medium">Before you run these:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>
              Make sure your <span className="font-mono">CMakeLists.txt</span> actually installs the{' '}
              <span className="font-mono">urdf/</span>, <span className="font-mono">rviz/</span>, and{' '}
              <span className="font-mono">config/</span> directories (
              <span className="font-mono">install(DIRECTORY urdf rviz config DESTINATION share/${'{'}PROJECT_NAME{'}'})</span>) — a
              very common reason these paths &quot;don&apos;t exist&quot; is that they were never copied into the install space.
            </li>
            <li>
              Don&apos;t run <span className="font-mono">joint_state_publisher</span> and a real/simulated{' '}
              <span className="font-mono">joint_state_broadcaster</span> at the same time — they&apos;ll both try to publish{' '}
              <span className="font-mono">/joint_states</span>.
            </li>
            <li>
              These two files cover bringup + controllers only — planner/controller-server, nav2, and MoveIt config aren&apos;t
              generated here.
            </li>
          </ul>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <CodePreviewPanel bringupCode={bringupCode} controllerCode={controllerCode} />
      </div>
    </div>
  );
}
