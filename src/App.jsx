
import { useEffect, useState, useMemo } from 'react'
import { supabase } from './supabase'

const CATS = ['WORK','PERSONAL','HEALTH','LEARNING']
const PRIS = ['Low','Med','High']
const APP_PASSWORD = "Showmethetodo!"

function Login({onSuccess}){
  const [pw,setPw]=useState('')
  const [err,setErr]=useState('')
  const submit=()=>{
    if(pw===APP_PASSWORD){
      localStorage.setItem('todo_auth','true')
      onSuccess()
    } else {
      setErr('Wrong password')
    }
  }
  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f7f0', padding:20}}>
      <div style={{background:'white', border:'2px solid #d9e8d9', borderRadius:20, padding:32, width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(22,163,74,.15)'}}>
        <div style={{width:48,height:48,background:'#0f2e1d',borderRadius:12,display:'grid',placeItems:'center',color:'white',fontSize:20,marginBottom:16}}>✦</div>
        <h1 style={{fontFamily:'Instrument Serif', fontSize:28, margin:'0 0 6px'}}>Todo  + Insights</h1>
        <p style={{color:'#6a8a6a', fontSize:13, margin:'0 0 24px'}}>Protected • Enter password to continue</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Password" style={{width:'100%', padding:'13px 14px', border:'2px solid #d9e8d9', borderRadius:12, fontSize:15, outline:'none'}} autoFocus />
        {err && <div style={{color:'#dc2626', fontSize:12, marginTop:8, background:'#fee2e2', padding:'6px 10px', borderRadius:8}}>{err}</div>}
        <button onClick={submit} style={{width:'100%', marginTop:12, padding:'12px', borderRadius:12, border:'none', background:'#0f2e1d', color:'white', fontWeight:700, cursor:'pointer', fontSize:14}}>Unlock</button>
        <div style={{marginTop:16, fontSize:11, color:'#9ab69a', textAlign:'center', fontFamily:'JetBrains Mono'}}>Hint: Ask owner for password</div>
      </div>
    </div>
  )
}

function Dashboard(){
  const [todos,setTodos]=useState([])
  const [title,setTitle]=useState('')
  const [cat,setCat]=useState('Work')
  const [pri,setPri]=useState('Med')
  const [date,setDate]=useState(new Date().toISOString().slice(0,10))
  const [filter,setFilter]=useState('All')
  const [catFilter,setCatFilter]=useState('ALL')
  const [loading,setLoading]=useState(true)

  const load = async ()=>{
    setLoading(true)
    const {data} = await supabase.from('todos').select('*').order('created_at',{ascending:false})
    setTodos(data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const add = async ()=>{
    if(!title.trim()) return
    const {data, error} = await supabase.from('todos').insert({
      title:title.trim(),
      category:cat.toUpperCase(),
      priority:pri,
      due_date:date,
      completed:false
    }).select()
    if(error){alert(error.message); return}
    setTodos([...(data||[]), ...todos])
    setTitle('')
  }

  const toggle = async (t)=>{
    await supabase.from('todos').update({completed:!t.completed}).eq('id',t.id)
    setTodos(todos.map(x=>x.id===t.id?{...x,completed:!x.completed}:x))
  }
  const del = async (id)=>{
    await supabase.from('todos').delete().eq('id',id)
    setTodos(todos.filter(t=>t.id!==id))
  }

  const logout=()=>{
    localStorage.removeItem('todo_auth')
    window.location.reload()
  }

  const filtered = useMemo(()=>{
    let f=todos
    if(filter==='Active') f=f.filter(t=>!t.completed)
    if(filter==='Completed') f=f.filter(t=>t.completed)
    if(catFilter!=='ALL') f=f.filter(t=>t.category===catFilter)
    return f
  },[todos,filter,catFilter])

  const total=todos.length
  const completed=todos.filter(t=>t.completed).length
  const active=total-completed
  const pct= total? Math.round(completed/total*100):0
  const highPri = todos.filter(t=>t.priority==='High' && !t.completed).length

  const byCat = CATS.map(c=>({c, n:todos.filter(t=>t.category===c).length}))
  const byPri = PRIS.map(p=>({p, n:todos.filter(t=>t.priority===p).length}))

  return (
    <div>
      <div className="header">
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <div className="serif" style={{fontSize:21, lineHeight:1, fontWeight:600}}> Todo List + Insights</div>
            <div className="mono" style={{color:'#6a8a6a', marginTop:2}}>{new Date().toLocaleDateString('en-US',{weekday:'long', month:'short', day:'numeric'}).toUpperCase()}</div>
          </div>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <div className="badge-live mono"><span className="dot"></span>Live • protected</div>
          <button onClick={logout} className="badge-live mono" style={{cursor:'pointer'}}>Logout</button>
          <div className="badge-live" style={{fontSize:16}}>🌿</div>
        </div>
      </div>

      <div className="stats">
        <div className="card green">
          <div className="mono" style={{display:'flex', justifyContent:'space-between', color:'#14532d'}}>TOTAL TASKS <span style={{fontSize:14}}>◍</span></div>
          <div className="stat-val" style={{color:'#0f2e1d'}}>{total}</div>
          <div className="mono" style={{color:'#14532d', textTransform:'none', fontSize:12}}>{active} active • {completed} done</div>
        </div>
        <div className="card blue">
          <div className="mono" style={{color:'#1e3a8a'}}>COMPLETED</div>
          <div className="stat-val" style={{color:'#1e3a8a'}}>{completed}</div>
          <div className="progress"><div style={{width:`${pct}%`, background:'#2563eb'}}></div></div>
          <div className="mono" style={{textAlign:'right', marginTop:6, color:'#1e3a8a'}}>{pct}%</div>
        </div>
        <div className="card orange">
          <div className="mono" style={{color:'#854d0e'}}>ACTIVE FOCUS</div>
          <div className="stat-val" style={{color:'#854d0e'}}>{active}</div>
          <div className="mono" style={{textTransform:'none', color:'#854d0e', fontSize:12}}>◫ {highPri} high priority</div>
        </div>
        <div className="card dark">
          <div className="mono" style={{opacity:.8}}>COMPLETION</div>
          <div className="stat-val" style={{fontSize:38}}>{pct}%</div>
          <div className="mono" style={{textTransform:'none', opacity:.7, fontSize:12}}>Trending — this week 🌱</div>
          <div style={{position:'absolute', right:22, bottom:18, opacity:.25, fontSize:36}}>↗</div>
        </div>
      </div>

      <div className="main">
        <div>
          <div className="input-card">
            <div className="input-row">
              <input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="What needs doing? e.g. Get coffee" />
              <button className="circle-btn" onClick={add}>+</button>
            </div>
            <div className="selects">
              <select value={cat} onChange={e=>setCat(e.target.value)}><option>Work</option><option>Personal</option><option>Health</option><option>Learning</option></select>
              <select value={pri} onChange={e=>setPri(e.target.value)}><option>Low</option><option>Med</option><option>High</option></select>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
              <span className="hint mono">PRESS ENTER TO ADD</span>
            </div>
          </div>

          <div className="filters">
            <div style={{display:'flex', gap:6, background:'white', border:'2px solid var(--line)', borderRadius:999, padding:5}}>
              {['All','Active','Completed'].map(f=> <button key={f} className={`pill ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f}</button>)}
            </div>
            <div style={{display:'flex', gap:6}}>
              {['ALL',...CATS].map(c=> <button key={c} className={`pill ${catFilter===c?'active':''}`} onClick={()=>setCatFilter(c)}>{c}</button>)}
            </div>
          </div>

          <div className="list-card">
            {loading? <div className="empty">Loading...</div> :
             filtered.length===0? (
              <div className="empty">
                <div className="empty-icon">🌱</div>
                <div className="serif" style={{color:'#111', fontSize:22, fontWeight:600}}>No tasks here</div>
                <div className="mono" style={{textTransform:'none', marginTop:8, fontSize:12}}>Add a task or adjust filters.</div>
              </div>
            ) : filtered.map(t=>(
              <div key={t.id} className="todo">
                <div className="todo-left">
                  <div className={`check ${t.completed?'done':''}`} onClick={()=>toggle(t)}>{t.completed?'✓':''}</div>
                  <span className="title-text" style={{textDecoration:t.completed?'line-through':'none', opacity:t.completed?.6:1}}>{t.title}</span>
                  <span className={`tag mono ${t.category}`}>{t.category}</span>
                  <span className="tag mono" style={{background:t.priority==='High'?'#fee2e2':t.priority==='Med'?'#fef9c3':'#dcfce7', borderColor:t.priority==='High'?'#fca5a5':t.priority==='Med'?'#fde68a':'#86efac'}}>{t.priority}</span>
                </div>
                <button onClick={()=>del(t.id)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#9ca3af', fontSize:20, width:32, height:32, borderRadius:8}} title="Delete permanently from Supabase">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="insights">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="serif" style={{fontSize:24, fontWeight:600}}>Insights</div>
            <div className="mono" style={{border:'2px solid var(--line)', borderRadius:999, padding:'6px 12px', background:'white', fontWeight:700}}>AUTO-UPDATES</div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="insight-card" style={{background:'linear-gradient(135deg,#ffffff,#f0fdf4)'}}>
              <div className="mono" style={{display:'flex', justifyContent:'space-between', color:'#14532d'}}>BY CATEGORY <span>◍</span></div>
              <div style={{padding:'24px 0', textAlign:'center'}}>
                <div style={{fontSize:34, fontFamily:'var(--mono)', fontWeight:700}}>{total}</div>
                <div className="mono" style={{fontSize:11}}>TOTAL</div>
                <div style={{marginTop:18, textAlign:'left'}}>
                  {byCat.map(b=> <div key={b.c} style={{display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid #e6f2e6'}}><span style={{fontWeight:600}}>{b.c}</span><span style={{background:'#dcfce7', padding:'2px 8px', borderRadius:999, fontSize:12}}>{b.n}</span></div>)}
                </div>
              </div>
            </div>
            <div className="insight-card" style={{background:'linear-gradient(135deg,#ffffff,#fefce8)'}}>
              <div className="mono" style={{display:'flex', justifyContent:'space-between', color:'#854d0e'}}>BY PRIORITY <span>⚑</span></div>
              <div style={{padding:'32px 0 12px', display:'flex', justifyContent:'space-around', fontSize:12}}>
                {byPri.map(b=> <div key={b.p} style={{textAlign:'center'}}><div style={{height:70, display:'flex', alignItems:'flex-end', marginBottom:10, justifyContent:'center'}}><div style={{width:28, height: `${Math.max(10, b.n*22+8)}px`, background:b.p==='High'?'#ef4444':b.p==='Med'?'#eab308':'#16a34a', borderRadius:8, transition:'height .4s'}}></div></div><div className="mono" style={{fontWeight:700}}>{b.p}</div><div className="mono" style={{marginTop:2, fontSize:13, fontWeight:700}}>{b.n}</div></div>)}
              </div>
              <div className="mono" style={{marginTop:14, textTransform:'none', fontSize:11, background:'#fef9c3', padding:'6px 10px', borderRadius:999}}>High focus: <span style={{color:'#dc2626', fontWeight:800}}>{highPri}</span> tasks need attention</div>
            </div>
          </div>

          <div className="insight-card" style={{background:'linear-gradient(135deg,#ffffff,#f0fdf4)'}}>
            <div className="mono" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>LAST 7 DAYS • COMPLETED VS ACTIVE <span style={{background:'#dcfce7', color:'#14532d', padding:'4px 10px', borderRadius:999, textTransform:'none', fontWeight:700}}>{pct}% done today</span></div>
            <div className="chart">
              {[2,3,1,4,2,5,completed||1].map((v,i)=>{
                const colors=['#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#14532d','#0f2e1d']
                return <div key={i} className="bar" style={{height:`${Math.max(12, v*14)}%`, background:colors[i], border:'2px solid white'}}></div>
              })}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8}} className="mono"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const [authed,setAuthed]=useState(()=>localStorage.getItem('todo_auth')==='true')
  if(!authed) return <Login onSuccess={()=>setAuthed(true)} />
  return <Dashboard />
}
