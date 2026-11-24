import xml.etree.ElementTree as ET

# Look at all edges in Sprint 2 (since the user specifically said: "ở đây phần milestone @Sprint2_Milestone_Management_Class_Diagram.drawio ... và còn lỗi một số mũi tên như hình")
tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
root = tree.getroot()
nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')}
edges = [c for c in root.findall('.//mxCell') if c.get('edge') == '1']

for e in edges:
    geo = e.find('mxGeometry')
    pts = []
    if geo is not None and geo.find('Array') is not None:
        pts = [(float(p.get('x')), float(p.get('y'))) for p in geo.find('Array').findall('mxPoint')]
    style = e.get('style', '')
    sid = e.get('source')
    tid = e.get('target')
    sn = nodes.get(sid)
    tn = nodes.get(tid)
    sname = sn.get('value', '').splitlines()[0] if sn is not None else sid
    tname = tn.get('value', '').splitlines()[0] if tn is not None else tid
    print(f"{e.get('id')}: {sname} -> {tname} | pts={pts} | style={style}")
