/* On Your Call – booking server for Google Sheets. Paste this whole file into Extensions › Apps Script. */
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
  db.bookings=db.bookings||[];db.partners=db.partners||[];db.settings=db.settings||{};
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
  case 'catalog': return oycOk({prices:S.prices||{},off:S.off||{},wa:S.wa||'',fee:S.fee||0});
  case 'createBooking': return makeBooking('App','customer');
  case 'myBookings': {var ph=oycDigits(req.phone);if(ph.length!==10)return oycErr('Login required');
    return oycOk(db.bookings.filter(function(b){return oycDigits(b.phone)===ph}).map(oycPub).reverse())}
  case 'cancelBooking': {var b=findB(req.id);if(!b||oycDigits(b.phone)!==oycDigits(req.phone))return oycErr('Booking not found');
    if(['Pending','Assigned','Accepted'].indexOf(b.status)<0)return oycErr('This booking can no longer be cancelled in the app. Please call us.');
    oycHist(b,'Cancelled','customer');return oycOk(oycPub(b),['bookings'])}
  case 'rateBooking': {var b=findB(req.id);if(!b||oycDigits(b.phone)!==oycDigits(req.phone))return oycErr('Booking not found');
    if(b.status!=='Completed')return oycErr('You can rate after the service is completed');
    b.rating=Math.max(1,Math.min(5,Number(req.rating)||5));b.review=String(req.review||'').slice(0,500);b.updated=oycNow();return oycOk(oycPub(b),['bookings'])}
  /* ---------- partner ---------- */
  case 'partnerApply': {var p=req.partner||{};if(!p.name||oycDigits(p.phone).length!==10||!/^\d{4}$/.test(String(p.pin||'')))return oycErr('Enter name, 10-digit mobile and a 4-digit PIN');
    for(var i=0;i<db.partners.length;i++)if(oycDigits(db.partners[i].phone)===oycDigits(p.phone))return oycErr('This mobile number is already registered');
    var np={id:'P'+(101+db.partners.length),name:String(p.name).slice(0,80),phone:oycDigits(p.phone),pin:String(p.pin),skills:String(p.skills||''),zone:String(p.zone||''),status:'Pending',online:'no',joined:oycNow(),notes:String(p.notes||'').slice(0,300)};
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
    return oycOk(oycForPartner(b),['bookings'])}
  /* ---------- admin ---------- */
  case 'adminLogin': return isAdmin()?oycOk({ok:1}):oycErr('Wrong admin PIN');
  case 'adminData': {if(!isAdmin())return oycErr('Wrong admin PIN');var st=JSON.parse(JSON.stringify(S));delete st.adminPin;
    return oycOk({bookings:db.bookings.map(oycPub).reverse(),partners:db.partners.map(function(p){return JSON.parse(JSON.stringify(p))}),settings:st})}
  case 'adminCreateBooking': {if(!isAdmin())return oycErr('Wrong admin PIN');return makeBooking(req.booking&&req.booking.source||'WhatsApp','admin')}
  case 'adminUpdateBooking': {if(!isAdmin())return oycErr('Wrong admin PIN');var b=findB(req.id);if(!b)return oycErr('Booking not found');var f=req.fields||{};
    if(f.partnerId!==undefined){if(f.partnerId){var pp=findP(f.partnerId);if(!pp)return oycErr('Partner not found');b.partnerId=pp.id;b.partnerName=pp.name;b.partnerPhone=pp.phone;oycHist(b,'Assigned','admin → '+pp.name)}
      else{b.partnerId='';b.partnerName='';b.partnerPhone='';oycHist(b,'Pending','admin unassigned')}}
    ['date','slot','address','landmark','notes','adminNotes','total','payMode','name'].forEach(function(k){if(f[k]!==undefined)b[k]=f[k]});
    if(f.status&&f.status!==b.status)oycHist(b,f.status,'admin');b.updated=oycNow();return oycOk(oycPub(b),['bookings'])}
  case 'adminSavePartner': {if(!isAdmin())return oycErr('Wrong admin PIN');var p=req.partner||{};
    if(!p.name||oycDigits(p.phone).length!==10)return oycErr('Partner needs a name and 10-digit mobile');
    var ex=p.id?findP(p.id):null;
    for(var i=0;i<db.partners.length;i++)if(db.partners[i]!==ex&&oycDigits(db.partners[i].phone)===oycDigits(p.phone))return oycErr('Another partner has this mobile number');
    if(!ex){ex={id:'P'+(101+db.partners.length),joined:oycNow(),online:'no'};while(findP(ex.id))ex.id='P'+(Number(ex.id.slice(1))+1);db.partners.push(ex)}
    ex.name=p.name;ex.phone=oycDigits(p.phone);ex.skills=p.skills||'';ex.zone=p.zone||'';ex.status=p.status||'Active';ex.notes=p.notes||'';
    if(p.pin)ex.pin=String(p.pin);if(!ex.pin)ex.pin='1234';
    return oycOk(JSON.parse(JSON.stringify(ex)),['partners'])}
  case 'adminSaveSettings': {if(!isAdmin())return oycErr('Wrong admin PIN');var ns=req.settings||{};
    ['prices','off','wa','fee','commission'].forEach(function(k){if(ns[k]!==undefined)S[k]=ns[k]});
    if(ns.newPin){if(!/^\d{4,8}$/.test(ns.newPin))return oycErr('PIN must be 4–8 digits');S.adminPin=ns.newPin}
    return oycOk({saved:1},['settings'])}
  }
  return oycErr('Unknown request')
}

/* ================= Google Sheet storage ================= */
var OYC_TABLES={
  bookings:['id','created','source','status','name','phone','address','landmark','lat','lng','category','items','total','date','slot','notes','payMode','partnerId','partnerName','partnerPhone','otp','amountPaid','rating','review','adminNotes','updated','history'],
  partners:['id','name','phone','pin','skills','zone','status','online','joined','notes']
};
var OYC_SHEETNAMES={bookings:'Bookings',partners:'Partners'};
var OYC_JSON=['items','history'];

function oycSheet(name,headers){
  var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);if(headers){sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');sh.setFrozenRows(1)}}
  return sh;
}
function oycLoad(){
  var db={settings:{}};
  Object.keys(OYC_TABLES).forEach(function(t){
    var h=OYC_TABLES[t],sh=oycSheet(OYC_SHEETNAMES[t],h),n=sh.getLastRow();db[t]=[];
    if(n<2)return;
    var vals=sh.getRange(2,1,n-1,h.length).getDisplayValues();
    vals.forEach(function(r){if(!r[0])return;var o={};h.forEach(function(k,i){var v=r[i];if(OYC_JSON.indexOf(k)>=0){try{v=JSON.parse(v||'[]')}catch(e){v=[]}}o[k]=v});db[t].push(o)});
  });
  var ss=oycSheet('Settings',['key','value']),n=ss.getLastRow();
  if(n>1)ss.getRange(2,1,n-1,2).getValues().forEach(function(r){if(!r[0])return;try{db.settings[r[0]]=JSON.parse(r[1])}catch(e){db.settings[r[0]]=r[1]}});
  return db;
}
function oycSave(db,dirty){
  dirty.forEach(function(t){
    if(t==='settings'){var ss=oycSheet('Settings',['key','value']);ss.getRange(2,1,Math.max(ss.getLastRow(),2),2).clearContent();
      var rows=Object.keys(db.settings).map(function(k){return [k,JSON.stringify(db.settings[k])]});
      if(rows.length)ss.getRange(2,1,rows.length,2).setNumberFormat('@').setValues(rows);return}
    var h=OYC_TABLES[t],sh=oycSheet(OYC_SHEETNAMES[t],h);
    var rows=db[t].map(function(o){return h.map(function(k){var v=o[k];if(OYC_JSON.indexOf(k)>=0)return JSON.stringify(v||[]);return v===undefined||v===null?'':String(v)})});
    if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,h.length).clearContent();
    if(rows.length)sh.getRange(2,1,rows.length,h.length).setNumberFormat('@').setValues(rows);
  });
}
function oycOut(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function doGet(e){return oycOut({ok:true,app:'On Your Call booking server',time:new Date().toISOString()})}
function doPost(e){
  var lock=LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    var req=JSON.parse(e.postData.contents||'{}');
    var db=oycLoad();
    var res=oycHandle(db,req);
    if(res.ok&&res.dirty&&res.dirty.length)oycSave(db,res.dirty);
    return oycOut({ok:res.ok,data:res.data,error:res.error});
  }catch(err){return oycOut({ok:false,error:'Server busy, please try again ('+err.message+')'})}
  finally{try{lock.releaseLock()}catch(e){}}
}
/* Run this once from the editor (select "setup" and press Run) to create the sheets. */
function setup(){var db=oycLoad();if(!db.settings.adminPin){db.settings.adminPin='1234';oycSave(db,['settings'])}oycSave(db,['bookings','partners'])}
