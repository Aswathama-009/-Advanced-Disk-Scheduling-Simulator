import React, { useEffect, useRef } from 'react'

export default function TrackView({ diskMax, headStart, trace, currentStepIndex, mode='rotating' }){
  const svgRef = useRef(null)
  const padding = 20
  const width = 880
  const height = 140
  const scale = (v) => padding + (v / Math.max(1, diskMax)) * (width - padding*2)

  const reqPos = Array.from(new Set(trace.filter(t=>t.servedIndex!==-1).map(t=>t.to))).sort((a,b)=>a-b)

  // animate head movement (for linear) and rotating disk
  useEffect(()=>{
    const svg = svgRef.current
    if (!svg) return
    const headEl = svg.querySelector('.head')
    const headLabel = svg.querySelector('.headLabel')
    let target = headStart
    if (currentStepIndex >= 0 && trace.length){
      const clamped = Math.min(currentStepIndex, trace.length-1)
      target = trace[clamped].to
    }
    if (mode === 'linear'){
      const tx = scale(target)
      if (headEl){
        headEl.style.transition = 'transform 260ms cubic-bezier(.22,.9,.26,1)'
        headEl.style.transform = `translateX(${tx - 8}px)`
      }
      if (headLabel) headLabel.textContent = `H:${target}`
    } else {
      // rotating disk: map track to angle
      const angle = (target / Math.max(1, diskMax)) * 360
      const rotor = svg.querySelector('.rotor')
      if (rotor){
        rotor.style.transition = 'transform 400ms cubic-bezier(.22,.9,.26,1)'
        rotor.style.transform = `rotate(${angle}deg)`
      }
      if (headLabel) headLabel.textContent = `H:${target}`
    }
  }, [currentStepIndex, trace, headStart, diskMax, mode])

  return (
    <div style={{width:'100%'}}>
      {mode === 'linear' ? (
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} style={{width:'100%'}}>
          <rect x={padding} y={height/2-8} width={width-padding*2} height={16} rx={8} fill="#0b1220" />
          {reqPos.map((r,i)=>{
            const x = scale(r)
            return (
              <g key={i}>
                <circle cx={x} cy={height/2} r={6} fill={i%2? '#60a5fa' : '#34d399'} />
                <text x={x} y={height/2 - 12} fill="#cfe8ff" fontSize={10} textAnchor="middle">{r}</text>
              </g>
            )
          })}
          {trace.slice(0, Math.max(0, currentStepIndex+1)).map((t,i)=>(
            <line key={i} x1={scale(t.from)} x2={scale(t.to)} y1={height/2} y2={height/2} strokeOpacity={0.45} strokeWidth={3} stroke="#60a5fa" />
          ))}
          <g className="head" style={{transform:`translateX(${scale(headStart)-8}px)`}}>
            <rect x={-8} y={height/2-24} width={16} height={16} rx={3} fill="#fef3c7" stroke="#c084fc" />
          </g>
          <text className="headLabel" x={scale(headStart)} y={height/2-30} fontSize={12} textAnchor="middle" fill="#fde68a">H:{headStart}</text>
        </svg>
      ) : (
        <svg ref={svgRef} viewBox={`0 0 ${360} ${200}`} style={{width:'100%'}}>
          <g transform={`translate(180,100)`}>
            <circle cx={0} cy={0} r={70} fill="#082333" stroke="#0ea5a4" strokeWidth={2} />
            <g className="rotor" style={{transformOrigin:'0px 0px'}}>
              {/* markers around the disk */}
              {Array.from({length:12}).map((_,i)=>{
                const a = (i/12)*Math.PI*2
                const x1 = Math.cos(a)*70
                const y1 = Math.sin(a)*70
                const x2 = Math.cos(a)*82
                const y2 = Math.sin(a)*82
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#60a5fa" strokeWidth={2} />
              })}
            </g>
            <g className="arm">
              <rect x={-4} y={-4} width={8} height={90} rx={4} fill="#fed7aa" transform={`rotate(-40)`} />
            </g>
            <text className="headLabel" x={0} y={95} fontSize={12} textAnchor="middle" fill="#fde68a">H:{headStart}</text>
          </g>
        </svg>
      )}
    </div>
  )
}
