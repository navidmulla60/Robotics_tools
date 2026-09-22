import type { QosProfile } from './types';

const base: Omit<QosProfile, 'reliability' | 'durability' | 'history' | 'depth'> = {
  deadlineMs: null,
  livelinessKind: 'automatic',
  livelinessLeaseMs: null,
  lifespanMs: null,
};

/**
 * Mirrors the named QoS profiles rclcpp/rmw ship out of the box (rmw/qos_profiles.h and
 * rclcpp/qos.hpp on the humble branch), so a profile picked here matches what
 * `rclcpp::SensorDataQoS()` etc. actually produce on the wire.
 */
export const PRESETS: Record<string, QosProfile> = {
  Default: { reliability: 'reliable', durability: 'volatile', history: 'keep_last', depth: 10, ...base },
  'Sensor Data': { reliability: 'best_effort', durability: 'volatile', history: 'keep_last', depth: 5, ...base },
  Parameters: { reliability: 'reliable', durability: 'volatile', history: 'keep_last', depth: 1000, ...base },
  Services: { reliability: 'reliable', durability: 'volatile', history: 'keep_last', depth: 10, ...base },
  'Parameter Events': { reliability: 'reliable', durability: 'volatile', history: 'keep_last', depth: 1000, ...base },
  Rosout: { reliability: 'reliable', durability: 'transient_local', history: 'keep_last', depth: 1000, ...base, lifespanMs: 10_000 },
  'System Default': {
    reliability: 'system_default',
    durability: 'system_default',
    history: 'system_default',
    depth: 0,
    ...base,
    livelinessKind: 'system_default',
  },
};

export const DEFAULT_PROFILE: QosProfile = PRESETS.Default;

function profilesEqual(a: QosProfile, b: QosProfile): boolean {
  return (
    a.reliability === b.reliability &&
    a.durability === b.durability &&
    a.history === b.history &&
    (a.history !== 'keep_last' || a.depth === b.depth) &&
    a.deadlineMs === b.deadlineMs &&
    a.livelinessKind === b.livelinessKind &&
    a.livelinessLeaseMs === b.livelinessLeaseMs &&
    a.lifespanMs === b.lifespanMs
  );
}

/** Returns the preset name matching this profile exactly, or 'Custom' if none does. */
export function matchingPresetName(profile: QosProfile): string {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (profilesEqual(profile, preset)) return name;
  }
  return 'Custom';
}
