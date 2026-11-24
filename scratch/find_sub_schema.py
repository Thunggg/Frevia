import xml.etree.ElementTree as ET
import glob

print("Files containing sub_schemaSubmission:")
for f in glob.glob('class-diagrams/*.drawio'):
    tree = ET.parse(f)
    for c in tree.getroot().findall('.//mxCell'):
        if c.get('id') == 'sub_schemaSubmission':
            print(f"  {f}")
            break
