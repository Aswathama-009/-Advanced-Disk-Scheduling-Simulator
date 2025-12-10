import React, { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function TimelineChart({ trace }){
  const canvasRef = useRef(null)

  useEffect(()=>{
    const labels = trace.map((t,i)=>`#${i+1}`)
    const data = trace.map(t => t.distance)
    const ctx = canvasRef.current.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Seek distance per step',
          data,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 400 },
        scales: {
          y: { beginAtZero: true }
        }
      }
    })
    return ()=> chart.destroy()
  }, [trace])

  return <canvas ref={canvasRef} style={{width:'100%',height:180}} />
}
