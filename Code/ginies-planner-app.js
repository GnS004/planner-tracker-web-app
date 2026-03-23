import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// ── YOUR FIREBASE CONFIG ──────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDGjR8XuYGTWfJlQKGgBiSatiRAIpASPwY",
  authDomain: "gs-personal-c4b76.firebaseapp.com",
  projectId: "gs-personal-c4b76",
  storageBucket: "gs-personal-c4b76.firebasestorage.app",
  messagingSenderId: "759457873775",
  appId: "1:759457873775:web:8283231cd331676483329a"
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let docRef      = null;

// ── QUOTES ───────────────────────────────────────────
const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Small daily improvements lead to staggering long-term results.",
  "You don't have to be great to start, but you have to start to be great.",
  "What you do every day matters more than what you do once in a while.",
  "Every day is a chance to be better than yesterday.",
  "Focus on progress, not perfection.",
  "Build the life you want, one habit at a time.",
  "The only way to do great work is to love what you do. — Jobs"
];

const DEFAULT_DATA = {
  habits:[
    {id:1,name:"Morning Meditation",emoji:"🧘",streak:5,days:[1,1,1,1,1,0,0]},
    {id:2,name:"Read 20 Minutes",emoji:"📚",streak:12,days:[1,1,1,0,1,1,0]},
    {id:3,name:"Exercise",emoji:"💪",streak:3,days:[1,0,1,1,0,0,0]},
    {id:4,name:"No Social Media 9-12",emoji:"📵",streak:2,days:[1,1,0,1,0,0,0]}
  ],
  tasks:[
    {id:1,text:"Complete project proposal",priority:"high",done:false,due:"2025-09-15"},
    {id:2,text:"Call Mom",priority:"medium",done:false,due:""},
    {id:3,text:"Buy groceries",priority:"low",done:true,due:""},
    {id:4,text:"Review quarterly goals",priority:"high",done:false,due:""},
    {id:5,text:"Send invoice to client",priority:"medium",done:false,due:""}
  ],
  journal:[
    {id:1,date:"2025-08-30",mood:4,emoji:"🙂",text:"Had a productive day. Finished the design work and went for a run.",tags:["Productive","Happy"]}
  ],
  goals:[
    {id:1,title:"Run a 5K",category:"health",target:5,current:3.2,unit:"km",deadline:"2025-12-31"},
    {id:2,title:"Save ₹1,00,000",category:"finance",target:100000,current:42000,unit:"₹",deadline:"2025-12-31"},
    {id:3,title:"Read 24 books",category:"personal",target:24,current:11,unit:"books",deadline:"2025-12-31"},
    {id:4,title:"Get a promotion",category:"career",target:10,current:6,unit:"steps",deadline:"2025-12-31"}
  ],
  events:[
    {id:1,name:"Doctor Appointment",date:"2025-09-10",time:"10:00"},
    {id:2,name:"Team Lunch",date:"2025-09-12",time:"13:00"},
    {id:3,name:"Yoga Class",date:"2025-09-08",time:"07:00"},
    {id:4,name:"Birthday: Rahul",date:"2025-09-15",time:""}
  ],
  notes:[
    {id:1,title:"2025 Life Themes",body:"This year is about depth over breadth. Focus on fewer things but do them with full intention.",updated:"2025-08-28"},
    {id:2,title:"Book Notes: Atomic Habits",body:"The 1% rule. Systems over goals. Identity-based habits. Make it obvious, attractive, easy, satisfying.",updated:"2025-08-20"},
    {id:3,title:"Morning Routine",body:"6:00 Wake\n6:10 Meditate\n6:25 Journal\n6:40 Exercise\n7:20 Shower\n8:00 Deep work",updated:"2025-08-15"}
  ],
  transactions:[
    {id:1,name:"Salary",amount:55000,type:"income",cat:"💼",date:"2025-09-01"},
    {id:2,name:"Groceries",amount:-3200,type:"expense",cat:"🛒",date:"2025-09-02"},
    {id:3,name:"Netflix",amount:-649,type:"expense",cat:"📺",date:"2025-09-03"},
    {id:4,name:"Freelance",amount:12000,type:"income",cat:"💻",date:"2025-09-04"},
    {id:5,name:"Electricity",amount:-1800,type:"expense",cat:"⚡",date:"2025-09-05"}
  ],
  books:[
    {id:1,title:"Atomic Habits",author:"James Clear",status:"done",emoji:"🧠"},
    {id:2,title:"Deep Work",author:"Cal Newport",status:"reading",emoji:"💡"},
    {id:3,title:"Almanack of Naval",author:"Eric Jorgenson",status:"want",emoji:"🚀"},
    {id:4,title:"Sapiens",author:"Yuval Noah Harari",status:"done",emoji:"🌍"}
  ],
  gratitude:[
    {id:1,date:"2025-08-30",items:["The morning quiet and chai","My supportive family","A peaceful afternoon"]}
  ],
  water:3, focusMin:0, sessions:0,
  moodEmoji:"", moodWeek:[3,4,5,4,3,0,0],
  calY:new Date().getFullYear(), calM:new Date().getMonth(),
  steps:6240, calories:1840, sleepH:7.5, sleepQ:"Good"
};

// ── STATE ─────────────────────────────────────────────
let S = JSON.parse(JSON.stringify(DEFAULT_DATA));
let saveTimer = null;
let isSaving = false;

// ── SYNC UI ───────────────────────────────────────────
function syncUI(state){
  const bar = document.getElementById("sync-bar");
  const dot = document.getElementById("sync-dot");
  const txt = document.getElementById("sync-txt");
  const status = document.getElementById("sync-status");
  status.classList.add("show");
  if(state==="saving"){
    bar.className="syncing"; dot.className="spinning"; txt.textContent="Saving...";
  } else if(state==="saved"){
    bar.className="saved"; dot.className="green"; txt.textContent="Saved ✓";
    setTimeout(()=>{ bar.className=""; status.classList.remove("show"); },2000);
  } else if(state==="error"){
    bar.className="error"; dot.className="red"; txt.textContent="Sync error";
  } else if(state==="live"){
    dot.className="green"; txt.textContent="Live sync ✓";
    setTimeout(()=>status.classList.remove("show"),2000);
  }
}

// ── SAVE TO FIREBASE ──────────────────────────────────
async function save(){
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async()=>{
    syncUI("saving");
    try {
      await setDoc(docRef, S);
      syncUI("saved");
    } catch(e){
      console.error("Save error:",e);
      syncUI("error");
      // fallback to localStorage
      try{ localStorage.setItem("Ginie's Planner_backup", JSON.stringify(S)); }catch(_){}
    }
  }, 600); // debounce 600ms
}

// ── DATE HELPERS ──────────────────────────────────────
const NOW = new Date();
const TODAY_DOW = (NOW.getDay()+6)%7;
const TODAY_STR = NOW.toISOString().split("T")[0];

document.getElementById("pg-date").textContent =
  NOW.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

// ── NAVIGATION ────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:"Dashboard",habits:"Habit Tracker",tasks:"Tasks & Todos",
  journal:"Journal & Mood",focus:"Focus Timer",goals:"Goals & Vision",
  calendar:"Life Calendar",notes:"Notes",health:"Health & Fitness",
  finance:"Finance Tracker",reading:"Reading List",gratitude:"Gratitude Log"
};

function goTo(p){
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("on"));
  document.querySelector(`.nav-item[data-p="${p}"]`).classList.add("on");
  document.querySelectorAll(".page").forEach(pg=>pg.classList.remove("on"));
  document.getElementById("pg-"+p).classList.add("on");
  document.getElementById("pg-title").textContent = PAGE_TITLES[p];
  render[p] && render[p]();
  if(window.innerWidth<=720) document.getElementById("sidebar").classList.remove("open");
}

document.getElementById("nav").addEventListener("click",e=>{
  const item=e.target.closest(".nav-item");
  if(item&&item.dataset.p) goTo(item.dataset.p);
});
document.getElementById("hambtn").addEventListener("click",()=>{
  document.getElementById("sidebar").classList.toggle("open");
});

// ── MODAL ─────────────────────────────────────────────
let modalCb = null;
const overlay = document.getElementById("overlay");

function openModal(title,html,onSave){
  document.getElementById("modal-title").textContent=title;
  document.getElementById("modal-body").innerHTML=html;
  modalCb=onSave;
  overlay.classList.add("on");
  const f=document.getElementById("modal-body").querySelector("input,textarea,select");
  if(f) setTimeout(()=>f.focus(),80);
}
function closeModal(){ overlay.classList.remove("on"); modalCb=null; }
document.getElementById("modal-cancel").addEventListener("click",closeModal);
overlay.addEventListener("click",e=>{ if(e.target===overlay) closeModal(); });
document.getElementById("modal-save").addEventListener("click",()=>{ if(modalCb) modalCb(); });

// ── EXPORT ────────────────────────────────────────────
document.getElementById("export-btn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="Ginie's Planner-backup.json"; a.click();
});

// ── ADD BUTTON ────────────────────────────────────────
const addActions={
  dashboard:()=>openHabitModal(), habits:()=>openHabitModal(),
  tasks:()=>openTaskModal(), journal:()=>document.getElementById("j-input").focus(),
  goals:()=>openGoalModal(), calendar:()=>openEvModal(),
  notes:()=>openNoteModal(), health:()=>document.getElementById("steps-input").focus(),
  finance:()=>openTxModal(), reading:()=>openBookModal(),
  gratitude:()=>document.querySelectorAll(".gi")[0].focus()
};
document.getElementById("add-btn").addEventListener("click",()=>{
  const cur=document.querySelector(".nav-item.on").dataset.p;
  if(addActions[cur]) addActions[cur]();
});

// ── HELPERS ───────────────────────────────────────────
const render={};
function pct(c,t){ return Math.min(100,Math.round(c/t*100)); }
function fmt(n){ return Math.abs(n).toLocaleString("en-IN"); }
function emptyMsg(m){ return `<div style="color:var(--text3);text-align:center;padding:24px;font-size:14px;">${m}</div>`; }
function colorBar(v,max,color){
  return `<div style="flex:1;height:7px;background:var(--bg4);border-radius:4px;overflow:hidden;">
    <div style="height:100%;background:${color};border-radius:4px;width:${pct(v,max)}%;transition:width .5s;"></div></div>`;
}

// ── DASHBOARD ─────────────────────────────────────────
render.dashboard=function(){
  document.getElementById("dq").textContent="\u201c"+QUOTES[NOW.getDate()%QUOTES.length]+"\u201d";
  const done=S.tasks.filter(t=>t.done).length;
  document.getElementById("ds-tasks").textContent=done+"/"+S.tasks.length;
  document.getElementById("ds-streak").textContent=(S.habits.length?Math.max(...S.habits.map(h=>h.streak)):0)+"🔥";
  document.getElementById("ds-focus").textContent=S.focusMin+"m";
  document.getElementById("ds-mood").textContent=S.moodEmoji||"—";

  document.getElementById("dh-list").innerHTML=S.habits.slice(0,4).map(h=>`
    <div class="h-row">
      <span style="font-size:17px;">${h.emoji}</span>
      <span class="h-name" style="font-size:13px;">${h.name}</span>
      <div class="hdot ${h.days[TODAY_DOW]?"done":""} cur" data-dhid="${h.id}">
        ${h.days[TODAY_DOW]?"✓":""}
      </div>
    </div>`).join("")||emptyMsg("Add habits");

  document.getElementById("dt-list").innerHTML=S.tasks.filter(t=>!t.done).slice(0,4).map(t=>`
    <div class="t-item">
      <div class="t-chk ${t.done?"done":""}" data-tid="${t.id}">${t.done?"✓":""}</div>
      <span class="t-txt" style="font-size:13px;">${t.text}</span>
      <span class="pbadge p${t.priority==="high"?"h":t.priority==="medium"?"m":"l"}">${t.priority}</span>
    </div>`).join("")||emptyMsg("All done 🎉");

  const emojis=["😢","😕","😐","🙂","😄"];
  document.getElementById("mchart").innerHTML=S.moodWeek.map((v,i)=>`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <span style="font-size:13px;">${v?emojis[v-1]:""}</span>
      <div class="mbar ${i===TODAY_DOW?"today-bar":""}" style="height:${v?v*9+4:4}px;"></div>
    </div>`).join("");

  const g=S.goals[0];
  document.getElementById("d-goal").innerHTML=g?`
    <div style="font-size:14px;font-weight:500;margin-bottom:6px;">${g.title}</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:6px;">${g.current} / ${g.target} ${g.unit}</div>
    <div class="pbar"><div class="pfill" style="background:var(--accent);width:${pct(g.current,g.target)}%"></div></div>
    <div style="font-size:11px;color:var(--accent2);margin-top:5px;">${pct(g.current,g.target)}% complete</div>`:emptyMsg("No goals yet");

  document.querySelectorAll(".hdot[data-dhid]").forEach(el=>{
    el.onclick=()=>{ toggleHabitDay(+el.dataset.dhid,TODAY_DOW); render.dashboard(); };
  });
  document.querySelectorAll(".t-chk[data-tid]").forEach(el=>{
    el.onclick=()=>{ const t=S.tasks.find(x=>x.id===+el.dataset.tid); if(t){ t.done=!t.done; save(); render.dashboard(); } };
  });
};

// ── HABITS ────────────────────────────────────────────
render.habits=function(){
  const dt=S.habits.filter(h=>h.days[TODAY_DOW]).length;
  const p=S.habits.length?pct(dt,S.habits.length):0;
  document.getElementById("h-pct").textContent=p+"%";
  document.getElementById("h-bar").style.width=p+"%";
  document.getElementById("h-best").textContent=(S.habits.length?Math.max(...S.habits.map(h=>h.streak)):0)+" days";
  const hl=document.getElementById("habit-list");
  hl.innerHTML=S.habits.map(h=>`
    <div class="h-row">
      <span style="font-size:17px;">${h.emoji}</span>
      <span class="h-name">${h.name}</span>
      <span class="h-streak">${h.streak}🔥</span>
      <div class="h-dots">
        ${h.days.map((d,i)=>`
          <div class="hdot ${d?"done":""} ${i===TODAY_DOW?"cur":""}" data-hid="${h.id}" data-day="${i}">
            ${d?"✓":["M","T","W","T","F","S","S"][i]}
          </div>`).join("")}
      </div>
      <button class="del-btn" data-hdel="${h.id}">×</button>
    </div>`).join("")||emptyMsg("No habits yet — click + New Habit");
  hl.querySelectorAll(".hdot[data-hid]").forEach(el=>{
    el.onclick=()=>toggleHabitDay(+el.dataset.hid,+el.dataset.day);
  });
  hl.querySelectorAll(".del-btn[data-hdel]").forEach(el=>{
    el.onclick=()=>{ if(confirm("Delete habit?")){ S.habits=S.habits.filter(h=>h.id!==+el.dataset.hdel); save(); render.habits(); } };
  });
};

function toggleHabitDay(id,day){
  const h=S.habits.find(h=>h.id===id); if(!h) return;
  h.days[day]=h.days[day]?0:1; h.streak=h.days.filter(Boolean).length;
  save(); render.habits();
}

function openHabitModal(){
  openModal("New Habit",`
    <div class="fg"><label class="fl">Habit Name</label><input id="m-hname" placeholder="e.g. Morning run"></div>
    <div class="fg"><label class="fl">Emoji</label><input id="m-hemoji" placeholder="e.g. 🏃" style="width:90px;"></div>`,
  ()=>{
    const name=document.getElementById("m-hname").value.trim();
    if(!name){ alert("Please enter a habit name."); return; }
    S.habits.push({id:Date.now(),name,emoji:document.getElementById("m-hemoji").value.trim()||"✅",streak:0,days:[0,0,0,0,0,0,0]});
    save(); closeModal(); render.habits(); render.dashboard();
  });
}
document.getElementById("new-habit-btn").addEventListener("click",openHabitModal);

// ── TASKS ─────────────────────────────────────────────
let taskFilter="all";
render.tasks=function(){
  let list=S.tasks;
  if(taskFilter==="high") list=list.filter(t=>t.priority==="high"&&!t.done);
  else if(taskFilter==="medium") list=list.filter(t=>t.priority==="medium"&&!t.done);
  else if(taskFilter==="low") list=list.filter(t=>t.priority==="low"&&!t.done);
  else if(taskFilter==="done") list=list.filter(t=>t.done);
  document.getElementById("t-pend").textContent=S.tasks.filter(t=>!t.done).length;
  document.getElementById("t-comp").textContent=S.tasks.filter(t=>t.done).length;
  document.getElementById("t-tot").textContent=S.tasks.length;
  const tl=document.getElementById("task-list");
  tl.innerHTML=list.map(t=>`
    <div class="t-item">
      <div class="t-chk ${t.done?"done":""}" data-tid="${t.id}">${t.done?"✓":""}</div>
      <div style="flex:1;">
        <div class="t-txt ${t.done?"done":""}">${t.text}</div>
        ${t.due?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">Due: ${t.due}</div>`:""}
      </div>
      <span class="pbadge p${t.priority==="high"?"h":t.priority==="medium"?"m":"l"}">${t.priority}</span>
      <button class="del-btn" data-tdel="${t.id}">×</button>
    </div>`).join("")||emptyMsg("No tasks here");
  tl.querySelectorAll(".t-chk[data-tid]").forEach(el=>{
    el.onclick=()=>{ const t=S.tasks.find(x=>x.id===+el.dataset.tid); if(t){ t.done=!t.done; save(); render.tasks(); render.dashboard(); } };
  });
  tl.querySelectorAll(".del-btn[data-tdel]").forEach(el=>{
    el.onclick=()=>{ S.tasks=S.tasks.filter(t=>t.id!==+el.dataset.tdel); save(); render.tasks(); render.dashboard(); };
  });
};
document.querySelectorAll("[data-tf]").forEach(chip=>{
  chip.addEventListener("click",()=>{
    document.querySelectorAll("[data-tf]").forEach(c=>c.classList.remove("on"));
    chip.classList.add("on"); taskFilter=chip.dataset.tf; render.tasks();
  });
});
function openTaskModal(){
  openModal("New Task",`
    <div class="fg"><label class="fl">Task</label><input id="m-txt" placeholder="What needs to be done?"></div>
    <div class="fg"><label class="fl">Priority</label>
      <select id="m-pri"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
    </div>
    <div class="fg"><label class="fl">Due Date (optional)</label><input type="date" id="m-due"></div>`,
  ()=>{
    const text=document.getElementById("m-txt").value.trim();
    if(!text){ alert("Please enter a task."); return; }
    S.tasks.unshift({id:Date.now(),text,priority:document.getElementById("m-pri").value,done:false,due:document.getElementById("m-due").value||""});
    save(); closeModal(); render.tasks(); render.dashboard();
  });
}
document.getElementById("new-task-btn").addEventListener("click",openTaskModal);

// ── JOURNAL ───────────────────────────────────────────
let selMood=null, selMoodEmoji="";
render.journal=function(){
  document.querySelectorAll(".moodbtn").forEach(b=>{
    b.classList.remove("on");
    if(S.moodEmoji&&+b.dataset.m===S.moodWeek[TODAY_DOW]){ b.classList.add("on"); selMood=S.moodWeek[TODAY_DOW]; selMoodEmoji=S.moodEmoji; }
  });
  const je=document.getElementById("j-entries");
  je.innerHTML=S.journal.map(j=>`
    <div class="j-entry">
      <div class="j-date">${j.date} ${j.emoji||""}</div>
      <div class="j-txt">${j.text}</div>
      ${j.tags&&j.tags.length?`<div style="margin-top:8px;">${j.tags.map(t=>`<span class="chip" style="font-size:11px;cursor:default;">${t}</span>`).join("")}</div>`:""}
      <div style="text-align:right;margin-top:8px;"><button class="del-btn" data-jdel="${j.id}">× delete</button></div>
    </div>`).join("")||emptyMsg("No entries yet");
  je.querySelectorAll(".del-btn[data-jdel]").forEach(el=>{
    el.onclick=()=>{ if(confirm("Delete entry?")){ S.journal=S.journal.filter(j=>j.id!==+el.dataset.jdel); save(); render.journal(); } };
  });
};
document.getElementById("mood-bar").addEventListener("click",e=>{
  const btn=e.target.closest(".moodbtn"); if(!btn) return;
  document.querySelectorAll(".moodbtn").forEach(b=>b.classList.remove("on"));
  btn.classList.add("on"); selMood=+btn.dataset.m; selMoodEmoji=btn.textContent;
  S.moodWeek[TODAY_DOW]=selMood; S.moodEmoji=selMoodEmoji; save();
});
document.querySelectorAll("[data-tag]").forEach(c=>c.addEventListener("click",()=>c.classList.toggle("on")));
document.getElementById("save-journal-btn").addEventListener("click",()=>{
  const text=document.getElementById("j-input").value.trim();
  if(!text){ alert("Write something first."); return; }
  const tags=[...document.querySelectorAll("[data-tag].on")].map(c=>c.dataset.tag);
  S.journal.unshift({id:Date.now(),date:TODAY_STR,mood:selMood,emoji:selMoodEmoji,text,tags});
  document.getElementById("j-input").value="";
  document.querySelectorAll("[data-tag]").forEach(c=>c.classList.remove("on"));
  save(); render.journal();
});

// ── FOCUS TIMER ───────────────────────────────────────
let tSec=25*60,tTotal=25*60,tRunning=false,tInterval=null,tMode="FOCUS";
function updateTimerDisplay(){
  document.getElementById("t-disp").textContent=String(Math.floor(tSec/60)).padStart(2,"0")+":"+String(tSec%60).padStart(2,"0");
  document.getElementById("tring").setAttribute("stroke-dashoffset",(2*Math.PI*80*(tSec/tTotal)).toFixed(2));
}
document.getElementById("t-toggle").addEventListener("click",()=>{
  if(tRunning){
    clearInterval(tInterval); tRunning=false; document.getElementById("t-toggle").textContent="Resume";
  } else {
    tRunning=true; document.getElementById("t-toggle").textContent="Pause";
    tInterval=setInterval(()=>{
      if(tSec<=0){
        clearInterval(tInterval); tRunning=false; document.getElementById("t-toggle").textContent="Start";
        if(tMode==="FOCUS"){
          S.focusMin+=Math.round(tTotal/60); S.sessions++;
          const task=document.getElementById("f-task").value||"Deep work";
          const item=document.createElement("div"); item.className="flog-item";
          item.textContent="✓ "+Math.round(tTotal/60)+"min — "+task;
          document.getElementById("f-log").prepend(item);
          document.getElementById("f-total").textContent=S.focusMin+" min";
          document.getElementById("f-sess").textContent=S.sessions;
          save();
        }
        alert(tMode==="FOCUS"?"Session complete 🎉 Take a break!":"Break over! Time to focus 💪");
      } else { tSec--; updateTimerDisplay(); }
    },1000);
  }
});
document.getElementById("t-reset").addEventListener("click",()=>{ clearInterval(tInterval); tRunning=false; tSec=tTotal; document.getElementById("t-toggle").textContent="Start"; updateTimerDisplay(); });
document.getElementById("t-skip").addEventListener("click",()=>{ clearInterval(tInterval); tRunning=false; tSec=0; updateTimerDisplay(); });
document.querySelectorAll("[data-tm]").forEach(chip=>{
  chip.addEventListener("click",()=>{
    document.querySelectorAll("[data-tm]").forEach(c=>c.classList.remove("on")); chip.classList.add("on");
    clearInterval(tInterval); tRunning=false;
    tTotal=+chip.dataset.tm*60; tSec=tTotal;
    tMode=+chip.dataset.tm===25?"FOCUS":+chip.dataset.tm===5?"SHORT BREAK":"LONG BREAK";
    document.getElementById("t-lbl").textContent=tMode; document.getElementById("t-toggle").textContent="Start";
    updateTimerDisplay();
  });
});
render.focus=function(){ document.getElementById("f-total").textContent=S.focusMin+" min"; document.getElementById("f-sess").textContent=S.sessions; updateTimerDisplay(); };

// ── GOALS ─────────────────────────────────────────────
let goalFilter="all";
render.goals=function(){
  const list=goalFilter==="all"?S.goals:S.goals.filter(g=>g.category===goalFilter);
  const gl=document.getElementById("goal-list");
  gl.innerHTML=list.map(g=>{
    const p=pct(g.current,g.target);
    return `<div class="g-item">
      <div class="g-hdr">
        <span class="g-title">${g.title}</span>
        <span class="gcat gc-${g.category}">${g.category}</span>
        <span class="g-pct">${p}%</span>
        <button class="del-btn" data-gdel="${g.id}">×</button>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:7px;">${g.current} / ${g.target} ${g.unit}${g.deadline?" · due "+g.deadline:""}</div>
      <div class="pbar"><div class="pfill" style="background:var(--accent);width:${p}%"></div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
        <input type="number" data-gupd="${g.id}" value="${g.current}" style="max-width:160px;">
        <button class="btn btn-g btn-sm" data-gbtn="${g.id}">Update</button>
      </div>
    </div>`;
  }).join("")||emptyMsg("No goals yet");
  gl.querySelectorAll(".del-btn[data-gdel]").forEach(el=>{
    el.onclick=()=>{ if(confirm("Delete goal?")){ S.goals=S.goals.filter(g=>g.id!==+el.dataset.gdel); save(); render.goals(); render.dashboard(); } };
  });
  gl.querySelectorAll("[data-gbtn]").forEach(el=>{
    el.onclick=()=>{
      const inp=gl.querySelector(`[data-gupd="${el.dataset.gbtn}"]`);
      const val=parseFloat(inp.value); if(isNaN(val)){ alert("Enter a valid number."); return; }
      const g=S.goals.find(g=>g.id===+el.dataset.gbtn); if(g){ g.current=val; save(); render.goals(); render.dashboard(); }
    };
  });
};
document.querySelectorAll("[data-gf]").forEach(chip=>{
  chip.addEventListener("click",()=>{
    document.querySelectorAll("[data-gf]").forEach(c=>c.classList.remove("on")); chip.classList.add("on"); goalFilter=chip.dataset.gf; render.goals();
  });
});
function openGoalModal(){
  openModal("New Goal",`
    <div class="fg"><label class="fl">Goal Title</label><input id="m-gtitle" placeholder="e.g. Run a marathon"></div>
    <div class="fg"><label class="fl">Category</label>
      <select id="m-gcat"><option value="health">Health</option><option value="career">Career</option><option value="finance">Finance</option><option value="personal">Personal</option></select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div class="fg"><label class="fl">Target</label><input type="number" id="m-gtgt" placeholder="100"></div>
      <div class="fg"><label class="fl">Unit</label><input id="m-gunit" placeholder="km, ₹, books..."></div>
    </div>
    <div class="fg"><label class="fl">Deadline (optional)</label><input type="date" id="m-gdead"></div>`,
  ()=>{
    const title=document.getElementById("m-gtitle").value.trim();
    const tgt=parseFloat(document.getElementById("m-gtgt").value);
    if(!title){ alert("Enter a goal title."); return; }
    if(!tgt||tgt<=0){ alert("Enter a valid target."); return; }
    S.goals.push({id:Date.now(),title,category:document.getElementById("m-gcat").value,target:tgt,current:0,unit:document.getElementById("m-gunit").value||"",deadline:document.getElementById("m-gdead").value||""});
    save(); closeModal(); render.goals(); render.dashboard();
  });
}
document.getElementById("new-goal-btn").addEventListener("click",openGoalModal);

// ── CALENDAR ──────────────────────────────────────────
render.calendar=function(){
  const y=S.calY,m=S.calM;
  document.getElementById("cal-label").textContent=new Date(y,m,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const firstDow=(new Date(y,m,1).getDay()+6)%7;
  const dim=new Date(y,m+1,0).getDate();
  let html=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>`<div class="ch">${d}</div>`).join("");
  for(let i=0;i<firstDow;i++) html+=`<div class="cd dim"></div>`;
  for(let d=1;d<=dim;d++){
    const isToday=(d===NOW.getDate()&&m===NOW.getMonth()&&y===NOW.getFullYear());
    const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const hasEv=S.events.some(e=>e.date===ds);
    html+=`<div class="cd ${isToday?"today":""} ${hasEv?"has-ev":""}" data-cd="${ds}">${d}</div>`;
  }
  document.getElementById("cal-grid").innerHTML=html;
  document.querySelectorAll(".cd[data-cd]").forEach(el=>{
    el.addEventListener("click",()=>{
      const evs=S.events.filter(e=>e.date===el.dataset.cd);
      if(evs.length) alert(evs.map(e=>e.name+(e.time?" @ "+e.time:"")).join("\n"));
    });
  });
  const evl=document.getElementById("ev-list");
  evl.innerHTML=[...S.events].sort((a,b)=>a.date>b.date?1:-1).map(e=>`
    <div class="ev-item">
      <span class="ev-time">${e.time||"All day"}</span>
      <div style="flex:1;"><div style="font-size:13px;">${e.name}</div><div style="font-size:11px;color:var(--text3);">${e.date}</div></div>
      <button class="del-btn" data-edel="${e.id}">×</button>
    </div>`).join("")||emptyMsg("No events yet");
  evl.querySelectorAll(".del-btn[data-edel]").forEach(el=>{
    el.onclick=()=>{ S.events=S.events.filter(e=>e.id!==+el.dataset.edel); save(); render.calendar(); };
  });
};
document.getElementById("cal-prev").addEventListener("click",()=>{ if(S.calM===0){S.calM=11;S.calY--;}else S.calM--; save(); render.calendar(); });
document.getElementById("cal-next").addEventListener("click",()=>{ if(S.calM===11){S.calM=0;S.calY++;}else S.calM++; save(); render.calendar(); });
function openEvModal(){
  openModal("Add Event",`
    <div class="fg"><label class="fl">Event Name</label><input id="m-evname" placeholder="e.g. Team meeting"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div class="fg"><label class="fl">Date</label><input type="date" id="m-evdate"></div>
      <div class="fg"><label class="fl">Time (optional)</label><input type="time" id="m-evtime"></div>
    </div>`,
  ()=>{
    const name=document.getElementById("m-evname").value.trim();
    const date=document.getElementById("m-evdate").value;
    if(!name){ alert("Enter an event name."); return; }
    if(!date){ alert("Select a date."); return; }
    S.events.push({id:Date.now(),name,date,time:document.getElementById("m-evtime").value||""});
    save(); closeModal(); render.calendar();
  });
}
document.getElementById("new-ev-btn").addEventListener("click",openEvModal);

// ── NOTES ─────────────────────────────────────────────
render.notes=function(){
  const ng=document.getElementById("notes-grid");
  ng.innerHTML=S.notes.map(n=>`
    <div class="note-card" data-nid="${n.id}">
      <div class="n-title">${n.title}</div>
      <div class="n-body">${n.body.replace(/\n/g," ")}</div>
      <div class="n-meta" style="display:flex;justify-content:space-between;align-items:center;">
        <span>${n.updated}</span>
        <button class="del-btn" data-ndel="${n.id}" style="font-size:15px;">×</button>
      </div>
    </div>`).join("")||emptyMsg("No notes yet");
  ng.querySelectorAll(".note-card[data-nid]").forEach(el=>{
    el.addEventListener("click",e=>{ if(e.target.closest(".del-btn")) return; const n=S.notes.find(n=>n.id===+el.dataset.nid); if(n) openEditNote(n); });
  });
  ng.querySelectorAll(".del-btn[data-ndel]").forEach(el=>{
    el.onclick=e=>{ e.stopPropagation(); if(confirm("Delete note?")){ S.notes=S.notes.filter(n=>n.id!==+el.dataset.ndel); save(); render.notes(); } };
  });
};
function openNoteModal(){
  openModal("New Note",`
    <div class="fg"><label class="fl">Title</label><input id="m-ntitle" placeholder="Note title"></div>
    <div class="fg"><label class="fl">Content</label><textarea id="m-nbody" style="min-height:130px;" placeholder="Write anything..."></textarea></div>`,
  ()=>{
    const title=document.getElementById("m-ntitle").value.trim();
    if(!title){ alert("Enter a title."); return; }
    S.notes.unshift({id:Date.now(),title,body:document.getElementById("m-nbody").value,updated:TODAY_STR});
    save(); closeModal(); render.notes();
  });
}
function openEditNote(n){
  openModal("Edit Note",`
    <div class="fg"><label class="fl">Title</label><input id="m-ntitle" value="${n.title.replace(/"/g,"&quot;")}"></div>
    <div class="fg"><label class="fl">Content</label><textarea id="m-nbody" style="min-height:130px;">${n.body}</textarea></div>`,
  ()=>{
    n.title=document.getElementById("m-ntitle").value.trim()||n.title;
    n.body=document.getElementById("m-nbody").value; n.updated=TODAY_STR;
    save(); closeModal(); render.notes();
  });
}
document.getElementById("new-note-btn").addEventListener("click",openNoteModal);

// ── HEALTH ────────────────────────────────────────────
render.health=function(){
  document.getElementById("hs-steps").textContent=S.steps.toLocaleString("en-IN");
  document.getElementById("hb-steps").style.width=Math.min(100,S.steps/10000*100)+"%";
  document.getElementById("hs-water").textContent=S.water+"/8";
  document.getElementById("hb-water").style.width=(S.water/8*100)+"%";
  document.getElementById("hs-sleep").textContent=S.sleepH+"h";
  document.getElementById("hs-sleep-q").textContent=S.sleepQ;
  document.getElementById("hs-cal").textContent=S.calories;
  const wg=document.getElementById("wglasses");
  wg.innerHTML=Array(8).fill(0).map((_,i)=>`<div class="wglass ${i<S.water?"full":""}" data-wi="${i}"></div>`).join("");
  wg.querySelectorAll(".wglass[data-wi]").forEach(el=>{
    el.addEventListener("click",()=>{ S.water=+el.dataset.wi<S.water?+el.dataset.wi:+el.dataset.wi+1; save(); render.health(); });
  });
};
document.getElementById("log-steps-btn").addEventListener("click",()=>{
  const v=parseInt(document.getElementById("steps-input").value);
  if(!v||v<0){ alert("Enter valid steps."); return; }
  S.steps=v; save(); render.health();
});
document.getElementById("log-cal-btn").addEventListener("click",()=>{
  const v=parseInt(document.getElementById("cal-input").value);
  if(!v||v<0){ alert("Enter valid calories."); return; }
  S.calories=v; save(); render.health();
});
document.getElementById("log-sleep-btn").addEventListener("click",()=>{
  const a=document.getElementById("sl-start").value, b=document.getElementById("sl-end").value;
  if(!a||!b){ alert("Set both times."); return; }
  const [ah,am]=a.split(":").map(Number),[bh,bm]=b.split(":").map(Number);
  let hrs=(bh*60+bm-ah*60-am)/60; if(hrs<0) hrs+=24;
  S.sleepH=+hrs.toFixed(1); S.sleepQ=hrs>=8?"Excellent":hrs>=7?"Good":hrs>=6?"Okay":"Poor";
  save(); render.health();
  document.getElementById("sleep-result").innerHTML=`
    <div style="background:var(--blue2);border-radius:var(--rs);padding:12px;font-size:13px;color:var(--blue);">
      Slept ${hrs.toFixed(1)} hours — ${S.sleepQ} quality</div>`;
});

// ── FINANCE ───────────────────────────────────────────
render.finance=function(){
  const inc=S.transactions.filter(t=>t.amount>0).reduce((a,b)=>a+b.amount,0);
  const exp=Math.abs(S.transactions.filter(t=>t.amount<0).reduce((a,b)=>a+b.amount,0));
  document.getElementById("fi-inc").textContent="₹"+fmt(inc);
  document.getElementById("fi-exp").textContent="₹"+fmt(exp);
  const bal=inc-exp; const bel=document.getElementById("fi-bal");
  bel.textContent="₹"+fmt(bal); bel.style.color=bal>=0?"var(--green)":"var(--red)";
  const txl=document.getElementById("tx-list");
  txl.innerHTML=S.transactions.map(t=>`
    <div class="tx-item">
      <div class="tx-ico" style="background:${t.amount>0?"var(--green2)":"var(--red2)"};">${t.cat}</div>
      <div style="flex:1;"><div class="tx-name">${t.name}</div><div class="tx-date">${t.date}</div></div>
      <div class="tx-amt ${t.amount>0?"in-c":"out-c"}">${t.amount>0?"+":""}₹${fmt(t.amount)}</div>
      <button class="del-btn" data-txdel="${t.id}">×</button>
    </div>`).join("")||emptyMsg("No transactions yet");
  txl.querySelectorAll(".del-btn[data-txdel]").forEach(el=>{
    el.onclick=()=>{ S.transactions=S.transactions.filter(t=>t.id!==+el.dataset.txdel); save(); render.finance(); };
  });
  const cats={};
  S.transactions.filter(t=>t.amount<0).forEach(t=>{ cats[t.name]=(cats[t.name]||0)+Math.abs(t.amount); });
  const maxV=Math.max(...Object.values(cats),1);
  document.getElementById("spend-chart").innerHTML=Object.entries(cats).map(([k,v])=>`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">
      <div style="font-size:12px;color:var(--text2);min-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</div>
      ${colorBar(v,maxV,"var(--accent)")}
      <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono';min-width:65px;text-align:right;">₹${fmt(v)}</div>
    </div>`).join("")||emptyMsg("No expenses yet");
};
function openTxModal(){
  openModal("Add Transaction",`
    <div class="fg"><label class="fl">Description</label><input id="m-txname" placeholder="e.g. Salary, Groceries"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div class="fg"><label class="fl">Amount (₹)</label><input type="number" id="m-txamt" placeholder="5000" min="0"></div>
      <div class="fg"><label class="fl">Type</label>
        <select id="m-txtype"><option value="income">Income</option><option value="expense">Expense</option></select>
      </div>
    </div>
    <div class="fg"><label class="fl">Category Emoji</label><input id="m-txcat" placeholder="💰" style="width:90px;"></div>`,
  ()=>{
    const name=document.getElementById("m-txname").value.trim();
    const amt=parseFloat(document.getElementById("m-txamt").value);
    if(!name){ alert("Enter a description."); return; }
    if(!amt||amt<=0){ alert("Enter a valid amount."); return; }
    const type=document.getElementById("m-txtype").value;
    S.transactions.unshift({id:Date.now(),name,amount:type==="expense"?-Math.abs(amt):Math.abs(amt),type,cat:document.getElementById("m-txcat").value||"💰",date:TODAY_STR});
    save(); closeModal(); render.finance();
  });
}
document.getElementById("new-tx-btn").addEventListener("click",openTxModal);

// ── READING ───────────────────────────────────────────
render.reading=function(){
  document.getElementById("r-r").textContent=S.books.filter(b=>b.status==="reading").length;
  document.getElementById("r-d").textContent=S.books.filter(b=>b.status==="done").length;
  document.getElementById("r-w").textContent=S.books.filter(b=>b.status==="want").length;
  const bl=document.getElementById("book-list");
  bl.innerHTML=S.books.map(b=>`
    <div class="bk-item">
      <div class="bk-cov" style="background:${b.status==="done"?"var(--green2)":b.status==="reading"?"var(--blue2)":"var(--bg4)"};">${b.emoji}</div>
      <div style="flex:1;"><div class="bk-title">${b.title}</div><div class="bk-auth">${b.author}</div></div>
      <select data-bkid="${b.id}" style="width:120px;font-size:12px;padding:5px 7px;">
        <option value="reading" ${b.status==="reading"?"selected":""}>Reading</option>
        <option value="done" ${b.status==="done"?"selected":""}>Done ✓</option>
        <option value="want" ${b.status==="want"?"selected":""}>Want to Read</option>
      </select>
      <button class="del-btn" data-bkdel="${b.id}">×</button>
    </div>`).join("")||emptyMsg("No books yet");
  bl.querySelectorAll("select[data-bkid]").forEach(sel=>{
    sel.addEventListener("change",()=>{ const bk=S.books.find(b=>b.id===+sel.dataset.bkid); if(bk){ bk.status=sel.value; save(); render.reading(); } });
  });
  bl.querySelectorAll(".del-btn[data-bkdel]").forEach(el=>{
    el.onclick=()=>{ S.books=S.books.filter(b=>b.id!==+el.dataset.bkdel); save(); render.reading(); };
  });
};
function openBookModal(){
  openModal("Add Book",`
    <div class="fg"><label class="fl">Title</label><input id="m-btitle" placeholder="Book title"></div>
    <div class="fg"><label class="fl">Author</label><input id="m-bauth" placeholder="Author name"></div>
    <div class="fg"><label class="fl">Emoji</label><input id="m-bemoji" placeholder="📖" style="width:80px;"></div>
    <div class="fg"><label class="fl">Status</label>
      <select id="m-bstatus"><option value="reading">Currently Reading</option><option value="want">Want to Read</option><option value="done">Completed</option></select>
    </div>`,
  ()=>{
    const title=document.getElementById("m-btitle").value.trim();
    if(!title){ alert("Enter a book title."); return; }
    S.books.unshift({id:Date.now(),title,author:document.getElementById("m-bauth").value||"Unknown",status:document.getElementById("m-bstatus").value,emoji:document.getElementById("m-bemoji").value||"📖"});
    save(); closeModal(); render.reading();
  });
}
document.getElementById("new-book-btn").addEventListener("click",openBookModal);

// ── GRATITUDE ─────────────────────────────────────────
render.gratitude=function(){
  const gl=document.getElementById("grat-list");
  gl.innerHTML=S.gratitude.map(g=>`
    <div style="padding:12px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px;font-family:'JetBrains Mono';">${g.date}</div>
      ${g.items.map(i=>`<div class="grat-item"><span style="color:var(--amber);">✦</span>${i}</div>`).join("")}
      <button class="del-btn" data-gdel="${g.id}" style="margin-top:4px;">× delete</button>
    </div>`).join("")||emptyMsg("Start your gratitude practice today!");
  gl.querySelectorAll(".del-btn[data-gdel]").forEach(el=>{
    el.onclick=()=>{ if(confirm("Delete?")){S.gratitude=S.gratitude.filter(g=>g.id!==+el.dataset.gdel);save();render.gratitude();} };
  });
};
document.getElementById("save-grat-btn").addEventListener("click",()=>{
  const inputs=[...document.querySelectorAll(".gi")];
  const items=inputs.map(i=>i.value.trim()).filter(Boolean);
  if(!items.length){ alert("Write at least one thing."); return; }
  S.gratitude.unshift({id:Date.now(),date:TODAY_STR,items});
  inputs.forEach(i=>i.value=""); save(); render.gratitude();
});

// ══════════════════════════════════════════════════════
//  GOOGLE AUTH — drives everything
// ══════════════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    docRef = doc(db, "Ginie's Planner", user.uid);
    document.getElementById("user-label").textContent = user.displayName || user.email;
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.style.display = "flex";
    const avatar = document.getElementById("user-avatar");
    if(user.photoURL){ avatar.src = user.photoURL; avatar.style.display = "block"; }
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("loading").style.display = "flex";
    document.getElementById("loading-msg").textContent = "Loading your data...";
    await loadUserData();
  } else {
    currentUser = null; docRef = null;
    document.getElementById("loading").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("logout-btn").style.display = "none";
  }
});

async function loadUserData(){
  const loadMsg = document.getElementById("loading-msg");
  try {
    const snap = await getDoc(docRef);
    if(snap.exists()){
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DATA)), snap.data());
      loadMsg.textContent = "Data loaded ✓";
    } else {
      loadMsg.textContent = "First time setup...";
      await setDoc(docRef, S);
    }
    setTimeout(()=>{
      document.getElementById("loading").style.display = "none";
      render.dashboard(); render.calendar(); render.focus(); updateTimerDisplay();
      syncUI("live");
    }, 400);
  } catch(e){
    console.error("Load error:", e);
    loadMsg.textContent = "⚠ Offline mode";
    try{ const l=localStorage.getItem("Ginie's Planner_backup"); if(l) S=JSON.parse(l); }catch(_){}
    setTimeout(()=>{
      document.getElementById("loading").style.display="none";
      render.dashboard(); render.calendar(); render.focus(); updateTimerDisplay();
    }, 600);
  }
}

document.getElementById("google-signin-btn").addEventListener("click", async () => {
  const btn = document.getElementById("google-signin-btn");
  btn.textContent = "Signing in...";
  btn.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch(e) {
    console.error("Sign in error:", e);
    btn.textContent = "Sign in with Google";
    btn.disabled = false;
    if(e.code !== "auth/popup-closed-by-user") alert("Sign in failed: " + e.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  if(confirm("Sign out of Ginie's Planner?")){ await signOut(auth); S = JSON.parse(JSON.stringify(DEFAULT_DATA)); }
});
