(() => {
 const main=document.querySelector('.home-page #main');if(!main)return;
 const desktop=matchMedia('(min-width:1001px) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const sections=[...main.children].filter(n=>n.tagName==='SECTION'),footer=document.querySelector('footer'),header=document.querySelector('.header');
 let transition=false,lastWheel=0,lastSnap=0,amount=0,direction=0,releaseTimer;
 const headerHeight=()=>header.getBoundingClientRect().height;
 const top=element=>Math.max(0,element.getBoundingClientRect().top+scrollY-headerHeight());
 function release(){transition=false;amount=0;clearTimeout(releaseTimer)}
 window.addEventListener('scrollend',release);
 function nestedScroll(target,delta){
  for(let n=target;n&&n!==document.body;n=n.parentElement){
   if(n.matches('input,textarea,select,[contenteditable="true"],dialog,[role="dialog"]'))return true;
   const style=getComputedStyle(n);if(/auto|scroll/.test(style.overflowY)&&n.scrollHeight>n.clientHeight+2&&(delta>0?n.scrollTop+n.clientHeight<n.scrollHeight-2:n.scrollTop>2))return true;
  }return false;
 }
 window.addEventListener('wheel',event=>{
  if(!desktop.matches||reduce.matches||event.ctrlKey||event.metaKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY||document.querySelector('dialog[open],#links.open,.nav-group[open]')||nestedScroll(event.target,event.deltaY))return;
  const now=performance.now(),gap=now-lastWheel;lastWheel=now;
  const sign=Math.sign(event.deltaY),y=scrollY,points=[...sections,...(footer?[footer]:[])].map(top),max=document.documentElement.scrollHeight-innerHeight;
  if(sign>0&&y>=max-2||sign<0&&y<=2)return;
  if(transition||now-lastSnap<350||gap<180&&lastSnap&&amount===0){event.preventDefault();return}
  // Read long sections normally until their lower edge reaches the viewport.
  const current=sections.find((section,index)=>y>=points[index]-3&&y<(points[index+1]??max+1)-3);
  if(sign>0&&current&&current.getBoundingClientRect().bottom>innerHeight+4)return;
  if(gap>180||direction!==sign)amount=0;direction=sign;
  amount+=Math.abs(event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);event.preventDefault();
  if(amount<35)return;
  const target=sign>0?points.find(p=>p>y+4):[...points].reverse().find(p=>p<y-4);
  if(target===undefined){release();return}
  transition=true;lastSnap=now;amount=0;
  scrollTo({top:Math.min(target,max),behavior:'smooth'});
  clearTimeout(releaseTimer);releaseTimer=setTimeout(release,1400);
 },{passive:false});
 desktop.addEventListener('change',release);reduce.addEventListener('change',release);
})();
