import xml.etree.ElementTree as ET

for path in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
    root = ET.parse(path).getroot()
    nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')}
    edges = [c for c in root.findall('.//mxCell') if c.get('edge') == '1']
    print("=" * 60)
    print(path)
    for e in edges:
        geo = e.find('mxGeometry')
        pts = []
        if geo is not None and geo.find('Array') is not None:
            pts = [(float(p.get('x')), float(p.get('y'))) for p in geo.find('Array').findall('mxPoint')]
        sid = e.get('source')
        tid = e.get('target')
        sn = nodes.get(sid)
        tn = nodes.get(tid)
        sname = sn.get('value', '').splitlines()[0] if sn is not None else sid
        tname = tn.get('value', '').splitlines()[0] if tn is not None else tid
        style = e.get('style', '')
        # print if dashed
        if 'dashed=1' in style:
            print(f"[{e.get('id')}] {sid} ({sname}) -> {tid} ({tname})")
            print(f"   style: {style}")
            print(f"   pts: {pts}")
