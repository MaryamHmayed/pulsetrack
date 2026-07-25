type PulseTrackLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function PulseTrackMark({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
    >
      <path
        d="M54 34a22 22 0 1 1-6.2-17.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.5"
      />
      <path
        d="M10.5 34h12l3.5-6 6 14 7-21 6 13h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <circle cx="51" cy="12" fill="currentColor" r="2.2" />
      <circle cx="56" cy="18" fill="currentColor" r="1.8" />
      <circle cx="58" cy="25" fill="currentColor" r="1.5" />
    </svg>
  );
}

export function PulseTrackLogo({
  compact = false,
  inverse = false,
  className = "",
}: PulseTrackLogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${inverse ? "text-white" : "text-[#083b5c]"} ${className}`}
    >
      <PulseTrackMark className={compact ? "h-9 w-9" : "h-12 w-12"} />
      <span className="leading-none">
        <span
          className={`block font-bold tracking-[-0.04em] ${compact ? "text-xl" : "text-3xl"}`}
        >
          Pulse<span className="text-[#10a0aa]">Track</span>
        </span>
        {!compact ? (
          <span
            data-logo-subtitle
            className={`mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.2em] ${inverse ? "text-cyan-100/75" : "text-[#168d99]"}`}
          >
            Remote patient monitoring
          </span>
        ) : null}
      </span>
    </span>
  );
}
