(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const store = {
    get(k,f){ try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f}},
    set(k,v){localStorage.setItem(k,JSON.stringify(v))}
  };
  const COACHES = ['Joe','Jack','Paul','Justin','Gracie','Big John','John','Eden'];
  const BOSS_NAMES = ['Gracie','Jack','John','Justin','Joe','Paul'];
  const bossData = [
    {name:'Gracie',tag:'Speed',hp:92,power:7,speed:2.1,color:'#f0588c'},
    {name:'Jack',tag:'Pressure',hp:105,power:8,speed:2.25,color:'#5ac7ef'},
    {name:'John',tag:'Counter',hp:118,power:9,speed:2.35,color:'#e8b34c'},
    {name:'Justin',tag:'Combo',hp:130,power:10,speed:2.48,color:'#8b72ee'},
    {name:'Joe',tag:'Power',hp:145,power:12,speed:2.35,color:'#e45b46'},
    {name:'Paul',tag:'Final Boss',hp:175,power:14,speed:2.6,color:'#e62742'}
  ];
  let sessions = store.get('fkbc-sessions', [
    {id:1,name:'Kids Class',coach:'Joe',focus:'Fundamentals',duration:45,done:true},
    {id:2,name:'Adult Techniques',coach:'Jack',focus:'Partner / Pad',duration:60,done:false},
    {id:3,name:'Competition Prep',coach:'Paul',focus:'Competition',duration:75,done:false}
  ]);
  let planItems = store.get('fkbc-plan-items',[
    {id:1,title:'Warm-up',mins:8},{id:2,title:'Line Work',mins:10},{id:3,title:'Partner / Pad',mins:12},{id:4,title:'Sparring',mins:10},{id:5,title:'Fitness',mins:5}
  ]);
  let scores = store.get('fkbc-highscores',[
    {name:'AVA',score:96840},{name:'MASON',score:89210},{name:'KAI',score:78160},{name:'LILY',score:70530},{name:'NOAH',score:62980}
  ]);

  // Navigation
  function nav(view){
    $$('.view').forEach(v=>v.classList.remove('active'));
    $('#view-'+view)?.classList.add('active');
    $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
    window.scrollTo({top:0,behavior:'smooth'});
    if(view==='arcade') game.resize();
  }
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));

  // Home and scoreboards
  function renderScores(){
    scores.sort((a,b)=>b.score-a.score); scores=scores.slice(0,8); store.set('fkbc-highscores',scores);
    const html=scores.slice(0,5).map((s,i)=>`<li><span class="rank">${i+1}</span><b>${escapeHtml(s.name)}</b><span class="score">${s.score.toLocaleString()}</span></li>`).join('');
    $('#homeScoreList').innerHTML=html; $('#arcadeScoreList').innerHTML=html;
  }
  function renderBosses(){
    $('#homeBossLadder').innerHTML=bossData.map((b,i)=>`<div class="mini-boss"><div class="portrait" style="background:linear-gradient(135deg,#172437,${b.color}66)">${b.name.slice(0,2).toUpperCase()}</div><small>${i+1}. ${b.name}</small></div>`).join('');
    $('#bossStrip').innerHTML=bossData.map((b,i)=>`<div class="boss-chip" data-boss="${i}">${i+1} ${b.name}${i===5?' • FINAL':''}</div>`).join('');
  }
  function escapeHtml(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

  // Sessions
  $('#sessionCoach').innerHTML=COACHES.map(c=>`<option>${c}</option>`).join('');
  function renderSessions(){
    const rows=sessions.map(s=>`<div class="session-row" data-id="${s.id}"><div class="session-date">${s.duration}<br>MIN</div><div><h4>${escapeHtml(s.name)}</h4><p>${escapeHtml(s.coach)} • ${escapeHtml(s.focus)}</p></div><button class="session-status ${s.done?'done':''}" data-toggle="${s.id}" aria-label="Toggle complete">${s.done?'✓':'○'}</button></div>`).join('');
    $('#sessionList').innerHTML=rows||'<p>No sessions yet.</p>'; $('#recentSessions').innerHTML=rows.slice(0,rows.length);
    $$('[data-toggle]').forEach(b=>b.onclick=()=>{const x=sessions.find(s=>s.id==b.dataset.toggle);x.done=!x.done;saveSessions()});
  }
  function saveSessions(){store.set('fkbc-sessions',sessions);renderSessions()}
  function addSession(){
    sessions.push({id:Date.now(),name:$('#sessionName').value.trim()||'Session',coach:$('#sessionCoach').value,focus:$('#sessionFocus').value,duration:+$('#sessionDuration').value,done:false});saveSessions();
  }
  $('#addSessionBtn').onclick=addSession; $('#newSessionBtn').onclick=()=>$('#sessionName').focus();
  $('#clearCompletedBtn').onclick=()=>{sessions=sessions.filter(s=>!s.done);saveSessions()};

  // Planner
  function renderPlan(){
    $('#planItems').innerHTML=planItems.map((p,i)=>`<div class="plan-item" data-id="${p.id}"><span class="drag-dot">${i+1}</span><input class="plan-title" value="${escapeHtml(p.title)}"><input class="plan-min" type="number" min="1" max="60" value="${p.mins}"><button class="remove-plan">×</button></div>`).join('');
    $('#planItems').querySelectorAll('.plan-item').forEach(row=>{
      const id=+row.dataset.id;
      row.querySelector('.plan-title').oninput=e=>{planItems.find(p=>p.id===id).title=e.target.value; updatePlanTotal()};
      row.querySelector('.plan-min').oninput=e=>{planItems.find(p=>p.id===id).mins=Math.max(1,+e.target.value||1);updatePlanTotal()};
      row.querySelector('.remove-plan').onclick=()=>{planItems=planItems.filter(p=>p.id!==id);renderPlan()};
    });updatePlanTotal();
  }
  function updatePlanTotal(){const total=planItems.reduce((a,b)=>a+(+b.mins||0),0);$('#planTotal').textContent=`${total} min`}
  $$('.planner-add').forEach(b=>b.onclick=()=>{planItems.push({id:Date.now(),title:b.dataset.section,mins:b.dataset.section==='Break'?3:5});renderPlan()});
  $('#savePlanBtn').onclick=()=>{store.set('fkbc-plan-items',planItems);store.set('fkbc-plan-name',$('#planName').value);const total=planItems.reduce((a,b)=>a+(+b.mins||0),0);$('#currentPlanTitle').textContent=$('#planName').value||'Lesson Plan';$('#currentPlanSummary').textContent=planItems.map(x=>x.title).slice(0,4).join(' • ');toast(`Plan saved • ${total} min`)};
  $('#planName').value=store.get('fkbc-plan-name','Spring Fundamentals');

  // Timer
  let timer={running:false,rest:false,round:1,left:180,tick:null};
  function syncTimer(){const totalRounds=+$('#roundsInput').value||5;$('#roundLabel').textContent=`ROUND ${Math.min(timer.round,totalRounds)} / ${totalRounds}`;const m=Math.floor(timer.left/60),s=timer.left%60;$('#timerDisplay').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;$('#timerState').textContent=timer.running?(timer.rest?'REST':'WORK'):'READY';$('#timerStart').textContent=timer.running?'Pause':'Start'}
  function resetTimer(){clearInterval(timer.tick);timer={running:false,rest:false,round:1,left:+$('#roundLengthInput').value||180,tick:null};syncTimer()}
  function nextTimerStage(){const rounds=+$('#roundsInput').value||5;if(!timer.rest){if(timer.round>=rounds){clearInterval(timer.tick);timer.running=false;timer.left=0;$('#timerState').textContent='COMPLETE';tone(760,.12);return}timer.rest=true;timer.left=+$('#restLengthInput').value||0;tone(520,.08)}else{timer.rest=false;timer.round++;timer.left=+$('#roundLengthInput').value||180;tone(820,.12)}syncTimer()}
  $('#timerStart').onclick=()=>{timer.running=!timer.running;clearInterval(timer.tick);if(timer.running){timer.tick=setInterval(()=>{timer.left--;if(timer.left<=0)nextTimerStage();syncTimer()},1000)}syncTimer()};
  $('#timerReset').onclick=resetTimer;$('#timerSkip').onclick=nextTimerStage;$$('[data-preset]').forEach(b=>b.onclick=()=>{const [r,w,rest]=b.dataset.preset.split(',').map(Number);$('#roundsInput').value=r;$('#roundLengthInput').value=w;$('#restLengthInput').value=rest;resetTimer()});

  // Coaches
  const roles=['Head Coach','Technique','Senior Coach','Pad Work','Fundamentals','Senior Coach','Assistant Coach','Development'];
  $('#coachGrid').innerHTML=COACHES.map((c,i)=>`<article class="coach-card glass"><div class="coach-art">${c.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div class="coach-copy"><h3>${c}</h3><p>${roles[i]}</p></div></article>`).join('');

  // Lightweight arcade engine
  const canvas=$('#gameCanvas'),ctx=canvas.getContext('2d');
  const game={
    running:false,paused:false,bossIndex:0,score:0,time:60,last:0,raf:0,bgShift:0,
    player:null,boss:null,keys:new Set(),effects:[],combo:0,comboTimer:0,special:100,
    resetFighters(){this.player={x:190,y:420,vx:0,vy:0,w:76,h:150,hp:100,maxHp:100,block:false,attack:null,attackT:0,dir:1,hitFlash:0};const b=bossData[this.bossIndex];this.boss={x:690,y:420,vx:0,vy:0,w:78,h:150,hp:b.hp,maxHp:b.hp,block:false,attack:null,attackT:0,dir:-1,hitFlash:0,ai:0};this.time=60;this.special=100;this.combo=0;this.effects=[];this.updateBossStrip()},
    startRun(){this.bossIndex=0;this.score=0;this.running=true;this.paused=false;this.resetFighters();this.hideOverlay();this.last=performance.now();cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(t=>this.loop(t))},
    resize(){const rect=canvas.getBoundingClientRect();if(rect.width<20)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.width*9/16*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);this.W=rect.width;this.H=rect.width*9/16;},
    loop(t){if(!this.running)return;const dt=Math.min((t-this.last)/16.666,2);this.last=t;if(!this.paused)this.update(dt);this.draw();this.raf=requestAnimationFrame(tt=>this.loop(tt))},
    update(dt){const p=this.player,b=this.boss;if(!p||!b)return;this.time-=dt/60;if(this.time<=0){this.finishFight(this.player.hp>this.boss.hp)}
      const move=4.1*dt;if(this.keys.has('left'))p.x-=move;if(this.keys.has('right'))p.x+=move;p.block=this.keys.has('down')||this.keys.has('block');p.x=clamp(p.x,55,this.W-120);p.dir=b.x>p.x?1:-1;b.dir=p.x>b.x?1:-1;
      if(p.attackT>0)p.attackT-=dt;if(b.attackT>0)b.attackT-=dt;if(p.hitFlash>0)p.hitFlash-=dt;if(b.hitFlash>0)b.hitFlash-=dt;
      if(this.comboTimer>0)this.comboTimer-=dt;else this.combo=0;this.special=Math.min(100,this.special+.045*dt);
      // Boss AI
      b.ai-=dt;const dist=Math.abs(b.x-p.x);if(b.ai<=0){const data=bossData[this.bossIndex];b.ai=18+Math.random()*22;if(dist>115){b.x+=Math.sign(p.x-b.x)*data.speed*2.4*dt}else{const r=Math.random();if(r<.18){b.block=true;setTimeout(()=>b.block=false,300)}else this.attack('boss',r>.68?'kick':'punch')}}
      if(dist>165)b.x+=Math.sign(p.x-b.x)*bossData[this.bossIndex].speed*.55*dt;b.x=clamp(b.x,55,this.W-120);
      this.effects=this.effects.filter(e=>(e.t-=dt)>0);
    },
    attack(who,type){if(!this.running||this.paused)return;const a=who==='player'?this.player:this.boss,o=who==='player'?this.boss:this.player;if(a.attackT>0)return;const isSpecial=type==='special';if(isSpecial&&who==='player'&&this.special<50)return;if(isSpecial)this.special-=50;a.attack=type;a.attackT=isSpecial?18:12;const range=isSpecial?175:type==='kick'?135:110;const dist=Math.abs(a.x-o.x);this.effects.push({x:a.x+(a.dir>0?a.w:0),y:a.y-a.h*.55,t:12,type,color:who==='player'?'#5bd7ff':'#ff5471'});if(dist<range){let dmg=who==='player'?(type==='kick'?10:type==='special'?18:7):bossData[this.bossIndex].power*(type==='kick'?1.25:1);if(o.block)dmg*=.34;o.hp=Math.max(0,o.hp-dmg);o.hitFlash=8;if(who==='player'){this.combo++;this.comboTimer=55;this.score+=Math.round(dmg*120*(1+Math.min(this.combo,8)*.08));this.special=Math.min(100,this.special+dmg*.75)}else this.combo=0;tone(who==='player'?180:120,.035);if(o.hp<=0)this.finishFight(who==='player')}},
    finishFight(won){if(!this.running)return;this.paused=true;if(won){const healthBonus=Math.round(this.player.hp*180),timeBonus=Math.round(Math.max(0,this.time)*90);this.score+=healthBonus+timeBonus;if(this.bossIndex<bossData.length-1){const defeated=bossData[this.bossIndex].name;this.bossIndex++;this.showOverlay('BOSS DEFEATED',`${defeated} is down. Next: ${bossData[this.bossIndex].name}.`, 'Next fight',()=>{this.resetFighters();this.paused=false;this.hideOverlay()})}else{this.running=false;this.showOverlay('FKBC CHAMPION',`You beat Paul and cleared the ladder. Final score: ${this.score.toLocaleString()}.`,'Finish',()=>this.endRun(true))}}else{this.running=false;this.showOverlay('K.O.',`${bossData[this.bossIndex].name} stopped the run. Score: ${this.score.toLocaleString()}.`,'Finish',()=>this.endRun(false))}},
    endRun(champion){this.hideOverlay();const qualifies=scores.length<5||this.score>(scores[4]?.score||0);if(qualifies){$('#finalScoreCopy').textContent=`${champion?'Ladder cleared. ':''}Final score: ${this.score.toLocaleString()}`;$('#highScoreDialog').showModal();$('#playerName').focus()}else toast(`Run complete • ${this.score.toLocaleString()} points`)},
    showOverlay(title,text,action,cb){$('#overlayTitle').textContent=title;$('#overlayText').textContent=text;$('#overlayAction').textContent=action;$('#gameOverlay').classList.remove('hidden');$('#overlayAction').onclick=cb},hideOverlay(){$('#gameOverlay').classList.add('hidden')},updateBossStrip(){$$('.boss-chip').forEach((el,i)=>{el.classList.toggle('active',i===this.bossIndex);el.classList.toggle('defeated',i<this.bossIndex)})},
    draw(){const W=this.W||960,H=this.H||540,p=this.player,b=this.boss;if(!W)return;ctx.clearRect(0,0,W,H);
      // stage
      const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#091a33');g.addColorStop(.55,'#3a1934');g.addColorStop(1,'#08111c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=.22;for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#ff3658':'#269ae8';ctx.fillRect((i*137+this.bgShift)%W,90+(i%3)*40,2,190)}ctx.globalAlpha=1;
      // mountains / dojo silhouettes
      ctx.fillStyle='#101425';ctx.beginPath();ctx.moveTo(0,H*.58);for(let x=0;x<W;x+=80)ctx.lineTo(x,H*.4+Math.sin(x*.02)*35);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
      ctx.fillStyle='#12101a';ctx.fillRect(0,H*.79,W,H*.21);ctx.strokeStyle='#6d4055';ctx.lineWidth=1;for(let y=H*.79;y<H;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      // HUD
      this.drawHud(W,H);
      if(p&&b){this.drawFighter(p,'PLAYER','#ecedf3','#f13250');this.drawFighter(b,bossData[this.bossIndex].name,bossData[this.bossIndex].color,'#14161f');}
      this.effects.forEach(e=>{ctx.globalAlpha=Math.min(1,e.t/5);ctx.strokeStyle=e.color;ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y,30+(12-e.t)*6,-.8,.8);ctx.stroke();ctx.globalAlpha=1});
      if(this.combo>1){ctx.font='900 28px system-ui';ctx.fillStyle='#ffc13d';ctx.fillText(`${this.combo} HIT COMBO`,28,H*.72)}
    },
    drawHud(W,H){if(!this.player||!this.boss)return;const pad=22,barW=Math.min(280,W*.32);ctx.font='800 13px system-ui';ctx.fillStyle='#fff';ctx.fillText(`PLAYER 1  •  ${this.score.toLocaleString()}`,pad,28);ctx.textAlign='right';ctx.fillText(`${bossData[this.bossIndex].name.toUpperCase()}  •  CPU`,W-pad,28);ctx.textAlign='left';
      bar(pad,39,barW,15,this.player.hp/this.player.maxHp,'#47e1a5');bar(W-pad-barW,39,barW,15,this.boss.hp/this.boss.maxHp,'#ff3856');ctx.textAlign='center';ctx.font='1000 32px system-ui';ctx.fillStyle='#ffd064';ctx.fillText(String(Math.max(0,Math.ceil(this.time))).padStart(2,'0'),W/2,48);ctx.font='800 11px system-ui';ctx.fillStyle='#a0b5c8';ctx.fillText(`ROUND ${this.bossIndex+1} / 6`,W/2,66);ctx.textAlign='left';bar(pad,H-24,150,8,this.special/100,'#36c6ff');ctx.font='800 9px system-ui';ctx.fillStyle='#7ccff5';ctx.fillText('FOCUS',pad,H-30);
      function bar(x,y,w,h,pct,color){ctx.fillStyle='#08101a';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x+2,y+2,(w-4)*clamp(pct,0,1),h-4);ctx.strokeStyle='#e9f0f644';ctx.strokeRect(x,y,w,h)}
    },
    drawFighter(f,name,c1,c2){ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.dir,1);if(f.hitFlash>0)ctx.globalAlpha=.45+Math.sin(f.hitFlash)*.3;const body=ctx.createLinearGradient(0,-f.h,0,0);body.addColorStop(0,c1);body.addColorStop(1,c2);ctx.fillStyle=body;ctx.strokeStyle='#030609';ctx.lineWidth=4;
      // legs
      limb(-11,-52,-27,-4,18);limb(15,-52,35,-5,18);
      // body
      ctx.beginPath();ctx.moveTo(-30,-123);ctx.quadraticCurveTo(0,-145,31,-120);ctx.lineTo(25,-57);ctx.quadraticCurveTo(0,-42,-27,-60);ctx.closePath();ctx.fill();ctx.stroke();
      // head
      ctx.beginPath();ctx.arc(1,-151,25,0,Math.PI*2);ctx.fill();ctx.stroke();
      // hair
      ctx.fillStyle='#11141a';ctx.beginPath();ctx.moveTo(-22,-168);ctx.lineTo(-6,-189);ctx.lineTo(2,-170);ctx.lineTo(19,-190);ctx.lineTo(25,-164);ctx.closePath();ctx.fill();
      // arms and attack pose
      ctx.fillStyle=body;const reach=f.attackT>3?(f.attack==='kick'?70:78):46;limb(-18,-111,reach,-97,15);limb(22,-108,40,-84,15);
      // belt
      ctx.fillStyle='#15171e';ctx.fillRect(-30,-74,58,10);ctx.fillStyle='#ff2f51';ctx.fillRect(12,-74,36,6);
      ctx.restore();
      function limb(x1,y1,x2,y2,w){ctx.lineCap='round';ctx.lineWidth=w;ctx.strokeStyle=body;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#030609';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
    }
  };
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  function pressControl(name,down=true){if(!game.running&&name!=='start')return;if(down)game.keys.add(name);else game.keys.delete(name);if(down&&['punch','kick','special'].includes(name))game.attack('player',name)}
  $$('.control').forEach(btn=>{
    const n=btn.dataset.control;
    const start=e=>{e.preventDefault();btn.classList.add('pressed');pressControl(n,true)};
    const end=e=>{e.preventDefault();btn.classList.remove('pressed');pressControl(n,false)};
    btn.addEventListener('pointerdown',start);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,end));
  });
  const keyMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',j:'punch',J:'punch',k:'kick',K:'kick',l:'block',L:'block',i:'special',I:'special'};
  addEventListener('keydown',e=>{const n=keyMap[e.key];if(n&&!e.repeat){e.preventDefault();pressControl(n,true)}});addEventListener('keyup',e=>{const n=keyMap[e.key];if(n){e.preventDefault();pressControl(n,false)}});
  $('#newRunBtn').onclick=()=>game.startRun();$('#newRunMini').onclick=()=>game.startRun();$('#pauseBtn').onclick=()=>{if(!game.running)return;game.paused=!game.paused;toast(game.paused?'Paused':'Fight!')};
  $('#overlayAction').onclick=()=>game.startRun();$('#howToBtn').onclick=()=>$('#helpDialog').showModal();
  new ResizeObserver(()=>game.resize()).observe(canvas);

  // High score form
  $('#highScoreForm').addEventListener('submit',e=>{
    if(e.submitter?.value==='cancel')return;
    e.preventDefault();const name=$('#playerName').value.trim().toUpperCase().slice(0,12);if(!name)return;scores.push({name,score:game.score});renderScores();$('#playerName').value='';$('#highScoreDialog').close();toast('High score saved');
  });

  // Install + offline
  let deferredPrompt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden')};
  if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

  // simple feedback / tone
  let toastTimer;function toast(msg){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';Object.assign(el.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',zIndex:99,background:'#071521',border:'1px solid #36536c',borderRadius:'999px',padding:'10px 16px',boxShadow:'0 10px 35px #0008',fontWeight:'800'});document.body.appendChild(el)}el.textContent=msg;el.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity='0',1700)}
  let audioCtx;function tone(freq=440,d=.05){try{audioCtx??=new (AudioContext||webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch{}}

  renderScores();renderBosses();renderSessions();renderPlan();resetTimer();
  // initial game preview
  game.resize();game.bossIndex=0;game.score=0;game.resetFighters();game.draw();
})();
