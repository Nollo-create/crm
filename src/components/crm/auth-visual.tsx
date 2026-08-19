import { CheckCircle2, Circle } from "lucide-react";

// Decorative dark "CRM ecosystem" backdrop for the login hero: an ambient
// aurora gradient, a faint node network, and floating data widgets. Pure markup
// + CSS. The ambient loops run always; only the entrance respects reduced-motion.
// Widgets live in the top band + right column so they never cover the headline
// (lower-left) or the footer (bottom-left).

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

function Label({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {children}
    </p>
  );
}

export function AuthVisual() {
  const nodes = [
    { x: 90, y: 70 }, { x: 210, y: 40 }, { x: 330, y: 110 }, { x: 150, y: 180 },
    { x: 300, y: 230 }, { x: 60, y: 250 }, { x: 250, y: 320 }, { x: 380, y: 280 },
    { x: 420, y: 160 }, { x: 190, y: 300 },
  ];
  const edges: [number, number][] = [[0, 1], [1, 2], [0, 3], [3, 4], [3, 5], [4, 6], [4, 7], [2, 7], [5, 6], [2, 8], [7, 8], [6, 9], [5, 9]];

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
      <svg viewBox="0 0 460 360" className="absolute right-2 top-8 h-[58%] w-[82%] opacity-70" fill="none" aria-hidden>
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

      {/* ---- Floating data widgets (top band + right column) ---- */}

      {/* Pipeline — top-right */}
      <FloatWidget className="right-10 top-14" delay="0s">
        <Label dot="bg-electric">Pipeline</Label>
        <div className="mt-2 flex items-end gap-1.5">
          {[38, 60, 44, 72, 30].map((h, i) => (
            <span key={i} className="w-2.5 rounded-sm" style={{ height: h, background: "linear-gradient(to top, #4F8CFF, #7C5CFF)", opacity: 0.5 + i * 0.1 }} />
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-white">€128,400 <span className="font-normal text-slate-400">open</span></p>
      </FloatWidget>

      {/* Won this month — right column, mid */}
      <FloatWidget className="right-20 top-52" delay="-2.5s">
        <Label dot="bg-emerald">Won this month</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-base font-bold text-white">€42,900</span>
          <span className="rounded bg-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald">+18%</span>
        </div>
        <svg viewBox="0 0 120 34" className="mt-1.5 h-7 w-32" fill="none" aria-hidden>
          <path d="M2 30 L22 24 L40 27 L60 15 L80 18 L100 8 L118 4" stroke="#16C784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 30 L22 24 L40 27 L60 15 L80 18 L100 8 L118 4 L118 34 L2 34 Z" fill="url(#sg)" opacity="0.25" />
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16C784" /><stop offset="1" stopColor="#16C784" stopOpacity="0" /></linearGradient></defs>
        </svg>
      </FloatWidget>

      {/* Tasks — top band, center-left */}
      <FloatWidget className="left-[24%] top-10 hidden xl:block" delay="-1.5s">
        <Label dot="bg-electric">Tasks today</Label>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-center gap-1.5 text-[11px] text-slate-300"><CheckCircle2 size={13} className="text-emerald" /> Call Acme d.o.o.</li>
          <li className="flex items-center gap-1.5 text-[11px] text-slate-300"><CheckCircle2 size={13} className="text-emerald" /> Send proposal</li>
          <li className="flex items-center gap-1.5 text-[11px] text-slate-400"><Circle size={13} className="text-slate-500" /> Follow up · Globex</li>
        </ul>
      </FloatWidget>

      {/* New lead — top band, center */}
      <FloatWidget className="left-[46%] top-24 hidden xl:block" delay="-3.5s">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-electric to-royal text-[11px] font-semibold text-white">A</span>
          <div>
            <p className="text-xs font-semibold text-white">New lead <span className="ml-1 rounded bg-electric/15 px-1 py-px text-[9px] font-medium text-electric">score 82</span></p>
            <p className="text-[10px] text-slate-400">Acme d.o.o. · just now</p>
          </div>
        </div>
      </FloatWidget>

      {/* Active clients — top band, center-left lower (moved off the footer) */}
      <FloatWidget className="left-[30%] top-40 hidden xl:block" delay="-4s">
        <Label dot="bg-royal">Active clients</Label>
        <div className="mt-2 flex items-center">
          {[["JD", "#4F8CFF"], ["AK", "#7C5CFF"], ["MP", "#16C784"], ["TS", "#FFB84F"]].map(([t, c], i) => (
            <span key={i} className="-ml-1.5 grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[#0c1120] first:ml-0" style={{ background: c as string }}>{t}</span>
          ))}
          <span className="ml-2 text-xs font-semibold text-white">128</span>
        </div>
      </FloatWidget>

      {/* Win rate ring — right column, lower (widest screens) */}
      <FloatWidget className="right-16 bottom-24 hidden 2xl:block" delay="-5s">
        <Label dot="bg-electric">Win rate</Label>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
              <circle cx="22" cy="22" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
              <circle cx="22" cy="22" r="16" fill="none" stroke="#4F8CFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset="32" />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-white">68%</span>
          </div>
          <div className="text-[10px] leading-tight text-slate-400">
            <p className="font-semibold text-emerald">+5 pts</p>
            <p>vs last quarter</p>
          </div>
        </div>
      </FloatWidget>
    </div>
  );
}
