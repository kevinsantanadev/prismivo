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
      <span className="prism-aura" />
      <span className="prism-orbit prism-orbit-one"><i /></span>
      <span className="prism-orbit prism-orbit-two"><i /></span>

      <div className="kinetic-prism">
        <svg className="prism-svg" viewBox="0 0 480 560" focusable="false">
          <defs>
            <linearGradient id={`${id}-left`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#17233d" />
              <stop offset="0.48" stopColor="#0a1020" />
              <stop offset="1" stopColor="#1c1235" />
            </linearGradient>
            <linearGradient id={`${id}-right`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#20335b" />
              <stop offset="0.42" stopColor="#10162b" />
              <stop offset="1" stopColor="#090d18" />
            </linearGradient>
            <linearGradient id={`${id}-center`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#8de8ff" stopOpacity="0.58" />
              <stop offset="0.36" stopColor="#617dff" stopOpacity="0.22" />
              <stop offset="0.74" stopColor="#9b6bff" stopOpacity="0.42" />
              <stop offset="1" stopColor="#ff62c7" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8eeaff" />
              <stop offset="0.46" stopColor="#6e85ff" />
              <stop offset="0.78" stopColor="#a66dff" />
              <stop offset="1" stopColor="#ff6ac8" />
            </linearGradient>
            <radialGradient id={`${id}-core`} cx="50%" cy="44%" r="56%">
              <stop offset="0" stopColor="#d8f8ff" stopOpacity="0.92" />
              <stop offset="0.28" stopColor="#738cff" stopOpacity="0.62" />
              <stop offset="0.7" stopColor="#8a5cff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#8a5cff" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          <ellipse className="prism-svg-halo" cx="244" cy="292" rx="132" ry="200" fill={`url(#${id}-core)`} filter={`url(#${id}-soft)`} />

          <g className="prism-crystal">
            <path className="prism-facet prism-facet-left" d="M240 38 74 191l54 257 112 76Z" fill={`url(#${id}-left)`} />
            <path className="prism-facet prism-facet-right" d="m240 38 168 153-56 257-112 76Z" fill={`url(#${id}-right)`} />
            <path className="prism-facet prism-facet-center" d="m240 38 61 164-61 322-62-322Z" fill={`url(#${id}-center)`} />
            <path className="prism-facet prism-facet-upper-left" d="m240 38-166 153 104 11Z" fill="#2a4774" fillOpacity="0.36" />
            <path className="prism-facet prism-facet-upper-right" d="m240 38 168 153-107 11Z" fill="#7897ff" fillOpacity="0.28" />
            <path className="prism-facet prism-facet-lower-left" d="m74 191 54 257 112 76-62-322Z" fill="#11172a" fillOpacity="0.82" />
            <path className="prism-facet prism-facet-lower-right" d="m408 191-56 257-112 76 61-322Z" fill="#19142d" fillOpacity="0.76" />

            <g className="prism-inner-light" filter={`url(#${id}-glow)`}>
              <path d="m240 55 15 145-15 270-14-270Z" fill={`url(#${id}-edge)`} fillOpacity="0.34" />
              <path d="M240 42v478" stroke={`url(#${id}-edge)`} strokeWidth="2.4" />
            </g>

            <path className="prism-edge prism-edge-left" d="M240 38 74 191l54 257 112 76" />
            <path className="prism-edge prism-edge-right" d="m240 38 168 153-56 257-112 76" />
            <path className="prism-edge prism-edge-cross" d="m74 191 104 11 62-164 61 164 107-11M178 202l-50 246m173-246 51 246" />
            <path className="prism-edge prism-edge-bright" d="M240 38 74 191m334 0-56 257-112 76" stroke={`url(#${id}-edge)`} filter={`url(#${id}-glow)`} />

            <g className="prism-detail-lines">
              <path d="m113 157 71 19M297 176l72-20M157 338l83 186M323 337l-83 187" />
              <path d="m94 282 97-19M289 264l96 18" />
            </g>
            <circle className="prism-flare prism-flare-blue" cx="78" cy="190" r="4" fill="#9beeff" filter={`url(#${id}-glow)`} />
            <circle className="prism-flare prism-flare-magenta" cx="352" cy="447" r="3" fill="#ff68cf" filter={`url(#${id}-glow)`} />
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
