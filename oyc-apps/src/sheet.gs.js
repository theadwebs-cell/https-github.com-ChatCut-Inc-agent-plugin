
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
