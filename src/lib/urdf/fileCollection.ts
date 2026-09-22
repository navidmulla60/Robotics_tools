import type { CollectedFile } from './types';

const URDF_EXTENSIONS = ['.urdf', '.xacro'];
const MESH_EXTENSIONS = ['.stl', '.dae', '.obj'];

export function fileList(files: FileList | File[]): CollectedFile[] {
  return Array.from(files).map((file) => ({
    file,
    name: file.name,
    relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }));
}

/** Recursively walks a dropped folder/file DataTransferItemList, preserving relative paths. */
export async function collectFromDataTransferItems(items: DataTransferItemList): Promise<CollectedFile[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  if (entries.length === 0) return [];

  const out: CollectedFile[] = [];

  async function walk(entry: FileSystemEntry, path: string): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
      out.push({ file, name: file.name, relativePath: path + file.name });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const children: FileSystemEntry[] = await new Promise((resolve, reject) => {
        const all: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries((batch) => {
            if (batch.length === 0) {
              resolve(all);
            } else {
              all.push(...batch);
              readBatch();
            }
          }, reject);
        };
        readBatch();
      });
      for (const child of children) {
        await walk(child, path + entry.name + '/');
      }
    }
  }

  for (const entry of entries) {
    await walk(entry, '');
  }

  return out;
}

function isZip(f: CollectedFile): boolean {
  return f.name.toLowerCase().endsWith('.zip');
}

/** Expands any .zip files found in the collection into their contained files. */
export async function expandZips(files: CollectedFile[]): Promise<CollectedFile[]> {
  const zipFiles = files.filter(isZip);
  if (zipFiles.length === 0) return files;

  const JSZip = (await import('jszip')).default;
  const out: CollectedFile[] = files.filter((f) => !isZip(f));

  for (const zipFile of zipFiles) {
    const zip = await JSZip.loadAsync(zipFile.file);
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const blob = await entry.async('blob');
      const name = path.split('/').pop() || path;
      const file = new File([blob], name);
      out.push({ file, name, relativePath: path });
    }
  }

  return out;
}

export interface ResourceContext {
  urdfCandidates: CollectedFile[];
  meshMap: Map<string, string>;
  otherFiles: CollectedFile[];
  meshFileNames: string[];
}

/** Builds mesh basename -> blob URL map and finds candidate URDF/xacro files among the uploads. */
export function buildResourceContext(files: CollectedFile[]): ResourceContext {
  const urdfCandidates = files.filter((f) => URDF_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));
  const meshFiles = files.filter((f) => MESH_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));
  const meshMap = new Map<string, string>();
  for (const f of meshFiles) {
    meshMap.set(f.name.toLowerCase(), URL.createObjectURL(f.file));
  }
  return {
    urdfCandidates,
    meshMap,
    otherFiles: files.filter((f) => !urdfCandidates.includes(f) && !meshFiles.includes(f)),
    meshFileNames: meshFiles.map((f) => f.name),
  };
}

export function revokeResourceContext(ctx: ResourceContext) {
  ctx.meshMap.forEach((url) => URL.revokeObjectURL(url));
}
