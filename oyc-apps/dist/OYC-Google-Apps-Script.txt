/* On Your Call – booking server for Google Sheets. Paste this whole file into Extensions › Apps Script. */
var OYC_ADMIN_PIN = '1234';   // <-- CHANGE THIS to your admin password, keep the quotes

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
  case 'catalog': return oycOk({prices:S.prices||{},off:S.off||{},wa:S.wa||'',fee:S.fee||0,services:db.services||[]});
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
    return oycOk(oycForPartner(b),['bookings'])}
  /* ---------- admin ---------- */
  case 'adminLogin': return isAdmin()?oycOk({ok:1}):oycErr('Wrong admin PIN');
  case 'adminData': {if(!isAdmin())return oycErr('Wrong admin PIN');var st=JSON.parse(JSON.stringify(S));delete st.adminPin;
    return oycOk({bookings:db.bookings.map(oycPub).reverse(),partners:db.partners.map(function(p){return JSON.parse(JSON.stringify(p))}),settings:st,services:db.services||[]})}
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
    ex.name=p.name;ex.phone=oycDigits(p.phone);if(p.aadhaar!==undefined)ex.aadhaar=String(p.aadhaar).replace(/\D/g,'');ex.skills=p.skills||'';ex.zone=p.zone||'';ex.status=p.status||'Active';ex.notes=p.notes||'';
    if(p.pin)ex.pin=String(p.pin);if(!ex.pin)ex.pin='1234';
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

/* ================= Google Sheet storage ================= */
var OYC_TABLES={
  bookings:['id','created','source','status','name','phone','address','landmark','lat','lng','category','items','total','date','slot','notes','payMode','partnerId','partnerName','partnerPhone','otp','amountPaid','rating','review','adminNotes','updated','history'],
  partners:['id','name','phone','pin','skills','zone','status','online','joined','notes','aadhaar','photo','aadhaarFront','aadhaarBack'],
  services:['id','category','subcategory','name','price','duration','details','active']
};
var OYC_SHEETNAMES={bookings:'Bookings',partners:'Partners',services:'Services'};
var OYC_SEED=[{"id":"ac1","category":"AC & Appliance Repair","subcategory":"AC","name":"Foam-jet AC service","price":"599","duration":"60 mins","details":"Foam-jet cleaning of indoor unit | Filter, coil & drain tray cleaned | Cooling checked after service","active":"YES"},{"id":"ac2","category":"AC & Appliance Repair","subcategory":"AC","name":"AC less / no cooling repair","price":"299","duration":"Visit","details":"Technician diagnoses the problem | Repair quote shared before any work | Visit charge adjusted in final bill","active":"YES"},{"id":"ac3","category":"AC & Appliance Repair","subcategory":"AC","name":"AC gas refill & leak check","price":"2800","duration":"90 mins","details":"Leak detection and fixing | Gas top-up as required | Cooling performance test","active":"YES"},{"id":"ac4","category":"AC & Appliance Repair","subcategory":"AC","name":"Split AC installation","price":"1699","duration":"90 mins","details":"Indoor & outdoor unit mounting | Standard copper piping connection | Demo after installation","active":"YES"},{"id":"ac5","category":"AC & Appliance Repair","subcategory":"AC","name":"Split AC uninstallation","price":"699","duration":"45 mins","details":"Gas pumped down safely | Indoor & outdoor units removed | Units packed for moving","active":"YES"},{"id":"ac6","category":"AC & Appliance Repair","subcategory":"Appliances","name":"Refrigerator repair","price":"299","duration":"Visit","details":"Not cooling, noise, water leakage | Quote shared before repair | Genuine spare parts on request","active":"YES"},{"id":"ac7","category":"AC & Appliance Repair","subcategory":"Appliances","name":"Washing machine repair","price":"299","duration":"Visit","details":"Not spinning, draining or starting | Top & front load machines | Quote shared before repair","active":"YES"},{"id":"ac8","category":"AC & Appliance Repair","subcategory":"Appliances","name":"Water purifier (RO) service","price":"399","duration":"45 mins","details":"Filter check & cleaning | TDS check | Filter replacement at extra cost","active":"YES"},{"id":"ac9","category":"AC & Appliance Repair","subcategory":"Appliances","name":"Geyser repair","price":"299","duration":"Visit","details":"Not heating, leakage, tripping | Electric & gas geysers | Quote shared before repair","active":"YES"},{"id":"ac10","category":"AC & Appliance Repair","subcategory":"Appliances","name":"Microwave repair","price":"299","duration":"Visit","details":"Not heating or not starting | Solo, grill & convection | Quote shared before repair","active":"YES"},{"id":"el1","category":"Electrician","subcategory":"Switch & socket","name":"Switchboard / socket repair","price":"99","duration":"30 mins","details":"Repair or replace 1 switch / socket | Loose connection fixing | Spare parts at extra cost","active":"YES"},{"id":"el2","category":"Electrician","subcategory":"Fan","name":"Ceiling fan installation","price":"149","duration":"30 mins","details":"Installation of 1 ceiling fan | Old fan removal on request | Speed & wobble check","active":"YES"},{"id":"el3","category":"Electrician","subcategory":"Fan","name":"Fan repair","price":"199","duration":"45 mins","details":"Noise, slow speed, not working | Capacitor replacement at extra cost | Regulator check","active":"YES"},{"id":"el4","category":"Electrician","subcategory":"Lights","name":"Light / tube installation","price":"99","duration":"20 mins","details":"Install 1 light, tube or LED panel | Holder fitting | Wiring check","active":"YES"},{"id":"el5","category":"Electrician","subcategory":"Wiring","name":"MCB / fuse replacement","price":"199","duration":"30 mins","details":"Replace 1 MCB or fuse | Tripping diagnosis | Spare parts at extra cost","active":"YES"},{"id":"el6","category":"Electrician","subcategory":"Inverter","name":"Inverter check-up","price":"349","duration":"45 mins","details":"Battery & connection check | Backup diagnosis | Distilled water top-up","active":"YES"},{"id":"el7","category":"Electrician","subcategory":"Visit","name":"Electrician visit & inspection","price":"149","duration":"Visit","details":"For any other electrical work | Inspection and quote | Visit charge adjusted in final bill","active":"YES"},{"id":"pl1","category":"Plumber","subcategory":"Taps","name":"Tap repair","price":"99","duration":"30 mins","details":"Fix 1 leaking tap | Washer / spindle change | Spare parts at extra cost","active":"YES"},{"id":"pl2","category":"Plumber","subcategory":"Taps","name":"Tap replacement","price":"149","duration":"30 mins","details":"Replace 1 tap or mixer | Old tap removal | Leak check","active":"YES"},{"id":"pl3","category":"Plumber","subcategory":"Leakage","name":"Leakage repair","price":"199","duration":"45 mins","details":"Pipe joint & connection leaks | Sealant application | Quote for concealed leaks","active":"YES"},{"id":"pl4","category":"Plumber","subcategory":"Blockage","name":"Drain blockage removal","price":"249","duration":"45 mins","details":"Sink, basin or bathroom drain | Manual / machine clearing | Flow check after work","active":"YES"},{"id":"pl5","category":"Plumber","subcategory":"Toilet","name":"Toilet flush repair","price":"299","duration":"45 mins","details":"Flush tank repair | Leak fixing | Spare parts at extra cost","active":"YES"},{"id":"pl6","category":"Plumber","subcategory":"Installation","name":"Wash basin installation","price":"499","duration":"60 mins","details":"Installation of 1 wash basin | Waste pipe & tap connection | Leak check","active":"YES"},{"id":"pl7","category":"Plumber","subcategory":"Visit","name":"Plumber visit & inspection","price":"149","duration":"Visit","details":"For any other plumbing work | Inspection and quote | Visit charge adjusted in final bill","active":"YES"},{"id":"cp1","category":"Carpenter","subcategory":"Locks & doors","name":"Door lock repair / replacement","price":"199","duration":"45 mins","details":"Repair or fit 1 lock | Alignment & latch fixing | Lock cost extra","active":"YES"},{"id":"cp2","category":"Carpenter","subcategory":"Furniture","name":"Furniture assembly","price":"349","duration":"60 mins","details":"Bed, wardrobe, table or shelf | Tools brought by professional | Per item","active":"YES"},{"id":"cp3","category":"Carpenter","subcategory":"Furniture","name":"Hinge / drawer channel repair","price":"149","duration":"30 mins","details":"Cupboard hinges & drawer channels | Up to 2 hinges / channels | Spare parts at extra cost","active":"YES"},{"id":"cp4","category":"Carpenter","subcategory":"Installation","name":"Curtain rod installation","price":"199","duration":"30 mins","details":"Drilling & fitting of 1 rod | Brackets fixed securely | Rod cost extra","active":"YES"},{"id":"cp5","category":"Carpenter","subcategory":"Visit","name":"Carpenter visit & inspection","price":"149","duration":"Visit","details":"For any other carpentry work | Inspection and quote | Visit charge adjusted in final bill","active":"YES"},{"id":"cl1","category":"Cleaning","subcategory":"Bathroom","name":"Bathroom intense cleaning","price":"529","duration":"90 mins","details":"Tiles, floor, fittings & mirror | Hard-water stain removal | Per bathroom","active":"YES"},{"id":"cl2","category":"Cleaning","subcategory":"Kitchen","name":"Kitchen deep cleaning","price":"1199","duration":"3 hrs","details":"Cabinets inside-out, slab & sink | Chimney & stove exterior | Grease removal","active":"YES"},{"id":"cl3","category":"Cleaning","subcategory":"Sofa & carpet","name":"Sofa cleaning (3 seats)","price":"699","duration":"60 mins","details":"Vacuum & shampoo cleaning | Stain treatment | Fabric sofas","active":"YES"},{"id":"cl4","category":"Cleaning","subcategory":"Full home","name":"Full home deep cleaning – 1 BHK","price":"3499","duration":"5 hrs","details":"All rooms, kitchen & bathrooms | Floor scrubbing & dusting | Team of professionals","active":"YES"},{"id":"cl5","category":"Cleaning","subcategory":"Full home","name":"Full home deep cleaning – 2 BHK","price":"4499","duration":"6 hrs","details":"All rooms, kitchen & bathrooms | Floor scrubbing & dusting | Team of professionals","active":"YES"},{"id":"cl6","category":"Cleaning","subcategory":"Full home","name":"Full home deep cleaning – 3 BHK","price":"5499","duration":"7 hrs","details":"All rooms, kitchen & bathrooms | Floor scrubbing & dusting | Team of professionals","active":"YES"},{"id":"cl7","category":"Cleaning","subcategory":"Water tank","name":"Water tank cleaning","price":"799","duration":"90 mins","details":"Sludge removal & scrubbing | Disinfection | Up to 1000 litres","active":"YES"},{"id":"pc1","category":"Pest Control","subcategory":"General","name":"Cockroach & ant control","price":"999","duration":"45 mins","details":"Gel & spray treatment | Kitchen & bathrooms | Odourless chemicals","active":"YES"},{"id":"pc2","category":"Pest Control","subcategory":"Termite","name":"Termite control","price":"2499","duration":"2 hrs","details":"Drill-fill-seal treatment | Woodwork inspection | Per 1 BHK","active":"YES"},{"id":"pc3","category":"Pest Control","subcategory":"Bed bugs","name":"Bed bug control","price":"1499","duration":"60 mins","details":"Two-visit treatment | Beds, sofas & curtains | Per 1 BHK","active":"YES"},{"id":"pc4","category":"Pest Control","subcategory":"General","name":"General pest control","price":"899","duration":"45 mins","details":"Spray for crawling insects | All rooms | Per 1 BHK","active":"YES"},{"id":"sw1","category":"Women's Salon & Spa","subcategory":"Waxing","name":"Full arms + full legs waxing","price":"699","duration":"60 mins","details":"Rica / honey wax | Underarms included | Single-use spatulas","active":"YES"},{"id":"sw2","category":"Women's Salon & Spa","subcategory":"Facial & cleanup","name":"Facial cleanup","price":"799","duration":"45 mins","details":"Cleansing, scrub & massage | Mask & toning | Suitable for all skin types","active":"YES"},{"id":"sw3","category":"Women's Salon & Spa","subcategory":"Threading","name":"Eyebrow & upper lip threading","price":"99","duration":"15 mins","details":"Eyebrows & upper lip | Clean thread used | Quick add-on","active":"YES"},{"id":"sw4","category":"Women's Salon & Spa","subcategory":"Mani & pedi","name":"Manicure","price":"499","duration":"40 mins","details":"Nail shaping & cuticle care | Hand scrub & massage | Nail polish","active":"YES"},{"id":"sw5","category":"Women's Salon & Spa","subcategory":"Mani & pedi","name":"Pedicure","price":"599","duration":"50 mins","details":"Foot soak & scrub | Nail & cuticle care | Foot massage","active":"YES"},{"id":"sw6","category":"Women's Salon & Spa","subcategory":"Hair","name":"Hair spa","price":"899","duration":"60 mins","details":"Hair wash & spa cream | Head massage & steam | For all hair lengths","active":"YES"},{"id":"sw7","category":"Women's Salon & Spa","subcategory":"Spa","name":"Swedish massage (60 mins)","price":"1199","duration":"60 mins","details":"Full body relaxing massage | Professional oils | Women therapists","active":"YES"},{"id":"sw8","category":"Women's Salon & Spa","subcategory":"Spa","name":"Deep tissue massage (60 mins)","price":"1399","duration":"60 mins","details":"Firm pressure for muscle stiffness | Professional oils | Women therapists","active":"YES"},{"id":"sm1","category":"Men's Salon & Massage","subcategory":"Haircut","name":"Haircut","price":"249","duration":"30 mins","details":"Haircut by professional barber | Style of your choice | Hair wash on request","active":"YES"},{"id":"sm2","category":"Men's Salon & Massage","subcategory":"Haircut","name":"Haircut + beard","price":"349","duration":"45 mins","details":"Haircut & beard shaping | Trim or clean shave | Aftershave","active":"YES"},{"id":"sm3","category":"Men's Salon & Massage","subcategory":"Beard","name":"Beard grooming","price":"149","duration":"20 mins","details":"Beard trim & shaping | Clean shave option | Aftershave","active":"YES"},{"id":"sm4","category":"Men's Salon & Massage","subcategory":"Hair colour","name":"Hair colour","price":"399","duration":"40 mins","details":"Ammonia-free colour | Application & wash | Colour of your choice","active":"YES"},{"id":"sm5","category":"Men's Salon & Massage","subcategory":"Facial","name":"Face cleanup","price":"499","duration":"40 mins","details":"Cleansing, scrub & massage | Mask | Suitable for all skin types","active":"YES"},{"id":"sm6","category":"Men's Salon & Massage","subcategory":"Massage","name":"Head & shoulder massage","price":"299","duration":"20 mins","details":"Head, neck & shoulders | Oil of your choice | Stress relief","active":"YES"},{"id":"sm7","category":"Men's Salon & Massage","subcategory":"Massage","name":"Full body massage (60 mins)","price":"1199","duration":"60 mins","details":"Full body relaxing massage | Professional oils | Male therapists","active":"YES"},{"id":"pt1","category":"Painting & Waterproofing","subcategory":"Painting","name":"Painting consultation","price":"0","duration":"Visit","details":"Site inspection & measurement | Colour & finish guidance | Written quote","active":"YES"},{"id":"pt2","category":"Painting & Waterproofing","subcategory":"Painting","name":"Room painting (1 room)","price":"2999","duration":"1 day","details":"Wall putty touch-up | 2 coats of paint | Furniture covering","active":"YES"},{"id":"pt3","category":"Painting & Waterproofing","subcategory":"Waterproofing","name":"Waterproofing inspection","price":"0","duration":"Visit","details":"Terrace, wall & bathroom leaks | Moisture check | Written quote","active":"YES"}];
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
    var res=oycHandle(db,req);
    if(res.ok&&res.dirty&&res.dirty.length)oycSave(db,res.dirty);
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
/* Run this once from the editor (select "setup" and press Run) to create the sheets. */
function setup(){var db=oycLoad();if(!db.services.length)db.services=JSON.parse(JSON.stringify(OYC_SEED));oycSave(db,['bookings','partners','services']);DriveApp.getRootFolder();}
