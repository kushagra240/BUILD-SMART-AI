import pandas as pd,re,os,shutil
C='/home/claude/ratesdb/csv/'
m=pd.read_csv(C+'material_rate_ssr.csv')
UN={'No.':'No.','No':'No.','Nos.':'No.','Per Number':'No.','Per No':'No.','Sq.Mt.':'sq.m','Sq.mt.':'sq.m','Sq.Mt':'sq.m','Sq.mt':'sq.m','Smt.':'sq.m','Smt':'sq.m','Sqm':'sq.m','Per Sq mtre':'sq.m','R.Mt.':'r.m','R.Mt':'r.m','Rmt':'r.m','Rmt.':'r.m','Per meter':'r.m','L/M':'r.m','Rft':'r.ft','Cu.Mt.':'cu.m','Cum':'cu.m','Per Cum':'cu.m','Cmt.':'cu.m','Cmt':'cu.m','Kg.':'kg','Kg':'kg','kg':'kg','Per kg':'kg','Ltr.':'L','Ltr':'L','Lit.':'L','Liter':'L','Per liter':'L','M.T.':'MT','bags':'bag','Bag':'bag','Pair':'pair','Doz.':'dozen','Per Box':'box','Box':'box','Quintal':'quintal','Bundle':'bundle','1000 lit.':'1000 L','Per inch':'inch','Per kit':'kit'}
bad=m[~m.unit.isin(UN)]
print('moved to review (merged two-column lines / unknown unit):',len(bad))
bad.to_csv(C+'review/material_rows_merged_or_unknown_unit.csv',index=False)
m=m[m.unit.isin(UN)].copy()
m['unit_norm']=m.unit.map(UN)
dup=m.duplicated(['section','sr'],keep=False)
m['row_quality']=['DUPLICATE_SR_IN_SECTION' if d else 'OK' for d in dup]
m['is_building_relevant']=m.section.str.startswith('Building')|m.section.eq('General Rates')
m.to_csv(C+'material_rate_ssr.csv',index=False)
mp=pd.read_csv(C+'material_wpi_map.csv'); mp=mp[mp.material_id.isin(m.material_id)]; mp.to_csv(C+'material_wpi_map.csv',index=False)
print('materials kept',len(m),'dup flagged',dup.sum(),'building relevant',m.is_building_relevant.sum(),'map rows',len(mp))
l=pd.read_csv(C+'labour_rate_ssr.csv'); l['unit_norm']='day'; l.to_csv(C+'labour_rate_ssr.csv',index=False)
z=pd.read_csv(C+'zone.csv'); z['transport_lead_km_to_main_materials']=None; z['price_multiplier']=None; z.to_csv(C+'zone.csv',index=False)
pd.DataFrame([dict(version_id='v1.0.0',label='Initial sourced rates database',created_on='2026-11-07',price_basis='SSR 2022-23 ex-GST; WPI base 2022-23=100 to Sep-26',notes='Built from uploaded government documents; see data_source and review/ folder',is_active=True)]).to_csv(C+'dataset_version.csv',index=False)
pd.DataFrame([dict(key='wpi_base',value=100.0,description='WPI base value (FY2022-23 average = 100)'),dict(key='ssr_price_year',value=2022.0,description='Price year of the SSR (effective 25 Jul 2022)'),dict(key='min_wage_days_divisor',value=26.0,description='Monthly to daily minimum wage divisor per notification')]).to_csv(C+'parameter.csv',index=False)
for f in ('_review_material_unparsed.csv',):
    if os.path.exists(C+f): shutil.move(C+f,C+'review/'+f.lstrip('_'))
wi=pd.read_csv(C+'work_item_ssr.csv'); wi[wi.parse_status=='REVIEW'].to_csv(C+'review/work_items_review.csv',index=False)
q=pd.read_csv(C+'quantity_norm.csv'); q['sr']=q.sr.astype('Int64'); q.to_csv(C+'quantity_norm.csv',index=False); q[q.parse_status.str.startswith('REVIEW')].to_csv(C+'review/quantity_norm_review.csv',index=False)
print('review files',os.listdir(C+'review'))
