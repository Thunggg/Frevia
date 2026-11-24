import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams/ptai/UC-11.04_-_Update_Job.drawio')
root = tree.getroot()
print('=== Cells in Tai UC-11.04 ===')
for c in root.findall('.//mxCell'):
    cid = c.get('id', '')
    val = c.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('<br>', '\n   ')
    style = c.get('style', '')
    if c.get('vertex') == '1':
        geo = c.find('mxGeometry')
        gx = geo.get('x') if geo is not None else ''
        gy = geo.get('y') if geo is not None else ''
        gw = geo.get('width') if geo is not None else ''
        gh = geo.get('height') if geo is not None else ''
        if 'umlFrame' in style:
            print(f"FRAME {cid} (y={gy}, h={gh}): '{val}'")
        elif 'shape=umlLifeline' in style or 'actor' in cid or 'll_' in cid:
            print(f"LIFELINE {cid} (x={gx}, w={gw}): '{val}'")
        elif 'text' in style:
            print(f"TEXT {cid} (y={gy}): '{val}'")
    elif c.get('edge') == '1':
        print(f"EDGE {cid}: '{val}' | style={style[:60]}")
