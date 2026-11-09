import re,hashlib,os,datetime
import pandas as pd, openpyxl
OUT='/home/claude/ratesdb/csv/'
UP='/mnt/user-data/uploads/'
def sha(p): 
    h=hashlib.sha256(); h.update(open(p,'rb').read()); return h.hexdigest()
# ---------------- WPI long series
wsrc=openpyxl.load_workbook(UP+'wpi_monthly_index_202610.xlsx',data_only=True).active
hdr=[wsrc.cell(1,c).value for c in range(1,wsrc.max_column+1)]
mcols=[(i+1,h) for i,h in enumerate(hdr) if isinstance(h,str) and re.match(r'^[A-Z][a-z]{2}-\d{2}$',h)]
print('months',mcols[0][1],mcols[-1][1],len(mcols))
KEEP=['Ordinary Portland Cement (OPC)','Portland Pozzolana Cement (PPC)','Bars and Rods of Mild steel','Hot-Rolled Structural','Sand/Beach Sand/Morum','Plain bricks','Cement block (concrete)','Pre-fabricated Concrete','Ceramic tiles','Stone chip','Paint/Colour','Plywood board','Timber/ wooden planks','PVC pipe','Electric Wires & Cables','Granite','Flush doors','Ceramic sinks','Marble','Bitumen','Lime','Gypsum','Glass','Aluminium','Copper','Steel pipes','GI pipe','Wire','Flooring']
found={}
for r in range(2,wsrc.max_row+1):
    nm=(wsrc.cell(r,2).value or '').strip()
    if wsrc.cell(r,1).value!='Item': continue
    for k in KEEP[:20]:
        if nm.startswith(k) and k not in found: found[k]=r
print('found',len(found),[k for k in KEEP[:20] if k not in found])
codes=[];series=[]
for k,r in found.items():
    code=str(wsrc.cell(r,3).value); nm=(wsrc.cell(r,2).value or '').strip()
    codes.append(dict(wpi_code=code,commodity=nm,weight=wsrc.cell(r,4).value,item_level='Item',source_id='SRC-04'))
    for ci,h in mcols:
        v=wsrc.cell(r,ci).value
        if isinstance(v,(int,float)):
            mon=datetime.datetime.strptime(h,'%b-%y').date().replace(day=1)
            series.append(dict(wpi_code=code,month=mon.isoformat(),index_value=round(float(v),1),provisional=(h in [mcols[-1][1],mcols[-2][1]]),source_id='SRC-04'))
pd.DataFrame(codes).to_csv(OUT+'wpi_item.csv',index=False)
pd.DataFrame(series).to_csv(OUT+'wpi_series.csv',index=False)
print('wpi items',len(codes),'points',len(series))
# ---------------- material -> WPI mapping (regex, with quality)
mat=pd.read_csv(OUT+'material_rate_ssr.csv')
code_by=dict((c['commodity'].split(' (')[0] if False else c['commodity'],c['wpi_code']) for c in codes)
def code(prefix):
    for c in codes:
        if c['commodity'].startswith(prefix): return c['wpi_code']
RULES=[(r'^cement\b|\bO\.?P\.?C\.?\b|ordinary portland','Ordinary Portland Cement (OPC)','good','SSR generic cement mapped to OPC index'),
(r'portland pozzolana|\bPPC\b','Portland Pozzolana Cement (PPC)','good',''),
(r'tmt|fe ?-? ?500|reinforcement steel|\bhysd\b','Bars and Rods of Mild steel','fair','WPI item is mild-steel bars, not TMT'),
(r'structural steel|rolled steel|\bISMB\b|\bISA\b','Hot-Rolled Structural','fair',''),
(r'\bsand\b|murum|morum','Sand/Beach Sand/Morum','fair',''),
(r'bricks?\b.*(class|red|clay)|(class|first|second).*bricks?|^bricks','Plain bricks','good',''),
(r'fly ?ash bricks?','Plain bricks','weak','No fly-ash index; clay brick used as a proxy'),
(r'\b(aac|hollow block|solid block|concrete block|c\.?c\.? block)','Cement block (concrete)','weak',''),
(r'ceramic tile|glazed tile|vitrified|\btiles?\b.*(floor|wall|dado)','Ceramic tiles','fair','Vitrified mapped to ceramic index when applicable'),
(r'aggregate|\bmetal\b|stone chip|crushed','Stone chip','weak',''),
(r'emulsion|paint|distemper|enamel|primer','Paint/Colour','fair',''),
(r'plywood|ply wood|block board','Plywood board','good',''),
(r'teak|timber|wood\b','Timber/ wooden planks','fair',''),
(r'\bpvc\b|u\.?p\.?v\.?c|c\.?p\.?v\.?c','PVC pipe','fair',''),
(r'electric wire|cable|\bwire\b.*(copper|pvc)|copper wire','Electric Wires & Cables','fair',''),
(r'granite','Granite','good',''),
(r'flush door','Flush doors','good',''),
(r'wash basin|water closet|\bW\.?C\.?\b|sink|sanitary ware|urinal','Ceramic sinks','weak','Nearest WPI item')]
mp=[]
for r in mat.itertuples():
    txt=str(r.material)
    for pat,pref,q,why in RULES:
        if re.search(pat,txt,re.I):
            c=code(pref)
            if c: mp.append(dict(material_id=r.material_id,wpi_code=c,match_quality=q,rationale=why,method='keyword rule (auto)',reviewed=False)); break
m=pd.DataFrame(mp); m.to_csv(OUT+'material_wpi_map.csv',index=False)
print('mapped materials',len(m),'of',len(mat),m.match_quality.value_counts().to_dict())
# ---------------- minimum wage
rows=[('Skilled','I',21860,3198,25058),('Skilled','II',20990,3198,24188),('Skilled','III',20125,3198,23323),('Semi-skilled','I',20345,3198,23543),('Semi-skilled','II',19475,3198,22673),('Semi-skilled','III',18610,3198,21808),('Unskilled','I',19265,3198,22463),('Unskilled','II',18400,3198,21598),('Unskilled','III',17530,3198,20728)]
mw=[]
for i,(sk,z,b,a,t) in enumerate(rows,1):
    import math
    mw.append(dict(wage_id=f'MW-{i:02d}',industry='Construction or maintenance of roads or in building operations',skill_class=sk,zone=z,basic_monthly=b,special_allowance_monthly=a,total_monthly=b+a,total_monthly_as_printed=t,daily_rate=math.ceil((b+a)/26*100)/100,period_start='2026-07-01',period_end='2026-12-31',basic_source_id='SRC-02',allowance_source_id='SRC-03',allowance_verified=False,status='basic READ; allowance HAND-READ from scan, verify'))
pd.DataFrame(mw).to_csv(OUT+'minimum_wage.csv',index=False)
# ---------------- zones
Z=[('ZN-PMC','Pune Municipal Corporation limits','I','Zone I = all Municipal Corporations (min wage notification)'),
('ZN-PCMC','Pimpri-Chinchwad Municipal Corporation limits','I','Zone I = all Municipal Corporations'),
('ZN-CANT','Pune / Khadki / Dehu Road Cantonment areas','II','Zone II = A/B/C class municipal councils and cantonment areas'),
('ZN-COUNCIL','Municipal council towns around Pune','II','Zone II if A/B/C class council; confirm class per town'),
('ZN-OTHER','Other areas (rural / villages)','III','Zone III = all other areas')]
pd.DataFrame([dict(zone_id=a,name=b,min_wage_zone=c,basis=d,transport_lead_km_to_main_materials='TODO(data)',price_multiplier='TODO(data)',source_id='SRC-02',status='min-wage zone READ; price factors TODO(data)') for a,b,c,d in Z]).to_csv(OUT+'zone.csv',index=False)
# ---------------- rate rules
R=[('R01','lead','Initial lead included in completed item rates',50,'m','SSR general notes, Leads and lifts (c)','Additional lead charged per Statement C-1'),
('R02','excavation_depth','Excavation depth 3.0 m to 4.5 m: add to basic rate of the item',20,'%','SSR general note (xix)',''),
('R03','excavation_depth','Excavation depth 4.5 m to 6.0 m: add to basic rate of the item',30,'%','SSR general note (xix)','Beyond 6.0 m decided by Superintending Engineer'),
('R04','floor_lift','Building items on first floor: increase',1,'%','SSR general note (ii) floor lift',''),
('R05','floor_lift','Building items on second floor: increase',2,'%','SSR general note (ii) floor lift',''),
('R06','floor_lift','Building items on third floor: increase',3,'%','SSR general note (ii) floor lift',''),
('R07','floor_lift','Building items on fourth floor: increase',4,'%','SSR general note (ii) floor lift','Ground floor nil; above fourth decided by SE'),
('R08','foul_condition','Excavation in severe/adverse/foul condition: increase over scheduled rate',25,'%','SSR general note (xi)(a)','Needs prior approval of SE'),
('R09','foul_condition','Other items in foul condition up to ground/bed level: increase',5,'%','SSR general note (xi)(b)','Needs prior approval of SE'),
('R10','scaffolding','External repair work at height with scaffolding: increase of item rate',1,'%','SSR general note (viii) scaffolding','Not applied if scaffolding is a separate item'),
('R11','curing','RCC with modified curing (curing compound): increase',5,'%','SSR general note (xxi)',''),
('R12','royalty','Royalty on sand (royalty + 2% surcharge + 10% DMF cess), not in rate abstract',237.37,'INR/cum','SSR general note (v)(a)','Reimbursed separately'),
('R13','royalty','Royalty on other minor minerals (royalty + 2% surcharge), not in rate abstract',216.18,'INR/cum','SSR general note (v)(b)','Reimbursed separately'),
('R14','insurance','Labour insurance (not in rate abstract), work value up to INR 25 lakh',0.5,'%','SSR general note (i)A','Added in recapitulation sheet'),
('R15','insurance','Labour insurance (not in rate abstract), work value above INR 25 lakh',1.0,'%','SSR general note (i)A',''),
('R16','basis','All SSR rates exclude GST',None,'','SSR rate tables header',''),
('R17','basis','Concrete items include normal curing',None,'','SSR general note (ix)',''),
('R18','basis','Excavation rates assume machine excavation; manual excavation needs SE permission',None,'','SSR general note (vii)',''),
('R19','transport','Truck payload used for lead calculations',10,'MT','SSR Leads and lifts (b)',''),
('R20','transport','Diesel price used (as on 1 Apr 2022)',102.88,'INR/litre','SSR Statement C',''),
('R21','transport','Truck hire used per day',2500,'INR/day','SSR Statement C','')]
pd.DataFrame([dict(rule_id=a,kind=b,description=c,value=d,unit=e,reference=f,note=g,source_id='SRC-01',status='READ') for a,b,c,d,e,f,g in R]).to_csv(OUT+'rate_rule.csv',index=False)
# ---------------- sources
S=[('SRC-01','Maharashtra PWD State Schedule of Rates 2022-23 (Civil)','Public Works Department, Govt. of Maharashtra','2022-07-25','https://pwd.maharashtra.gov.in/en/publication-type/state-schedule-of-rates/','doc1.pdf',sha(UP+'doc1.pdf'),'READ','Rates ex-GST; effective date per preface'),
('SRC-02','Minimum wage notification 7 Jun 2023 (construction / roads / building operations)','Industries, Energy & Labour Dept., Govt. of Maharashtra','2023-06-07','','Employment_in_the_construction_or_maintenance_of_roads_or_in_building_operations.pdf',sha(UP+'Employment_in_the_construction_or_maintenance_of_roads_or_in_building_operations.pdf'),'READ',''),
('SRC-03','Special allowance Jul-Dec 2026 notification','Govt. of Maharashtra, Labour','2026-08-05','','Minimum-Wages-Maharashtra-5-8-2026.pdf',sha(UP+'Minimum-Wages-Maharashtra-5-8-2026.pdf'),'HAND-READ','Scanned Marathi table; entry 11; verify digits'),
('SRC-04','Wholesale Price Index monthly, base 2022-23=100 (Oct 2026 release)','Office of the Economic Adviser, DPIIT','2026-10-01','','wpi_monthly_index_202610.xlsx',sha(UP+'wpi_monthly_index_202610.xlsx'),'READ','Latest two months provisional'),
('SRC-05','PWD file DRAFT 20-7-2022 (likely electrical)','Unclear','2022-07-20','','doc2.pdf',sha(UP+'doc2.pdf'),'NOT EXTRACTED','Scanned; needs OCR')]
pd.DataFrame([dict(source_id=a,name=b,issuer=c,edition_date=d,url=e,file_name=f,file_sha256=g,status=h,notes=i) for a,b,c,d,e,f,g,h,i in S]).to_csv(OUT+'data_source.csv',index=False)
print('done')
