const STORAGE_KEY = "jaorys-ticket-v1";
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("es-CO", {style:"currency",currency:"COP",maximumFractionDigits:0}).format(n || 0);
const decimal = (n) => new Intl.NumberFormat("es-CO",{maximumFractionDigits:2}).format(n || 0);
const uid = () => (Date.now().toString(36) + Math.random().toString(36).slice(2,7));
let state = loadState();
let assignSourceId = null;
let toastTimer;

function emptyState(){return {goals:[],tickets:[],history:[]};}
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved&&Array.isArray(saved.goals)&&Array.isArray(saved.tickets))return {...emptyState(),...saved};}catch(e){}return emptyState();}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function emojiFor(category){return {"Belleza":"✧","Comida rápida":"🍔","Mecatos":"🍿","Ropa y accesorios":"♧","Tecnología":"⌘","Experiencias":"✦","Otro":"♡","Bebida":"☕"}[category]||"♡";}
function usedTickets(goal){return goal.allocations.reduce((sum,a)=>sum+a.amount,0);}
function requiredTickets(goal){return goal.price/goal.ticketValue;}
function progress(goal){return Math.min(100,(usedTickets(goal)/requiredTickets(goal))*100);}
function status(goal){if(goal.bought)return "bought";if(usedTickets(goal)+1e-8>=requiredTickets(goal))return "ready";return "saving";}
function availableTickets(){return state.tickets.reduce((sum,t)=>sum+t.remaining,0);}
function fmtTickets(n){return `${decimal(n)} ${Math.abs(n-1)<1e-8?"ticket":"tickets"}`;}

$("goalForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("goalName").value.trim(),price=Number($("goalPrice").value);
  if(!name||!Number.isFinite(price)||price<=0){showToast("Escribe un nombre y un precio válido.");return;}
  state.goals.unshift({id:uid(),name,price,category:$("goalCategory").value,note:$("goalNote").value.trim(),ticketValue:5000,allocations:[],bought:false,createdAt:new Date().toISOString()});
  $("goalForm").reset();save();showToast("Meta añadida a tu lista.");
});
$("ticketValue").addEventListener("input",updateTicketPreview);
$("ticketType").addEventListener("change",updateTicketPreview);
function updateTicketPreview(){const value=Number($("ticketValue").value)||0;$("ticketPreview").textContent=fmtTickets(value/5000);$("ticketPreviewSub").textContent=`por valor de ${money(value)} · referencia $5.000 por ticket`;}
$("ticketForm").addEventListener("submit",e=>{
  e.preventDefault();const value=Number($("ticketValue").value),type=$("ticketType").value;
  if(!Number.isFinite(value)||value<=0){showToast("Ingresa un valor mayor que cero.");return;}
  const amount=value/5000;
  state.tickets.unshift({id:uid(),type,value,amount,remaining:amount,createdAt:new Date().toISOString()});
  state.history.unshift({id:uid(),label:`Oportunidad: ${type}`,detail:new Date().toLocaleDateString("es-CO",{day:"numeric",month:"short"}),value,amount,kind:"earned"});
  $("ticketValue").value=5000;updateTicketPreview();save();showToast(`Registraste ${fmtTickets(amount)}.`);
});
$("goalFilter").addEventListener("change",renderGoals);
$("cancelAssign").addEventListener("click",()=>$("assignDialog").close());
$("assignForm").addEventListener("submit",e=>{
  e.preventDefault();const goal=state.goals.find(g=>g.id===$("assignGoal").value);const amount=Number($("assignAmount").value);
  if(!goal||!Number.isFinite(amount)||amount<=0){showToast("Revisa la cantidad de tickets.");return;}
  const max=availableTickets();if(amount>max+1e-8){showToast(`Solo tienes ${fmtTickets(max)} disponibles.`);return;}
  const needed=Math.max(0,requiredTickets(goal)-usedTickets(goal));if(amount>needed+1e-8){showToast(`Esta meta necesita ${fmtTickets(needed)} para completarse.`);return;}
  let left=amount;
  for(const ticket of state.tickets){if(left<=1e-8)break;const take=Math.min(ticket.remaining,left);if(take>0){ticket.remaining-=take;goal.allocations.push({ticketId:ticket.id,amount:take});left-=take;}}
  state.history.unshift({id:uid(),label:`Tickets asignados · ${goal.name}`,detail:new Date().toLocaleDateString("es-CO",{day:"numeric",month:"short"}),value:0,amount,kind:"assigned"});
  $("assignDialog").close();save();showToast("Tickets asignados a tu meta.");
});
$("clearHistoryBtn").addEventListener("click",()=>{if(!state.history.length){showToast("El historial ya está vacío.");return;}if(confirm("¿Borrar solo el historial de movimientos? Las metas y tickets no se eliminarán.")){state.history=[];save();showToast("Historial borrado.");}});
$("resetAllBtn").addEventListener("click",()=>{if(confirm("Esto eliminará todas tus metas, tickets e historial guardados en este dispositivo. ¿Continuar?")){state=emptyState();save();showToast("Datos reiniciados.");}});
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"Jaory's Ticket",exportedAt:new Date().toISOString(),...state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="jaorys-ticket-respaldo.json";a.click();URL.revokeObjectURL(url);showToast("Respaldo descargado.");});

function assignToGoal(id){const goal=state.goals.find(g=>g.id===id);if(!goal)return;const avail=availableTickets(),needed=Math.max(0,requiredTickets(goal)-usedTickets(goal));if(avail<=0){showToast("Primero registra una oportunidad para tener tickets.");return;}if(needed<=1e-8){showToast("Esta meta ya está completa.");return;}
  assignSourceId=id;$("assignGoal").innerHTML=state.goals.filter(g=>!g.bought&&status(g)!=="ready").map(g=>`<option value="${g.id}" ${g.id===id?"selected":""}>${escapeHtml(g.name)} · faltan ${fmtTickets(Math.max(0,requiredTickets(g)-usedTickets(g)))}</option>`).join("");
  $("assignAvailable").textContent=`Tienes ${fmtTickets(avail)} disponibles. Esta meta necesita ${fmtTickets(needed)} para completarse.`;
  $("assignAmount").max=Math.min(avail,needed);$("assignAmount").value=decimal(Math.min(avail,needed));$("assignDialog").showModal();
}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){const avail=availableTickets();$("totalTickets").innerHTML=`${decimal(avail)} <small>tickets</small>`;$("availableCashValue").textContent=`Equivalente en efectivo: ${money(avail*5000)}`;const pendingTicketValue=state.goals.filter(g=>!g.bought).reduce((sum,g)=>sum+usedTickets(g),0)*5000;$("pendingCashValue").textContent=money(pendingTicketValue);$("activeGoals").textContent=state.goals.filter(g=>status(g)==="saving").length;$("readyGoals").textContent=state.goals.filter(g=>status(g)==="ready").length;renderGoals();renderHistory();updateTicketPreview();}
function renderGoals(){const filter=$("goalFilter").value;const goals=state.goals.filter(g=>filter==="all"||status(g)===filter);$("goalList").innerHTML=goals.map(g=>{
  const st=status(g),pct=progress(g),used=usedTickets(g),required=requiredTickets(g),remaining=Math.max(0,required-used);
  const statusText=st==="ready"?"Permitido comprar":st==="bought"?"Ya comprado":"En progreso";
  return `<article class="goal-card ${st}"><div class="goal-main"><div class="goal-emoji">${emojiFor(g.category)}</div><div class="goal-info"><h3>${escapeHtml(g.name)}</h3><div class="meta">${escapeHtml(g.category)}${g.note?` · ${escapeHtml(g.note)}`:""}</div><span class="status-pill ${st}">${statusText}</span></div><div class="goal-price">${money(g.price)}<small>${fmtTickets(required)}</small></div></div><div class="progress-area"><div class="progress-label"><span>${fmtTickets(used)} acumulados</span><b>${Math.round(pct)}%</b></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-label" style="margin-top:7px;margin-bottom:0"><span>${st==="ready"||st==="bought"?"Meta completada":`Faltan ${fmtTickets(remaining)}`}</span><span>${money(Math.max(0,g.price-used*5000))} aprox.</span></div></div><div class="goal-actions">${st==="saving"?`<button class="small-action strong" data-action="assign" data-id="${g.id}" ${availableTickets()<=0?"disabled":""}>＋ Asignar tickets</button>`:""}${st==="ready"?`<button class="small-action strong" data-action="bought" data-id="${g.id}">✓ Marcar comprado</button>`:""}${st==="bought"?`<button class="small-action" data-action="undoBought" data-id="${g.id}">Deshacer compra</button>`:""}<button class="small-action" data-action="edit" data-id="${g.id}">Editar</button><button class="small-action" data-action="delete" data-id="${g.id}">Eliminar</button></div></article>`;
}).join("");
$("emptyGoals").style.display=state.goals.length?"none":"block";
if(state.goals.length&&goals.length===0){$("goalList").innerHTML='<div class="history-empty">No hay metas en esta categoría todavía.</div>';}
}
$("goalList").addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(!b)return;const g=state.goals.find(x=>x.id===b.dataset.id);if(!g)return;switch(b.dataset.action){
  case "assign":assignToGoal(g.id);break;
  case "bought":if(confirm(`¿Marcar "${g.name}" como comprado?`)){g.bought=true;save();showToast("¡Meta marcada como comprada!");}break;
  case "undoBought":g.bought=false;save();showToast("La meta volvió a su estado anterior.");break;
  case "delete":if(confirm(`¿Eliminar "${g.name}"? Los tickets asignados volverán a estar disponibles.`)){for(const a of g.allocations){const t=state.tickets.find(x=>x.id===a.ticketId);if(t)t.remaining+=a.amount;}state.goals=state.goals.filter(x=>x.id!==g.id);save();showToast("Meta eliminada.");}break;
  case "edit":const name=prompt("Nombre de la meta:",g.name);if(name===null)break;const price=prompt("Precio en pesos colombianos:",String(g.price));if(price===null)break;const p=Number(price);if(!name.trim()||!Number.isFinite(p)||p<=0){showToast("Nombre o precio no válido.");break;}if(p/5000+1e-8<usedTickets(g)){showToast("El nuevo precio no puede ser menor al valor ya acumulado.");break;}g.name=name.trim();g.price=p;save();showToast("Meta actualizada.");break;
}});
function renderHistory(){const history=state.history.slice(0,8);$("ticketHistory").innerHTML=history.map(h=>`<div class="history-item"><div class="history-dot">${h.kind==="assigned"?"↗":"＋"}</div><div class="history-info"><b>${escapeHtml(h.label)}</b><small>${escapeHtml(h.detail)}</small></div><div class="history-value">${h.kind==="assigned"?"−": "+"+fmtTickets(h.amount)}<small>${h.value?money(h.value):"asignación"}</small></div></div>`).join("");$("emptyHistory").style.display=history.length?"none":"block";}
render();

// Seguimiento de hábitos: se guarda en este navegador, no en una base de datos compartida.
const WELLNESS_KEY = "jaorys-ticket-wellness-v1";
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dateOffset = (date, offset) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const readableDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("es-CO",{day:"numeric",month:"short"});
function emptyWellness(){return {daily:{},meals:[],phase:"1",weeklyAwards:[]};}
function loadWellness(){try{const v=JSON.parse(localStorage.getItem(WELLNESS_KEY));if(v&&v.daily&&Array.isArray(v.meals))return {...emptyWellness(),...v};}catch(e){}return emptyWellness();}
let wellness = loadWellness();
function saveWellness(){localStorage.setItem(WELLNESS_KEY,JSON.stringify(wellness));renderWellness();}
function awardHabitTickets(amount,label,detail){if(amount<=0)return;const ticket={id:uid(),type:label,value:0,amount,remaining:amount,createdAt:new Date().toISOString()};state.tickets.unshift(ticket);state.history.unshift({id:uid(),label,detail,value:0,amount,kind:"earned"});save();}
function consecutiveNoShorts(){let n=0,d=localDate();if(!wellness.daily[d])d=dateOffset(d,-1);while(wellness.daily[d]&&wellness.daily[d].minutes===0){n++;d=dateOffset(d,-1);}return n;}
function checkWeeklyReward(){
  const today=localDate();
  for(let endOffset=0;endOffset<7;endOffset++){
    const end=dateOffset(today,-endOffset), start=dateOffset(end,-6), key=`${start}_${end}`;
    if(wellness.weeklyAwards.includes(key))continue;
    let all=true;for(let i=0;i<7;i++){const rec=wellness.daily[dateOffset(start,i)];if(!rec||rec.minutes!==0||!rec.noJunk||rec.sleep<8){all=false;break;}}
    if(all){wellness.weeklyAwards.push(key);const messages=["Una semana de decisiones conscientes: estás construyendo una rutina que te cuida. Sigue paso a paso.","Tu constancia merece reconocimiento. No necesitas perfección: sigue eligiendo lo que te hace bien.","Siete días alineando tus hábitos. Reconoce el esfuerzo y prepara una nueva semana realista.","Has demostrado que puedes crear espacio para descansar, comer con regularidad y estar presente. Continúa."];
      const msg=messages[wellness.weeklyAwards.length%messages.length];wellness.lastWeeklyMessage={key,message:msg};localStorage.setItem(WELLNESS_KEY,JSON.stringify(wellness));showToast("¡Meta semanal completa! Revisa tu mensaje personalizado.");}
  }
}
function renderWellness(){
  const streak=consecutiveNoShorts();
  $("streakDays").textContent=streak;
  const milestones=[7,14,30,90,180,365], next=milestones.find(x=>x>streak);
  const base=milestones.find(x=>x<=streak&&milestones.indexOf(x)===milestones.length-1)||milestones.filter(x=>x<=streak).slice(-1)[0]||0;
  const pct=next?Math.min(100,Math.round(streak/next*100)):100;
  $("streakProgress").style.width=pct+"%";
  $("nextMilestone").textContent=next?`Próximo hito: ${next===30?"1 mes":next===90?"3 meses":next===180?"6 meses":next===365?"1 año":next+" días"}`:"¡Hito de un año alcanzado!";
  $("milestonePercent").textContent=pct+"%";
  $("plantArt").textContent=streak>=365?"🌳":streak>=90?"🪴":streak>=30?"🌿":streak>=14?"🌱🌿":streak>=7?"🌱":"🌱";
  $("milestoneList").innerHTML=milestones.map(m=>`<span class="milestone ${streak>=m?"achieved":""}">${m===30?"1 mes":m===90?"3 meses":m===180?"6 meses":m===365?"1 año":m+" días"}${streak>=m?" ✓":""}</span>`).join("");
  const today=localDate();if(!$('dailyDate').value)$('dailyDate').value=today;if(!$('mealDate').value)$('mealDate').value=today;
  const rec=wellness.daily[today];$("dailySummary").innerHTML=rec?`<b>Registro de hoy guardado.</b> Shorts: ${rec.minutes} min · Sueño: ${rec.sleep} h · Objetivo de comida: ${rec.noJunk?"cumplido":"no marcado"}. ${rec.note?`<br><span>${escapeHtml(rec.note)}</span>`:""}`:"Todavía no hay seguimiento registrado para hoy.";
  $("currentPhase").value=wellness.phase||"1";
  const award=wellness.lastWeeklyMessage;
  if(award){let box=document.getElementById("weeklyMessage");if(!box){box=document.createElement("div");box.id="weeklyMessage";box.className="weekly-message";document.querySelector(".checkin-panel").appendChild(box);}box.innerHTML=`<b>Mensaje de tu semana</b><p>${escapeHtml(award.message)}</p><small>Semana registrada: ${award.key.replace("_"," a ")}</small>`;}
  const meals=wellness.meals.slice().reverse();$("mealCount").textContent=`${wellness.meals.length} ${wellness.meals.length===1?"registro":"registros"}`;
  $("mealHistory").innerHTML=meals.slice(0,30).map(m=>`<article class="meal-item"><div><b>${escapeHtml(m.type)} · ${escapeHtml(m.description)}</b><small>${readableDate(m.date)}${m.feeling?" · "+escapeHtml(m.feeling):""}</small></div><span>+0,2</span><button type="button" class="text-button" data-meal-delete="${m.id}" aria-label="Eliminar registro de comida">Eliminar</button></article>`).join("")||'<p class="history-empty">Tus registros de comidas aparecerán aquí.</p>';
}
$("dailyForm").addEventListener("submit",e=>{
  e.preventDefault();const date=$("dailyDate").value, minutes=Number($("shortMinutes").value), sleep=Number($("sleepHours").value), noJunk=$("noJunkFood").checked, note=$("dailyNote").value.trim();
  if(!date||minutes<0||sleep<0||sleep>24){showToast("Revisa la fecha, los minutos y las horas de sueño.");return;}
  const old=wellness.daily[date];
  // Do not double-award if the same date is edited; tickets are awarded only on first save.
  wellness.daily[date]={minutes,sleep,noJunk,note,updatedAt:new Date().toISOString(),awarded:{shorts:false,sleep:false,food:false,...(old?.awarded||{})}};
  const rec=wellness.daily[date];
  if(!rec.awarded.shorts){if(minutes===0){awardHabitTickets(.02,"Hábito: día sin Shorts",readableDate(date));rec.awarded.shorts=true;}else if(minutes<=15){awardHabitTickets(.01,"Hábito: Shorts ≤15 min",readableDate(date));rec.awarded.shorts=true;}}
  if(!rec.awarded.sleep && sleep>=8){awardHabitTickets(.02,"Hábito: 8 horas de sueño",readableDate(date));rec.awarded.sleep=true;}
  if(!rec.awarded.food && noJunk){awardHabitTickets(.02,"Hábito: día sin mecato/comida rápida",readableDate(date));rec.awarded.food=true;}
  localStorage.setItem(WELLNESS_KEY,JSON.stringify(wellness));checkWeeklyReward();saveWellness();showToast("Seguimiento diario guardado.");
});
$("mealForm").addEventListener("submit",e=>{e.preventDefault();const date=$("mealDate").value,type=$("mealType").value,description=$("mealDescription").value.trim(),feeling=$("mealFeeling").value;if(!date||!description){showToast("Indica la fecha y qué comiste.");return;}const m={id:uid(),date,type,description,feeling,createdAt:new Date().toISOString()};wellness.meals.push(m);awardHabitTickets(.2,`Comida registrada: ${type}`,readableDate(date));$("mealForm").reset();$("mealDate").value=localDate();saveWellness();showToast("Comida registrada: +0,2 tickets.");});
$("mealHistory").addEventListener("click",e=>{const b=e.target.closest("[data-meal-delete]");if(!b)return;if(!confirm("¿Eliminar este registro? Los tickets ganados no se descuentan automáticamente."))return;wellness.meals=wellness.meals.filter(m=>m.id!==b.dataset.mealDelete);saveWellness();showToast("Registro eliminado.");});
$("savePhaseBtn").addEventListener("click",()=>{wellness.phase=$("currentPhase").value;saveWellness();$("phaseSaved").textContent="Fase guardada en este dispositivo.";showToast("Fase de seguimiento actualizada.");});
// Replace export/reset behavior so the backup includes wellness data too.
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"Jaory's Ticket",exportedAt:new Date().toISOString(),...state,wellness},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="jaorys-ticket-respaldo.json";a.click();URL.revokeObjectURL(url);showToast("Respaldo completo descargado.");};
$("resetAllBtn").onclick=()=>{if(confirm("Esto eliminará tus metas, tickets, comidas y seguimientos guardados en este dispositivo. ¿Continuar?")){state=emptyState();wellness=emptyWellness();localStorage.removeItem(WELLNESS_KEY);save();saveWellness();showToast("Datos reiniciados.");}};
renderWellness();
