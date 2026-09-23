import type { CollectedFile } from '@/lib/urdf/types';

export interface ClassifiedFile {
  name: string;
  text: string;
}

export interface ClassifiedPackage {
  urdf: ClassifiedFile | null;
  srdf: ClassifiedFile | null;
  jointLimits: ClassifiedFile | null;
  controllers: ClassifiedFile | null;
  kinematics: ClassifiedFile | null;
  initialPositions: ClassifiedFile | null;
  ros2Controllers: ClassifiedFile | null;
  cartesianLimits: ClassifiedFile | null;
  extraUrdfNames: string[];
  xacroNames: string[];
  unmatchedNames: string[];
}

const IGNORED_EXTENSIONS = ['.stl', '.dae', '.obj', '.png', '.jpg', '.jpeg', '.py', '.txt', '.xml', '.rviz', '.md', '.gitignore'];

type YamlSlotKey = 'jointLimits' | 'controllers' | 'kinematics' | 'initialPositions' | 'ros2Controllers' | 'cartesianLimits';

/**
 * Sniffed against real Setup-Assistant-generated files (moveit/moveit_resources, ros2
 * branch, panda_moveit_config/config/*): moveit_controllers.yaml's top-level key is
 * "moveit_controller_manager:", not "controller_list:" (that was the ROS1/MoveIt1 shape —
 * an earlier version of this classifier looked for the wrong one, which is why it never
 * matched a real MoveIt2 moveit_controllers.yaml). kinematics.yaml has no fixed wrapper key
 * (its top level is just group names), so it's matched on the "kinematics_solver:" leaf
 * that's always present instead.
 */
function sniffYamlSlot(text: string): YamlSlotKey | null {
  if (/^\s*joint_limits:\s*$/m.test(text)) return 'jointLimits';
  if (/^\s*moveit_controller_manager:\s*/m.test(text)) return 'controllers';
  if (/^\s*controller_manager:\s*$/m.test(text)) return 'ros2Controllers';
  if (/^\s*initial_positions:\s*$/m.test(text)) return 'initialPositions';
  if (/^\s*cartesian_limits:\s*$/m.test(text)) return 'cartesianLimits';
  if (/kinematics_solver:/.test(text)) return 'kinematics';
  return null;
}

/**
 * Classifies the files from a moveit_config package upload (folder, zip, or loose file
 * selection) by content, not just filename — real config filenames vary enough
 * (moveit_controllers.yaml vs simple_moveit_controllers.yaml, ros2_controllers.yaml vs
 * ros2_controllers.humble.yaml, etc.) that sniffing each yaml's shape is more reliable than
 * matching on name alone.
 *
 * Deliberately does NOT require or search hard for a plain .urdf: a real Setup-Assistant
 * package's config folder normally only has a "<name>.urdf.xacro" that just
 * <xacro:include>s the actual description from a separate *_description package (verified
 * against panda_moveit_config/config/panda.urdf.xacro) — there is usually no .urdf file to
 * find in the package at all, so treating one as required/missing would be wrong for the
 * overwhelmingly common case.
 */
export async function classifyPackageFiles(files: CollectedFile[]): Promise<ClassifiedPackage> {
  const result: ClassifiedPackage = {
    urdf: null,
    srdf: null,
    jointLimits: null,
    controllers: null,
    kinematics: null,
    initialPositions: null,
    ros2Controllers: null,
    cartesianLimits: null,
    extraUrdfNames: [],
    xacroNames: [],
    unmatchedNames: [],
  };

  for (const f of files) {
    const lower = f.name.toLowerCase();

    if (lower.endsWith('.srdf')) {
      const text = await f.file.text();
      if (!result.srdf) result.srdf = { name: f.name, text };
      else result.unmatchedNames.push(f.name);
      continue;
    }

    if (lower.endsWith('.urdf')) {
      const text = await f.file.text();
      if (!result.urdf) result.urdf = { name: f.name, text };
      else result.extraUrdfNames.push(f.name);
      continue;
    }

    if (lower.endsWith('.xacro')) {
      result.xacroNames.push(f.name);
      continue;
    }

    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      const text = await f.file.text();
      const slot = sniffYamlSlot(text);
      if (slot) {
        if (!result[slot]) result[slot] = { name: f.name, text };
        else result.unmatchedNames.push(f.name);
      } else {
        result.unmatchedNames.push(f.name);
      }
      continue;
    }

    if (IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext))) continue;
    result.unmatchedNames.push(f.name);
  }

  return result;
}
