import xml.etree.ElementTree as ET

for fname in ['class-diagrams/UC-13_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/UC-33_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/UC-14_Forum_Management_Class_Diagram.drawio']:
    print(f"=== {fname} ===")
    tree = ET.parse(fname)
    for c in tree.getroot().findall('.//mxCell'):
        cid = c.get('id', '')
        if 'rel' in cid and c.get('edge') == '1':
            print(f"  {cid}: src={c.get('source')}, tgt={c.get('target')}, val='{c.get('value')}'")
            print(f"     style={c.get('style')}")
            for child in c:
                if child.tag == 'mxCell':
                    print(f"     child cell: val='{child.get('value')}', style={child.get('style')}")
