interface HouseSchematicProps {
  className?: string;
  groundArea?: string;
  firstFloorArea?: string;
  totalArea?: string;
  showFloorTable?: boolean;
}

export function HouseSchematic({
  className = '',
  groundArea = '900 sq ft',
  firstFloorArea = '900 sq ft',
  totalArea = '1,800 sq ft',
  showFloorTable = true,
}: HouseSchematicProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-ink-soft">
        <span>SCHEMATIC ONLY · NOT A FLOOR PLAN</span>
      </div>

      <div className="bg-paper-deep/50 rounded-lg p-4 border border-ink/14 flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 260 110"
          className="w-full max-w-[240px] h-auto stroke-forest fill-none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Schematic two-floor house elevation"
          role="img"
        >
          {/* Ground baseline */}
          <line x1="10" y1="100" x2="250" y2="100" stroke="#1F2421" strokeOpacity="0.3" strokeWidth="1" />

          {/* Main Building Outline */}
          <rect x="30" y="25" width="200" height="75" rx="1" fill="#F6F1E7" />

          {/* Roof Accent / Parapet line */}
          <rect x="25" y="20" width="210" height="5" rx="1" fill="#1F4D45" fillOpacity="0.1" />

          {/* Floor Divider */}
          <line x1="30" y1="62" x2="230" y2="62" stroke="#1F2421" strokeOpacity="0.2" strokeDasharray="3 2" />

          {/* Second Floor Windows */}
          <rect x="45" y="32" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="59" y1="32" x2="59" y2="52" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="45" y1="42" x2="73" y2="42" stroke="#1F4D45" strokeOpacity="0.4" />

          <rect x="88" y="32" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="102" y1="32" x2="102" y2="52" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="88" y1="42" x2="116" y2="42" stroke="#1F4D45" strokeOpacity="0.4" />

          <rect x="144" y="32" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="158" y1="32" x2="158" y2="52" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="144" y1="42" x2="172" y2="42" stroke="#1F4D45" strokeOpacity="0.4" />

          <rect x="187" y="32" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="201" y1="32" x2="201" y2="52" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="187" y1="42" x2="215" y2="42" stroke="#1F4D45" strokeOpacity="0.4" />

          {/* Ground Floor Windows and Door */}
          <rect x="45" y="70" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="59" y1="70" x2="59" y2="90" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="45" y1="80" x2="73" y2="80" stroke="#1F4D45" strokeOpacity="0.4" />

          {/* Ground Floor Entrance Door */}
          <rect x="100" y="65" width="25" height="35" rx="1" fill="#FFFFFF" />
          <circle cx="120" cy="83" r="1.5" fill="#1F4D45" />

          <rect x="150" y="70" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="164" y1="70" x2="164" y2="90" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="150" y1="80" x2="178" y2="80" stroke="#1F4D45" strokeOpacity="0.4" />

          <rect x="187" y="70" width="28" height="20" rx="1" fill="#FFFFFF" />
          <line x1="201" y1="70" x2="201" y2="90" stroke="#1F4D45" strokeOpacity="0.4" />
          <line x1="187" y1="80" x2="215" y2="80" stroke="#1F4D45" strokeOpacity="0.4" />
        </svg>
      </div>

      {showFloorTable && (
        <div className="space-y-1.5 pt-1 text-xs border-t border-ink/14 font-mono">
          <div className="flex justify-between text-ink-soft">
            <span className="font-sans">Ground floor</span>
            <span>{groundArea}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span className="font-sans">First floor</span>
            <span>{firstFloorArea}</span>
          </div>
          <div className="flex justify-between font-bold text-ink pt-1 border-t border-ink/10">
            <span className="font-sans">Total built-up</span>
            <span>{totalArea}</span>
          </div>
        </div>
      )}
    </div>
  );
}
