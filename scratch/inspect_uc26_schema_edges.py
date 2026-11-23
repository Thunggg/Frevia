import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio')
for d in tree.getroot().findall('.//diagram'):
    if 'UC-26' in d.get('name', ''):
        print(f"=== Tab: {d.get('name')} ===")
        cells = {c.get('id'): c for c in d.findall('.//mxCell')}
        for cid, c in cells.items():
            if 'schema' in cid.lower() and c.get('vertex') == '1':
                geo = c.find('mxGeometry')
                print(f"  Node {cid}: x={geo.get('x')}, y={geo.get('y')}, w={geo.get('width')}, h={geo.get('height')}")
        for cid, c in cells.items():
            if c.get('edge') == '1':
                src = c.get('source')
                tgt = c.get('target')
                val = c.get('value', '')
                style = c.get('style', '')
                if any(k in str(src) or k in str(tgt) or k in cid for k in ['schema', 'rel', 'repo']):
                    geo = c.find('mxGeometry')
                    pts = []
                    if geo is not None:
                        arr = geo.find('Array')
                        if arr is not None:
                            pts = [(p.get('x'), p.get('y')) for p in arr.findall('mxPoint')]
                    print(f"  Edge {cid}: {src} -> {tgt} | val='{val}' | pts={pts}")
                    print(f"      style: {style}")
