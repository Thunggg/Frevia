import sys, json
from pathlib import Path
sys.path.insert(0, str(Path('tmp/report5-deps').resolve()))
import xlrd
from openpyxl import load_workbook
root=Path('docs/Report 5')
book=xlrd.open_workbook(root/'Report5_Unit Test.xls', formatting_info=True)
print('UNIT SHEETS',book.sheet_names())
for name in book.sheet_names()[:5]+book.sheet_names()[-3:]:
 s=book.sheet_by_name(name)
 print('\nSHEET',name,s.nrows,s.ncols,'MERGES',s.merged_cells[:12])
 for r in range(min(s.nrows,80)):
  vals=['%s:%s'%(xlrd.formula.colname(c),s.cell_value(r,c)) for c in range(min(s.ncols,16)) if s.cell_value(r,c)!='']
  if vals: print(r+1,' | '.join(vals))
wb=load_workbook(root/'Report5_Test Report.xlsx',data_only=False)
for name in ['Test Cases','Test Statistics','Manage Forum','User Authentication']:
 s=wb[name];print('\nSYSTEM',name,s.max_row,s.max_column,'MERGES',list(s.merged_cells.ranges)[:8])
 for row in list(s.rows)[:18]:
  print(' | '.join(f'{c.column_letter}:{c.value}' for c in row[:14] if c.value is not None))
