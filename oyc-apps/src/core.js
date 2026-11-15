/* ===== OYC client core (shared by customer, partner, admin apps) ===== */
var OYC={
  API:'%%API_URL%%',            /* Google Apps Script web-app URL. Empty = demo mode (data stays in this browser) */
  WA:'919866689196',            /* WhatsApp number bookings are sent to */
  PHONE:'9866689196',
  LOGO:'https://media.flexifunnels.io/33238/images/oyc-logo_sgw4kngl.png',
  APP:'https://theadweb.flexifunnels.com/oyc-app',
  PARTNER:'https://theadweb.flexifunnels.com/oyc-partner',
  ADMIN:'https://theadweb.flexifunnels.com/oyc-admin'
};
if(OYC.API.indexOf('%%')===0)OYC.API='';
var IMG={
  ac:'https://media.flexifunnels.io/33238/images/appliance-repair_ql9j68ai.png',
  repair:'https://media.flexifunnels.io/33238/images/home-repairs_psopbefv.png',
  clean:'https://media.flexifunnels.io/33238/images/cleaning-pest_khht06zp.png',
  salonw:'https://media.flexifunnels.io/33238/images/salon-spa_ej1vrnip.png',
  salonm:'https://media.flexifunnels.io/33238/images/mens-grooming_an7ocvxn.png',
  paint:'https://media.flexifunnels.io/33238/images/painting-waterproofing_sq1qbp7u.png',
  pest:'https://media.flexifunnels.io/33238/images/oyc-pest-control_wsnlvmug.png',
  elec:'https://media.flexifunnels.io/33238/images/oyc-electrician_xa1smvz2.png',
  plumb:'https://media.flexifunnels.io/33238/images/oyc-plumber_9s182c6j.png',
  carp:'https://media.flexifunnels.io/33238/images/oyc-carpenter_5jll2rwr.png'
};
var ICON={
  salonw:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  salonm:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12M20 4 8.12 15.88M14.8 14.8 20 20"/><circle cx="6" cy="18" r="3"/>',
  clean:'<path d="M3 3h.01M7 5h.01M11 7h.01M3 7h.01M7 9h.01M3 11h.01"/><rect width="4" height="4" x="15" y="5"/><path d="m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2M13 14l8-2M13 19l8-2"/>',
  pest:'<path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  elec:'<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  plumb:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  carp:'<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
  ac:'<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
  paint:'<rect width="16" height="6" x="2" y="2" rx="2"/><path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect width="4" height="6" x="8" y="16" rx="1"/>',
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  right:'<path d="m9 18 6-6-6-6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  nav:'<path d="M3 11 22 2l-9 19-2-8z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  tag:'<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'
};
var WA_SVG='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.6 3.6 0 0 0-1.1 2.6 6.2 6.2 0 0 0 1.3 3.3 14.3 14.3 0 0 0 5.5 4.8c2 .9 2.8.9 3.8.8a3.2 3.2 0 0 0 2.1-1.5 2.6 2.6 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.3zM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.3A11.8 11.8 0 0 0 1.8 17.8L.2 24l6.3-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.5z"/></svg>';
function ic(n,s,w){return '<svg viewBox="0 0 24 24" width="'+(s||20)+'" height="'+(s||20)+'" fill="none" stroke="currentColor" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round">'+(ICON[n]||'')+'</svg>'}

var CATS=[
 {id:'salonw',name:"Women's Salon & Spa",short:'Salon for Women',img:IMG.salonw},
 {id:'salonm',name:"Men's Salon & Massage",short:'Salon for Men',img:IMG.salonm},
 {id:'clean',name:'Cleaning',short:'Cleaning',img:IMG.clean},
 {id:'pest',name:'Pest Control',short:'Pest Control',img:IMG.pest},
 {id:'elec',name:'Electrician',short:'Electrician',img:IMG.elec},
 {id:'plumb',name:'Plumber',short:'Plumber',img:IMG.plumb},
 {id:'carp',name:'Carpenter',short:'Carpenter',img:IMG.carp},
 {id:'ac',name:'AC & Appliance Repair',short:'AC & Appliance',img:IMG.ac},
 {id:'paint',name:'Painting & Waterproofing',short:'Painting',img:IMG.paint}
];
/* Starting prices based on Urban Company Hyderabad rates (Nov 2026) — edit any time from Admin › Services & prices */
var SERVICES=[
 ['ac1','ac','AC','Foam-jet AC service',599,'60 mins','Foam-jet cleaning of indoor unit|Filter, coil & drain tray cleaned|Cooling checked after service'],
 ['ac2','ac','AC','AC less / no cooling repair',299,'Visit','Technician diagnoses the problem|Repair quote shared before any work|Visit charge adjusted in final bill'],
 ['ac3','ac','AC','AC gas refill & leak check',2800,'90 mins','Leak detection and fixing|Gas top-up as required|Cooling performance test'],
 ['ac4','ac','AC','Split AC installation',1699,'90 mins','Indoor & outdoor unit mounting|Standard copper piping connection|Demo after installation'],
 ['ac5','ac','AC','Split AC uninstallation',699,'45 mins','Gas pumped down safely|Indoor & outdoor units removed|Units packed for moving'],
 ['ac6','ac','Appliances','Refrigerator repair',299,'Visit','Not cooling, noise, water leakage|Quote shared before repair|Genuine spare parts on request'],
 ['ac7','ac','Appliances','Washing machine repair',299,'Visit','Not spinning, draining or starting|Top & front load machines|Quote shared before repair'],
 ['ac8','ac','Appliances','Water purifier (RO) service',399,'45 mins','Filter check & cleaning|TDS check|Filter replacement at extra cost'],
 ['ac9','ac','Appliances','Geyser repair',299,'Visit','Not heating, leakage, tripping|Electric & gas geysers|Quote shared before repair'],
 ['ac10','ac','Appliances','Microwave repair',299,'Visit','Not heating or not starting|Solo, grill & convection|Quote shared before repair'],
 ['el1','elec','Switch & socket','Switchboard / socket repair',99,'30 mins','Repair or replace 1 switch / socket|Loose connection fixing|Spare parts at extra cost'],
 ['el2','elec','Fan','Ceiling fan installation',149,'30 mins','Installation of 1 ceiling fan|Old fan removal on request|Speed & wobble check'],
 ['el3','elec','Fan','Fan repair',199,'45 mins','Noise, slow speed, not working|Capacitor replacement at extra cost|Regulator check'],
 ['el4','elec','Lights','Light / tube installation',99,'20 mins','Install 1 light, tube or LED panel|Holder fitting|Wiring check'],
 ['el5','elec','Wiring','MCB / fuse replacement',199,'30 mins','Replace 1 MCB or fuse|Tripping diagnosis|Spare parts at extra cost'],
 ['el6','elec','Inverter','Inverter check-up',349,'45 mins','Battery & connection check|Backup diagnosis|Distilled water top-up'],
 ['el7','elec','Visit','Electrician visit & inspection',149,'Visit','For any other electrical work|Inspection and quote|Visit charge adjusted in final bill'],
 ['pl1','plumb','Taps','Tap repair',99,'30 mins','Fix 1 leaking tap|Washer / spindle change|Spare parts at extra cost'],
 ['pl2','plumb','Taps','Tap replacement',149,'30 mins','Replace 1 tap or mixer|Old tap removal|Leak check'],
 ['pl3','plumb','Leakage','Leakage repair',199,'45 mins','Pipe joint & connection leaks|Sealant application|Quote for concealed leaks'],
 ['pl4','plumb','Blockage','Drain blockage removal',249,'45 mins','Sink, basin or bathroom drain|Manual / machine clearing|Flow check after work'],
 ['pl5','plumb','Toilet','Toilet flush repair',299,'45 mins','Flush tank repair|Leak fixing|Spare parts at extra cost'],
 ['pl6','plumb','Installation','Wash basin installation',499,'60 mins','Installation of 1 wash basin|Waste pipe & tap connection|Leak check'],
 ['pl7','plumb','Visit','Plumber visit & inspection',149,'Visit','For any other plumbing work|Inspection and quote|Visit charge adjusted in final bill'],
 ['cp1','carp','Locks & doors','Door lock repair / replacement',199,'45 mins','Repair or fit 1 lock|Alignment & latch fixing|Lock cost extra'],
 ['cp2','carp','Furniture','Furniture assembly',349,'60 mins','Bed, wardrobe, table or shelf|Tools brought by professional|Per item'],
 ['cp3','carp','Furniture','Hinge / drawer channel repair',149,'30 mins','Cupboard hinges & drawer channels|Up to 2 hinges / channels|Spare parts at extra cost'],
 ['cp4','carp','Installation','Curtain rod installation',199,'30 mins','Drilling & fitting of 1 rod|Brackets fixed securely|Rod cost extra'],
 ['cp5','carp','Visit','Carpenter visit & inspection',149,'Visit','For any other carpentry work|Inspection and quote|Visit charge adjusted in final bill'],
 ['cl1','clean','Bathroom','Bathroom intense cleaning',529,'90 mins','Tiles, floor, fittings & mirror|Hard-water stain removal|Per bathroom'],
 ['cl2','clean','Kitchen','Kitchen deep cleaning',1199,'3 hrs','Cabinets inside-out, slab & sink|Chimney & stove exterior|Grease removal'],
 ['cl3','clean','Sofa & carpet','Sofa cleaning (3 seats)',699,'60 mins','Vacuum & shampoo cleaning|Stain treatment|Fabric sofas'],
 ['cl4','clean','Full home','Full home deep cleaning – 1 BHK',3499,'5 hrs','All rooms, kitchen & bathrooms|Floor scrubbing & dusting|Team of professionals'],
 ['cl5','clean','Full home','Full home deep cleaning – 2 BHK',4499,'6 hrs','All rooms, kitchen & bathrooms|Floor scrubbing & dusting|Team of professionals'],
 ['cl6','clean','Full home','Full home deep cleaning – 3 BHK',5499,'7 hrs','All rooms, kitchen & bathrooms|Floor scrubbing & dusting|Team of professionals'],
 ['cl7','clean','Water tank','Water tank cleaning',799,'90 mins','Sludge removal & scrubbing|Disinfection|Up to 1000 litres'],
 ['pc1','pest','General','Cockroach & ant control',999,'45 mins','Gel & spray treatment|Kitchen & bathrooms|Odourless chemicals'],
 ['pc2','pest','Termite','Termite control',2499,'2 hrs','Drill-fill-seal treatment|Woodwork inspection|Per 1 BHK'],
 ['pc3','pest','Bed bugs','Bed bug control',1499,'60 mins','Two-visit treatment|Beds, sofas & curtains|Per 1 BHK'],
 ['pc4','pest','General','General pest control',899,'45 mins','Spray for crawling insects|All rooms|Per 1 BHK'],
 ['sw1','salonw','Waxing','Full arms + full legs waxing',699,'60 mins','Rica / honey wax|Underarms included|Single-use spatulas'],
 ['sw2','salonw','Facial & cleanup','Facial cleanup',799,'45 mins','Cleansing, scrub & massage|Mask & toning|Suitable for all skin types'],
 ['sw3','salonw','Threading','Eyebrow & upper lip threading',99,'15 mins','Eyebrows & upper lip|Clean thread used|Quick add-on'],
 ['sw4','salonw','Mani & pedi','Manicure',499,'40 mins','Nail shaping & cuticle care|Hand scrub & massage|Nail polish'],
 ['sw5','salonw','Mani & pedi','Pedicure',599,'50 mins','Foot soak & scrub|Nail & cuticle care|Foot massage'],
 ['sw6','salonw','Hair','Hair spa',899,'60 mins','Hair wash & spa cream|Head massage & steam|For all hair lengths'],
 ['sw7','salonw','Spa','Swedish massage (60 mins)',1199,'60 mins','Full body relaxing massage|Professional oils|Women therapists'],
 ['sw8','salonw','Spa','Deep tissue massage (60 mins)',1399,'60 mins','Firm pressure for muscle stiffness|Professional oils|Women therapists'],
 ['sm1','salonm','Haircut','Haircut',249,'30 mins','Haircut by professional barber|Style of your choice|Hair wash on request'],
 ['sm2','salonm','Haircut','Haircut + beard',349,'45 mins','Haircut & beard shaping|Trim or clean shave|Aftershave'],
 ['sm3','salonm','Beard','Beard grooming',149,'20 mins','Beard trim & shaping|Clean shave option|Aftershave'],
 ['sm4','salonm','Hair colour','Hair colour',399,'40 mins','Ammonia-free colour|Application & wash|Colour of your choice'],
 ['sm5','salonm','Facial','Face cleanup',499,'40 mins','Cleansing, scrub & massage|Mask|Suitable for all skin types'],
 ['sm6','salonm','Massage','Head & shoulder massage',299,'20 mins','Head, neck & shoulders|Oil of your choice|Stress relief'],
 ['sm7','salonm','Massage','Full body massage (60 mins)',1199,'60 mins','Full body relaxing massage|Professional oils|Male therapists'],
 ['pt1','paint','Painting','Painting consultation',0,'Visit','Site inspection & measurement|Colour & finish guidance|Written quote'],
 ['pt2','paint','Painting','Room painting (1 room)',2999,'1 day','Wall putty touch-up|2 coats of paint|Furniture covering'],
 ['pt3','paint','Waterproofing','Waterproofing inspection',0,'Visit','Terrace, wall & bathroom leaks|Moisture check|Written quote']
].map(function(r){return {id:r[0],cat:r[1],sub:r[2],name:r[3],price:r[4],dur:r[5],pts:r[6].split('|')}});
var SIMG={"pt3": "https://media.flexifunnels.io/33238/images/oyc-pt3_dsr5dytz.png", "pt2": "https://media.flexifunnels.io/33238/images/oyc-pt2_drbwfite.png", "pt1": "https://media.flexifunnels.io/33238/images/oyc-pt1_djkxh444.png", "ac10": "https://media.flexifunnels.io/33238/images/oyc-ac10_myecctom.png", "ac9": "https://media.flexifunnels.io/33238/images/oyc-ac9_ajhjwzmf.png", "ac8": "https://media.flexifunnels.io/33238/images/oyc-ac8_37f0dsct.png", "ac7": "https://media.flexifunnels.io/33238/images/oyc-ac7_lebpmcwi.png", "ac6": "https://media.flexifunnels.io/33238/images/oyc-ac6_wlzfo4sh.png", "ac5": "https://media.flexifunnels.io/33238/images/oyc-ac5_1cmjb5mj.png", "ac4": "https://media.flexifunnels.io/33238/images/oyc-ac4_4t5vvduw.png", "ac3": "https://media.flexifunnels.io/33238/images/oyc-ac3_bodxcjox.png", "ac2": "https://media.flexifunnels.io/33238/images/oyc-ac2_xjr5yhrt.png", "ac1": "https://media.flexifunnels.io/33238/images/oyc-ac1_flb3wyxp.png", "cp5": "https://media.flexifunnels.io/33238/images/oyc-cp5_vstpmst9.png", "cp4": "https://media.flexifunnels.io/33238/images/oyc-cp4_iarc7m5q.png", "cp3": "https://media.flexifunnels.io/33238/images/oyc-cp3_qcmcgbfe.png", "cp2": "https://media.flexifunnels.io/33238/images/oyc-cp2_t4jhrzgp.png", "cp1": "https://media.flexifunnels.io/33238/images/oyc-cp1_qrafwin0.png", "pl7": "https://media.flexifunnels.io/33238/images/oyc-pl7_j0bb03e0.png", "pl6": "https://media.flexifunnels.io/33238/images/oyc-pl6_vwmjbawo.png", "pl5": "https://media.flexifunnels.io/33238/images/oyc-pl5_d3n6y5zz.png", "pl4": "https://media.flexifunnels.io/33238/images/oyc-pl4_hjvnsy1p.png", "pl3": "https://media.flexifunnels.io/33238/images/oyc-pl3_kczqf1ia.png", "pl2": "https://media.flexifunnels.io/33238/images/oyc-pl2_7yddreao.png", "pl1": "https://media.flexifunnels.io/33238/images/oyc-pl1_u60tmlfe.png", "el7": "https://media.flexifunnels.io/33238/images/oyc-el7_wbnkvgub.png", "el6": "https://media.flexifunnels.io/33238/images/oyc-el6_clffcoah.png", "el5": "https://media.flexifunnels.io/33238/images/oyc-el5_4erdhmdt.png", "el4": "https://media.flexifunnels.io/33238/images/oyc-el4_xwmjbzfe.png", "el3": "https://media.flexifunnels.io/33238/images/oyc-el3_djtxzfc6.png", "el2": "https://media.flexifunnels.io/33238/images/oyc-el2_fii7nztt.png", "el1": "https://media.flexifunnels.io/33238/images/oyc-el1_qvhomvbv.png", "pc4": "https://media.flexifunnels.io/33238/images/oyc-pc4_pprrzzy5.png", "pc3": "https://media.flexifunnels.io/33238/images/oyc-pc3_lyuqlz4x.png", "pc2": "https://media.flexifunnels.io/33238/images/oyc-pc2_tolmdeil.png", "pc1": "https://media.flexifunnels.io/33238/images/oyc-pc1_sge3gyt3.png", "cl7": "https://media.flexifunnels.io/33238/images/oyc-cl7_2fliyqmo.png", "cl6": "https://media.flexifunnels.io/33238/images/oyc-cl6_1kipjs4h.png", "cl5": "https://media.flexifunnels.io/33238/images/oyc-cl5_hvhjooud.png", "cl4": "https://media.flexifunnels.io/33238/images/oyc-cl4_of9mwdbn.png", "cl3": "https://media.flexifunnels.io/33238/images/oyc-cl3_us3deisx.png", "cl2": "https://media.flexifunnels.io/33238/images/oyc-cl2_po4cnr7f.png", "cl1": "https://media.flexifunnels.io/33238/images/oyc-cl1_dagvgv1z.png", "sm7": "https://media.flexifunnels.io/33238/images/oyc-sm7_46glghjl.png", "sm6": "https://media.flexifunnels.io/33238/images/oyc-sm6_yhwnqr0b.png", "sm5": "https://media.flexifunnels.io/33238/images/oyc-sm5_usvx9xkq.png", "sm4": "https://media.flexifunnels.io/33238/images/oyc-sm4_xvmerqnt.png", "sm3": "https://media.flexifunnels.io/33238/images/oyc-sm3_po208yjm.png", "sm2": "https://media.flexifunnels.io/33238/images/oyc-sm2_sg3d7l59.png", "sm1": "https://media.flexifunnels.io/33238/images/oyc-sm1_mmnvoyi6.png", "sw8": "https://media.flexifunnels.io/33238/images/oyc-sw8_fg1yi1py.png", "sw7": "https://media.flexifunnels.io/33238/images/oyc-sw7_dus6eyok.png", "sw6": "https://media.flexifunnels.io/33238/images/oyc-sw6_uecbhxvc.png", "sw5": "https://media.flexifunnels.io/33238/images/oyc-sw5_7tqerbsq.png", "sw4": "https://media.flexifunnels.io/33238/images/oyc-sw4_bs62jnmt.png", "sw3": "https://media.flexifunnels.io/33238/images/oyc-sw3_hxpgauqn.png", "sw2": "https://media.flexifunnels.io/33238/images/oyc-sw2_guy0l6be.png", "sw1": "https://media.flexifunnels.io/33238/images/oyc-sw1_meqb1585.png"};
function svcPic(s){return SIMG[s.id]||catOf(s.cat).img}
function catOf(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return CATS[0]}
function svcOf(id){for(var i=0;i<SERVICES.length;i++)if(SERVICES[i].id===id)return SERVICES[i];return null}
function applyCatalog(c){if(!c)return;var P=c.prices||{},O=c.off||{};SERVICES.forEach(function(s){if(P[s.id]!==undefined&&P[s.id]!=='')s.price=Number(P[s.id]);s.off=!!O[s.id]});if(c.wa)OYC.WA=String(c.wa).replace(/\D/g,'')}
function rupee(n){n=Number(n)||0;return '₹'+n.toLocaleString('en-IN')}
function priceLabel(s){return s.price>0?rupee(s.price):'Free visit'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function store(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function toast(t){var x=$('#toast');if(!x){x=document.createElement('div');x.id='toast';document.body.appendChild(x)}x.textContent=t;x.className='show';clearTimeout(toast._t);toast._t=setTimeout(function(){x.className=''},2800)}
function fmtDate(d){if(!d)return 'Date to be confirmed';var x=new Date(d+'T00:00:00');if(isNaN(x))return d;return x.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
function fmtTime(iso){if(!iso)return '';var x=new Date(iso);return isNaN(x)?iso:x.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
function mapEmbed(b){var q=(b.lat&&b.lng)?(b.lat+','+b.lng):((b.address||'')+' Hyderabad');return 'https://maps.google.com/maps?q='+encodeURIComponent(q)+'&z=16&output=embed'}
function mapLink(b){var q=(b.lat&&b.lng)?(b.lat+','+b.lng):((b.address||'')+(b.landmark?', '+b.landmark:'')+', Hyderabad');return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q)}
function waLink(num,text){return 'https://wa.me/'+String(num).replace(/\D/g,'').replace(/^(\d{10})$/,'91$1')+'?text='+encodeURIComponent(text)}
function itemsText(b){return (b.items||[]).map(function(i){return '• '+i.name+' x'+i.qty+(i.price?' – '+rupee(i.price*i.qty):'')}).join('\n')}
var STATUS_FLOW=['Pending','Assigned','Accepted','On the way','In progress','Completed'];
var STATUS_LABEL={'Pending':'Finding a professional','Assigned':'Professional assigned','Accepted':'Professional confirmed','On the way':'Professional on the way','In progress':'Service in progress','Completed':'Completed','Cancelled':'Cancelled'};
function stCls(s){return 'st-'+String(s).toLowerCase().replace(/\s+/g,'')}

/* ---- data layer ---- */
function oycLocalDb(){var db=store('oyc_demo_db');if(!db){db={bookings:[],partners:[{id:'P101',name:'Demo Partner',phone:'9999999999',pin:'1234',skills:'AC & Appliance Repair, Electrician, Plumber',zone:'Hyderabad',status:'Active',online:'yes',joined:oycNow(),notes:'Demo account'}],settings:{adminPin:'1234'}};store('oyc_demo_db',db)}return db}
function api(action,payload){
  var req=Object.assign({action:action},payload||{});
  if(OYC.API){
    return fetch(OYC.API,{method:'POST',body:JSON.stringify(req)}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw new Error(j.error||'Something went wrong');return j.data})
      .catch(function(e){if(e instanceof TypeError)throw new Error('No internet connection. Please try again.');throw e});
  }
  return new Promise(function(res,rej){setTimeout(function(){var db=oycLocalDb();var r=oycHandle(db,JSON.parse(JSON.stringify(req)));if(!r.ok)return rej(new Error(r.error));store('oyc_demo_db',db);res(JSON.parse(JSON.stringify(r.data)))},150)});
}
function busy(btn,on,label){if(!btn)return;if(on){btn._l=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spin"></span>'+(label||'Please wait…')}else{btn.disabled=false;if(btn._l)btn.innerHTML=btn._l}}
/* install prompt */
var _inst=null;addEventListener('beforeinstallprompt',function(e){e.preventDefault();_inst=e;$$('[data-install]').forEach(function(b){b.style.display=''})});
function installApp(){if(_inst){_inst.prompt();_inst=null}else alert('To install: open your browser menu (⋮ or Share) and tap "Add to Home screen".')}
