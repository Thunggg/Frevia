import xml.etree.ElementTree as ET

def inspect_columns(path):
    print("=" * 60)
    print("INSPECTING COLUMNS:", path)
    print("=" * 60)
    root = ET.parse(path).getroot()
    cells = root.findall('.//mxCell')
    nodes = []
    for c in cells:
        if c.get('vertex') == '1' and 'swimlane' in c.get('style', ''):
            geo = c.find('mxGeometry')
            x = float(geo.get('x', 0))
            y = float(geo.get('y', 0))
            w = float(geo.get('width', 0))
            h = float(geo.get('height', 0))
            val = c.get('value', '').splitlines()[0].strip()
            nodes.append({'id': c.get('id'), 'x': x, 'y': y, 'w': w, 'h': h, 'val': val})
    
    # group by x
    xs = sorted(list(set(n['x'] for n in nodes)))
    for xi in xs:
        col_nodes = [n for n in nodes if n['x'] == xi]
        col_nodes.sort(key=lambda n: n['y'])
        max_w = max(n['w'] for n in col_nodes)
        min_y = min(n['y'] for n in col_nodes)
        max_y = max(n['y'] + n['h'] for n in col_nodes)
        print(f"Col at x={xi} (max_w={max_w}, y_range={min_y}..{max_y}, count={len(col_nodes)}):")
        for n in col_nodes:
            print(f"   [{n['id']}] y={n['y']}, h={n['h']}, w={n['w']} -> {n['val']}")

if __name__ == '__main__':
    for p in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
        inspect_columns(p)
