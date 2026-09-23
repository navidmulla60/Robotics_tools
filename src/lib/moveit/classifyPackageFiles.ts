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
  extraUrdfNames: string[];
  xacroOnlyNames: string[];
  unmatchedNames: string[];
}

const IGNORED_EXTENSIONS = ['.stl', '.dae', '.obj', '.png', '.jpg', '.jpeg', '.py', '.txt', '.xml', '.rviz', '.md', '.gitignore'];

/**
 * Classifies the files from a moveit_config package upload (folder, zip, or loose file
 * selection) by content, not just filename — Setup Assistant's config filenames vary
 * enough (moveit_controllers.yaml vs simple_moveit_controllers.yaml, etc.) that sniffing
 * each yaml's top-level key is more reliable than matching on name alone.
 */
export async function classifyPackageFiles(files: CollectedFile[]): Promise<ClassifiedPackage> {
  const result: ClassifiedPackage = {
    urdf: null,
    srdf: null,
    jointLimits: null,
    controllers: null,
    extraUrdfNames: [],
    xacroOnlyNames: [],
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
      result.xacroOnlyNames.push(f.name);
      continue;
    }

    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      const text = await f.file.text();
      if (/^\s*joint_limits:\s*$/m.test(text)) {
        if (!result.jointLimits) result.jointLimits = { name: f.name, text };
        else result.unmatchedNames.push(f.name);
      } else if (/^\s*controller_list:\s*$/m.test(text)) {
        if (!result.controllers) result.controllers = { name: f.name, text };
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
