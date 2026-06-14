import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const SERVER_URL = "https://nama-app-kamu.railway.app";

const C = {
  bg: "#0f1117", panel: "#181c27", border: "#252a3a",
  accent: "#00d4aa", warn: "#f5a623", danger: "#e74c3c",
  info: "#3b9eff", purple: "#b48aff", green: "#25d366",
  yellow: "#ffe066", text: "#e2e8f0", muted: "#6b7694", gridLine: "#1e2436",
};

const nowStr  = () => new Date().toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
const hhmm    = () => new Date().toTimeString().slice(0,5);
const todayDay= () => ["minggu","senin","selasa","rabu","kamis","jumat","sabtu"][new Date().getDay()];

// Default threshold — bisa diubah dari menu otomatis
const DEFAULT_THRESH = {
  temperature:  { warn: 35, danger: 45, min: 0, max: 100, unit:"°C",  label:"Suhu",             icon:"🌡️" },
  humidity:     { warn: 85, danger: 95, min: 0, max: 100, unit:"%",   label:"Kelembaban Udara", icon:"💧" },
  airQuality:   { warn:500, danger:750, min: 0, max:1000, unit:"ppm", label:"Kualitas Udara",   icon:"🌫️" },
  soilMoisture: { warn: 30, danger: 15, min: 0, max: 100, unit:"%",   label:"Kelembaban Tanah", icon:"🌱", inverse:true },
};

function getStatus(key, val, thresh) {
  const t = thresh[key];
  if (!t || val == null) return "ok";
  if (t.inverse) { if (val<=t.danger) return "danger"; if (val<=t.warn) return "warn"; return "ok"; }
  if (val>=t.danger) return "danger"; if (val>=t.warn) return "warn"; return "ok";
}

async function sendWA(phone, apiKey, message) {
  try { await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`,{mode:"no-cors"}); return true; }
  catch { return false; }
}

// ─── CLOCK PICKER 24 JAM ──────────────────────────────────────────────────────
function ClockPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("hour");
  const [tempH, setTempH] = useState(parseInt(value.split(":")[0]));
  const [tempM, setTempM] = useState(parseInt(value.split(":")[1]));
  const ref = useRef();

  useEffect(() => { setTempH(parseInt(value.split(":")[0])); setTempM(parseInt(value.split(":")[1])); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const size=200, cx=100, cy=100, Ro=72, Ri=46;
  const hourItems = Array.from({length:12},(_,i) => {
    const a = (i*30-90)*Math.PI/180;
    return {
      outer:{ val: i===0?12:i,         x: cx+Ro*Math.cos(a), y: cy+Ro*Math.sin(a) },
      inner:{ val: i===0?0:(i+12)%24,  x: cx+Ri*Math.cos(a), y: cy+Ri*Math.sin(a) },
    };
  });
  const minItems = Array.from({length:12},(_,i)=>{ const a=(i*30-90)*Math.PI/180; return { val:i*5, x:cx+Ro*Math.cos(a), y:cy+Ro*Math.sin(a) }; });

  const handR = mode==="hour" ? (tempH===0||tempH>=13 ? Ri : Ro) : Ro;
  const handA = (mode==="hour" ? (tempH%12)*30-90 : tempM*6-90) * Math.PI/180;
  const hx=cx+handR*0.82*Math.cos(handA), hy=cy+handR*0.82*Math.sin(handA);

  const handleClick = (e) => {
    const rect=e.currentTarget.getBoundingClientRect();
    const dx=e.clientX-rect.left-cx, dy=e.clientY-rect.top-cy;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const ang=((Math.atan2(dy,dx)*180/Math.PI+90)%360+360)%360;
    if (mode==="hour") {
      const idx=Math.round(ang/30)%12;
      const inner=dist<(Ro+Ri)/2;
      const h=inner?(idx===0?0:idx+12):(idx===0?12:idx);
      setTempH(h); onChange(`${String(h).padStart(2,"0")}:${String(tempM).padStart(2,"0")}`);
      setTimeout(()=>setMode("minute"),220);
    } else {
      const m=Math.round(ang/6)%60;
      setTempM(m); onChange(`${String(tempH).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
      setTimeout(()=>setOpen(false),220);
    }
  };

  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{label}</div>
      <button onClick={()=>{setOpen(o=>!o);setMode("hour");}} style={{
        background:"#0d1117",border:`1px solid ${open?C.accent:C.border}`,borderRadius:8,
        color:C.accent,fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,
        padding:"10px 20px",cursor:"pointer",letterSpacing:2,minWidth:110,
        boxShadow:open?`0 0 12px ${C.accent}44`:"none",transition:"all 0.2s",
      }}>{String(tempH).padStart(2,"0")}:{String(tempM).padStart(2,"0")}</button>

      {open && (
        <div style={{position:"absolute",top:"110%",left:0,zIndex:999,background:"#13171f",border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 32px #0009",minWidth:232}}>
          <div style={{display:"flex",gap:6,marginBottom:10,justifyContent:"center"}}>
            {[{id:"hour",l:"JAM"},{id:"minute",l:"MENIT"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"4px 18px",borderRadius:6,border:`1px solid ${mode===m.id?C.accent:C.border}`,background:mode===m.id?C.accent+"22":"transparent",color:mode===m.id?C.accent:C.muted,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>{m.l}</button>
            ))}
          </div>
          <svg width={size} height={size} onClick={handleClick} style={{cursor:"crosshair",display:"block",margin:"0 auto"}}>
            <circle cx={cx} cy={cy} r={size/2-2} fill="#0a0e16" stroke={C.border} strokeWidth={1}/>
            {mode==="hour"&&<circle cx={cx} cy={cy} r={Ri+13} fill="none" stroke={C.border} strokeWidth={1} strokeDasharray="3 3" opacity={0.4}/>}
            <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={C.accent} strokeWidth={2} strokeLinecap="round"/>
            <circle cx={cx} cy={cy} r={3} fill={C.accent}/>
            <circle cx={hx} cy={hy} r={9} fill={C.accent} opacity={0.85}/>
            {mode==="hour" ? hourItems.map((it,i)=>{
              const aO=tempH===(it.outer.val), aI=tempH===(it.inner.val);
              return (<g key={i}>
                {aO&&<circle cx={it.outer.x} cy={it.outer.y} r={13} fill={C.accent} opacity={0.2}/>}
                <text x={it.outer.x} y={it.outer.y} textAnchor="middle" dominantBaseline="central" fill={aO?C.accent:C.text} fontSize={12} fontFamily="monospace" fontWeight={aO?700:400}>{String(it.outer.val).padStart(2,"0")}</text>
                {aI&&<circle cx={it.inner.x} cy={it.inner.y} r={13} fill={C.accent} opacity={0.2}/>}
                <text x={it.inner.x} y={it.inner.y} textAnchor="middle" dominantBaseline="central" fill={aI?C.accent:C.muted} fontSize={10} fontFamily="monospace" fontWeight={aI?700:400}>{String(it.inner.val).padStart(2,"0")}</text>
              </g>);
            }) : minItems.map((it,i)=>{
              const a=tempM===it.val;
              return (<g key={i}>
                {a&&<circle cx={it.x} cy={it.y} r={13} fill={C.accent} opacity={0.2}/>}
                <text x={it.x} y={it.y} textAnchor="middle" dominantBaseline="central" fill={a?C.accent:C.text} fontSize={11} fontFamily="monospace" fontWeight={a?700:400}>{String(it.val).padStart(2,"0")}</text>
              </g>);
            })}
            {mode==="hour"&&<text x={cx} y={cy+Ri+22} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily="monospace">luar 01-12 · dalam 13-24/00</text>}
          </svg>
          <div style={{display:"flex",gap:4,marginTop:8,justifyContent:"center",flexWrap:"wrap"}}>
            {mode==="minute"
              ? [0,15,30,45].map(m=><button key={m} onClick={()=>{setTempM(m);onChange(`${String(tempH).padStart(2,"0")}:${String(m).padStart(2,"0")}`);setOpen(false);}} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${tempM===m?C.accent:C.border}`,background:tempM===m?C.accent+"22":"transparent",color:tempM===m?C.accent:C.muted,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>:{String(m).padStart(2,"0")}</button>)
              : [0,6,7,12,17,18,19,20,21].map(h=><button key={h} onClick={()=>{setTempH(h);onChange(`${String(h).padStart(2,"0")}:${String(tempM).padStart(2,"0")}`);setMode("minute");}} style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${tempH===h?C.accent:C.border}`,background:tempH===h?C.accent+"22":"transparent",color:tempH===h?C.accent:C.muted,fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>{String(h).padStart(2,"0")}:xx</button>)
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function TopBar({ pumpOn, onTogglePump, lampOn, onToggleLamp, alerts, connected }) {
  const Tog = ({label,on,onToggle,color}) => (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{label}</span>
      <button onClick={onToggle} style={{position:"relative",width:52,height:26,borderRadius:13,border:"none",cursor:"pointer",background:on?color:"#2a2f42",transition:"background 0.3s",boxShadow:on?`0 0 12px ${color}55`:"none"}}>
        <div style={{position:"absolute",top:3,left:on?29:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s"}}/>
      </button>
      <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:on?color:C.muted,minWidth:28}}>{on?"ON":"OFF"}</span>
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:56,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:connected?C.accent:C.danger,boxShadow:`0 0 8px ${connected?C.accent:C.danger}`}}/>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,color:C.text,letterSpacing:1}}>
          Toi Santuy <span style={{color:C.muted}}>/ IoT Monitor</span>
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        {alerts.length>0&&<div style={{display:"flex",alignItems:"center",gap:6,background:"#2a1a1a",border:`1px solid ${C.danger}`,borderRadius:6,padding:"4px 12px",fontSize:12,color:C.danger}}>⚠ {alerts.length} Alert</div>}
        <Tog label="POMPA 💧" on={pumpOn} onToggle={onTogglePump} color={C.accent}/>
        <Tog label="LAMPU 💡" on={lampOn} onToggle={onToggleLamp} color={C.yellow}/>
      </div>
    </div>
  );
}

// ─── STAT CARD (tanpa status danger/warn) ────────────────────────────────────
function StatCard({ sensorKey, value, history, thresh }) {
  const t = thresh[sensorKey];
  const spark = history.slice(-20).map((d,i)=>({i,v:d[sensorKey]}));
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid ${C.accent}`,borderRadius:8,padding:"16px 20px",display:"flex",flexDirection:"column",gap:8}}>
      <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace"}}>{t.icon} {t.label}</span>
      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{fontSize:36,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{value??"-"}</span>
        <span style={{fontSize:14,color:C.muted,fontFamily:"monospace"}}>{t.unit}</span>
      </div>
      <div style={{height:44,marginTop:4}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark}><Line type="monotone" dataKey="v" stroke={C.accent} strokeWidth={1.5} dot={false}/></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── SENSOR CHART (tanpa warning/danger visual) ───────────────────────────────
function SensorChart({ sensorKey, history, thresh }) {
  const t = thresh[sensorKey];
  const data   = history.slice(-40);
  const latest = data[data.length-1]?.[sensorKey] ?? 0;
  const Tip = ({active,payload}) => {
    if (!active||!payload?.length) return null;
    return (<div style={{background:"#1a1f2e",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:12}}>
      <div style={{color:C.muted,fontFamily:"monospace"}}>{payload[0]?.payload?.time}</div>
      <div style={{color:C.accent,fontFamily:"monospace",fontWeight:700}}>{payload[0].value} {t.unit}</div>
    </div>);
  };
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace"}}>{t.icon} {t.label}</span>
        <span style={{fontSize:12,color:C.accent,fontFamily:"monospace",fontWeight:700}}>{latest} {t.unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{top:4,right:4,bottom:0,left:-10}}>
          <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey="time" tick={{fontSize:9,fill:C.muted,fontFamily:"monospace"}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis domain={[t.min,t.max]} tick={{fontSize:9,fill:C.muted,fontFamily:"monospace"}} tickLine={false} axisLine={false}/>
          <Tooltip content={<Tip/>}/>
          <Line type="monotone" dataKey={sensorKey} stroke={C.accent} strokeWidth={2} dot={false} activeDot={{r:4,fill:C.accent}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── THRESHOLD SETTINGS ───────────────────────────────────────────────────────
function ThresholdSettings({ thresh, onSave }) {
  const [local, setLocal] = useState(thresh);
  const inp = {background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontFamily:"monospace",fontSize:13,padding:"6px 10px",outline:"none",width:90,textAlign:"center"};
  const update = (key, field, val) => setLocal(p=>({...p,[key]:{...p[key],[field]:parseFloat(val)||0}}));
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 24px"}}>
      <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace",marginBottom:16}}>⚙️ Setting Batas Alert Sensor</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {Object.keys(local).map(key => {
          const t = local[key];
          return (
            <div key={key} style={{display:"flex",alignItems:"center",gap:16,padding:"12px 16px",background:"#0d1117",borderRadius:8,flexWrap:"wrap"}}>
              <div style={{minWidth:140,fontFamily:"monospace",fontSize:13,color:C.text}}>{t.icon} {t.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.warn,fontFamily:"monospace"}}>WARNING:</span>
                <input type="number" value={t.warn} onChange={e=>update(key,"warn",e.target.value)} style={{...inp,borderColor:C.warn+"66"}}/>
                <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{t.unit}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.danger,fontFamily:"monospace"}}>DANGER:</span>
                <input type="number" value={t.danger} onChange={e=>update(key,"danger",e.target.value)} style={{...inp,borderColor:C.danger+"66"}}/>
                <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{t.unit}</span>
              </div>
              {t.inverse && <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>(nilai rendah = bahaya)</span>}
            </div>
          );
        })}
      </div>
      <button onClick={()=>onSave(local)} style={{marginTop:16,padding:"9px 28px",borderRadius:6,border:`1px solid ${C.accent}`,background:C.accent+"22",color:C.accent,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>
        💾 SIMPAN BATAS
      </button>
      <div style={{marginTop:10,fontSize:11,color:C.muted,fontFamily:"monospace"}}>
        ⚠ Batas ini digunakan untuk alert WhatsApp & indikator di tab jadwal
      </div>
    </div>
  );
}

// ─── HARI PICKER ─────────────────────────────────────────────────────────────
const HARI = ["senin","selasa","rabu","kamis","jumat","sabtu","minggu"];
const HL   = {senin:"Sen",selasa:"Sel",rabu:"Rab",kamis:"Kam",jumat:"Jum",sabtu:"Sab",minggu:"Min"};

function DayPicker({ days, onChange }) {
  const toggle = d => onChange(days.includes(d)?days.filter(x=>x!==d):[...days,d]);
  return (
    <div>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>PILIH HARI</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {HARI.map(d=>(
          <button key={d} onClick={()=>toggle(d)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${days.includes(d)?C.purple:C.border}`,background:days.includes(d)?C.purple+"22":"transparent",color:days.includes(d)?C.purple:C.muted,fontFamily:"monospace",fontSize:12,cursor:"pointer",fontWeight:days.includes(d)?700:400,transition:"all 0.15s"}}>{HL[d]}</button>
        ))}
        <button onClick={()=>onChange([...HARI])} style={{padding:"6px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>Semua</button>
        <button onClick={()=>onChange([])}        style={{padding:"6px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>Reset</button>
      </div>
    </div>
  );
}

// ─── SCHEDULE BLOCK ───────────────────────────────────────────────────────────
function ScheduleBlock({ title, icon, color, schedule, onSave, deviceOn, onToggle, thresh, latestData }) {
  const [onTime,    setOnTime]    = useState(schedule.onTime);
  const [offTime,   setOffTime]   = useState(schedule.offTime);
  const [enabled,   setEnabled]   = useState(schedule.enabled);
  const [days,      setDays]      = useState(schedule.days??[...HARI]);
  const [onAction,  setOnAction]  = useState(schedule.onAction??`${title} ON ✅`);
  const [offAction, setOffAction] = useState(schedule.offAction??`${title} OFF 🛑`);
  const ta = {background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontFamily:"monospace",fontSize:12,padding:"8px 12px",outline:"none",width:"100%",resize:"vertical",minHeight:56};

  // Sensor alerts untuk ditampilkan di sini
  const sensorKeys = ["temperature","humidity","airQuality","soilMoisture"];
  const sensorAlerts = sensorKeys.map(key=>{
    const val = latestData?.[key]; if (val==null) return null;
    const st = getStatus(key,val,thresh);
    if (st==="ok") return null;
    const t = thresh[key];
    return { key, val, st, label:t.label, icon:t.icon, unit:t.unit };
  }).filter(Boolean);

  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderLeft:`3px solid ${color}`,borderRadius:8,padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,color:C.text,fontWeight:700,marginBottom:2}}>{icon} Jadwal {title}</div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>Atur hari, waktu & pesan otomatis</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setEnabled(e=>!e)} style={{position:"relative",width:52,height:26,borderRadius:13,border:"none",cursor:"pointer",background:enabled?color:"#2a2f42",transition:"background 0.3s"}}>
            <div style={{position:"absolute",top:3,left:enabled?29:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s"}}/>
          </button>
          <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:enabled?color:C.muted}}>{enabled?"AKTIF":"OFF"}</span>
        </div>
      </div>

      {/* Sensor status (warning/danger tampil di sini) */}
      {sensorAlerts.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1}}>⚠ Status Sensor Saat Ini</div>
          {sensorAlerts.map(a=>(
            <div key={a.key} style={{display:"flex",alignItems:"center",gap:10,background:a.st==="danger"?"#2a1a1a":"#2a2210",border:`1px solid ${a.st==="danger"?C.danger:C.warn}44`,borderRadius:6,padding:"8px 12px"}}>
              <span>{a.st==="danger"?"🔴":"🟡"}</span>
              <span style={{fontSize:12,color:C.text,fontFamily:"monospace",flex:1}}>{a.icon} {a.label}: {a.val}{a.unit}</span>
              <span style={{fontSize:10,fontFamily:"monospace",color:a.st==="danger"?C.danger:C.warn,fontWeight:700}}>{a.st==="danger"?"BAHAYA":"WARNING"}</span>
            </div>
          ))}
        </div>
      )}

      <DayPicker days={days} onChange={setDays}/>

      <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
        <ClockPicker value={onTime}  onChange={setOnTime}  label={`${icon} NYALA PUKUL`}/>
        <ClockPicker value={offTime} onChange={setOffTime} label="🛑 MATI PUKUL"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <div style={{fontSize:11,color,fontFamily:"monospace",marginBottom:6}}>✅ PESAN SAAT ON</div>
          <textarea value={onAction} onChange={e=>setOnAction(e.target.value)} style={ta}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.danger,fontFamily:"monospace",marginBottom:6}}>🛑 PESAN SAAT OFF</div>
          <textarea value={offAction} onChange={e=>setOffAction(e.target.value)} style={ta}/>
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,paddingTop:4,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>onToggle(true)}  style={{padding:"8px 20px",borderRadius:6,border:`1px solid ${color}`,background:deviceOn?color+"33":"transparent",color,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>ON</button>
          <button onClick={()=>onToggle(false)} style={{padding:"8px 20px",borderRadius:6,border:`1px solid ${C.danger}`,background:!deviceOn?C.danger+"33":"transparent",color:C.danger,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>OFF</button>
          <span style={{fontSize:12,color:deviceOn?color:C.muted,fontFamily:"monospace",fontWeight:700}}>{icon} {deviceOn?"● ON":"○ OFF"}</span>
        </div>
        <button onClick={()=>onSave({onTime,offTime,enabled,days,onAction,offAction})} style={{padding:"8px 22px",borderRadius:6,border:`1px solid ${color}`,background:color+"22",color,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>💾 SIMPAN</button>
      </div>

      {enabled&&<div style={{padding:"8px 12px",background:color+"11",border:`1px solid ${color}44`,borderRadius:6,fontSize:11,color,fontFamily:"monospace"}}>● Aktif — {days.map(d=>HL[d]).join(", ")} | ON: {onTime} | OFF: {offTime}</div>}
    </div>
  );
}

// ─── WHATSAPP PANEL ───────────────────────────────────────────────────────────
function WhatsAppPanel({ waConfig, onSave, onTestSend }) {
  const [phone,setPhone]=useState(waConfig.phone);
  const [apiKey,setApiKey]=useState(waConfig.apiKey);
  const [enabled,setEnabled]=useState(waConfig.enabled);
  const [cooldown,setCooldown]=useState(waConfig.cooldown??10);
  const [msg,setMsg]=useState(""); const [sending,setSending]=useState(false); const [guide,setGuide]=useState(false);
  const inp={background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontFamily:"monospace",fontSize:13,padding:"8px 12px",outline:"none",width:"100%"};
  const handleTest=async()=>{ setSending(true);setMsg("Mengirim..."); const ok=await onTestSend(phone,apiKey); setMsg(ok?"✓ Terkirim!":"✗ Gagal. Cek nomor & API key."); setSending(false); setTimeout(()=>setMsg(""),4000); };
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace",marginBottom:4}}>📱 Alert WhatsApp</div>
          <div style={{fontSize:12,color:C.muted}}>Notifikasi otomatis via CallMeBot (gratis)</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setGuide(g=>!g)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 10px",fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>{guide?"Tutup":"📖 Cara Setup"}</button>
          <button onClick={()=>setEnabled(e=>!e)} style={{position:"relative",width:52,height:26,borderRadius:13,border:"none",cursor:"pointer",background:enabled?C.green:"#2a2f42",transition:"background 0.3s"}}>
            <div style={{position:"absolute",top:3,left:enabled?29:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s"}}/>
          </button>
          <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:enabled?C.green:C.muted}}>{enabled?"AKTIF":"OFF"}</span>
        </div>
      </div>
      {guide&&<div style={{marginBottom:16,padding:"14px 16px",background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.muted,lineHeight:1.8}}>
        <div style={{color:C.text,fontWeight:700,marginBottom:8}}>📖 Cara Setup CallMeBot:</div>
        <div>1. Simpan nomor <span style={{color:C.accent,fontFamily:"monospace"}}>+34 644 44 21 29</span> di kontak WA</div>
        <div>2. Kirim pesan: <span style={{color:C.accent,fontFamily:"monospace"}}>I allow callmebot to send me messages</span></div>
        <div>3. Tunggu balasan berisi <strong style={{color:C.accent}}>API Key</strong></div>
        <div>4. Nomor format: <span style={{color:C.accent,fontFamily:"monospace"}}>628xxxxxxxxx</span> (tanpa +)</div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>NOMOR WA (628xxx)</div><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="628123456789" style={inp}/></div>
        <div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>API KEY CALLMEBOT</div><input type="text" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="123456" style={inp}/></div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>COOLDOWN ALERT</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input type="range" min={1} max={60} value={cooldown} onChange={e=>setCooldown(+e.target.value)} style={{flex:1,accentColor:C.green}}/>
          <span style={{fontFamily:"monospace",fontSize:14,color:C.text,minWidth:60}}>{cooldown} menit</span>
        </div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>onSave({phone,apiKey,enabled,cooldown})} style={{padding:"9px 24px",borderRadius:6,border:`1px solid ${C.green}`,background:C.green+"22",color:C.green,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>SIMPAN</button>
        <button onClick={handleTest} disabled={sending||!phone||!apiKey} style={{padding:"9px 24px",borderRadius:6,border:`1px solid ${C.info}`,background:C.info+"22",color:C.info,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer",opacity:(!phone||!apiKey)?0.5:1}}>{sending?"Mengirim...":"TEST KIRIM"}</button>
        {msg&&<span style={{fontSize:12,fontFamily:"monospace",color:msg.startsWith("✓")?C.accent:C.danger}}>{msg}</span>}
      </div>
    </div>
  );
}

// ─── CONNECTION PANEL ─────────────────────────────────────────────────────────
function ConnectionPanel({ serverUrl, onSave, connected, lastUpdate, dataCount }) {
  const [url,setUrl]=useState(serverUrl);
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 24px"}}>
      <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace",marginBottom:16}}>🔌 Koneksi Server</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"flex-end",marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>URL SERVER</div>
          <input type="text" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://smartgarden-production-2a96.up.railway.app" style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontFamily:"monospace",fontSize:13,padding:"8px 12px",outline:"none",width:"100%"}}/>
        </div>
        <button onClick={()=>onSave(url)} style={{padding:"9px 20px",borderRadius:6,border:`1px solid ${C.accent}`,background:C.accent+"22",color:C.accent,fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer"}}>HUBUNGKAN</button>
      </div>
      <div style={{display:"flex",gap:20,fontSize:12,fontFamily:"monospace",flexWrap:"wrap"}}>
        <span style={{color:connected?C.accent:C.danger}}>● {connected?"TERHUBUNG":"TERPUTUS"}</span>
        <span style={{color:C.muted}}>Update: {lastUpdate}</span>
        <span style={{color:C.muted}}>Data: {dataCount} titik</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [serverUrl, setServerUrl] = useState(SERVER_URL);
  const [history,   setHistory]   = useState([]);
  const [connected, setConnected] = useState(false);
  const [pumpOn,    setPumpOn]    = useState(false);
  const [lampOn,    setLampOn]    = useState(false);
  const [alerts,    setAlerts]    = useState([]);
  const [lastUpd,   setLastUpd]   = useState("—");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [thresh,    setThresh]    = useState(DEFAULT_THRESH);

  const defSched = (n) => ({onTime:"06:00",offTime:"18:00",enabled:false,days:[...HARI],onAction:`${n} ON ✅`,offAction:`${n} OFF 🛑`});
  const [pumpSched, setPumpSched] = useState(defSched("Pompa"));
  const [lampSched, setLampSched] = useState(defSched("Lampu"));
  const [waConfig,  setWaConfig]  = useState({phone:"",apiKey:"",enabled:false,cooldown:10});

  const savedWa   =useRef(waConfig); const lastWASent=useRef({});
  const savedPump =useRef(pumpSched); const savedLamp=useRef(lampSched);
  const urlRef    =useRef(serverUrl); const savedThresh=useRef(thresh);

  useEffect(()=>{savedWa.current=waConfig;},[waConfig]);
  useEffect(()=>{savedPump.current=pumpSched;},[pumpSched]);
  useEffect(()=>{savedLamp.current=lampSched;},[lampSched]);
  useEffect(()=>{urlRef.current=serverUrl;},[serverUrl]);
  useEffect(()=>{savedThresh.current=thresh;},[thresh]);

  const sendWAAlert=useCallback(async(key,msg)=>{
    const wa=savedWa.current;
    if(!wa.enabled||!wa.phone||!wa.apiKey) return;
    const now_=Date.now();
    if(now_-(lastWASent.current[key]??0)<wa.cooldown*60*1000) return;
    lastWASent.current[key]=now_;
    await sendWA(wa.phone,wa.apiKey,msg);
  },[]);

  useEffect(()=>{
    const fetch_=async()=>{
      try {
        const [lr,hr]=await Promise.all([fetch(`${urlRef.current}/api/sensor/latest`),fetch(`${urlRef.current}/api/sensor/history?limit=40`)]);
        if(!lr.ok) throw new Error();
        const latest=await lr.json(); const hist=await hr.json();
        setConnected(true); setLastUpd(nowStr());
        setPumpOn(latest.pumpStatus??false); setLampOn(latest.lampStatus??false);
        if(latest.timestamp) setHistory(hist.length>0?hist:[latest]);
        const newAlerts=[];
        ["temperature","humidity","airQuality","soilMoisture"].forEach(key=>{
          const val=latest[key]; if(val==null) return;
          const st=getStatus(key,val,savedThresh.current);
          if(st!=="ok"){
            const t=savedThresh.current[key];
            newAlerts.push({level:st,msg:`${t.icon} ${t.label}: ${val}${t.unit}`,time:nowStr()});
            if(st==="danger") sendWAAlert(key,`⚠ Toi Santuy ALERT!\n${t.icon} ${t.label}: ${val}${t.unit}\nStatus: BAHAYA\nWaktu: ${nowStr()}`);
          }
        });
        setAlerts(newAlerts);
      } catch { setConnected(false); }
    };
    fetch_(); const id=setInterval(fetch_,2000); return ()=>clearInterval(id);
  },[sendWAAlert]);

  useEffect(()=>{
    const id=setInterval(()=>{
      const cur=hhmm(); const today=todayDay();
      const ps=savedPump.current;
      if(ps.enabled&&ps.days?.includes(today)){
        if(cur===ps.onTime){handleDevice("pump",true);const wa=savedWa.current;if(wa.enabled&&wa.phone&&wa.apiKey)sendWA(wa.phone,wa.apiKey,`⏰ Toi Santuy\n${ps.onAction}\nWaktu: ${nowStr()}`);}
        if(cur===ps.offTime){handleDevice("pump",false);const wa=savedWa.current;if(wa.enabled&&wa.phone&&wa.apiKey)sendWA(wa.phone,wa.apiKey,`⏰ Toi Santuy\n${ps.offAction}\nWaktu: ${nowStr()}`);}
      }
      const ls=savedLamp.current;
      if(ls.enabled&&ls.days?.includes(today)){
        if(cur===ls.onTime){handleDevice("lamp",true);const wa=savedWa.current;if(wa.enabled&&wa.phone&&wa.apiKey)sendWA(wa.phone,wa.apiKey,`⏰ Toi Santuy\n${ls.onAction}\nWaktu: ${nowStr()}`);}
        if(cur===ls.offTime){handleDevice("lamp",false);const wa=savedWa.current;if(wa.enabled&&wa.phone&&wa.apiKey)sendWA(wa.phone,wa.apiKey,`⏰ Toi Santuy\n${ls.offAction}\nWaktu: ${nowStr()}`);}
      }
    },30000);
    return ()=>clearInterval(id);
  },[]);

  const handleDevice=async(device,status)=>{
    if(device==="pump") setPumpOn(status);
    if(device==="lamp") setLampOn(status);
    try { await fetch(`${urlRef.current}/api/${device}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})}); } catch{}
  };

  const latest=history[history.length-1]??{};
  const sensorKeys=["temperature","humidity","airQuality","soilMoisture"];
  const tabs=[
    {id:"dashboard",label:"📊 Dashboard"},
    {id:"pump",     label:"💧 Pompa"},
    {id:"lamp",     label:"💡 Lampu"},
    {id:"otomatis", label:"⚙️ Setting"},
    {id:"whatsapp", label:"📱 WhatsApp"},
    {id:"connect",  label:"🔌 Server"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      `}</style>

      <TopBar pumpOn={pumpOn} onTogglePump={()=>handleDevice("pump",!pumpOn)} lampOn={lampOn} onToggleLamp={()=>handleDevice("lamp",!lampOn)} alerts={alerts} connected={connected}/>

      <div style={{display:"flex",gap:16,padding:"7px 24px",background:"#13171f",borderBottom:`1px solid ${C.border}`,fontSize:11,fontFamily:"monospace",flexWrap:"wrap"}}>
        <span style={{color:connected?C.accent:C.danger}}>{connected?"● REALTIME":"● OFFLINE"}</span>
        <span style={{color:C.muted}}>Update: {lastUpd}</span>
        <span style={{color:pumpOn?C.accent:C.muted}}>💧 {pumpOn?"ON":"OFF"}</span>
        <span style={{color:lampOn?C.yellow:C.muted}}>💡 {lampOn?"ON":"OFF"}</span>
        {pumpSched.enabled&&<span style={{color:C.purple}}>⏰ Pompa: {pumpSched.onTime}–{pumpSched.offTime}</span>}
        {lampSched.enabled&&<span style={{color:C.yellow}}>⏰ Lampu: {lampSched.onTime}–{lampSched.offTime}</span>}
        {waConfig.enabled&&<span style={{color:C.green}}>📱 WA: ON</span>}
        {alerts.length>0&&<span style={{color:C.warn}}>⚠ {alerts.length} alert</span>}
      </div>

      <div style={{display:"flex",gap:2,padding:"0 24px",background:"#13171f",borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"10px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?`2px solid ${C.accent}`:"2px solid transparent",color:activeTab===tab.id?C.accent:C.muted,fontFamily:"monospace",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
        {activeTab==="dashboard"&&(<>
          {!connected&&<div style={{padding:"14px 18px",background:"#1a1a0d",border:`1px solid ${C.warn}`,borderRadius:8,fontSize:13,color:C.warn,fontFamily:"monospace"}}>⚠ Belum terhubung. Buka tab "🔌 Server" dan masukkan URL Railway kamu.</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
            {sensorKeys.map(k=><StatCard key={k} sensorKey={k} value={latest[k]??"-"} history={history} thresh={thresh}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
            {sensorKeys.map(k=><SensorChart key={k} sensorKey={k} history={history} thresh={thresh}/>)}
          </div>
        </>)}

        {activeTab==="pump"&&<ScheduleBlock title="Pompa" icon="💧" color={C.accent} schedule={pumpSched} onSave={setPumpSched} deviceOn={pumpOn} onToggle={v=>handleDevice("pump",v)} thresh={thresh} latestData={latest}/>}
        {activeTab==="lamp"&&<ScheduleBlock title="Lampu" icon="💡" color={C.yellow} schedule={lampSched} onSave={setLampSched} deviceOn={lampOn} onToggle={v=>handleDevice("lamp",v)} thresh={thresh} latestData={latest}/>}

        {activeTab==="otomatis"&&<ThresholdSettings thresh={thresh} onSave={setThresh}/>}
        {activeTab==="whatsapp"&&<WhatsAppPanel waConfig={waConfig} onSave={setWaConfig} onTestSend={async(p,k)=>sendWA(p,k,`✅ Toi Santuy Test!\nSuhu: ${latest.temperature??"-"}°C | Kelembaban: ${latest.humidity??"-"}% | Tanah: ${latest.soilMoisture??"-"}%\nWaktu: ${nowStr()}`)}/>}
        {activeTab==="connect"&&<ConnectionPanel serverUrl={serverUrl} onSave={setServerUrl} connected={connected} lastUpdate={lastUpd} dataCount={history.length}/>}

        <div style={{textAlign:"center",fontSize:11,color:C.muted,fontFamily:"'JetBrains Mono',monospace",paddingBottom:8,letterSpacing:3}}>✦ TOI SANTUY ✦</div>
      </div>
    </div>
  );
}
