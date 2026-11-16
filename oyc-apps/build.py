#!/usr/bin/env python3
"""Build the three OYC apps + the Google Apps Script file.
Usage: python3 build.py [APPS_SCRIPT_WEB_APP_URL]"""
import sys, os
D = os.path.dirname(os.path.abspath(__file__))
S = lambda f: open(os.path.join(D, 'src', f), encoding='utf-8').read()
api = sys.argv[1] if len(sys.argv) > 1 else ''
handler, core, css = S('handler.js'), S('core.js'), S('base.css')
os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
for name in ['customer', 'partner', 'admin']:
    p = os.path.join(D, 'src', name + '.html')
    if not os.path.exists(p):
        continue
    h = S(name + '.html').replace('/*BASE_CSS*/', css).replace('/*HANDLER_JS*/', handler).replace('/*CORE_JS*/', core)
    h = h.replace("'%%API_URL%%'", repr(api) if api else "'%%API_URL%%'")
    open(os.path.join(D, 'dist', name + '.html'), 'w', encoding='utf-8').write(h)
    print(name, len(h.encode()), 'bytes')
import subprocess, json
seed = subprocess.run(['node', '-e', """
global.addEventListener=()=>{};eval(require('fs').readFileSync(process.argv[1],'utf8')+';global.S=SERVICES;global.C=CATS');
console.log(JSON.stringify(S.map(s=>({id:s.id,category:C.find(c=>c.id===s.cat).name,subcategory:s.sub,name:s.name,price:String(s.price),duration:s.dur,details:s.pts.join(' | '),active:'YES'}))))""", os.path.join(D, 'src', 'core.js')], capture_output=True, text=True, check=True).stdout.strip()
gs = ("/* On Your Call – booking server for Google Sheets. Paste this whole file into Extensions › Apps Script. */\n"
      "var OYC_ADMIN_PIN = '1234';   // <-- CHANGE THIS to your admin password, keep the quotes\n\n"
      + handler + S('sheet.gs.js').replace('/*SEED_SERVICES*/[]', seed))
open(os.path.join(D, 'dist', 'OYC-Google-Apps-Script.gs'), 'w', encoding='utf-8').write(gs)
print('apps script', len(gs), 'bytes')
