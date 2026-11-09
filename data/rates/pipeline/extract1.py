import re,json,csv,hashlib
import pandas as pd
pages=open('/tmp/doc1.txt',encoding='utf-8',errors='replace').read().split('\f')
OUT='/home/claude/ratesdb/csv/'
def P(n): return pages[n-1]
# ---------- labour rates (SSR ch.14, pdf 552-553)
rows=[]
for n in (552,553):
    for line in P(n).split('\n'):
        m=re.match(r'^\s*(\d+)\s+(.+?)\s{2,}(\S+)\s+([\d,]+\.\d{2})\s*$',line)
        if m: rows.append(dict(ssr_sr=int(m.group(1)),trade=m.group(2).strip(),unit=m.group(3),rate_2022_23=float(m.group(4).replace(',','')),ssr_page=n-7,pdf_page=n))
lab=pd.DataFrame(rows).drop_duplicates('ssr_sr')
print('labour rows',len(lab),'sr range',lab.ssr_sr.min(),lab.ssr_sr.max(),'missing',sorted(set(range(1,92))-set(lab.ssr_sr)))
lab['source_id']='SRC-01'; lab['status']='READ'
lab.to_csv(OUT+'labour_rate_ssr.csv',index=False)

# ---------- material rates (SSR ch.13, pdf 531-551)
mats=[];unparsed=[];sec='';
HEADJUNK=re.compile(r'^\s*(Sr\.|No\.|Description|Per Unit|Rate|GST|23\)|SSR 2022|\(Excluding)',re.I)
for n in range(531,552):
    lines=P(n).split('\n')
    i=0
    while i<len(lines):
        l=lines[i]; s=l.strip()
        if not s: i+=1; continue
        if HEADJUNK.match(l) or re.match(r'^\s*(Page \d+|\d+\))\s*$',l) : i+=1; continue
        m=re.match(r'^\s*(\d+[a-z]?)\s+(.+?)\s{2,}(\S+(?:\s\S+)?)\s{2,}([\d,]+(?:\.\d+)?)\s*$',l)
        if m:
            mats.append(dict(section=sec,sr=m.group(1),material=m.group(2).strip(),unit=m.group(3).strip(),rate=float(m.group(4).replace(',','')),ssr_page=n-7,pdf_page=n)); i+=1; continue
        m2=re.match(r'^\s*(\d+[a-z]?)\s+(.+?)\s{2,}(\S+(?:\s\S+)?)\s*$',l)   # rate on a following line
        if m2 and i+1<len(lines):
            found=None;extra=[]
            for k in range(1,4):
                if i+k>=len(lines): break
                nl=lines[i+k]
                mr=re.match(r'^(.*?)\s{2,}([\d,]+\.\d{2})\s*$',nl) or re.match(r'^\s*()([\d,]+\.\d{2})\s*$',nl)
                if mr: found=(mr.group(1).strip(),float(mr.group(2).replace(',','')),k); break
                if re.match(r'^\s*\d+[a-z]?\s+\S',nl): break
            if found:
                desc=(m2.group(2).strip()+' '+found[0]).strip()
                mats.append(dict(section=sec,sr=m2.group(1),material=desc,unit=m2.group(3).strip(),rate=found[1],ssr_page=n-7,pdf_page=n)); i+=found[2]+1; continue
        if re.match(r'^\s{10,}\S',l) and not re.match(r'^\s*\d',l) and len(s)<90 and not re.search(r'[\d,]+\.\d{2}\s*$',s):
            sec=s; i+=1; continue
        if re.match(r'^\s*\d+[a-z]?\s+\S',l): unparsed.append((n,l.strip()[:120]))
        i+=1
mat=pd.DataFrame(mats)
print('materials parsed',len(mat),'unparsed numbered lines',len(unparsed))
for u in unparsed[:12]: print('  UNPARSED',u)
print(mat.section.value_counts().head(25))
mat.insert(0,'material_id',[f'MAT-{i:04d}' for i in range(1,len(mat)+1)])
mat['source_id']='SRC-01'; mat['basis']='ex-GST, SSR 2022-23'; mat['status']='READ'
mat.to_csv(OUT+'material_rate_ssr.csv',index=False)
pd.DataFrame(unparsed,columns=['pdf_page','line']).to_csv(OUT+'_review_material_unparsed.csv',index=False)
