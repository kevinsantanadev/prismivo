/**
 * Lightweight CSS 3D mark for Prismivo.
 *
 * The geometry is decorative, GPU-friendly and intentionally independent of
 * WebGL so the hero remains smooth on modest phones. Motion is disabled by the
 * global reduced-motion rule when the visitor requests it at operating-system
 * level.
 */
export function KineticPrism() {
  return (
    <div className="kinetic-prism-scene" aria-hidden="true">
      <span className="prism-orbit prism-orbit-one" />
      <span className="prism-orbit prism-orbit-two" />
      <div className="kinetic-prism">
        <span className="prism-face prism-face-front" />
        <span className="prism-face prism-face-right" />
        <span className="prism-face prism-face-left" />
        <span className="prism-cap prism-cap-top" />
        <span className="prism-cap prism-cap-bottom" />
        <span className="prism-core" />
      </div>
      <span className="prism-shadow" />
    </div>
  );
}
