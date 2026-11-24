import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/nhuy/UC-07.01-view-freelancer-profile.drawio')
root = tree.getroot()
print('=== Nhuy UC-07.01 Messages ===')
for c in root.findall('.//mxCell'):
    if c.get('edge') == '1':
        val = c.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('<br>', ' ')
        src = c.get('source')
        tgt = c.get('target')
        style = c.get('style', '')
        dashed = 'dashed=1' in style
        arrow = '<--' if dashed else '-->'
        if val:
            print(f'  {src} {arrow} {tgt}: "{val}"')
