// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { useData } from "./hooks/useData";
import Setup from "./components/Setup";
import { api } from "./lib/api";

// ── tiny UI atoms ─────────────────────────────────────────────────────────────
const USER_COLORS = ["#f97316", "#06b6d4", "#a78bfa"];

function colorFor(idx) { return USER_COLORS[idx % USER_COLORS.length]; }

function Avatar({ name, avatarUrl, color, size = 42 }) {
  const initials = name?.slice(0, 2).toUpperCase() ?? "??";
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}`, flexShrink: 0, objectFit: "cover",
    }}/>
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${color}bb,${color}33)`,
      border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.35, color: "#fff",
    }}>{initials}</div>
  );
}

function StreakRing({ streak, color, max = 30 }) {
  const r = 28, circ = 2 * Math.PI * r;
  const pct = Math.min((streak ?? 0) / max, 1);
  return (
    <svg width={70} height={70} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke="#1e293b" strokeWidth={6}/>
      <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 4px ${color})`, transition:"stroke-dashoffset 0.8s ease" }}/>
      <text x={35} y={35} textAnchor="middle" dominantBaseline="central"
        style={{ transform:"rotate(90deg)", transformOrigin:"35px 35px",
          fill:"#fff", fontSize:14, fontWeight:700, fontFamily:"monospace" }}>
        {streak ?? 0}
      </text>
    </svg>
  );
}

function Heatmap({ data }) {
  if (!data?.length) return <div style={{ color:"#475569", fontSize:12 }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i+7));
  return (
    <div style={{ overflowX:"auto", paddingBottom:4 }}>
      <div style={{ display:"flex", gap:3, minWidth:"max-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {week.map((day, di) => {
              const a = day.count===0 ? 0 : 0.15 + (day.count/max)*0.85;
              return (
                <div key={di} title={`${day.date}: ${day.count}`} style={{
                  width:11, height:11, borderRadius:2, cursor:"default",
                  background: a===0 ? "#1e293b" : `rgba(6,182,212,${a})`,
                  boxShadow: a>0.6 ? "0 0 4px rgba(6,182,212,0.5)" : "none",
                  transition:"transform 0.1s",
                }}
                onMouseEnter={e=>e.target.style.transform="scale(1.5)"}
                onMouseLeave={e=>e.target.style.transform="scale(1)"}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekBars({ data, color }) {
  const days = ["M","T","W","T","F","S","S"];
  const vals = data ?? [0,0,0,0,0,0,0];
  const max = Math.max(...vals, 1);
  return (
    <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:64 }}>
      {vals.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{
            width:"100%", minHeight:3, height:Math.max((v/max)*52,3),
            background:`linear-gradient(to top,${color},${color}88)`,
            borderRadius:"3px 3px 0 0",
            boxShadow: v>0 ? `0 0 8px ${color}55` : "none",
            transition:"height 0.8s ease",
          }}/>
          <span style={{ fontSize:9, color:"#64748b" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ background:"#1e293b", borderRadius:4, height:8, flex:1, overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${Math.min((value/Math.max(max,1))*100,100)}%`,
        background:color, borderRadius:4, boxShadow:`0 0 6px ${color}88`,
        transition:"width 0.8s ease",
      }}/>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <div style={{ fontSize:48, animation:"spin 1s linear infinite" }}>⚙️</div>
      <div style={{ color:"#64748b", fontSize:13 }}>Loading arena data...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── UserCard ──────────────────────────────────────────────────────────────────
function UserCard({ user, color, rank, heatmap, weekly, expanded, onToggle }) {
  const rankEmoji = rank===1?"🥇":rank===2?"🥈":"🥉";
  const msg = (user.today_solved??0) >= 5 ? `🔥 ${user.name} is on fire today!`
    : (user.today_solved??0) >= 3 ? `⚡ ${user.name} is crushing it!`
    : user.streak_at_risk ? `⚠️ ${user.name}'s streak is at risk!`
    : `🎯 ${user.name} is grinding!`;

  return (
    <div onClick={onToggle} style={{
      background:"linear-gradient(135deg,#0f172a,#1e293b)",
      border:`1px solid ${expanded ? color+"55" : color+"22"}`,
      borderRadius:16, padding:20, cursor:"pointer",
      boxShadow: expanded ? `0 0 28px ${color}33` : "0 4px 20px rgba(0,0,0,0.3)",
      transform: expanded ? "translateY(-2px)" : "none",
      transition:"all 0.3s ease",
    }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
        <div style={{ position:"relative" }}>
          <Avatar name={user.name} avatarUrl={user.avatar_url} color={color} size={48}/>
          <span style={{ position:"absolute", bottom:-4, right:-4, fontSize:18 }}>{rankEmoji}</span>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:18, color:"#f1f5f9" }}>{user.name}</div>
          <div style={{ fontSize:11, color:"#64748b" }}>@{user.leetcode_username}</div>
        </div>
        <StreakRing streak={user.current_streak} color={color}/>
      </div>

      <div style={{
        background:`${color}11`, border:`1px solid ${color}22`,
        borderRadius:8, padding:"6px 12px", marginBottom:14,
        fontSize:12, color:color,
      }}>{msg}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
        {[
          { l:"Today",  v: user.today_solved ?? 0 },
          { l:"Total",  v: user.total_solved ?? 0 },
          { l:"Points", v: (user.points ?? 0).toLocaleString() },
        ].map(s => (
          <div key={s.l} style={{ background:"#0f172a", borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
            <div style={{ fontWeight:700, fontSize:17, color }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
        {[...Array(7)].map((_,i) => (
          <span key={i} style={{
            fontSize:15,
            filter: i < Math.min(user.current_streak??0,7)
              ? "drop-shadow(0 0 5px #f97316)" : "grayscale(1) opacity(0.25)",
            transition:"all 0.3s",
          }}>🔥</span>
        ))}
        <span style={{ marginLeft:8, fontSize:11, color:"#64748b" }}>
          {user.current_streak??0}d · best {user.longest_streak??0}d
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop:18, borderTop:`1px solid ${color}22`, paddingTop:16 }}>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>THIS WEEK</div>
          <WeekBars data={weekly} color={color}/>
          <div style={{ fontSize:11, color:"#64748b", margin:"14px 0 8px" }}>YEARLY HEATMAP</div>
          <Heatmap data={heatmap}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
            <div style={{ background:"#0f172a", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:14, color }}>{user.easy_solved??0}</div>
              <div style={{ fontSize:9, color:"#22c55e" }}>Easy</div>
            </div>
            <div style={{ background:"#0f172a", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:14, color }}>{user.medium_solved??0}</div>
              <div style={{ fontSize:9, color:"#f59e0b" }}>Medium</div>
            </div>
            <div style={{ background:"#0f172a", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:14, color }}>{user.hard_solved??0}</div>
              <div style={{ fontSize:9, color:"#ef4444" }}>Hard</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardTab({ leaderboard }) {
  const maxPts = Math.max(...leaderboard.map(u => u.points ?? 0), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e293b", display:"flex", gap:10, alignItems:"center",
          background:"linear-gradient(90deg,#06b6d411,#a78bfa11)" }}>
          <span style={{ fontSize:20 }}>🏆</span>
          <span style={{ fontWeight:700, fontSize:15 }}>LEADERBOARD</span>
          <span style={{ marginLeft:"auto", fontSize:10, color:"#06b6d4",
            background:"#06b6d411", padding:"3px 8px", borderRadius:20 }}>● LIVE</span>
        </div>
        {leaderboard.map((u, i) => {
          const color = colorFor(i);
          const emoji = i===0?"🥇":i===1?"🥈":"🥉";
          return (
            <div key={u.id} style={{
              display:"flex", alignItems:"center", gap:12, padding:"14px 20px",
              borderBottom: i<leaderboard.length-1 ? "1px solid #1e293b" : "none",
              background: i===0 ? `${color}08` : "transparent",
            }}>
              <span style={{ fontSize:22, width:30 }}>{emoji}</span>
              <Avatar name={u.name} avatarUrl={u.avatar_url} color={color} size={36}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color }}>{u.name}</div>
                <div style={{ display:"flex", gap:10, marginTop:3 }}>
                  <span style={{ fontSize:10, color:"#64748b" }}>{u.today_solved??0} today</span>
                  <span style={{ fontSize:10, color:"#f97316" }}>🔥{u.current_streak??0}d</span>
                  {u.streak_at_risk && <span style={{ fontSize:10, color:"#ef4444" }}>⚠️ at risk</span>}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, fontSize:16, color }}>{(u.points??0).toLocaleString()}</div>
                <div style={{ fontSize:10, color:"#64748b" }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:16, padding:20 }}>
        <div style={{ fontSize:11, color:"#64748b", marginBottom:14 }}>POINT COMPARISON</div>
        {leaderboard.map((u,i) => (
          <div key={u.id} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, color:colorFor(i), fontWeight:700 }}>{u.name}</span>
              <span style={{ fontSize:12, color:"#94a3b8" }}>{(u.points??0).toLocaleString()}</span>
            </div>
            <MiniBar value={u.points??0} max={maxPts} color={colorFor(i)}/>
          </div>
        ))}
      </div>

      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:16, padding:20 }}>
        <div style={{ fontSize:11, color:"#64748b", marginBottom:14 }}>🔥 STREAK RANKINGS</div>
        {leaderboard.slice().sort((a,b) => (b.current_streak??0)-(a.current_streak??0)).map((u,i) => {
          const color = colorFor(leaderboard.findIndex(x=>x.id===u.id));
          return (
            <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
              borderBottom: i<leaderboard.length-1 ? "1px solid #1e293b" : "none" }}>
              <Avatar name={u.name} avatarUrl={u.avatar_url} color={color} size={34}/>
              <div style={{ flex:1, fontWeight:700, color, fontSize:14 }}>{u.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                {[...Array(Math.min(u.current_streak??0,5))].map((_,fi) => (
                  <span key={fi} style={{ fontSize:13, filter:"drop-shadow(0 0 4px #f97316)" }}>🔥</span>
                ))}
                <span style={{ fontWeight:700, color:"#f97316", fontSize:14, marginLeft:4 }}>
                  {u.current_streak??0}d
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Feed Tab ──────────────────────────────────────────────────────────────────
function FeedTab({ feed, leaderboard, heatmaps }) {
  function timeAgo(ts) {
    const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m/60)}h ago`;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", border:"1px solid #1e293b", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e293b", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <span style={{ fontWeight:700, fontSize:15 }}>ACTIVITY FEED</span>
        </div>
        {feed.length === 0 && (
          <div style={{ padding:"20px", color:"#475569", fontSize:13, textAlign:"center" }}>
            No activity yet — start solving! 🚀
          </div>
        )}
        {feed.map((item,i) => {
          const idx = leaderboard.findIndex(u=>u.id===item.user_id);
          const color = colorFor(idx);
          return (
            <div key={item.id} style={{ display:"flex", gap:12, padding:"12px 20px",
              borderBottom: i<feed.length-1 ? "1px solid #0f172a" : "none" }}>
              <Avatar name={item.user_name} avatarUrl={item.users?.avatar_url} color={color} size={34}/>
              <div style={{ flex:1 }}>
                <span style={{ color, fontWeight:700, fontSize:12 }}>{item.user_name}</span>
                <span style={{ color:"#94a3b8", fontSize:12 }}> {item.message}</span>
                <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{timeAgo(item.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.map((u,i) => (
        <div key={u.id} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)",
          border:`1px solid ${colorFor(i)}22`, borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14 }}>
            <Avatar name={u.name} avatarUrl={u.avatar_url} color={colorFor(i)} size={30}/>
            <span style={{ fontWeight:700, color:colorFor(i), fontSize:14 }}>{u.name}'s Activity</span>
          </div>
          <Heatmap data={heatmaps[u.id]}/>
          <div style={{ marginTop:10, display:"flex", gap:16 }}>
            <span style={{ fontSize:10, color:"#64748b" }}>Total: <span style={{ color:colorFor(i) }}>{u.total_solved??0}</span></span>
            <span style={{ fontSize:10, color:"#64748b" }}>Best streak: <span style={{ color:colorFor(i) }}>{u.longest_streak??0}d</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [isSetup, setIsSetup] = useState(null); // null = loading, true/false
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const { leaderboard, summary, feed, heatmaps, weeklies,
          syncing, error, loading, triggerSync } = useData();

  // Check if users already exist
  useEffect(() => {
    api.getUsers()
      .then(users => setIsSetup(users.length > 0))
      .catch(() => setIsSetup(false));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSync() {
    await triggerSync();
    showToast("✅ Sync triggered! Data will update shortly.");
  }

  if (isSetup === null) return (
    <div style={{ minHeight:"100vh", background:"#020617", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#64748b", fontFamily:"monospace" }}>⚔️ Loading AlgoArena...</div>
    </div>
  );

  if (isSetup === false) return <Setup onComplete={() => setIsSetup(true)}/>;

  const tabs = [
    { id:"dashboard",   icon:"📊" },
    { id:"leaderboard", icon:"🏆" },
    { id:"feed",        icon:"⚡" },
  ];

  const leader = leaderboard[0];

  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"#f1f5f9", fontFamily:"'Space Mono',monospace,monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0f172a; }
        ::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #06b6d422} 50%{box-shadow:0 0 40px #06b6d466} }
      `}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse at 15% 10%,#06b6d412,transparent 50%),radial-gradient(ellipse at 85% 90%,#a78bfa12,transparent 50%)" }}/>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999,
          background:"linear-gradient(135deg,#0f172a,#1e293b)",
          border:"1px solid #06b6d444", borderRadius:12, padding:"12px 18px",
          fontSize:13, boxShadow:"0 0 30px #06b6d433",
          animation:"slideDown 0.3s ease", maxWidth:280 }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:100,
        background:"rgba(2,6,23,0.9)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid #1e293b" }}>
        <div style={{ maxWidth:768, margin:"0 auto", padding:"0 16px",
          display:"flex", alignItems:"center", height:56, gap:10 }}>
          <span style={{ fontSize:22 }}>⚔️</span>
          <span style={{ fontWeight:700, fontSize:18, letterSpacing:1,
            background:"linear-gradient(90deg,#06b6d4,#a78bfa)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AlgoArena</span>

          <div style={{ display:"flex", gap:2, marginLeft:"auto",
            background:"#0f172a", borderRadius:10, padding:3 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} title={t.id} style={{
                background: tab===t.id ? "#1e293b" : "transparent",
                border:"none", color: tab===t.id ? "#f1f5f9" : "#64748b",
                padding:"6px 10px", borderRadius:8, cursor:"pointer",
                fontSize:16, transition:"all 0.2s",
              }}>{t.icon}</button>
            ))}
          </div>

          <button onClick={handleSync} style={{
            background: syncing ? "#1e293b" : "linear-gradient(135deg,#06b6d4,#0891b2)",
            border:"none", color:"#fff", padding:"6px 14px",
            borderRadius:8, cursor: syncing ? "not-allowed" : "pointer",
            fontSize:11, fontWeight:700, transition:"all 0.2s",
          }}>
            {syncing
              ? <span style={{ animation:"pulse 1s infinite", display:"inline-block" }}>⟳ Syncing</span>
              : "↻ Sync"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:768, margin:"0 auto", padding:"20px 16px 60px" }}>
        {error && (
          <div style={{ background:"#ef444411", border:"1px solid #ef444433",
            borderRadius:12, padding:"12px 16px", color:"#ef4444", fontSize:12, marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? <Spinner/> : (
          <>
            {tab === "dashboard" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Summary */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { l:"All Solved", v:summary?.totalSolvedAll??0, icon:"💡", c:"#06b6d4" },
                    { l:"Today",      v:summary?.todaySolvedAll??0, icon:"🚀", c:"#f97316" },
                    { l:"Top Streak", v:`${summary?.topStreak??0}d`, icon:"🔥", c:"#a78bfa" },
                  ].map(s => (
                    <div key={s.l} style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)",
                      border:`1px solid ${s.c}22`, borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:22, marginBottom:5 }}>{s.icon}</div>
                      <div style={{ fontWeight:700, fontSize:22, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:10, color:"#64748b", marginTop:3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Leader banner */}
                {leader && (
                  <div style={{ background:`linear-gradient(135deg,${colorFor(0)}22,${colorFor(0)}08)`,
                    border:`1px solid ${colorFor(0)}44`, borderRadius:16, padding:"16px 20px",
                    display:"flex", gap:12, alignItems:"center", animation:"glow 3s infinite" }}>
                    <span style={{ fontSize:30 }}>👑</span>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>TODAY'S LEADER</div>
                      <div style={{ fontWeight:700, fontSize:18, color:colorFor(0) }}>{leader.name}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>
                        {(leader.points??0).toLocaleString()} pts · {leader.today_solved??0} solved today
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards */}
                {leaderboard.map((u,i) => (
                  <UserCard
                    key={u.id} user={u} color={colorFor(i)} rank={i+1}
                    heatmap={heatmaps[u.id]} weekly={weeklies[u.id]}
                    expanded={expanded===u.id}
                    onToggle={() => setExpanded(expanded===u.id ? null : u.id)}
                  />
                ))}
              </div>
            )}

            {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard}/>}
            {tab === "feed" && <FeedTab feed={feed} leaderboard={leaderboard} heatmaps={heatmaps}/>}
          </>
        )}
      </div>
    </div>
  );
}
