import { createRow, type DHRow } from './types';

/**
 * Example DH chains for quickly trying out the calculator. These are illustrative textbook-
 * style manipulators (not the exact published parameters of any specific commercial robot).
 */
export const PRESETS: Record<string, () => DHRow[]> = {
  'Planar 2R arm': () => [
    createRow({ name: 'Link 1', jointType: 'revolute', a: 1, alphaDeg: 0, d: 0, thetaDeg: 0 }),
    createRow({ name: 'Link 2', jointType: 'revolute', a: 1, alphaDeg: 0, d: 0, thetaDeg: 0 }),
  ],
  '3-DOF articulated arm (example)': () => [
    createRow({ name: 'Waist', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0.4, thetaDeg: 0 }),
    createRow({ name: 'Shoulder', jointType: 'revolute', a: 0.6, alphaDeg: 0, d: 0, thetaDeg: 0 }),
    createRow({ name: 'Elbow', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0, thetaDeg: 0 }),
  ],
  '6-DOF elbow manipulator (example)': () => [
    createRow({ name: 'Joint 1', jointType: 'revolute', a: 0, alphaDeg: -90, d: 0.4, thetaDeg: 0 }),
    createRow({ name: 'Joint 2', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0, thetaDeg: -90 }),
    createRow({ name: 'Joint 3', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0, thetaDeg: 0 }),
    createRow({ name: 'Joint 4', jointType: 'revolute', a: 0, alphaDeg: -90, d: 0.5, thetaDeg: 0 }),
    createRow({ name: 'Joint 5', jointType: 'revolute', a: 0, alphaDeg: 90, d: 0, thetaDeg: 0 }),
    createRow({ name: 'Joint 6', jointType: 'revolute', a: 0, alphaDeg: 0, d: 0.1, thetaDeg: 0 }),
  ],
  'SCARA arm (example)': () => [
    createRow({ name: 'Joint 1', jointType: 'revolute', a: 0.5, alphaDeg: 0, d: 0.3, thetaDeg: 0 }),
    createRow({ name: 'Joint 2', jointType: 'revolute', a: 0.4, alphaDeg: 180, d: 0, thetaDeg: 0 }),
    createRow({ name: 'Joint 3 (Z slide)', jointType: 'prismatic', a: 0, alphaDeg: 0, d: 0, thetaDeg: 0 }),
  ],
};

export const DEFAULT_PRESET = 'Planar 2R arm';
