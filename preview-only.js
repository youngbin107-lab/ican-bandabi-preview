(() => {
 const original=window.fetch.bind(window),examples=[{"id":"example-pyeongchang","region":"pyeongchang","title":"[예시] 월정사 전나무숲","body":"평창의 전나무숲을 걸으며 자연을 만나는 여행지입니다.","address":"","image":""},{"id":"example-gangneung","region":"gangneung","title":"[예시] 경포해변","body":"강릉의 푸른 바다와 해변 풍경을 즐길 수 있는 여행지입니다.","address":"","image":""}],mediaExamples=[{"id":"example-gallery","kind":"gallery","title":"[예시] 함께하는 스포츠 캠프","body":"캠프 사진이 등록되면 제목과 소개 일부가 이곳에 표시됩니다. 상세보기에서 사진과 전체 내용을 확인할 수 있습니다.","image":"visual-stories.png","videoUrl":""},{"id":"example-video","kind":"video","title":"[예시] 영상으로 만나는 캠프","body":"관리자가 등록한 영상의 제목과 소개를 확인하는 화면 예시입니다. 실제 영상이 등록되면 상세페이지에서 재생하거나 원본 영상으로 이동할 수 있습니다.","image":"visual-program.png","videoUrl":""}];
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
  if(url.pathname==='/api/website/media'){
   const kind=url.searchParams.get('kind')||'gallery',items=mediaExamples.filter(p=>p.kind===kind);
   if(url.searchParams.has('id')){const item=items.find(p=>p.id===url.searchParams.get('id'));return respond(item?{item}:{error:'콘텐츠를 찾을 수 없습니다.'},item?200:404)}
   const q=(url.searchParams.get('q')||'').toLowerCase(),filtered=items.filter(p=>!q||(p.title+' '+p.body).toLowerCase().includes(q));return respond({items:filtered,total:filtered.length,page:1,pages:1});
  }
  return respond({error:'외부 미리보기에서는 관리자 기능을 제공하지 않습니다.'},503);
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const app=document.querySelector('#boardApp[data-mode=inquiry]');if(!app)return;
  const note=document.createElement('p');note.className='board-message';note.textContent='외부 공유용 디자인 미리보기입니다. 문의 접수와 답변 조회는 운영 서버 연결 후 이용할 수 있습니다.';note.setAttribute('role','status');app.prepend(note);
  app.querySelectorAll('input,textarea,button').forEach(n=>n.disabled=true);
 });
})();