// Decorative dark "CRM ecosystem" backdrop for the login hero: an ambient
// aurora gradient, a faint node network, and a few floating data widgets.
// Pure markup + CSS (no JS); all motion is gated by prefers-reduced-motion.

function FloatWidget({ className, delay, children }: { className: string; delay: string; children: React.ReactNode }) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={`auth-float absolute w-max rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function AuthVisual() {
  const nodes = [
    { x: 90, y: 70 }, { x: 210, y: 40 }, { x: 330, y: 110 }, { x: 150, y: 180 },
    { x: 300, y: 230 }, { x: 60, y: 250 }, { x: 250, y: 320 }, { x: 380, y: 280 },
  ];
  const edges: [number, number][] = [[0, 1], [1, 2], [0, 3], [3, 4], [3, 5], [4, 6], [4, 7], [2, 7], [5, 6]];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_15%_-10%,#161d33_0%,#0c1120_46%,#090b15_100%)]" />

      {/* Aurora light blobs */}
      <div className="auth-drift absolute -left-24 -top-10 h-96 w-96 rounded-full bg-[rgba(79,140,255,0.30)] blur-[100px]" />
      <div className="auth-drift-slow absolute -right-10 top-28 h-[26rem] w-[26rem] rounded-full bg-[rgba(124,92,255,0.28)] blur-[110px]" />
      <div className="auth-drift absolute -bottom-16 left-1/3 h-80 w-80 rounded-full bg-[rgba(34,211,238,0.16)] blur-[100px]" style={{ animationDelay: "-6s" }} />

      {/* Fine dot grid, masked to fade at the edges */}
      <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_50%_40%,black_25%,transparent_72%)]" />

      {/* Node network */}
      <svg viewBox="0 0 440 380" className="absolute right-2 top-10 h-[62%] w-[80%] opacity-70" fill="none" aria-hidden>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {i % 3 === 0 && <circle cx={n.x} cy={n.y} r="9" className="auth-pulse" fill={i % 2 ? "rgba(124,92,255,0.35)" : "rgba(79,140,255,0.35)"} style={{ animationDelay: `${i * 0.4}s` }} />}
            <circle cx={n.x} cy={n.y} r="3.5" fill={i % 2 ? "#7C5CFF" : "#4F8CFF"} />
          </g>
        ))}
      </svg>

      {/* Floating data widgets */}
      <FloatWidget className="right-10 top-16" delay="0s">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-electric" /> Pipeline
        </p>
        <div className="flex items-end gap-1.5">
          {[38, 60, 44, 72, 30].map((h, i) => (
            <span key={i} className="w-2.5 rounded-sm" style={{ height: h, background: `linear-gradient(to top, #4F8CFF, #7C5CFF)`, opacity: 0.5 + i * 0.1 }} />
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-white">€128,400 <span className="font-normal text-slate-400">open</span></p>
      </FloatWidget>

      <FloatWidget className="right-24 top-56" delay="-2.5s">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Won this month
        </p>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">€42,900</span>
          <span className="rounded bg-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald">+18%</span>
        </div>
        <svg viewBox="0 0 120 34" className="mt-1.5 h-7 w-32" fill="none" aria-hidden>
          <path d="M2 30 L22 24 L40 27 L60 15 L80 18 L100 8 L118 4" stroke="#16C784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 30 L22 24 L40 27 L60 15 L80 18 L100 8 L118 4 L118 34 L2 34 Z" fill="url(#sg)" opacity="0.25" />
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16C784" /><stop offset="1" stopColor="#16C784" stopOpacity="0" /></linearGradient></defs>
        </svg>
      </FloatWidget>

      <FloatWidget className="left-8 bottom-16 hidden xl:block" delay="-4s">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-royal" /> Active clients
        </p>
        <div className="flex items-center">
          {[["JD", "#4F8CFF"], ["AK", "#7C5CFF"], ["MP", "#16C784"], ["TS", "#FFB84F"]].map(([t, c], i) => (
            <span key={i} className="grid h-7 w-7 -ml-1.5 first:ml-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[#0c1120]" style={{ background: c as string }}>{t}</span>
          ))}
          <span className="ml-2 text-xs font-semibold text-white">128</span>
        </div>
      </FloatWidget>
    </div>
  );
}
