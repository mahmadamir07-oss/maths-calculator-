import { useState, useRef, useEffect, useCallback, useMemo } from "react";

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function factorial(n) {
  n = Math.round(n);
  if (n < 0 || n > 170) return NaN;
  if (n <= 1) return 1;
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

function mathEval(expr, xVal, angleMode) {
  if (!expr || typeof expr !== "string") return NaN;
  angleMode = angleMode || "DEG";
  const deg = angleMode === "DEG";
  const d2r = v => (deg ? v * Math.PI / 180 : v);
  const r2d = v => (deg ? v * 180 / Math.PI : v);
  const F = {
    sin: v => Math.sin(d2r(v)), cos: v => Math.cos(d2r(v)), tan: v => Math.tan(d2r(v)),
    sec: v => 1 / Math.cos(d2r(v)), csc: v => 1 / Math.sin(d2r(v)),
    cot: v => Math.cos(d2r(v)) / Math.sin(d2r(v)),
    asin: v => r2d(Math.asin(v)), acos: v => r2d(Math.acos(v)), atan: v => r2d(Math.atan(v)),
    atan2: (y, x) => r2d(Math.atan2(y, x)),
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    sqrt: Math.sqrt, cbrt: Math.cbrt, exp: Math.exp,
    ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
    abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
    trunc: Math.trunc, sign: Math.sign, pow: Math.pow,
    min: (...a) => Math.min(...a), max: (...a) => Math.max(...a), hypot: Math.hypot,
    fact: factorial,
    nCr: (n, r) => { n = Math.round(n); r = Math.round(r); if (r < 0 || r > n) return 0; return factorial(n) / (factorial(r) * factorial(n - r)); },
    nPr: (n, r) => { n = Math.round(n); r = Math.round(r); if (r < 0 || r > n) return 0; return factorial(n) / factorial(n - r); },
  };
  const C = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E, phi: (1 + Math.sqrt(5)) / 2, inf: Infinity };
  if (xVal !== null && xVal !== undefined) { C.x = xVal; C.X = xVal; }
  const known = [...Object.keys(F), ...Object.keys(C)].sort((a, b) => b.length - a.length);
  const s = expr.trim().replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3")
    .replace(/⁴/g, "^4").replace(/⁵/g, "^5").replace(/π/g, "pi").replace(/÷/g, "/").replace(/×/g, "*");
  let p = 0;
  function E() { let v = T(); while (p < s.length && (s[p] === "+" || s[p] === "-")) { const op = s[p++]; v = op === "+" ? v + T() : v - T(); } return v; }
  function T() { let v = Fc(); while (p < s.length) { if (s[p] === "*" && s[p + 1] !== "*") { p++; v *= Fc(); } else if (s[p] === "/") { p++; v /= Fc(); } else break; } return v; }
  function Fc() { if (s[p] === "-") { p++; return -Fc(); } if (s[p] === "+") { p++; return Fc(); } let b = Po(); if (p < s.length && s[p] === "^") { p++; return Math.pow(b, Fc()); } if (p < s.length && s[p] === "*" && s[p + 1] === "*") { p += 2; return Math.pow(b, Fc()); } return b; }
  function Po() { let v = Pr(); while (p < s.length && s[p] === "!") { p++; v = factorial(Math.round(v)); } return v; }
  function Pr() {
    if (s[p] === "(") { p++; const v = E(); if (s[p] === ")") p++; return v; }
    if (p < s.length && /[\d.]/.test(s[p])) {
      let n = ""; while (p < s.length && /[\d.]/.test(s[p])) n += s[p++];
      if (p < s.length && (s[p] === "e" || s[p] === "E") && p + 1 < s.length && /[\d+\-]/.test(s[p + 1])) { n += s[p++]; if (s[p] === "+" || s[p] === "-") n += s[p++]; while (p < s.length && /\d/.test(s[p])) n += s[p++]; }
      const v = parseFloat(n);
      if (p < s.length && (/[a-zA-Z_]/.test(s[p]) || s[p] === "(")) return v * Pr();
      return v;
    }
    if (p < s.length && /[a-zA-Z_]/.test(s[p])) {
      const start = p; let name = ""; while (p < s.length && /[a-zA-Z_0-9]/.test(s[p])) name += s[p++];
      if (p < s.length && s[p] === "(") {
        if (F[name]) { p++; const args = []; if (p < s.length && s[p] !== ")") { args.push(E()); while (p < s.length && s[p] === ",") { p++; args.push(E()); } } if (p < s.length && s[p] === ")") p++; return F[name](...args); }
        throw new Error("Unknown fn: " + name);
      }
      if (Object.prototype.hasOwnProperty.call(C, name)) { const cv = C[name]; if (p < s.length && /[a-zA-Z_(]/.test(s[p])) return cv * Pr(); return cv; }
      if (F[name] && p < s.length && /[\d.(a-zA-Z_]/.test(s[p])) return F[name](Pr());
      for (const k of known) { if (name.startsWith(k) && name.length > k.length) { p = start + k.length; if (F[k]) return F[k](Pr()); if (Object.prototype.hasOwnProperty.call(C, k)) { const cv = C[k]; return p < s.length && /[a-zA-Z_(]/.test(s[p]) ? cv * Pr() : cv; } } }
      throw new Error("Unknown: " + name);
    }
    throw new Error("Unexpected '" + (s[p] || "EOF") + "'");
  }
  try { const res = E(); if (typeof res !== "number") return NaN; const ri = Math.round(res); return Math.abs(res - ri) < 1e-9 ? ri : res; } catch { return NaN; }
}

function fmt(n) {
  if (!isFinite(n)) return n > 0 ? "∞" : n < 0 ? "-∞" : "NaN";
  const nr = Math.round(n);
  if (Math.abs(n - nr) < 1e-9) n = nr;
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toPrecision(10)).toString();
}

const ROWS = [
  [{ l: "sin", v: "sin(" }, { l: "cos", v: "cos(" }, { l: "tan", v: "tan(" }, { l: "asin", v: "asin(" }, { l: "acos", v: "acos(" }, { l: "atan", v: "atan(" }],
  [{ l: "sec", v: "sec(" }, { l: "csc", v: "csc(" }, { l: "cot", v: "cot(" }, { l: "sinh", v: "sinh(" }, { l: "cosh", v: "cosh(" }, { l: "tanh", v: "tanh(" }],
  [{ l: "log", v: "log(" }, { l: "ln", v: "ln(" }, { l: "log₂", v: "log2(" }, { l: "√", v: "sqrt(" }, { l: "∛", v: "cbrt(" }, { l: "exp", v: "exp(" }],
  [{ l: "x²", v: "^2", t: "fn" }, { l: "xʸ", v: "^", t: "fn" }, { l: "|x|", v: "abs(", t: "fn" }, { l: "n!", v: "!", t: "fn" }, { l: "nCr", v: "__nCr__", t: "fn" }, { l: "nPr", v: "__nPr__", t: "fn" }],
  [{ l: "π", v: "pi", t: "c" }, { l: "e", v: "e", t: "c" }, { l: "φ", v: "phi", t: "c" }, { l: "(", v: "(", t: "p" }, { l: ")", v: ")", t: "p" }, { l: "%", v: "/100", t: "p" }],
  [{ l: "7" }, { l: "8" }, { l: "9" }, { l: "÷", v: "÷", t: "op" }, { l: "×", v: "×", t: "op" }, { l: "⌫", v: "__bk__", t: "del" }],
  [{ l: "4" }, { l: "5" }, { l: "6" }, { l: "+", t: "op" }, { l: "−", v: "-", t: "op" }, { l: "C", v: "__clr__", t: "del" }],
  [{ l: "1" }, { l: "2" }, { l: "3" }, { l: "ANS", v: "ANS", t: "c" }, { l: "±", v: "__neg__", t: "op" }, { l: "AC", v: "__ac__", t: "del" }],
  [{ l: "0", wide: true }, { l: "." }, { l: "EE", v: "×10^", t: "op" }, { l: "=", v: "__eq__", t: "eq", wide: true }],
];
const BC = {
  fn: { bg: "#1a1435", fg: "#a78bfa", br: "#4c1d95" }, num: { bg: "#1e293b", fg: "#f8fafc", br: "#334155" },
  op: { bg: "#0d2d2a", fg: "#34d399", br: "#064e3b" }, c: { bg: "#1a0f2e", fg: "#c084fc", br: "#581c87" },
  del: { bg: "#1a0000", fg: "#f87171", br: "#7f1d1d" }, eq: { bg: "#1d4ed8", fg: "#fff", br: "#1e40af" },
  p: { bg: "#0d2d2a", fg: "#67e8f9", br: "#164e63" },
};

function CalcHistory({ hist, setHist, setExpr, isMobile, setShowHistory }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#475569", fontSize: 10, fontWeight: 700 }}>HISTORY</span>
        {hist.length > 0 && <span onClick={() => setHist([])} style={{ color: "#f87171", fontSize: 10, cursor: "pointer" }}>clear</span>}
      </div>
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, maxHeight: isMobile ? 220 : 420 }} className="calc-scroll">
        {hist.length === 0 && <div style={{ color: "#334155", fontSize: 10 }}>No history yet</div>}
        {[...hist].reverse().map((item, i) => (
          <div key={i} onClick={() => { setExpr(item.result); if (isMobile) setShowHistory(false); }}
            style={{ background: "#1e293b", borderRadius: 6, padding: "5px 8px", cursor: "pointer", borderLeft: "3px solid #6366f1" }}>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", wordBreak: "break-all", marginBottom: 2 }}>{item.expr}</div>
            <div style={{ color: "#f8fafc", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{item.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Calc() {
  const isMobile = useWindowWidth() < 600;
  const [expr, setExpr] = useState("");
  const [ans, setAns] = useState(0);
  const [preview, setPreview] = useState("");
  const [mem, setMem] = useState(0);
  const [angle, setAngle] = useState("DEG");
  const [hist, setHist] = useState([]);
  const [combo, setCombo] = useState(null);
  const [nVal, setNVal] = useState("5");
  const [rVal, setRVal] = useState("2");
  const [showHistory, setShowHistory] = useState(false);
  const getType = b => b.t || (["7","8","9","4","5","6","1","2","3","0","."].includes(b.l) ? "num" : "fn");
  const press = useCallback((b) => {
    const v = b.v !== undefined ? b.v : b.l;
    if (v === "__nCr__") { setCombo("nCr"); return; }
    if (v === "__nPr__") { setCombo("nPr"); return; }
    if (v === "__bk__") { setExpr(e => e.slice(0, -1)); return; }
    if (v === "__clr__") { setExpr(""); setPreview(""); return; }
    if (v === "__ac__") { setExpr(""); setPreview(""); setHist([]); return; }
    if (v === "__neg__") { setExpr(e => e.startsWith("-") ? e.slice(1) : "-" + e); return; }
    if (v === "__eq__") {
      const e2 = expr.replace(/ANS/g, `(${ans})`);
      const r = mathEval(e2, null, angle);
      if (!isNaN(r) && isFinite(r)) {
        const f = fmt(r);
        setHist(h => [...h.slice(-19), { expr, result: f }]);
        setAns(r); setExpr(f); setPreview("");
      } else { setExpr("Error"); setTimeout(() => setExpr(""), 900); }
      return;
    }
    setExpr(e => e === "Error" ? v : e + v);
  }, [expr, ans, angle]);
  useEffect(() => {
    if (!expr || expr === "-" || expr === "Error") { setPreview(""); return; }
    const e2 = expr.replace(/ANS/g, `(${ans})`);
    const r = mathEval(e2, null, angle);
    if (!isNaN(r) && isFinite(r)) { const f = fmt(r); setPreview(f !== expr ? f : ""); }
    else setPreview("");
  }, [expr, ans, angle]);
  useEffect(() => {
    const km = { "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",".":".","(":"(",")":")","^":"^","+":"+","-":"-","*":"×","/":"÷" };
    const handler = ev => {
      if (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA") return;
      if (km[ev.key]) { ev.preventDefault(); press({ v: km[ev.key] }); }
      else if (ev.key === "Enter" || ev.key === "=") { ev.preventDefault(); press({ v: "__eq__" }); }
      else if (ev.key === "Backspace") { ev.preventDefault(); press({ v: "__bk__" }); }
      else if (ev.key === "Escape") { ev.preventDefault(); press({ v: "__clr__" }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [press]);
  const comboResult = (() => {
    const n = Number(nVal), r = Number(rVal);
    if (isNaN(n) || isNaN(r) || r < 0 || r > n) return "—";
    return fmt(mathEval(combo === "nCr" ? `nCr(${n},${r})` : `nPr(${n},${r})`, null, angle));
  })();
  const memBtns = [
    ["MC", () => setMem(0)],
    ["MR", () => setExpr(e => e + fmt(mem))],
    ["M+", () => { const r = mathEval(expr, null, angle); if (!isNaN(r) && isFinite(r)) setMem(m => m + r); }],
    ["M−", () => { const r = mathEval(expr, null, angle); if (!isNaN(r) && isFinite(r)) setMem(m => m - r); }],
    ["MS", () => { const r = mathEval(expr, null, angle); if (!isNaN(r) && isFinite(r)) setMem(r); }],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {isMobile && (
        <button onClick={() => setShowHistory(h => !h)}
          style={{ background: "#1e293b", color: "#818cf8", border: "1px solid #334155", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, alignSelf: "flex-end" }}>
          {showHistory ? "Hide History ▲" : "History ▼"}
        </button>
      )}
      {isMobile && showHistory && <CalcHistory hist={hist} setHist={setHist} setExpr={setExpr} isMobile={true} setShowHistory={setShowHistory} />}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", minHeight: 82 }}>
            <div style={{ color: "#475569", fontSize: isMobile ? 11 : 12, fontFamily: "monospace", wordBreak: "break-all", minHeight: 16 }}>{expr || "0"}</div>
            {preview && <div style={{ color: "#818cf8", fontSize: isMobile ? 13 : 15, textAlign: "right", fontFamily: "monospace" }}>{preview}</div>}
            <div style={{ color: "#f8fafc", fontSize: preview ? (isMobile ? 17 : 20) : (isMobile ? 22 : 26), fontWeight: 800, textAlign: "right", fontFamily: "monospace", wordBreak: "break-all" }}>{preview || expr || "0"}</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setAngle(a => a === "DEG" ? "RAD" : "DEG")}
              style={{ background: "#1e293b", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{angle}</button>
            {memBtns.map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} style={{ flex: 1, background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 7, padding: "4px 0", cursor: "pointer", fontSize: 10 }}>{lbl}</button>
            ))}
            <div style={{ background: "#1e293b", color: "#fbbf24", borderRadius: 7, padding: "4px 8px", fontSize: 10, border: "1px solid #334155" }}>M={fmt(mem)}</div>
          </div>
          {combo && (
            <div style={{ background: "#1a1435", borderRadius: 10, padding: "10px 14px", border: "1px solid #4c1d95", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#a78bfa", fontFamily: "monospace", fontWeight: 800, fontSize: 15 }}>{combo}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#64748b", fontSize: 12 }}>n</span>
                <input type="number" value={nVal} min="0" max="999" step="1" onChange={e => setNVal(e.target.value)}
                  style={{ width: 62, background: "#0f172a", color: "#f8fafc", border: "1px solid #6366f1", borderRadius: 6, padding: "5px 8px", fontSize: 15, fontFamily: "monospace", outline: "none", textAlign: "center" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#64748b", fontSize: 12 }}>r</span>
                <input type="number" value={rVal} min="0" max="999" step="1" onChange={e => setRVal(e.target.value)}
                  style={{ width: 62, background: "#0f172a", color: "#f8fafc", border: "1px solid #6366f1", borderRadius: 6, padding: "5px 8px", fontSize: 15, fontFamily: "monospace", outline: "none", textAlign: "center" }} />
              </div>
              <span style={{ color: comboResult === "—" ? "#f87171" : "#34d399", fontFamily: "monospace", fontWeight: 800, fontSize: 20, minWidth: 60 }}>= {comboResult}</span>
              <button onClick={() => { if (comboResult !== "—") { setExpr(e => e + comboResult); setCombo(null); } }} disabled={comboResult === "—"}
                style={{ background: comboResult !== "—" ? "#1d4ed8" : "#1e293b", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", cursor: comboResult !== "—" ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, opacity: comboResult !== "—" ? 1 : 0.4 }}>Insert</button>
              <button onClick={() => setCombo(null)} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {ROWS.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: 3 }}>
                {row.map((b, bi) => {
                  const t = getType(b); const col = BC[t] || BC.num;
                  return (
                    <button key={bi} onClick={() => press(b)}
                      onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.4)"}
                      onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
                      style={{ flex: b.wide ? 2 : 1, background: col.bg, color: col.fg, border: `1px solid ${col.br}`, borderRadius: 7, cursor: "pointer", fontSize: isMobile ? 10 : 11, fontWeight: t === "eq" ? 700 : 500, padding: isMobile ? "5px 0" : "7px 0", fontFamily: "monospace", transition: "filter 0.1s", minWidth: 0 }}>{b.l}</button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {!isMobile && (
          <div style={{ width: 155 }}>
            <CalcHistory hist={hist} setHist={setHist} setExpr={setExpr} isMobile={false} setShowHistory={setShowHistory} />
          </div>
        )}
      </div>
    </div>
  );
}

const GCOLS = ["#818cf8","#34d399","#fb923c","#f472b6","#60a5fa","#facc15","#a3e635","#f9a8d4"];
const QUICK = [
  { label: "sin(x)", expr: "sin(x)" }, { label: "cos(x)", expr: "cos(x)" }, { label: "x²", expr: "x^2" },
  { label: "x³", expr: "x^3" }, { label: "ln(x)", expr: "ln(x)" }, { label: "log(x)", expr: "log(x)" },
  { label: "exp(x)", expr: "exp(x)" }, { label: "e^x", expr: "e^x" }, { label: "√x", expr: "sqrt(x)" },
  { label: "1/x", expr: "1/x" }, { label: "2x+1", expr: "2*x+1" }, { label: "tan(x)", expr: "tan(x)" },
];

function Grapher() {
  const isMobile = useWindowWidth() < 600;
  const cvs = useRef(null);
  const [fns, setFns] = useState([{ expr: "sin(x)", on: true }, { expr: "cos(x)", on: true }]);
  const [inp, setInp] = useState("");
  const [mode, setMode] = useState("RAD");
  const [vp, setVp] = useState({ xMin: -8, xMax: 8, yMin: -6, yMax: 6 });
  const drag = useRef(null);
  const vpRef = useRef(vp);
  const [cursor, setCursor] = useState(null);
  useEffect(() => { vpRef.current = vp; }, [vp]);

  const draw = useCallback(() => {
    const canvas = cvs.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    if (!W || !H) return;
    if (canvas.width !== Math.round(W * dpr)) canvas.width = Math.round(W * dpr);
    if (canvas.height !== Math.round(H * dpr)) canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    ctx.save(); ctx.scale(dpr, dpr);
    const { xMin, xMax, yMin, yMax } = vp;
    const xR = xMax - xMin, yR = yMax - yMin;
    const toX = x => ((x - xMin) / xR) * W;
    const toY = y => H - ((y - yMin) / yR) * H;
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
    const rw = xR / 8, pw = Math.pow(10, Math.floor(Math.log10(Math.abs(rw) || 1)));
    const step = Math.ceil(rw / pw) * pw || pw;
    const ry = yR / 6, py2 = Math.pow(10, Math.floor(Math.log10(Math.abs(ry) || 1)));
    const yStep = Math.ceil(ry / py2) * py2 || py2;
    ctx.lineWidth = 0.5; ctx.strokeStyle = "#1e293b";
    for (let x = Math.ceil(xMin / step) * step; x <= xMax + step * 0.01; x += step) { const px = toX(x); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + yStep * 0.01; y += yStep) { const py = toY(y); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = "#334155";
    ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H); ctx.stroke();
    ctx.fillStyle = "#475569"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    for (let x = Math.ceil(xMin / step) * step; x <= xMax + step * 0.01; x += step) { if (Math.abs(x) < step * 0.01) continue; ctx.fillText(parseFloat(x.toPrecision(4)), toX(x), Math.min(H - 4, Math.max(12, toY(0) + 13))); }
    ctx.textAlign = "right";
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + yStep * 0.01; y += yStep) { if (Math.abs(y) < yStep * 0.01) continue; ctx.fillText(parseFloat(y.toPrecision(4)), Math.min(W - 4, Math.max(36, toX(0) - 5)), Math.min(H - 2, Math.max(10, toY(y) + 4))); }
    fns.forEach((fn, fi) => {
      if (!fn.on || !fn.expr.trim()) return;
      ctx.strokeStyle = GCOLS[fi % GCOLS.length]; ctx.lineWidth = 2.5; ctx.beginPath();
      let pen = false, prevPy = null;
      const steps = W * 2;
      for (let k = 0; k <= steps; k++) {
        const x = xMin + (k / steps) * xR, y = mathEval(fn.expr, x, mode);
        if (!isFinite(y) || isNaN(y)) { pen = false; prevPy = null; continue; }
        const px = (k / steps) * W, py = toY(y);
        const jump = prevPy !== null && Math.abs(py - prevPy) > H * 2;
        if (!pen || jump) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        pen = true; prevPy = py;
      }
      ctx.stroke();
    });
    if (cursor) {
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cursor.px, 0); ctx.lineTo(cursor.px, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cursor.py); ctx.lineTo(W, cursor.py); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }, [vp, fns, mode, cursor]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => { window.addEventListener("resize", draw); return () => window.removeEventListener("resize", draw); }, [draw]);

  const onWheel = ev => { ev.preventDefault(); const f = ev.deltaY > 0 ? 1.15 : 0.87; setVp(v => { const cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2; return { xMin: cx + (v.xMin - cx) * f, xMax: cx + (v.xMax - cx) * f, yMin: cy + (v.yMin - cy) * f, yMax: cy + (v.yMax - cy) * f }; }); };
  const onMD = ev => { drag.current = { x: ev.clientX, y: ev.clientY, vp: { ...vpRef.current }, rect: cvs.current.getBoundingClientRect() }; };
  const onMM = ev => {
    const canvas = cvs.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
    const { xMin, xMax, yMin, yMax } = vpRef.current;
    const xR = xMax - xMin, yR = yMax - yMin;
    setCursor({ px, py, x: xMin + (px / rect.width) * xR, y: yMax - (py / rect.height) * yR });
    if (!drag.current) return;
    const { x: dx0, y: dy0, vp: dv, rect: dr } = drag.current;
    const xR2 = dv.xMax - dv.xMin, yR2 = dv.yMax - dv.yMin;
    setVp({ xMin: dv.xMin - (ev.clientX - dx0) / dr.width * xR2, xMax: dv.xMax - (ev.clientX - dx0) / dr.width * xR2, yMin: dv.yMin + (ev.clientY - dy0) / dr.height * yR2, yMax: dv.yMax + (ev.clientY - dy0) / dr.height * yR2 });
  };
  const onMU = () => { drag.current = null; };
  const onML = () => { drag.current = null; setCursor(null); };

  // Touch support: one-finger pan, two-finger pinch-zoom
  const onTouchStart = ev => {
    ev.preventDefault();
    const rect = cvs.current.getBoundingClientRect();
    if (ev.touches.length === 1) {
      drag.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY, vp: { ...vpRef.current }, rect, pinchDist: null };
    } else if (ev.touches.length === 2) {
      const dist = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
      drag.current = { ...drag.current, pinchDist: dist, pinchVp: { ...vpRef.current } };
    }
  };
  const onTouchMove = ev => {
    ev.preventDefault();
    if (!drag.current) return;
    if (ev.touches.length === 1 && drag.current.pinchDist == null) {
      const { x: dx0, y: dy0, vp: dv, rect: dr } = drag.current;
      const xR2 = dv.xMax - dv.xMin, yR2 = dv.yMax - dv.yMin;
      setVp({ xMin: dv.xMin - (ev.touches[0].clientX - dx0) / dr.width * xR2, xMax: dv.xMax - (ev.touches[0].clientX - dx0) / dr.width * xR2, yMin: dv.yMin + (ev.touches[0].clientY - dy0) / dr.height * yR2, yMax: dv.yMax + (ev.touches[0].clientY - dy0) / dr.height * yR2 });
    } else if (ev.touches.length === 2 && drag.current.pinchDist != null) {
      const dist = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
      const f = drag.current.pinchDist / dist;
      const dv = drag.current.pinchVp;
      const cx = (dv.xMin + dv.xMax) / 2, cy = (dv.yMin + dv.yMax) / 2;
      setVp({ xMin: cx + (dv.xMin - cx) * f, xMax: cx + (dv.xMax - cx) * f, yMin: cy + (dv.yMin - cy) * f, yMax: cy + (dv.yMax - cy) * f });
    }
  };
  const onTouchEnd = () => { drag.current = null; };

  const addFn = t => {
    t = (t || inp).trim(); if (!t) return;
    const { xMin, xMax } = vpRef.current;
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i <= 400; i++) { const x = xMin + (i / 400) * (xMax - xMin); const y = mathEval(t, x, mode); if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1e6) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); } }
    setFns(f => [...f, { expr: t, on: true }]); setInp("");
    if (isFinite(yMin) && isFinite(yMax)) { const pad = Math.max((yMax - yMin) * 0.15, 0.5); setVp(v => ({ ...v, yMin: Math.min(v.yMin, yMin - pad), yMax: Math.max(v.yMax, yMax + pad) })); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && addFn()}
          placeholder="f(x) = e.g. sin(x)  x^2  2*x+1" style={{ flex: 1, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "monospace", outline: "none", minWidth: 120 }} />
        <button onClick={() => addFn()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700 }}>+ Plot</button>
        <button onClick={() => setMode(m => m === "DEG" ? "RAD" : "DEG")} style={{ background: "#1e293b", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: 8, padding: "8px 11px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{mode}</button>
        <button onClick={() => setVp({ xMin: -8, xMax: 8, yMin: -6, yMax: 6 })} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12 }}>Reset</button>
        <button onClick={() => setFns([])} style={{ background: "#1e293b", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12 }}>Clear</button>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {QUICK.map(q => <button key={q.expr} onClick={() => addFn(q.expr)} style={{ background: "#0f172a", color: "#64748b", border: "1px solid #1e293b", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>{q.label}</button>)}
      </div>
      {fns.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {fns.map((fn, idx) => {
            const tv = mathEval(fn.expr, 1, mode); const ok = isFinite(tv) && !isNaN(tv);
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5, background: "#1e293b", borderRadius: 8, padding: "4px 10px", borderLeft: `3px solid ${GCOLS[idx % GCOLS.length]}` }}>
                <span style={{ color: "#f8fafc", fontSize: 12, fontFamily: "monospace" }}>y={fn.expr}</span>
                <span style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>{ok ? `(1)=${fmt(tv)}` : ""}</span>
                <button onClick={() => setFns(f => f.map((x, j) => j === idx ? { ...x, on: !x.on } : x))} style={{ background: "none", border: "none", cursor: "pointer", color: fn.on ? GCOLS[idx % GCOLS.length] : "#334155", padding: "0 2px", fontSize: 13 }}>●</button>
                <button onClick={() => setFns(f => f.filter((_, j) => j !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 15, padding: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <canvas ref={cvs} style={{ borderRadius: 10, cursor: "crosshair", width: "100%", height: isMobile ? 280 : 380, display: "block", touchAction: "none" }}
          onWheel={onWheel} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onML}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} />
        {cursor && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(15,23,42,0.92)", color: "#94a3b8", fontSize: 11, padding: "4px 8px", borderRadius: 6, fontFamily: "monospace", pointerEvents: "none" }}>
            x={cursor.x.toFixed(3)}  y={cursor.y.toFixed(3)}
          </div>
        )}
      </div>
      <div style={{ color: "#334155", fontSize: 11 }}>{isMobile ? "Drag to pan · Pinch to zoom" : "Scroll to zoom · Drag to pan"} · Use <code style={{ color: "#6366f1" }}>x</code> as variable · Graph auto-fits on add</div>
    </div>
  );
}

const UC = {
  Length: { units: ["mm","cm","m","km","in","ft","yd","mi"], tb: { mm:0.001,cm:0.01,m:1,km:1000,in:0.0254,ft:0.3048,yd:0.9144,mi:1609.344 } },
  Mass: { units: ["mg","g","kg","tonnes","oz","lb"], tb: { mg:1e-6,g:0.001,kg:1,tonnes:1000,oz:0.0283495,lb:0.453592 } },
  Area: { units: ["mm²","cm²","m²","km²","in²","ft²","acres","hectares"], tb: { "mm²":1e-6,"cm²":1e-4,"m²":1,"km²":1e6,"in²":6.4516e-4,"ft²":0.092903,acres:4046.86,hectares:10000 } },
  Volume: { units: ["ml","cl","l","m³","tsp","tbsp","fl oz","cup","pint","gallon"], tb: { ml:0.001,cl:0.01,l:1,"m³":1000,tsp:0.00492892,tbsp:0.0147868,"fl oz":0.0295735,cup:0.236588,pint:0.473176,gallon:3.78541 } },
  Temperature: { units: ["°C","°F","K"] },
  Speed: { units: ["m/s","km/h","mph","knots","ft/s"], tb: { "m/s":1,"km/h":1/3.6,mph:0.44704,knots:0.514444,"ft/s":0.3048 } },
  Time: { units: ["ms","s","min","hr","days","weeks","months","years"], tb: { ms:0.001,s:1,min:60,hr:3600,days:86400,weeks:604800,months:2629800,years:31557600 } },
  Angle: { units: ["degrees","radians","gradians"], tb: { degrees:1,radians:180/Math.PI,gradians:0.9 } },
  Energy: { units: ["J","kJ","cal","kcal","Wh","kWh","eV"], tb: { J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000,eV:1.60218e-19 } },
  Pressure: { units: ["Pa","kPa","bar","atm","psi","mmHg"], tb: { Pa:1,kPa:1000,bar:100000,atm:101325,psi:6894.76,mmHg:133.322 } },
  Data: { units: ["bits","bytes","KB","MB","GB","TB"], tb: { bits:1,bytes:8,KB:8192,MB:8388608,GB:8589934592,TB:8796093022208 } },
  Force: { units: ["N","kN","lbf","kgf"], tb: { N:1,kN:1000,lbf:4.44822,kgf:9.80665 } },
  Power: { units: ["W","kW","MW","hp"], tb: { W:1,kW:1000,MW:1e6,hp:745.7 } },
  Frequency: { units: ["Hz","kHz","MHz","GHz"], tb: { Hz:1,kHz:1000,MHz:1e6,GHz:1e9 } },
};

function cvtUnits(v, from, to, cat) {
  if (from === to) return v;
  if (cat === "Temperature") { let c = from === "°C" ? v : from === "°F" ? (v - 32) * 5 / 9 : v - 273.15; if (to === "°C") return c; if (to === "°F") return c * 9 / 5 + 32; return c + 273.15; }
  const tb = UC[cat].tb; return v * tb[from] / tb[to];
}
function cvtFormula(from, to, cat) {
  if (from === to) return `${to} = ${from}`;
  if (cat === "Temperature") { const m = { "°C→°F":"°F = °C × 9/5 + 32","°F→°C":"°C = (°F − 32) × 5/9","°C→K":"K = °C + 273.15","K→°C":"°C = K − 273.15","°F→K":"K = (°F − 32) × 5/9 + 273.15","K→°F":"°F = (K − 273.15) × 9/5 + 32" }; return m[`${from}→${to}`] || `${to} = f(${from})`; }
  const tb = UC[cat].tb; return `${to} = ${from} × ${parseFloat((tb[from] / tb[to]).toPrecision(5))}`;
}

function UnitConverter() {
  const isMobile = useWindowWidth() < 600;
  const [cat, setCat] = useState("Length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("km");
  const [activeField, setActiveField] = useState("from");
  const [activeVal, setActiveVal] = useState("1");
  const changeCat = c => { const u = UC[c].units; setCat(c); setFromUnit(u[0]); setToUnit(u[1] || u[0]); setActiveField("from"); setActiveVal("1"); };
  const n = parseFloat(activeVal);
  const fromR = !isNaN(n) ? cvtUnits(n, toUnit, fromUnit, cat) : NaN;
  const toR = !isNaN(n) ? cvtUnits(n, fromUnit, toUnit, cat) : NaN;
  const fromDisp = activeField === "from" ? activeVal : (isFinite(fromR) ? parseFloat(fromR.toPrecision(10)).toString() : "");
  const toDisp = activeField === "to" ? activeVal : (isFinite(toR) ? parseFloat(toR.toPrecision(10)).toString() : "");
  const swap = () => {
    const sv = activeField === "from" ? (isFinite(toR) ? parseFloat(toR.toPrecision(10)).toString() : activeVal) : (isFinite(fromR) ? parseFloat(fromR.toPrecision(10)).toString() : activeVal);
    setFromUnit(toUnit); setToUnit(fromUnit); setActiveField("from"); setActiveVal(sv);
  };
  const sel = { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none" };
  const inp2 = { flex: 1, background: "#0f172a", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", fontSize: isMobile ? 14 : 16, fontFamily: "monospace", outline: "none" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>🔄</span>
        <div><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>Unit Converter</div><div style={{ color: "#64748b", fontSize: isMobile ? 11 : 12 }}>14 categories · bidirectional</div></div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(UC).map(c => <button key={c} onClick={() => changeCat(c)} style={{ background: cat === c ? "#6366f1" : "#1e293b", color: cat === c ? "#fff" : "#94a3b8", border: `1px solid ${cat === c ? "#6366f1" : "#334155"}`, borderRadius: 7, padding: isMobile ? "4px 8px" : "5px 12px", cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: cat === c ? 700 : 400 }}>{c}</button>)}
      </div>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: isMobile ? 12 : 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>FROM</label>
            <select value={fromUnit} onChange={e => { setFromUnit(e.target.value); setActiveField("from"); }} style={sel}>{UC[cat].units.map(u => <option key={u}>{u}</option>)}</select>
            <input value={fromDisp} onChange={e => { setActiveField("from"); setActiveVal(e.target.value); }} style={inp2} placeholder="Enter value" type="number" />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: isMobile ? 0 : 16 }}>
            <button onClick={swap} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>⇄</button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>TO</label>
            <select value={toUnit} onChange={e => { setToUnit(e.target.value); setActiveField("from"); }} style={sel}>{UC[cat].units.map(u => <option key={u}>{u}</option>)}</select>
            <input value={toDisp} onChange={e => { setActiveField("to"); setActiveVal(e.target.value); }} style={inp2} placeholder="Result" type="number" />
          </div>
        </div>
        {fromDisp && toDisp && fromUnit !== toUnit && (
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: "#34d399", fontSize: 18 }}>≡</span>
            <span style={{ color: "#a78bfa", fontSize: isMobile ? 12 : 13, fontFamily: "monospace", fontWeight: 600 }}>{cvtFormula(fromUnit, toUnit, cat)}</span>
          </div>
        )}
        {fromDisp && toDisp && (
          <div style={{ background: "#0d2d2a", borderRadius: 10, padding: "14px 18px", border: "1px solid #064e3b" }}>
            <div style={{ color: "#34d399", fontSize: isMobile ? 16 : 22, fontFamily: "monospace", fontWeight: 800, textAlign: "center" }}>{fromDisp} {fromUnit} = {toDisp} {toUnit}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const FD = [
  { cat: "Algebra", color: "#818cf8", f: [{ n: "Quadratic Formula", f: "x = (−b ± √(b²−4ac)) / (2a)", d: "Roots of ax²+bx+c=0", v: "a,b,c = coefficients" },{ n: "Discriminant", f: "Δ = b²−4ac", d: "Δ>0: two roots  Δ=0: one  Δ<0: none", v: "" },{ n: "Difference of Squares", f: "a²−b² = (a+b)(a−b)", d: "Factorise", v: "" },{ n: "Completing the Square", f: "ax²+bx+c = a(x+b/2a)²+(c−b²/4a)", d: "Vertex form", v: "" }] },
  { cat: "Indices", color: "#fb923c", f: [{ n: "Multiplication Law", f: "aᵐ×aⁿ = aᵐ⁺ⁿ", d: "Same base: add exponents", v: "" },{ n: "Division Law", f: "aᵐ÷aⁿ = aᵐ⁻ⁿ", d: "Same base: subtract", v: "" },{ n: "Power of Power", f: "(aᵐ)ⁿ = aᵐⁿ", d: "Multiply exponents", v: "" },{ n: "Zero Exponent", f: "a⁰ = 1", d: "Any non-zero base", v: "a≠0" },{ n: "Negative Exponent", f: "a⁻ⁿ = 1/aⁿ", d: "Reciprocal", v: "" },{ n: "Fractional Exponent", f: "a^(m/n) = ⁿ√(aᵐ)", d: "Denominator is root", v: "" }] },
  { cat: "Logarithms", color: "#34d399", f: [{ n: "Log Product", f: "logₐ(xy) = logₐx+logₐy", d: "Log of product", v: "" },{ n: "Log Quotient", f: "logₐ(x/y) = logₐx−logₐy", d: "Log of quotient", v: "" },{ n: "Log Power", f: "logₐ(xⁿ) = n·logₐx", d: "Bring exponent down", v: "" },{ n: "Change of Base", f: "logₐx = log x / log a", d: "Convert log bases", v: "" },{ n: "Natural Log", f: "ln(eˣ)=x  and  e^(lnx)=x", d: "Inverse functions", v: "" }] },
  { cat: "Trigonometry", color: "#38bdf8", f: [{ n: "SOH-CAH-TOA", f: "sinθ=O/H  cosθ=A/H  tanθ=O/A", d: "Right-angle trig", v: "O=opp A=adj H=hyp" },{ n: "Sine Rule", f: "a/sinA = b/sinB = c/sinC", d: "Any triangle", v: "" },{ n: "Cosine Rule", f: "a² = b²+c²−2bc·cosA", d: "SAS or SSS triangle", v: "" },{ n: "Area of Triangle", f: "Area = ½ab·sinC", d: "Two sides + included angle", v: "" },{ n: "Pythagorean Identity", f: "sin²θ+cos²θ = 1", d: "Fundamental identity", v: "" },{ n: "Double Angle Sin", f: "sin2θ = 2sinθcosθ", d: "", v: "" },{ n: "Double Angle Cos", f: "cos2θ = cos²θ−sin²θ = 2cos²θ−1 = 1−2sin²θ", d: "Three forms", v: "" }] },
  { cat: "Differentiation", color: "#a3e635", f: [{ n: "Power Rule", f: "d/dx(xⁿ) = nxⁿ⁻¹", d: "", v: "" },{ n: "Chain Rule", f: "d/dx[f(g(x))] = f'(g(x))·g'(x)", d: "Composite functions", v: "" },{ n: "Product Rule", f: "d/dx[uv] = u'v+uv'", d: "", v: "" },{ n: "Quotient Rule", f: "d/dx[u/v] = (u'v−uv')/v²", d: "", v: "" },{ n: "Key Derivatives", f: "d/dx(eˣ)=eˣ  d/dx(lnx)=1/x  d/dx(sinx)=cosx  d/dx(cosx)=−sinx", d: "Memorise these", v: "" }] },
  { cat: "Integration", color: "#2dd4bf", f: [{ n: "Power Rule", f: "∫xⁿdx = xⁿ⁺¹/(n+1)+C", d: "n≠−1", v: "" },{ n: "Key Integrals", f: "∫eˣdx=eˣ+C  ∫(1/x)dx=ln|x|+C  ∫cosxdx=sinx+C  ∫sinxdx=−cosx+C", d: "", v: "" },{ n: "Integration by Parts", f: "∫u dv = uv−∫v du", d: "LIATE order", v: "" },{ n: "Definite Integral", f: "∫[a→b]f(x)dx = F(b)−F(a)", d: "", v: "" }] },
  { cat: "SUVAT", color: "#f472b6", f: [{ n: "v=u+at", f: "v = u+at", d: "No displacement", v: "u=initial  v=final  a=accel  t=time" },{ n: "s=ut+½at²", f: "s = ut+½at²", d: "No final velocity", v: "" },{ n: "v²=u²+2as", f: "v² = u²+2as", d: "No time", v: "" },{ n: "s=½(u+v)t", f: "s = ½(u+v)t", d: "Average velocity", v: "" }] },
  { cat: "Statistics", color: "#f87171", f: [{ n: "Mean", f: "x̄ = Σx/n", d: "", v: "" },{ n: "Population SD", f: "σ² = Σ(x−x̄)²/n", d: "Population variance", v: "" },{ n: "Sample SD", f: "s² = Σ(x−x̄)²/(n−1)", d: "Bessel's correction", v: "" },{ n: "Binomial", f: "P(X=r) = C(n,r)·pʳ·(1−p)ⁿ⁻ʳ", d: "r successes in n trials", v: "" },{ n: "Z-Score", f: "Z = (X−μ)/σ", d: "Standardise", v: "" }] },
];

function FormulaSheet() {
  const isMobile = useWindowWidth() < 600;
  const [search, setSearch] = useState(""); const [open, setOpen] = useState({}); const [copied, setCopied] = useState("");
  const filtered = FD.map(c => ({ ...c, f: c.f.filter(f => !search || f.n.toLowerCase().includes(search.toLowerCase()) || f.f.toLowerCase().includes(search.toLowerCase()) || f.d.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.f.length > 0);
  const copy = (text, id) => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(id); setTimeout(() => setCopied(""), 1500); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <span style={{ fontSize: 26 }}>📐</span>
        <div style={{ flex: 1 }}><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>Formula Sheet</div><div style={{ color: "#64748b", fontSize: isMobile ? 11 : 12 }}>Pure Maths · Mechanics · Statistics</div></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", width: isMobile ? "100%" : 180 }} />
      </div>
      {filtered.map(cat => (
        <div key={cat.cat} style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
          <div onClick={() => setOpen(o => ({ ...o, [cat.cat]: !o[cat.cat] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", borderLeft: `4px solid ${cat.color}`, background: open[cat.cat] ? "#1e293b" : "transparent" }}>
            <span style={{ flex: 1, color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 14 }}>{cat.cat}</span>
            <span style={{ background: cat.color + "22", color: cat.color, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{cat.f.length}</span>
            <span style={{ color: "#475569", fontSize: 13 }}>{open[cat.cat] || search ? "▲" : "▼"}</span>
          </div>
          {(open[cat.cat] || search) && (
            <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 8, borderLeft: `4px solid ${cat.color}` }}>
              {cat.f.map((f, i) => {
                const id = cat.cat + i;
                return (
                  <div key={i} style={{ background: "#1e293b", borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 12 : 13 }}>{f.n}</span>
                      <button onClick={() => copy(f.f, id)} style={{ background: copied === id ? "#0d2d2a" : "#334155", color: copied === id ? "#34d399" : "#94a3b8", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>{copied === id ? "✓ Copied" : "Copy"}</button>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 7, padding: "8px 12px", fontFamily: "monospace", fontSize: isMobile ? 12 : 14, color: cat.color, fontWeight: 600, overflowX: "auto" }}>{f.f}</div>
                    {f.d && <div style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 12 }}>{f.d}</div>}
                    {f.v && <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>{f.v}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {filtered.length === 0 && <div style={{ background: "#0f172a", borderRadius: 10, padding: 40, textAlign: "center", color: "#475569" }}>No formulas match "{search}"</div>}
    </div>
  );
}

function gcdE(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function fmtFrac(num, den) { if (den === 0) return "undefined"; const sign = (num < 0) !== (den < 0) ? "-" : ""; const n = Math.abs(Math.round(num)), d = Math.abs(Math.round(den)), g = gcdE(n, d), rn = n / g, rd = d / g; if (rd === 1) return sign + rn; return sign + rn + "/" + rd; }
function fmtN(val) { if (!isFinite(val)) return "undefined"; const r = Math.round(val * 1e9) / 1e9; if (Number.isInteger(r)) return r.toString(); return parseFloat(r.toPrecision(8)).toString(); }
function exactRoots(a, b, disc) { if (disc < 0) return null; const sq = Math.sqrt(disc), si = Math.round(sq); if (Math.abs(si * si - disc) > 1e-9) return null; return { r1: fmtFrac(-b + si, 2 * a), r2: fmtFrac(-b - si, 2 * a) }; }

function EquationSolver() {
  const isMobile = useWindowWidth() < 600;
  const [solver, setSolver] = useState("quad");
  const [qa, setQa] = useState("1"); const [qb, setQb] = useState("-3"); const [qc, setQc] = useState("2");
  const [la, setLa] = useState("2"); const [lb, setLb] = useState("-6");
  const [s1a, setS1a] = useState("2"); const [s1b, setS1b] = useState("1"); const [s1c, setS1c] = useState("5");
  const [s2a, setS2a] = useState("1"); const [s2b, setS2b] = useState("-3"); const [s2c, setS2c] = useState("0");
  const [ca, setCa] = useState("1"); const [cb, setCb] = useState("-6"); const [cc, setCc] = useState("11"); const [cd, setCd] = useState("-6");
  const solveQuad = () => {
    const a = parseFloat(qa), b = parseFloat(qb), c = parseFloat(qc);
    if (isNaN(a) || isNaN(b) || isNaN(c)) return { error: "Enter valid numbers" };
    if (a === 0) return { error: "'a' cannot be 0" };
    const disc = b * b - 4 * a * c;
    const steps = [`Formula: x = (−b ± √(b²−4ac)) / (2a)`, `a=${a}, b=${b}, c=${c}`, `Δ = ${b}² − 4×${a}×${c} = ${b*b} − ${4*a*c} = ${disc}`];
    if (disc > 0) { const ex = exactRoots(a, b, disc); const r1 = (-b + Math.sqrt(disc)) / (2 * a), r2 = (-b - Math.sqrt(disc)) / (2 * a); steps.push("Δ > 0 → two distinct real roots"); steps.push(`x₁ = (${-b} + √${disc}) / ${2*a} = ${fmtN(r1)}`); steps.push(`x₂ = (${-b} − √${disc}) / ${2*a} = ${fmtN(r2)}`); if (ex) steps.push(`Exact: x₁=${ex.r1},  x₂=${ex.r2}`); return { steps, answer: ex ? `x₁ = ${ex.r1},  x₂ = ${ex.r2}` : `x₁ = ${fmtN(r1)},  x₂ = ${fmtN(r2)}`, type: "Two distinct real roots", color: "#34d399" }; }
    if (disc === 0) { const r = fmtFrac(-b, 2 * a); steps.push("Δ = 0 → one repeated root"); steps.push(`x = −b/(2a) = ${r}`); return { steps, answer: `x = ${r}  (repeated)`, type: "One repeated root", color: "#facc15" }; }
    const re = fmtFrac(-b, 2 * a), im = fmtN(Math.sqrt(-disc) / (2 * Math.abs(a))); steps.push("Δ < 0 → complex roots"); steps.push(`Real part: ${re}`); steps.push(`Imaginary part: ±${im}i`); return { steps, answer: `x = ${re} ± ${im}i`, type: "No real roots (complex)", color: "#f87171" };
  };
  const solveLinear = () => {
    const a = parseFloat(la), b = parseFloat(lb);
    if (isNaN(a) || isNaN(b)) return { error: "Enter valid numbers" };
    if (a === 0) return { error: b === 0 ? "Infinite solutions (0=0)" : "No solution (contradiction)" };
    const x = fmtFrac(-b, a); return { steps: [`${a}x + (${b}) = 0`, `${a}x = ${-b}`, `x = ${-b}/${a} = ${x}`], answer: `x = ${x}`, type: "Unique solution", color: "#34d399" };
  };
  const solveSimult = () => {
    const a1 = parseFloat(s1a), b1 = parseFloat(s1b), c1 = parseFloat(s1c), a2 = parseFloat(s2a), b2 = parseFloat(s2b), c2 = parseFloat(s2c);
    if ([a1,b1,c1,a2,b2,c2].some(isNaN)) return { error: "Enter valid numbers" };
    const det = a1 * b2 - a2 * b1;
    const steps = [`Eq1: ${a1}x + ${b1}y = ${c1}`, `Eq2: ${a2}x + ${b2}y = ${c2}`, `det = ${a1}×${b2} − ${a2}×${b1} = ${det}`];
    if (Math.abs(det) < 1e-12) { const ok = Math.abs(a1*c2 - a2*c1) < 1e-9 && Math.abs(b1*c2 - b2*c1) < 1e-9; steps.push("det = 0 → parallel or identical"); if (ok) { steps.push("Same line → infinite solutions"); return { steps, answer: "Infinite solutions", type: "Dependent", color: "#facc15" }; } steps.push("Parallel → no solution"); return { steps, answer: "No solution", type: "Inconsistent", color: "#f87171" }; }
    const xn = c1*b2 - c2*b1, yn = a1*c2 - a2*c1, xs = fmtFrac(xn, det), ys = fmtFrac(yn, det);
    steps.push(`x = (${c1}×${b2} − ${c2}×${b1}) / ${det} = ${xn}/${det} = ${xs}`);
    steps.push(`y = (${a1}×${c2} − ${a2}×${c1}) / ${det} = ${yn}/${det} = ${ys}`);
    return { steps, answer: `x = ${xs},  y = ${ys}`, type: "Unique solution", color: "#34d399" };
  };
  const solveCubic = () => {
    const a = parseFloat(ca), b = parseFloat(cb), c = parseFloat(cc), d = parseFloat(cd);
    if ([a,b,c,d].some(isNaN)) return { error: "Enter valid numbers" };
    if (a === 0) return { error: "'a' cannot be 0" };
    const f = x => a*x**3 + b*x**2 + c*x + d, fp = x => 3*a*x**2 + 2*b*x + c;
    const roots = [], seen = new Set();
    const tryRoot = s => { let x = s; for (let i = 0; i < 200; i++) { const fx = f(x), fpx = fp(x); if (Math.abs(fpx) < 1e-14) break; const dx = fx/fpx; x -= dx; if (Math.abs(dx) < 1e-12) break; } const xr = Math.round(x * 1e6) / 1e6; if (Math.abs(f(xr)) < 1e-5 && !seen.has(xr)) { seen.add(xr); roots.push(xr); } };
    for (let s = -30; s <= 30; s += 0.2) tryRoot(s);
    const steps = [`${a}x³ + ${b}x² + ${c}x + ${d} = 0`, "Newton-Raphson with multiple start points in [−30, 30]"];
    if (!roots.length) return { steps, answer: "No real roots found in [−30, 30]", type: "No real roots", color: "#f87171" };
    roots.forEach((r, i) => steps.push(`x${i+1} ≈ ${r}  [f(${r}) ≈ ${fmtN(f(r))}]`));
    return { steps, answer: roots.map((r, i) => `x${i+1} ≈ ${r}`).join(",  "), type: `${roots.length} real root(s)`, color: "#34d399" };
  };
  const SV = { quad: { label: "Quadratic ax²+bx+c=0", fn: solveQuad }, linear: { label: "Linear ax+b=0", fn: solveLinear }, simult: { label: "Simultaneous 2×2", fn: solveSimult }, cubic: { label: "Cubic ax³+bx²+cx+d=0", fn: solveCubic } };
  const res = SV[solver].fn();
  const IS = { background: "#0f172a", color: "#f8fafc", border: "1px solid #334155", borderRadius: 7, padding: "8px 6px", fontSize: isMobile ? 13 : 15, fontFamily: "monospace", outline: "none", width: isMobile ? 60 : 80, textAlign: "center" };
  const LB = { color: "#64748b", fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 };
  const RS = { display: "flex", gap: isMobile ? 8 : 12, alignItems: "flex-end", flexWrap: "wrap" };
  const S = s => <span style={{ color: "#a78bfa", fontSize: 16, marginBottom: 12 }}>{s}</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>🧮</span>
        <div><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>Equation Solver</div><div style={{ color: "#64748b", fontSize: isMobile ? 11 : 12 }}>Exact step-by-step solutions</div></div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.entries(SV).map(([k, v]) => <button key={k} onClick={() => setSolver(k)} style={{ background: solver === k ? "#6366f1" : "#1e293b", color: solver === k ? "#fff" : "#94a3b8", border: `1px solid ${solver === k ? "#6366f1" : "#334155"}`, borderRadius: 8, padding: isMobile ? "5px 8px" : "7px 14px", cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: solver === k ? 700 : 400 }}>{v.label}</button>)}
      </div>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: isMobile ? 12 : 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {solver === "quad" && <div style={RS}><div style={LB}><span>a</span><input value={qa} onChange={e => setQa(e.target.value)} style={IS} /></div>{S("x²+")}<div style={LB}><span>b</span><input value={qb} onChange={e => setQb(e.target.value)} style={IS} /></div>{S("x+")}<div style={LB}><span>c</span><input value={qc} onChange={e => setQc(e.target.value)} style={IS} /></div>{S("= 0")}</div>}
        {solver === "linear" && <div style={RS}><div style={LB}><span>a</span><input value={la} onChange={e => setLa(e.target.value)} style={IS} /></div>{S("x+")}<div style={LB}><span>b</span><input value={lb} onChange={e => setLb(e.target.value)} style={IS} /></div>{S("= 0")}</div>}
        {solver === "simult" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={RS}><div style={LB}><span>a₁</span><input value={s1a} onChange={e => setS1a(e.target.value)} style={IS} /></div>{S("x+")}<div style={LB}><span>b₁</span><input value={s1b} onChange={e => setS1b(e.target.value)} style={IS} /></div>{S("y=")}<div style={LB}><span>c₁</span><input value={s1c} onChange={e => setS1c(e.target.value)} style={IS} /></div></div><div style={RS}><div style={LB}><span>a₂</span><input value={s2a} onChange={e => setS2a(e.target.value)} style={IS} /></div>{S("x+")}<div style={LB}><span>b₂</span><input value={s2b} onChange={e => setS2b(e.target.value)} style={IS} /></div>{S("y=")}<div style={LB}><span>c₂</span><input value={s2c} onChange={e => setS2c(e.target.value)} style={IS} /></div></div></div>}
        {solver === "cubic" && <div style={RS}><div style={LB}><span>a</span><input value={ca} onChange={e => setCa(e.target.value)} style={IS} /></div>{S("x³+")}<div style={LB}><span>b</span><input value={cb} onChange={e => setCb(e.target.value)} style={IS} /></div>{S("x²+")}<div style={LB}><span>c</span><input value={cc} onChange={e => setCc(e.target.value)} style={IS} /></div>{S("x+")}<div style={LB}><span>d</span><input value={cd} onChange={e => setCd(e.target.value)} style={IS} /></div>{S("= 0")}</div>}
        {res.error ? (
          <div style={{ background: "#1a0000", borderRadius: 8, padding: "12px 16px", color: "#f87171", fontFamily: "monospace", fontSize: 13 }}>{res.error}</div>
        ) : (
          <>
            <div style={{ background: "#1e293b", borderRadius: 9, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: "#475569", fontSize: 11, fontWeight: 700 }}>STEPS</div>
              {res.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", borderBottom: "1px solid #334155" }}>
                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ color: "#f8fafc", fontFamily: "monospace", fontSize: isMobile ? 11 : 13 }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#0d2d2a", borderRadius: 10, padding: "14px 18px", border: `1px solid ${res.color}44` }}>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{res.type}</div>
              <div style={{ color: res.color, fontSize: isMobile ? 16 : 20, fontFamily: "monospace", fontWeight: 800 }}>{res.answer}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SD_SAMPLE = "12,15,11,18,22,14,19,23,16,20,13,17,25,14,21,15,19,16,18,22";
function parseNums(raw) { return raw.split(/[\s,;\n]+/).map(s => parseFloat(s.trim())).filter(v => !isNaN(v)); }
function calcStats(data) {
  if (!data.length) return null;
  const n = data.length, sorted = [...data].sort((a, b) => a - b), sum = data.reduce((a, b) => a + b, 0), mean = sum / n;
  const getQ = (arr, p) => { const pos = p * (arr.length - 1), lo = Math.floor(pos), hi = Math.ceil(pos); return arr[lo] + (arr[hi] - arr[lo]) * (pos - lo); };
  const median = getQ(sorted, 0.5), q1 = getQ(sorted, 0.25), q3 = getQ(sorted, 0.75), iqr = q3 - q1;
  const freq = {}; data.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxF = Math.max(...Object.values(freq));
  const mode = maxF === 1 ? ["None"] : Object.entries(freq).filter(([, f]) => f === maxF).map(([v]) => parseFloat(v));
  const popVar = data.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sampVar = n > 1 ? data.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : NaN;
  const popSD = Math.sqrt(popVar), sampSD = Math.sqrt(sampVar);
  const cv = mean !== 0 ? (sampSD / mean) * 100 : NaN, skew = n > 2 ? (3 * (mean - median)) / (sampSD || 1) : NaN;
  return { n, sum, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0], mean, median, q1, q3, iqr, mode, popVar, sampVar, popSD, sampSD, cv, skew, sorted, freq };
}

function StatisticsCalc() {
  const isMobile = useWindowWidth() < 600;
  const [raw, setRaw] = useState(SD_SAMPLE);
  const [sortBy, setSortBy] = useState("value");
  const chartRef = useRef(null);
  const data = useMemo(() => parseNums(raw), [raw]);
  const st = useMemo(() => calcStats(data), [data]);

  const drawChart = useCallback(() => {
    const canvas = chartRef.current; if (!canvas || !st) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight || 200;
    if (!W) return;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
    const entries = Object.entries(st.freq).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    if (!entries.length) return;
    const maxF = Math.max(...entries.map(([, f]) => f));
    const pad = 40, bw = (W - pad * 2) / entries.length * 0.7, gap = (W - pad * 2) / entries.length * 0.3;
    entries.forEach(([v, f], i) => {
      const x = pad + i * (bw + gap), bh = (f / maxF) * (H - 60), y = H - 30 - bh, col = GCOLS[i % GCOLS.length];
      ctx.fillStyle = col + "55"; ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, bw, bh);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(v, x + bw / 2, H - 15);
      ctx.fillStyle = col; ctx.fillText(f, x + bw / 2, y - 4);
    });
    for (let i = 0; i <= maxF; i++) {
      const y = H - 30 - (i / maxF) * (H - 60);
      ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      ctx.fillStyle = "#334155"; ctx.font = "9px monospace"; ctx.textAlign = "right"; ctx.fillText(i, pad - 4, y + 3);
    }
  }, [st]);

  useEffect(() => { drawChart(); }, [drawChart]);
  useEffect(() => { window.addEventListener("resize", drawChart); return () => window.removeEventListener("resize", drawChart); }, [drawChart]);

  const sRow = (label, val, color = "#f8fafc") => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid #1e293b" }}>
      <span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 12 }}>{label}</span>
      <span style={{ color, fontSize: isMobile ? 12 : 13, fontFamily: "monospace", fontWeight: 600 }}>
        {typeof val === "number" ? isNaN(val) ? "N/A" : parseFloat(val.toPrecision(8)).toString() : val}
      </span>
    </div>
  );
  const fe = Object.entries(st?.freq || {}).sort((a, b) => sortBy === "value" ? parseFloat(a[0]) - parseFloat(b[0]) : b[1] - a[1]);
  const modeDisplay = st ? st.mode.slice(0, 5).join(", ") + (st.mode.length > 5 ? ` …+${st.mode.length - 5} more` : "") : "-";
  let sl = null;
  if (st && data.every(v => v >= 0 && v < 1000)) { const tmp = {}; st.sorted.forEach(v => { const stem = Math.floor(v / 10), leaf = Math.round(v % 10); if (!tmp[stem]) tmp[stem] = []; tmp[stem].push(leaf); }); sl = tmp; }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>📊</span>
        <div style={{ flex: 1 }}><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>Statistics Calculator</div><div style={{ color: "#64748b", fontSize: isMobile ? 11 : 12 }}>Descriptive stats · frequency table · chart</div></div>
        {data.length > 0 && <span style={{ background: "#6366f144", color: "#818cf8", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>n={data.length}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={3} placeholder="Numbers separated by commas, spaces, or newlines"
          style={{ flex: 1, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: isMobile ? 12 : 13, resize: "vertical", outline: "none", fontFamily: "monospace" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => setRaw(SD_SAMPLE)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>Example</button>
          <button onClick={() => setRaw("")} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>Clear</button>
        </div>
      </div>
      {!st && <div style={{ background: "#0f172a", borderRadius: 10, padding: 30, textAlign: "center", color: "#475569" }}>Enter numbers above</div>}
      {st && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{ padding: "10px 14px", background: "#1e293b", color: "#f8fafc", fontWeight: 700, fontSize: 13 }}>Central Tendency</div>
              {sRow("Count (n)", st.n, "#38bdf8")}{sRow("Sum (Σx)", st.sum, "#38bdf8")}{sRow("Mean (x̄)", st.mean, "#34d399")}{sRow("Median", st.median, "#34d399")}{sRow("Mode", modeDisplay, "#a78bfa")}
            </div>
            <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{ padding: "10px 14px", background: "#1e293b", color: "#f8fafc", fontWeight: 700, fontSize: 13 }}>Spread</div>
              {sRow("Min", st.min, "#fb923c")}{sRow("Max", st.max, "#fb923c")}{sRow("Range", st.range, "#fb923c")}{sRow("Q1", st.q1, "#60a5fa")}{sRow("Q3", st.q3, "#60a5fa")}{sRow("IQR", st.iqr, "#60a5fa")}
            </div>
            <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{ padding: "10px 14px", background: "#1e293b", color: "#f8fafc", fontWeight: 700, fontSize: 13 }}>Variance & SD</div>
              {sRow("Pop. Variance (σ²)", st.popVar, "#c084fc")}{sRow("Pop. SD (σ)", st.popSD, "#c084fc")}{sRow("Sample Var (s²)", st.sampVar, "#a78bfa")}{sRow("Sample SD (s)", st.sampSD, "#a78bfa")}{sRow("CV%", st.cv, "#f9a8d4")}{sRow("Skewness", st.skew, "#facc15")}
            </div>
            <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{ padding: "10px 14px", background: "#1e293b", color: "#f8fafc", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Frequency Table</span>
                <div style={{ display: "flex", gap: 4 }}>{["value","freq"].map(k => <button key={k} onClick={() => setSortBy(k)} style={{ background: sortBy === k ? "#6366f1" : "#334155", color: "#fff", border: "none", borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 10 }}>{k}</button>)}</div>
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 10px", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#475569", fontSize: 10 }}>Value</span><span style={{ color: "#475569", fontSize: 10 }}>Freq</span><span style={{ color: "#475569", fontSize: 10 }}>%</span>
                </div>
                {fe.map(([v, f]) => (
                  <div key={v} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 10px", borderBottom: "1px solid #0f172a" }}>
                    <span style={{ color: "#f8fafc", fontFamily: "monospace", fontSize: 12 }}>{v}</span>
                    <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 12 }}>{f}</span>
                    <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{((f / st.n) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: 14, border: "1px solid #1e293b" }}>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Frequency Chart</div>
            <canvas ref={chartRef} style={{ width: "100%", height: 200, borderRadius: 8, display: "block" }} />
          </div>
          {sl && (
            <div style={{ background: "#0f172a", borderRadius: 10, padding: 14, border: "1px solid #1e293b" }}>
              <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Stem-and-Leaf</div>
              <div style={{ color: "#475569", fontSize: 11, marginBottom: 8 }}>Stem = tens  |  Leaf = units</div>
              {Object.entries(sl).sort((a, b) => Number(a[0]) - Number(b[0])).map(([stem, leaves]) => (
                <div key={stem} style={{ display: "flex", gap: 10, fontFamily: "monospace", fontSize: 13 }}>
                  <span style={{ color: "#a78bfa", minWidth: 30, textAlign: "right" }}>{stem}</span>
                  <span style={{ color: "#334155" }}>|</span>
                  <span style={{ color: "#f8fafc" }}>{[...leaves].sort((a, b) => a - b).join(" ")}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: "#0f172a", borderRadius: 10, padding: 14, border: "1px solid #1e293b" }}>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Sorted Data</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {st.sorted.map((v, i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "4px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "#475569", fontSize: 9 }}>{i + 1}</span>
                  <span style={{ color: "#f8fafc", fontSize: 12, fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mkS = (r, c) => Array.from({ length: r }, () => Array(c).fill(""));
const cloneM = m => m.map(r => [...r]);
const toNum = m => m.map(r => r.map(v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; }));
const mAdd = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
const mSub = (A, B) => A.map((r, i) => r.map((v, j) => v - B[i][j]));
const mMul = (A, B) => { const rA = A.length, cA = A[0].length, cB = B[0].length; if (cA !== B.length) return null; return Array.from({ length: rA }, (_, i) => Array.from({ length: cB }, (_, j) => A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0))); };
const mScale = (A, k) => A.map(r => r.map(v => v * k));
const mTrans = A => A[0].map((_, j) => A.map(r => r[j]));
const det2 = A => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const det3 = A => A[0][0] * (A[1][1]*A[2][2] - A[1][2]*A[2][1]) - A[0][1] * (A[1][0]*A[2][2] - A[1][2]*A[2][0]) + A[0][2] * (A[1][0]*A[2][1] - A[1][1]*A[2][0]);
const inv2 = A => { const d = det2(A); if (Math.abs(d) < 1e-12) return null; return mScale([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]], 1 / d); };
const inv3 = A => { const d = det3(A); if (Math.abs(d) < 1e-12) return null; const C = [[0,0,0],[0,0,0],[0,0,0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const m = A.filter((_, r) => r !== i).map(r => r.filter((_, c) => c !== j)); C[j][i] = ((i + j) % 2 ? -1 : 1) * det2(m); } return mScale(C, 1 / d); };
const mPow = (A, n) => { if (A.length !== A[0].length) return null; let R = Array.from({ length: A.length }, (_, i) => Array.from({ length: A.length }, (_, j) => i === j ? 1 : 0)); let B = cloneM(A); let p = Math.abs(Math.round(n)); while (p > 0) { if (p % 2 === 1) R = mMul(R, B); B = mMul(B, B); p = Math.floor(p / 2); } if (n < 0) { if (A.length === 2) return inv2(R); if (A.length === 3) return inv3(R); return null; } return R; };
const fM = v => { const r = Math.round(v * 1e8) / 1e8; return isNaN(r) ? "?" : r.toString(); };

// Defined at module level so React never unmounts/remounts it on MatrixCalc re-renders
function MatrixGrid({ m, rows, cols, onC, readOnly = false, vals, cellW, isMobile }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 3, background: "#0f172a", borderRadius: 8, padding: 8, border: "1px solid #334155" }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: cols }, (_, j) => (
              <input key={j} readOnly={readOnly}
                value={readOnly ? fM(vals?.[i]?.[j] ?? 0) : (m?.[i]?.[j] ?? "")}
                onChange={e => !readOnly && onC(i, j, e.target.value)}
                placeholder="0"
                style={{ width: cellW, background: readOnly ? "#0a0f1e" : "#1e293b", color: readOnly ? "#34d399" : "#f8fafc", border: `1px solid ${readOnly ? "#064e3b" : "#334155"}`, borderRadius: 6, padding: "6px 4px", fontSize: isMobile ? 12 : 13, fontFamily: "monospace", outline: "none", textAlign: "center" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatrixCalc() {
  const isMobile = useWindowWidth() < 600;
  const SZ = ["2×2", "2×3", "3×2", "3×3"];
  const [sA, setSA] = useState("2×2"); const [sB, setSB] = useState("2×2");
  const [op, setOp] = useState("add"); const [sc, setSc] = useState("2"); const [pw, setPw] = useState("2");
  const ps = s => { const [r, c] = s.split("×").map(Number); return { r, c }; };
  const { r: rA, c: cA } = ps(sA); const { r: rB, c: cB } = ps(sB);
  const [mA, setMA] = useState(() => mkS(2, 2));
  const [mB, setMB] = useState(() => mkS(2, 2));
  const setA = (i, j, v) => setMA(m => { const n = cloneM(m); n[i][j] = v; return n; });
  const setB = (i, j, v) => setMB(m => { const n = cloneM(m); n[i][j] = v; return n; });
  useEffect(() => setMA(mkS(rA, cA)), [sA]);
  useEffect(() => setMB(mkS(rB, cB)), [sB]);
  const padM = (m, r, c) => { const res = mkS(r, c); for (let i = 0; i < Math.min(m.length, r); i++) for (let j = 0; j < Math.min((m[0] || []).length, c); j++) res[i][j] = m[i][j]; return res; };
  const A = toNum(padM(mA, rA, cA)), B = toNum(padM(mB, rB, cB));

  const calc = () => {
    const k = parseFloat(sc), p = parseInt(pw);
    if (op === "add") { if (rA !== rB || cA !== cB) return { error: `Size mismatch: A is ${rA}×${cA}, B is ${rB}×${cB}` }; return { result: mAdd(A, B), steps: ["C[i][j] = A[i][j] + B[i][j]"] }; }
    if (op === "sub") { if (rA !== rB || cA !== cB) return { error: "Sizes must match for subtraction" }; return { result: mSub(A, B), steps: ["C[i][j] = A[i][j] − B[i][j]"] }; }
    if (op === "mul") { if (cA !== rB) return { error: `Cannot multiply: A cols (${cA}) ≠ B rows (${rB})` }; return { result: mMul(A, B), steps: [`Result is ${rA}×${cB}`, "C[i][j] = Σ A[i][k] × B[k][j]"] }; }
    if (op === "scale") { if (isNaN(k)) return { error: "Enter valid scalar" }; return { result: mScale(A, k), steps: [`Each element × ${k}`] }; }
    if (op === "transpose") return { result: mTrans(A), steps: ["C[i][j] = A[j][i]", `${rA}×${cA} → ${cA}×${rA}`] };
    if (op === "det") {
      if (rA !== cA) return { error: `Square matrix required (got ${rA}×${cA})` };
      if (rA === 2) { const d = det2(A); return { scalar: d, steps: [`det = ad−bc = (${A[0][0]})(${A[1][1]}) − (${A[0][1]})(${A[1][0]}) = ${fM(d)}`] }; }
      if (rA === 3) { const d = det3(A), m00 = A[1][1]*A[2][2]-A[1][2]*A[2][1], m01 = A[1][0]*A[2][2]-A[1][2]*A[2][0], m02 = A[1][0]*A[2][1]-A[1][1]*A[2][0]; return { scalar: d, steps: ["Cofactor expansion along row 1", `M₀₀=${fM(m00)}  M₀₁=${fM(m01)}  M₀₂=${fM(m02)}`, `det = ${A[0][0]}×${fM(m00)} − ${A[0][1]}×${fM(m01)} + ${A[0][2]}×${fM(m02)} = ${fM(d)}`] }; }
      return { error: "det only supported for 2×2 or 3×3" };
    }
    if (op === "inv") {
      if (rA !== cA) return { error: "Square matrix required" };
      if (rA === 2) { const d = det2(A); if (Math.abs(d) < 1e-12) return { error: "Singular (det=0): no inverse" }; return { result: inv2(A), steps: [`det = ${fM(d)}`, "A⁻¹ = (1/det) × adj(A)"] }; }
      if (rA === 3) { const d = det3(A); if (Math.abs(d) < 1e-12) return { error: "Singular (det=0): no inverse" }; return { result: inv3(A), steps: [`det = ${fM(d)}`, "A⁻¹ = (1/det) × adj(A)"] }; }
      return { error: "Inverse only supported for 2×2 or 3×3" };
    }
    if (op === "pow") { if (rA !== cA) return { error: "Square matrix required" }; if (isNaN(p)) return { error: "Enter integer power" }; const rr = mPow(A, p); if (!rr) return { error: "Could not compute" }; return { result: rr, steps: [`A^${p} via repeated squaring`] }; }
    return { error: "Unknown operation" };
  };

  const res = calc();
  const nb = ["add", "sub", "mul"].includes(op);
  const cellW = isMobile ? 44 : 52;
  const OPS = [{ k: "add", l: "A+B" }, { k: "sub", l: "A−B" }, { k: "mul", l: "A×B" }, { k: "scale", l: "k×A" }, { k: "transpose", l: "Aᵀ" }, { k: "det", l: "det(A)" }, { k: "inv", l: "A⁻¹" }, { k: "pow", l: "Aⁿ" }];
  const inpStyle = { width: 80, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: 8, fontSize: 15, fontFamily: "monospace", outline: "none", textAlign: "center" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>🔲</span>
        <div><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>Matrix Calculator</div><div style={{ color: "#64748b", fontSize: isMobile ? 11 : 12 }}>Add · Multiply · Determinant · Inverse · Power</div></div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {OPS.map(o => <button key={o.k} onClick={() => setOp(o.k)} style={{ background: op === o.k ? "#6366f1" : "#1e293b", color: op === o.k ? "#fff" : "#94a3b8", border: `1px solid ${op === o.k ? "#6366f1" : "#334155"}`, borderRadius: 7, padding: isMobile ? "5px 8px" : "6px 12px", cursor: "pointer", fontSize: isMobile ? 11 : 12, fontFamily: "monospace", fontWeight: op === o.k ? 700 : 400 }}>{o.l}</button>)}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>Matrix A</span>
            <select value={sA} onChange={e => setSA(e.target.value)} style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 12, outline: "none" }}>{SZ.map(s => <option key={s}>{s}</option>)}</select>
            <button onClick={() => setMA(mkS(rA, cA))} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>Clear</button>
          </div>
          <MatrixGrid m={mA} rows={rA} cols={cA} onC={setA} cellW={cellW} isMobile={isMobile} />
        </div>
        {nb && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 14 }}>Matrix B</span>
              <select value={sB} onChange={e => setSB(e.target.value)} style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 12, outline: "none" }}>{SZ.map(s => <option key={s}>{s}</option>)}</select>
              <button onClick={() => setMB(mkS(rB, cB))} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>Clear</button>
            </div>
            <MatrixGrid m={mB} rows={rB} cols={cB} onC={setB} cellW={cellW} isMobile={isMobile} />
          </div>
        )}
        {op === "scale" && <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 30 }}><label style={{ color: "#64748b", fontSize: 12 }}>Scalar k</label><input value={sc} onChange={e => setSc(e.target.value)} type="number" style={inpStyle} /></div>}
        {op === "pow" && <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 30 }}><label style={{ color: "#64748b", fontSize: 12 }}>Power n</label><input value={pw} onChange={e => setPw(e.target.value)} type="number" style={inpStyle} /></div>}
      </div>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #1e293b" }}>
        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Result</div>
        {res.error ? (
          <div style={{ background: "#1a0000", borderRadius: 8, padding: "12px 16px", color: "#f87171", fontFamily: "monospace", fontSize: 13 }}>{res.error}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {res.steps && <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{res.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 8 }}><span style={{ color: "#475569", fontSize: 11, minWidth: 20 }}>{i + 1}.</span><span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{s}</span></div>)}</div>}
            {res.scalar !== undefined && <div style={{ background: "#0d2d2a", borderRadius: 10, padding: "12px 18px", border: "1px solid #064e3b" }}><div style={{ color: "#64748b", fontSize: 11 }}>Scalar result</div><div style={{ color: "#34d399", fontSize: 24, fontFamily: "monospace", fontWeight: 800 }}>{fM(res.scalar)}</div></div>}
            {res.result && <div><div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>Result matrix</div><MatrixGrid m={null} rows={res.result.length} cols={res.result[0]?.length || 0} onC={() => {}} readOnly vals={res.result} cellW={cellW} isMobile={isMobile} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}

const RESOURCES = [
  { topic: "Fractions", color: "#f472b6", icon: "½", aiPrompt: "Give me 10-15 practice questions on fractions — adding, subtracting, multiplying, dividing mixed numbers. Label 🟢Easy 🟡Medium 🔴Hard. List all then full worked solutions.", links: [{ label: "Fractions Higher Worksheet", src: "JustMaths", url: "https://justmaths.co.uk/wp-content/uploads/2015/12/Number-H-Fractions-v2-1.pdf", pdf: true }] },
  { topic: "Indices", color: "#fb923c", icon: "xⁿ", aiPrompt: "Give me 10-15 practice questions on indices — negative, fractional powers. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Indices Exam Questions", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/various/indices_exam_questions.pdf", pdf: true }, { label: "Laws of Indices GCSE", src: "Dr Frost", url: "https://www.drfrost.org/docs/resources/241/GCSE-LawsOfIndices.pdf", pdf: true }] },
  { topic: "Surds", color: "#facc15", icon: "√—", aiPrompt: "Give me 10-15 practice questions on surds — simplifying, rationalising denominators. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Surds Questions", src: "Corbett Maths", url: "https://corbettmaths.com/wp-content/uploads/2013/02/surds-pdf1.pdf", pdf: true }, { label: "Surds Pack", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/various/surds.pdf", pdf: true }] },
  { topic: "Rearranging Formulae", color: "#34d399", icon: "⇌", aiPrompt: "Give me 10-15 practice questions on rearranging formulae. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Changing the Subject (Advanced)", src: "Corbett Maths", url: "https://corbettmaths.com/wp-content/uploads/2013/02/changing-the-subject-advanced-pdf1.pdf", pdf: true }] },
  { topic: "Quadratics", color: "#818cf8", icon: "x²", aiPrompt: "Give me 10-15 practice questions on quadratics — factorising, completing the square, discriminant. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Quadratics Exam Questions", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/various/quadratics_exam_questions.pdf", pdf: true }, { label: "A-Level Year 1 Quadratics", src: "MathsGenie", url: "https://www.mathsgenie.co.uk/a-level-year-1-questions-quadratics.html", pdf: false }] },
  { topic: "Coordinate Geometry", color: "#60a5fa", icon: "📐", aiPrompt: "Give me 10-15 practice questions on coordinate geometry. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Line & Coord. Geometry Exam Qs", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/various/line_coordinate_geometry_exam_questions.pdf", pdf: true }] },
  { topic: "Factor Theorem", color: "#a3e635", icon: "P(x)", aiPrompt: "Give me 10-15 practice questions on the Factor Theorem — polynomial division, factorising cubics. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Polynomials Intro Exam Qs", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/various/polynomials_exam_questions_intro.pdf", pdf: true }] },
  { topic: "Graph Transformations", color: "#f9a8d4", icon: "〜", aiPrompt: "Give me 10-15 practice questions on graph transformations. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Transformations Practice", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/standard_topics/various/transformations_of_graphs_practice_student_version.pdf", pdf: true }] },
  { topic: "Trigonometry", color: "#38bdf8", icon: "sinθ", aiPrompt: "Give me 10-15 practice questions on trigonometry — sine/cosine rule, solving equations. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Trig Intro Exam Equations", src: "MadAsMaths", url: "https://www.madasmaths.com/archive/maths_booklets/standard_topics/trigonometry/trigonometry_introduction_exam_equations.pdf", pdf: true }] },
  { topic: "Differentiation", color: "#c084fc", icon: "dy/dx", aiPrompt: "Give me 10-15 practice questions on differentiation — power rule, chain/product/quotient rules. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "AS Pure Differentiation", src: "MathsGenie", url: "https://www.mathsgenie.co.uk/resources/as-pure-differentiation.pdf", pdf: true }, { label: "Differentiation Practice I", src: "MadAsMaths", url: "https://madasmaths.com/archive/maths_booklets/basic_topics/calculus/differentiation_practice_i.pdf", pdf: true }] },
  { topic: "Integration", color: "#2dd4bf", icon: "∫", aiPrompt: "Give me 10-15 practice questions on integration — indefinite/definite integrals, area under curve. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Integration Exam Qs Part I", src: "MadAsMaths", url: "https://www.madasmaths.com/archive/maths_booklets/standard_topics/integration/integration_structured_exam_questions_part_i.pdf", pdf: true }] },
  { topic: "Advanced Calculus", color: "#f43f5e", icon: "∂", aiPrompt: "Give me 10-15 practice questions on advanced calculus — implicit differentiation, integration by parts, differential equations. Label 🟢Easy 🟡Medium 🔴Hard. Full solutions.", links: [{ label: "Implicit Differentiation", src: "MathsGenie", url: "https://www.mathsgenie.co.uk/resources/a-pure-implicit-differentiation.pdf", pdf: true }] },
];

function Resources({ onAskAI }) {
  const [open, setOpen] = useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>📚</span>
        <div><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15 }}>Practice Question Bank</div><div style={{ color: "#64748b", fontSize: 12 }}>Click topic to expand worksheets · Ask AI for worked examples</div></div>
      </div>
      {RESOURCES.map(r => (
        <div key={r.topic} style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
          <div onClick={() => setOpen(o => ({ ...o, [r.topic]: !o[r.topic] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", borderLeft: `4px solid ${r.color}`, background: open[r.topic] ? "#1e293b" : "transparent" }}>
            <span style={{ fontSize: 15, minWidth: 32, textAlign: "center", color: r.color, fontFamily: "monospace" }}>{r.icon}</span>
            <span style={{ flex: 1, color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>{r.topic}</span>
            <span style={{ background: r.color + "22", color: r.color, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{r.links.length} {r.links.length === 1 ? "worksheet" : "worksheets"}</span>
            <span style={{ color: "#475569", fontSize: 13 }}>{open[r.topic] ? "▲" : "▼"}</span>
          </div>
          {open[r.topic] && (
            <div style={{ padding: "8px 16px 14px", display: "flex", flexDirection: "column", gap: 5, borderLeft: `4px solid ${r.color}` }}>
              {r.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", borderRadius: 7, padding: "8px 12px", textDecoration: "none" }}>
                  <span style={{ fontSize: 13 }}>{l.pdf ? "📄" : "🌐"}</span>
                  <span style={{ flex: 1 }}><span style={{ color: "#e2e8f0", fontSize: 12, display: "block" }}>{l.label}</span><span style={{ color: "#475569", fontSize: 10 }}>{l.src}</span></span>
                  <span style={{ color: "#475569", fontSize: 11 }}>↗</span>
                </a>
              ))}
              <button onClick={() => onAskAI(r.aiPrompt)} style={{ marginTop: 4, background: "#1a1435", color: "#a78bfa", border: "1px solid #4c1d95", borderRadius: 7, padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🤖</span><span>Ask AI for {r.topic} practice questions with full solutions</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const EXAMPLES = [
  "A train leaves city A at 60 mph. Another leaves city B (300 miles away) toward A at 80 mph. When do they meet?",
  "Find the derivative of f(x) = x²·sin(x) and evaluate at x = π/4",
  "How many ways can 8 people sit around a circular table if 2 must be adjacent?",
  "If log₂(x) + log₂(x − 3) = 2, find x",
  "A ball is thrown upward at 20 m/s. Find max height and total air time.",
  "Solve: 3x + 2y = 12  and  x − y = 1",
];

function AISolver({ externalInput, onClearExternal }) {
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);
  const clearRef = useRef(onClearExternal);
  useEffect(() => { clearRef.current = onClearExternal; });
  useEffect(() => { if (externalInput) { setInp(externalInput); clearRef.current(); } }, [externalInput]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = async () => {
    if (!inp.trim() || loading) return;
    const txt = inp.trim(); setInp("");
    const newMsgs = [...msgs, { role: "user", content: txt }];
    setMsgs(newMsgs); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: "You are a friendly math tutor. Use real symbols: π √ ² × ÷ ≤ ≥ ≠ ≈ ∴ ∞. Never use LaTeX. Number every step. Add a plain-English reason in brackets after each step. For practice question requests, generate 10-15 questions labelled 🟢Easy 🟡Medium 🔴Hard, list all questions first, then give full worked solutions. Structure: 📌 Problem → 🔍 Solution (numbered steps) → ✅ Answer.",
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API error");
      const reply = data.content?.find(b => b.type === "text")?.text || "Could not solve.";
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMsgs(m => [...m, { role: "assistant", content: `⚠️ ${err.message || "Connection error. Please try again."}` }]);
    }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: 14, minHeight: 300, display: "flex", flexDirection: "column", gap: 10, maxHeight: 460, overflowY: "auto" }} className="calc-scroll">
        {msgs.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 14 }}>
            <div style={{ fontSize: 44 }}>🤖</div>
            <div style={{ color: "#64748b", fontSize: 14, textAlign: "center", maxWidth: 400 }}>Ask any math problem — solved step by step with real symbols like π, √, ×.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: "100%", maxWidth: 620 }}>
              {EXAMPLES.map((ex, i) => <button key={i} onClick={() => setInp(ex)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 11, textAlign: "left", lineHeight: 1.4 }}>{ex}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: 9, color: "#475569", marginBottom: 3, paddingInline: 4 }}>{m.role === "user" ? "You" : "AI Solver"}</div>
            <div style={{ background: m.role === "user" ? "#1d4ed8" : "#1e293b", color: "#f8fafc", borderRadius: 10, padding: "10px 14px", maxWidth: "88%", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", background: "#1e293b", borderRadius: 10, padding: "10px 14px", color: "#818cf8", fontSize: 13 }}>⚙️ Solving...</div>}
        <div ref={bottom} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type your problem… (Enter to solve, Shift+Enter for newline)" rows={3}
          style={{ flex: 1, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
        <button onClick={send} disabled={loading || !inp.trim()}
          style={{ background: !inp.trim() || loading ? "#1e293b" : "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "0 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, minWidth: 90 }}>
          {loading ? "..." : "Solve →"}
        </button>
      </div>
    </div>
  );
}

function SavedSessions() {
  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState(""); const [note, setNote] = useState(""); const [type, setType] = useState("note");
  const [search, setSearch] = useState(""); const [expanded, setExpanded] = useState({});
  const [delConfirm, setDelConfirm] = useState(null); const [clearConfirm, setClearConfirm] = useState(false);
  const [msg, setMsg] = useState(""); const fileRef = useRef(null);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const addItem = () => {
    if (!title.trim() && !note.trim()) return;
    const item = { id: Date.now().toString(), type, title: title.trim() || `${type} — ${new Date().toLocaleTimeString()}`, content: note.trim() || title.trim(), timestamp: Date.now() };
    setSessions(prev => [item, ...prev]); setTitle(""); setNote(""); flash("Saved ✓");
  };
  const del = id => { setSessions(prev => prev.filter(s => s.id !== id)); setDelConfirm(null); };
  const exp = () => { const b = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "math_sessions.json"; a.click(); URL.revokeObjectURL(u); };
  const imp = e => { const f = e.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = ev => { try { const d = JSON.parse(ev.target.result); if (!Array.isArray(d)) throw new Error(); setSessions(prev => [...d, ...prev]); flash(`Imported ${d.length} ✓`); } catch { flash("Import failed"); } }; reader.readAsText(f); e.target.value = ""; };
  const filtered = sessions.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));
  const counts = { calc: 0, graph: 0, note: 0 }; sessions.forEach(s => { if (counts[s.type] !== undefined) counts[s.type]++; });
  const ico = t => t === "calc" ? "🔢" : t === "graph" ? "📈" : "📝";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 26 }}>💾</span>
        <div style={{ flex: 1 }}><div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15 }}>Saved Sessions</div><div style={{ color: "#64748b", fontSize: 12 }}>Save calculations, graphs, and notes · in-memory for this session</div></div>
        <div style={{ display: "flex", gap: 10 }}><span style={{ color: "#38bdf8", fontSize: 12 }}>🔢{counts.calc}</span><span style={{ color: "#34d399", fontSize: 12 }}>📈{counts.graph}</span><span style={{ color: "#a78bfa", fontSize: 12 }}>📝{counts.note}</span></div>
      </div>
      {msg && <div style={{ background: "#0d2d2a", borderRadius: 8, padding: "8px 14px", color: "#34d399", fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      <div style={{ background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 13 }}>Save New</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["note","calc","graph"].map(t => <button key={t} onClick={() => setType(t)} style={{ background: type === t ? "#6366f1" : "#1e293b", color: type === t ? "#fff" : "#94a3b8", border: `1px solid ${type === t ? "#6366f1" : "#334155"}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>{ico(t)} {t}</button>)}</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Content / expression / note…" style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "monospace" }} />
        <button onClick={addItem} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, alignSelf: "flex-start" }}>💾 Save</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ flex: 1, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", minWidth: 120 }} />
        <button onClick={exp} disabled={!sessions.length} style={{ background: sessions.length ? "#0d2d2a" : "#1e293b", color: sessions.length ? "#34d399" : "#475569", border: `1px solid ${sessions.length ? "#064e3b" : "#334155"}`, borderRadius: 8, padding: "8px 14px", cursor: sessions.length ? "pointer" : "default", fontSize: 12, fontWeight: 600 }}>↓ Export</button>
        <button onClick={() => fileRef.current?.click()} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>↑ Import</button>
        <input ref={fileRef} type="file" accept=".json" onChange={imp} style={{ display: "none" }} />
        {sessions.length > 0 && (clearConfirm
          ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ color: "#f87171", fontSize: 12 }}>Delete all {sessions.length}?</span><button onClick={() => { setSessions([]); setClearConfirm(false); flash("Cleared"); }} style={{ background: "#7f1d1d", color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Yes</button><button onClick={() => setClearConfirm(false)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Cancel</button></div>
          : <button onClick={() => setClearConfirm(true)} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>🗑 Clear All</button>
        )}
      </div>
      {filtered.length === 0 && <div style={{ background: "#0f172a", borderRadius: 10, padding: 40, textAlign: "center", color: "#475569" }}>{search ? "No matches" : "Nothing saved yet"}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(s => (
          <div key={s.id} style={{ background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setExpanded(o => ({ ...o, [s.id]: !o[s.id] }))}>
              <span style={{ fontSize: 16 }}>{ico(s.type)}</span>
              <div style={{ flex: 1 }}><div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}>{s.title}</div><div style={{ color: "#475569", fontSize: 10 }}>{new Date(s.timestamp).toLocaleString()}</div></div>
              <span style={{ color: "#475569", fontSize: 12 }}>{expanded[s.id] ? "▲" : "▼"}</span>
            </div>
            {expanded[s.id] && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid #1e293b" }}>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 13, color: "#f8fafc", marginTop: 10, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{s.content}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(s.content); flash("Copied ✓"); }} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Copy</button>
                  {delConfirm === s.id
                    ? <><button onClick={() => del(s.id)} style={{ background: "#7f1d1d", color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Confirm Delete</button><button onClick={() => setDelConfirm(null)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Cancel</button></>
                    : <button onClick={() => setDelConfirm(s.id)} style={{ background: "#1a0000", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Delete</button>
                  }
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "calc", label: "🔢 Calc" }, { id: "graph", label: "📈 Graph" }, { id: "ai", label: "🤖 AI Solver" },
  { id: "practice", label: "📚 Practice" }, { id: "convert", label: "🔄 Convert" }, { id: "formulas", label: "📐 Formulas" },
  { id: "eqsolve", label: "🧮 Eq. Solver" }, { id: "stats", label: "📊 Statistics" }, { id: "matrix", label: "🔲 Matrix" }, { id: "saved", label: "💾 Saved" },
];

export default function App() {
  const isMobile = useWindowWidth() < 600;
  const [tab, setTab] = useState("calc");
  const [aiPreFill, setAIPreFill] = useState("");
  const handleAskAI = p => { setAIPreFill(p); setTab("ai"); };

  // Inject global mobile-friendly styles once on mount
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-calc", "1");
    style.textContent = `
      /* Prevent iOS Safari auto-zoom on input focus (requires font-size >= 16px) */
      input, select, textarea { font-size: 16px !important; }
      /* Remove blue tap flash on all tappable elements (iOS/Android) */
      * { -webkit-tap-highlight-color: transparent; }
      /* Smooth momentum scroll inside overflow containers */
      .calc-scroll { -webkit-overflow-scrolling: touch; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.querySelector("style[data-calc]"); if (el) el.remove(); };
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", padding: isMobile ? 8 : 14, fontFamily: "system-ui,-apple-system,sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 8 : 12 }}>
          <h1 style={{ margin: "0 0 3px", fontSize: isMobile ? 16 : 20, fontWeight: 900 }}>
            <span style={{ background: "linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>∑ Advanced Math Calculator</span>
          </h1>
          {!isMobile && <div style={{ color: "#475569", fontSize: 11 }}>Scientific · Graphing · AI Solver · Practice · Converter · Formulas · Eq. Solver · Statistics · Matrix · Sessions</div>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: isMobile ? 8 : 12, background: "#0f172a", borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: isMobile ? "1 1 18%" : "1 1 80px", padding: isMobile ? "5px 2px" : "7px 4px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: tab === t.id ? 700 : 500, fontSize: isMobile ? 9 : 11, background: tab === t.id ? "#6366f1" : "transparent", color: tab === t.id ? "#fff" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</button>
          ))}
        </div>
        {tab === "calc" && <Calc />}
        {tab === "graph" && <Grapher />}
        {tab === "ai" && <AISolver externalInput={aiPreFill} onClearExternal={() => setAIPreFill("")} />}
        {tab === "practice" && <Resources onAskAI={handleAskAI} />}
        {tab === "convert" && <UnitConverter />}
        {tab === "formulas" && <FormulaSheet />}
        {tab === "eqsolve" && <EquationSolver />}
        {tab === "stats" && <StatisticsCalc />}
        {tab === "matrix" && <MatrixCalc />}
        {tab === "saved" && <SavedSessions />}
      </div>
    </div>
  );
}
