'use strict';
// ---------- Sudoku engine ----------
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function ok(b,i,v){const r=(i/9|0),c=i%9,br=r-r%3,bc=c-c%3;
 for(let k=0;k<9;k++){if(b[r*9+k]===v||b[k*9+c]===v||b[(br+(k/3|0))*9+bc+k%3]===v)return false}return true}
function countSol(b,limit=2){let n=0;(function go(){if(n>=limit)return;
 let best=-1,bc=null;for(let i=0;i<81;i++)if(!b[i]){const cs=[];for(let v=1;v<=9;v++)if(ok(b,i,v))cs.push(v);
  if(!cs.length)return;if(!bc||cs.length<bc.length){best=i;bc=cs;if(cs.length===1)break}}
 if(best<0){n++;return}for(const v of bc){b[best]=v;go();b[best]=0;if(n>=limit)return}})();return n}
function fill(b){for(let i=0;i<81;i++)if(!b[i]){for(const v of shuffle([1,2,3,4,5,6,7,8,9]))if(ok(b,i,v)){b[i]=v;if(fill(b))return true}b[i]=0;return false}return true}
const CLUES={Easy:40,Medium:33,Hard:28,Expert:24};
function generate(level){const sol=Array(81).fill(0);fill(sol);const p=sol.slice();const target=CLUES[level]||33;let clues=81;
 for(const i of shuffle([...Array(81).keys()])){if(clues<=target)break;const v=p[i];p[i]=0;
  if(countSol(p.slice())!==1)p[i]=v;else clues--}return{puzzle:p,solution:sol}}
if(typeof module!=='undefined'){module.exports={generate,countSol};}
else{
// ---------- UI ----------
const $=id=>document.getElementById(id);const board=$('board'),pad=$('pad');let S,sel=-1,notesMode=false,tick;
const cells=[];for(let i=0;i<81;i++){const d=document.createElement('div');d.className='c';d.onclick=()=>{sel=i;render()};board.appendChild(d);cells.push(d)}
for(let v=1;v<=9;v++){const b=document.createElement('button');b.textContent=v;b.onclick=()=>input(v);pad.appendChild(b)}
const save=()=>localStorage.setItem('sudoku',JSON.stringify(S));
function newGame(){const lv=$('level').value;const g=generate(lv);
 S={level:lv,puzzle:g.puzzle,solution:g.solution,vals:g.puzzle.slice(),notes:Array.from({length:81},()=>[]),undo:[],redo:[],time:0,mistakes:0,paused:false,done:false,showMist:$('mistChk').checked};
 sel=-1;save();render()}
function snap(){return{v:S.vals.slice(),n:S.notes.map(a=>a.slice())}}
function push(){S.undo.push(snap());if(S.undo.length>200)S.undo.shift();S.redo=[]}
function restore(s){S.vals=s.v;S.notes=s.n}
function input(v){if(sel<0||S.done||S.paused||S.puzzle[sel])return;push();
 if(notesMode){if(S.vals[sel])return;const a=S.notes[sel];const k=a.indexOf(v);k<0?a.push(v):a.splice(k,1)}
 else{S.vals[sel]=S.vals[sel]===v?0:v;S.notes[sel]=[];if(S.vals[sel]){if(v!==S.solution[sel])S.mistakes++;clearNotes(sel,v)}}
 after()}
function clearNotes(i,v){const r=i/9|0,c=i%9;for(let j=0;j<81;j++){const jr=j/9|0,jc=j%9;if(jr===r||jc===c||((jr/3|0)===(r/3|0)&&(jc/3|0)===(c/3|0))){const k=S.notes[j].indexOf(v);if(k>=0)S.notes[j].splice(k,1)}}}
function erase(){if(sel<0||S.puzzle[sel]||S.done)return;push();S.vals[sel]=0;S.notes[sel]=[];after()}
function hint(){if(S.done||S.paused)return;let i=sel;if(i<0||S.vals[i]===S.solution[i]){const e=[];for(let j=0;j<81;j++)if(S.vals[j]!==S.solution[j])e.push(j);if(!e.length)return;i=e[Math.random()*e.length|0]}
 push();S.vals[i]=S.solution[i];S.notes[i]=[];clearNotes(i,S.vals[i]);sel=i;after()}
function after(){if(S.vals.every((v,i)=>v===S.solution[i])){S.done=true;$('winTxt').textContent=`${S.level} · ${fmt(S.time)} · ${S.mistakes} mistakes`;$('win').hidden=false}save();render()}
const fmt=t=>String(t/60|0).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
function render(){const sv=sel>=0?S.vals[sel]:0,sr=sel/9|0,sc=sel%9;
 for(let i=0;i<81;i++){const d=cells[i],v=S.vals[i],r=i/9|0,c=i%9;let cl='c';if(S.puzzle[i])cl+=' g';
  if(sel>=0){if(i===sel)cl+=' sel';else if(sv&&v===sv)cl+=' s';else if(r===sr||c===sc||((r/3|0)===(sr/3|0)&&(c/3|0)===(sc/3|0)))cl+=' h'}
  if(S.showMist&&v&&!S.puzzle[i]&&v!==S.solution[i])cl+=' bad';d.className=cl;
  if(v)d.textContent=v;else if(S.notes[i].length)d.innerHTML='<div class="n">'+[1,2,3,4,5,6,7,8,9].map(n=>`<span>${S.notes[i].includes(n)?n:''}</span>`).join('')+'</div>';else d.textContent=''}
 [...pad.children].forEach((b,k)=>b.classList.toggle('done',S.vals.filter((v,i)=>v===k+1&&v===S.solution[i]).length===9));
 $('mist').textContent='Mistakes: '+S.mistakes;$('timer').textContent=fmt(S.time);$('notesBtn').classList.toggle('on',notesMode);
 $('pauseBtn').textContent=S.paused?'▶':'⏸';$('pausedOv').hidden=!S.paused;$('level').value=S.level;$('mistChk').checked=S.showMist}
$('newBtn').onclick=()=>{if(S.done||confirm('Start a new game?'))newGame()};$('winNew').onclick=()=>{$('win').hidden=true;newGame()};
$('undoBtn').onclick=()=>{if(!S.undo.length||S.done)return;S.redo.push(snap());restore(S.undo.pop());save();render()};
$('redoBtn').onclick=()=>{if(!S.redo.length||S.done)return;S.undo.push(snap());restore(S.redo.pop());save();render()};
$('eraseBtn').onclick=erase;$('hintBtn').onclick=hint;$('notesBtn').onclick=()=>{notesMode=!notesMode;render()};
$('pauseBtn').onclick=()=>{if(S.done)return;S.paused=!S.paused;save();render()};
$('mistChk').onchange=e=>{S.showMist=e.target.checked;save();render()};
$('themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')};
const th=localStorage.getItem('theme');if(th==='dark'||(!th&&matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark');
document.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;const k=e.key;
 if(k>='1'&&k<='9')input(+k);else if(k==='Backspace'||k==='Delete'||k==='0')erase();
 else if(k==='n'||k==='N')$('notesBtn').click();else if((e.ctrlKey||e.metaKey)&&k==='z')$('undoBtn').click();else if((e.ctrlKey||e.metaKey)&&k==='y')$('redoBtn').click();
 else if(k.startsWith('Arrow')){if(sel<0)sel=0;else{const r=sel/9|0,c=sel%9;sel=k==='ArrowUp'?((r+8)%9)*9+c:k==='ArrowDown'?((r+1)%9)*9+c:k==='ArrowLeft'?r*9+(c+8)%9:r*9+(c+1)%9}e.preventDefault();render()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S&&!S.done){S.paused=true;save();render()}});
try{S=JSON.parse(localStorage.getItem('sudoku'))}catch(e){}if(!S||!S.solution)newGame();else render();
tick=setInterval(()=>{if(!S.paused&&!S.done){S.time++;$('timer').textContent=fmt(S.time);if(S.time%5===0)save()}},1000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
