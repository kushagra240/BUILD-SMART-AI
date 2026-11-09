import pandas as pd, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter as L
C='/home/claude/ratesdb/csv/'
H=Font(name='Arial',bold=True,color='FFFFFF',size=10); HF=PatternFill('solid',fgColor='1F4D45'); B=Font(name='Arial',size=10); BLU=Font(name='Arial',size=10,color='0000FF')
wb=Workbook(); ws=wb.active; ws.title='README'
info=[('BuildSmart AI: sourced rates database v1.0.0','' ),
('What this is','The full extraction from the uploaded government documents, one sheet per database table. The authoritative copy is the PostgreSQL schema (sql/schema.sql) and CSV files; this workbook is for reading and filtering.'),
('Price basis','SSR 2022-23 rates, excluding GST, with an initial lead of 50 m. WPI base FY2022-23 = 100 (to Sep-26, latest two months provisional).'),
('Status columns','status / parse_status say how each row was obtained: READ (machine-read from text), HAND-READ (read from a scan by eye, verify), REVIEW (parser unsure; see review sheets).'),
('Blue text','Values copied from sources. Black = formula (work_item_ssr columns P and Q).'),
('Do not do','Do not use sheet material_wpi_map or the indicative rates as final prices: the mapping is automatic and unreviewed. Do not treat any web price as data.'),
('Known gaps','SSR serials 1598-1602 (structural strengthening) not extracted; 7 work items, 20 quantity-norm rows and 9 material rows are in the review sheets; doc2.pdf (probably electrical) not extracted; shuttering, zone price factors, overheads and GST still open.'),
('Sheet data_quality_report','Output of validate.py. 0 errors means internal consistency only, not that the source numbers are right.')]
for i,(a,b) in enumerate(info,1):
    ws.cell(i,1,a).font=Font(name='Arial',bold=True,size=14 if i==1 else 10); c=ws.cell(i,2,b); c.font=B; c.alignment=Alignment(wrap_text=True,vertical='top')
ws.column_dimensions['A'].width=24; ws.column_dimensions['B'].width=120
SHEETS=[('data_quality_report','../data_quality_report.csv'),('data_source','data_source.csv'),('zone','zone.csv'),('rate_rule','rate_rule.csv'),('labour_rate_ssr','labour_rate_ssr.csv'),('minimum_wage','minimum_wage.csv'),('material_rate_ssr','material_rate_ssr.csv'),('work_item_ssr','work_item_ssr.csv'),('quantity_norm','quantity_norm.csv'),('transport_trip_cost','transport_trip_cost.csv'),('wpi_item','wpi_item.csv'),('wpi_series','wpi_series.csv'),('material_wpi_map','material_wpi_map.csv'),('lead_charge_raw','lead_charge_raw.csv'),('review_work_items','review/work_items_review.csv'),('review_materials','review/material_rows_merged_or_unknown_unit.csv'),('review_norms','review/quantity_norm_review.csv')]
for name,f in SHEETS:
    df=pd.read_csv(C+f); w=wb.create_sheet(name)
    for j,h in enumerate(df.columns,1):
        c=w.cell(1,j,h); c.font=H; c.fill=HF; c.alignment=Alignment(wrap_text=True,vertical='center')
        mx=min(60,max([len(str(h))]+[len(str(v)) for v in df[h].head(200).fillna('')])+2); w.column_dimensions[L(j)].width=max(9,mx)
    for i,row in enumerate(df.itertuples(index=False),2):
        for j,v in enumerate(row,1):
            if pd.isna(v): continue
            c=w.cell(i,j,v.item() if hasattr(v,'item') else v); c.font=BLU if isinstance(c.value,(int,float)) else B
    if name=='work_item_ssr':
        ci={h:j for j,h in enumerate(df.columns,1)}; k=len(df.columns)
        for off,hd in ((1,'non_labour_rate (formula)'),(2,'labour_share (formula)')):
            c=w.cell(1,k+off,hd); c.font=H; c.fill=HF; w.column_dimensions[L(k+off)].width=18
        for i in range(2,len(df)+2):
            w.cell(i,k+1,f'={L(ci["completed_rate"])}{i}-{L(ci["labour_rate"])}{i}').font=B
            c=w.cell(i,k+2,f'=IF({L(ci["completed_rate"])}{i}=0,"",{L(ci["labour_rate"])}{i}/{L(ci["completed_rate"])}{i})'); c.font=B; c.number_format='0%'
    w.freeze_panes='A2'; w.auto_filter.ref=w.dimensions
wb.save('/home/claude/ratesdb/dist/BuildSmart_Rates_DB_v1.0.0.xlsx'); print('workbook saved')
