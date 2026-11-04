(() => {
 'use strict';
 const app=document.querySelector('#mediaApp');if(!app)return;
 const kind=app.dataset.kind==='video'?'video':'gallery',label=kind==='video'?'영상':'사진 갤러리',listFile=kind==='video'?'videos.html':'gallery.html',detailFile=kind==='video'?'video-detail.html':'gallery-detail.html';
 const params=new URLSearchParams(location.search),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=v=>v?new Date(v).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'}):'';
 const thumb=p=>p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`:`<div class="media-placeholder">${kind==='video'?'영상':'사진'} 준비 중</div>`;
 const message=(host,text,error=false)=>{host.textContent=text;host.className='board-message'+(error?' error':'')};
 async function api(query){let r;try{r=await fetch('/api/website/media?'+query)}catch{throw Error('연결 상태를 확인하고 다시 시도해 주세요.')}let data;try{data=await r.json()}catch{throw Error('콘텐츠 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')}if(!r.ok)throw Error(data.error||'콘텐츠를 불러오지 못했습니다.');return data}
 function youtubeId(raw){try{const url=new URL(raw);if(url.protocol!=='https:')return null;const host=url.hostname.toLowerCase();let id;if(host==='youtu.be')id=url.pathname.slice(1);else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){if(url.pathname==='/watch')id=url.searchParams.get('v');else if(/^\/(shorts|embed)\//.test(url.pathname))id=url.pathname.split('/')[2]}return /^[\w-]{11}$/.test(id||'')?id:null}catch{return null}}
 async function detail(){
  const back=new URLSearchParams();for(const key of ['q','page'])if(params.get(key))back.set(key,params.get(key));const backUrl=listFile+(back.size?'?'+back:'');
  try{
   const {item:p}=await api(new URLSearchParams({kind,id:params.get('id')||'missing'}));document.title=p.title+' | '+label;
   const id=kind==='video'?youtubeId(p.videoUrl):null;
   const player=kind==='video'?`<div class="media-player">${thumb(p)}${id?'<button type="button" class="media-play" aria-label="영상 재생"><span aria-hidden="true">▶</span><strong>영상 재생</strong></button>':''}</div>${p.videoUrl?`<a class="board-button light media-original" href="${esc(p.videoUrl)}" target="_blank" rel="noopener noreferrer">원본 영상 보기 ↗</a>`:'<p class="board-help">관리자가 영상을 등록하면 이곳에서 확인할 수 있습니다.</p>'}`:`<div class="media-detail-photo">${thumb(p)}</div>`;
   app.innerHTML=`<a class="board-text-link" href="${esc(backUrl)}">← ${label} 목록</a><article class="media-detail"><header><p class="structure-kicker purple">${kind==='video'?'CAMP VIDEO':'CAMP GALLERY'}</p><h2>${esc(p.title)}</h2>${p.createdAt?`<p class="board-detail-meta">${date(p.createdAt)}</p>`:''}</header>${player}<div class="board-prose">${esc(p.body)}</div><a class="board-button light" href="${esc(backUrl)}">목록으로</a></article>`;
   if(id)app.querySelector('.media-play').onclick=()=>{const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1';frame.title=p.title;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';app.querySelector('.media-player').replaceChildren(frame)};
  }catch(e){app.innerHTML=`<p role="alert" class="board-message error">${esc(e.message)}</p><a class="board-button light" href="${esc(backUrl)}">${label} 목록으로</a>`}
 }
 async function list(){
  let page=Math.max(1,Math.floor(Number(params.get('page'))||1)),q=(params.get('q')||'').slice(0,100),serial=0;
  app.innerHTML=`<div class="board-heading"><div><p class="structure-kicker purple">${kind==='video'?'CAMP VIDEO':'CAMP GALLERY'}</p><h2>${label}</h2><p>${kind==='video'?'영상으로 만나는 캠프의 이야기':'사진으로 기록한 캠프의 순간을 만나보세요.'}</p></div></div><form class="board-search"><label for="mediaSearch">${label} 검색</label><div><input id="mediaSearch" name="q" maxlength="100" placeholder="제목 또는 내용 검색" value="${esc(q)}"><button class="board-button" type="submit">검색</button></div></form><p id="mediaStatus" role="status" aria-live="polite"></p><div class="media-grid-list" aria-label="${label} 목록"></div><nav class="board-pages" aria-label="${label} 페이지"></nav>`;
  const form=app.querySelector('form'),status=app.querySelector('#mediaStatus'),grid=app.querySelector('.media-grid-list'),pages=app.querySelector('.board-pages');
  async function load(){
   const request=++serial;grid.setAttribute('aria-busy','true');message(status,'콘텐츠를 불러오는 중입니다…');grid.innerHTML='';pages.innerHTML='';
   try{
    const r=await api(new URLSearchParams({kind,q,page}));if(request!==serial)return;page=r.page;message(status,`총 ${r.total}건`);
    const query=new URLSearchParams();if(q)query.set('q',q);if(page>1)query.set('page',page);history.replaceState({},'',listFile+(query.size?'?'+query:''));
    grid.innerHTML=r.items.map(p=>{const detailQuery=new URLSearchParams({id:p.id});if(q)detailQuery.set('q',q);if(page>1)detailQuery.set('page',page);return `<a class="media-card" href="${detailFile}?${detailQuery}"><div class="media-card-photo">${thumb(p)}${kind==='video'?'<span class="media-video-mark" aria-hidden="true">▶</span>':''}</div><div class="media-card-copy"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><strong>상세보기 <span aria-hidden="true">→</span></strong></div></a>`}).join('')||`<p class="board-empty">${q?'검색 결과가 없습니다.':'아직 등록된 '+label+' 콘텐츠가 없습니다.'}</p>`;
    pages.innerHTML=`<button type="button" class="board-button light" ${page<=1?'disabled':''}>이전</button><span>${page} / ${r.pages}</span><button type="button" class="board-button light" ${page>=r.pages?'disabled':''}>다음</button>`;pages.firstElementChild.onclick=()=>{page--;load()};pages.lastElementChild.onclick=()=>{page++;load()};
   }catch(e){if(request!==serial)return;message(status,e.message,true);grid.innerHTML='<button type="button" class="board-button light">다시 불러오기</button>';grid.firstElementChild.onclick=load}finally{if(request===serial)grid.setAttribute('aria-busy','false')}
  }
  form.onsubmit=e=>{e.preventDefault();q=new FormData(form).get('q').trim();page=1;load()};await load();
 }
 app.dataset.mode==='detail'?detail():list();
})();
