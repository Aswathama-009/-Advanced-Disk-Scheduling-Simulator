/* Simulation Engine implementing multiple disk scheduling algorithms.
   Each simulateX returns an array of steps: { from, to, distance, servedIndex }.
*/

export function simulateFCFS(requests, headStart){
  const trace = []
  let cur = headStart
  requests.forEach((r, idx)=>{
    const d = Math.abs(cur - r)
    trace.push({ from: cur, to: r, distance: d, servedIndex: idx })
    cur = r
  })
  return trace
}

export function simulateSSTF(requests, headStart){
  const remaining = requests.map((r,i)=>({r,i}))
  const trace = []
  let cur = headStart
  while (remaining.length){
    let bestIdx = 0
    let bestDist = Math.abs(remaining[0].r - cur)
    for (let i=1;i<remaining.length;i++){
      const d = Math.abs(remaining[i].r - cur)
      if (d < bestDist){ bestDist = d; bestIdx = i }
    }
    const pick = remaining.splice(bestIdx,1)[0]
    trace.push({ from: cur, to: pick.r, distance: Math.abs(cur - pick.r), servedIndex: pick.i })
    cur = pick.r
  }
  return trace
}

function splitSorted(requests, cur){
  const sorted = requests.map((r,i)=>({r,i})).sort((a,b)=>a.r-b.r)
  const left = sorted.filter(x=>x.r <= cur)
  const right = sorted.filter(x=>x.r > cur)
  return { left, right }
}

export function simulateSCAN(requests, headStart, diskMax, direction='up', useEdge=true){
  const trace = []
  let cur = headStart
  const {left, right} = splitSorted(requests, cur)
  if (direction === 'up'){
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    if (useEdge){ trace.push({ from: cur, to: diskMax, distance: Math.abs(cur-diskMax), servedIndex: -1 }); cur = diskMax }
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  } else {
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    if (useEdge){ trace.push({ from: cur, to: 0, distance: Math.abs(cur-0), servedIndex: -1 }); cur = 0 }
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  }
  return trace
}

export function simulateCSCAN(requests, headStart, diskMax, direction='up', countJump=false){
  const trace = []
  let cur = headStart
  const {left, right} = splitSorted(requests, cur)
  if (direction === 'up'){
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    trace.push({ from: cur, to: diskMax, distance: Math.abs(cur-diskMax), servedIndex: -1 });
    if (countJump){ trace.push({ from: diskMax, to: 0, distance: Math.abs(diskMax-0), servedIndex: -1 }); }
    cur = 0
    for (const item of left){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  } else {
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    trace.push({ from: cur, to: 0, distance: Math.abs(cur-0), servedIndex: -1 });
    if (countJump){ trace.push({ from: 0, to: diskMax, distance: Math.abs(0-diskMax), servedIndex: -1 }); }
    cur = diskMax
    for (let i=right.length-1;i>=0;i--){ const item = right[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  }
  return trace
}

// LOOK: like SCAN but stops at last request
export function simulateLOOK(requests, headStart, direction='up'){
  const trace = []
  let cur = headStart
  const {left, right} = splitSorted(requests, cur)
  if (direction === 'up'){
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  } else {
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  }
  return trace
}

// C-LOOK: circular LOOK
export function simulateCLOOK(requests, headStart, direction='up'){
  const trace = []
  let cur = headStart
  const {left, right} = splitSorted(requests, cur)
  if (direction === 'up'){
    for (const item of right){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    if (left.length){
      // jump to smallest (instant)
      trace.push({ from: cur, to: left[0].r, distance: Math.abs(cur - left[0].r), servedIndex: -1 })
      cur = left[0].r
    }
    for (const item of left){ trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  } else {
    for (let i=left.length-1;i>=0;i--){ const item = left[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
    if (right.length){
      trace.push({ from: cur, to: right[right.length-1].r, distance: Math.abs(cur - right[right.length-1].r), servedIndex: -1 })
      cur = right[right.length-1].r
    }
    for (let i=right.length-1;i>=0;i--){ const item = right[i]; trace.push({ from: cur, to: item.r, distance: Math.abs(cur-item.r), servedIndex: item.i }); cur = item.r }
  }
  return trace
}

export function metricsFromTrace(trace){
  const moves = trace.filter(t=>t.servedIndex !== -1)
  const totalMovement = trace.reduce((s,t)=>s + t.distance, 0)
  const totalSeek = moves.reduce((s,t)=>s + t.distance, 0)
  const avgSeek = moves.length ? (totalSeek / moves.length) : 0
  const maxSeek = moves.length ? Math.max(...moves.map(m=>m.distance)) : 0
  const variance = moves.length ? moves.reduce((s,m)=>s + Math.pow(m.distance - avgSeek,2),0)/moves.length : 0
  return { totalMovement, totalSeek, avgSeek, maxSeek, variance, servedCount: moves.length }
}
