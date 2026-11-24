import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
for d in tree.getroot().findall('.//diagram'):
    if 'UC-26' in d.get('name', ''):
        print(f"=== Found tab: {d.get('name')} ===")
        for c in d.findall('.//mxCell'):
            if c.get('edge') == '1':
                cid = c.get('id')
                src = c.get('source')
                tgt = c.get('target')
                val = c.get('value', '')
                style = c.get('style', '')
                if any(k in cid for k in ['rel', 'repo_schema', 'sub_rel']):
                    print(f"{cid}: {src} -> {tgt} | value='{val}'")
                    print(f"    style={style}")
