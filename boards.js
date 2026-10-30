(() => {
 'use strict';
 const app=document.querySelector('#boardApp');if(!app)return;
 const mode=app.dataset.mode,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=v=>new Date(v).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});
 const api=async(route,body)=>{
  const r=await fetch('/api'+route,{method:body?'POST':'GET',credentials:'same-origin',headers:{'x-ican-request':'1',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  let data;try{data=await r.json()}catch{throw Error('게시판 서버에 연결되지 않았습니다. 연결 상태를 확인해 주세요.')}
  if(!r.ok)throw Object.assign(new Error(data.error||'요청을 처리할 수 없습니다.'),{status:r.status});return data;
 };
 const message=(host,text,error=false)=>{host.textContent=text;host.className='board-message'+(error?' error':'');};
 async function submit(form,fn){
  if(form.dataset.busy)return;form.dataset.busy='1';const button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');
  button.disabled=true;message(status,'처리 중입니다…');
  try{await fn(Object.fromEntries(new FormData(form)))}catch(e){message(status,e.message,true)}finally{button.disabled=false;delete form.dataset.busy}
 }
 function dialog(title,body){
  const element=document.createElement('dialog');element.className='board-dialog';
  element.innerHTML=`<header><h2>${esc(title)}</h2><button type="button" class="board-close" aria-label="닫기">×</button></header><div class="board-dialog-body">${body}</div>`;
  const focus=document.activeElement;document.body.append(element);element.querySelector('.board-close').onclick=()=>element.close();
  element.addEventListener('close',()=>{element.remove();focus?.focus()});element.showModal();return element;
 }
 const statusBadge=i=>`<span class="board-badge ${i.status==='answered'?'answered':''}">${i.status==='answered'?'답변 완료':'답변 대기'}</span>`;
 const inquiryDetail=i=>`<div class="board-detail-meta">${esc(i.name)} · ${date(i.createdAt)} ${statusBadge(i)}</div><h3>${esc(i.title)}</h3><div class="board-prose">${esc(i.body)}</div><section class="board-answer"><h3>관리자 답변</h3>${i.reply?`<p class="board-detail-meta">${date(i.repliedAt)}</p><div class="board-prose">${esc(i.reply)}</div>`:'<p>문의 내용을 확인하고 있습니다. 답변이 등록되면 이곳에서 확인하실 수 있습니다.</p>'}</section>`;
 async function publicBoard(){
  const label=mode==='faq'?'자주 묻는 질문':'공지사항';let page=1,q='',serial=0;
  app.innerHTML=`<div class="board-heading"><div><p class="structure-kicker purple">CAMP BOARD</p><h2>${label}</h2><p>관리자가 등록한 캠프 안내를 확인하세요.</p></div><a class="board-text-link" href="inquiry.html">1:1 문의하기 →</a></div><form class="board-search"><label for="boardSearch">게시물 검색</label><div><input id="boardSearch" name="q" maxlength="100" placeholder="제목 또는 내용 검색"><button class="board-button" type="submit">검색</button></div></form><p id="boardStatus" role="status"></p><div id="boardRows"></div><nav class="board-pages" aria-label="게시판 페이지"></nav>`;
  const form=app.querySelector('form'),status=app.querySelector('#boardStatus'),rows=app.querySelector('#boardRows'),pages=app.querySelector('.board-pages');
  async function load(){
   const request=++serial;message(status,'게시물을 불러오는 중입니다…');
   try{
    const r=await api('/website/posts?'+new URLSearchParams({kind:mode,q,page}));if(request!==serial)return;page=r.page;
    message(status,`총 ${r.total}건`);
    rows.innerHTML=`<div class="board-table"><table><caption class="board-sr">${label} 목록</caption><thead><tr><th class="board-number" scope="col">번호</th><th scope="col">제목</th><th class="board-date" scope="col">등록일</th></tr></thead><tbody>${r.items.map((p,i)=>`<tr><td class="board-number">${p.pinned?'<span class="board-badge">공지</span>':r.total-(page-1)*10-i}</td><td><button class="board-title" type="button" data-post="${esc(p.id)}">${esc(p.title)}</button></td><td class="board-date">${date(p.createdAt)}</td></tr>`).join('')||`<tr><td colspan="3" class="board-empty">${q?'검색 결과가 없습니다.':'등록된 게시물이 없습니다.'}</td></tr>`}</tbody></table></div>`;
    rows.querySelectorAll('[data-post]').forEach(button=>button.onclick=()=>{const p=r.items.find(x=>x.id===button.dataset.post);dialog(p.title,`<p class="board-detail-meta">관리자 · ${date(p.createdAt)}</p><div class="board-prose">${esc(p.body)}</div>`)});
    pages.innerHTML=`<button type="button" class="board-button light" id="boardPrev" ${page<=1?'disabled':''}>이전</button><span>${page} / ${r.pages}</span><button type="button" class="board-button light" id="boardNext" ${page>=r.pages?'disabled':''}>다음</button>`;
    pages.querySelector('#boardPrev').onclick=()=>{page--;load()};pages.querySelector('#boardNext').onclick=()=>{page++;load()};
   }catch(e){if(request!==serial)return;message(status,e.message,true);rows.innerHTML='<button class="board-button light" type="button">다시 불러오기</button>';pages.innerHTML='';rows.querySelector('button').onclick=load}
  }
  form.onsubmit=e=>{e.preventDefault();q=new FormData(form).get('q');page=1;load()};await load();
 }
 function inquiries(){
  app.innerHTML=`<div class="board-heading"><div><p class="structure-kicker purple">PRIVATE INQUIRY</p><h2>1:1 문의하기</h2><p>남겨주신 문의는 작성자와 관리자만 확인할 수 있습니다.</p></div></div><div class="inquiry-columns"><section class="board-card"><h3>새 문의 남기기</h3><form id="inquiryForm" class="board-form"><label>이름<input name="name" autocomplete="name" minlength="2" maxlength="30" required></label><label>문의 제목<input name="title" minlength="2" maxlength="150" required></label><label>문의 내용<textarea name="body" rows="7" minlength="5" maxlength="10000" required placeholder="캠프 운영에 대해 궁금한 점을 남겨주세요."></textarea></label><label>조회 비밀번호<input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required aria-describedby="inquiryPasswordHelp"></label><p class="board-help" id="inquiryPasswordHelp">영문과 숫자를 포함해 10자 이상 입력하세요. 접수번호와 함께 답변 조회에 사용됩니다.</p><p class="board-help">이름과 문의 내용은 문의 처리 및 답변 조회를 위해 서버에 저장됩니다. 접수일로부터 90일 동안 조회할 수 있습니다. 주민등록번호 등 민감한 정보는 입력하지 마세요.</p><label class="board-check"><input type="checkbox" name="agree" required> 문의 정보 저장 안내를 확인했습니다.</label><p role="status" aria-live="polite"></p><button class="board-button" type="submit">문의 접수하기</button></form><div id="receiptResult"></div></section><section class="board-card"><h3>내 문의·답변 확인</h3><p class="board-help">접수할 때 받은 접수번호와 비밀번호를 입력하세요.</p><form id="lookupForm" class="board-form"><label>접수번호<input name="receipt" maxlength="30" required autocomplete="off" spellcheck="false"></label><label>조회 비밀번호<input name="password" type="password" autocomplete="off" maxlength="128" required></label><p role="status" aria-live="polite"></p><button class="board-button light" type="submit">답변 확인하기</button></form></section></div>`;
  const create=app.querySelector('#inquiryForm'),lookup=app.querySelector('#lookupForm');
  create.onsubmit=e=>{e.preventDefault();submit(create,async b=>{
   const r=await api('/website/inquiries',{...b,agree:b.agree==='on'});create.reset();create.hidden=true;
   const result=app.querySelector('#receiptResult');result.innerHTML=`<div class="board-receipt" tabindex="-1"><h3>문의가 접수되었습니다.</h3><p>접수번호를 꼭 보관해 주세요. 분실하면 문의를 조회하기 어렵습니다.</p><code>${esc(r.receipt)}</code><p class="board-help">답변은 ‘내 문의·답변 확인’에서 확인할 수 있습니다.</p><button class="board-button light" type="button">새 문의 작성</button></div>`;
   lookup.elements.receipt.value=r.receipt;result.querySelector('button').onclick=()=>{result.innerHTML='';create.hidden=false;create.elements.name.focus()};result.firstElementChild.focus();
  })};
  lookup.onsubmit=e=>{e.preventDefault();submit(lookup,async b=>{const r=await api('/website/inquiries/lookup',b);message(lookup.querySelector('[role=status]'),'문의를 확인했습니다.');lookup.elements.password.value='';dialog('내 문의·답변',inquiryDetail(r.inquiry))})};
 }
 async function admin(){
  let state,tab='notice';
  async function refresh(){state=await api('/website/admin/state');render()}
  function login(){
   app.innerHTML='<section class="board-card board-login"><h2>홈페이지 관리자 로그인</h2><form class="board-form"><label>아이디<input name="phone" value="admin" autocomplete="username" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label><p role="status"></p><button class="board-button" type="submit">로그인</button></form></section>';
   const f=app.querySelector('form');f.onsubmit=e=>{e.preventDefault();submit(f,async b=>{await api('/auth/login',b);await refresh()})};
  }
  function editor(post={kind:tab,published:false,pinned:false}){
   const d=dialog(post.id?'게시물 수정':'게시물 등록',`<form class="board-form"><label>게시판<select name="kind"><option value="notice" ${post.kind==='notice'?'selected':''}>공지사항</option><option value="faq" ${post.kind==='faq'?'selected':''}>자주 묻는 질문</option></select></label><label>제목<input name="title" maxlength="150" required value="${esc(post.title)}"></label><label>내용<textarea name="body" rows="12" maxlength="20000" required>${esc(post.body)}</textarea></label><label class="board-check"><input type="checkbox" name="published" ${post.published?'checked':''}> 홈페이지에 공개</label><label class="board-check"><input type="checkbox" name="pinned" ${post.pinned?'checked':''}> 목록 상단에 고정</label><p role="status"></p><button class="board-button" type="submit">저장하기</button></form>`);
   const f=d.querySelector('form');f.onsubmit=e=>{e.preventDefault();submit(f,async b=>{await api('/website/admin/posts',{...b,action:'save',id:post.id,version:post.version,published:b.published==='on',pinned:b.pinned==='on'});d.close();await startRefresh()})};
  }
  function reply(i){
   const d=dialog('1:1 문의 답변',inquiryDetail(i)+`<form class="board-form"><label>답변 작성<textarea name="reply" rows="7" maxlength="10000" required>${esc(i.reply)}</textarea></label><p role="status"></p><button class="board-button" type="submit">답변 저장</button></form>`);
   const f=d.querySelector('form');f.onsubmit=e=>{e.preventDefault();submit(f,async b=>{await api('/website/admin/reply',{id:i.id,version:i.version,reply:b.reply});d.close();await startRefresh()})};
  }
  function tourEditor(post={region:'pyeongchang',published:false}){
   let image=post.image||'',loading=false;
   const d=dialog(post.id?'관광지 수정':'관광지 등록',`<form class="board-form"><label>지역<select name="region"><option value="pyeongchang" ${post.region==='pyeongchang'?'selected':''}>평창</option><option value="gangneung" ${post.region==='gangneung'?'selected':''}>강릉</option></select></label><label>관광지명<input name="title" maxlength="100" required value="${esc(post.title)}"></label><label>소개<textarea name="body" rows="6" maxlength="10000" required>${esc(post.body)}</textarea></label><label>주소<input name="address" maxlength="200" value="${esc(post.address)}"></label><div class="tour-upload"><label>대표 사진<input type="file" accept="image/jpeg,image/png,image/webp" id="tourFile"></label><p class="board-help">JPG·PNG·WebP, 최대 10MB. 등록 시 웹에 맞는 크기로 저장됩니다.</p><img class="tour-preview" alt="선택한 대표 사진" ${image?`src="${esc(image)}"`:'hidden'}><button type="button" class="board-button light" id="clearPhoto">사진 지우기</button><p id="photoStatus" aria-live="polite"></p></div><label class="board-check"><input type="checkbox" name="published" ${post.published?'checked':''}> 홈페이지에 공개</label><p role="status" id="tourSaveStatus"></p><button class="board-button" type="submit">저장하기</button></form>`);
   const f=d.querySelector('form'),preview=d.querySelector('img'),file=d.querySelector('#tourFile'),photoStatus=d.querySelector('#photoStatus');
   file.onchange=async()=>{
    const selected=file.files[0];if(!selected)return;loading=true;f.querySelector('[type=submit]').disabled=true;
    try{
     if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>10*1024*1024)throw Error('10MB 이하의 JPG·PNG·WebP 사진을 선택해 주세요.');
     const bitmap=await createImageBitmap(selected);const canvas=document.createElement('canvas');let size=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
     let result='';for(let attempt=0;attempt<8;attempt++){canvas.width=Math.max(1,Math.round(bitmap.width*size));canvas.height=Math.max(1,Math.round(bitmap.height*size));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);result=canvas.toDataURL('image/jpeg',.8);if(result.length<=280000)break;size*=.75}bitmap.close();
     if(result.length>280000)throw Error('사진을 줄이지 못했습니다. 더 작은 사진을 선택해 주세요.');
     image=result;preview.src=image;preview.hidden=false;message(photoStatus,'사진이 준비되었습니다. 저장하기를 눌러 반영하세요.');
    }catch(e){message(photoStatus,e.message,true)}finally{loading=false;f.querySelector('[type=submit]').disabled=false;file.value=''}
   };
   d.querySelector('#clearPhoto').onclick=()=>{if(loading)return;image='';preview.removeAttribute('src');preview.hidden=true;message(photoStatus,'사진을 제거했습니다. 저장하기를 눌러 반영하세요.')};
   f.onsubmit=e=>{e.preventDefault();if(loading)return;submit(f,async b=>{await api('/website/admin/tourism',{...b,image,action:'save',id:post.id,version:post.version,published:b.published==='on'});d.close();await startRefresh()})};
  }
  function remove(p){
   const d=dialog('게시물 삭제',`<p>‘${esc(p.title)}’ 게시물을 목록에서 삭제할까요?</p><form class="board-form"><p role="status"></p><button class="board-button" type="submit">삭제하기</button></form>`);
   const f=d.querySelector('form');f.onsubmit=e=>{e.preventDefault();submit(f,async()=>{await api(tab==='tourism'?'/website/admin/tourism':'/website/admin/posts',{action:'delete',id:p.id,version:p.version});d.close();await startRefresh()})};
  }
  function render(){
   app.innerHTML=`<div class="board-heading"><div><p class="structure-kicker purple">WEBSITE ADMIN</p><h2>홈페이지 콘텐츠 관리</h2><p>게시물과 지역 관광을 관리하고, 접수된 문의에 답변하세요.</p></div><button class="board-button light" id="logout" type="button">로그아웃</button></div><div class="board-tabs" aria-label="관리 항목">${[['notice','공지사항'],['faq','자주 묻는 질문'],['inquiry','1:1 문의'],['tourism','지역 관광']].map(([id,label])=>`<button type="button" data-tab="${id}" class="${id===tab?'selected':''}" aria-pressed="${id===tab}">${label}${id==='inquiry'?` (${state.inquiries.filter(i=>i.status==='waiting').length})`:''}</button>`).join('')}</div><div class="board-toolbar"><button class="board-button light" id="refresh" type="button">새로고침</button>${tab!=='inquiry'?'<button class="board-button" id="newPost" type="button">게시물 등록</button>':''}</div><p id="adminStatus" role="status"></p><div class="board-table"><table><thead><tr><th>제목</th><th>상태</th><th class="board-date">등록일</th><th>관리</th></tr></thead><tbody>${tab==='inquiry'?state.inquiries.map(i=>`<tr><td>${esc(i.title)}<small class="board-author">${esc(i.name)}</small></td><td>${statusBadge(i)}</td><td class="board-date">${date(i.createdAt)}</td><td><button type="button" class="board-button light small" data-reply="${esc(i.id)}">확인·답변</button></td></tr>`).join(''):(tab==='tourism'?(state.tourism||[]):state.posts.filter(p=>p.kind===tab)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(p=>`<tr><td>${p.pinned?'<span class="board-badge">상단</span> ':''}${esc(p.title)}</td><td>${p.published?'공개':'비공개'}</td><td class="board-date">${date(p.createdAt)}</td><td><div class="board-actions"><button type="button" class="board-button light small" data-edit="${esc(p.id)}">수정</button><button type="button" class="board-button light small" data-delete="${esc(p.id)}">삭제</button></div></td></tr>`).join('')}</tbody></table></div>`;
   if(!app.querySelector('tbody').children.length)app.querySelector('tbody').innerHTML='<tr><td class="board-empty" colspan="4">등록된 내용이 없습니다.</td></tr>';
   app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
   if(tab==='tourism')app.querySelector('#newPost').textContent='관광지 등록';
   app.querySelector('#newPost')?.addEventListener('click',()=>tab==='tourism'?tourEditor():editor());
   app.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>tab==='tourism'?tourEditor(state.tourism.find(p=>p.id===b.dataset.edit)):editor(state.posts.find(p=>p.id===b.dataset.edit)));
   app.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>remove((tab==='tourism'?state.tourism:state.posts).find(p=>p.id===b.dataset.delete)));
   app.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>reply(state.inquiries.find(i=>i.id===b.dataset.reply)));
   app.querySelector('#refresh').onclick=startRefresh;
   app.querySelector('#logout').onclick=async()=>{try{await api('/auth/logout',{});state=null;login()}catch(e){message(app.querySelector('#adminStatus'),e.message,true)}};
  }
  async function startRefresh(){try{await refresh()}catch(e){if(e.status===401||e.status===403){state=null;login()}else{if(!app.querySelector('#adminStatus'))app.innerHTML='<p id="adminStatus" role="status"></p><button class="board-button" id="retry" type="button">다시 불러오기</button>';message(app.querySelector('#adminStatus'),e.message,true);app.querySelector('#retry')?.addEventListener('click',startRefresh)}}}
  await startRefresh();
 }
 if(mode==='inquiry')inquiries();else if(mode==='admin')admin();else publicBoard();
})();
