export type JointType = 'revolute' | 'prismatic';

export interface DHRow {
  id: string;
  name: string;
  jointType: JointType;
  /** Link length, meters. */
  a: number;
  /** Link twist, degrees. */
  alphaDeg: number;
  /** Link offset, meters. Acts as the joint variable when jointType === 'prismatic'. */
  d: number;
  /** Joint angle, degrees. Acts as the joint variable when jointType === 'revolute'. */
  thetaDeg: number;
}

let counter = 0;
export function createRow(partial: Omit<DHRow, 'id'>): DHRow {
  counter += 1;
  return { ...partial, id: `dh-${Date.now()}-${counter}` };
}
