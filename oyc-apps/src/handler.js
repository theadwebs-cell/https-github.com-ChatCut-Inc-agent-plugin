/* OYC shared booking logic. Runs in the browser (demo mode) AND in Google Apps Script. */
function oycDigits(p){return String(p||'').replace(/\D/g,'').slice(-10)}
function oycNow(){return new Date().toISOString()}
function oycErr(m){return {ok:false,error:m}}
function oycOk(d,dirty){return {ok:true,data:d,dirty:dirty||[]}}
function oycPub(b){var c=JSON.parse(JSON.stringify(b));return c}
function oycForPartner(b){var c=oycPub(b);delete c.otp;return c}
function oycPartnerSafe(p){var c=JSON.parse(JSON.stringify(p));delete c.pin;return c}
function oycHist(b,s,by){b.history=b.history||[];b.history.push({s:s,t:oycNow(),by:by||''});b.status=s;b.updated=oycNow()}

function oycHandle(db,req){
  db.bookings=db.bookings||[];db.partners=db.partners||[];db.settings=db.settings||{};db.devices=db.devices||[];db._notify=[];db.tracking=db.tracking||{};
  function trackOut(b){var t=db.tracking[b.id];return {id:b.id,status:b.status,partnerName:b.partnerName,partnerPhone:b.partnerPhone,lat:b.lat,lng:b.lng,address:b.address,loc:(b.status==='On the way'&&t)?t:null}}
  function note(role,key,title,body,url){if(key)db._notify.push({role:role,key:String(key),title:title,body:body,url:url||''})}
  function svcs(b){return (b.items||[]).map(function(i){return i.name}).join(', ')}
  function when(b){var p=String(b.date||'').split('-'),M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return (p.length===3?(+p[2])+' '+M[+p[1]-1]:(b.date||''))+(b.slot?', '+b.slot:'')}
  var CUST='https://onyourcall.in/oyc-app',PART='https://onyourcall.in/oyc-partner';
  function custNote(b,s,by){var m={'Assigned':['Professional assigned',(b.partnerName||'A professional')+' will handle your booking '+b.id+'.'],'Accepted':['Booking confirmed',(b.partnerName||'Your professional')+' confirmed '+svcs(b)+' for '+when(b)+'.'],'On the way':['Professional on the way',(b.partnerName||'Your professional')+' is on the way. Tap to track live.'],'In progress':['Service started','Your '+svcs(b)+' has started.'],'Completed':['Service completed','Thank you for choosing On Your Call! Tap to rate your experience.'],'Cancelled':['Booking cancelled','Booking '+b.id+' has been cancelled.']}[s];if(m)note('customer',oycDigits(b.phone),m[0],m[1],CUST+'#b='+b.id)}
  var S=db.settings,a=req.action;
  if(!S.adminPin)S.adminPin='1234';
  function findB(id){for(var i=0;i<db.bookings.length;i++)if(db.bookings[i].id===id)return db.bookings[i];return null}
  function findP(id){for(var i=0;i<db.partners.length;i++)if(db.partners[i].id===id)return db.partners[i];return null}
  function authPartner(){var ph=oycDigits(req.phone);for(var i=0;i<db.partners.length;i++){var p=db.partners[i];if(oycDigits(p.phone)===ph&&String(p.pin)===String(req.pin))return p}return null}
  function isAdmin(){return String(req.pin||'')===String(S.adminPin)}
  function newId(){var n=1001+db.bookings.length;var id='OYC'+n;while(findB(id)){n++;id='OYC'+n}return id}
  function makeBooking(src,by){
    var b=req.booking||{};
    if(!b.name||oycDigits(b.phone).length!==10)return oycErr('Please enter name and a 10-digit mobile number');
    if(!b.address)return oycErr('Please add the service address');
    if(!b.items||!b.items.length)return oycErr('Please add at least one service');
    var nb={id:newId(),created:oycNow(),source:src,name:String(b.name).slice(0,80),phone:oycDigits(b.phone),
      address:String(b.address).slice(0,300),landmark:String(b.landmark||'').slice(0,120),lat:b.lat||'',lng:b.lng||'',
      category:b.category||'',items:b.items,total:Number(b.total)||0,date:b.date||'',slot:b.slot||'',
      notes:String(b.notes||'').slice(0,500),payMode:b.payMode||'Pay after service',status:'Pending',
      partnerId:'',partnerName:'',partnerPhone:'',otp:String(Math.floor(1000+Math.random()*9000)),
      amountPaid:'',rating:'',review:'',adminNotes:b.adminNotes||'',updated:oycNow(),history:[]};
    oycHist(nb,'Pending',by);db.bookings.push(nb);return oycOk(oycPub(nb),['bookings'])
  }
  switch(a){
  /* ---------- customer ---------- */
  case 'catalog': return oycOk({prices:S.prices||{},off:S.off||{},wa:S.wa||'',fee:S.fee||0,services:db.services||[]});
  case 'createBooking': return makeBooking('App','customer');
  case 'myBookings': {var ph=oycDigits(req.phone);if(ph.length!==10)return oycErr('Login required');
    return oycOk(db.bookings.filter(function(b){return oycDigits(b.phone)===ph}).map(oycPub).reverse())}
  case 'cancelBooking': {var b=findB(req.id);if(!b||oycDigits(b.phone)!==oycDigits(req.phone))return oycErr('Booking not found');
    if(['Pending','Assigned','Accepted'].indexOf(b.status)<0)return oycErr('This booking can no longer be cancelled in the app. Please call us.');
    oycHist(b,'Cancelled','customer');if(b.partnerId)note('partner',b.partnerId,'Job cancelled','The customer cancelled job '+b.id+' ('+svcs(b)+').',PART);return oycOk(oycPub(b),['bookings'])}
  case 'rateBooking': {var b=findB(req.id);if(!b||oycDigits(b.phone)!==oycDigits(req.phone))return oycErr('Booking not found');
    if(b.status!=='Completed')return oycErr('You can rate after the service is completed');
    b.rating=Math.max(1,Math.min(5,Number(req.rating)||5));b.review=String(req.review||'').slice(0,500);b.updated=oycNow();return oycOk(oycPub(b),['bookings'])}
  /* ---------- partner ---------- */
  case 'partnerApply': {var p=req.partner||{},dc=p.docs||{};if(!p.name||oycDigits(p.phone).length!==10||!/^\d{4}$/.test(String(p.pin||'')))return oycErr('Enter name, 10-digit mobile and a 4-digit PIN');
    var adh=String(p.aadhaar||'').replace(/\D/g,'');if(adh.length!==12)return oycErr('Enter your 12-digit Aadhaar number');
    var ph=p.photo||dc.photo||'',af=p.aadhaarFront||dc.aadhaarFront||'',ab=p.aadhaarBack||dc.aadhaarBack||'';
    if(!ph||!af||!ab)return oycErr('Please upload your passport-size photo and both sides of your Aadhaar card');
    for(var i=0;i<db.partners.length;i++)if(oycDigits(db.partners[i].phone)===oycDigits(p.phone))return oycErr('This mobile number is already registered');
    var np={id:'P'+(101+db.partners.length),name:String(p.name).slice(0,80),phone:oycDigits(p.phone),pin:String(p.pin),skills:String(p.skills||''),zone:String(p.zone||''),status:'Pending',online:'no',joined:oycNow(),notes:String(p.notes||'').slice(0,300),aadhaar:adh,photo:ph,aadhaarFront:af,aadhaarBack:ab};
    while(findP(np.id))np.id='P'+(Number(np.id.slice(1))+1);
    db.partners.push(np);return oycOk(oycPartnerSafe(np),['partners'])}
  case 'partnerLogin': {var p=authPartner();if(!p)return oycErr('Wrong mobile number or PIN');
    if(p.status!=='Active')return oycErr(p.status==='Pending'?'Your registration is under review by OYC. We will call you.':'Your account is not active. Please contact OYC.');
    return oycOk(oycPartnerSafe(p))}
  case 'partnerJobs': {var p=authPartner();if(!p||p.status!=='Active')return oycErr('Session expired. Please log in again.');
    return oycOk({partner:oycPartnerSafe(p),jobs:db.bookings.filter(function(b){return b.partnerId===p.id}).map(oycForPartner).reverse()})}
  case 'partnerOnline': {var p=authPartner();if(!p)return oycErr('Session expired');p.online=req.online?'yes':'no';return oycOk(oycPartnerSafe(p),['partners'])}
  case 'partnerAction': {var p=authPartner();if(!p||p.status!=='Active')return oycErr('Session expired');
    var b=findB(req.id);if(!b||b.partnerId!==p.id)return oycErr('Job not found');
    var act=req.act,who='partner:'+p.name;
    if(act==='accept'){if(b.status!=='Assigned')return oycErr('Job is not waiting for acceptance');oycHist(b,'Accepted',who)}
    else if(act==='decline'){if(['Assigned','Accepted'].indexOf(b.status)<0)return oycErr('Cannot decline now');b.partnerId='';b.partnerName='';b.partnerPhone='';oycHist(b,'Pending','declined by '+p.name)}
    else if(act==='onway'){if(b.status!=='Accepted')return oycErr('Accept the job first');oycHist(b,'On the way',who)}
    else if(act==='start'){if(['Accepted','On the way'].indexOf(b.status)<0)return oycErr('Job cannot be started now');
      if(String(req.otp)!==String(b.otp))return oycErr('Wrong start code. Ask the customer for the 4-digit code shown in their OYC app.');oycHist(b,'In progress',who)}
    else if(act==='complete'){if(b.status!=='In progress')return oycErr('Start the job first');b.amountPaid=Number(req.amount)||b.total;b.payMode=req.mode||b.payMode;oycHist(b,'Completed',who)}
    else return oycErr('Unknown action');
    custNote(b,b.status);
    return oycOk(oycForPartner(b),['bookings'])}
  case 'registerPush': {var tok=String(req.token||'');if(tok.length<20)return oycErr('Invalid device');var role=req.role==='partner'?'partner':'customer',key='';
    if(role==='partner'){var p=authPartner();if(!p)return oycErr('Session expired');key=p.id}else{key=oycDigits(req.phone);if(key.length!==10)return oycErr('Login required')}
    db.devices=db.devices.filter(function(d){return d.token!==tok});db.devices.push({token:tok,role:role,key:key,platform:String(req.platform||''),updated:oycNow()});
    return oycOk({ok:1},['devices'])}
  case 'partnerLocation': {var p=authPartner();if(!p||p.status!=='Active')return oycErr('Session expired');var b=findB(req.id);if(!b||b.partnerId!==p.id)return oycErr('Job not found');
    var la=Number(req.lat),ln=Number(req.lng);if(!isFinite(la)||!isFinite(ln)||Math.abs(la)>90||Math.abs(ln)>180)return oycErr('Bad location');
    if(b.status==='On the way'){db.tracking[b.id]={lat:la.toFixed(6),lng:ln.toFixed(6),acc:Math.round(Number(req.acc)||0),at:oycNow()};db._track=b.id}
    return oycOk({status:b.status})}
  case 'trackBooking': {var b=findB(req.id);if(!b||oycDigits(b.phone)!==oycDigits(req.phone))return oycErr('Booking not found');return oycOk(trackOut(b))}
  /* ---------- admin ---------- */
  case 'adminTrack': {if(!isAdmin())return oycErr('Wrong admin PIN');var b=findB(req.id);if(!b)return oycErr('Booking not found');return oycOk(trackOut(b))}
  case 'adminLogin': return isAdmin()?oycOk({ok:1}):oycErr('Wrong admin PIN');
  case 'adminData': {if(!isAdmin())return oycErr('Wrong admin PIN');var st=JSON.parse(JSON.stringify(S));delete st.adminPin;
    return oycOk({bookings:db.bookings.map(oycPub).reverse(),partners:db.partners.map(function(p){return JSON.parse(JSON.stringify(p))}),settings:st,services:db.services||[]})}
  case 'adminCreateBooking': {if(!isAdmin())return oycErr('Wrong admin PIN');return makeBooking(req.booking&&req.booking.source||'WhatsApp','admin')}
  case 'adminUpdateBooking': {if(!isAdmin())return oycErr('Wrong admin PIN');var b=findB(req.id);if(!b)return oycErr('Booking not found');var f=req.fields||{};
    if(f.partnerId!==undefined){if(f.partnerId){var pp=findP(f.partnerId);if(!pp)return oycErr('Partner not found');b.partnerId=pp.id;b.partnerName=pp.name;b.partnerPhone=pp.phone;oycHist(b,'Assigned','admin → '+pp.name);note('partner',pp.id,'New job request',svcs(b)+' · '+when(b)+'. Open the app to accept.',PART);custNote(b,'Assigned')}
      else{b.partnerId='';b.partnerName='';b.partnerPhone='';oycHist(b,'Pending','admin unassigned')}}
    ['date','slot','address','landmark','notes','adminNotes','total','payMode','name'].forEach(function(k){if(f[k]!==undefined)b[k]=f[k]});
    if(f.status&&f.status!==b.status){oycHist(b,f.status,'admin');custNote(b,f.status);if(f.status==='Cancelled'&&b.partnerId)note('partner',b.partnerId,'Job cancelled','Job '+b.id+' ('+svcs(b)+') was cancelled.',PART)}b.updated=oycNow();return oycOk(oycPub(b),['bookings'])}
  case 'adminSavePartner': {if(!isAdmin())return oycErr('Wrong admin PIN');var p=req.partner||{};
    if(!p.name||oycDigits(p.phone).length!==10)return oycErr('Partner needs a name and 10-digit mobile');
    var ex=p.id?findP(p.id):null;
    for(var i=0;i<db.partners.length;i++)if(db.partners[i]!==ex&&oycDigits(db.partners[i].phone)===oycDigits(p.phone))return oycErr('Another partner has this mobile number');
    if(!ex){ex={id:'P'+(101+db.partners.length),joined:oycNow(),online:'no'};while(findP(ex.id))ex.id='P'+(Number(ex.id.slice(1))+1);db.partners.push(ex)}
    var wasPending=ex.status==='Pending';ex.name=p.name;ex.phone=oycDigits(p.phone);if(p.aadhaar!==undefined)ex.aadhaar=String(p.aadhaar).replace(/\D/g,'');ex.skills=p.skills||'';ex.zone=p.zone||'';ex.status=p.status||'Active';ex.notes=p.notes||'';
    if(p.pin)ex.pin=String(p.pin);if(!ex.pin)ex.pin='1234';var dc=p.docs||{};['photo','aadhaarFront','aadhaarBack'].forEach(function(k){var v=p[k]||dc[k];if(v)ex[k]=v});
    if(wasPending&&ex.status==='Active')note('partner',ex.id,'Welcome to OYC!','Your partner account is approved. You will now receive job requests.',PART);
    return oycOk(JSON.parse(JSON.stringify(ex)),['partners'])}
  case 'adminSaveSettings': {if(!isAdmin())return oycErr('Wrong admin PIN');var ns=req.settings||{};
    var dirty=['settings'];
    if(db.services&&db.services.length&&(ns.prices||ns.off)){db.services.forEach(function(r){if(ns.prices&&ns.prices[r.id]!==undefined)r.price=String(ns.prices[r.id]);if(ns.off)r.active=ns.off[r.id]?'NO':'YES'});dirty.push('services');delete ns.prices;delete ns.off}
    ['prices','off','wa','fee','commission'].forEach(function(k){if(ns[k]!==undefined)S[k]=ns[k]});
    if(ns.newPin){if(String(ns.newPin).length<4||String(ns.newPin).length>40)return oycErr('Password must be 4–40 characters');S.adminPin=String(ns.newPin)}
    return oycOk({saved:1},dirty)}
  }
  return oycErr('Unknown request')
}
