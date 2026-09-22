let registerPromise: Promise<void> | null = null;

/** Lazily registers the <urdf-viewer> custom element. Client-only (touches HTMLElement/document). */
export function ensureUrdfViewerRegistered(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (customElements.get('urdf-viewer')) return Promise.resolve();

  if (!registerPromise) {
    registerPromise = import('urdf-loader/src/urdf-viewer-element.js').then((mod) => {
      if (!customElements.get('urdf-viewer')) {
        customElements.define('urdf-viewer', mod.default);
      }
    });
  }
  return registerPromise;
}
