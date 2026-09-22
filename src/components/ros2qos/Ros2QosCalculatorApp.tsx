'use client';

import { useMemo, useState } from 'react';
import type { QosProfile } from '@/lib/ros2qos/types';
import { DEFAULT_PROFILE, PRESETS } from '@/lib/ros2qos/presets';
import { checkCompatibility } from '@/lib/ros2qos/compatibility';
import QosProfileForm from './QosProfileForm';
import CompatibilityPanel from './CompatibilityPanel';

export default function Ros2QosCalculatorApp() {
  const [publisher, setPublisher] = useState<QosProfile>(DEFAULT_PROFILE);
  const [subscription, setSubscription] = useState<QosProfile>(PRESETS['Sensor Data']);

  const report = useMemo(() => checkCompatibility(publisher, subscription), [publisher, subscription]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QosProfileForm title="Publisher" profile={publisher} onChange={setPublisher} />
        <QosProfileForm title="Subscription" profile={subscription} onChange={setSubscription} />
      </div>

      <CompatibilityPanel report={report} />

      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">How QoS matching works</h2>
        <p className="mb-2">
          A subscription <em>requests</em> a QoS policy and a publisher <em>offers</em> one. They can connect only if the publisher&apos;s offer
          is at least as strict as what the subscription requires — e.g. a subscription requesting{' '}
          <span className="font-medium">Reliable</span> needs a <span className="font-medium">Reliable</span> publisher (a{' '}
          <span className="font-medium">Best Effort</span> publisher won&apos;t satisfy it), but a subscription requesting{' '}
          <span className="font-medium">Best Effort</span> is happy with either.
        </p>
        <p>
          <span className="font-medium">History</span> (Keep Last / Keep All) and <span className="font-medium">Lifespan</span> only affect local
          buffering and message expiry — they never block a connection, which is why they&apos;re not part of the compatibility check above.
        </p>
      </div>
    </div>
  );
}
