import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.01-create-contract.drawio')
root = tree.getroot()
print('=== All Nodes in UC-13.01 ===')
for c in root.findall('.//mxCell'):
    cid = c.get('id')
    val = c.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('<br>', ' ')
    style = c.get('style', '')
    geo = c.find('mxGeometry')
    gx = geo.get('x') if geo is not None else None
    gy = geo.get('y') if geo is not None else None
    gw = geo.get('width') if geo is not None else None
    gh = geo.get('height') if geo is not None else None
    if 'shape=umlLifeline' in style or 'participant' in style or c.get('vertex') == '1':
        print(f'Vertex {cid}: x={gx}, y={gy}, w={gw}, h={gh} | val="{val}" | style={style[:40]}')
    elif c.get('edge') == '1':
        print(f'Edge {cid}: src={c.get("source")}, tgt={c.get("target")} | val="{val}"')
