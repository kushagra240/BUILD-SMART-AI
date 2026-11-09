import re,json,hashlib,os
import pandas as pd, openpyxl
pages=open('/tmp/doc1.txt',encoding='utf-8',errors='replace').read().split('\f')
OUT='/home/claude/ratesdb/csv/'
# ================= quantity norms (SSR ch.17, pdf 574-579)
SECT={'EXCAVATION':None,'PILE FOUNDATION':['Cement (bag)','Screened sand (m3)'],
 'PLAIN CEMENT CONCRETE AND REINFORCED CEMENT CONCRETE':['Cement (bag)','Screened sand (m3)','Aggregate 40mm (m3)','Aggregate 20mm (m3)','Aggregate 12/10mm (m3)'],
 'BRICK MASONARY':['Cement (bag)','Screened sand (m3)','Bricks (nos)','MS bars (kg)'],
 'STONE MASONARY':['Cement (bag)','Screened sand (m3)','Trap rubble (m3)','Corner/quins (nos)'],
 'WATER PROOFING TREATEMENT':['Cement (bag)','Screened sand (m3)','Aggregate 20mm (m3)','Aggregate 12/10mm (m3)'],
 'PLASTERING & POINTING':['Cement (bag)','Screened sand (m3)','Fine aggregate (m3)','Remark'],
 'PAVING AND FLOORING':['Cement (bag)','Screened sand (m3)','Metal 20mm (m3)','Metal 12/10mm (m3)'],
 'Bd - W. MISCELLANCEOUS':['Cement (bag)','Screened sand (m3)','Crushed metal 12/10mm (m3)'],
 'Bd - V. WATER SUPPLY AND SANITARY':['Cement (bag)','Sand (m3)','Bricks (nos)','Metal (m3)']}
def num(t):
    t=t.strip().replace('O.Q','0.0').replace('O','0')
    if t in('-','–',''): return None
    try: return float(t)
    except: return 'BAD'
rows=[];raw=[]
cat=None;cols=None
rowre=re.compile(r'^\s*(\d+)\s+(.*?)\s+(M2|M3|M|No\.?|Nos|RM|Rmt)\s+((?:[-–]?[\dO\.Q]+|-)(?:\s+(?:[-–]?[\dO\.Q]+|-))*)\s*$')
for n in range(574,580):
    for l in pages[n-1].split('\n'):
        s=l.strip()
        if not s: continue
        for h in list(SECT)+['Bd - V. WATER SUPPLY AND SANITARY']:
            if s.upper().startswith(h.upper()) or s==h:
                cat=h.title().replace('Masonary','Masonary'); cols=SECT.get(h); break
        m=rowre.match(l)
        if m and cat and cols:
            toks=m.group(4).split()
            vals=[num(t) for t in toks]
            ok=len(vals)==len(cols) and 'BAD' not in vals
            rows.append(dict(category=cat,sr=int(m.group(1)),item=re.sub(r'\s+',' ',m.group(2)).strip(),unit=m.group(3),values=vals,cols=cols,ok=ok,page=n-7,pdf_page=n,raw=s[:160]))
        elif re.match(r'^\s*\d+\s+\S',l) and cat and cols:
            raw.append((n,s[:160]))
long=[]
for r in rows:
    if r['ok']:
        for c,v in zip(r['cols'],r['values']):
            if v is None: continue
            mt=re.search(r'\((.*?)\)',c); 
            long.append(dict(category=r['category'],sr=r['sr'],item=r['item'],item_unit=r['unit'],material=re.sub(r'\s*\(.*?\)','',c),qty=v,material_unit=mt.group(1) if mt else '',ssr_page=r['page'],pdf_page=r['pdf_page'],parse_status='OK'))
    else:
        v=r['values']
        if len(v)>=2 and r['cols'][0].startswith('Cement') and r['cols'][1].lower().startswith(('screened','sand')) and v[0] not in('BAD',) and v[1] not in('BAD',):
            for c,x in zip(r['cols'][:2],v[:2]):
                if x is None: continue
                mt=re.search(r'\((.*?)\)',c)
                long.append(dict(category=r['category'],sr=r['sr'],item=r['item'],item_unit=r['unit'],material=re.sub(r'\s*\(.*?\)','',c),qty=x,material_unit=mt.group(1) if mt else '',ssr_page=r['page'],pdf_page=r['pdf_page'],parse_status='OK (cement and sand only; other columns not aligned, see raw)'))
        long.append(dict(category=r['category'],sr=r['sr'],item=r['item'],item_unit=r['unit'],material='OTHER COLUMNS',qty=None,material_unit='',ssr_page=r['page'],pdf_page=r['pdf_page'],parse_status='REVIEW: '+r['raw']))
for n,s in raw:
    long.append(dict(category=cat,sr=None,item=s,item_unit='',material='REVIEW',qty=None,material_unit='',ssr_page=n-7,pdf_page=n,parse_status='REVIEW: unparsed line'))
# manual rows for tables whose layout is non-regular (kept short, from pdf 574)
manual=[('Excavation',1,'Providing trap rubble soiling 15 to 20cm thick','M3',[('Rubble',1.00,'m3'),('Quarry spalls',0.20,'m3')],574,581),
('Excavation',2,'Providing soiling using 80mm over size trap metal','M3',[('Over size metal',1.00,'m3'),('Sand',0.15,'m3')],574,581)]
for c,sr,it,u,mm,pg,_ in manual:
    for m,q,mu in mm: long.append(dict(category=c,sr=sr,item=it,item_unit=u,material=m,qty=q,material_unit=mu,ssr_page=pg,pdf_page=pg+7,parse_status='OK'))
q=pd.DataFrame(long)
q.insert(0,'norm_id',[f'QN-{i:04d}' for i in range(1,len(q)+1)])
q['source_id']='SRC-01'; q['table_title']='Theoretical requirement of materials: Building (SSR ch.17)'
q.to_csv(OUT+'quantity_norm.csv',index=False)
print('norms rows',len(q),'OK',q.parse_status.str.startswith('OK').sum(),'REVIEW',q.parse_status.str.startswith('REVIEW').sum())

print(q.category.value_counts().to_dict())

# ================= transport (SSR ch.16)
def nums(s): return [float(x.replace(',','')) for x in re.findall(r'-?[\d,]*\.?\d+',s)]
tr=[]
for n,mode,ncol in ((558,'manual loading',15),(559,'manual loading',15),(560,'manual loading',15),(564,'machine loading',14),(565,'machine loading',14)):
    for l in pages[n-1].split('\n'):
        v=nums(l) if re.match(r'^\s*\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d',l) else []
        if len(v)>=ncol-1 and v[0]<=500:
            tr.append(dict(mode=mode,lead_km=v[0],avg_speed_kmph=v[1],factor=v[2],trips_per_day=v[3],km_done=v[4],overhead_10pct=v[-3],gross_total=v[-2],cost_per_trip=v[-1],n_numbers=len(v),ssr_page=n-7,pdf_page=n))
t=pd.DataFrame(tr); t=t[~((t.lead_km==1.0)&(t.avg_speed_kmph==2.0)&(t.factor==3.0))].drop_duplicates(['mode','lead_km'])
t.insert(0,'row_id',[f'TR-{i:03d}' for i in range(1,len(t)+1)])
t['diesel_rate_per_l']=102.88; t['labour_rate_per_day']=615; t['truck_hire_per_day']=2500; t['source_id']='SRC-01'
t['status']='READ'
t.to_csv(OUT+'transport_trip_cost.csv',index=False)
print('transport rows',len(t),t.groupby('mode').size().to_dict(), t.head(3).to_string())

# ================= lead charges per material (Statement C-1) raw
rawc=[]
for n,mode in ((562,'manual'),(563,'manual'),(567,'machine')):
    for l in pages[n-1].split('\n'):
        if re.match(r'^\s*\d+(\.\d+)?\s+\d{3,}\.\d+',l):
            v=nums(l); 
            rawc.append(dict(mode=mode,lead_km=v[0],**{f'v{i:02d}':x for i,x in enumerate(v[1:],1)},ssr_page=n-7,pdf_page=n))
rc=pd.DataFrame(rawc)
rc['source_id']='SRC-01'; rc['status']='RAW: column meanings are in the header text of the PDF page; verify before use'
rc.to_csv(OUT+'lead_charge_raw.csv',index=False)
print('lead raw',len(rc))
