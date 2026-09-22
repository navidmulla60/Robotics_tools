export type Rgba = [number, number, number, number];

function parseColor(materialEl: Element): Rgba | null {
  const colorEl = materialEl.querySelector(':scope > color');
  if (!colorEl) return null;
  const parts = (colorEl.getAttribute('rgba') || '').trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  return parts as Rgba;
}

/**
 * Maps mesh-file basename -> the color declared for it by the URDF's <visual><material>,
 * resolving named references against top-level <robot><material> definitions. Mesh files
 * (STL/DAE/OBJ) often carry their own baked-in materials from whatever CAD/export tool
 * produced them; when the URDF explicitly specifies a color we want that to win, matching
 * how RViz/Gazebo render the same file.
 */
export function buildVisualColorOverrides(xmlText: string): Map<string, Rgba> {
  const overrides = new Map<string, Rgba>();

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    return overrides;
  }
  if (doc.querySelector('parsererror')) return overrides;

  const robotEl = doc.querySelector('robot');
  if (!robotEl) return overrides;

  const globalMaterials = new Map<string, Rgba>();
  robotEl.querySelectorAll(':scope > material').forEach((m) => {
    const name = m.getAttribute('name');
    const color = parseColor(m);
    if (name && color) globalMaterials.set(name, color);
  });

  robotEl.querySelectorAll(':scope > link > visual').forEach((visual) => {
    const filename = visual.querySelector(':scope > geometry > mesh')?.getAttribute('filename');
    if (!filename) return;
    const basename = (filename.split('?')[0].split('#')[0].split('/').pop() || filename).toLowerCase();

    const materialEl = visual.querySelector(':scope > material');
    if (!materialEl) return;

    const inline = parseColor(materialEl);
    if (inline) {
      overrides.set(basename, inline);
      return;
    }

    const refName = materialEl.getAttribute('name');
    const resolved = refName ? globalMaterials.get(refName) : undefined;
    if (resolved) overrides.set(basename, resolved);
  });

  return overrides;
}
