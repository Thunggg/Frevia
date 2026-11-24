import xml.etree.ElementTree as ET
import glob

print("Checking cardinality styles in other class diagrams:")
for f in glob.glob('class-diagrams/*.drawio'):
    tree = ET.parse(f)
    for c in tree.getroot().findall('.//mxCell'):
        val = c.get('value', '')
        if c.get('edge') == '1' and any(k in val for k in ['1', '*', '..', 'maps', 'calls']):
            print(f"[{f}] Edge {c.get('id')}: val='{val}' | style={c.get('style')[:80]}")
            # check children of edge
            for child in c:
                print(f"   child: {child.tag} {child.attrib}")
            break
