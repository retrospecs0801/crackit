export function HeroBanner() {
  return (
    <section
      className="relative w-full pt-[80px] pb-[64px] flex flex-col items-center text-center overflow-hidden"
      style={{ backgroundColor: 'var(--hero-bg)', backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(92,122,90,0.06) 0%, transparent 70%)' }}
    >
      {/* Noise Texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <div className="relative z-10 px-4 flex flex-col items-center">
        <span className="font-sans font-medium text-[11px] uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--text-muted)' }}>
          Today&apos;s focus
        </span>

        <div className="relative mb-12">
          <span
            className="absolute -top-[40px] -left-[30px] font-serif text-[120px] leading-none select-none"
            style={{ color: '#D4CFC9' }}
          >
            &ldquo;
          </span>
          <h1 className="relative font-serif font-medium text-[28px] md:text-[40px] max-w-[600px] leading-[1.25] tracking-[-0.02em] text-text-primary">
            The secret of getting ahead is getting started.
          </h1>
        </div>

        {/* Minimalist Desk SVG */}
        <svg
          width="120"
          height="60"
          viewBox="0 0 120 60"
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Desk line */}
          <line x1="10" y1="50" x2="110" y2="50" />
          {/* Desk legs */}
          <line x1="20" y1="50" x2="20" y2="60" />
          <line x1="100" y1="50" x2="100" y2="60" />
          {/* Books */}
          <rect x="70" y="30" width="8" height="20" />
          <rect x="78" y="25" width="8" height="25" />
          <rect x="86" y="28" width="8" height="22" />
          {/* Laptop */}
          <rect x="25" y="40" width="30" height="10" />
          <path d="M40 40 L35 25 L45 25 Z" strokeLinejoin="round" />
          {/* Mug */}
          <rect x="60" y="40" width="6" height="10" />
          <path d="M66 42 Q69 42 69 45 Q69 48 66 48" />
        </svg>
      </div>
    </section>
  );
}
