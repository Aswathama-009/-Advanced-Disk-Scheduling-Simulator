import Papa from 'papaparse'
import html2canvas from 'html2canvas'

export function parseRequests(text, diskMax){
  const arr = text.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean).map(s=>Number(s)).filter(n=>!Number.isNaN(n)).map(n=>Math.max(0, Math.min(diskMax, Math.floor(n))))
  return arr
}

export function downloadCSV(filename, rows){
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

export function parseCSVFile(file, onComplete){
  Papa.parse(file, { complete: (res) => { onComplete(res.data) } })
}

export function formatTraceToCSV(trace){
  const rows = ['step,from,to,distance,servedIndex']
  trace.forEach((t,i)=> rows.push(`${i},${t.from},${t.to},${t.distance},${t.servedIndex}`))
  return rows
}

export async function exportPNG(element, filename='snapshot.png'){
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
}
