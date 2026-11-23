import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-24.03-create-milestone.drawio')
root = tree.getroot()
print('=== Lifelines & Frames ===')
for c in root.findall('.//mxCell'):
    val = c.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('<br>', ' ')
    style = c.get('style', '')
    if 'shape=umlLifeline' in style or 'participant' in style:
        print(f'  Lifeline {c.get("id")}: "{val}"')
    elif 'shape=umlFrame' in style:
        print(f'  Frame {c.get("id")}: "{val}"')

print('\n=== Messages (Edges) ===')
for c in root.findall('.//mxCell'):
    if c.get('edge') == '1':
        val = c.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('<br>', ' ')
        src = c.get('source')
        tgt = c.get('target')
        style = c.get('style', '')
        dashed = 'dashed=1' in style
        arrow = '<--' if dashed else '-->'
        print(f'  {src} {arrow} {tgt}: "{val}"')
