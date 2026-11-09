import re,json
import pandas as pd
pages=open('/tmp/doc1.txt',encoding='utf-8',errors='replace').read().split('\f')
OUT='/home/claude/ratesdb/csv/'
start=re.compile(r'^\s*(\d{3,4})\s+([A-Za-z][A-Za-z \.&\-/,:\(\)]*?)\s{2,}(\d{2}\.\d+[A-Za-z]?)\s+(.*)$')
UNITMAP=[('Cubic','Cu.m'),('Square','Sq.m'),('Running','R.m'),('Number','No.'),('Metric','MT'),('Kilogram','Kg'),('Litre','L'),('Quintal','Quintal'),('Set','Set'),('Each','No.'),('Pair','Pair'),('Kilometre','Km'),('Hectare','Ha'),('Metre','m'),('Day','Day'),('Month','Month')]
entries=[]
for n in range(160,315):
    lines=pages[n-1].split('\n')
    cur=None
    for l in lines:
        m=start.match(l)
        if m:
            if cur: entries.append(cur)
            cur=dict(sr=int(m.group(1)),chapter=m.group(2).strip(),item_no=m.group(3),first=m.group(4),cont=[],pdf_page=n)
        elif cur is not None:
            if re.search(r'Page \d+\s*$',l) and not l.strip().startswith('Providing'): 
                continue
            cur['cont'].append(l)
    if cur: entries.append(cur)
print('entries',len(entries))
rows=[]
bad=[]
for e in entries:
    first=e['first']
    r=re.search(r'\s(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$',first)
    comp=lab=None
    text_first=first
    if r:
        comp,lab=float(r.group(1)),float(r.group(2)); text_first=first[:r.start()]
    else:
        # rates may sit on a continuation line
        for cl in e['cont'][:4]:
            r2=re.search(r'\s(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$',cl)
            if r2: comp,lab=float(r2.group(1)),float(r2.group(2)); break
    body=text_first+' '+' '.join(c.strip() for c in e['cont'][:8])
    body=re.sub(r'\s+',' ',body)
    um=re.search(r'(?:One\s+)?(Cubic|Square|Running|Number|Metric|Kilogram|Litre|Quintal|Set|Each|Pair|Kilometre|Hectare|Day|Month)\s',first+' '+' '.join(e['cont'][:3]))
    unit=''
    if um:
        for k,v in UNITMAP:
            if um.group(1)==k: unit=v
    ref=text_first.split()[0] if text_first.split() else ''
    status='OK' if (comp is not None and unit) else 'REVIEW'
    if comp is None: bad.append((e['sr'],e['item_no'],'no rates'))
    rows.append(dict(ssr_sr=e['sr'],item_no=e['item_no'],chapter=e['chapter'],ref_no=ref,description=body[:600],unit=unit,completed_rate=comp,labour_rate=lab,ssr_page=e['pdf_page']-7,pdf_page=e['pdf_page'],parse_status=status))
df=pd.DataFrame(rows)
CH={21:'Excavation',22:'Pile Foundation (Building)',23:'Structural Steel Work',24:'Plain Cement Concrete',25:'Reinforced Cement Concrete',26:'Reinforced Cement Concrete',27:'Brick Work',28:'Stone Masonry',29:'Concrete Block Masonry',30:'Expansion Joints',31:'Water Proofing',32:'Plastering and Pointing',33:'Paving, Flooring and Dado',34:'Wood Finish',35:'Oil Painting',36:'Colouring',37:'Wood Work',38:'Roofing and Ceiling',39:'Doors and Windows',40:'Iron Work',41:'Water Supply and Sanitary Fittings',42:'Water Supply and Sanitary Fittings',43:'Water Supply and Sanitary Fittings',44:'Building Miscellaneous',46:'Building Maintenance',47:'Structural Strengthening',48:'Green Building'}
df['chapter_no']=df.item_no.str.extract(r'^(\d+)')[0].astype(int)
df['chapter_name']=df.chapter_no.map(CH).fillna('Other / additional items')
df=df.drop(columns=['chapter'])
print('rows',len(df),'OK',(df.parse_status=='OK').sum(),'REVIEW',(df.parse_status=='REVIEW').sum())
exp=set(range(720,1620)); got=set(df.ssr_sr)
print('expected sr 720-1619 missing:',len(exp-got), sorted(exp-got)[:30])
print('dups sr',df.ssr_sr.duplicated().sum(),'dups item_no',df.item_no.duplicated().sum())
print(df.unit.value_counts().head(10))
print(df.chapter_name.value_counts())

# ---- second pass: variant rows (sub-items a/b/c) whose item number is inherited from the row above
exp=set(range(720,1620)); got=set(df.ssr_sr); miss=sorted(exp-got)
extra=[]
for n in range(160,315):
    ls=pages[n-1].split('\n')
    for i,l in enumerate(ls):
        m=re.match(r'^\s*(\d{3,4})\s+(.*)$',l)
        if not m or int(m.group(1)) not in miss: continue
        sr=int(m.group(1)); rest=m.group(2)
        r=re.search(r'\s(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$',rest)
        if not r: continue
        um=re.search(r'One\s+(Cubic|Square|Running|Number|Metric|Kilogram|Litre|Quintal|Set|Each|Pair)',rest+' '+' '.join(ls[i+1:i+3]))
        unit=dict(UNITMAP).get(um.group(1),'') if um else ''
        extra.append((sr,n,re.sub(r'\s+',' ',rest[:r.start()]).strip(),float(r.group(1)),float(r.group(2)),unit))
base=df.sort_values('ssr_sr')
for sr,n,desc,comp,lab,unit in extra:
    par=base[base.ssr_sr<sr].iloc[-1]
    df.loc[len(df)]=dict(ssr_sr=sr,item_no=par['item_no']+'/v'+str(sr),ref_no=par['ref_no'],description=('[variant of '+par['item_no']+'] '+desc)[:600],unit=unit,completed_rate=comp,labour_rate=lab,ssr_page=n-7,pdf_page=n,parse_status='OK_VARIANT',chapter_no=par['chapter_no'],chapter_name=par['chapter_name'])
print('variants added',len(extra),'still missing',sorted(exp-set(df.ssr_sr)))
df=df.sort_values('ssr_sr').reset_index(drop=True)

df.insert(0,'work_item_id',[f'WI-{r.ssr_sr:04d}' for r in df.itertuples()])
df['source_id']='SRC-01'; df['basis']='ex-GST, SSR 2022-23, initial lead 50 m'
df.to_csv(OUT+'work_item_ssr.csv',index=False)
print(df[df.parse_status=='REVIEW'][['ssr_sr','item_no','chapter_name','unit','completed_rate']].head(15))
