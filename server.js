// TOI SANTUY IoT Backend v3 — dashboard embedded (tanpa folder public)
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const app     = express();

app.use(cors());
app.use(express.json());


// ─── DASHBOARD HTML (embedded in server) ─────────────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>Toi Santuy — IoT Monitor</title>
<meta name="description" content="Smart Garden IoT Monitor — kontrol pompa, lampu, dan pantau sensor realtime">
<meta name="theme-color" content="#0f1117">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Toi Santuy">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
:root{
  --bg:#0f1117; --panel:#181c27; --border:#252a3a;
  --accent:#00d4aa; --warn:#f5a623; --danger:#e74c3c;
  --info:#3b9eff; --purple:#b48aff; --green:#25d366; --yellow:#ffe066;
  --text:#e2e8f0; --muted:#6b7694; --grid:#1e2436;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:var(--bg);color:var(--text);font-family:'Inter',-apple-system,'Segoe UI',sans-serif;
  -webkit-text-size-adjust:100%;}
button,input,textarea,select{font-family:inherit;touch-action:manipulation;}
input,textarea{-webkit-user-select:text;user-select:text}
button{-webkit-appearance:none;appearance:none;cursor:pointer}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.mono{font-family:'JetBrains Mono','SF Mono',monospace}

/* ── TOPBAR ───────────────────────────────────────────── */
.topbar{display:flex;align-items:center;justify-content:space-between;background:var(--panel);
  border-bottom:1px solid var(--border);padding:0 16px;height:56px;flex-wrap:wrap;gap:8px;
  position:sticky;top:0;z-index:50;}
.brand{display:flex;align-items:center;gap:10px;font-size:15px;letter-spacing:1px}
.dot{width:8px;height:8px;border-radius:50%;}
.topbar-right{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:8px 0}
.toggle-group{display:flex;align-items:center;gap:8px}
.toggle{position:relative;width:50px;height:26px;border-radius:13px;border:none;cursor:pointer;
  background:#2a2f42;transition:background .25s;flex-shrink:0;}
.toggle.on{box-shadow:0 0 12px currentColor;}
.toggle-knob{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;
  background:#fff;transition:left .25s;}
.toggle.on .toggle-knob{left:27px;}
.toggle-label{font-size:11px;font-family:monospace;color:var(--muted)}
.alert-badge{display:flex;align-items:center;gap:6px;background:#2a1a1a;border:1px solid var(--danger);
  border-radius:6px;padding:4px 12px;font-size:12px;color:var(--danger);}

/* ── STATUS BAR ───────────────────────────────────────── */
.statusbar{display:flex;gap:14px;padding:7px 16px;background:#13171f;border-bottom:1px solid var(--border);
  font-size:11px;flex-wrap:wrap;overflow-x:auto;}
.statusbar span{white-space:nowrap}

/* ── TABS ─────────────────────────────────────────────── */
.tabs{display:flex;gap:2px;padding:0 8px;background:#13171f;border-bottom:1px solid var(--border);
  overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tab{padding:10px 14px;background:transparent;border:none;border-bottom:2px solid transparent;
  color:var(--muted);font-size:12px;white-space:nowrap;}
.tab.active{color:var(--accent);border-bottom-color:var(--accent);}

/* ── LAYOUT ───────────────────────────────────────────── */
.content{padding:16px;display:flex;flex-direction:column;gap:14px;max-width:1200px;margin:0 auto;}
.grid-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
.grid-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px;}
.panel-accent{border-top:2px solid var(--accent);}
.section-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-family:monospace;}

/* ── STAT CARD ────────────────────────────────────────── */
.stat-card{display:flex;flex-direction:column;gap:8px;}
.stat-value{font-size:32px;font-weight:700;color:var(--accent);line-height:1;font-family:'JetBrains Mono',monospace;}
.stat-unit{font-size:13px;color:var(--muted);font-family:monospace;}
.stat-canvas{width:100%;height:36px;}

/* ── CHART ────────────────────────────────────────────── */
.chart-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.chart-value{font-size:12px;color:var(--accent);font-weight:700;font-family:monospace;}
.chart-canvas{width:100%;height:150px;display:block;}

/* ── BUTTONS ──────────────────────────────────────────── */
.btn{padding:9px 22px;border-radius:6px;border:1px solid var(--accent);background:rgba(0,212,170,.13);
  color:var(--accent);font-family:monospace;font-weight:700;font-size:13px;}
.btn-danger{border-color:var(--danger);background:rgba(231,76,60,.13);color:var(--danger);}
.btn-ghost{border:1px solid var(--border);background:transparent;color:var(--muted);font-family:monospace;font-size:11px;padding:5px 12px;border-radius:6px;}
.btn[disabled]{opacity:.4;}

/* ── DAY PICKER ───────────────────────────────────────── */
.day-row{display:flex;gap:6px;flex-wrap:wrap;}
.day-btn{padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;
  color:var(--muted);font-family:monospace;font-size:12px;}
.day-btn.active{border-color:var(--purple);background:rgba(180,138,255,.15);color:var(--purple);font-weight:700;}

/* ── CLOCK PICKER ─────────────────────────────────────── */
.clock-wrap{position:relative;display:inline-block;}
.clock-btn{background:#0d1117;border:1px solid var(--border);border-radius:8px;color:var(--accent);
  font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;padding:10px 18px;
  letter-spacing:2px;min-width:104px;}
.clock-btn.open{border-color:var(--accent);box-shadow:0 0 12px rgba(0,212,170,.3);}
.clock-popup{position:absolute;top:110%;left:0;z-index:200;background:#13171f;border:1px solid var(--border);
  border-radius:14px;padding:14px;box-shadow:0 8px 32px rgba(0,0,0,.6);min-width:220px;}
.clock-modes{display:flex;gap:6px;justify-content:center;margin-bottom:10px;}
.clock-mode{padding:4px 16px;border-radius:6px;border:1px solid var(--border);background:transparent;
  color:var(--muted);font-family:monospace;font-size:11px;}
.clock-mode.active{border-color:var(--accent);background:rgba(0,212,170,.15);color:var(--accent);}
.clock-quick{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:8px;}
.clock-quick button{padding:3px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;
  color:var(--muted);font-family:monospace;font-size:10px;}
.clock-quick button.active{border-color:var(--accent);background:rgba(0,212,170,.15);color:var(--accent);}

/* ── INPUTS ───────────────────────────────────────────── */
.field-label{font-size:11px;color:var(--muted);font-family:monospace;margin-bottom:6px;display:block;}
.input,.textarea{background:#0d1117;border:1px solid var(--border);border-radius:6px;color:var(--text);
  font-family:monospace;font-size:13px;padding:8px 12px;outline:none;width:100%;}
.textarea{resize:vertical;min-height:56px;}
.input-num{width:90px;text-align:center;}

/* ── ROWS / FLEX ──────────────────────────────────────── */
.row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.row-between{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.col{display:flex;flex-direction:column;gap:16px;}
.divider{border-top:1px solid var(--border);padding-top:14px;}

/* ── ALERT ITEMS ──────────────────────────────────────── */
.alert-item{display:flex;align-items:center;gap:10px;border-radius:6px;padding:8px 12px;font-size:12px;font-family:monospace;}
.alert-warn{background:#2a2210;border:1px solid rgba(245,166,35,.3);}
.alert-danger{background:#2a1a1a;border:1px solid rgba(231,76,60,.3);}

/* ── FOOTER ───────────────────────────────────────────── */
.footer{text-align:center;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;
  padding:8px 0 20px;letter-spacing:3px;}

@media (max-width:480px){
  .stat-value{font-size:26px;}
  .clock-btn{font-size:18px;padding:9px 14px;min-width:90px;}
  .topbar{padding:0 12px;}
  .content{padding:10px;}
}
</style>
</head>
<body>
<div id="app"></div>

<script>
/* ════════════════════════════════════════════════════════════════
   TOI SANTUY — IoT Monitor (Vanilla JS, served same-origin)
   ════════════════════════════════════════════════════════════════ */

// ─── HELPERS ────────────────────────────────────────────────────
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const el = (tag, props={}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k,v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  });
  children.flat().forEach(c => { if (c!=null) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
};
const nowStr = () => new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const hhmm   = () => new Date().toTimeString().slice(0,5);
const todayDay = () => ['minggu','senin','selasa','rabu','kamis','jumat','sabtu'][new Date().getDay()];

const HARI = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
const HL   = {senin:'Sen',selasa:'Sel',rabu:'Rab',kamis:'Kam',jumat:'Jum',sabtu:'Sab',minggu:'Min'};

const COLOR = {
  accent:'#00d4aa', warn:'#f5a623', danger:'#e74c3c', info:'#3b9eff',
  purple:'#b48aff', green:'#25d366', yellow:'#ffe066', muted:'#6b7694', grid:'#1e2436',
};

const DEFAULT_THRESH = {
  temperature:  {warn:35, danger:45, min:0, max:100, unit:'°C',  label:'Suhu',             icon:'🌡️'},
  humidity:     {warn:85, danger:95, min:0, max:100, unit:'%',   label:'Kelembaban Udara', icon:'💧'},
  airQuality:   {warn:500,danger:750,min:0, max:1000,unit:'ppm', label:'Kualitas Udara',   icon:'🌫️'},
  soilMoisture: {warn:30, danger:15, min:0, max:100, unit:'%',   label:'Kelembaban Tanah', icon:'🌱', inverse:true},
};
const SENSOR_KEYS = ['temperature','humidity','airQuality','soilMoisture'];

function getStatus(key, val, thresh) {
  const t = thresh[key];
  if (!t || val == null) return 'ok';
  if (t.inverse) { if (val<=t.danger) return 'danger'; if (val<=t.warn) return 'warn'; return 'ok'; }
  if (val>=t.danger) return 'danger'; if (val>=t.warn) return 'warn'; return 'ok';
}

async function sendWA(phone, apiKey, message) {
  try {
    await fetch(\`https://api.callmebot.com/whatsapp.php?phone=\${phone}&text=\${encodeURIComponent(message)}&apikey=\${apiKey}\`, {mode:'no-cors'});
    return true;
  } catch { return false; }
}

// ─── LOCAL STORAGE ──────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ─── STATE ──────────────────────────────────────────────────────
const state = {
  activeTab: 'dashboard',
  history: [],
  connected: false,
  hasData: false,
  anyClockOpen: false,
  pumpOn: false,
  lampOn: false,
  alerts: [],
  lastUpd: '—',
  thresh: load('ts_thresh', DEFAULT_THRESH),
  pumpSched: load('ts_pumpSched', {onTime:'06:00',offTime:'18:00',enabled:false,days:[...HARI],onAction:'Pompa ON ✅',offAction:'Pompa OFF 🛑'}),
  lampSched: load('ts_lampSched', {onTime:'06:00',offTime:'18:00',enabled:false,days:[...HARI],onAction:'Lampu ON ✅',offAction:'Lampu OFF 🛑'}),
  wa: load('ts_wa', {phone:'',apiKey:'',enabled:false,cooldown:10,alertWarning:false,summaryEnabled:false,summaryInterval:60}),
  lastWASent: {},
  lastWASummary: 0,
  // Config MQTT disimpan SERVER-SIDE (bukan localStorage) — supaya 1 device
  // code berlaku untuk semua browser/HP yang membuka dashboard ini.
  mqtt: { enabled:false, brokerUrl:'', username:'', password:'', deviceCode:'', hasPassword:false, loaded:false },
  mqttConnStatus: 'unknown', // unknown | disabled | connecting | connected | disconnected | error
  mqttTopics: null,
};

// ─── CANVAS CHART DRAWING ───────────────────────────────────────
function drawChart(canvas, data, key, thresh, color) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0,0,W,H);
  if (!data.length) return;

  const t = thresh[key];
  const padL = 32, padR = 8, padT = 8, padB = 18;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const min = t.min, max = t.max;

  // grid lines
  ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1;
  for (let i=0;i<=4;i++) {
    const y = padT + plotH * i/4;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
    const val = Math.round(max - (max-min)*i/4);
    ctx.fillStyle = COLOR.muted; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(val, padL-4, y+3);
  }

  // line
  const vals = data.map(d => d[key] ?? 0);
  ctx.beginPath();
  vals.forEach((v,i) => {
    const x = padL + plotW * i/(vals.length-1 || 1);
    const y = padT + plotH * (1 - (v-min)/(max-min || 1));
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();

  // last point dot
  const lastX = padL + plotW;
  const lastY = padT + plotH * (1 - (vals[vals.length-1]-min)/(max-min || 1));
  ctx.beginPath(); ctx.arc(lastX,lastY,4,0,Math.PI*2); ctx.fillStyle = color; ctx.fill();

  // x labels (first / last time)
  ctx.fillStyle = COLOR.muted; ctx.font = '9px monospace';
  ctx.textAlign = 'left'; ctx.fillText(data[0]?.time||'', padL, H-4);
  ctx.textAlign = 'right'; ctx.fillText(data[data.length-1]?.time||'', W-padR, H-4);
}

function drawSpark(canvas, data, key, color) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const W=rect.width, H=rect.height;
  ctx.clearRect(0,0,W,H);
  const vals = data.slice(-20).map(d=>d[key]??0);
  if (vals.length<2) return;
  const min=Math.min(...vals), max=Math.max(...vals);
  ctx.beginPath();
  vals.forEach((v,i)=>{
    const x = i/(vals.length-1)*W;
    const y = H - ((v-min)/((max-min)||1))*H*0.85 - H*0.075;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

// ─── CLOCK PICKER (24h) ─────────────────────────────────────────
// Registry global agar listener "klik di luar" hanya didaftarkan SEKALI,
// mencegah penumpukan listener tiap kali komponen di-render ulang.
const clockPickerRegistry = [];
let clockOutsideListenerAdded = false;
function ensureClockOutsideListener(){
  if (clockOutsideListenerAdded) return;
  clockOutsideListenerAdded = true;
  document.addEventListener('click', (e)=>{
    for (let i=clockPickerRegistry.length-1; i>=0; i--){
      const entry = clockPickerRegistry[i];
      if (!entry.wrap.isConnected) { clockPickerRegistry.splice(i,1); continue; }
      if (!entry.wrap.contains(e.target)) entry.close();
    }
    updateAnyClockOpen();
  });
}
// Dipanggil setiap kali status buka/tutup clock picker berubah.
// Hasilnya dipakai poll() agar TIDAK merender ulang tab Pompa/Lampu
// selagi popup jam terbuka (mencegah popup tertutup sendiri).
function updateAnyClockOpen(){
  state.anyClockOpen = clockPickerRegistry.some(p => p.wrap.isConnected && p.isOpen());
}

function createClockPicker(label, value, onChange) {
  let [h,m] = value.split(':').map(Number);
  let mode = 'hour';
  let open = false;

  const wrap = el('div',{class:'clock-wrap'});
  const lbl = el('div',{class:'field-label'}, label);
  const btn = el('button',{class:'clock-btn mono'}, fmt());
  const popup = el('div',{class:'clock-popup'});
  popup.style.display = 'none';
  wrap.append(lbl, btn, popup);

  function fmt(){ return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }

  function renderPopup(){
    popup.innerHTML = '';
    const modes = el('div',{class:'clock-modes'});
    ['hour','minute'].forEach(md=>{
      const b = el('button',{class:'clock-mode'+(mode===md?' active':'')}, md==='hour'?'JAM':'MENIT');
      b.onclick = ()=>{ mode = md; renderPopup(); };
      modes.append(b);
    });
    popup.append(modes);

    const size=200, cx=100, cy=100, Ro=72, Ri=46;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('width',size); svg.setAttribute('height',size);
    svg.style.display='block'; svg.style.margin='0 auto'; svg.style.cursor='crosshair';

    const bgC = document.createElementNS(ns,'circle');
    bgC.setAttribute('cx',cx); bgC.setAttribute('cy',cy); bgC.setAttribute('r',size/2-2);
    bgC.setAttribute('fill','#0a0e16'); bgC.setAttribute('stroke','#252a3a');
    svg.append(bgC);

    if (mode==='hour'){
      const ring = document.createElementNS(ns,'circle');
      ring.setAttribute('cx',cx); ring.setAttribute('cy',cy); ring.setAttribute('r',Ri+13);
      ring.setAttribute('fill','none'); ring.setAttribute('stroke','#252a3a');
      ring.setAttribute('stroke-dasharray','3 3'); ring.setAttribute('opacity','0.4');
      svg.append(ring);
    }

    const handR = mode==='hour' ? (h===0||h>=13?Ri:Ro) : Ro;
    const handA = (mode==='hour' ? (h%12)*30-90 : m*6-90) * Math.PI/180;
    const hx = cx+handR*0.82*Math.cos(handA), hy = cy+handR*0.82*Math.sin(handA);
    const line = document.createElementNS(ns,'line');
    line.setAttribute('x1',cx); line.setAttribute('y1',cy); line.setAttribute('x2',hx); line.setAttribute('y2',hy);
    line.setAttribute('stroke',COLOR.accent); line.setAttribute('stroke-width','2'); line.setAttribute('stroke-linecap','round');
    svg.append(line);
    const center = document.createElementNS(ns,'circle');
    center.setAttribute('cx',cx); center.setAttribute('cy',cy); center.setAttribute('r','3'); center.setAttribute('fill',COLOR.accent);
    svg.append(center);
    const handDot = document.createElementNS(ns,'circle');
    handDot.setAttribute('cx',hx); handDot.setAttribute('cy',hy); handDot.setAttribute('r','9');
    handDot.setAttribute('fill',COLOR.accent); handDot.setAttribute('opacity','0.85');
    svg.append(handDot);

    if (mode==='hour'){
      for(let i=0;i<12;i++){
        const a=(i*30-90)*Math.PI/180;
        const outerVal = i===0?12:i, innerVal = i===0?0:(i+12)%24;
        const ox=cx+Ro*Math.cos(a), oy=cy+Ro*Math.sin(a);
        const ix=cx+Ri*Math.cos(a), iy=cy+Ri*Math.sin(a);
        addLabel(svg, ox, oy, outerVal, h===outerVal, 12);
        addLabel(svg, ix, iy, innerVal, h===innerVal, 10, true);
      }
      const note = document.createElementNS(ns,'text');
      note.setAttribute('x',cx); note.setAttribute('y',cy+Ri+22); note.setAttribute('text-anchor','middle');
      note.setAttribute('fill',COLOR.muted); note.setAttribute('font-size','8'); note.setAttribute('font-family','monospace');
      note.textContent = 'luar 01-12 · dalam 13-24/00';
      svg.append(note);
    } else {
      for(let i=0;i<12;i++){
        const a=(i*30-90)*Math.PI/180; const val=i*5;
        const x=cx+Ro*Math.cos(a), y=cy+Ro*Math.sin(a);
        addLabel(svg, x, y, val, m===val, 11, false, true);
      }
    }

    svg.addEventListener('click', (e)=>{
      const rect = svg.getBoundingClientRect();
      const dx = e.clientX-rect.left-cx, dy = e.clientY-rect.top-cy;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const ang = ((Math.atan2(dy,dx)*180/Math.PI+90)%360+360)%360;
      if (mode==='hour'){
        const idx = Math.round(ang/30)%12;
        const inner = dist < (Ro+Ri)/2;
        h = inner ? (idx===0?0:idx+12) : (idx===0?12:idx);
        onChange(fmt());
        btn.textContent = fmt();
        setTimeout(()=>{ mode='minute'; renderPopup(); }, 180);
      } else {
        m = Math.round(ang/6)%60;
        onChange(fmt());
        btn.textContent = fmt();
        setTimeout(()=>{ open=false; popup.style.display='none'; btn.classList.remove('open'); updateAnyClockOpen(); }, 180);
      }
    });

    popup.append(svg);

    const quick = el('div',{class:'clock-quick'});
    if (mode==='minute'){
      [0,15,30,45].forEach(mm=>{
        const b = el('button',{class: m===mm?'active':''}, ':'+String(mm).padStart(2,'0'));
        b.onclick = ()=>{ m=mm; onChange(fmt()); btn.textContent=fmt(); open=false; popup.style.display='none'; btn.classList.remove('open'); updateAnyClockOpen(); };
        quick.append(b);
      });
    } else {
      [0,6,7,12,17,18,19,20,21].forEach(hh=>{
        const b = el('button',{class: h===hh?'active':''}, String(hh).padStart(2,'0')+':xx');
        b.onclick = ()=>{ h=hh; onChange(fmt()); btn.textContent=fmt(); mode='minute'; renderPopup(); };
        quick.append(b);
      });
    }
    popup.append(quick);
  }

  function addLabel(svg, x, y, val, active, fontSize, isMuted, isMinute){
    const ns='http://www.w3.org/2000/svg';
    if (active){
      const c = document.createElementNS(ns,'circle');
      c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r','13');
      c.setAttribute('fill',COLOR.accent); c.setAttribute('opacity','0.2');
      svg.append(c);
    }
    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',x); t.setAttribute('y',y); t.setAttribute('text-anchor','middle');
    t.setAttribute('dominant-baseline','central'); t.setAttribute('font-size',fontSize);
    t.setAttribute('font-family','monospace'); t.setAttribute('font-weight', active?'700':'400');
    t.setAttribute('fill', active ? COLOR.accent : (isMuted?COLOR.muted:'#e2e8f0'));
    t.textContent = String(val).padStart(2,'0');
    svg.append(t);
  }

  btn.onclick = (e)=>{
    e.stopPropagation();
    open = !open;
    mode = 'hour';
    popup.style.display = open ? 'block' : 'none';
    btn.classList.toggle('open', open);
    updateAnyClockOpen();
    if (open) renderPopup();
  };
  ensureClockOutsideListener();
  clockPickerRegistry.push({
    wrap,
    isOpen: ()=>open,
    close: ()=>{ open=false; popup.style.display='none'; btn.classList.remove('open'); }
  });

  return wrap;
}

// ─── DAY PICKER ─────────────────────────────────────────────────
function createDayPicker(days, onChange) {
  const wrap = el('div',{},
    el('div',{class:'field-label'},'PILIH HARI'),
  );
  const row = el('div',{class:'day-row'});
  function render(){
    row.innerHTML = '';
    HARI.forEach(d=>{
      const b = el('button',{class:'day-btn'+(days.includes(d)?' active':'')}, HL[d]);
      b.onclick = ()=>{ 
        if(days.includes(d)) days.splice(days.indexOf(d),1); else days.push(d);
        onChange(days); render();
      };
      row.append(b);
    });
    const all = el('button',{class:'btn-ghost'},'Semua');
    all.onclick=()=>{ days.length=0; days.push(...HARI); onChange(days); render(); };
    const none = el('button',{class:'btn-ghost'},'Reset');
    none.onclick=()=>{ days.length=0; onChange(days); render(); };
    row.append(all,none);
  }
  render();
  wrap.append(row);
  return wrap;
}

// ─── TOP BAR ────────────────────────────────────────────────────
function renderTopBar(){
  const bar = el('div',{class:'topbar'});
  bar.append(
    el('div',{class:'brand mono'},
      el('span',{class:'dot', style:\`background:\${state.connected?COLOR.accent:COLOR.danger};box-shadow:0 0 8px \${state.connected?COLOR.accent:COLOR.danger}\`}),
      'Toi Santuy ', el('span',{style:\`color:\${COLOR.muted}\`},'/ IoT Monitor')
    )
  );
  const right = el('div',{class:'topbar-right'});
  if (state.alerts.length){
    right.append(el('div',{class:'alert-badge'}, \`⚠ \${state.alerts.length} Alert\`));
  }
  right.append(makeToggle('POMPA 💧', state.pumpOn, COLOR.accent, ()=>toggleDevice('pump')));
  right.append(makeToggle('LAMPU 💡', state.lampOn, COLOR.yellow, ()=>toggleDevice('lamp')));
  bar.append(right);
  return bar;
}

function makeToggle(label, on, color, onClick){
  const g = el('div',{class:'toggle-group'});
  g.append(el('span',{class:'toggle-label'}, label));
  const t = el('button',{class:'toggle'+(on?' on':'')});
  if (on) { t.style.background = color; t.style.color = color; } 
  t.append(el('div',{class:'toggle-knob'}));
  t.onclick = onClick;
  g.append(t);
  g.append(el('span',{class:'toggle-label mono', style:\`color:\${on?color:COLOR.muted};min-width:28px\`}, on?'ON':'OFF'));
  return g;
}

// ─── STATUS BAR ─────────────────────────────────────────────────
function renderStatusBar(){
  const bar = el('div',{class:'statusbar mono'});
  let statusText, statusColor;
  if (!state.connected)      { statusText='● SERVER ERROR';     statusColor=COLOR.danger; }
  else if (!state.hasData)   { statusText='● MENUNGGU ESP32';   statusColor=COLOR.warn;   }
  else                        { statusText='● REALTIME';         statusColor=COLOR.accent; }
  bar.append(el('span',{style:\`color:\${statusColor}\`}, statusText));
  bar.append(el('span',{style:\`color:\${COLOR.muted}\`}, \`Update: \${state.lastUpd}\`));
  bar.append(el('span',{style:\`color:\${state.pumpOn?COLOR.accent:COLOR.muted}\`}, \`💧 \${state.pumpOn?'ON':'OFF'}\`));
  bar.append(el('span',{style:\`color:\${state.lampOn?COLOR.yellow:COLOR.muted}\`}, \`💡 \${state.lampOn?'ON':'OFF'}\`));
  if (state.pumpSched.enabled) bar.append(el('span',{style:\`color:\${COLOR.purple}\`}, \`⏰ Pompa: \${state.pumpSched.onTime}–\${state.pumpSched.offTime}\`));
  if (state.lampSched.enabled) bar.append(el('span',{style:\`color:\${COLOR.yellow}\`}, \`⏰ Lampu: \${state.lampSched.onTime}–\${state.lampSched.offTime}\`));
  if (state.wa.enabled) bar.append(el('span',{style:\`color:\${COLOR.green}\`}, '📱 WA: ON'));
  if (state.alerts.length) bar.append(el('span',{style:\`color:\${COLOR.warn}\`}, \`⚠ \${state.alerts.length} alert\`));
  return bar;
}

// ─── TABS ───────────────────────────────────────────────────────
const TABS = [
  {id:'dashboard', label:'📊 Dashboard'},
  {id:'pump',      label:'💧 Pompa'},
  {id:'lamp',      label:'💡 Lampu'},
  {id:'setting',   label:'⚙️ Setting'},
  {id:'whatsapp',  label:'📱 WhatsApp'},
  {id:'mqtt',      label:'📡 MQTT'},
];
function renderTabs(){
  const bar = el('div',{class:'tabs'});
  TABS.forEach(t=>{
    const b = el('button',{class:'tab'+(state.activeTab===t.id?' active':'')}, t.label);
    b.onclick = ()=>{
      state.activeTab = t.id;
      if (t.id === 'mqtt') fetchMQTTConfig().then(()=>renderApp());
      else renderApp();
    };
    bar.append(b);
  });
  return bar;
}

// ─── DASHBOARD TAB ──────────────────────────────────────────────
function renderDashboard(){
  const wrap = el('div',{class:'col'});
  if (!state.connected){
    wrap.append(el('div',{class:'panel', style:\`border-color:\${COLOR.danger};color:\${COLOR.danger};font-size:13px\`},
      '⚠ Tidak bisa menghubungi server. Cek koneksi internet kamu, lalu refresh halaman ini.'));
  } else if (!state.hasData){
    wrap.append(el('div',{class:'panel', style:\`border-color:\${COLOR.warn};color:\${COLOR.warn};font-size:13px\`},
      '⚠ Belum ada data dari ESP32. Pastikan ESP32 sudah menyala dan terhubung WiFi.'));
  }
  const latest = state.history[state.history.length-1] || {};

  // stat cards
  const statsGrid = el('div',{class:'grid-stats'});
  SENSOR_KEYS.forEach(key=>{
    const t = state.thresh[key];
    const card = el('div',{class:'panel panel-accent stat-card'});
    card.append(el('span',{class:'section-label'}, \`\${t.icon} \${t.label}\`));
    card.append(el('div',{class:'row',style:'align-items:baseline;gap:4px'},
      el('span',{class:'stat-value'}, latest[key] ?? '-'),
      el('span',{class:'stat-unit'}, t.unit)
    ));
    const cv = el('canvas',{class:'stat-canvas'});
    card.append(cv);
    statsGrid.append(card);
    requestAnimationFrame(()=>drawSpark(cv, state.history, key, COLOR.accent));
  });
  wrap.append(statsGrid);

  // charts
  const chartsGrid = el('div',{class:'grid-charts'});
  SENSOR_KEYS.forEach(key=>{
    const t = state.thresh[key];
    const data = state.history.slice(-40);
    const latestVal = data[data.length-1]?.[key] ?? 0;
    const card = el('div',{class:'panel'});
    card.append(el('div',{class:'chart-header'},
      el('span',{class:'section-label'}, \`\${t.icon} \${t.label}\`),
      el('span',{class:'chart-value'}, \`\${latestVal} \${t.unit}\`)
    ));
    const cv = el('canvas',{class:'chart-canvas'});
    card.append(cv);
    chartsGrid.append(card);
    requestAnimationFrame(()=>drawChart(cv, data, key, state.thresh, COLOR.accent));
  });
  wrap.append(chartsGrid);

  return wrap;
}

// ─── SCHEDULE BLOCK (Pump/Lamp) ─────────────────────────────────
function renderScheduleBlock(device, title, icon, color){
  const sched = device==='pump' ? state.pumpSched : state.lampSched;
  const wrap = el('div',{class:'panel col', style:\`border-left:3px solid \${color}\`});

  // header
  const header = el('div',{class:'row-between'});
  header.append(el('div',{},
    el('div',{style:'font-size:13px;font-weight:700;margin-bottom:2px'}, \`\${icon} Jadwal \${title}\`),
    el('div',{class:'section-label', style:'text-transform:none'}, 'Atur hari, waktu & pesan otomatis')
  ));
  const enToggle = makeToggle('', sched.enabled, color, ()=>{
    sched.enabled = !sched.enabled;
    saveSchedule(device, sched);
    renderApp();
  });
  header.append(enToggle);
  wrap.append(header);

  // sensor alerts relevant here
  const sensorAlerts = SENSOR_KEYS.map(key=>{
    const latest = state.history[state.history.length-1] || {};
    const val = latest[key]; if(val==null) return null;
    const st = getStatus(key,val,state.thresh);
    if (st==='ok') return null;
    const t = state.thresh[key];
    return {key,val,st,label:t.label,icon:t.icon,unit:t.unit};
  }).filter(Boolean);
  if (sensorAlerts.length){
    const box = el('div',{class:'col',style:'gap:6px'});
    box.append(el('div',{class:'section-label'},'⚠ Status Sensor Saat Ini'));
    sensorAlerts.forEach(a=>{
      box.append(el('div',{class:'alert-item '+(a.st==='danger'?'alert-danger':'alert-warn')},
        el('span',{}, a.st==='danger'?'🔴':'🟡'),
        el('span',{style:'flex:1'}, \`\${a.icon} \${a.label}: \${a.val}\${a.unit}\`),
        el('span',{style:\`color:\${a.st==='danger'?COLOR.danger:COLOR.warn};font-weight:700;font-size:10px\`}, a.st==='danger'?'BAHAYA':'WARNING')
      ));
    });
    wrap.append(box);
  }

  // day picker
  wrap.append(createDayPicker(sched.days, (d)=>{ sched.days=d; saveSchedule(device,sched); }));

  // clock pickers
  const clockRow = el('div',{class:'row',style:'gap:24px'});
  clockRow.append(createClockPicker(\`\${icon} NYALA PUKUL\`, sched.onTime, (v)=>{ sched.onTime=v; saveSchedule(device,sched); }));
  clockRow.append(createClockPicker('🛑 MATI PUKUL', sched.offTime, (v)=>{ sched.offTime=v; saveSchedule(device,sched); }));
  wrap.append(clockRow);

  // action messages
  const msgGrid = el('div',{class:'grid-charts'});
  const onCol = el('div',{});
  onCol.append(el('label',{class:'field-label',style:\`color:\${color}\`},'✅ PESAN SAAT ON'));
  const onTa = el('textarea',{class:'textarea'}); onTa.value = sched.onAction;
  onTa.oninput = ()=>{ sched.onAction = onTa.value; saveSchedule(device,sched); };
  onCol.append(onTa);
  const offCol = el('div',{});
  offCol.append(el('label',{class:'field-label',style:\`color:\${COLOR.danger}\`},'🛑 PESAN SAAT OFF'));
  const offTa = el('textarea',{class:'textarea'}); offTa.value = sched.offAction;
  offTa.oninput = ()=>{ sched.offAction = offTa.value; saveSchedule(device,sched); };
  offCol.append(offTa);
  msgGrid.append(onCol, offCol);
  wrap.append(msgGrid);

  // manual control
  const manualRow = el('div',{class:'row-between divider'});
  const left = el('div',{class:'row'});
  const onOnBtn = el('button',{class:'btn'}, 'ON');
  const offBtn  = el('button',{class:'btn btn-danger'},'OFF');
  const isOn = device==='pump' ? state.pumpOn : state.lampOn;
  onOnBtn.style.borderColor = color; onOnBtn.style.color = color;
  onOnBtn.style.background = isOn ? color+'33' : 'transparent';
  offBtn.style.background = !isOn ? 'rgba(231,76,60,.2)' : 'transparent';
  onOnBtn.onclick = ()=>setDevice(device, true);
  offBtn.onclick  = ()=>setDevice(device, false);
  left.append(onOnBtn, offBtn, el('span',{class:'mono',style:\`color:\${isOn?color:COLOR.muted};font-weight:700;font-size:12px\`}, \`\${icon} \${isOn?'● ON':'○ OFF'}\`));
  manualRow.append(left);
  wrap.append(manualRow);

  if (sched.enabled){
    wrap.append(el('div',{class:'mono',style:\`padding:8px 12px;background:\${color}1a;border:1px solid \${color}66;border-radius:6px;font-size:11px;color:\${color}\`},
      \`● Aktif — \${sched.days.map(d=>HL[d]).join(', ')} | ON: \${sched.onTime} | OFF: \${sched.offTime}\`));
  }

  return wrap;
}

function saveSchedule(device, sched){
  if (device==='pump') save('ts_pumpSched', sched); else save('ts_lampSched', sched);
}

// ─── THRESHOLD SETTINGS TAB ─────────────────────────────────────
function renderSettings(){
  const wrap = el('div',{class:'panel col'});
  wrap.append(el('div',{class:'section-label'},'⚙️ Setting Batas Alert Sensor'));
  const list = el('div',{class:'col',style:'gap:12px'});
  SENSOR_KEYS.forEach(key=>{
    const t = state.thresh[key];
    const row = el('div',{class:'row',style:'background:#0d1117;border-radius:8px;padding:12px 16px'});
    row.append(el('div',{class:'mono',style:'min-width:140px;font-size:13px'}, \`\${t.icon} \${t.label}\`));

    const warnInp = el('input',{class:'input input-num',type:'number',style:\`border-color:\${COLOR.warn}66\`});
    warnInp.value = t.warn;
    warnInp.oninput = ()=>{ t.warn = parseFloat(warnInp.value)||0; save('ts_thresh', state.thresh); };
    row.append(el('span',{class:'mono',style:\`color:\${COLOR.warn};font-size:11px\`},'WARNING:'), warnInp, el('span',{class:'mono',style:\`color:\${COLOR.muted};font-size:11px\`}, t.unit));

    const dangerInp = el('input',{class:'input input-num',type:'number',style:\`border-color:\${COLOR.danger}66\`});
    dangerInp.value = t.danger;
    dangerInp.oninput = ()=>{ t.danger = parseFloat(dangerInp.value)||0; save('ts_thresh', state.thresh); };
    row.append(el('span',{class:'mono',style:\`color:\${COLOR.danger};font-size:11px\`},'DANGER:'), dangerInp, el('span',{class:'mono',style:\`color:\${COLOR.muted};font-size:11px\`}, t.unit));

    if (t.inverse) row.append(el('span',{class:'mono',style:\`color:\${COLOR.muted};font-size:10px\`},'(nilai rendah = bahaya)'));
    list.append(row);
  });
  wrap.append(list);
  wrap.append(el('div',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`}, '⚠ Batas ini digunakan untuk alert WhatsApp & indikator di tab Pompa/Lampu. Tersimpan otomatis.'));
  return wrap;
}

// ─── WHATSAPP TAB ───────────────────────────────────────────────
function renderWhatsApp(){
  const wrap = el('div',{class:'panel col'});
  const header = el('div',{class:'row-between'});
  header.append(el('div',{},
    el('div',{class:'section-label'},'📱 Alert WhatsApp'),
    el('div',{style:\`font-size:12px;color:\${COLOR.muted}\`},'Notifikasi otomatis via CallMeBot (gratis)')
  ));
  const right = el('div',{class:'row'});
  const guideBtn = el('button',{class:'btn-ghost'},'📖 Cara Setup');
  const enToggle = makeToggle('', state.wa.enabled, COLOR.green, ()=>{ state.wa.enabled=!state.wa.enabled; save('ts_wa',state.wa); renderApp(); });
  right.append(guideBtn, enToggle);
  header.append(right);
  wrap.append(header);

  const guideBox = el('div',{class:'mono',style:\`display:none;padding:14px 16px;background:#0d1117;border:1px solid #252a3a;border-radius:6px;font-size:12px;color:\${COLOR.muted};line-height:1.8\`});
  guideBox.innerHTML = \`<div style="color:#e2e8f0;font-weight:700;margin-bottom:8px">📖 Cara Setup CallMeBot:</div>
    <div>1. Simpan nomor <span style="color:\${COLOR.accent}">+34 644 44 21 29</span> di kontak WA</div>
    <div>2. Kirim pesan: <span style="color:\${COLOR.accent}">I allow callmebot to send me messages</span></div>
    <div>3. Tunggu balasan berisi <strong style="color:\${COLOR.accent}">API Key</strong></div>
    <div>4. Nomor format: <span style="color:\${COLOR.accent}">628xxxxxxxxx</span> (tanpa +)</div>\`;
  guideBtn.onclick = ()=>{ guideBox.style.display = guideBox.style.display==='none'?'block':'none'; };
  wrap.append(guideBox);

  const grid = el('div',{class:'grid-charts'});
  const phoneCol = el('div',{});
  phoneCol.append(el('label',{class:'field-label'},'NOMOR WA (628xxx)'));
  const phoneInp = el('input',{class:'input',type:'text',placeholder:'628123456789'}); phoneInp.value = state.wa.phone;
  phoneInp.oninput = ()=>{ state.wa.phone = phoneInp.value; save('ts_wa',state.wa); };
  phoneCol.append(phoneInp);
  const keyCol = el('div',{});
  keyCol.append(el('label',{class:'field-label'},'API KEY CALLMEBOT'));
  const keyInp = el('input',{class:'input',type:'text',placeholder:'123456'}); keyInp.value = state.wa.apiKey;
  keyInp.oninput = ()=>{ state.wa.apiKey = keyInp.value; save('ts_wa',state.wa); };
  keyCol.append(keyInp);
  grid.append(phoneCol, keyCol);
  wrap.append(grid);

  const cdWrap = el('div',{});
  cdWrap.append(el('label',{class:'field-label'},'COOLDOWN ALERT'));
  const cdRow = el('div',{class:'row'});
  const cdInp = el('input',{type:'range',min:1,max:60,style:'flex:1;accent-color:'+COLOR.green}); cdInp.value = state.wa.cooldown;
  const cdVal = el('span',{class:'mono',style:'font-size:14px;min-width:60px'}, \`\${state.wa.cooldown} menit\`);
  cdInp.oninput = ()=>{ state.wa.cooldown = +cdInp.value; cdVal.textContent = \`\${state.wa.cooldown} menit\`; save('ts_wa',state.wa); };
  cdRow.append(cdInp, cdVal);
  cdWrap.append(cdRow);
  wrap.append(cdWrap);

  // Alert saat WARNING (selain BAHAYA) — untuk SEMUA sensor
  const warnRow = el('div',{class:'row-between'});
  warnRow.append(el('div',{},
    el('div',{style:'font-size:13px'},'⚠ Alert saat status WARNING'),
    el('div',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`},'Jika OFF, WA hanya dikirim saat status BAHAYA (default)')
  ));
  warnRow.append(makeToggle('', state.wa.alertWarning, COLOR.warn, ()=>{ state.wa.alertWarning=!state.wa.alertWarning; save('ts_wa',state.wa); renderApp(); }));
  wrap.append(warnRow);

  // Ringkasan berkala semua sensor
  const sumWrap = el('div',{class:'col',style:'gap:10px'});
  const sumRow = el('div',{class:'row-between'});
  sumRow.append(el('div',{},
    el('div',{style:'font-size:13px'},'📋 Ringkasan Berkala Semua Sensor'),
    el('div',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`},'Kirim status 4 sensor + pompa/lampu secara rutin')
  ));
  sumRow.append(makeToggle('', state.wa.summaryEnabled, COLOR.info, ()=>{ state.wa.summaryEnabled=!state.wa.summaryEnabled; save('ts_wa',state.wa); renderApp(); }));
  sumWrap.append(sumRow);
  if (state.wa.summaryEnabled){
    const intRow = el('div',{class:'row'});
    intRow.append(el('span',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`},'Setiap'));
    const intInp = el('input',{class:'input input-num',type:'number',min:5,max:1440}); intInp.value = state.wa.summaryInterval;
    intInp.oninput = ()=>{ state.wa.summaryInterval = Math.max(5, parseInt(intInp.value)||60); save('ts_wa',state.wa); };
    intRow.append(intInp, el('span',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`},'menit'));
    sumWrap.append(intRow);
  }
  wrap.append(sumWrap);

  const btnRow = el('div',{class:'row'});
  const testBtn = el('button',{class:'btn',style:\`border-color:\${COLOR.info};background:rgba(59,158,255,.13);color:\${COLOR.info}\`},'TEST KIRIM');
  const msgSpan = el('span',{class:'mono',style:'font-size:12px'});
  testBtn.onclick = async ()=>{
    if(!state.wa.phone||!state.wa.apiKey){ msgSpan.textContent='✗ Isi nomor & API key dulu'; msgSpan.style.color=COLOR.danger; return; }
    testBtn.textContent='Mengirim...'; testBtn.disabled=true;
    const latest = state.history[state.history.length-1]||{};
    const ok = await sendWA(state.wa.phone, state.wa.apiKey, \`✅ Toi Santuy Test!\nSuhu: \${latest.temperature??'-'}°C | Kelembaban: \${latest.humidity??'-'}% | Tanah: \${latest.soilMoisture??'-'}%\nWaktu: \${nowStr()}\`);
    msgSpan.textContent = ok ? '✓ Terkirim! Cek WhatsApp.' : '✗ Gagal.';
    msgSpan.style.color = ok ? COLOR.accent : COLOR.danger;
    testBtn.textContent='TEST KIRIM'; testBtn.disabled=false;
    setTimeout(()=>{msgSpan.textContent='';},4000);
  };
  btnRow.append(testBtn, msgSpan);
  wrap.append(btnRow);

  return wrap;
}

// ─── MQTT TAB ────────────────────────────────────────────────────
async function fetchMQTTConfig(){
  try {
    const [cfgR, stR] = await Promise.all([fetch('/api/mqtt-config'), fetch('/api/mqtt-status')]);
    if (cfgR.ok){
      const cfg = await cfgR.json();
      state.mqtt = { ...state.mqtt, ...cfg, hasPassword: !!cfg.password, loaded:true };
    }
    if (stR.ok){
      const st = await stR.json();
      state.mqttConnStatus = st.status;
      state.mqttTopics = st.topics;
    }
  } catch {}
}

function renderMQTT(){
  const wrap = el('div',{class:'col'});

  // ── Status card ──
  const statusColors = {
    disabled:'#6b7694', connecting:COLOR.warn, connected:COLOR.accent,
    disconnected:COLOR.danger, error:COLOR.danger, unknown:COLOR.muted,
  };
  const statusLabel = {
    disabled:'⛔ Tidak Aktif', connecting:'🔄 Menghubungkan...', connected:'✅ Terhubung',
    disconnected:'❌ Terputus', error:'❌ Error', unknown:'— Memuat...',
  };
  const sc = statusColors[state.mqttConnStatus] || COLOR.muted;
  const sl = statusLabel[state.mqttConnStatus] || state.mqttConnStatus;
  const statusCard = el('div',{class:'panel', style:\`border-left:3px solid \${sc}\`});
  statusCard.append(
    el('div',{class:'row-between'},
      el('div',{},
        el('div',{class:'section-label'},'📡 Status Koneksi MQTT'),
        el('div',{style:\`font-size:15px;font-weight:700;color:\${sc};margin-top:4px\`}, sl)
      ),
      el('button',{class:'btn-ghost'},
        '🔄 Refresh'
      )
    )
  );
  // tombol refresh
  statusCard.querySelector('button').onclick = async ()=>{
    await fetchMQTTConfig(); renderApp();
  };

  if (state.mqttTopics){
    const topicBox = el('div',{style:\`margin-top:12px;background:#0d1117;border-radius:6px;padding:10px 14px;display:flex;flex-direction:column;gap:6px\`});
    topicBox.append(el('div',{class:'section-label',style:'margin-bottom:4px'},'TOPIK YANG DIPAKAI'));
    [
      ['ESP32 → Server (sensor data)', state.mqttTopics.sensor],
      ['Server → ESP32 (pompa)',       state.mqttTopics.pump],
      ['Server → ESP32 (lampu)',       state.mqttTopics.lamp],
    ].forEach(([lbl,topic])=>{
      topicBox.append(el('div',{class:'row',style:'gap:10px'},
        el('span',{class:'mono',style:\`color:\${COLOR.muted};font-size:11px;min-width:200px\`}, lbl),
        el('span',{class:'mono',style:\`color:\${COLOR.accent};font-size:12px\`}, topic)
      ));
    });
    statusCard.append(topicBox);
  }
  wrap.append(statusCard);

  // ── Form config ──
  const form = el('div',{class:'panel col'});
  form.append(el('div',{class:'section-label'},'⚙️ Konfigurasi Broker MQTT'));

  if (!state.mqtt.loaded){
    form.append(el('div',{class:'mono',style:\`color:\${COLOR.muted};font-size:12px\`},'Memuat konfigurasi dari server...'));
    fetchMQTTConfig().then(()=>renderApp());
    wrap.append(form);
    return wrap;
  }

  const local = {
    enabled:    state.mqtt.enabled,
    brokerUrl:  state.mqtt.brokerUrl,
    username:   state.mqtt.username,
    password:   '',   // kosong = tidak mengubah password yang tersimpan
    deviceCode: state.mqtt.deviceCode,
  };

  const enRow = el('div',{class:'row-between'});
  enRow.append(el('div',{},
    el('div',{style:'font-size:13px;font-weight:700'},'Aktifkan MQTT'),
    el('div',{class:'mono',style:\`font-size:11px;color:\${COLOR.muted}\`},'ESP32 berkomunikasi via broker MQTT (bukan HTTP polling)')
  ));
  enRow.append(makeToggle('', local.enabled, COLOR.accent, ()=>{ local.enabled=!local.enabled; enRow.querySelector('.toggle').style.background = local.enabled?COLOR.accent:'#2a2f42'; }));
  form.append(enRow);

  // Info broker gratis
  const info = el('div',{style:\`padding:10px 14px;background:#0d1117;border:1px solid \${COLOR.border};border-radius:6px;font-size:11px;color:\${COLOR.muted};line-height:1.8\`});
  info.innerHTML = \`<strong style="color:\${COLOR.text}">💡 Broker MQTT Gratis yang disarankan:</strong><br>
    • <span style="color:\${COLOR.accent}">HiveMQ Cloud</span> — <strong>hivemq.com</strong> (daftar gratis, TLS port 8883)<br>
    &nbsp;&nbsp;URL: <span style="color:\${COLOR.accent}">mqtts://xxxx.hivemq.cloud:8883</span><br>
    • <span style="color:\${COLOR.accent}">broker.hivemq.com</span> — tanpa daftar, port 1883 (tidak aman, hanya untuk testing)<br>
    &nbsp;&nbsp;URL: <span style="color:\${COLOR.accent}">mqtt://broker.hivemq.com:1883</span>\`;
  form.append(info);

  const grid2 = el('div',{class:'grid-charts',style:'gap:12px'});

  // Broker URL
  const urlCol = el('div',{});
  urlCol.append(el('label',{class:'field-label'},'BROKER URL'));
  const urlInp = el('input',{class:'input',type:'text',placeholder:'mqtt://broker.hivemq.com:1883'});
  urlInp.value = local.brokerUrl;
  urlInp.oninput = ()=>{ local.brokerUrl = urlInp.value; };
  urlCol.append(urlInp);
  grid2.append(urlCol);

  // Device Code
  const codeCol = el('div',{});
  codeCol.append(el('label',{class:'field-label'},'DEVICE CODE (topik unik kamu)'));
  const codeInp = el('input',{class:'input',type:'text',placeholder:'toisantuy-ab12cd'});
  codeInp.value = local.deviceCode;
  codeInp.oninput = ()=>{ local.deviceCode = codeInp.value; };
  const genBtn = el('button',{class:'btn-ghost',style:'margin-top:6px'},'🎲 Generate Otomatis');
  genBtn.onclick = ()=>{
    const rand = Math.random().toString(36).slice(2,8);
    local.deviceCode = \`toisantuy-\${rand}\`;
    codeInp.value = local.deviceCode;
  };
  codeCol.append(codeInp, genBtn);
  grid2.append(codeCol);
  form.append(grid2);

  const grid3 = el('div',{class:'grid-charts',style:'gap:12px'});

  // Username
  const uCol = el('div',{});
  uCol.append(el('label',{class:'field-label'},'USERNAME (kosongkan jika tidak ada)'));
  const uInp = el('input',{class:'input',type:'text',placeholder:'username broker'});
  uInp.value = local.username;
  uInp.oninput = ()=>{ local.username = uInp.value; };
  uCol.append(uInp);
  grid3.append(uCol);

  // Password
  const pCol = el('div',{});
  pCol.append(el('label',{class:'field-label'}, state.mqtt.hasPassword ? 'PASSWORD (kosongkan = pakai password lama)' : 'PASSWORD (kosongkan jika tidak ada)'));
  const pInp = el('input',{class:'input',type:'password',placeholder: state.mqtt.hasPassword ? '(tersimpan, tidak ditampilkan)' : 'password broker'});
  pInp.value = local.password;
  pInp.oninput = ()=>{ local.password = pInp.value; };
  pCol.append(pInp);
  grid3.append(pCol);
  form.append(grid3);

  // Tombol simpan
  const saveRow = el('div',{class:'row'});
  const saveBtn = el('button',{class:'btn'},'💾 SIMPAN & HUBUNGKAN');
  const saveMsg = el('span',{class:'mono',style:'font-size:12px'});
  saveBtn.onclick = async ()=>{
    saveBtn.textContent = 'Menyimpan...'; saveBtn.disabled = true;
    try {
      const body = {
        enabled:    local.enabled,
        brokerUrl:  local.brokerUrl,
        username:   local.username,
        deviceCode: local.deviceCode,
      };
      if (local.password) body.password = local.password;
      const r = await fetch('/api/mqtt-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if (r.ok){
        saveMsg.textContent = '✓ Tersimpan! Menghubungkan...'; saveMsg.style.color = COLOR.accent;
        await new Promise(r=>setTimeout(r,2000));
        await fetchMQTTConfig();
        renderApp();
      } else { saveMsg.textContent = '✗ Gagal simpan'; saveMsg.style.color = COLOR.danger; }
    } catch { saveMsg.textContent = '✗ Error'; saveMsg.style.color = COLOR.danger; }
    saveBtn.textContent = '💾 SIMPAN & HUBUNGKAN'; saveBtn.disabled = false;
    setTimeout(()=>{ saveMsg.textContent=''; },4000);
  };
  saveRow.append(saveBtn, saveMsg);
  form.append(saveRow);
  wrap.append(form);

  // ── Panduan kode ESP32 untuk MQTT ──
  const guide = el('div',{class:'panel col'});
  guide.append(el('div',{class:'section-label'},'📖 Kode ESP32 untuk Mode MQTT'));
  const code = state.mqttTopics
    ? \`#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* SSID        = "WIFI_KAMU";
const char* PASSWORD    = "PASS_WIFI";
const char* BROKER_HOST = "\${(state.mqtt.brokerUrl||'broker.hivemq.com').replace(/^mqtts?:\/\//,'').replace(/:\d+$/,'')}";
const int   BROKER_PORT = \${state.mqtt.brokerUrl?.includes('8883') ? 8883 : 1883};
const char* MQTT_USER   = "\${state.mqtt.username||''}";
const char* MQTT_PASS   = "PASSWORD_MQTT_KAMU";

// Topik (salin dari dashboard)
const char* TOPIC_SENSOR = "\${state.mqttTopics.sensor}";
const char* TOPIC_PUMP   = "\${state.mqttTopics.pump}";
const char* TOPIC_LAMP   = "\${state.mqttTopics.lamp}";

#define DHT_PIN 4
#define RELAY_PUMP 26
#define RELAY_LAMP 27
DHT dht(DHT_PIN, DHT22);
WiFiClient wifi;
PubSubClient mqtt(wifi);

void callback(char* topic, byte* payload, unsigned int len){
  String msg = String((char*)payload).substring(0,len);
  StaticJsonDocument<64> doc; deserializeJson(doc,msg);
  if (String(topic)==TOPIC_PUMP) digitalWrite(RELAY_PUMP, doc["status"]?LOW:HIGH);
  if (String(topic)==TOPIC_LAMP) digitalWrite(RELAY_LAMP, doc["status"]?LOW:HIGH);
}

void setup(){
  Serial.begin(115200);
  pinMode(RELAY_PUMP,OUTPUT); digitalWrite(RELAY_PUMP,HIGH);
  pinMode(RELAY_LAMP,OUTPUT); digitalWrite(RELAY_LAMP,HIGH);
  dht.begin();
  WiFi.begin(SSID,PASSWORD);
  while(WiFi.status()!=WL_CONNECTED) delay(500);
  mqtt.setServer(BROKER_HOST, BROKER_PORT);
  mqtt.setCallback(callback);
}

void reconnect(){
  while(!mqtt.connected()){
    if(mqtt.connect("toisantuy-esp32", MQTT_USER, MQTT_PASS)){
      mqtt.subscribe(TOPIC_PUMP);
      mqtt.subscribe(TOPIC_LAMP);
    } else delay(3000);
  }
}

void loop(){
  if(!mqtt.connected()) reconnect();
  mqtt.loop();
  static unsigned long last=0;
  if(millis()-last>=2000){
    last=millis();
    float t=dht.readTemperature(), h=dht.readHumidity();
    int air=analogRead(34); float soil=map(analogRead(35),3300,1100,0,100);
    StaticJsonDocument<128> doc;
    doc["temperature"]=t; doc["humidity"]=h;
    doc["airQuality"]=(float)air/4095.0*1000;
    doc["soilMoisture"]=constrain(soil,0,100);
    String out; serializeJson(doc,out);
    mqtt.publish(TOPIC_SENSOR, out.c_str());
  }
}\`
    : '// Simpan konfigurasi MQTT terlebih dahulu, lalu kode akan muncul di sini.';

  guide.append(el('pre',{
    style:\`background:#0d1117;border:1px solid \${COLOR.border};border-radius:6px;padding:12px;font-size:10px;color:#a8d8a8;overflow-x:auto;line-height:1.6;margin-top:8px\`
  }, code));

  const libNote = el('div',{style:\`font-size:11px;color:\${COLOR.muted};font-family:monospace;margin-top:8px\`});
  libNote.innerHTML = '📦 Library yang dibutuhkan: <span style="color:'+COLOR.accent+'">PubSubClient</span> (by Nick O\'Leary) — install via Library Manager Arduino IDE';
  guide.append(libNote);
  wrap.append(guide);

  // ── Export data ──
  const exportCard = el('div',{class:'panel'});
  exportCard.append(el('div',{class:'section-label',style:'margin-bottom:10px'},'💾 Simpan & Export Data Sensor'));
  exportCard.append(el('div',{style:\`font-size:12px;color:\${COLOR.muted};margin-bottom:12px\`},
    \`Data sensor tersimpan otomatis di server (\${state.history.length} titik data tersedia). Download sebagai file JSON untuk analisis lebih lanjut.\`));
  const expRow = el('div',{class:'row'});
  const expBtn = el('button',{class:'btn'},'⬇ Download Data JSON');
  expBtn.onclick = ()=>{ window.open('/api/export','_blank'); };
  expRow.append(expBtn);
  exportCard.append(expRow);
  wrap.append(exportCard);

  return wrap;
}

// ─── DEVICE CONTROL ─────────────────────────────────────────────
async function setDevice(device, status){
  if (device==='pump') state.pumpOn = status; else state.lampOn = status;
  renderApp();
  try {
    await fetch(\`/api/\${device}\`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  } catch {}
}
function toggleDevice(device){
  setDevice(device, device==='pump' ? !state.pumpOn : !state.lampOn);
}

// ─── ALERT / WA HELPERS ──────────────────────────────────────────
async function maybeSendWAAlert(key, msg){
  const wa = state.wa;
  if (!wa.enabled||!wa.phone||!wa.apiKey) return;
  const now_ = Date.now();
  if (now_ - (state.lastWASent[key]??0) < wa.cooldown*60*1000) return;
  state.lastWASent[key] = now_;
  await sendWA(wa.phone, wa.apiKey, msg);
}

// Ringkasan SEMUA sensor, dikirim berkala sesuai interval di setting WhatsApp
async function maybeSendWASummary(latest){
  const wa = state.wa;
  if (!wa.enabled||!wa.phone||!wa.apiKey||!wa.summaryEnabled) return;
  const now_ = Date.now();
  const intervalMs = (wa.summaryInterval||60)*60*1000;
  if (now_ - (state.lastWASummary??0) < intervalMs) return;
  state.lastWASummary = now_;
  const lines = SENSOR_KEYS.map(key=>{
    const t = state.thresh[key];
    const val = latest[key];
    const st = getStatus(key,val,state.thresh);
    const tag = st==='danger' ? ' 🔴BAHAYA' : st==='warn' ? ' 🟡WARNING' : '';
    return \`\${t.icon} \${t.label}: \${val ?? '-'}\${t.unit}\${tag}\`;
  }).join('\n');
  const msg = \`📋 Ringkasan Toi Santuy\n\${lines}\n💧 Pompa: \${state.pumpOn?'ON':'OFF'} | 💡 Lampu: \${state.lampOn?'ON':'OFF'}\nWaktu: \${nowStr()}\`;
  await sendWA(wa.phone, wa.apiKey, msg);
}

// ─── POLLING (same-origin, no CORS) ─────────────────────────────
async function poll(){
  try {
    const [lr,hr] = await Promise.all([fetch('/api/sensor/latest'), fetch('/api/sensor/history?limit=40')]);
    if(!lr.ok) throw new Error();
    const latest = await lr.json();
    const hist = await hr.json();
    state.connected = true;
    state.hasData = !!latest.timestamp;
    state.lastUpd = nowStr();
    state.pumpOn = latest.pumpStatus ?? false;
    state.lampOn = latest.lampStatus ?? false;
    if (latest.timestamp) state.history = hist.length>0 ? hist : [latest];

    const newAlerts = [];
    SENSOR_KEYS.forEach(key=>{
      const val = latest[key]; if(val==null) return;
      const st = getStatus(key,val,state.thresh);
      if (st!=='ok'){
        const t = state.thresh[key];
        newAlerts.push({level:st,msg:\`\${t.icon} \${t.label}: \${val}\${t.unit}\`,time:nowStr()});
        // Alert WA dikirim untuk SEMUA sensor yang melewati batas:
        // - status BAHAYA selalu dikirim
        // - status WARNING dikirim juga jika toggle "Alert saat Warning" aktif
        if (st==='danger' || (st==='warn' && state.wa.alertWarning)) {
          const label = st==='danger' ? 'BAHAYA' : 'WARNING';
          maybeSendWAAlert(key, \`⚠ Toi Santuy ALERT!\n\${t.icon} \${t.label}: \${val}\${t.unit}\nStatus: \${label}\nWaktu: \${nowStr()}\`);
        }
      }
    });
    state.alerts = newAlerts;
    if (state.hasData) maybeSendWASummary(latest);
  } catch {
    state.connected = false;
    state.hasData = false;
  }
  // Saat polling, jangan rebuild form (textarea/input) yang sedang diisi user,
  // dan jangan rebuild jika popup jam (clock picker) sedang terbuka —
  // supaya popup tidak ikut tertutup/ter-reset sebelum user selesai memilih.
  const active = document.activeElement;
  const isTyping = active && (active.tagName==='INPUT' || active.tagName==='TEXTAREA');
  const safeToRebuildContent = state.activeTab==='dashboard' || (!isTyping && !state.anyClockOpen);
  renderApp(safeToRebuildContent);
}

// ─── SCHEDULE CHECKER ────────────────────────────────────────────
function checkSchedules(){
  const cur = hhmm(); const today = todayDay();
  [['pump',state.pumpSched],['lamp',state.lampSched]].forEach(([device,sched])=>{
    if (!sched.enabled || !sched.days.includes(today)) return;
    if (cur === sched.onTime){
      setDevice(device, true);
      if (state.wa.enabled && state.wa.phone && state.wa.apiKey) sendWA(state.wa.phone, state.wa.apiKey, \`⏰ Toi Santuy\n\${sched.onAction}\nWaktu: \${nowStr()}\`);
    }
    if (cur === sched.offTime){
      setDevice(device, false);
      if (state.wa.enabled && state.wa.phone && state.wa.apiKey) sendWA(state.wa.phone, state.wa.apiKey, \`⏰ Toi Santuy\n\${sched.offAction}\nWaktu: \${nowStr()}\`);
    }
  });
}

// ─── MAIN RENDER ──────────────────────────────────────────────────
// Struktur DOM dibuat sekali (lihat init di bawah), lalu setiap bagian
// di-update secara terpisah agar fokus input/textarea tidak hilang
// saat polling data sensor tiap 2 detik.
function renderApp(fullContent = true){
  const topbarEl    = $('#topbar');
  const statusbarEl = $('#statusbar');
  const tabsEl      = $('#tabs');
  const contentEl   = $('#content');

  topbarEl.innerHTML = '';    topbarEl.append(renderTopBar());
  statusbarEl.innerHTML = ''; statusbarEl.append(renderStatusBar());
  tabsEl.innerHTML = '';      tabsEl.append(renderTabs());

  if (!fullContent) return; // skip rebuild content (user sedang mengetik)

  const scrollY = window.scrollY;
  contentEl.innerHTML = '';
  if (state.activeTab==='dashboard') contentEl.append(renderDashboard());
  else if (state.activeTab==='pump') contentEl.append(renderScheduleBlock('pump','Pompa','💧',COLOR.accent));
  else if (state.activeTab==='lamp') contentEl.append(renderScheduleBlock('lamp','Lampu','💡',COLOR.yellow));
  else if (state.activeTab==='setting') contentEl.append(renderSettings());
  else if (state.activeTab==='whatsapp') contentEl.append(renderWhatsApp());
  else if (state.activeTab==='mqtt') contentEl.append(renderMQTT());
  contentEl.append(el('div',{class:'footer'},'✦ TOI SANTUY ✦'));
  window.scrollTo(0, scrollY);
}

// ─── SERVICE WORKER (PWA) ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/sw.js').then(()=>{
      console.log('[PWA] Service Worker terdaftar');
    }).catch(e=>console.log('[PWA] SW gagal:', e));
  });
}

const appRoot = $('#app');
appRoot.append(
  el('div',{id:'topbar'}),
  el('div',{id:'statusbar'}),
  el('div',{id:'tabs'}),
  el('div',{id:'content'}),
);
renderApp(true);
poll();
setInterval(poll, 2000);
setInterval(checkSchedules, 30000);
// Poll MQTT status tiap 5 detik (hanya aktif saat di tab mqtt)
setInterval(async ()=>{
  if (state.activeTab !== 'mqtt') return;
  try {
    const r = await fetch('/api/mqtt-status');
    if (r.ok){ const d=await r.json(); state.mqttConnStatus=d.status; state.mqttTopics=d.topics; renderApp(false); }
  } catch {}
}, 5000);
</script>
</body>
</html>
`;

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(DASHBOARD_HTML);
});


// ─── STORAGE ──────────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "data.json");
const MAX_HISTORY = 100;

let latestData = {
  temperature: null, humidity: null, airQuality: null,
  soilMoisture: null, pumpStatus: false, lampStatus: false, timestamp: null,
};
let history = [];

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.latestData) latestData = { ...latestData, ...parsed.latestData };
    if (Array.isArray(parsed.history)) history = parsed.history.slice(-MAX_HISTORY);
    console.log(`[DATA] Loaded ${history.length} data points`);
  } catch { console.log("[DATA] Fresh start"); }
}

let saveTimer = null;
function saveData() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFile(DATA_FILE, JSON.stringify({ latestData, history }, null, 2), ()=>{});
  }, 500);
}

loadData();

function ingestSensorData({ temperature, humidity, airQuality, soilMoisture }) {
  const entry = {
    temperature:  parseFloat(temperature)  || 0,
    humidity:     parseFloat(humidity)     || 0,
    airQuality:   parseFloat(airQuality)   || 0,
    soilMoisture: parseFloat(soilMoisture) || 0,
    pumpStatus: latestData.pumpStatus,
    lampStatus: latestData.lampStatus,
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString("id-ID", {
      hour:"2-digit", minute:"2-digit", second:"2-digit", timeZone:"Asia/Jakarta"
    }),
  };
  latestData = { ...latestData, ...entry };
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();
  saveData();
  console.log(`[SENSOR] T:${entry.temperature} H:${entry.humidity} Air:${entry.airQuality} Soil:${entry.soilMoisture}`);
  return entry;
}

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.post("/api/sensor", (req, res) => {
  const { temperature, humidity, airQuality, soilMoisture } = req.body;
  if (temperature === undefined) return res.status(400).json({ error: "Data tidak lengkap" });
  res.json({ success: true, received: ingestSensorData({ temperature, humidity, airQuality, soilMoisture }) });
});

app.get("/api/sensor/latest", (req, res) => res.json(latestData));

app.get("/api/sensor/history", (req, res) => {
  const limit = parseInt(req.query.limit ?? "40");
  res.json(history.slice(-limit));
});

app.post("/api/pump", (req, res) => {
  latestData.pumpStatus = !!req.body.status;
  saveData();
  console.log(`[POMPA] ${latestData.pumpStatus ? "ON" : "OFF"}`);
  res.json({ success: true, pumpStatus: latestData.pumpStatus });
});

app.get("/api/pump", (req, res) => res.json({ pumpStatus: latestData.pumpStatus }));

app.post("/api/lamp", (req, res) => {
  latestData.lampStatus = !!req.body.status;
  saveData();
  console.log(`[LAMPU] ${latestData.lampStatus ? "ON" : "OFF"}`);
  res.json({ success: true, lampStatus: latestData.lampStatus });
});

app.get("/api/lamp", (req, res) => res.json({ lampStatus: latestData.lampStatus }));

app.get("/api/status", (req, res) => res.json({
  status: "Toi Santuy IoT Server v3 running",
  dataPoints: history.length,
  lastUpdate: latestData.timestamp,
  pump: latestData.pumpStatus,
  lamp: latestData.lampStatus,
  publicExists: fs.existsSync(publicDir),
  indexExists: fs.existsSync(indexFile),
}));

app.get("/api/export", (req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=toisantuy-data.json");
  res.json({ exportedAt: new Date().toISOString(), latestData, history });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Toi Santuy Server v3 berjalan di port ${PORT}`);
  console.log(`public/ exists: ${fs.existsSync(publicDir)}`);
  console.log(`index.html exists: ${fs.existsSync(indexFile)}`);
});
