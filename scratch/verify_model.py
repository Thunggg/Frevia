import xml.etree.ElementTree as ET

def get_file_model(path):
    root = ET.parse(path).getroot()
    cells = root.findall('.//mxCell')
    nodes = {}
    for c in cells:
        if c.get('vertex') == '1' and 'swimlane' in c.get('style', ''):
            geo = c.find('mxGeometry')
            nodes[c.get('id')] = {
                'id': c.get('id'),
                'cell': c,
                'val': c.get('value', ''),
                'w': float(geo.get('width', 300)),
                'h': float(geo.get('height', 200)),
            }
    edges = []
    for c in cells:
        if c.get('edge') == '1':
            edges.append({
                'id': c.get('id'),
                'src': c.get('source'),
                'tgt': c.get('target'),
                'val': c.get('value', ''),
                'dashed': 'dashed=1' in c.get('style', ''),
            })
    return nodes, edges

if __name__ == '__main__':
    for p in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
        nodes, edges = get_file_model(p)
        print(f"{p}: {len(nodes)} nodes, {len(edges)} edges")
