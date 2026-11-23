import xml.etree.ElementTree as ET
import glob

for f in sorted(glob.glob('sequence-diagrams-remake/ntin/UC-13.*.drawio'))[:5]:
    tree = ET.parse(f)
    lifelines = []
    for c in tree.getroot().findall('.//mxCell'):
        style = c.get('style', '')
        if 'umlLifeline' in style or 'actor' in c.get('id', '') or 'db' in c.get('id', ''):
            val = c.get('value', c.get('id'))
            if val:
                lifelines.append(val)
    print(f, lifelines)
