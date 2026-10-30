(() => {
 const app=document.querySelector('#tourismApp');if(!app)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const names={pyeongchang:'평창',gangneung:'강릉'},params=new URLSearchParams(location.search);
 const picture=p=>p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`:'<div class="tour-placeholder"><span>사진 준비 중</span></div>';
 async function api(query){const r=await fetch('/api/website/tourism?'+query);const data=await r.json();if(!r.ok)throw Error(data.error||'불러오지 못했습니다.');return data}
 async function detail(){
  try{const {item:p}=await api(new URLSearchParams({id:params.get('id')||'missing'}));document.title=p.title+' | 지역 관광';
   app.innerHTML=`<a class="board-text-link" href="tourism.html?region=${p.region}">← ${names[p.region]} 관광 목록</a><article class="tour-detail"><p class="structure-kicker purple">${names[p.region]}</p><h2>${esc(p.title)}</h2><div class="tour-detail-photo">${picture(p)}</div><div class="board-prose">${esc(p.body)}</div>${p.address?`<section class="tour-address"><h3>위치 안내</h3><p>${esc(p.address)}</p><a class="board-button light" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}">지도에서 보기 ↗</a></section>`:''}</article>`;
  }catch(e){error(e)}
 }
 function error(e){app.innerHTML=`<p class="board-message error" role="alert">${esc(e.message)}</p><a class="board-button light" href="tourism.html">관광 목록으로</a>`}
 async function gallery(){
  let region=names[params.get('region')]?params.get('region'):'pyeongchang',page=1,q='',serial=0;
  app.innerHTML=`<div class="board-heading"><div><p class="structure-kicker purple">LOCAL TRAVEL</p><h2>캠프와 함께 만나는 지역 관광</h2><p>평창과 강릉의 여행지를 둘러보세요.</p></div></div><div class="tour-tabs" role="tablist" aria-label="관광 지역">${Object.entries(names).map(([id,label])=>`<button type="button" role="tab" id="tab-${id}" data-region="${id}" aria-controls="tourPanel" aria-selected="${id===region}" tabindex="${id===region?0:-1}">${label}</button>`).join('')}</div><section id="tourPanel" role="tabpanel" aria-labelledby="tab-${region}"><form class="board-search"><label for="tourSearch">관광지 검색</label><div><input id="tourSearch" name="q" maxlength="100" placeholder="관광지 이름 또는 소개 검색"><button class="board-button">검색</button></div></form><p id="tourStatus" role="status" aria-live="polite"></p><div class="tour-grid"></div><nav class="board-pages" aria-label="관광 목록 페이지"></nav></section>`;
  const grid=app.querySelector('.tour-grid'),status=app.querySelector('#tourStatus'),pages=app.querySelector('.board-pages');
  const panel=app.querySelector('#tourPanel'),tabs=[...app.querySelectorAll('[role=tab]')];
  function selectRegion(next,updateUrl=true){
   if(!names[next])return;region=next;page=1;
   tabs.forEach(t=>{const selected=t.dataset.region===region;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1});panel.setAttribute('aria-labelledby','tab-'+region);
   if(updateUrl){const url=new URL(location.href);url.searchParams.set('region',region);history.pushState({},'',url)}
   load();
  }
  tabs.forEach((t,index)=>{t.onclick=()=>{if(region!==t.dataset.region)selectRegion(t.dataset.region)};t.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();selectRegion(tabs[next].dataset.region)}});
  // Header region links also change this gallery without loading another document.
  document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!link||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||link.target)return;const url=new URL(link.href);if(url.origin===location.origin&&url.pathname===location.pathname&&names[url.searchParams.get('region')]){e.preventDefault();selectRegion(url.searchParams.get('region'))}});
  window.addEventListener('popstate',()=>selectRegion(new URLSearchParams(location.search).get('region')||'pyeongchang',false));
  async function load(){const request=++serial;panel.setAttribute('aria-busy','true');status.textContent=names[region]+' 관광지를 불러오는 중입니다…';grid.innerHTML='';pages.innerHTML='';try{
   const data=await api(new URLSearchParams({region,q,page}));if(request!==serial)return;page=data.page;status.textContent=`${names[region]} · 총 ${data.total}곳`;
   grid.innerHTML=data.items.map(p=>`<a class="tour-card" href="tourism-detail.html?id=${encodeURIComponent(p.id)}"><div class="tour-photo">${picture(p)}</div><div class="tour-card-body"><span>${names[p.region]}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><strong>상세보기 →</strong></div></a>`).join('')||'<p class="board-empty">등록된 관광지가 없습니다.</p>';
   pages.innerHTML=`<button class="board-button light" ${page<=1?'disabled':''}>이전</button><span>${page} / ${data.pages}</span><button class="board-button light" ${page>=data.pages?'disabled':''}>다음</button>`;
   pages.firstElementChild.onclick=()=>{page--;load()};pages.lastElementChild.onclick=()=>{page++;load()};
  }catch(e){if(request!==serial)return;status.textContent=e.message;grid.innerHTML='<button class="board-button light">다시 불러오기</button>';grid.firstElementChild.onclick=load;pages.innerHTML=''}finally{if(request===serial)panel.setAttribute('aria-busy','false')}}
  app.querySelector('form').onsubmit=e=>{e.preventDefault();q=new FormData(e.target).get('q');page=1;load()};await load();
 }
 if(app.dataset.mode==='detail')detail();else gallery();
})();
