import json,re,sys
from copy import copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tmp/report5-deps'))
import xlrd
from openpyxl import load_workbook
OUT=ROOT/'docs/Report 5';BASE=ROOT/'tmp/report5-originals'
catalog=json.loads((Path(__file__).parent/'nhuy-test-catalog.json').read_text(encoding='utf8'))
source=xlrd.open_workbook(BASE/'Report5_Unit Test.xls',formatting_info=True)
unit=xlrd.open_workbook(OUT/'Report5_Unit Test.xls',formatting_info=True)
unchanged=0
for old in source.sheets():
 new=unit.sheet_by_name(old.name)
 for r in range(old.nrows):
  for c in range(old.ncols):
   if old.name=='Statistics' and (r>=132 or (r==6 and c==1)):continue
   assert old.cell_value(r,c)==new.cell_value(r,c),(old.name,r,c)
   unchanged+=1
 for col,info in old.colinfo_map.items():assert new.colinfo_map[col].width==info.width,(old.name,col,'width')
for g in catalog['groups']:
 s=unit.sheet_by_name((g['id']+' '+g['method'])[:31]);keys=list(dict.fromkeys(k for c in g['cases'] for k in c['inputs']))
 # Every field must select exactly one value for every case.
 r=9
 for key_index,key in enumerate(keys):
  assert s.cell_value(r,1)==key,(g['id'],key,r);r+=1;start=r
  next_header=keys[key_index+1] if key_index+1<len(keys) else 'Return / Exception'
  while s.cell_value(r,1)!=next_header:r+=1
  for i in range(len(g['cases'])):assert sum(s.cell_value(j,5+i)=='O' for j in range(start,r))==1,(g['id'],key,i)
 assert s.cell_value(r,1)=='Return / Exception';r+=1
 end=r+len(set(c['confirm'] for c in g['cases']))
 for i,c in enumerate(g['cases']):
  assert sum(s.cell_value(j,5+i)=='O' for j in range(r,end))==1
  assert s.cell_value(end,5+i)==c['type']
  assert s.cell_value(end+1,5+i)=='P'
 assert s.cell_value(6,14)==len(g['cases'])
original=load_workbook(BASE/'Report5_Test Report.xlsx',data_only=False)
system=load_workbook(OUT/'Report5_Test Report.xlsx',data_only=False)
cached=load_workbook(OUT/'Report5_Test Report.xlsx',data_only=True)
def visible_font(value):
 font=copy(value)
 if font.color is not None and font.color.type=='rgb':font.color.rgb='FF'+font.color.rgb[-6:]
 return font
for old in original:
 new=system[old.title]
 for row in old:
  for c in row:
   if old.title=='Test Statistics' and (c.row>=34 or c.coordinate=='C6'):continue
   assert c.value==new[c.coordinate].value or (c.value is None and new[c.coordinate].value==''),(old.title,c.coordinate,c.value,new[c.coordinate].value)
   # Compare visible formatting, independent of internal style table indices.
   if c.value is not None:
    fill_ok=c.fill.patternType==new[c.coordinate].fill.patternType
    if c.fill.patternType is not None:fill_ok=fill_ok and c.fill.fgColor==new[c.coordinate].fill.fgColor
    assert visible_font(c.font)==visible_font(new[c.coordinate].font) and fill_ok,(old.title,c.coordinate,'visible style')
pending=0;ids=set();uc_ids=set()
for s in system:
 if not s.title.startswith('NH '):continue
 count=0
 for row in s:
  if not isinstance(row[0].value,str) or not row[0].value.startswith('TC-NH-'):continue
  count+=1;pending+=1
  assert row[0].value not in ids,('duplicate',row[0].value);ids.add(row[0].value)
  uc_ids.update(re.findall(r'UC-\d+\.\d+',str(row[1].value)))
  for col in [5,8,11]:
   assert row[col].value=='Pending'
   assert row[col+1].value is None and row[col+2].value is None
 assert cached[s.title]['B4'].value==count,(s.title,count,cached[s.title]['B4'].value)
 assert cached[s.title]['D6'].value==count
assert pending==198 and len(uc_ids)==51,(pending,len(uc_ids))
errors=[]
for s in cached:
 for row in s:
  for c in row:
   if c.data_type=='e':errors.append((s.title,c.coordinate,c.value))
assert not errors,errors
summary={'unitMethods':len(catalog['groups']),'newUnitCases':sum(len(g['cases']) for g in catalog['groups']),'systemCasesPending':pending,'mappedUseCases':len(uc_ids),'originalUnitCellsPreserved':unchanged,'systemTotal':cached['Test Statistics']['H50'].value,'formulaErrors':errors}
(Path(__file__).parent/'nhuy-verification.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')
print(json.dumps(summary))
