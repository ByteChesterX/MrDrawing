import { useEffect, useRef, useState } from 'react'
import { Brush, Eraser, Trash2, Send, Users, Trophy, Clock, Palette, Zap, Crown } from 'lucide-react'

export default function App(){
  const [view,setView]=useState('home')
  const [name,setName]=useState('Oyuncu')
  if(view==='home') return <Home name={name} setName={setName} onPlay={()=>setView('game')} />
  return <Game name={name} onBack={()=>setView('home')} />
}

function Home({name,setName,onPlay}){
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col items-center">
      <nav className="w-full max-w-[1100px] flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-black text-xl tracking-tight"><span className="w-8 h-8 bg-black text-white grid place-items-center rounded-lg"><Brush size={16}/></span> MrDrawing</div>
        <div className="hidden md:flex gap-6 text-sm text-zinc-500"><span>Nasıl Oynanır</span><span>Skor Tablosu</span></div>
        <div className="w-8 h-8 bg-zinc-200 rounded-full" />
      </nav>

      <div className="w-full max-w-[1100px] px-6 grid md:grid-cols-2 gap-10 items-center py-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-3 py-1 text-xs font-medium"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> E2.Micro optimize • 2 kişilik canlı</div>
          <h1 className="text-[48px] md:text-[64px] font-black leading-[0.9] tracking-tighter mt-6">ÇİZ<br/>TAHMİN ET<br/><span className="text-[#ff3b30]">KAZAN.</span></h1>
          <p className="text-zinc-500 mt-4 max-w-[420px] leading-relaxed">Split-screen düello. Biri çizer, diğeri tahmin eder. 90 saniyede en hızlı bilen kazanır.</p>
          <div className="flex gap-3 mt-8">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="İsmin" className="flex-1 max-w-[220px] bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-black text-sm" />
            <button onClick={onPlay} className="bg-black text-white rounded-xl px-8 py-3 font-bold flex items-center gap-2 hover:bg-zinc-800"><Zap size={16}/> HIZLI EŞLEŞ</button>
          </div>
          <div className="flex gap-6 mt-6 text-xs">
            <span className="flex items-center gap-1"><Users size={14}/> 2 oyuncu</span>
            <span className="flex items-center gap-1"><Clock size={14}/> 90sn tur</span>
            <span className="flex items-center gap-1"><Palette size={14}/> Sınırsız renk</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[28px] p-4 shadow-xl">
          <div className="bg-[#f8f7f5] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full"/> CANVAS ÖNİZLEME</span><span className="bg-white border px-2 py-1 rounded-full">90s</span></div>
            <div className="mt-3 bg-white rounded-xl h-[220px] grid place-items-center border border-dashed border-zinc-300">
              <div className="text-center"><Brush className="mx-auto text-zinc-300"/><p className="text-xs text-zinc-400 mt-2">Çizim alanı</p></div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="flex-1 bg-black text-white rounded-full py-2 text-xs font-bold text-center">Çizer: Sen</span>
              <span className="flex-1 bg-white border rounded-full py-2 text-xs font-bold text-center">Tahminci: Rakip</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="bg-[#f8f7f5] rounded-2xl py-4"><div className="font-black text-xl">1.2k</div><div className="text-[10px] tracking-widest text-zinc-500">OYUN</div></div>
            <div className="bg-[#f8f7f5] rounded-2xl py-4"><div className="font-black text-xl">~8MB</div><div className="text-[10px] tracking-widest text-zinc-500">RAM</div></div>
            <div className="bg-[#f8f7f5] rounded-2xl py-4"><div className="font-black text-xl">~5ms</div><div className="text-[10px] tracking-widest text-zinc-500">GECİKME</div></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1100px] px-6 grid md:grid-cols-3 gap-4 pb-10">
        <Feature icon={<Brush size={18}/>} title="Akıcı Çizim" desc="60fps canvas, basınca duyarlı fırça, anında senkron." />
        <Feature icon={<Zap size={18}/>} title="Anında Eşleşme" desc="Kuyruk sistemi, 2. oyuncu gelince direkt oda kurulur." />
        <Feature icon={<Crown size={18}/>} title="Skor & Tur" desc="Doğru tahmin 100 puan, roller otomatik değişir." />
      </div>
    </div>
  )
}
function Feature({icon,title,desc}){ return <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex gap-4"><div className="w-10 h-10 bg-black text-white grid place-items-center rounded-xl shrink-0">{icon}</div><div><div className="font-bold text-sm">{title}</div><div className="text-xs text-zinc-500 leading-relaxed">{desc}</div></div></div> }

function Game({name,onBack}){
  const [status,setStatus]=useState('Eşleşme bekleniyor...')
  const [role,setRole]=useState('guesser')
  const [word,setWord]=useState('')
  const [opp,setOpp]=useState('')
  const [scores,setScores]=useState({})
  const [logs,setLogs]=useState([])
  const [guess,setGuess]=useState('')
  const [color,setColor]=useState('#111111')
  const [width,setWidth]=useState(4)
  const wsRef=useRef(null)
  const canvasRef=useRef(null)
  const drawing=useRef(false)
  const ptsRef=useRef([])

  useEffect(()=>{
    const proto=location.protocol==='https:'?'wss:':'ws:'
    const ws=new WebSocket(`${proto}//${location.hostname}:8080/ws`)
    wsRef.current=ws
    ws.onopen=()=> ws.send(JSON.stringify({t:'join',name}))
    ws.onmessage=e=>{
      const m=JSON.parse(e.data)
      if(m.t==='waiting') setStatus('Rakip aranıyor...')
      if(m.t==='start'){ setRole(m.role); setWord(m.word||''); setOpp(m.opponent||''); setScores(m.scores||{}); setStatus(m.role==='drawer'?'ÇİZ: '+(m.word):'TAHMİN ET!'); clearCanvas(); setLogs(l=>['Eşleşti vs '+m.opponent+' — '+(m.role==='drawer'?'Çizersin':'Tahmin et'),...l]) }
      if(m.t==='draw') drawStroke(m.pts,m.c,m.w)
      if(m.t==='clear') clearCanvas()
      if(m.t==='guess') setLogs(l=>[`${m.from}: ${m.word}`,...l])
      if(m.t==='correct'){ setLogs(l=>[`✓ ${m.by} bildi: ${m.word}`,...l]); setScores(m.scores||{}); setStatus('Doğru! Yeni tur...') }
      if(m.t==='opponent_left') setStatus('Rakip ayrıldı')
    }
    return ()=> ws.close()
  },[])

  function clearCanvas(){ const c=canvasRef.current; if(!c) return; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height) }
  function drawStroke(pts,c,w){ const canvas=canvasRef.current; if(!canvas||!pts||pts.length<2) return; const ctx=canvas.getContext('2d'); ctx.strokeStyle=c||'#111'; ctx.lineWidth=w||4; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.stroke() }

  function pos(e){ const r=canvasRef.current.getBoundingClientRect(); const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left; const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top; const scaleX=canvasRef.current.width/r.width; const scaleY=canvasRef.current.height/r.height; return {x:x*scaleX,y:y*scaleY} }

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col">
      <div className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-sm border border-zinc-200 rounded-full px-3 py-1.5">← Menü</button>
        <div className="flex-1 text-center font-black tracking-tight">{status} {role==='drawer'&&word&&<span className="bg-black text-white px-2 py-1 rounded ml-2">{word}</span>}</div>
        <div className="flex items-center gap-2 text-xs"><Trophy size={14}/> {Object.entries(scores).map(([k,v])=>`${k}:${v}`).join(' • ')||'0:0'}</div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_340px] gap-4 p-4 max-w-[1300px] w-full mx-auto">
        <div className="bg-white border border-zinc-200 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${role==='drawer'?'bg-black text-white':'bg-zinc-100'}`}>{role==='drawer'?'Fırça aktif':'İzleyici'}</span>
            <div className="flex items-center gap-1 ml-auto">
              {['#111111','#ff3b30','#007aff','#34c759','#ffcc00','#af52de'].map(c=> <button key={c} onClick={()=>setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color===c?'border-black':'border-white shadow'}`} style={{background:c}} />)}
            </div>
            <input type="range" min="2" max="12" value={width} onChange={e=>setWidth(+e.target.value)} className="w-20 accent-black" />
            <button onClick={()=>{clearCanvas(); wsRef.current?.send(JSON.stringify({t:'clear'}))}} className="border border-zinc-200 rounded-xl px-3 py-2 text-xs flex items-center gap-1"><Trash2 size={14}/> Temizle</button>
          </div>
          <div className="flex-1 border border-zinc-200 rounded-xl overflow-hidden bg-white relative">
            <canvas ref={canvasRef} width={900} height={560} className="w-full h-full block touch-none"
              onPointerDown={e=>{ if(role!=='drawer') return; drawing.current=true; ptsRef.current=[pos(e)]; e.currentTarget.setPointerCapture(e.pointerId)}}
              onPointerMove={e=>{ if(!drawing.current) return; const p=pos(e); const prev=ptsRef.current[ptsRef.current.length-1]; ptsRef.current.push(p); const ctx=canvasRef.current.getContext('2d'); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y); ctx.stroke()}}
              onPointerUp={e=>{ if(!drawing.current) return; drawing.current=false; wsRef.current?.send(JSON.stringify({t:'draw',pts:ptsRef.current,c:color,w:width}))}}
            />
            {role!=='drawer'&&<div className="absolute inset-0 pointer-events-none grid place-items-center"><span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">Çizer: {opp||'rakip'}</span></div>}
          </div>
          <div className="flex gap-2 mt-3 text-xs text-zinc-500"><span className="flex items-center gap-1"><Users size={12}/> {name} vs {opp||'?'}</span><span className="ml-auto flex items-center gap-1"><Clock size={12}/> 90s</span></div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-200 flex gap-2">
            <input value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ if(!guess.trim()) return; wsRef.current?.send(JSON.stringify({t:'guess',word:guess.trim().toLowerCase()})); setGuess('') }}} placeholder={role==='drawer'?'Çizer tahmin edemez':'Tahmin yaz...'} disabled={role==='drawer'} className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-black disabled:bg-zinc-50" />
            <button onClick={()=>{ if(!guess.trim()||role==='drawer') return; wsRef.current?.send(JSON.stringify({t:'guess',word:guess.trim().toLowerCase()})); setGuess('')}} className="bg-black text-white rounded-xl px-4 grid place-items-center"><Send size={16}/></button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-1.5">
            {logs.length===0&&<div className="text-xs text-zinc-400 text-center py-10">Henüz mesaj yok</div>}
            {logs.map((l,i)=><div key={i} className={`text-sm px-3 py-2 rounded-xl ${l.startsWith('✓')?'bg-green-50 border border-green-200 font-bold':'bg-zinc-50 border border-zinc-200'}`}>{l}</div>)}
          </div>
          <div className="p-2 border-t border-zinc-200 flex gap-2">
            <button onClick={()=>wsRef.current?.send(JSON.stringify({t:'clear'}))} className="flex-1 border border-zinc-200 rounded-xl py-2 text-xs flex items-center justify-center gap-1"><Eraser size={14}/> Temizle</button>
            <button className="flex-1 bg-[#ff3b30] text-white rounded-xl py-2 text-xs font-bold">Oyundan Ayrıl</button>
          </div>
        </div>
      </div>
    </div>
  )
}
