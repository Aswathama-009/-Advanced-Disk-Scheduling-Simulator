import React, { useMemo, useState, useEffect, useRef } from 'react'
import TrackView from './components/TrackView'
import TimelineChart from './components/TimelineChart'
import { parseRequests, parseCSVFile, formatTraceToCSV, downloadCSV, exportPNG } from './utils'
import {
  simulateFCFS, simulateSSTF, simulateSCAN, simulateCSCAN, simulateLOOK, simulateCLOOK, metricsFromTrace
} from './simEngine'
import { Howl } from 'howler'

export default function App(){
  const [diskMax, setDiskMax] = useState(199)
  const [headStart, setHeadStart] = useState(50)
  const [requestsText, setRequestsText] = useState('95,180,34,119,11,123,62,64')
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [direction, setDirection] = useState('up')
  const [useEdge, setUseEdge] = useState(true)
  const [countJump, setCountJump] = useState(false)
  const [mode, setMode] = useState('rotating') // 'rotating' or 'linear'
  const [dark, setDark] = useState(true)

  const [trace, setTrace] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  const fileRef = useRef(null)
  const appRef = useRef(null)

  // sound for head movement
  const ping = useMemo(()=> new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'] }), [])

  const requests = useMemo(()=> parseRequests(requestsText, diskMax), [requestsText, diskMax])

  useEffect(()=> {
    const t = computeTrace(requests, headStart, algorithm, diskMax, direction, useEdge, countJump)
    setTrace(t)
    setCurrentStepIndex(-1)
    setIsRunning(false)
  }, [requests, headStart, algorithm, diskMax, direction, useEdge, countJump])

  useEffect(()=>{
    if (!isRunning) return
    let rafId
    let last = performance.now()
    const msPerStep = 300 / speed
    const loop = (now)=>{
      if (now - last >= msPerStep){
        setCurrentStepIndex(i=>{
          const next = Math.min(i+1, trace.length-1)
          if (next > i && trace[next] && trace[next].servedIndex !== -1) {
            // play sound for actual seek to request
            try{ ping.play() } catch(e){}
          }
          if (next === trace.length-1) setIsRunning(false)
          return next
        })
        last = now
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return ()=> cancelAnimationFrame(rafId)
  }, [isRunning, speed, trace, ping])

  const metrics = useMemo(()=> metricsFromTrace(trace), [trace])

  function computeTrace(requests, headStart, algorithm, diskMax, direction, useEdge, countJump){
    switch(algorithm){
      case 'FCFS': return simulateFCFS(requests, headStart)
      case 'SSTF': return simulateSSTF(requests, headStart)
      case 'SCAN': return simulateSCAN(requests, headStart, diskMax, direction, useEdge)
      case 'C-SCAN': return simulateCSCAN(requests, headStart, diskMax, direction, countJump)
      case 'LOOK': return simulateLOOK(requests, headStart, direction)
      case 'C-LOOK': return simulateCLOOK(requests, headStart, direction)
      default: return []
    }
  }

  function onLoadCSV(e){
    const file = e.target.files[0]
    if (!file) return
    parseCSVFile(file, (data)=>{
      const nums = data.flat().map(c=>Number(c)).filter(n=>!Number.isNaN(n))
      setRequestsText(nums.join(','))
    })
  }

  function onExportCSV(){
    const rows = formatTraceToCSV(trace)
    downloadCSV('trace.csv', rows)
  }

  function onExportPNG(){
    if (!appRef.current) return
    exportPNG(appRef.current, 'snapshot.png')
  }

  function onCompare(){
    const algs = ['FCFS','SSTF','SCAN','C-SCAN','LOOK','C-LOOK']
    const lines = algs.map(a=>{
      const t = computeTrace(requests, headStart, a, diskMax, direction, useEdge, countJump)
      const m = metricsFromTrace(t)
      return `${a}: total=${m.totalMovement.toFixed(1)}, avg=${m.avgSeek.toFixed(2)}, served=${m.servedCount}`
    })
    alert(lines.join('\n'))
  }

  return (
    <div className={dark? 'app dark': 'app'} ref={appRef}>
      <header className="header card">
        <h1>Advanced Disk Scheduling Simulator</h1>
        <div className="controlsHeader">
          <label className="small"><input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)} /> Dark mode</label>
        </div>
      </header>

      <section className="card controls">
        <div className="row">
          <label>Disk Max (0..N)</label>
          <input type="number" value={diskMax} onChange={e=>setDiskMax(Number(e.target.value)||0)} />
          <label>Head Start</label>
          <input type="number" value={headStart} onChange={e=>setHeadStart(Number(e.target.value)||0)} />
        </div>

        <div className="row">
          <label>Algorithm</label>
          <select value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>
            <option>FCFS</option>
            <option>SSTF</option>
            <option>SCAN</option>
            <option>C-SCAN</option>
            <option>LOOK</option>
            <option>C-LOOK</option>
          </select>

          <label>Direction</label>
          <select value={direction} onChange={e=>setDirection(e.target.value)}>
            <option value="up">Up</option>
            <option value="down">Down</option>
          </select>

          <label><input type="checkbox" checked={useEdge} onChange={e=>setUseEdge(e.target.checked)} /> SCAN use edge</label>
          <label><input type="checkbox" checked={countJump} onChange={e=>setCountJump(e.target.checked)} /> C-SCAN count jump</label>

          <label>Mode</label>
          <select value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="rotating">Rotating Disk</option>
            <option value="linear">Linear Track</option>
          </select>
        </div>

        <div className="row">
          <label>Requests (comma/space separated)</label>
          <textarea rows={3} value={requestsText} onChange={e=>setRequestsText(e.target.value)} />
        </div>

        <div className="row actions">
          <button className="btn" onClick={()=>setRequestsText(randomWorkload(20,diskMax))}>Random 20</button>
          <button className="btn" onClick={()=>setRequestsText('95,180,34,119,11,123,62,64')}>Sample</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={onLoadCSV} style={{display:'none'}} />
          <button className="btn" onClick={()=>fileRef.current && fileRef.current.click()}>Import CSV</button>
        </div>

        <div className="row actions">
          <button className="btn primary" onClick={()=>{ setCurrentStepIndex(trace.length?0:-1); setIsRunning(true) }}>Play</button>
          <button className="btn" onClick={()=>setIsRunning(v=>!v)}>{isRunning? 'Pause':'Resume'}</button>
          <button className="btn" onClick={()=>setCurrentStepIndex(i=>Math.max(i-1,-1))}>Step -</button>
          <button className="btn" onClick={()=>setCurrentStepIndex(i=>Math.min(i+1, trace.length-1))}>Step +</button>
          <label>Speed</label>
          <input type="range" min={0.25} max={3} step={0.25} value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
          <button className="btn" onClick={onExportCSV}>Export CSV</button>
          <button className="btn" onClick={onExportPNG}>Export PNG</button>
          <button className="btn" onClick={onCompare}>Compare</button>
        </div>
      </section>

      <main className="grid">
        <section className="card visual">
          <h2>Visualization</h2>
          <TrackView diskMax={diskMax} headStart={headStart} trace={trace} currentStepIndex={currentStepIndex} mode={mode} />
          <div className="info">
            <div>Step: {currentStepIndex+1} / {trace.length}</div>
            <div>Served: {metrics.servedCount}</div>
            <div>Total move: {metrics.totalMovement.toFixed(2)} tracks</div>
            <div>Avg seek: {metrics.avgSeek.toFixed(2)}</div>
          </div>

          <h3>Scheduling Timeline</h3>
          <TimelineChart trace={trace} />
        </section>

        <aside className="card sidebar">
          <h3>Trace Log</h3>
          <div className="trace-list">
            {trace.map((t,i)=>(
              <div key={i} className={`trace-row ${i===currentStepIndex? 'active':''}`} title={`from ${t.from} to ${t.to} (distance ${t.distance})`}>
                <div className="col">{i+1}.</div>
                <div className="col">{t.from} → {t.to}</div>
                <div className="col">{t.distance}</div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="footer card">
        <div>Tip: Hover for tooltips. Rotating disk maps tracks to angle. Sound on head movement can be toggled by muting your system.</div>
        <div>Export PNG captures the whole app area.</div>
      </footer>
    </div>
  )
}

function randomWorkload(n, diskMax){
  const arr = []
  for (let i=0;i<n;i++) arr.push(Math.floor(Math.random()*(diskMax+1)))
  return arr.join(',')
}
