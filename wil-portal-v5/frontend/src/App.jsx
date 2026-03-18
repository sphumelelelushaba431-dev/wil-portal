import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api.js";

const C = {
  black:"#000000", black1:"#0a0a0a", black2:"#111111", black3:"#1a1a1a",
  black4:"#222222", black5:"#2a2a2a", black6:"#333333",
  orange:"#f97316", orangeD:"#ea6c0a", orangeL:"#fb923c",
  orangeFaint:"#1a0f00", orangeTint:"#2d1800",
  white:"#ffffff", grey100:"#f5f5f5", grey200:"#e5e5e5", grey300:"#d4d4d4",
  grey400:"#a3a3a3", grey500:"#737373", grey600:"#525252", grey700:"#404040",
  green:"#22c55e", greenFaint:"#052e16", amber:"#f59e0b", amberFaint:"#1c1400",
  rose:"#f43f5e", roseFaint:"#1f0009", blue:"#3b82f6", blueFaint:"#0c1a3d",
  purple:"#a855f7", purpleFaint:"#1a0d2e",
};

const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"}) : "";

const STATUS_CFG = {
  submitted:    {label:"Submitted",    bg:C.blueFaint,   text:C.blue,   dot:C.blue},
  pending:      {label:"Pending",      bg:C.amberFaint,  text:C.amber,  dot:C.amber},
  under_review: {label:"Under Review", bg:C.purpleFaint, text:C.purple, dot:C.purple},
  approved:     {label:"Approved",     bg:C.greenFaint,  text:C.green,  dot:C.green},
  rejected:     {label:"Rejected",     bg:C.roseFaint,   text:C.rose,   dot:C.rose},
};

// ── UI Primitives ──────────────────────────────────────────────
function StatusBadge({status}) {
  const cfg = STATUS_CFG[status]||STATUS_CFG.submitted;
  return (
    <span style={{background:cfg.bg,color:cfg.text,padding:"3px 10px",borderRadius:20,
      fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5,
      border:`1px solid ${cfg.dot}22`}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block"}}/>
      {cfg.label}
    </span>
  );
}

function Card({children,style={},onClick}) {
  return (
    <div onClick={onClick} style={{background:C.black3,borderRadius:14,
      border:`1px solid ${C.black5}`,cursor:onClick?"pointer":undefined,...style}}>
      {children}
    </div>
  );
}

function Btn({children,onClick,variant="primary",size="md",disabled=false,style={}}) {
  const sizes={sm:{padding:"6px 14px",fontSize:13},md:{padding:"9px 20px",fontSize:14},lg:{padding:"13px 28px",fontSize:15}};
  const variants={
    primary:{background:C.orange,color:C.white,border:"none"},
    secondary:{background:C.black4,color:C.grey300,border:`1px solid ${C.black6}`},
    danger:{background:C.roseFaint,color:C.rose,border:`1px solid ${C.rose}44`},
    ghost:{background:"transparent",color:C.grey400,border:"none"},
    outline:{background:"transparent",color:C.orange,border:`1px solid ${C.orange}`},
    outlineW:{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,.3)"},
    green:{background:C.green,color:C.white,border:"none"},
    amber:{background:C.amberFaint,color:C.amber,border:`1px solid ${C.amber}44`},
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      borderRadius:10,cursor:disabled?"not-allowed":"pointer",fontWeight:600,
      display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?.5:1,
      transition:"all .15s",fontFamily:"inherit",...sizes[size],...variants[variant],...style
    }}>{children}</button>
  );
}

function Input({label,value,onChange,type="text",placeholder="",required=false}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:13,fontWeight:600,color:C.grey300,display:"block",marginBottom:5}}>{label}{required&&" *"}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
        width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${C.black6}`,
        fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none",
        background:C.black4,color:C.white
      }}/>
    </div>
  );
}

function SelectInput({label,value,onChange,options}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:13,fontWeight:600,color:C.grey300,display:"block",marginBottom:5}}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${C.black6}`,
        fontSize:14,fontFamily:"inherit",background:C.black4,color:C.white,outline:"none",boxSizing:"border-box"
      }}>
        {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function TextareaInput({label,value,onChange,placeholder="",rows=4}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:13,fontWeight:600,color:C.grey300,display:"block",marginBottom:5}}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
        width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${C.black6}`,
        fontSize:14,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",outline:"none",
        background:C.black4,color:C.white
      }}/>
    </div>
  );
}

function Modal({open,onClose,title,children,footer}) {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.black2,borderRadius:20,padding:28,width:"100%",
        maxWidth:540,maxHeight:"88vh",overflowY:"auto",border:`1px solid ${C.black5}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{fontWeight:700,fontSize:18,color:C.white,fontFamily:"'Fraunces',serif"}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.grey500,lineHeight:1}}>×</button>
        </div>
        {children}
        {footer&&<div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>{footer}</div>}
      </div>
    </div>
  );
}

function Toast({msg,type="success"}) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,
      background:type==="error"?C.rose:C.orange,
      color:C.white,borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,
      boxShadow:"0 4px 24px rgba(0,0,0,.5)",zIndex:999,maxWidth:340}}>{msg}</div>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:64}}>
      <div style={{width:32,height:32,border:`3px solid ${C.black5}`,
        borderTopColor:C.orange,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatsCard({title,value,accent=false}) {
  return (
    <Card style={{padding:24}}>
      <p style={{fontSize:13,color:C.grey500,fontWeight:500}}>{title}</p>
      <p style={{fontSize:34,fontWeight:800,color:accent?C.orange:C.white,marginTop:8,fontFamily:"'Fraunces',serif"}}>{value??"—"}</p>
    </Card>
  );
}

function PageHeader({title,description,actions}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif"}}>{title}</h1>
        {description&&<p style={{color:C.grey500,marginTop:4}}>{description}</p>}
      </div>
      {actions&&<div style={{display:"flex",gap:10}}>{actions}</div>}
    </div>
  );
}

function BookmarkBtn({oppId,savedIds,onToggle}) {
  const isSaved = savedIds.has(oppId);
  const [loading,setLoading] = useState(false);
  const toggle = async(e) => {
    e.stopPropagation(); setLoading(true);
    await onToggle(oppId,isSaved); setLoading(false);
  };
  return (
    <button onClick={toggle} disabled={loading} title={isSaved?"Remove bookmark":"Save opportunity"}
      style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,
        fontSize:18,lineHeight:1,opacity:loading?.5:1,transition:"all .15s",
        color:isSaved?C.orange:C.grey600}}>
      {isSaved?"🔖":"🔗"}
    </button>
  );
}

function OppCard({opp,companyName,savedIds,onToggleSave,onClick}) {
  return (
    <Card style={{padding:24,cursor:"pointer"}} onClick={onClick}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
          <div style={{width:42,height:42,borderRadius:12,background:C.orangeTint,flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${C.orange}33`}}>🏢</div>
          <div style={{minWidth:0}}>
            <p style={{fontWeight:700,fontSize:15,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{opp.title}</p>
            <p style={{fontSize:13,color:C.grey500}}>{companyName||"Company"}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{background:C.black4,color:C.grey400,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600}}>{opp.work_type}</span>
          {savedIds&&onToggleSave&&<BookmarkBtn oppId={opp.id} savedIds={savedIds} onToggle={onToggleSave}/>}
        </div>
      </div>
      {opp.description&&<p style={{fontSize:13,color:C.grey400,marginBottom:14,lineHeight:1.5,
        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{opp.description}</p>}
      <div style={{display:"flex",flexWrap:"wrap",gap:12,fontSize:12,color:C.grey500}}>
        {opp.location&&<span>📍 {opp.location}</span>}
        {opp.stipend>0&&<span style={{color:C.orange,fontWeight:600}}>💰 R{opp.stipend.toLocaleString()}/month</span>}
        {opp.closing_date&&<span style={{color:C.rose}}>⏰ Closes {fmt(opp.closing_date)}</span>}
      </div>
    </Card>
  );
}

// ── Landing Page ───────────────────────────────────────────────
function LandingPage({setPage}) {
  const [stats,setStats]=useState(null);
  const [opps,setOpps]=useState([]);
  useEffect(()=>{
    api.getPublicStats().then(setStats).catch(()=>{});
    api.getPublicOpportunities().then(setOpps).catch(()=>{});
  },[]);

  const features=[
    {icon:"🔍",title:"Browse Opportunities",desc:"Explore WIL placements across all industries and locations."},
    {icon:"🔖",title:"Save Favourites",      desc:"Bookmark opportunities you love and revisit them anytime."},
    {icon:"📋",title:"Easy Applications",   desc:"Apply with one click and track every application in real time."},
    {icon:"🔔",title:"Instant Notifications",desc:"Get notified the moment a new opportunity is posted or your status changes."},
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.black1,minHeight:"100vh"}}>
      {/* Navbar */}
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(0,0,0,.95)",
        backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.black4}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",height:64,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎓</div>
            <span style={{fontWeight:800,fontSize:18,color:C.white,fontFamily:"'Fraunces',serif"}}>WIL Portal</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>document.getElementById("opps-section")?.scrollIntoView({behavior:"smooth"})}
              style={{background:"none",border:"none",color:C.grey400,fontSize:14,fontWeight:500,cursor:"pointer",padding:"8px 14px",borderRadius:8,fontFamily:"inherit"}}>Opportunities</button>
            <button onClick={()=>document.getElementById("features-section")?.scrollIntoView({behavior:"smooth"})}
              style={{background:"none",border:"none",color:C.grey400,fontSize:14,fontWeight:500,cursor:"pointer",padding:"8px 14px",borderRadius:8,fontFamily:"inherit"}}>Features</button>
            <div style={{width:1,height:20,background:C.black5,margin:"0 4px"}}/>
            <Btn variant="outlineW" size="sm" onClick={()=>setPage("Login")}>Sign In</Btn>
            <Btn size="sm" onClick={()=>setPage("Register")} style={{marginLeft:4}}>Register</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{background:`linear-gradient(135deg,${C.black1} 0%,#0f0700 60%,#1a0800 100%)`,
        padding:"100px 24px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-100,right:-100,width:500,height:500,borderRadius:"50%",background:"rgba(249,115,22,.05)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-80,left:-80,width:350,height:350,borderRadius:"50%",background:"rgba(249,115,22,.04)",pointerEvents:"none"}}/>
        <div style={{maxWidth:720,margin:"0 auto",position:"relative"}}>
          <span style={{background:C.orangeTint,color:C.orange,borderRadius:20,padding:"6px 16px",fontSize:13,fontWeight:600,display:"inline-block",marginBottom:20,border:`1px solid ${C.orange}33`}}>🎓 Work Integrated Learning Portal</span>
          <h1 style={{fontSize:"clamp(32px,6vw,58px)",fontWeight:900,color:C.white,fontFamily:"'Fraunces',serif",lineHeight:1.15,marginBottom:20}}>
            Find Your Perfect<br/><span style={{color:C.orange}}>WIL Placement</span>
          </h1>
          <p style={{fontSize:18,color:C.grey400,lineHeight:1.7,marginBottom:40,maxWidth:540,margin:"0 auto 40px"}}>
            Connect with top companies, apply for internships, and manage your Work Integrated Learning journey — all in one place.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn size="lg" onClick={()=>setPage("Register")} style={{fontSize:16,padding:"14px 32px",borderRadius:12}}>Get Started — It's Free</Btn>
            <Btn variant="outlineW" size="lg" onClick={()=>setPage("Login")} style={{fontSize:16,padding:"14px 32px",borderRadius:12}}>Sign In</Btn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{background:C.black2,borderTop:`1px solid ${C.black4}`,borderBottom:`1px solid ${C.black4}`,padding:"36px 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:24}}>
          {[{label:"Open Opportunities",value:stats?.open_opportunities??"…",icon:"💼"},
            {label:"Partner Companies",  value:stats?.total_companies??"…",   icon:"🏢"},
            {label:"Students Enrolled",  value:stats?.total_students??"…",    icon:"🎓"},
            {label:"Applications Made",  value:stats?.total_applications??"…",icon:"📋"},
          ].map(s=>(
            <div key={s.label} style={{textAlign:"center"}}>
              <p style={{fontSize:28,marginBottom:6}}>{s.icon}</p>
              <p style={{fontSize:32,fontWeight:900,color:C.orange,fontFamily:"'Fraunces',serif"}}>{s.value}</p>
              <p style={{fontSize:13,color:C.grey500,marginTop:4}}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Opportunities */}
      <section id="opps-section" style={{padding:"80px 24px",background:C.black1}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:36,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif"}}>Latest Opportunities</h2>
            <p style={{color:C.grey500,marginTop:10,fontSize:16}}>Browse open internship and placement opportunities from our partner companies.</p>
          </div>
          {opps.length===0?(
            <div style={{textAlign:"center",padding:48,color:C.grey600}}><p style={{fontSize:40,marginBottom:12}}>💼</p><p>No opportunities yet — check back soon!</p></div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
              {opps.map(o=>(
                <div key={o.id} style={{background:C.black3,borderRadius:16,border:`1px solid ${C.black5}`,padding:24,cursor:"pointer",transition:"border-color .2s"}}
                  onClick={()=>setPage("Login")}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.orange}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.black5}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:44,height:44,borderRadius:12,background:C.orangeTint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${C.orange}33`}}>🏢</div>
                      <div>
                        <p style={{fontWeight:700,fontSize:15,color:C.white}}>{o.title}</p>
                        <p style={{fontSize:13,color:C.grey500,marginTop:1}}>{o.company_name}</p>
                      </div>
                    </div>
                    <span style={{background:C.greenFaint,color:C.green,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0,border:`1px solid ${C.green}44`}}>Open</span>
                  </div>
                  {o.description&&<p style={{fontSize:13,color:C.grey400,marginBottom:14,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{o.description}</p>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:12,fontSize:12,color:C.grey500,marginBottom:16}}>
                    {o.location&&<span>📍 {o.location}</span>}
                    {o.work_type&&<span>💼 {o.work_type}</span>}
                    {o.stipend>0&&<span style={{color:C.orange,fontWeight:600}}>💰 R{o.stipend.toLocaleString()}/mo</span>}
                    {o.closing_date&&<span style={{color:C.rose}}>⏰ Closes {fmt(o.closing_date)}</span>}
                  </div>
                  <button onClick={e=>{e.stopPropagation();setPage("Register");}}
                    style={{width:"100%",padding:"9px",borderRadius:10,border:`1px solid ${C.orange}`,background:"transparent",color:C.orange,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.orange;e.currentTarget.style.color=C.white;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.orange;}}>
                    Sign in to Apply →
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{textAlign:"center",marginTop:36}}>
            <Btn variant="outline" size="lg" onClick={()=>setPage("Register")}>View All Opportunities →</Btn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features-section" style={{padding:"80px 24px",background:C.black2}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <h2 style={{fontSize:36,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif"}}>Everything You Need</h2>
            <p style={{color:C.grey500,marginTop:10,fontSize:16}}>A complete toolkit for students and coordinators managing WIL placements.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20}}>
            {features.map(f=>(
              <div key={f.title} style={{padding:28,borderRadius:16,border:`1px solid ${C.black5}`,background:C.black3,textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:14}}>{f.icon}</div>
                <h3 style={{fontWeight:700,fontSize:16,color:C.white,marginBottom:8}}>{f.title}</h3>
                <p style={{fontSize:14,color:C.grey500,lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:`linear-gradient(135deg,#1a0800,${C.black1})`,padding:"72px 24px",textAlign:"center",borderTop:`1px solid ${C.orange}22`}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <h2 style={{fontSize:36,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif",marginBottom:16}}>Ready to Start Your Journey?</h2>
          <p style={{color:C.grey400,fontSize:16,marginBottom:36,lineHeight:1.7}}>Join thousands of students already using WIL Portal to land their dream internships.</p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn size="lg" onClick={()=>setPage("Register")} style={{fontSize:16,padding:"14px 32px",borderRadius:12}}>Create Free Account</Btn>
            <Btn variant="outlineW" size="lg" onClick={()=>setPage("Login")} style={{fontSize:16,padding:"14px 32px",borderRadius:12}}>Sign In</Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:C.black,borderTop:`1px solid ${C.black4}`,padding:"28px 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🎓</div>
            <span style={{fontWeight:700,fontSize:15,color:C.white,fontFamily:"'Fraunces',serif"}}>WIL Portal</span>
            <span style={{color:C.grey600,fontSize:13}}>· Placement Management System</span>
          </div>
          <p style={{color:C.grey600,fontSize:12}}>© {new Date().getFullYear()} WIL Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Auth Page — NO credentials shown, NO role selector ─────────
function AuthPage({mode:initialMode,setPage,onLogin}) {
  const [mode,setMode]=useState(initialMode||"login");
  const [form,setForm]=useState({email:"",password:"",full_name:""});
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const submit=async()=>{
    setError(""); setLoading(true);
    try {
      const user = mode==="login"
        ? await api.login(form.email, form.password)
        : await api.register(form.email, form.password, form.full_name);
      onLogin(user);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:C.black1,display:"flex",flexDirection:"column"}}>
      <nav style={{background:C.black,padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.black4}`}}>
        <button onClick={()=>setPage("Landing")} style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎓</div>
          <span style={{fontWeight:800,fontSize:16,color:C.white,fontFamily:"'Fraunces',serif"}}>WIL Portal</span>
        </button>
        <button onClick={()=>setPage("Landing")} style={{background:"none",border:"none",color:C.grey500,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back to Home</button>
      </nav>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <h1 style={{fontSize:28,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif"}}>
              {mode==="login"?"Welcome Back":"Create Account"}
            </h1>
            <p style={{color:C.grey500,marginTop:6}}>
              {mode==="login"?"Sign in to your WIL Portal account":"Register as a student to get started"}
            </p>
          </div>
          <div style={{background:C.black3,borderRadius:16,padding:32,border:`1px solid ${C.black5}`}}>
            <div style={{display:"flex",marginBottom:24,background:C.black2,borderRadius:10,padding:4}}>
              {["login","register"].map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit",background:mode===m?C.orange:"transparent",color:mode===m?C.white:C.grey500,transition:"all .15s",textTransform:"capitalize"}}>
                  {m==="login"?"Sign In":"Register"}
                </button>
              ))}
            </div>
            {/* Full name only on register */}
            {mode==="register"&&<Input label="Full Name" value={form.full_name} onChange={f("full_name")} required/>}
            <Input label="Email Address" type="email" value={form.email} onChange={f("email")} required/>
            <Input label="Password" type="password" value={form.password} onChange={f("password")} required/>
            {/* NO role selector — everyone registers as student */}
            {error&&<p style={{color:C.rose,fontSize:13,marginBottom:12,background:C.roseFaint,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.rose}33`}}>{error}</p>}
            <Btn onClick={submit} disabled={loading} style={{width:"100%",justifyContent:"center",borderRadius:10}}>
              {loading?"Please wait…":mode==="login"?"Sign In →":"Create Account →"}
            </Btn>
            {/* NO admin credentials shown here */}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────
function AppShell({user,onLogout,children,currentPage,setPage,notifCount}) {
  const isAdmin=user.role!=="student";
  const studentLinks=[
    {id:"Dashboard",          label:"Dashboard",         icon:"🏠"},
    {id:"Opportunities",      label:"Opportunities",      icon:"💼"},
    {id:"SavedOpportunities", label:"Saved",              icon:"🔖"},
    {id:"MyApplications",     label:"My Applications",    icon:"📋"},
    {id:"MyDocuments",        label:"My Documents",       icon:"📁"},
    {id:"Notifications",      label:"Notifications",      icon:"🔔"},
  ];
  const adminLinks=[
    {id:"AdminDashboard",     label:"Dashboard",          icon:"🏠"},
    {id:"AdminApplications",  label:"Applications",       icon:"📋"},
    {id:"AdminOpportunities", label:"Opportunities",      icon:"💼"},
    {id:"AdminCompanies",     label:"Companies",          icon:"🏢"},
    {id:"ManageStudents",     label:"Students",           icon:"👥"},
    {id:"AdminStats",         label:"Statistics",         icon:"📊"},
    {id:"Notifications",      label:"Notifications",      icon:"🔔"},
  ];
  const links=isAdmin?adminLinks:studentLinks;

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      <aside style={{width:256,background:C.black,color:C.white,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0,borderRight:`1px solid ${C.black4}`}}>
        <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${C.black4}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:10,background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎓</div>
            <div>
              <p style={{fontWeight:800,fontSize:16,fontFamily:"'Fraunces',serif",color:C.white}}>WIL Portal</p>
              <p style={{fontSize:11,color:C.grey600,marginTop:1}}>Placement Management</p>
            </div>
          </div>
        </div>
        <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
          {links.map(link=>{
            const active=currentPage===link.id;
            return (
              <button key={link.id} onClick={()=>setPage(link.id)} style={{width:"100%",
                background:active?C.orangeTint:"transparent",
                border:active?`1px solid ${C.orange}44`:"1px solid transparent",
                borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,
                cursor:"pointer",marginBottom:2,transition:"all .15s"}}>
                <span style={{fontSize:16}}>{link.icon}</span>
                <span style={{fontSize:14,fontWeight:600,flex:1,textAlign:"left",fontFamily:"'DM Sans',sans-serif",color:active?C.orange:C.grey500}}>{link.label}</span>
                {link.icon==="🔔"&&notifCount>0&&(
                  <span style={{background:C.orange,color:C.white,borderRadius:20,padding:"2px 7px",fontSize:11,fontWeight:700}}>{notifCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px",borderTop:`1px solid ${C.black4}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:C.black3,border:`1px solid ${C.black5}`}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.white}}>
              {user.full_name?.[0]||user.email[0].toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.full_name||user.email}</p>
              <p style={{fontSize:11,color:C.grey600,textTransform:"capitalize"}}>{user.role}</p>
            </div>
            <button onClick={onLogout} title="Logout" style={{background:"none",border:"none",cursor:"pointer",color:C.grey600,fontSize:18,padding:4}}>⏻</button>
          </div>
        </div>
      </aside>
      <main style={{flex:1,padding:32,overflowY:"auto",background:C.black2}}>{children}</main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({setPage}) {
  const {user}=useAuth();
  const [apps,setApps]=useState([]);const [opps,setOpps]=useState([]);const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([api.getApplications(),api.getOpportunities("open"),api.getDocuments()]).then(([a,o,d])=>{setApps(a);setOpps(o);setDocs(d);setLoading(false);});},[]);
  if (loading) return <Spinner/>;
  const approved=apps.filter(a=>a.status==="approved").length;
  const pending=apps.filter(a=>["submitted","pending","under_review"].includes(a.status)).length;
  return (
    <div>
      <PageHeader title={`Welcome back, ${user.full_name?.split(" ")[0]||"Student"} 👋`} description="Track your internship applications and discover new opportunities."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:32}}>
        <StatsCard title="Total Applications" value={apps.length} accent/>
        <StatsCard title="Pending" value={pending}/>
        <StatsCard title="Approved" value={approved} accent/>
        <StatsCard title="Documents" value={docs.length}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <Card>
          <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.black5}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h2 style={{fontWeight:700,fontSize:16,color:C.white}}>Recent Applications</h2>
            <button onClick={()=>setPage("MyApplications")} style={{background:"none",border:"none",color:C.orange,fontSize:13,cursor:"pointer",fontWeight:600}}>View all →</button>
          </div>
          {apps.length===0?<p style={{padding:24,color:C.grey600,fontSize:14,textAlign:"center"}}>No applications yet</p>
            :apps.slice(0,4).map(a=>(
              <div key={a.id} style={{padding:"14px 24px",borderBottom:`1px solid ${C.black4}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontWeight:600,fontSize:14,color:C.white}}>Application #{a.id?.slice(-6)}</p><p style={{fontSize:12,color:C.grey600,marginTop:2}}>{fmt(a.created_date)}</p></div>
                <StatusBadge status={a.status}/>
              </div>
            ))}
        </Card>
        <Card>
          <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.black5}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h2 style={{fontWeight:700,fontSize:16,color:C.white}}>Latest Opportunities</h2>
            <button onClick={()=>setPage("Opportunities")} style={{background:"none",border:"none",color:C.orange,fontSize:13,cursor:"pointer",fontWeight:600}}>Browse all →</button>
          </div>
          {opps.length===0?<p style={{padding:24,color:C.grey600,fontSize:14,textAlign:"center"}}>No open opportunities</p>
            :opps.slice(0,4).map(o=>(
              <div key={o.id} onClick={()=>setPage("OpportunityDetail",o.id)} style={{padding:"14px 24px",borderBottom:`1px solid ${C.black4}`,cursor:"pointer"}}>
                <p style={{fontWeight:600,fontSize:14,color:C.white}}>{o.title}</p>
                <div style={{display:"flex",gap:8,marginTop:3,fontSize:12,color:C.grey600}}>
                  <span>{o.location}</span><span>·</span><span>{o.work_type}</span>
                  {o.closing_date&&<><span>·</span><span style={{color:C.rose}}>Closes {fmt(o.closing_date)}</span></>}
                </div>
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}

// ── Opportunities ──────────────────────────────────────────────
function Opportunities({setPage}) {
  const [opps,setOpps]=useState([]);const [companies,setCompanies]=useState({});
  const [savedIds,setSavedIds]=useState(new Set());
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");const [typeFilter,setTypeFilter]=useState("all");
  const [toast,setToast]=useState(null);

  const load=async()=>{
    const[o,c,s]=await Promise.all([api.getOpportunities("open"),api.getCompanies(),api.getSavedOpportunities()]);
    setOpps(o);const m={};c.forEach(x=>m[x.id]=x);setCompanies(m);
    setSavedIds(new Set(s.map(x=>x.opportunity_id)));setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const toggleSave=async(oppId,isSaved)=>{
    try{if(isSaved){await api.unsaveOpportunity(oppId);setSavedIds(prev=>{const n=new Set(prev);n.delete(oppId);return n;});showToast("Bookmark removed");}
    else{await api.saveOpportunity(oppId);setSavedIds(prev=>new Set([...prev,oppId]));showToast("Opportunity saved! 🔖");}}
    catch(e){showToast(e.message,"error");}
  };

  const filtered=opps.filter(o=>{
    const s=search.toLowerCase();
    return(!s||o.title?.toLowerCase().includes(s)||(o.description||"").toLowerCase().includes(s)||(o.location||"").toLowerCase().includes(s))&&(typeFilter==="all"||o.work_type===typeFilter);
  });

  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <PageHeader title="Opportunities" description="Browse available internship and placement opportunities."/>
      <div style={{display:"flex",gap:12,marginBottom:24}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, location…"
            style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:C.black3,color:C.white}}/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,fontFamily:"inherit",background:C.black3,color:C.white}}>
          {["all","Full-time","Part-time","Remote","Hybrid"].map(t=><option key={t} value={t}>{t==="all"?"All Types":t}</option>)}
        </select>
      </div>
      {filtered.length===0?<Card style={{padding:48,textAlign:"center"}}><p style={{color:C.grey600}}>No opportunities found.</p></Card>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {filtered.map(o=><OppCard key={o.id} opp={o} companyName={companies[o.company_id]?.company_name} savedIds={savedIds} onToggleSave={toggleSave} onClick={()=>setPage("OpportunityDetail",o.id)}/>)}
        </div>
      )}
    </div>
  );
}

// ── Saved Opportunities ────────────────────────────────────────
function SavedOpportunities({setPage}) {
  const [saved,setSaved]=useState([]);const [opps,setOpps]=useState({});const [companies,setCompanies]=useState({});
  const [loading,setLoading]=useState(true);const [toast,setToast]=useState(null);const [savedIds,setSavedIds]=useState(new Set());

  const load=async()=>{
    const[s,o,c]=await Promise.all([api.getSavedOpportunities(),api.getOpportunities(),api.getCompanies()]);
    setSaved(s);const om={};o.forEach(x=>om[x.id]=x);setOpps(om);const cm={};c.forEach(x=>cm[x.id]=x);setCompanies(cm);
    setSavedIds(new Set(s.map(x=>x.opportunity_id)));setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const toggleSave=async(oppId,isSaved)=>{
    try{if(isSaved){await api.unsaveOpportunity(oppId);setSavedIds(prev=>{const n=new Set(prev);n.delete(oppId);return n;});setSaved(s=>s.filter(x=>x.opportunity_id!==oppId));showToast("Bookmark removed");}
    else{await api.saveOpportunity(oppId);setSavedIds(prev=>new Set([...prev,oppId]));showToast("Saved! 🔖");}}
    catch(e){showToast(e.message,"error");}
  };

  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <PageHeader title="Saved Opportunities" description={`${saved.length} bookmarked opportunit${saved.length===1?"y":"ies"}`}/>
      {saved.length===0?(
        <Card style={{padding:48,textAlign:"center"}}>
          <p style={{fontSize:40,marginBottom:12}}>🔖</p>
          <p style={{color:C.grey400,fontWeight:600,marginBottom:8}}>No saved opportunities yet</p>
          <p style={{color:C.grey600,fontSize:14,marginBottom:20}}>Browse opportunities and click the bookmark icon to save them here.</p>
          <Btn onClick={()=>setPage("Opportunities")}>Browse Opportunities</Btn>
        </Card>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {saved.map(s=>{const o=opps[s.opportunity_id];if(!o)return null;return<OppCard key={s.id} opp={o} companyName={companies[o.company_id]?.company_name} savedIds={savedIds} onToggleSave={toggleSave} onClick={()=>setPage("OpportunityDetail",o.id)}/>;})}
        </div>
      )}
    </div>
  );
}

// ── Opportunity Detail ─────────────────────────────────────────
function OpportunityDetail({oppId,setPage}) {
  const [opp,setOpp]=useState(null);const [company,setCompany]=useState(null);
  const [alreadyApplied,setAlreadyApplied]=useState(false);const [showApply,setShowApply]=useState(false);
  const [coverLetter,setCoverLetter]=useState("");const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);const [toast,setToast]=useState(null);const [isSaved,setIsSaved]=useState(false);

  useEffect(()=>{
    const load=async()=>{
      const o=await api.getOpportunity(oppId);setOpp(o);
      const comps=await api.getCompanies();setCompany(comps.find(c=>c.id===o.company_id)||null);
      const apps=await api.getApplications();setAlreadyApplied(apps.some(a=>a.opportunity_id===oppId));
      const saved=await api.getSavedOpportunities();setIsSaved(saved.some(s=>s.opportunity_id===oppId));
      setLoading(false);
    };
    load();
  },[oppId]);

  const handleApply=async()=>{setSubmitting(true);try{await api.createApplication({opportunity_id:oppId,cover_letter:coverLetter});setAlreadyApplied(true);setShowApply(false);setToast("Application submitted!");setTimeout(()=>setToast(null),3000);}catch(e){setToast(e.message);}setSubmitting(false);};
  const toggleSave=async()=>{try{if(isSaved){await api.unsaveOpportunity(oppId);setIsSaved(false);setToast("Bookmark removed");}else{await api.saveOpportunity(oppId);setIsSaved(true);setToast("Saved! 🔖");}setTimeout(()=>setToast(null),3000);}catch(e){setToast(e.message);}};

  if (loading) return <Spinner/>;
  if (!opp) return <p style={{padding:32,color:C.grey500}}>Opportunity not found.</p>;
  return (
    <div style={{maxWidth:720,margin:"0 auto"}}>
      {toast&&<Toast msg={toast}/>}
      <button onClick={()=>setPage("Opportunities")} style={{background:"none",border:"none",color:C.grey500,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:24,fontFamily:"inherit"}}>← Back to Opportunities</button>
      <Card style={{padding:32}}>
        <div style={{display:"flex",gap:16,marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:16,background:C.orangeTint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`1px solid ${C.orange}33`}}>🏢</div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:24,fontWeight:800,color:C.white,fontFamily:"'Fraunces',serif"}}>{opp.title}</h1>
            <p style={{color:C.grey500,marginTop:4}}>{company?.company_name||"Company"}</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <button onClick={toggleSave} style={{background:isSaved?C.orangeTint:"transparent",border:`1px solid ${isSaved?C.orange:C.black5}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:14,color:isSaved?C.orange:C.grey500,transition:"all .15s"}}>
              {isSaved?"🔖 Saved":"🔗 Save"}
            </button>
            <span style={{background:C.greenFaint,color:C.green,borderRadius:20,padding:"4px 14px",fontSize:13,fontWeight:600,border:`1px solid ${C.green}44`}}>Open</span>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:20,marginBottom:24,fontSize:14,color:C.grey400}}>
          {opp.location&&<span>📍 {opp.location}</span>}
          {opp.work_type&&<span>💼 {opp.work_type}</span>}
          {opp.stipend>0&&<span style={{fontWeight:600,color:C.orange}}>💰 R{opp.stipend.toLocaleString()}/month</span>}
          {opp.closing_date&&<span style={{color:C.rose}}>⏰ Closes {fmt(opp.closing_date)}</span>}
        </div>
        {opp.description&&<div style={{marginBottom:20}}><h3 style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:8}}>Description</h3><p style={{fontSize:14,color:C.grey400,lineHeight:1.7}}>{opp.description}</p></div>}
        {opp.requirements&&<div style={{marginBottom:24}}><h3 style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:8}}>Requirements</h3><p style={{fontSize:14,color:C.grey400,lineHeight:1.7}}>{opp.requirements}</p></div>}
        {alreadyApplied?(
          <div style={{background:C.greenFaint,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.green}33`}}>
            <span>✅</span><p style={{fontSize:14,color:C.green,fontWeight:600}}>You have already applied for this opportunity.</p>
          </div>
        ):!showApply?(
          <Btn onClick={()=>setShowApply(true)}>📤 Apply Now</Btn>
        ):(
          <div style={{border:`1px solid ${C.black5}`,borderRadius:14,padding:24,background:C.black2}}>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.white}}>Submit Application</h3>
            <TextareaInput label="Cover Letter (Optional)" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} placeholder="Tell the company why you're a great fit…" rows={5}/>
            <p style={{fontSize:12,color:C.grey600,marginBottom:16}}>Your uploaded documents will be shared with this application.</p>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={handleApply} disabled={submitting}>{submitting?"Submitting…":"Submit Application"}</Btn>
              <Btn variant="secondary" onClick={()=>setShowApply(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── My Applications ────────────────────────────────────────────
function MyApplications() {
  const [apps,setApps]=useState([]);const [opps,setOpps]=useState({});const [comps,setComps]=useState({});
  const [loading,setLoading]=useState(true);const [filter,setFilter]=useState("all");
  useEffect(()=>{Promise.all([api.getApplications(),api.getOpportunities(),api.getCompanies()]).then(([a,o,c])=>{setApps(a);const om={};o.forEach(x=>om[x.id]=x);setOpps(om);const cm={};c.forEach(x=>cm[x.id]=x);setComps(cm);setLoading(false);});},[]);
  const filtered=filter==="all"?apps:apps.filter(a=>a.status===filter);
  if (loading) return <Spinner/>;
  return (
    <div>
      <PageHeader title="My Applications" description="Track the status of your internship applications."
        actions={<select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,background:C.black3,color:C.white,fontFamily:"inherit"}}>
          <option value="all">All Statuses</option>{Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>}/>
      {filtered.length===0?<Card style={{padding:48,textAlign:"center"}}><p style={{color:C.grey600}}>No applications found.</p></Card>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(a=>{const o=opps[a.opportunity_id],c=o?comps[o.company_id]:null;return(
            <Card key={a.id} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <p style={{fontWeight:700,fontSize:15,color:C.white}}>{o?.title||"Opportunity"}</p>
                  <p style={{fontSize:13,color:C.grey500,marginTop:2}}>{c?.company_name||"Company"}</p>
                  <p style={{fontSize:12,color:C.grey600,marginTop:4}}>Applied {fmt(a.created_date)}</p>
                </div>
                <StatusBadge status={a.status}/>
              </div>
              {a.reviewer_notes&&<div style={{marginTop:12,background:C.black2,borderRadius:10,padding:12,border:`1px solid ${C.black5}`}}><p style={{fontSize:12,fontWeight:600,color:C.grey500,marginBottom:4}}>Reviewer Notes:</p><p style={{fontSize:13,color:C.grey300}}>{a.reviewer_notes}</p></div>}
            </Card>
          );})}
        </div>
      )}
    </div>
  );
}

// ── My Documents ───────────────────────────────────────────────
function MyDocuments() {
  const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);const [docType,setDocType]=useState("CV");const [toast,setToast]=useState(null);
  const BASE_URL=import.meta.env.VITE_API_URL||"http://localhost:5000";
  const DOC_TYPES=["CV","Motivation Letter","ID Copy","Matric Certificate","Proof of Address","Academic Record","Other"];
  const load=()=>api.getDocuments().then(d=>{setDocs(d);setLoading(false);});
  useEffect(()=>{load();},[]);
  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const handleUpload=async(e)=>{const file=e.target.files[0];if(!file)return;setUploading(true);try{const{file_url,file_name}=await api.uploadFile(file);await api.createDocument({document_type:docType,file_url,file_name});await load();showToast("Document uploaded!");}catch(err){showToast(err.message,"error");}setUploading(false);e.target.value="";};
  const handleDelete=async(id)=>{await api.deleteDocument(id);setDocs(docs.filter(d=>d.id!==id));showToast("Deleted.");};
  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <PageHeader title="My Documents" description="Upload and manage your application documents."/>
      <Card style={{padding:24,marginBottom:24}}>
        <h3 style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:14}}>Upload New Document</h3>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <select value={docType} onChange={e=>setDocType(e.target.value)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,fontFamily:"inherit",background:C.black4,color:C.white,minWidth:200}}>
            {DOC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <label style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:`2px dashed ${C.black6}`,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:14,color:C.grey500,background:C.black4}}>
            <input type="file" style={{display:"none"}} onChange={handleUpload} disabled={uploading}/>
            📤 {uploading?"Uploading…":"Click to select file"}
          </label>
        </div>
      </Card>
      {docs.length===0?<Card style={{padding:48,textAlign:"center"}}><p style={{color:C.grey600}}>No documents uploaded yet.</p></Card>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {docs.map(doc=>(
            <Card key={doc.id} style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:C.orangeTint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,border:`1px solid ${C.orange}33`}}>📄</div>
                <div>
                  <p style={{fontWeight:600,fontSize:14,color:C.white}}>{doc.file_name}</p>
                  <div style={{display:"flex",gap:8,marginTop:2}}>
                    <span style={{fontSize:12,color:C.orange,fontWeight:600}}>{doc.document_type}</span>
                    <span style={{fontSize:12,color:C.grey600}}>· {fmt(doc.created_date)}</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <a href={`${BASE_URL}${doc.file_url}`} target="_blank" rel="noreferrer" style={{padding:"6px 12px",borderRadius:8,background:C.black4,color:C.grey300,fontSize:12,fontWeight:600,textDecoration:"none",border:`1px solid ${C.black6}`}}>View</a>
                <button onClick={()=>handleDelete(doc.id)} style={{padding:"6px 12px",borderRadius:8,background:C.roseFaint,color:C.rose,border:`1px solid ${C.rose}33`,fontSize:12,fontWeight:600,cursor:"pointer"}}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────
function Notifications() {
  const [notifs,setNotifs]=useState([]);const [loading,setLoading]=useState(true);
  const load=()=>api.getNotifications().then(n=>{setNotifs(n);setLoading(false);});
  useEffect(()=>{load();},[]);
  const markOne=async(id)=>{await api.updateNotification(id,{is_read:true});setNotifs(notifs.map(n=>n.id===id?{...n,is_read:true}:n));};
  const markAll=async()=>{await api.markAllRead();setNotifs(notifs.map(n=>({...n,is_read:true})));};
  const unread=notifs.filter(n=>!n.is_read).length;
  if (loading) return <Spinner/>;
  return (
    <div>
      <PageHeader title="Notifications" description={unread>0?`${unread} unread`:"All caught up!"}
        actions={unread>0&&<Btn variant="outline" size="sm" onClick={markAll}>✓ Mark all read</Btn>}/>
      {notifs.length===0?<Card style={{padding:48,textAlign:"center"}}><p style={{color:C.grey600}}>No notifications yet.</p></Card>:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {notifs.map(n=>(
            <div key={n.id} onClick={()=>!n.is_read&&markOne(n.id)}
              style={{background:n.is_read?C.black3:C.orangeTint,border:`1px solid ${n.is_read?C.black5:C.orange+"44"}`,borderRadius:14,padding:"14px 20px",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
              {!n.is_read&&<span style={{width:8,height:8,borderRadius:"50%",background:C.orange,marginTop:5,flexShrink:0,display:"inline-block"}}/>}
              <div style={{flex:1}}>
                <p style={{fontSize:14,color:n.is_read?C.grey500:C.white,fontWeight:n.is_read?400:600,lineHeight:1.5}}>{n.message}</p>
                <p style={{fontSize:12,color:C.grey600,marginTop:4}}>{fmt(n.created_date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────
function AdminDashboard({setPage}) {
  const [stats,setStats]=useState(null);const [apps,setApps]=useState([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([api.getStats(),api.getApplications()]).then(([s,a])=>{setStats(s);setApps(a.slice(0,8));setLoading(false);});},[]);
  if (loading) return <Spinner/>;
  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Overview of the WIL placement system."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:32}}>
        <StatsCard title="Total Applications" value={stats.total_applications} accent/>
        <StatsCard title="Pending Review" value={stats.pending_review}/>
        <StatsCard title="Approved" value={stats.approved} accent/>
        <StatsCard title="Open Opportunities" value={stats.open_opportunities}/>
      </div>
      <Card>
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.black5}`,display:"flex",justifyContent:"space-between"}}>
          <h2 style={{fontWeight:700,fontSize:16,color:C.white}}>Recent Applications</h2>
          <button onClick={()=>setPage("AdminApplications")} style={{background:"none",border:"none",color:C.orange,fontSize:13,cursor:"pointer",fontWeight:600}}>View all →</button>
        </div>
        {apps.map(a=>(
          <div key={a.id} style={{padding:"12px 24px",borderBottom:`1px solid ${C.black4}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><p style={{fontWeight:600,fontSize:14,color:C.white}}>{a.student_email}</p><p style={{fontSize:12,color:C.grey600,marginTop:1}}>{fmt(a.created_date)}</p></div>
            <StatusBadge status={a.status}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Admin Applications ─────────────────────────────────────────
function AdminApplications() {
  const [apps,setApps]=useState([]);const [opps,setOpps]=useState({});const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");const [reviewing,setReviewing]=useState(null);const [notes,setNotes]=useState("");const [docs,setDocs]=useState([]);const [toast,setToast]=useState(null);
  const BASE_URL=import.meta.env.VITE_API_URL||"http://localhost:5000";
  const load=async()=>{const[a,o]=await Promise.all([api.getApplications(),api.getOpportunities()]);setApps(a);const m={};o.forEach(x=>m[x.id]=x);setOpps(m);setLoading(false);};
  useEffect(()=>{load();},[]);
  const openReview=async(app)=>{setReviewing(app);setNotes(app.reviewer_notes||"");const d=await api.getDocuments(app.student_email);setDocs(d);};
  const updateStatus=async(status)=>{await api.updateApplication(reviewing.id,{status,reviewer_notes:notes});setToast(`Application ${status}`);setTimeout(()=>setToast(null),3000);setReviewing(null);load();};
  const filtered=filter==="all"?apps:apps.filter(a=>a.status===filter);
  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <PageHeader title="Manage Applications" description="Review and manage student applications."
        actions={<select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,background:C.black3,color:C.white,fontFamily:"inherit"}}>
          <option value="all">All Statuses</option>{Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(a=>(
          <Card key={a.id} style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontWeight:600,fontSize:14,color:C.white}}>{a.student_email}</p>
              <p style={{fontSize:13,color:C.grey500,marginTop:2}}>{opps[a.opportunity_id]?.title||"Opportunity"}</p>
              <p style={{fontSize:12,color:C.grey600,marginTop:2}}>Applied {fmt(a.created_date)}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}><StatusBadge status={a.status}/><Btn size="sm" variant="outline" onClick={()=>openReview(a)}>👁 Review</Btn></div>
          </Card>
        ))}
      </div>
      <Modal open={!!reviewing} onClose={()=>setReviewing(null)} title="Review Application"
        footer={<><Btn variant="danger" size="sm" onClick={()=>updateStatus("rejected")}>✕ Reject</Btn><Btn variant="secondary" size="sm" onClick={()=>updateStatus("under_review")}>Under Review</Btn><Btn variant="green" size="sm" onClick={()=>updateStatus("approved")}>✓ Approve</Btn></>}>
        {reviewing&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              {[["Student",reviewing.student_email],["Opportunity",opps[reviewing.opportunity_id]?.title||"N/A"],["Applied",fmt(reviewing.created_date)]].map(([l,v])=>(
                <div key={l}><p style={{fontSize:12,color:C.grey500,marginBottom:4}}>{l}</p><p style={{fontSize:14,fontWeight:600,color:C.grey200}}>{v}</p></div>
              ))}
              <div><p style={{fontSize:12,color:C.grey500,marginBottom:4}}>Status</p><StatusBadge status={reviewing.status}/></div>
            </div>
            {reviewing.cover_letter&&<div style={{marginBottom:16}}><p style={{fontSize:12,color:C.grey500,marginBottom:6}}>Cover Letter</p><div style={{background:C.black3,borderRadius:10,padding:12,fontSize:13,color:C.grey300,lineHeight:1.6,border:`1px solid ${C.black5}`}}>{reviewing.cover_letter}</div></div>}
            {docs.length>0&&<div style={{marginBottom:16}}><p style={{fontSize:12,color:C.grey500,marginBottom:6}}>Documents</p>{docs.map(d=><a key={d.id} href={`${BASE_URL}${d.file_url}`} target="_blank" rel="noreferrer" style={{display:"block",color:C.orange,fontSize:13,marginBottom:4,textDecoration:"none"}}>📄 {d.document_type} — {d.file_name}</a>)}</div>}
            <TextareaInput label="Reviewer Notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes…" rows={3}/>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Admin Opportunities ────────────────────────────────────────
function AdminOpportunities() {
  const [opps,setOpps]=useState([]);const [companies,setCompanies]=useState([]);const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);const [editId,setEditId]=useState(null);const [toast,setToast]=useState(null);
  const empty={title:"",company_id:"",description:"",requirements:"",location:"",work_type:"Full-time",stipend:0,closing_date:"",status:"open"};
  const [form,setForm]=useState(empty);const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const load=async()=>{const[o,c]=await Promise.all([api.getOpportunities(),api.getCompanies()]);setOpps(o);setCompanies(c);setLoading(false);};
  useEffect(()=>{load();},[]);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),4000);};
  const openNew=()=>{setForm(empty);setEditId(null);setOpen(true);};
  const openEdit=o=>{setForm({...empty,...o});setEditId(o.id);setOpen(true);};
  const handleSave=async()=>{
    if(editId){await api.updateOpportunity(editId,form);setOpen(false);load();showToast("Opportunity updated");}
    else{const result=await api.createOpportunity(form);setOpen(false);load();showToast(`Opportunity created! 🔔 ${result.students_notified||0} student${(result.students_notified||0)===1?"":"s"} notified`);}
  };
  const handleDelete=async id=>{await api.deleteOpportunity(id);load();showToast("Deleted");};
  const compMap={};companies.forEach(c=>compMap[c.id]=c);
  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <PageHeader title="Manage Opportunities" description="Create and manage internship opportunities."
        actions={<Btn onClick={openNew}>+ New Opportunity</Btn>}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {opps.map(o=>(
          <Card key={o.id} style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <p style={{fontWeight:700,fontSize:15,color:C.white}}>{o.title}</p>
                <span style={{background:o.status==="open"?C.greenFaint:C.black4,color:o.status==="open"?C.green:C.grey500,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>{o.status}</span>
              </div>
              <p style={{fontSize:13,color:C.grey500,marginTop:2}}>{compMap[o.company_id]?.company_name||"No company"} · {o.location||"TBD"}</p>
              {o.closing_date&&<p style={{fontSize:12,color:C.grey600,marginTop:2}}>Closes {fmt(o.closing_date)}</p>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn size="sm" variant="outline" onClick={()=>openEdit(o)}>✏️ Edit</Btn>
              <Btn size="sm" variant="danger" onClick={()=>handleDelete(o.id)}>🗑️</Btn>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title={editId?"Edit Opportunity":"New Opportunity"}
        footer={<><Btn variant="secondary" onClick={()=>setOpen(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={!form.title}>{editId?"Update":"Create & Notify Students"}</Btn></>}>
        <Input label="Title" value={form.title} onChange={f("title")} required/>
        <SelectInput label="Company" value={form.company_id} onChange={f("company_id")} options={[{value:"",label:"Select company"},...companies.map(c=>({value:c.id,label:c.company_name}))]}/>
        <TextareaInput label="Description" value={form.description} onChange={f("description")}/>
        <TextareaInput label="Requirements" value={form.requirements} onChange={f("requirements")}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Location" value={form.location} onChange={f("location")}/>
          <SelectInput label="Work Type" value={form.work_type} onChange={f("work_type")} options={["Full-time","Part-time","Remote","Hybrid"]}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Stipend (R/month)" type="number" value={form.stipend} onChange={f("stipend")}/>
          <Input label="Closing Date" type="date" value={form.closing_date} onChange={f("closing_date")}/>
        </div>
        <SelectInput label="Status" value={form.status} onChange={f("status")} options={["open","closed","filled"]}/>
        {!editId&&<p style={{fontSize:12,color:C.orange,marginTop:4}}>🔔 All registered students will be notified when you post this.</p>}
      </Modal>
    </div>
  );
}

// ── Admin Companies ────────────────────────────────────────────
function AdminCompanies() {
  const [companies,setCompanies]=useState([]);const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);const [editId,setEditId]=useState(null);const [toast,setToast]=useState(null);
  const empty={company_name:"",company_email:"",company_phone:"",address:"",industry_type:"IT",contact_person_name:"",contact_person_position:"",contact_person_phone:"",registration_number:""};
  const [form,setForm]=useState(empty);const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const INDUSTRIES=["IT","Finance","Engineering","Healthcare","Education","Manufacturing","Retail","Government","Other"];
  const load=()=>api.getCompanies().then(c=>{setCompanies(c);setLoading(false);});
  useEffect(()=>{load();},[]);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3000);};
  const openNew=()=>{setForm(empty);setEditId(null);setOpen(true);};
  const openEdit=c=>{setForm({...empty,...c});setEditId(c.id);setOpen(true);};
  const handleSave=async()=>{if(editId)await api.updateCompany(editId,form);else await api.createCompany(form);setOpen(false);load();showToast(editId?"Updated":"Added");};
  const handleDelete=async id=>{await api.deleteCompany(id);load();showToast("Deleted");};
  if (loading) return <Spinner/>;
  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <PageHeader title="Companies" description="Manage the company database." actions={<Btn onClick={openNew}>+ Add Company</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {companies.map(c=>(
          <Card key={c.id} style={{padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:42,height:42,borderRadius:12,background:C.orangeTint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${C.orange}33`}}>🏢</div>
                <div>
                  <p style={{fontWeight:700,fontSize:15,color:C.white}}>{c.company_name}</p>
                  <span style={{background:C.black4,color:C.grey400,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>{c.industry_type}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <Btn size="sm" variant="ghost" onClick={()=>openEdit(c)}>✏️</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>handleDelete(c.id)} style={{color:C.rose}}>🗑️</Btn>
              </div>
            </div>
            {c.contact_person_name&&<p style={{fontSize:13,color:C.grey500,marginTop:12}}>Contact: {c.contact_person_name}</p>}
            {c.address&&<p style={{fontSize:12,color:C.grey600,marginTop:4}}>{c.address}</p>}
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title={editId?"Edit Company":"Add Company"}
        footer={<><Btn variant="secondary" onClick={()=>setOpen(false)}>Cancel</Btn><Btn onClick={handleSave} disabled={!form.company_name}>{editId?"Update":"Add"}</Btn></>}>
        <Input label="Company Name" value={form.company_name} onChange={f("company_name")} required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="Email" value={form.company_email} onChange={f("company_email")}/><Input label="Phone" value={form.company_phone} onChange={f("company_phone")}/></div>
        <Input label="Address" value={form.address} onChange={f("address")}/>
        <SelectInput label="Industry" value={form.industry_type} onChange={f("industry_type")} options={INDUSTRIES}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="Contact Person" value={form.contact_person_name} onChange={f("contact_person_name")}/><Input label="Position" value={form.contact_person_position} onChange={f("contact_person_position")}/></div>
        <Input label="Registration Number" value={form.registration_number} onChange={f("registration_number")}/>
      </Modal>
    </div>
  );
}

// ── Manage Students ────────────────────────────────────────────
function ManageStudents() {
  const [students,setStudents]=useState([]);const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);const [viewStudent,setViewStudent]=useState(null);const [search,setSearch]=useState("");

  const load=()=>api.getStudents().then(s=>{setStudents(s);setLoading(false);});
  useEffect(()=>{load();},[]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const handlePromote=async(s)=>{
    if(!window.confirm(`Promote ${s.full_name||s.email} to Coordinator? They will gain admin access.`)) return;
    try{await api.promoteStudent(s.id);showToast(`${s.full_name||s.email} promoted to Coordinator`);load();}
    catch(e){showToast(e.message,"error");}
  };

  const handleDelete=async(s)=>{
    if(!window.confirm(`Delete student account for ${s.full_name||s.email}? This cannot be undone.`)) return;
    try{await api.deleteStudent(s.id);showToast("Student account deleted");load();}
    catch(e){showToast(e.message,"error");}
  };

  const filtered=students.filter(s=>{
    const q=search.toLowerCase();
    return !q||(s.full_name||"").toLowerCase().includes(q)||s.email.toLowerCase().includes(q);
  });

  if (loading) return <Spinner/>;

  return (
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <PageHeader title="Manage Students" description={`${students.length} registered student${students.length===1?"":"s"}`}/>

      {/* Search */}
      <div style={{position:"relative",marginBottom:20,maxWidth:400}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
          style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:`1px solid ${C.black6}`,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:C.black3,color:C.white}}/>
      </div>

      {filtered.length===0?(
        <Card style={{padding:48,textAlign:"center"}}>
          <p style={{fontSize:40,marginBottom:12}}>👥</p>
          <p style={{color:C.grey400,fontWeight:600}}>{search?"No students match your search":"No students registered yet"}</p>
        </Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(s=>(
            <Card key={s.id} style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {/* Avatar */}
                <div style={{width:42,height:42,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.white,flexShrink:0}}>
                  {(s.full_name?.[0]||s.email[0]).toUpperCase()}
                </div>
                <div>
                  <p style={{fontWeight:600,fontSize:15,color:C.white}}>{s.full_name||"No name provided"}</p>
                  <p style={{fontSize:13,color:C.grey500,marginTop:1}}>{s.email}</p>
                  <div style={{display:"flex",gap:12,marginTop:4,fontSize:12,color:C.grey600}}>
                    <span>Joined {fmt(s.created_date)}</span>
                    <span>·</span>
                    <span style={{color:s.application_count>0?C.orange:C.grey600}}>{s.application_count} application{s.application_count===1?"":"s"}</span>
                    {s.profile?.student_number&&<><span>·</span><span>#{s.profile.student_number}</span></>}
                    {s.profile?.programme&&<><span>·</span><span>{s.profile.programme}</span></>}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <Btn size="sm" variant="secondary" onClick={()=>setViewStudent(s)}>👁 View</Btn>
                <Btn size="sm" variant="amber" onClick={()=>handlePromote(s)}>⬆️ Promote</Btn>
                <Btn size="sm" variant="danger" onClick={()=>handleDelete(s)}>🗑️</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View student modal */}
      <Modal open={!!viewStudent} onClose={()=>setViewStudent(null)} title="Student Profile">
        {viewStudent&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:16,background:C.black3,borderRadius:12,border:`1px solid ${C.black5}`}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:C.white,flexShrink:0}}>
                {(viewStudent.full_name?.[0]||viewStudent.email[0]).toUpperCase()}
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:16,color:C.white}}>{viewStudent.full_name||"No name"}</p>
                <p style={{fontSize:13,color:C.grey500,marginTop:2}}>{viewStudent.email}</p>
                <p style={{fontSize:12,color:C.grey600,marginTop:2}}>Joined {fmt(viewStudent.created_date)}</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[
                ["Student Number", viewStudent.profile?.student_number||"—"],
                ["Programme",      viewStudent.profile?.programme||"—"],
                ["Year of Study",  viewStudent.profile?.year_of_study||"—"],
                ["Phone",          viewStudent.profile?.phone_number||"—"],
                ["Applications",   viewStudent.application_count],
                ["Skills",         viewStudent.profile?.skills||"—"],
              ].map(([l,v])=>(
                <div key={l} style={{background:C.black3,borderRadius:10,padding:12,border:`1px solid ${C.black5}`}}>
                  <p style={{fontSize:11,color:C.grey500,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{l}</p>
                  <p style={{fontSize:14,fontWeight:600,color:C.white}}>{v}</p>
                </div>
              ))}
            </div>
            {viewStudent.profile?.address&&(
              <div style={{background:C.black3,borderRadius:10,padding:12,border:`1px solid ${C.black5}`}}>
                <p style={{fontSize:11,color:C.grey500,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Address</p>
                <p style={{fontSize:14,color:C.white}}>{viewStudent.profile.address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Admin Stats ────────────────────────────────────────────────
function AdminStats() {
  const [stats,setStats]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{api.getStats().then(s=>{setStats(s);setLoading(false);});},[]);
  if (loading) return <Spinner/>;
  const maxInd=Math.max(...Object.values(stats.industry_distribution||{}),1);
  return (
    <div>
      <PageHeader title="Placement Statistics" description="Overview of placement system data."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:24}}>
        <StatsCard title="Total Applications" value={stats.total_applications} accent/>
        <StatsCard title="Approved" value={stats.approved} accent/>
        <StatsCard title="Total Opportunities" value={stats.total_opportunities}/>
        <StatsCard title="Companies" value={stats.total_companies}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{padding:24}}>
          <h3 style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:20}}>Application Status Distribution</h3>
          {Object.entries(stats.status_distribution||{}).map(([status,count])=>{
            const cfg=STATUS_CFG[status];const pct=Math.round(count/stats.total_applications*100);
            return(<div key={status} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,fontWeight:600,color:cfg?.text||C.grey400,textTransform:"capitalize"}}>{status.replace("_"," ")}</span>
                <span style={{fontSize:13,color:C.grey500}}>{count} ({pct}%)</span>
              </div>
              <div style={{height:8,borderRadius:4,background:C.black4}}>
                <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:cfg?.dot||C.orange,transition:"width .5s"}}/>
              </div>
            </div>);
          })}
        </Card>
        <Card style={{padding:24}}>
          <h3 style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:20}}>Opportunities by Industry</h3>
          {Object.entries(stats.industry_distribution||{}).map(([ind,count])=>(
            <div key={ind} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <span style={{fontSize:13,color:C.grey400,width:110,flexShrink:0}}>{ind}</span>
              <div style={{flex:1,height:24,borderRadius:6,background:C.black4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(count/maxInd)*100}%`,background:C.orange,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8,minWidth:24}}>
                  <span style={{fontSize:12,color:C.white,fontWeight:700}}>{count}</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);const [authChecked,setAuthChecked]=useState(false);
  const [page,setPage]=useState("Landing");const [pageParam,setPageParam]=useState(null);const [notifCount,setNotifCount]=useState(0);

  useEffect(()=>{api.me().then(u=>{setUser(u);setPage(u.role==="student"?"Dashboard":"AdminDashboard");setAuthChecked(true);}).catch(()=>setAuthChecked(true));},[]);
  useEffect(()=>{if(!user)return;const refresh=()=>api.getNotifications().then(n=>setNotifCount(n.filter(x=>!x.is_read).length)).catch(()=>{});refresh();const t=setInterval(refresh,30000);return()=>clearInterval(t);},[user,page]);

  const navigate=(p,param=null)=>{setPage(p);setPageParam(param);};
  const handleLogin=u=>{setUser(u);setPage(u.role==="student"?"Dashboard":"AdminDashboard");};
  const handleLogout=async()=>{await api.logout();setUser(null);setPage("Landing");};

  const STYLES=`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'DM Sans',sans-serif;background:${C.black1};}
    input::placeholder,textarea::placeholder{color:${C.grey600};}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.black2}}::-webkit-scrollbar-thumb{background:${C.black5};border-radius:3px}
  `;

  if (!authChecked) return <><style>{STYLES}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.black1}}><Spinner/></div></>;

  if (!user) {
    if (page==="Login"||page==="Register") return <><style>{STYLES}</style><AuthPage mode={page==="Register"?"register":"login"} setPage={navigate} onLogin={handleLogin}/></>;
    return <><style>{STYLES}</style><LandingPage setPage={navigate}/></>;
  }

  const renderPage=()=>{
    const props={setPage:navigate};
    switch(page){
      case "Dashboard":          return <Dashboard {...props}/>;
      case "Opportunities":      return <Opportunities {...props}/>;
      case "SavedOpportunities": return <SavedOpportunities {...props}/>;
      case "OpportunityDetail":  return <OpportunityDetail {...props} oppId={pageParam}/>;
      case "MyApplications":     return <MyApplications {...props}/>;
      case "MyDocuments":        return <MyDocuments {...props}/>;
      case "Notifications":      return <Notifications {...props}/>;
      case "AdminDashboard":     return <AdminDashboard {...props}/>;
      case "AdminApplications":  return <AdminApplications {...props}/>;
      case "AdminOpportunities": return <AdminOpportunities {...props}/>;
      case "AdminCompanies":     return <AdminCompanies {...props}/>;
      case "ManageStudents":     return <ManageStudents {...props}/>;
      case "AdminStats":         return <AdminStats {...props}/>;
      default:                   return <Dashboard {...props}/>;
    }
  };

  return (
    <AuthContext.Provider value={{user,setUser}}>
      <style>{STYLES}</style>
      <AppShell user={user} onLogout={handleLogout} currentPage={page} setPage={navigate} notifCount={notifCount}>
        {renderPage()}
      </AppShell>
    </AuthContext.Provider>
  );
}
