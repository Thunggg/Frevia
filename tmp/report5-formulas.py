import sys,struct
sys.path.insert(0,'tmp/report5-deps')
import xlrd
from xlrd.compdoc import CompDoc
s=CompDoc(open('docs/Report 5/Report5_Unit Test.xls','rb').read()).get_named_stream('Workbook')
p=0;counts={}
while p+4<len(s):
 t,l=struct.unpack_from('<HH',s,p);counts[t]=counts.get(t,0)+1;p+=4+l
print('Formula records',counts.get(6,0),'hyperlinks',counts.get(440,0))
b=xlrd.open_workbook('docs/Report 5/Report5_Unit Test.xls',formatting_info=True)
s=b.sheet_by_name('UF-121 RecommendAI')
for r,c in [(1,0),(8,5),(10,1),(10,5)]:
 xf=b.xf_list[s.cell_xf_index(r,c)];f=b.font_list[xf.font_index]
 print(r,c,'font',f.name,f.height,'fill',xf.background.pattern_colour_index,'rowheight',s.rowinfo_map.get(r).height)
