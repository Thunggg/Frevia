"""Extend the legacy BIFF .xls matrix (Artifact Tool cannot import/export BIFF).

The original workbook contains no formula records. xlutils preserves its cell
styles and values; a separate verifier compares every unaffected source cell.
The .xlsx system-test report is authored separately with Artifact Tool.
"""
import sys,json,re,math,shutil
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tmp/report5-deps'))
import xlrd,xlwt
from xlutils.copy import copy
CAT=json.loads((Path(__file__).parent/'nhuy-test-catalog.json').read_text(encoding='utf8'))
RESULT=json.loads((ROOT/'tmp/report5-all-results.json').read_text(encoding='utf8'))
RESULT['testResults']=[f for f in RESULT['testResults'] if '/test/nhuy/' in f['name'].replace('\\','/')]
scoped=[t for f in RESULT['testResults'] for t in f['assertionResults']]
RESULT['numTotalTests']=len(scoped)
RESULT['numPassedTests']=sum(t['status']=='passed' for t in scoped)
RESULT['numFailedTests']=sum(t['status']=='failed' for t in scoped)
assert RESULT['numTotalTests']==sum(len(g['cases']) for g in CAT['groups'])
assert RESULT['numFailedTests']==0
statuses={}
for f in RESULT['testResults']:
 for t in f['assertionResults']:
  uf=re.search(r'UF-\d+',t['ancestorTitles'][-1]).group()
  statuses[(uf,t['title'])]=t['status']
OUT=ROOT/'docs/Report 5'
SOURCE=ROOT/'tmp/report5-originals'
book=xlrd.open_workbook(SOURCE/'Report5_Unit Test.xls',formatting_info=True)
wb=copy(book)
body=xlwt.easyxf('font: name Tahoma, height 160; alignment: vertical center, wrap on; borders: left thin, right thin, top thin, bottom thin;')
head=xlwt.easyxf('font: name Tahoma, height 160, bold on; pattern: pattern solid, fore_colour ice_blue; alignment: vertical center, wrap on; borders: left thin, right thin, top thin, bottom thin;')
mark=xlwt.easyxf('font: name Tahoma, height 200; alignment: horizontal center, vertical center; borders: left thin, right thin, top thin, bottom thin;')
code=xlwt.easyxf('font: name Tahoma, height 160; alignment: horizontal center, vertical center, wrap on; borders: left thin, right thin, top thin, bottom thin;')
def compact(v):
 if v is None:return 'null'
 if isinstance(v,bool):return str(v).lower()
 if isinstance(v,(int,float)):return v
 if isinstance(v,list):
  if not v:return '[]'
  if len(v)>3 and len(set(map(str,v)))==1:return f'[{compact(v[0])}] repeated {len(v)} times'
  if len(v)>3:return f'Array.from({len(v)} entries: "Item0" through "Item{len(v)-1}")'
  return '['+'; '.join(str(compact(x)) for x in v)+']'
 if isinstance(v,dict):return '{'+'; '.join(f'{k}: {compact(x)}' for k,x in v.items())+'}'
 if len(v)>80 and len(set(v))==1:return f'"{v[0]}".repeat({len(v)})'
 if len(v)>100 and v.startswith('https://example.test/') and set(v[21:])=={'x'}:return f'"https://example.test/" + "x".repeat({len(v)-21})'
 if v in ['null','undefined','present','not supplied','empty']:return v
 return json.dumps(v,ensure_ascii=False) if v else 'empty'
def short(v):return str(compact(v))
def sheet_name(g):return (g['id']+' '+g['method'])[:31]
def height(sheet,row,value):
 sheet.row(row).height=value
 sheet.row(row).height_mismatch=True
for g in CAT['groups']:
 s=wb.add_sheet(sheet_name(g));s.set_portrait(False);s.paper_size_code=9
 s.set_fit_width_to_pages(1);s.set_fit_height_to_pages(0)
 s.panes_frozen=True;s.horz_split_pos=9;s.vert_split_pos=5;s.remove_splits=True
 s.col(0).width=2076
 for col,width in [(1,3413),(2,2759),(3,2901),(4,455)]:s.col(col).width=width
 n=len(g['cases']);end=max(19,n+4)
 for c in range(5,end+1):s.col(c).width=2000 if c<5+n else 711
 def merge(r,c1,c2,value,style=body):s.write_merge(r,r,c1,c2,value,style)
 merge(1,0,1,'Function Code',head);merge(1,2,4,g['id']);merge(1,5,10,'Function Name',head);merge(1,11,end,g['method'])
 merge(2,0,1,'Created By',head);merge(2,2,4,CAT['owner']);merge(2,5,10,'Executed By',head);merge(2,11,end,'Jest automated execution')
 merge(3,0,1,'Lines of code',head);merge(3,2,4,g.get('loc',0));merge(3,5,10,'Lack of test cases',head);merge(3,11,end,0)
 merge(4,0,1,'Test requirement',head);merge(4,2,end,' '.join(g['uc'])+' - '+g['className']+'.'+g['method']+'. '+g['endpoint']);height(s,4,660)
 types=Counter(c['type'] for c in g['cases']);passed=sum(statuses[(g['id'],c['name'])]=='passed' for c in g['cases'])
 for c1,c2,value in [(0,1,'Passed'),(2,4,'Failed'),(5,10,'Untested'),(11,13,'N/A/B'),(14,end,'Total Test Cases')]:merge(5,c1,c2,value,head)
 for c1,c2,value in [(0,1,passed),(2,4,n-passed),(5,10,0),(14,end,n)]:merge(6,c1,c2,value,code)
 for c,t in zip([11,12,13],['N','A','B']):s.write(6,c,types[t],code)
 for i,c in enumerate(g['cases']):s.write(8,5+i,c['id'],head)
 height(s,8,600)
 r=9;keys=list(dict.fromkeys(k for c in g['cases'] for k in c['inputs']))
 for key in keys:
  merge(r,1,4,key,head);r+=1
  vals=list(dict.fromkeys(short(c['inputs'].get(key,'not supplied')) for c in g['cases']))
  for value in vals:
   merge(r,1,4,value);height(s,r,max(300,min(6000,300*math.ceil(len(str(value))/48))))
   for i,c in enumerate(g['cases']):s.write(r,5+i,'O' if short(c['inputs'].get(key,'not supplied'))==value else '',mark)
   r+=1
 s.write_merge(9,r-1,0,0,'Condition',head)
 confirm_start=r;merge(r,1,4,'Return / Exception',head);r+=1
 for confirm in dict.fromkeys(c['confirm'] for c in g['cases']):
  display=re.sub(r'"x{80,}"',lambda m:f'"x".repeat({len(m[0])-2})',confirm)
  merge(r,1,4,display);height(s,r,min(8000,max(400,300*math.ceil(len(display)/48))))
  for i,c in enumerate(g['cases']):s.write(r,5+i,'O' if c['confirm']==confirm else '',mark)
  r+=1
 s.write_merge(confirm_start,r-1,0,0,'Confirm',head)
 result_start=r
 for label,key in [('Type(N : Normal, A : Abnormal, B : Boundary)','type'),('Passed/Failed','status'),('Executed Date','date'),('Defect ID','defect')]:
  merge(r,1,4,label,head)
  for i,c in enumerate(g['cases']):
   val=c['type'] if key=='type' else 'P' if key=='status' else CAT['date'] if key=='date' else ''
   s.write(r,5+i,val,code)
  r+=1
 for j in range(result_start,r):height(s,j,500)
 s.write_merge(result_start,r-1,0,0,'Result',head)
 s.print_area=f'A1:{xlrd.formula.colname(end)}{r}'
 # Preserve the existing Function List convention and numbering.
 f=wb.get_sheet(book.sheet_names().index('Functions'));row=int(g['id'].split('-')[1])+9
 values=[int(g['id'].split('-')[1]),' '.join(g['uc']),g['className'],g['method'],g['id'],sheet_name(g),'Unit service branches and controller DTO boundaries','Mock dependencies; fixed date 2026-11-09; no network or database']
 for col,v in enumerate(values):f.write(row,col,v,body)
 height(f,row,600)

# Keep old function rows; move only the dependent subtotal and percentages.
stats=wb.get_sheet(book.sheet_names().index('Statistics'))
old=book.sheet_by_name('Statistics');base_counts=[sum(float(old.cell_value(r,c) or 0) for r in range(11,132)) for c in range(2,9)]
for g in CAT['groups']:
 row=int(g['id'].split('-')[1])+10;types=Counter(c['type'] for c in g['cases']);n=len(g['cases'])
 for col,v in enumerate([int(g['id'].split('-')[1]),g['id'],n,0,0,types['N'],types['A'],types['B'],n]):stats.write(row,col,v,body)
last=132+len(CAT['groups'])
tot=[base_counts[0]+RESULT['numPassedTests'],base_counts[1],base_counts[2],base_counts[3]+sum(c['type']=='N' for g in CAT['groups'] for c in g['cases']),base_counts[4]+sum(c['type']=='A' for g in CAT['groups'] for c in g['cases']),base_counts[5]+sum(c['type']=='B' for g in CAT['groups'] for c in g['cases']),base_counts[6]+RESULT['numTotalTests']]
stats.write(last,1,'Sub Total',head)
for col,v in enumerate(tot,2):stats.write(last,col,v,head)
for offset,label,value in [(2,'Test coverage',(tot[0]+tot[1])/tot[6]*100),(3,'Test successful coverage',tot[0]/tot[6]*100),(4,'Normal case',tot[3]/tot[6]*100),(5,'Abnormal case',tot[4]/tot[6]*100),(6,'Boundary case',tot[5]/tot[6]*100)]:
 stats.write(last+offset,1,label,body);stats.write(last+offset,3,value,body);stats.write(last+offset,4,'%',body)
stats.write(6,1,'Original UF-01 to UF-121 results retained from the previous report. Added Nhật Huy cases are linked to actual Jest execution on 09/11/2026.',body)
cover=wb.get_sheet(book.sheet_names().index('Cover'))
for c,v in enumerate(['09/11/2026','2.0','Add Nhat Huy tests','A',f"Add {len(CAT['groups'])} method matrices and {RESULT['numTotalTests']} executed unit cases covering 51 use cases across Sprints 1-5.",'Report 3, Report 4 and backend source']):cover.write(20,c,v,body)
height(cover,20,1050)
wb.save(OUT/'Report5_Unit Test.xls')

# Data for Artifact Tool: system/API scenarios follow the original 3-round table.
ucs=json.loads((ROOT/'docs/Report 3/nhuy-coverage.json').read_text(encoding='utf8'))['functions']
modules={}
request_bodies={'updateProfile':{'displayName':'Name','title':'Engineer'},'addSkill':{'skillName':'TypeScript','proficiencyLevel':5},'addPortfolio':{'title':'Project'},'updatePortfolio':{'title':'Updated'},'updateClientProfile':{'companyName':'Company'},'addSocialLink':{'platform':'GITHUB','url':'https://github.com/test'},'switchRole':{'role':'Freelancer'},'joinRole':{'role':'Freelancer'},'create':{'overallRating':4.5},'update':{'overallRating':4.5},'respond':{'responseText':'Thank you'},'updateResponse':{'responseText':'Updated'},'updateGeneralProfile':{'displayName':'Name'},'changePassword':{'currentPassword':'OldPass1','newPassword':'NewPass1','confirmPassword':'NewPass1'},'approve':{'reviewNotes':'Approved'},'reject':{'reviewNotes':'Fix data'},'submitUpdate':{'displayName':'Expert','expertise':['AI'],'education':[],'certifications':[]}}
for uc in ucs:
 candidates=[g for g in CAT['groups'] if uc['id'] in g['uc'] and not g['endpoint'].startswith('Internal')]
 g=candidates[0]
 # History uses the admin list for a full status-filterable history.
 if uc['id']=='UC-47.05':g=next(g for g in candidates if g['method']=='list')
 module=g['module'];items=modules.setdefault(module,[])
 happy=next(c for c in g['cases'] if c['type']=='N' and not c.get('schema'))
 selected=[happy]
 for predicate in [lambda c:c['type']=='A' and not c.get('schema') and c.get('http'),lambda c:c['type']=='B' and c.get('schema'),lambda c:c.get('schema') and c.get('http')==400]:
  candidate=next((c for c in g['cases'] if predicate(c)),None)
  if candidate:selected.append(candidate)
 for c in selected:
  case_id=f"TC-NH-{uc['id'][3:].replace('.','')}-{len([i for i in items if i['uc']==uc['id']])+1:02}"
  inp='; '.join(f'{k}={short(v)}' for k,v in c['inputs'].items() if k!='layer')
  body={k:v for k,v in c['inputs'].items() if k not in g['defaults']} if c.get('schema') else request_bodies.get(g['method'])
  procedure=f"1. Prepare the preconditions and sign in with the stated account.\n2. Send {g['endpoint']}"+('. Body: '+str(compact(body)) if body is not None else '.')+f"\n3. Verify the response and persisted state for: {c['name']}."
  if g['method'] in ['uploadCv','uploadAvatar','uploadIdentityDocument']:
   procedure=procedure.replace('\n3.',f" Multipart: file={'valid PDF up to 10 MiB' if g['method']!='uploadAvatar' else 'valid PNG up to 5 MiB'}"+('; documentType=ID_CARD.' if g['method']=='uploadIdentityDocument' else '.')+'\n3.')
  expected=c['confirm']
  if c.get('http') and c['confirm'].startswith(f"HTTP {c['http']}. {{"):
   raw=json.loads(c['confirm'].split('. ',1)[1]);expected=f"HTTP {c['http']}. error.code=\"{c['http']}\"; error.message=\"{raw.get('error','Validation failed')}\"; error.details="+json.dumps(raw.get('message'),ensure_ascii=False)
  if c is happy:
   status=201 if g['endpoint'].startswith('POST ') else 200
   expected=f'HTTP {status}. '+uc['effect']
  if c.get('schema') and c.get('http') is None:
   expected='The request body passes DTO validation. '+uc['effect']
  if uc['id']=='UC-07.05':procedure+='\n4. Verify the new CV replaces the old CV and the previous asset is removed.'
  if uc['id']=='UC-47.05':procedure+='\n4. Repeat the list request with status=APPROVED and status=REJECTED. Verify pagination and ordering.'
  items.append({'id':case_id,'uc':uc['id'],'feature':uc['name'],'description':uc['id']+' - '+c['name'],'procedure':procedure,'expected':expected,'preconditions':inp,'status':'Pending','matrix':g['id']+'/'+c['id']})
 # Authentication belongs to system/API scope; do not imply a service mock tests JWT.
 public=uc['id'] in ['UC-07.01','UC-08.01','UC-09.01','UC-09.03','UC-19.01']
 if not public:
  items.append({'id':f"TC-NH-{uc['id'][3:].replace('.','')}-AUTH",'uc':uc['id'],'feature':uc['name'],'description':uc['id']+' - Reject an unauthenticated request','procedure':f"1. Clear the session and Authorization header.\n2. Send {g['endpoint']}.\n3. Verify no protected data is returned and no data is changed.",'expected':'HTTP 401 from authentication guard. No protected action is executed.','preconditions':'No valid access token. Other request fields are valid.','status':'Pending','matrix':'System authentication check'})
# Additional endpoints inside the same UC workflows.
for method in ['submitIdentityAiCheck','analyzeCv','getCvAnalysis','confirmCvAnalysis','discardCvAnalysis']:
 g=next(g for g in CAT['groups'] if g['method']==method);uc='UC-18.01' if method=='submitIdentityAiCheck' else 'UC-07.03'
 cases=[c for c in g['cases'] if not c.get('schema') and (c['type']=='N' or c.get('http') in [400,409,503])][:7]
 for i,c in enumerate(cases,1):
  procedure=f"1. Sign in as the owning freelancer. Prepare {short(c['inputs'])}.\n2. Send {g['endpoint']}.\n3. Verify {c['name']} and inspect the stored document or analysis."
  if method=='submitIdentityAiCheck':procedure+='\nMultipart: documentType=ID_CARD, front and selfie PNG images, one PNG liveness frame. Apply the one changed input from the preconditions.'
  if method=='confirmCvAnalysis':procedure+='\nJSON body: {}. The analysis is PENDING and belongs to the current CV unless a different precondition is stated.'
  modules[g['module']].append({'id':f'TC-NH-{uc[3:].replace(".","")}-{method[:7].upper()}-{i:02}','uc':uc,'feature':'Identity AI verification' if method=='submitIdentityAiCheck' else 'CV analysis workflow','description':uc+' - '+c['name'],'procedure':procedure,'expected':c['confirm'],'preconditions':short(c['inputs']),'status':'Pending','matrix':g['id']+'/'+c['id']})
(ROOT/'tmp/report5-artifacts/system-cases.json').write_text(json.dumps({'modules':modules,'unitTotal':RESULT['numTotalTests'],'ucCount':len(ucs)},ensure_ascii=False,indent=2),encoding='utf8')
# Read-only render input for the original legacy matrix layout.
s=book.sheet_by_name('UF-121 RecommendAI')
(ROOT/'tmp/report5-artifacts/unit-baseline.json').write_text(json.dumps({'values':[s.row_values(r) for r in range(s.nrows)],'merges':s.merged_cells,'widths':{c:info.width/256 for c,info in s.colinfo_map.items()},'heights':{r:info.height/20 for r,info in s.rowinfo_map.items()}},ensure_ascii=False),encoding='utf8')
print(f"Updated unit workbook: {len(CAT['groups'])} matrices / {RESULT['numTotalTests']} executed cases. Prepared {sum(map(len,modules.values()))} pending system cases.")
