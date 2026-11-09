(() => {
 'use strict';
 const app=document.querySelector('#applicationApp');if(!app)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const camps={family:'가족 캠프',general:'일반 캠프',soohorang:'수호랑캠프 (기존)',bandabi:'기존 캠프'},statuses={received:'접수 완료',reviewing:'검토 중',confirmed:'참가 확정',cancelled:'신청 취소'};
 const regions=['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
 const field=(name,label,options='')=>`<label class="application-field"><span>${label}</span><input name="${name}" ${options}></label>`;
 const applicantNameField=()=>field('applicantName','이름 <i>필수</i>','autocomplete="name" maxlength="40" required placeholder="신청자 이름"');
 const mobileField=label=>field('mobile',label+' <i>필수</i>','type="tel" autocomplete="tel" maxlength="30" required placeholder="010-0000-0000"');
 const counter=(name,label)=>field(name,label,`type="number" min="0" max="10000" step="1" value="0" required inputmode="numeric" data-count`);
 const section=(title,description,body,camp='')=>`<section class="application-section" ${camp?`data-camp-fields="${camp}" hidden`:''}><div class="application-section-title"><span></span><div><h2>${title}</h2><p>${description}</p></div></div>${body}</section>`;
 const isFamilyApplication=p=>p.camp==='family'&&Array.isArray(p.minorMaleAges);
 const familyCount=(name,label)=>field(name,label,'type="number" min="0" max="100" step="1" value="0" required inputmode="numeric"');
 const ages=Array.from({length:19},(_,age)=>`<option value="${age}">만 ${age}세</option>`).join('');
 const message=(element,value,error=false)=>{element.textContent=value;element.className='board-message'+(error?' error':'')};
 async function api(route,body){
  let response;try{response=await fetch('/api/website/'+route,{method:body?'POST':'GET',credentials:'same-origin',headers:{'x-ican-request':'1',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}catch{throw Error('연결 상태를 확인하고 다시 시도해 주세요. 입력 내용은 유지됩니다.')}
  let data;try{data=await response.json()}catch{throw Error('접수 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')}
  if(!response.ok)throw Object.assign(new Error(data.error||'요청을 처리하지 못했습니다.'),{status:response.status});return data;
 }
 function dialog(title,content){
  const element=document.createElement('dialog'),focus=document.activeElement;element.className='board-dialog application-dialog';element.innerHTML=`<header><h2>${esc(title)}</h2><button class="board-close" type="button" aria-label="닫기">×</button></header><div class="board-dialog-body">${content}</div>`;document.body.append(element);element.querySelector('.board-close').onclick=()=>element.close();element.addEventListener('close',()=>{element.remove();focus?.focus()});element.showModal();return element;
 }
 function summary(p){
  const row=(label,value)=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
  const people=(male,female)=>`남 ${male}명 / 여 ${female}명 · 총 ${Number(male)+Number(female)}명`;
  const minorAges=values=>values.map(age=>`만 ${age}세`).join(', ');
  const participants=isFamilyApplication(p)
   ?row('어른 인원',people(p.adultMale,p.adultFemale))+row('미성년자 인원',people(p.minorMale,p.minorFemale))
    +(p.minorMaleAges.length?row('미성년자 남 나이',minorAges(p.minorMaleAges)):'')
    +(p.minorFemaleAges.length?row('미성년자 여 나이',minorAges(p.minorFemaleAges)):'')
   :row('학생 인원',people(p.studentMale,p.studentFemale))+row('인솔자 인원',people(p.teacherMale,p.teacherFemale))
    +row('학생 구분',`비장애학생 ${p.nonDisabled}명 · 장애학생 ${p.disabled}명 · 그 외 배려계층 ${p.other}명`)
    +row('농어촌소규모',p.rural?'해당':'해당 없음')+row('합동 참여',p.combined?'가능':'불가');
  return `<dl class="application-summary">${row('캠프명',camps[p.camp]||p.camp)}${p.schoolName?row('학교·기관',p.schoolName+' · '+p.region):''}${row('신청자',p.applicantName)}${row('휴대폰번호',p.mobile)}${p.telephone?row('연락처',p.telephone):''}${p.email?row('이메일',p.email):''}${participants}${(p.dates||[]).map((d,i)=>row('희망 날짜 '+(i+1),d.start+' ~ '+d.end)).join('')}${p.notes?row('특이사항',p.notes):''}${p.status?row('진행 상태',statuses[p.status]||p.status):''}</dl>`;
 }
 function apply(){
  app.innerHTML=`<form id="campApplicationForm" class="application-form">${section('캠프 선택','참가를 희망하는 캠프를 선택해 주세요.',`<fieldset class="application-camps"><legend class="board-sr">캠프명 (필수)</legend><label class="camp-choice"><input type="radio" name="camp" value="family" required><span><small>FAMILY CAMP</small><strong>가족 캠프</strong><em>가족이 함께 참여하는 캠프</em></span><b aria-hidden="true">✓</b></label><label class="camp-choice general-choice"><input type="radio" name="camp" value="general" required><span><small>GENERAL CAMP</small><strong>일반 캠프</strong><em>일반 참가자를 위한 캠프</em></span><b aria-hidden="true">✓</b></label></fieldset>`)}
  ${section('신청자 정보','캠프 일정 협의와 신청내역 확인에 사용할 정보입니다.',`<div class="application-grid">${applicantNameField()}${field('password','조회 비밀번호 <i>필수</i>','type="password" autocomplete="new-password" minlength="8" maxlength="128" required aria-describedby="applyPasswordHelp" placeholder="영문·숫자 포함 8자 이상"')}${mobileField('연락처')}<div id="applicationEmailField" hidden>${field('email','이메일 <i>필수</i>','type="email" autocomplete="email" maxlength="254" placeholder="example@school.kr" disabled')}</div></div><p class="application-help" id="applyPasswordHelp">조회 비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.</p><p class="application-help"><a href="application-status.html">참가신청 확인·조회</a>는 이름, 휴대폰번호, 조회 비밀번호로 할 수 있습니다.</p>`)}
  ${section('학교·기관 정보','참가하는 학교 또는 기관의 정보를 입력해 주세요.',`<div class="application-grid"><label class="application-field"><span>지역(도/시) <i>필수</i></span><select name="region" required><option value="">지역을 선택해 주세요</option>${regions.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></label>${field('schoolName','학교·기관명 <i>필수</i>','autocomplete="organization" maxlength="100" required placeholder="학교 또는 기관 이름"')}</div><fieldset class="application-inline"><legend>농어촌소규모 여부 <i>필수</i></legend><label><input type="radio" name="rural" value="no" required> 해당 없음</label><label><input type="radio" name="rural" value="yes" required> 농어촌소규모</label></fieldset>`,'general')}
  ${section('참가 인원','학생과 인솔자 인원을 나누어 입력해 주세요.',`<div class="application-grid"><fieldset class="application-count-card"><legend>학생 인원</legend><div class="application-grid">${counter('studentMale','남학생')}${counter('studentFemale','여학생')}</div><div class="application-total">전체 학생 <output id="studentTotal" aria-live="polite">0</output><span>명</span></div></fieldset><fieldset class="application-count-card"><legend>인솔자(선생님) 인원</legend><div class="application-grid">${counter('teacherMale','남자 인솔자')}${counter('teacherFemale','여자 인솔자')}</div><div class="application-total">전체 인솔자 <output id="teacherTotal" aria-live="polite">0</output><span>명</span></div></fieldset></div><div class="application-classification"><h3>학생 구분 <small>해당하는 인원만 입력해 주세요.</small></h3><div class="application-grid thirds">${counter('nonDisabled','비장애학생')}${counter('disabled','장애학생')}${counter('other','그 외 배려계층')}</div></div>`,'general')}
  ${section('참가 인원','어른과 미성년자 인원을 입력하고 미성년자의 만 나이를 선택해 주세요.',`<div class="application-grid">
   <fieldset class="application-count-card"><legend>참여인원(어른)</legend><div class="application-grid">${familyCount('adultMale','남')}${familyCount('adultFemale','여')}</div></fieldset>
   <fieldset class="application-count-card"><legend>참여인원(미성년자)</legend><div class="application-grid">${familyCount('minorMale','남')}${familyCount('minorFemale','여')}</div><div class="application-grid application-minor-ages"><div data-ages="minorMale"></div><div data-ages="minorFemale"></div></div></fieldset>
  </div>`,'family')}
  ${section('희망 날짜','참가를 희망하는 날짜를 순서대로 입력해 주세요.',`<div data-camp-fields="general" hidden><fieldset class="application-inline"><legend>다른 학교·기관과 합동 참여 <i>필수</i></legend><label><input type="radio" name="combined" value="yes" required> 가능</label><label><input type="radio" name="combined" value="no" required> 불가</label></fieldset></div><div class="application-dates">${[1,2,3].map(i=>`<div class="application-date-row" ${i===3?'data-camp-fields="general" hidden':''}><span>${i}순위 ${i===1?'<i>필수</i>':'<small>선택</small>'}</span><div>${field('start'+i,i+'순위 시작일',`type="date" min="${today}" ${i===1?'required':''}`)}<span class="date-separator" aria-hidden="true">~</span>${field('end'+i,i+'순위 종료일',`type="date" min="${today}" ${i===1?'required':''}`)}</div></div>`).join('')}</div><label class="application-field application-notes">특이사항<textarea name="notes" rows="5" maxlength="5000" placeholder="일정이나 운영과 관련해 전달할 요청사항을 입력해 주세요."></textarea></label>`)}
  ${section('개인정보 수집·이용 동의','신청에 필요한 정보의 이용 안내를 확인해 주세요.',`<div class="application-privacy"><h3>참가신청 정보 이용 안내</h3><dl><div><dt>이용 목적</dt><dd>참가신청 접수·확인, 일정 및 운영사항 협의</dd></div><div><dt>수집 항목</dt><dd>신청자 이름·휴대폰번호·조회 비밀번호, 참가 인원, 희망 날짜 및 요청사항. 가족 캠프는 미성년자 만 나이, 일반 캠프는 이메일과 학교·기관 정보를 추가로 받습니다.</dd></div><div><dt>보관 기간</dt><dd>접수일로부터 90일</dd></div><div><dt>동의 안내</dt><dd>동의를 거부할 수 있으며, 동의하지 않으면 온라인 신청이 어렵습니다.</dd></div></dl></div><label class="application-consent"><input name="agree" type="checkbox" required><span>개인정보 수집·이용 안내를 확인하고 동의합니다. <i>필수</i></span></label>`)}
  <div class="application-submit"><p>입력하신 내용을 확인한 후 참가신청을 진행해 주세요.</p><p role="status" id="applicationStatus" aria-live="polite"></p><button type="submit" class="application-primary">신청내용 확인하기 <span aria-hidden="true">→</span></button></div></form>`;
  const form=app.querySelector('form');let requestId,previousPayload;
  const emailField=form.querySelector('#applicationEmailField');
  const campFields=form.querySelectorAll('[data-camp-fields]');
  const familyCounts=['adultMale','adultFemale','minorMale','minorFemale'];
  const generalCounts=['studentMale','studentFemale','teacherMale','teacherFemale','nonDisabled','disabled','other'];
  const ageGroups=['minorMale','minorFemale'];
  const dateRanks=()=>form.elements.camp.value==='general'?[1,2,3]:[1,2];
  function syncCamp(){
   const camp=form.elements.camp.value;
   const isGeneral=camp==='general';
   emailField.hidden=!isGeneral;
   form.elements.email.disabled=!isGeneral;
   form.elements.email.required=isGeneral;
   for(const group of campFields){
    group.hidden=group.dataset.campFields!==camp;
    for(const input of group.querySelectorAll('input,select'))input.disabled=group.hidden;
   }
   const visibleSteps=form.querySelectorAll(':scope > .application-section:not([hidden]) > .application-section-title > span');
   visibleSteps.forEach((step,index)=>{step.textContent=String(index+1).padStart(2,'0')});
  }
  function syncAges(name){
   const group=form.querySelector(`[data-ages="${name}"]`);
   const count=Math.min(100,Math.max(0,Math.floor(Number(form.elements[name].value))));
   const gender=name==='minorMale'?'남':'여';
   while(group.children.length>count)group.lastElementChild.remove();
   while(group.children.length<count){
    const index=group.children.length+1;
    group.insertAdjacentHTML('beforeend',`<label class="application-field"><span>미성년자 ${gender} ${index} 만 나이</span><select name="${name}Ages" required><option value="">선택</option>${ages}</select></label>`);
   }
  }
  form.addEventListener('change',event=>{if(event.target.name==='camp')syncCamp()});
  syncCamp();
  const number=name=>Number(form.elements[name].value);
  function totals(){app.querySelector('#studentTotal').value=number('studentMale')+number('studentFemale');app.querySelector('#teacherTotal').value=number('teacherMale')+number('teacherFemale')}
  form.addEventListener('input',event=>{
   for(const input of form.querySelectorAll('input'))input.setCustomValidity('');
   if(ageGroups.includes(event.target.name))syncAges(event.target.name);
   for(const i of dateRanks())form.elements['end'+i].min=form.elements['start'+i].value||today;
   totals();
  });
  function payload(){
   const fields=new FormData(form),b=Object.fromEntries(fields);
   if(b.camp==='family'){
    for(const key of familyCounts)b[key]=Number(b[key]);
    for(const name of ageGroups)b[name+'Ages']=fields.getAll(name+'Ages').map(value=>value===''?null:Number(value));
   }else{
    for(const key of generalCounts)b[key]=Number(b[key]);
    b.rural=b.rural==='yes';b.combined=b.combined==='yes';
   }
   b.dates=dateRanks().map(i=>({start:b['start'+i],end:b['end'+i]})).filter(d=>d.start||d.end);
   b.agree=b.agree==='on';b.consentVersion='application-v2';return b;
  }
  function validate(){
   const e=form.elements;
   syncCamp();
   if(e.camp.value==='family'){
    for(const name of ageGroups)syncAges(name);
    const total=familyCounts.reduce((sum,name)=>sum+number(name),0);
    e.adultMale.setCustomValidity(total<1||total>100?'참여인원은 총 1~100명으로 입력해 주세요.':'');
   }else{
    const total=number('studentMale')+number('studentFemale');
    e.studentMale.setCustomValidity(total<1?'학생 인원을 1명 이상 입력해 주세요.':total>10000?'학생 합계는 10,000명 이하로 입력해 주세요.':'');
    e.teacherMale.setCustomValidity(number('teacherMale')+number('teacherFemale')>10000?'인솔자 합계는 10,000명 이하로 입력해 주세요.':'');
    for(const key of ['nonDisabled','disabled','other'])e[key].setCustomValidity(number(key)>total?'학생 구분별 인원은 전체 학생 인원을 넘을 수 없습니다.':'');
   }
   e.mobile.setCustomValidity(/^01[016789]\d{7,8}$/.test(e.mobile.value.replace(/[\s()-]/g,''))?'':'휴대폰 번호를 확인해 주세요.');
   e.password.setCustomValidity(e.password.value.length>=8&&/[A-Za-z]/.test(e.password.value)&&/\d/.test(e.password.value)?'':'조회 비밀번호는 영문과 숫자를 포함해 8자 이상 입력해 주세요.');
   const seen=new Set();for(const i of dateRanks()){const start=e['start'+i],end=e['end'+i];start.setCustomValidity(!start.value&&end.value?'시작일을 입력해 주세요.':'');end.setCustomValidity(start.value&&!end.value?'종료일을 입력해 주세요.':start.value&&end.value<start.value?'종료일은 시작일보다 빠를 수 없습니다.':'');if(start.value&&end.value){const key=start.value+'~'+end.value;if(seen.has(key))start.setCustomValidity('동일한 희망 날짜를 중복 입력할 수 없습니다.');seen.add(key)}}
   return form.reportValidity();
  }
  form.onsubmit=event=>{event.preventDefault();if(!validate())return;const data=payload();
   const preview=window.ICAN_DESIGN_PREVIEW===true;
   const d=dialog('신청내용 확인',summary(data)+`<p class="application-help">접수 후 운영사무국의 일정 협의를 거쳐 참가가 확정됩니다.</p>${preview?'<p class="board-message">현재 페이지는 디자인 미리보기입니다. 실제 접수와 정보 전송은 진행되지 않습니다.</p>':''}<p role="status" aria-live="polite"></p><div class="application-dialog-actions"><button type="button" class="board-button light" id="editApplication">수정하기</button><button type="button" class="board-button" id="sendApplication" ${preview?'disabled':''}>${preview?'실제 접수는 운영 사이트에서':'참가신청 접수하기'}</button></div>`);
   d.querySelector('#editApplication').onclick=()=>d.close();const send=d.querySelector('#sendApplication');
   send.onclick=async()=>{if(send.disabled)return;send.disabled=true;const output=d.querySelector('[role=status]');message(output,'신청을 접수하는 중입니다…');
    try{const serialized=JSON.stringify(data);if(serialized!==previousPayload){requestId=crypto.randomUUID();previousPayload=serialized}const r=await api('applications',{...data,requestId});d.close();form.reset();
     app.innerHTML=`<section class="application-success" tabindex="-1"><span aria-hidden="true">✓</span><h2>참가신청이 접수되었습니다.</h2><p>참가 확정 여부와 진행 상태는 이름, 휴대폰번호, 조회 비밀번호로 확인할 수 있습니다.</p><p>접수번호도 함께 보관해 주세요.</p><strong class="application-receipt">${esc(r.receipt)}</strong><a class="application-primary" href="application-status.html">신청내역 확인하기 →</a></section>`;app.firstElementChild.focus();
    }catch(error){message(output,error.message,true);send.disabled=false}
   };
  };totals();
 }
 function lookup(){
  const preview=window.ICAN_DESIGN_PREVIEW===true;
  const lookupPassword=field('password','조회 비밀번호 <i>필수</i>','type="password" required maxlength="128" autocomplete="off"');
  const lookupAction=`<p role="status" aria-live="polite"></p><button type="submit" class="application-primary" ${preview?'disabled':''}>신청내역 조회하기 →</button>`;
  app.innerHTML=`<section class="application-lookup"><div><p class="structure-kicker purple">CHECK YOUR APPLICATION</p><h2>신청내역 확인</h2><p>신청할 때 입력한 이름, 휴대폰번호, 조회 비밀번호를 입력해 주세요.</p>${preview?'<p class="application-help">공유용 미리보기에서는 실제 신청내역을 조회할 수 없습니다.</p>':''}</div><form class="application-form">${applicantNameField()}${mobileField('휴대폰번호')}${lookupPassword}${lookupAction}</form></section>
  <details class="application-section application-lookup-fallback"><summary>접수번호로 조회하기</summary><form class="application-form">${field('receipt','접수번호','required maxlength="30" autocomplete="off" spellcheck="false" placeholder="접수 시 발급된 번호"')}${lookupPassword}${lookupAction}</form></details><div id="applicationResult"></div>`;
  const forms=app.querySelectorAll('form'),result=app.querySelector('#applicationResult');
  const buttons=app.querySelectorAll('button[type=submit]');
  for(const form of forms)form.onsubmit=async event=>{
   event.preventDefault();
   const status=form.querySelector('[role=status]');
   if(preview||form.querySelector('button').disabled)return;
   for(const button of buttons)button.disabled=true;
   for(const field of app.querySelectorAll('[role=status]'))message(field,'');
   message(status,'신청내역을 확인하고 있습니다.');
   result.replaceChildren();
   try{
    const response=await api('applications/lookup',Object.fromEntries(new FormData(form)));
    for(const other of forms)other.elements.password.value='';
    const items=response.applications??[response.application];
    result.innerHTML=`<section class="application-section"><h2>내 신청내역</h2>${items.map(item=>summary(item)).join('')}</section>`;
    message(status,`신청내역 ${items.length}건을 확인했습니다.`);
   }catch(error){
    message(status,error.message,true);
   }finally{
    for(const button of buttons)button.disabled=false;
   }
  };
 }
 async function admin(){
  let items=[];
  function login(){app.innerHTML=`<section class="board-card board-login"><h2>참가신청 관리자 로그인</h2><form class="board-form">${field('phone','아이디','value="admin" autocomplete="username" required')}${field('password','비밀번호','type="password" autocomplete="current-password" required')}<p role="status"></p><button class="board-button" type="submit">로그인</button></form></section>`;const form=app.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-ican-request':'1'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await r.json();if(!r.ok)throw Error(data.error);await load()}catch(error){message(form.querySelector('[role=status]'),error.message,true)}finally{button.disabled=false}}}
  async function load(){try{items=(await api('admin/applications')).items;render()}catch(error){if(error.status===401||error.status===403)login();else{app.innerHTML='<p role="status"></p><button class="board-button">다시 불러오기</button>';message(app.querySelector('[role=status]'),error.message,true);app.querySelector('button').onclick=load}}}
  function render(){
   const tableRow=p=>{
    const applicant=p.schoolName?`${esc(p.schoolName)}<small class="board-author">${esc(p.applicantName)}</small>`:esc(p.applicantName);
    const participants=isFamilyApplication(p)?`어른 ${p.adultTotal}명 / 미성년자 ${p.minorTotal}명`:`학생 ${p.studentTotal}명 / 인솔자 ${p.teacherTotal}명`;
    return `<tr><td>${applicant}</td><td>${camps[p.camp]}</td><td>${participants}</td><td>${statuses[p.status]}</td><td><button class="board-button light small" data-application="${esc(p.id)}">상세·상태 변경</button></td></tr>`;
   };
   app.innerHTML=`<div class="board-heading"><div><h2>참가신청 관리</h2><p>접수된 신청 내용을 확인하고 진행 상태를 관리하세요.</p></div><a class="board-button light" href="website-admin.html">콘텐츠 관리로</a></div><div class="board-toolbar"><button class="board-button light" id="refreshApplications">새로고침</button></div><div class="board-table"><table><thead><tr><th>신청자 / 학교·기관</th><th>캠프</th><th>인원</th><th>상태</th><th>관리</th></tr></thead><tbody>${items.map(tableRow).join('')||'<tr><td colspan="5" class="board-empty">접수된 신청이 없습니다.</td></tr>'}</tbody></table></div>`;
   app.querySelector('#refreshApplications').onclick=load;app.querySelectorAll('[data-application]').forEach(button=>button.onclick=()=>{const p=items.find(p=>p.id===button.dataset.application),d=dialog('참가신청 상세',summary(p)+`<form class="board-form"><label>진행 상태<select name="status">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${p.status===value?'selected':''}>${label}</option>`).join('')}</select></label><p role="status"></p><button class="board-button" type="submit">상태 저장</button></form>`);const form=d.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const save=form.querySelector('button');save.disabled=true;try{await api('admin/applications',{id:p.id,version:p.version,status:form.elements.status.value});d.close();await load()}catch(error){message(form.querySelector('[role=status]'),error.message,true);save.disabled=false}}});
  }await load();
 }
 if(app.dataset.mode==='lookup')lookup();else if(app.dataset.mode==='admin')admin();else apply();
})();
