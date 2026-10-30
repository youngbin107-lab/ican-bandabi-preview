(() => {
 const original=window.fetch.bind(window),examples=[{"id":"example-pyeongchang","region":"pyeongchang","title":"[예시] 월정사 전나무숲","body":"평창의 전나무숲을 걸으며 자연을 만나는 여행지입니다.","address":"","image":""},{"id":"example-gangneung","region":"gangneung","title":"[예시] 경포해변","body":"강릉의 푸른 바다와 해변 풍경을 즐길 수 있는 여행지입니다.","address":"","image":""}];
 const respond=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}}));
 window.fetch=(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return original(input,options);
  if((options.method||'GET').toUpperCase()!=='GET')return respond({error:'외부 공유용 디자인 미리보기에서는 저장·문의 접수를 이용할 수 없습니다.'},503);
  if(url.pathname==='/api/website/tourism'){
   if(url.searchParams.has('id')){const item=examples.find(p=>p.id===url.searchParams.get('id'));return respond(item?{item}:{error:'관광지를 찾을 수 없습니다.'},item?200:404)}
   const region=url.searchParams.get('region'),q=(url.searchParams.get('q')||'').toLowerCase(),items=examples.filter(p=>(!region||p.region===region)&&(!q||(p.title+' '+p.body).toLowerCase().includes(q)));return respond({items,total:items.length,page:1,pages:1});
  }
  if(url.pathname==='/api/website/posts')return respond({items:[],total:0,page:1,pages:1});
  return respond({error:'외부 미리보기에서는 관리자 기능을 제공하지 않습니다.'},503);
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const app=document.querySelector('#boardApp[data-mode=inquiry]');if(!app)return;
  const note=document.createElement('p');note.className='board-message';note.textContent='외부 공유용 디자인 미리보기입니다. 문의 접수와 답변 조회는 운영 서버 연결 후 이용할 수 있습니다.';note.setAttribute('role','status');app.prepend(note);
  app.querySelectorAll('input,textarea,button').forEach(n=>n.disabled=true);
 });
})();