type KineticPrismProps = {
  variant?: "hero" | "showcase";
};

/**
 * Prismivo's lightweight identity object.
 *
 * The faceted geometry is an inline SVG animated only through transforms and
 * opacity. It keeps the visual depth of a 3D object without adding a WebGL
 * runtime, a model download or client-side JavaScript to the critical path.
 */
export function KineticPrism({ variant = "showcase" }: KineticPrismProps) {
  const id = `prismivo-${variant}`;

  return (
    <div className={`kinetic-prism-scene kinetic-prism-${variant}`} aria-hidden="true">
      <span className="prism-vortex" />
      <span className="prism-aura" />
      <span className="prism-orbit prism-orbit-one"><i /></span>
      <span className="prism-orbit prism-orbit-two"><i /></span>

      <div className="kinetic-prism">
        <svg className="prism-svg" viewBox="0 0 480 560" focusable="false">
          <defs>
            <linearGradient id={`${id}-left`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#102b66" />
              <stop offset="0.42" stopColor="#07152f" />
              <stop offset="1" stopColor="#100b24" />
            </linearGradient>
            <linearGradient id={`${id}-right`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#35205f" />
              <stop offset="0.4" stopColor="#142967" />
              <stop offset="1" stopColor="#080d1b" />
            </linearGradient>
            <linearGradient id={`${id}-center`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#f7feff" stopOpacity="0.98" />
              <stop offset="0.22" stopColor="#8ceaff" stopOpacity="0.9" />
              <stop offset="0.62" stopColor="#6881ff" stopOpacity="0.58" />
              <stop offset="1" stopColor="#a958ff" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id={`${id}-waist`} x1="0" y1="0" x2="1" y2="0.8">
              <stop offset="0" stopColor="#061126" />
              <stop offset="0.5" stopColor="#132454" />
              <stop offset="1" stopColor="#2b1047" />
            </linearGradient>
            <linearGradient id={`${id}-lower-left`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0b1738" />
              <stop offset="0.56" stopColor="#050a16" />
              <stop offset="1" stopColor="#100923" />
            </linearGradient>
            <linearGradient id={`${id}-lower-right`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f1558" />
              <stop offset="0.44" stopColor="#162965" />
              <stop offset="1" stopColor="#070b18" />
            </linearGradient>
            <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4fdff" />
              <stop offset="0.2" stopColor="#79e5ff" />
              <stop offset="0.52" stopColor="#5878ff" />
              <stop offset="0.78" stopColor="#a354ff" />
              <stop offset="1" stopColor="#ff4fc5" />
            </linearGradient>
            <radialGradient id={`${id}-core`} cx="50%" cy="42%" r="54%">
              <stop offset="0" stopColor="#d8f8ff" stopOpacity="0.92" />
              <stop offset="0.25" stopColor="#527cff" stopOpacity="0.74" />
              <stop offset="0.62" stopColor="#7d45ff" stopOpacity="0.2" />
              <stop offset="1" stopColor="#7d45ff" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`${id}-hot-glow`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
          </defs>

          <ellipse className="prism-svg-halo" cx="240" cy="280" rx="112" ry="222" fill={`url(#${id}-core)`} filter={`url(#${id}-soft)`} />

          <g className="prism-star-field">
            <circle className="prism-star" cx="76" cy="116" r="1.5" />
            <circle className="prism-star" cx="402" cy="104" r="1" />
            <circle className="prism-star" cx="54" cy="284" r="1" />
            <circle className="prism-star" cx="424" cy="302" r="1.8" />
            <circle className="prism-star" cx="105" cy="418" r="1.3" />
            <circle className="prism-star" cx="386" cy="454" r="1" />
            <circle className="prism-star" cx="178" cy="78" r="0.9" />
            <circle className="prism-star" cx="322" cy="64" r="1.2" />
          </g>

          <g className="prism-crystal">
            <path className="prism-facet prism-facet-upper-left" d="M240 30 124 230l81-15Z" fill={`url(#${id}-left)`} />
            <path className="prism-facet prism-facet-center" d="M240 30 205 215l35-3Z" fill={`url(#${id}-center)`} />
            <path className="prism-facet prism-facet-upper-right" d="m240 30 116 200-80-15-36-3Z" fill={`url(#${id}-right)`} />
            <path className="prism-facet prism-facet-left" d="m124 230 81-15 35-3v50Z" fill={`url(#${id}-waist)`} />
            <path className="prism-facet prism-facet-right" d="m240 212 36 3 80 15-116 32Z" fill={`url(#${id}-waist)`} fillOpacity="0.88" />
            <path className="prism-facet prism-facet-lower-left" d="m124 230 116 32v268Z" fill={`url(#${id}-lower-left)`} />
            <path className="prism-facet prism-facet-lower-right" d="m356 230-116 32v268Z" fill={`url(#${id}-lower-right)`} />

            <g className="prism-inner-light" filter={`url(#${id}-glow)`}>
              <path d="m240 39 8 171-8 297-8-245Z" fill={`url(#${id}-edge)`} fillOpacity="0.3" />
              <path d="M240 35v491" stroke={`url(#${id}-edge)`} strokeWidth="2.2" />
            </g>

            <path className="prism-edge prism-edge-left" d="M240 30 124 230l116 300" />
            <path className="prism-edge prism-edge-right" d="m240 30 116 200-116 300" />
            <path className="prism-edge prism-edge-cross" d="m124 230 81-15 35-3 36 3 80 15-116 32Zm81-15L240 30m36 185L240 30M240 262v268" />
            <path className="prism-edge prism-edge-bright" d="M240 30 205 215 124 230m116-200 36 185 80 15-116 300" stroke={`url(#${id}-edge)`} filter={`url(#${id}-glow)`} />
            <path className="prism-energy-line" d="M240 34 208 213m32-179 33 178 77 17" stroke={`url(#${id}-edge)`} filter={`url(#${id}-hot-glow)`} />

            <g className="prism-detail-lines">
              <path d="m154 179 58 15m56 1 58-16M175 363l65 167m65-167-65 167" />
              <path d="m145 284 95-22m95 22-95-22" />
            </g>
            <circle className="prism-flare prism-flare-blue" cx="124" cy="230" r="4" fill="#a9f2ff" filter={`url(#${id}-glow)`} />
            <circle className="prism-flare prism-flare-magenta" cx="356" cy="230" r="4" fill="#ff4fc5" filter={`url(#${id}-glow)`} />
            <circle className="prism-flare prism-flare-tip" cx="240" cy="31" r="2.8" fill="#f5fdff" filter={`url(#${id}-glow)`} />
          </g>
        </svg>
      </div>

      <span className="prism-particle prism-particle-1" />
      <span className="prism-particle prism-particle-2" />
      <span className="prism-particle prism-particle-3" />
      <span className="prism-particle prism-particle-4" />
      <span className="prism-particle prism-particle-5" />
      <span className="prism-particle prism-particle-6" />
      <span className="prism-particle prism-particle-7" />
      <span className="prism-particle prism-particle-8" />
      <span className="prism-shadow" />
    </div>
  );
}
