import { useState, useEffect } from "react";

// ─── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supabaseReq(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

// ─── Prize config ─────────────────────────────────────────────────────────────
const ENTRY_FEE = 300;
const ADMIN_CUT = 0.10;
const PRIZE_DIST = [0.50, 0.30, 0.20];

function calcPrizes(n) {
  const total = n * ENTRY_FEE;
  const adminTake = Math.round(total * ADMIN_CUT);
  const pool = total - adminTake;
  return {
    total, adminTake, pool,
    first:  Math.round(pool * PRIZE_DIST[0]),
    second: Math.round(pool * PRIZE_DIST[1]),
    third:  Math.round(pool * PRIZE_DIST[2]),
  };
}

// ─── Calendario oficial FIFA Mundial 2026 — Fase de Grupos (72 partidos) ─────
// Fuente: ESPN Deportes / FIFA (post-repechaje, confirmado abril 2026)
// Playoffs UEFA: A=Bosnia | B=Suecia | C=Turquía | D=Chequia
// Repechaje intercontinental: IC1=Congo DR | IC2=Irak
const M = (id,g,h,a,d) => ({id,group:g,home:h,away:a,home_score:null,away_score:null,match_date:d});

const MOCK_MATCHES = [
  // ── GRUPO A ── México, Sudáfrica, Corea del Sur, Chequia
  M( 1,"A","México",         "Sudáfrica",       "2026-06-11"),
  M( 2,"A","Corea del Sur",  "Chequia",         "2026-06-11"),
  M( 3,"A","Chequia",        "Sudáfrica",       "2026-06-18"),
  M( 4,"A","México",         "Corea del Sur",   "2026-06-18"),
  M( 5,"A","Chequia",        "México",          "2026-06-24"),
  M( 6,"A","Sudáfrica",      "Corea del Sur",   "2026-06-24"),
  // ── GRUPO B ── Canadá, Bosnia, Qatar, Suiza
  M( 7,"B","Canadá",         "Bosnia",          "2026-06-12"),
  M( 8,"B","Qatar",          "Suiza",           "2026-06-13"),
  M( 9,"B","Suiza",          "Bosnia",          "2026-06-18"),
  M(10,"B","Canadá",         "Qatar",           "2026-06-18"),
  M(11,"B","Suiza",          "Canadá",          "2026-06-24"),
  M(12,"B","Bosnia",         "Qatar",           "2026-06-24"),
  // ── GRUPO C ── Brasil, Marruecos, Haití, Escocia
  M(13,"C","Brasil",         "Marruecos",       "2026-06-13"),
  M(14,"C","Haití",          "Escocia",         "2026-06-13"),
  M(15,"C","Escocia",        "Marruecos",       "2026-06-19"),
  M(16,"C","Brasil",         "Haití",           "2026-06-19"),
  M(17,"C","Escocia",        "Brasil",          "2026-06-24"),
  M(18,"C","Marruecos",      "Haití",           "2026-06-24"),
  // ── GRUPO D ── EE.UU., Paraguay, Australia, Turquía
  M(19,"D","EE.UU.",         "Paraguay",        "2026-06-12"),
  M(20,"D","Australia",      "Turquía",         "2026-06-13"),
  M(21,"D","Turquía",        "Paraguay",        "2026-06-19"),
  M(22,"D","EE.UU.",         "Australia",       "2026-06-19"),
  M(23,"D","Turquía",        "EE.UU.",          "2026-06-25"),
  M(24,"D","Paraguay",       "Australia",       "2026-06-25"),
  // ── GRUPO E ── Alemania, Curazao, Costa de Marfil, Ecuador
  M(25,"E","Alemania",       "Curazao",         "2026-06-14"),
  M(26,"E","Costa de Marfil","Ecuador",         "2026-06-14"),
  M(27,"E","Alemania",       "Costa de Marfil", "2026-06-20"),
  M(28,"E","Ecuador",        "Curazao",         "2026-06-20"),
  M(29,"E","Ecuador",        "Alemania",        "2026-06-25"),
  M(30,"E","Curazao",        "Costa de Marfil", "2026-06-25"),
  // ── GRUPO F ── Países Bajos, Japón, Suecia, Túnez
  M(31,"F","Países Bajos",   "Japón",           "2026-06-14"),
  M(32,"F","Suecia",         "Túnez",           "2026-06-14"),
  M(33,"F","Países Bajos",   "Suecia",          "2026-06-20"),
  M(34,"F","Túnez",          "Japón",           "2026-06-20"),
  M(35,"F","Japón",          "Suecia",          "2026-06-25"),
  M(36,"F","Túnez",          "Países Bajos",    "2026-06-25"),
  // ── GRUPO G ── Bélgica, Egipto, Irán, Nueva Zelanda
  M(37,"G","Bélgica",        "Egipto",          "2026-06-15"),
  M(38,"G","Irán",           "Nueva Zelanda",   "2026-06-15"),
  M(39,"G","Bélgica",        "Irán",            "2026-06-21"),
  M(40,"G","Nueva Zelanda",  "Egipto",          "2026-06-21"),
  M(41,"G","Egipto",         "Irán",            "2026-06-26"),
  M(42,"G","Nueva Zelanda",  "Bélgica",         "2026-06-26"),
  // ── GRUPO H ── España, Cabo Verde, Arabia Saudita, Uruguay
  M(43,"H","España",         "Cabo Verde",      "2026-06-15"),
  M(44,"H","Arabia Saudita", "Uruguay",         "2026-06-15"),
  M(45,"H","España",         "Arabia Saudita",  "2026-06-21"),
  M(46,"H","Uruguay",        "Cabo Verde",      "2026-06-21"),
  M(47,"H","Cabo Verde",     "Arabia Saudita",  "2026-06-26"),
  M(48,"H","Uruguay",        "España",          "2026-06-26"),
  // ── GRUPO I ── Francia, Senegal, Irak, Noruega
  M(49,"I","Francia",        "Senegal",         "2026-06-16"),
  M(50,"I","Irak",           "Noruega",         "2026-06-16"),
  M(51,"I","Francia",        "Irak",            "2026-06-22"),
  M(52,"I","Noruega",        "Senegal",         "2026-06-22"),
  M(53,"I","Noruega",        "Francia",         "2026-06-26"),
  M(54,"I","Senegal",        "Irak",            "2026-06-26"),
  // ── GRUPO J ── Argentina, Argelia, Austria, Jordania
  M(55,"J","Argentina",      "Argelia",         "2026-06-16"),
  M(56,"J","Austria",        "Jordania",        "2026-06-16"),
  M(57,"J","Argentina",      "Austria",         "2026-06-22"),
  M(58,"J","Jordania",       "Argelia",         "2026-06-22"),
  M(59,"J","Argelia",        "Austria",         "2026-06-27"),
  M(60,"J","Jordania",       "Argentina",       "2026-06-27"),
  // ── GRUPO K ── Portugal, Congo DR, Uzbekistán, Colombia
  M(61,"K","Portugal",       "Congo DR",        "2026-06-17"),
  M(62,"K","Uzbekistán",     "Colombia",        "2026-06-17"),
  M(63,"K","Portugal",       "Uzbekistán",      "2026-06-23"),
  M(64,"K","Colombia",       "Congo DR",        "2026-06-23"),
  M(65,"K","Colombia",       "Portugal",        "2026-06-27"),
  M(66,"K","Congo DR",       "Uzbekistán",      "2026-06-27"),
  // ── GRUPO L ── Inglaterra, Croacia, Ghana, Panamá
  M(67,"L","Inglaterra",     "Croacia",         "2026-06-17"),
  M(68,"L","Ghana",          "Panamá",          "2026-06-17"),
  M(69,"L","Inglaterra",     "Ghana",           "2026-06-23"),
  M(70,"L","Panamá",         "Croacia",         "2026-06-23"),
  M(71,"L","Panamá",         "Inglaterra",      "2026-06-27"),
  M(72,"L","Croacia",        "Ghana",           "2026-06-27"),
];

const MOCK_PARTICIPANTS = [
  { id:"p1", name:"Carlos R.",  code:"CARL01", total_points:14 },
  { id:"p2", name:"Ana M.",     code:"ANAM02", total_points:22 },
  { id:"p3", name:"Luis P.",    code:"LUISP3", total_points:18 },
  { id:"p4", name:"Sofía G.",   code:"SOFI04", total_points:10 },
  { id:"p5", name:"Javier T.",  code:"JAVT05", total_points:26 },
  { id:"p6", name:"María H.",   code:"MARH06", total_points:8  },
];

const ADMIN_CODE = "ADMIN2026";

// ─── Flags ────────────────────────────────────────────────────────────────────
const FLAGS = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Chequia":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EE.UU.":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Congo DR":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};
const flag = t => FLAGS[t] || "🏳️";

function calcPoints(pred, match) {
  if (match.home_score === null) return null;
  if (Number(pred.home) === match.home_score && Number(pred.away) === match.away_score) return 4;
  const rW = match.home_score > match.away_score ? "H" : match.away_score > match.home_score ? "A" : "D";
  const pW = Number(pred.home) > Number(pred.away) ? "H" : Number(pred.away) > Number(pred.home) ? "A" : "D";
  return rW === pW ? 2 : 0;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{
  --pitch:#0a3d1f;--pitch-mid:#0f5c2e;--grass:#16a34a;
  --gold:#f59e0b;--gold-light:#fcd34d;
  --white:#fff;--card:rgba(255,255,255,0.06);--card-hover:rgba(255,255,255,0.10);
  --border:rgba(255,255,255,0.10);--dim:rgba(255,255,255,0.50);
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:var(--pitch);color:var(--white);min-height:100vh;overflow-x:hidden;}
.app{min-height:100vh;background:
  radial-gradient(ellipse 80% 40% at 50% 0%,rgba(22,163,74,.25) 0%,transparent 70%),
  radial-gradient(ellipse 60% 30% at 80% 100%,rgba(245,158,11,.08) 0%,transparent 60%),
  var(--pitch);}
.grid-bg{position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:60px 60px;}

/* Header */
.hdr{position:sticky;top:0;z-index:100;background:rgba(10,61,31,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 20px;}
.hdr-in{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;color:var(--gold);}
.logo b{color:var(--white);}
.ubadge{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:background .2s;}
.ubadge:hover{background:var(--card-hover);}
.dot{width:7px;height:7px;border-radius:50%;background:var(--grass);box-shadow:0 0 6px var(--grass);}

/* Nav */
.nav{display:flex;gap:4px;max-width:960px;margin:0 auto;padding:18px 20px 0;}
.tab{padding:8px 18px;border-radius:7px 7px 0 0;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;background:transparent;color:var(--dim);border-bottom:2px solid transparent;}
.tab:hover{color:var(--white);}
.tab.on{color:var(--gold);border-bottom-color:var(--gold);}

/* Layout */
.main{position:relative;z-index:1;max-width:960px;margin:0 auto;padding:22px 20px 100px;}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;}
.card-hdr{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}

/* Login */
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;z-index:1;flex-direction:column;gap:28px;}
.trophy{font-size:68px;animation:bob 3s ease-in-out infinite;}
@keyframes bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
.login-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(40px,8vw,70px);letter-spacing:4px;line-height:1;text-align:center;}
.lbox{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:20px;padding:30px;width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px;}
.flabel{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:5px;display:block;}
.inp{width:100%;padding:12px 15px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--white);font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;letter-spacing:2px;text-transform:uppercase;outline:none;transition:border-color .2s;}
.inp::placeholder{letter-spacing:1px;text-transform:none;color:var(--dim);}
.inp:focus{border-color:var(--gold);}
.inp-plain{letter-spacing:normal!important;text-transform:none!important;}
.btn{padding:12px 22px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-gold{background:var(--gold);color:var(--pitch);}
.btn-gold:hover{background:var(--gold-light);transform:translateY(-1px);}
.btn-green{background:rgba(22,163,74,.2);color:#4ade80;border:1px solid rgba(22,163,74,.3);}
.btn-green:hover{background:rgba(22,163,74,.3);}
.btn-sm{padding:6px 12px;font-size:12px;}
.err{background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);border-radius:8px;padding:10px 14px;font-size:13px;color:#fca5a5;text-align:center;}

/* Prize box */
.pbox{background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.04));border:1px solid rgba(245,158,11,.25);border-radius:16px;padding:18px 22px;margin-bottom:18px;}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;}
.pc{background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;}
.pc.g{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.08);}
.pc-label{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1px;color:var(--dim);margin-bottom:3px;}
.pc-amt{font-family:'Bebas Neue',sans-serif;font-size:24px;line-height:1;}
.pc-pct{font-size:11px;color:var(--dim);margin-top:2px;}
.amt-gold{color:var(--gold);}
.amt-silver{color:#94a3b8;}
.amt-bronze{color:#cd7f32;}

/* Leaderboard */
.lbr{display:flex;align-items:center;padding:13px 18px;border-bottom:1px solid var(--border);gap:13px;transition:background .15s;}
.lbr:last-child{border-bottom:none;}
.lbr:hover{background:rgba(255,255,255,.03);}
.lbr.me{background:rgba(245,158,11,.07);}
.rnk{font-family:'Bebas Neue',sans-serif;font-size:21px;width:34px;text-align:center;flex-shrink:0;}
.rnk.g{color:#f59e0b;} .rnk.s{color:#94a3b8;} .rnk.b{color:#cd7f32;}
.lbn{flex:1;font-weight:500;font-size:14px;}
.lbc{font-size:11px;color:var(--dim);font-family:monospace;}
.lbprize{font-size:11px;font-weight:600;color:#4ade80;margin-top:1px;}
.lbpts{font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--gold);min-width:46px;text-align:right;}
.lbptsl{font-size:10px;color:var(--dim);text-align:right;margin-top:-4px;}
.mec{font-size:10px;font-weight:600;background:var(--gold);color:var(--pitch);border-radius:4px;padding:1px 5px;}

/* Group filters */
.gfilter{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;}
.gbtn{padding:5px 13px;border-radius:999px;border:1px solid var(--border);background:transparent;color:var(--dim);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
.gbtn:hover{color:var(--white);border-color:rgba(255,255,255,.25);}
.gbtn.on{background:var(--gold);border-color:var(--gold);color:var(--pitch);}

/* Match card */
.mc{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:14px 18px;margin-bottom:9px;transition:border-color .2s;}
.mc:hover{border-color:rgba(255,255,255,.17);}
.mc.lk{opacity:.72;}
.mmeta{font-size:11px;color:var(--dim);margin-bottom:11px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.gtag{background:rgba(22,163,74,.2);color:#4ade80;border-radius:4px;padding:2px 7px;font-weight:600;}
.mteams{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;}
.tm{display:flex;align-items:center;gap:6px;}
.tm.aw{flex-direction:row-reverse;}
.tflag{font-size:20px;}
.tname{font-weight:600;font-size:12px;line-height:1.2;}
.sinputs{display:flex;align-items:center;gap:4px;}
.si{width:42px;height:42px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.08);color:var(--white);font-family:'Bebas Neue',sans-serif;font-size:21px;text-align:center;outline:none;transition:border-color .2s;-moz-appearance:textfield;}
.si::-webkit-outer-spin-button,.si::-webkit-inner-spin-button{-webkit-appearance:none;}
.si:focus{border-color:var(--gold);background:rgba(245,158,11,.1);}
.si:disabled{opacity:.4;cursor:not-allowed;}
.ssep{font-family:'Bebas Neue',sans-serif;font-size:21px;color:var(--dim);}
.pind{margin-top:9px;display:flex;align-items:center;justify-content:flex-end;gap:5px;font-size:12px;}
.pexact{background:rgba(245,158,11,.2);color:var(--gold);border-radius:6px;padding:3px 9px;font-weight:600;}
.pwin{background:rgba(22,163,74,.2);color:#4ade80;border-radius:6px;padding:3px 9px;font-weight:600;}
.pnone{background:rgba(220,38,38,.15);color:#f87171;border-radius:6px;padding:3px 9px;font-weight:600;}
.ppend{color:var(--dim);font-style:italic;}
.oscore{text-align:center;margin-top:9px;font-size:11px;color:var(--dim);}

/* Admin */
.ar{display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:9px;padding:11px 15px;border-bottom:1px solid var(--border);}
.ar:last-child{border-bottom:none;}
.at{font-size:12px;font-weight:500;}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:11px;}

/* Save bar */
.sbar{position:fixed;bottom:0;left:0;right:0;background:rgba(10,61,31,.97);backdrop-filter:blur(20px);border-top:1px solid var(--border);padding:11px 20px;z-index:200;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.sbar-t{font-size:13px;color:var(--dim);}
.sbar-t b{color:var(--white);}

/* Badges */
.bgreen{display:inline-flex;align-items:center;gap:4px;background:rgba(22,163,74,.15);color:#4ade80;border-radius:6px;padding:3px 9px;font-size:11px;font-weight:600;}
.byellow{display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,.15);color:var(--gold);border-radius:6px;padding:3px 9px;font-size:11px;font-weight:600;}

/* Toast */
.toast{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);background:#0f5c2e;border:1px solid var(--border);border-radius:999px;padding:9px 18px;font-size:14px;font-weight:500;z-index:300;animation:tIn .3s ease,tOut .3s ease 2.7s forwards;white-space:nowrap;display:flex;align-items:center;gap:7px;}
@keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(14px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
@keyframes tOut{to{opacity:0;transform:translateX(-50%) translateY(14px);}}

.stitle{font-family:'Bebas Neue',sans-serif;font-size:27px;letter-spacing:2px;margin-bottom:4px;}
.ssub{font-size:13px;color:var(--dim);margin-bottom:18px;}

@media(max-width:600px){
  .agrid{grid-template-columns:1fr;}
  .tname{font-size:10px;}
  .si{width:38px;height:38px;}
  .pgrid{gap:7px;}
  .pc-amt{font-size:20px;}
}
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function QuinielaMundial() {
  const [participant, setParticipant] = useState(null);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [activeTab, setActiveTab]     = useState("lb");
  const [loginCode, setLoginCode]     = useState("");
  const [loginError, setLoginError]   = useState("");
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);
  const [matches, setMatches]         = useState(MOCK_MATCHES);
  const [preds, setPreds]             = useState({});
  const [filter, setFilter]           = useState("ALL");
  const [unsaved, setUnsaved]         = useState(false);
  const [toast, setToast]             = useState(null);
  const [newName, setNewName]         = useState("");
  const [newCode, setNewCode]         = useState("");
  const [adminR, setAdminR]           = useState({});

  useEffect(() => {
    const s = localStorage.getItem("qm26");
    if (s) setPreds(JSON.parse(s));
  }, []);

  const toast_ = (msg, emoji = "✅") => { setToast({msg,emoji}); setTimeout(()=>setToast(null),3000); };

  const login = () => {
    const c = loginCode.trim().toUpperCase();
    if (c === ADMIN_CODE) { setIsAdmin(true); setParticipant({name:"Admin",code:ADMIN_CODE,id:"admin"}); setActiveTab("admin"); return; }
    const p = participants.find(x => x.code === c);
    if (p) { setParticipant(p); setActiveTab("pred"); setLoginError(""); }
    else setLoginError("Código no encontrado. Verifica e intenta de nuevo.");
  };

  const setPred = (mid, side, val) => {
    if (val === "" || (!isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 99)) {
      setPreds(p => ({...p, [mid]: {...p[mid], [side]: val === "" ? "" : parseInt(val)}}));
      setUnsaved(true);
    }
  };

  const save = () => { localStorage.setItem("qm26", JSON.stringify(preds)); setUnsaved(false); toast_("Predicciones guardadas"); };

  const applyResult = (mid) => {
    const r = adminR[mid];
    if (!r || r.home === undefined || r.away === undefined) return;
    setMatches(m => m.map(x => x.id === mid ? {...x, home_score:r.home, away_score:r.away} : x));
    toast_("Resultado registrado","⚽");
  };

  const addP = () => {
    if (!newName || !newCode) return;
    setParticipants(p => [...p, {id:`p${Date.now()}`,name:newName,code:newCode.toUpperCase(),total_points:0}]);
    setNewName(""); setNewCode(""); toast_(`${newName} agregado`,"👤");
  };

  const prizes   = calcPrizes(participants.length);
  const sorted   = [...participants].sort((a,b) => b.total_points - a.total_points);
  const allGroups= [...new Set(MOCK_MATCHES.map(m=>m.group))];
  const shown    = filter === "ALL" ? matches : matches.filter(m=>m.group===filter);
  const played   = matches.filter(m=>m.home_score!==null).length;
  const predCount= Object.values(preds).filter(p=>p.home!==undefined&&p.home!=="").length;

  const prizeFor = i => {
    if (i===0) return `$${prizes.first.toLocaleString()} MXN`;
    if (i===1) return `$${prizes.second.toLocaleString()} MXN`;
    if (i===2) return `$${prizes.third.toLocaleString()} MXN`;
    return null;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!participant) return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg"/>
        <div className="login">
          <div style={{textAlign:"center"}}>
            <div className="trophy">🏆</div>
            <h1 className="login-title">QUINIELA<br/><span style={{color:"var(--gold)"}}>MUNDIAL</span><br/>2026</h1>
            <p style={{marginTop:8,color:"var(--dim)",fontSize:14}}>Predice · Compite · Gana</p>
          </div>
          <div className="lbox">
            <div>
              <span className="flabel">Tu código único</span>
              <input className="inp" placeholder="Ej. CARL01" value={loginCode}
                onChange={e=>{setLoginCode(e.target.value);setLoginError("");}}
                onKeyDown={e=>e.key==="Enter"&&login()} maxLength={10}/>
            </div>
            {loginError && <div className="err">{loginError}</div>}
            <button className="btn btn-gold" onClick={login}>⚽ Entrar a la quiniela</button>
            <p style={{textAlign:"center",fontSize:12,color:"var(--dim)"}}>¿No tienes código? Pide uno al admin.</p>
          </div>
          <p style={{textAlign:"center",fontSize:12,color:"var(--dim)"}}>
            Entrada: <strong style={{color:"var(--gold)"}}>$300 MXN</strong>
            &nbsp;·&nbsp; Pozo actual: <strong style={{color:"var(--gold)"}}>${prizes.total.toLocaleString()} MXN</strong>
            &nbsp;·&nbsp; {participants.length} participantes
          </p>
        </div>
      </div>
    </>
  );

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg"/>

        <header className="hdr">
          <div className="hdr-in">
            <div className="logo">⚽ <b>QUINIELA</b> <span style={{color:"var(--gold)"}}>MUNDIAL 26</span></div>
            <div className="ubadge" onClick={()=>{setParticipant(null);setIsAdmin(false);}}>
              <div className="dot"/>{isAdmin?"🛡️ Admin":participant.name}
            </div>
          </div>
        </header>

        <div className="nav">
          <button className={`tab ${activeTab==="lb"?"on":""}`} onClick={()=>setActiveTab("lb")}>🏅 Tabla</button>
          {!isAdmin && <button className={`tab ${activeTab==="pred"?"on":""}`} onClick={()=>setActiveTab("pred")}>
            📋 Predicciones
            {predCount>0 && <span style={{marginLeft:5,background:"var(--gold)",color:"var(--pitch)",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>{predCount}</span>}
          </button>}
          {isAdmin && <button className={`tab ${activeTab==="admin"?"on":""}`} onClick={()=>setActiveTab("admin")}>🛡️ Admin</button>}
        </div>

        <main className="main">

          {/* ══ LEADERBOARD ══ */}
          {activeTab==="lb" && <>
            <div className="pbox">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontSize:11,color:"var(--dim)",marginBottom:3}}>💰 POZO TOTAL</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:38,color:"var(--gold)",lineHeight:1}}>${prizes.total.toLocaleString()} <span style={{fontSize:18,color:"var(--dim)"}}>MXN</span></div>
                  <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>{participants.length} participantes · $300 c/u · Admin cobra ${prizes.adminTake.toLocaleString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"var(--dim)"}}>PARTIDOS JUGADOS</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:28,lineHeight:1}}>{played}<span style={{fontSize:15,color:"var(--dim)"}}>/{matches.length}</span></div>
                </div>
              </div>
              <div className="pgrid">
                <div className="pc g"><div className="pc-label">🥇 1° LUGAR</div><div className="pc-amt amt-gold">${prizes.first.toLocaleString()}</div><div className="pc-pct">50% del pozo</div></div>
                <div className="pc">  <div className="pc-label">🥈 2° LUGAR</div><div className="pc-amt amt-silver">${prizes.second.toLocaleString()}</div><div className="pc-pct">30% del pozo</div></div>
                <div className="pc">  <div className="pc-label">🥉 3° LUGAR</div><div className="pc-amt amt-bronze">${prizes.third.toLocaleString()}</div><div className="pc-pct">20% del pozo</div></div>
              </div>
            </div>

            <div className="card">
              {sorted.map((p,i) => (
                <div key={p.id} className={`lbr ${p.id===participant.id?"me":""}`}>
                  <div className={`rnk ${i===0?"g":i===1?"s":i===2?"b":""}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span className="lbn">{p.name}</span>
                      {p.id===participant.id && <span className="mec">YO</span>}
                    </div>
                    {/* <div className="lbc">{p.code}</div> */}
                    {prizeFor(i) && <div className="lbprize">💰 {prizeFor(i)}</div>}
                  </div>
                  <div><div className="lbpts">{p.total_points}</div><div className="lbptsl">PTS</div></div>
                </div>
              ))}
            </div>
            <p style={{marginTop:13,fontSize:12,color:"var(--dim)",textAlign:"center"}}>
              ⭐ Exacto = 4 pts &nbsp;·&nbsp; ✅ Ganador correcto = 2 pts &nbsp;·&nbsp; ❌ Fallo = 0 pts
            </p>
          </>}

          {/* ══ PREDICTIONS ══ */}
          {activeTab==="pred" && <>
            <div className="stitle">📋 Mis Predicciones</div>
            <div className="ssub">{predCount} de {matches.length} partidos predichos · Guarda tus cambios antes de salir</div>
            <div className="gfilter">
              <button className={`gbtn ${filter==="ALL"?"on":""}`} onClick={()=>setFilter("ALL")}>Todos</button>
              {allGroups.map(g=><button key={g} className={`gbtn ${filter===g?"on":""}`} onClick={()=>setFilter(g)}>Grupo {g}</button>)}
            </div>
            {shown.map(match => {
              const p = preds[match.id]||{};
              const has = p.home!==undefined && p.home!=="" && p.away!==undefined && p.away!=="";
              const pts = has ? calcPoints(p, match) : null;
              const lk  = match.home_score !== null;
              return (
                <div key={match.id} className={`mc ${lk?"lk":""}`}>
                  <div className="mmeta">
                    <span className="gtag">Grupo {match.group}</span>
                    <span>{new Date(match.match_date+"T12:00:00").toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"})}</span>
                    {lk && <span className="bgreen">✓ Finalizado</span>}
                  </div>
                  <div className="mteams">
                    <div className="tm"><span className="tflag">{flag(match.home)}</span><span className="tname">{match.home}</span></div>
                    <div className="sinputs">
                      <input className="si" type="number" min="0" max="99" disabled={lk}
                        value={p.home??""} placeholder="–" onChange={e=>setPred(match.id,"home",e.target.value)}/>
                      <span className="ssep">–</span>
                      <input className="si" type="number" min="0" max="99" disabled={lk}
                        value={p.away??""} placeholder="–" onChange={e=>setPred(match.id,"away",e.target.value)}/>
                    </div>
                    <div className="tm aw"><span className="tflag">{flag(match.away)}</span><span className="tname">{match.away}</span></div>
                  </div>
                  {lk && <div className="oscore">Oficial: <strong style={{color:"var(--white)"}}>{match.home_score}–{match.away_score}</strong> · Tu pred: {p.home??"-"}–{p.away??"-"}</div>}
                  <div className="pind">
                    {pts===4 && <span className="pexact">⭐ +4 pts · Exacto</span>}
                    {pts===2 && <span className="pwin">✅ +2 pts · Ganador</span>}
                    {pts===0 && <span className="pnone">❌ 0 pts</span>}
                    {pts===null && has && <span className="ppend">Pendiente de resultado oficial</span>}
                  </div>
                </div>
              );
            })}
          </>}

          {/* ══ ADMIN ══ */}
          {activeTab==="admin" && isAdmin && <>
            <div className="stitle">🛡️ Panel Admin</div>
            <div className="ssub">Gestiona participantes y registra resultados oficiales de los 72 partidos</div>

            {/* Prizes */}
            <div className="pbox" style={{marginBottom:18}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--gold)",marginBottom:10}}>💰 Resumen de premios con {participants.length} participantes</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:14,fontSize:13}}>
                <span>Total: <b>${prizes.total.toLocaleString()}</b></span>
                <span style={{color:"var(--dim)"}}>→</span>
                <span>Admin (10%): <b>${prizes.adminTake.toLocaleString()}</b></span>
                <span>🥇 <b style={{color:"var(--gold)"}}>${prizes.first.toLocaleString()}</b></span>
                <span>🥈 <b style={{color:"#94a3b8"}}>${prizes.second.toLocaleString()}</b></span>
                <span>🥉 <b style={{color:"#cd7f32"}}>${prizes.third.toLocaleString()}</b></span>
              </div>
            </div>

            {/* Add participant */}
            <div className="card" style={{marginBottom:18}}>
              <div className="card-hdr"><strong>👥 Agregar participante</strong><span className="byellow">{participants.length} registrados</span></div>
              <div style={{padding:18}}>
                <div className="agrid" style={{marginBottom:12}}>
                  <div><span className="flabel">Nombre</span><input className="inp inp-plain" placeholder="Ej. Carlos Ramírez" value={newName} onChange={e=>setNewName(e.target.value)}/></div>
                  <div><span className="flabel">Código único</span><input className="inp" placeholder="Ej. CARL01" value={newCode} onChange={e=>setNewCode(e.target.value)} maxLength={8}/></div>
                </div>
                <button className="btn btn-green btn-sm" onClick={addP}>+ Agregar participante</button>
              </div>
            </div>

            {/* Results */}
            <div className="card">
              <div className="card-hdr"><strong>⚽ Ingresar resultados</strong><span className="bgreen">{played}/{matches.length} jugados</span></div>
              {matches.map(m=>(
                <div key={m.id} className="ar">
                  <div className="at" style={{textAlign:"right"}}>{flag(m.home)} {m.home}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input className="si" type="number" min="0" max="99" disabled={m.home_score!==null}
                      value={m.home_score!==null ? m.home_score : (adminR[m.id]?.home??"")}
                      onChange={e=>setAdminR(p=>({...p,[m.id]:{...p[m.id],home:parseInt(e.target.value)||0}}))} placeholder="0"/>
                    <span className="ssep">–</span>
                    <input className="si" type="number" min="0" max="99" disabled={m.away_score!==null}
                      value={m.away_score!==null ? m.away_score : (adminR[m.id]?.away??"")}
                      onChange={e=>setAdminR(p=>({...p,[m.id]:{...p[m.id],away:parseInt(e.target.value)||0}}))} placeholder="0"/>
                  </div>
                  <div className="at">{m.away} {flag(m.away)}</div>
                  <div>{m.home_score!==null ? <span className="bgreen">✓</span> : <button className="btn btn-green btn-sm" onClick={()=>applyResult(m.id)}>✓</button>}</div>
                </div>
              ))}
            </div>
          </>}
        </main>

        {unsaved && activeTab==="pred" && (
          <div className="sbar">
            <span className="sbar-t"><b>Cambios sin guardar</b> · No olvides confirmar</span>
            <button className="btn btn-gold" style={{padding:"10px 18px"}} onClick={save}>💾 Guardar predicciones</button>
          </div>
        )}
        {toast && <div className="toast"><span>{toast.emoji}</span>{toast.msg}</div>}
      </div>
    </>
  );
}
