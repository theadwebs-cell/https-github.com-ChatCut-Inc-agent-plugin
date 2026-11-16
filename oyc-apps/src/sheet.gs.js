
/* ================= Google Sheet storage ================= */
var OYC_TABLES={
  bookings:['id','created','source','status','name','phone','address','landmark','lat','lng','category','items','total','date','slot','notes','payMode','partnerId','partnerName','partnerPhone','otp','amountPaid','rating','review','adminNotes','updated','history'],
  partners:['id','name','phone','pin','skills','zone','status','online','joined','notes','aadhaar','photo','aadhaarFront','aadhaarBack'],
  services:['id','category','subcategory','name','price','duration','details','active'],
  devices:['token','role','key','platform','updated']
};
var OYC_SHEETNAMES={bookings:'Bookings',partners:'Partners',services:'Services',devices:'Devices'};
var OYC_SEED=/*SEED_SERVICES*/[];
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
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');
    if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,Math.max(h.length,sh.getLastColumn())).clearContent();
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
    if(OYC_ADMIN_PIN)db.settings.adminPin=OYC_ADMIN_PIN;
    if(!db.services.length){db.services=JSON.parse(JSON.stringify(OYC_SEED));oycSave(db,['services'])}
    if(req.action==='partnerApply'&&req.partner&&req.partner.docs)oycSaveDocs(req.partner);
    if(req.action==='adminSavePartner'&&req.partner&&req.partner.docs&&String(req.pin||'')===String(db.settings.adminPin))oycSaveDocs(req.partner);
    var res=oycHandle(db,req);
    if(res.ok&&res.dirty&&res.dirty.length)oycSave(db,res.dirty);
    if(res.ok&&db._notify&&db._notify.length){try{if(oycPushSend(db))oycSave(db,['devices'])}catch(pe){console.log('push failed: '+pe)}}
    return oycOut({ok:res.ok,data:res.data,error:res.error});
  }catch(err){return oycOut({ok:false,error:'Server busy, please try again ('+err.message+')'})}
  finally{try{lock.releaseLock()}catch(e){}}
}
function oycSaveDocs(p){
  var docs=p.docs||{};delete p.docs;
  var it=DriveApp.getFoldersByName('OYC Partner Documents'),f=it.hasNext()?it.next():DriveApp.createFolder('OYC Partner Documents');
  ['photo','aadhaarFront','aadhaarBack'].forEach(function(k){var m=String(docs[k]||'').match(/^data:(image\/[a-z+]+);base64,(.+)$/);if(!m)return;
    var file=f.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]),m[1],oycDigits(p.phone)+'-'+String(p.name||'').replace(/\W+/g,'_')+'-'+k+'.jpg'));p[k]=file.getUrl()});
}
/* ================= Push notifications (Firebase Cloud Messaging) =================
   Needs Script property FCM_SERVICE_ACCOUNT = the Firebase service-account JSON (Project settings → Service accounts). */
function oycB64u(x){return Utilities.base64EncodeWebSafe(x).replace(/=+$/,'')}
function oycFcmAuth(){
  var raw=PropertiesService.getScriptProperties().getProperty('FCM_SERVICE_ACCOUNT');if(!raw)return null;
  var sa=JSON.parse(raw),cache=CacheService.getScriptCache(),tok=cache.get('oyc_fcm_token');
  if(tok)return {token:tok,project:sa.project_id};
  var now=Math.floor(Date.now()/1000);
  var head=oycB64u(JSON.stringify({alg:'RS256',typ:'JWT'})),claim=oycB64u(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  var sig=oycB64u(Utilities.computeRsaSha256Signature(head+'.'+claim,sa.private_key));
  var r=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:head+'.'+claim+'.'+sig},muteHttpExceptions:true});
  var j=JSON.parse(r.getContentText());if(!j.access_token)throw new Error('FCM auth: '+r.getContentText());
  cache.put('oyc_fcm_token',j.access_token,3000);return {token:j.access_token,project:sa.project_id};
}
function oycPushSend(db){
  var auth=oycFcmAuth();if(!auth)return false;var reqs=[],toks=[];
  db._notify.forEach(function(n){db.devices.filter(function(d){return d.role===n.role&&String(d.key)===n.key}).forEach(function(d){
    toks.push(d.token);
    reqs.push({url:'https://fcm.googleapis.com/v1/projects/'+auth.project+'/messages:send',method:'post',contentType:'application/json',muteHttpExceptions:true,headers:{Authorization:'Bearer '+auth.token},
      payload:JSON.stringify({message:{token:d.token,notification:{title:n.title,body:n.body},data:{url:n.url||''},android:{priority:'high',notification:{sound:'default'}},apns:{payload:{aps:{sound:'default'}}}}})})})});
  if(!reqs.length)return false;
  var res=UrlFetchApp.fetchAll(reqs),dead={};
  res.forEach(function(r,i){var c=r.getResponseCode();if(c===404||(c===400&&/UNREGISTERED|INVALID_ARGUMENT/.test(r.getContentText())))dead[toks[i]]=1});
  if(Object.keys(dead).length){db.devices=db.devices.filter(function(d){return !dead[d.token]});return true}
  return false;
}
/* Send yourself a test: put your phone number in, select testPush and Run. */
function testPush(){var db=oycLoad();db._notify=[];
  db.devices.forEach(function(d){db._notify.push({role:d.role,key:String(d.key),title:'OYC test',body:'Push notifications are working!',url:''})});oycPushSend(db);console.log('Sent to '+db.devices.length+' device(s)')}
/* Run this once from the editor (select "setup" and press Run) to create the sheets. */
function setup(){var db=oycLoad();if(!db.services.length)db.services=JSON.parse(JSON.stringify(OYC_SEED));oycSave(db,['bookings','partners','services','devices']);DriveApp.getRootFolder();UrlFetchApp.getRequest('https://fcm.googleapis.com');}
