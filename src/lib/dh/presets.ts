import type { DHRow } from './types';

/**
 * Example DH chains for quickly trying out the calculator. These are illustrative textbook-
 * style manipulators (not the exact published parameters of any specific commercial robot).
 *
 * Row ids are static string literals, not generated at call time (e.g. from `Date.now()`).
 * These presets seed a `useState` initializer, which runs during SSR *and* again during
 * client hydration — a non-deterministic id would differ between the two passes, causing a
 * hydration mismatch.
 */
export const PRESETS: Record<string, () => DHRow[]> = {
  'Planar 2R arm': () => [
    { id: 'planar2r-1', name: 'Link 1', jointType: 'revolute', a: 1, alphaDeg: 0, d: 0, thetaDeg: 0 },
    { id: 'planar2r-2', name: 'Link 2', jointType: 'revolute', a: 1, alphaDeg: 0, d: 0, thetaDeg: 0 },
  ],
  '3-DOF articulated arm (example)': () => [
    { id: 'articulated3-1', name: 'Waist', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0.4, thetaDeg: 0 },
    { id: 'articulated3-2', name: 'Shoulder', jointType: 'revolute', a: 0.6, alphaDeg: 0, d: 0, thetaDeg: 0 },
    { id: 'articulated3-3', name: 'Elbow', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0, thetaDeg: 0 },
  ],
  '6-DOF elbow manipulator (example)': () => [
    { id: 'elbow6-1', name: 'Joint 1', jointType: 'revolute', a: 0, alphaDeg: -90, d: 0.4, thetaDeg: 0 },
    { id: 'elbow6-2', name: 'Joint 2', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0, thetaDeg: -90 },
    { id: 'elbow6-3', name: 'Joint 3', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0, thetaDeg: 0 },
    { id: 'elbow6-4', name: 'Joint 4', jointType: 'revolute', a: 0, alphaDeg: -90, d: 0.5, thetaDeg: 0 },
    { id: 'elbow6-5', name: 'Joint 5', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0, thetaDeg: 0 },
    { id: 'elbow6-6', name: 'Joint 6', jointType: 'revolute', a: 0, alphaDeg: 0, d: 0.1, thetaDeg: 0 },
  ],
  'SCARA arm (example)': () => [
    { id: 'scara-1', name: 'Joint 1', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0.3, thetaDeg: 0 },
    { id: 'scara-2', name: 'Joint 2', jointType: 'revolute', a: 0.4, alphaDeg: 180, d: 0, thetaDeg: 0 },
    { id: 'scara-3', name: 'Joint 3 (Z slide)', jointType: 'prismatic', a: 0, alphaDeg: 0, d: 0, thetaDeg: 0 },
  ],
};

export const DEFAULT_PRESET = 'Planar 2R arm';
