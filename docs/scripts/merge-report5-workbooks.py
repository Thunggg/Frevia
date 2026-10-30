"""Append Artifact Tool-authored sheets without round-tripping original Excel tabs.

Original workbook XML parts remain byte-identical except package registries,
shared strings and styles. This preserves existing formulas, sheets and features.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from lxml import etree as E
import json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/report-completion'
NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
q=lambda x:f'{{{NS}}}{x}'
def load(z):
    return {n:z.read(n) for n in z.namelist()}
def parse(parts,name):
    return E.fromstring(parts[name])
def serialize(root):
    return E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
def merge(base_name,extra_name):
    target=ROOT/'docs/Report 5'/base_name
    with ZipFile(target) as z: original=load(z)
    backup=OUT/(base_name+'.before-completion')
    if not backup.exists(): backup.write_bytes(target.read_bytes())
    # Idempotent rebuild always uses the preserved original package.
    with ZipFile(backup) as z: original=load(z)
    with ZipFile(OUT/extra_name) as z: extra=load(z)
    result=dict(original)
    # Shared string offsets.
    sname='xl/sharedStrings.xml'
    a=parse(original,sname) if sname in original else E.Element(q('sst'),nsmap={None:NS})
    b=parse(extra,sname) if sname in extra else E.Element(q('sst'),nsmap={None:NS})
    offset=len(a)
    for item in b: a.append(deepcopy(item))
    a.set('uniqueCount',str(len(a)));a.set('count',str(int(a.get('count','0'))+int(b.get('count','0'))))
    result[sname]=serialize(a)
    # Map added styles into the original global style collections.
    sa=parse(original,'xl/styles.xml');sb=parse(extra,'xl/styles.xml')
    offsets={}
    nfa=sa.find(q('numFmts'))
    if nfa is None: nfa=E.Element(q('numFmts'),count='0');sa.insert(0,nfa)
    used={int(x.get('numFmtId')) for x in nfa}
    fmtmap={}
    for item in sb.findall(q('numFmts')+'/'+q('numFmt')):
        old=int(item.get('numFmtId'));new=max(used|{163})+1;used.add(new);fmtmap[old]=new
        newitem=deepcopy(item);newitem.set('numFmtId',str(new));nfa.append(newitem)
    nfa.set('count',str(len(nfa)))
    for name in ['fonts','fills','borders','cellStyleXfs','cellXfs','dxfs']:
        aa=sa.find(q(name));bb=sb.find(q(name))
        if aa is None: aa=E.SubElement(sa,q(name),count='0')
        offsets[name]=len(aa)
        if bb is not None:
            for item in bb:
                it=deepcopy(item)
                if name in ['cellStyleXfs','cellXfs']:
                    for attr,col in [('fontId','fonts'),('fillId','fills'),('borderId','borders'),('xfId','cellStyleXfs')]:
                        if it.get(attr) is not None:it.set(attr,str(int(it.get(attr))+offsets[col]))
                    if int(it.get('numFmtId','0')) in fmtmap:it.set('numFmtId',str(fmtmap[int(it.get('numFmtId'))]))
                aa.append(it)
        aa.set('count',str(len(aa)))
    result['xl/styles.xml']=serialize(sa)
    wb=parse(original,'xl/workbook.xml');rels=parse(original,'xl/_rels/workbook.xml.rels');types=parse(original,'[Content_Types].xml')
    ew=parse(extra,'xl/workbook.xml');er=parse(extra,'xl/_rels/workbook.xml.rels')
    emap={r.get('Id'):r.get('Target').lstrip('/') for r in er}
    sheetParent=wb.find(q('sheets'));names={s.get('name') for s in sheetParent}
    maxid=max(int(s.get('sheetId')) for s in sheetParent)
    nextpart=max([int(n.split('sheet')[-1].split('.')[0]) for n in result if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]+[0])+1
    ridnums=[int(r.get('Id')[3:]) for r in rels if r.get('Id','').startswith('rId') and r.get('Id')[3:].isdigit()]
    rid=max(ridnums+[0])+1
    added=[]
    for sheet in ew.find(q('sheets')):
        name=sheet.get('name')
        if name in names: raise ValueError(f'Duplicate sheet: {name}')
        src=emap[sheet.get(f'{{{REL}}}id')]
        if not src.startswith('xl/'):src='xl/'+src
        doc=parse(extra,src)
        for cell in doc.iter(q('c')):
            if cell.get('s') is not None:cell.set('s',str(int(cell.get('s'))+offsets['cellXfs']))
            if cell.get('t')=='s':
                v=cell.find(q('v'))
                if v is not None:v.text=str(int(v.text)+offset)
        for cf in doc.iter(q('cfRule')):
            if cf.get('dxfId') is not None:cf.set('dxfId',str(int(cf.get('dxfId'))+offsets['dxfs']))
        dest=f'xl/worksheets/sheet{nextpart}.xml';result[dest]=serialize(doc)
        maxid+=1
        E.SubElement(sheetParent,q('sheet'),name=name,sheetId=str(maxid),attrib={f'{{{REL}}}id':f'rId{rid}'})
        E.SubElement(rels,f'{{{PKG}}}Relationship',Id=f'rId{rid}',Type=REL+'/worksheet',Target=f'worksheets/sheet{nextpart}.xml')
        E.SubElement(types,f'{{{CT}}}Override',PartName='/'+dest,ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml')
        added.append(name);rid+=1;nextpart+=1
    if sname not in original:
        E.SubElement(rels,f'{{{PKG}}}Relationship',Id=f'rId{rid}',Type=REL+'/sharedStrings',Target='sharedStrings.xml')
        E.SubElement(types,f'{{{CT}}}Override',PartName='/'+sname,ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml')
    calc=wb.find(q('calcPr'))
    if calc is not None:calc.set('fullCalcOnLoad','1')
    result['xl/workbook.xml']=serialize(wb);result['xl/_rels/workbook.xml.rels']=serialize(rels);result['[Content_Types].xml']=serialize(types)
    final=OUT/base_name
    with ZipFile(final,'w',ZIP_DEFLATED) as z:
        for name,data in result.items():z.writestr(name,data)
    target.write_bytes(final.read_bytes())
    unchanged=[n for n in original if n.startswith('xl/worksheets/')]
    assert all(original[n]==result[n] for n in unchanged)
    return {'file':base_name,'addedSheets':added,'originalWorksheetPartsPreserved':len(unchanged)}

if __name__=='__main__':
    report=[merge('Report5_Test_Case_Document.xlsx','report5-system-additions.xlsx'),merge('Report5_UnitTest.xlsx','report5-unit-additions.xlsx')]
    (OUT/'excel-preservation.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
