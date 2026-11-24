import xml.etree.ElementTree as ET
import glob

def parse_diagram(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    cells = root.findall('.//mxCell')
    
    nodes = {}
    for c in cells:
        if c.get('vertex') == '1' and 'swimlane' in c.get('style', ''):
            geo = c.find('mxGeometry')
            x = float(geo.get('x', 0))
            y = float(geo.get('y', 0))
            w = float(geo.get('width', 0))
            h = float(geo.get('height', 0))
            nodes[c.get('id')] = {'x': x, 'y': y, 'w': w, 'h': h, 'val': c.get('value', '').splitlines()[0]}
            
    edges = []
    for c in cells:
        if c.get('edge') == '1':
            sid = c.get('source')
            tid = c.get('target')
            style = c.get('style', '')
            geo = c.find('mxGeometry')
            
            # parse exitX, exitY, entryX, entryY
            exitX = 0.5
            exitY = 0.5
            entryX = 0.5
            entryY = 0.5
            for part in style.split(';'):
                if part.startswith('exitX='):
                    exitX = float(part.split('=')[1])
                elif part.startswith('exitY='):
                    exitY = float(part.split('=')[1])
                elif part.startswith('entryX='):
                    entryX = float(part.split('=')[1])
                elif part.startswith('entryY='):
                    entryY = float(part.split('=')[1])
                    
            pts = []
            if geo is not None:
                arr = geo.find('Array')
                if arr is not None:
                    pts = [(float(p.get('x')), float(p.get('y'))) for p in arr.findall('mxPoint')]
                    
            sn = nodes.get(sid)
            tn = nodes.get(tid)
            if sn and tn:
                p_start = (sn['x'] + sn['w'] * exitX, sn['y'] + sn['h'] * exitY)
                p_end = (tn['x'] + tn['w'] * entryX, tn['y'] + tn['h'] * entryY)
                full_pts = [p_start] + pts + [p_end]
                edges.append({
                    'id': c.get('id'),
                    'sid': sid,
                    'tid': tid,
                    'pts': full_pts
                })
    return nodes, edges

def point_in_box_interior(px, py, box, eps=1.0):
    bx, by, bw, bh = box['x'], box['y'], box['w'], box['h']
    return (bx + eps < px < bx + bw - eps) and (by + eps < py < by + bh - eps)

def segment_intersects_box_interior(p1, p2, box, eps=1.0):
    bx, by, bw, bh = box['x'], box['y'], box['w'], box['h']
    x1, y1 = p1
    x2, y2 = p2
    
    # Horizontal segment
    if abs(y1 - y2) < 0.001:
        y = y1
        if by + eps < y < by + bh - eps:
            min_x = min(x1, x2)
            max_x = max(x1, x2)
            # check overlap of [min_x, max_x] with [bx+eps, bx+bw-eps]
            if max_x > bx + eps and min_x < bx + bw - eps:
                return True
    # Vertical segment
    elif abs(x1 - x2) < 0.001:
        x = x1
        if bx + eps < x < bx + bw - eps:
            min_y = min(y1, y2)
            max_y = max(y1, y2)
            if max_y > by + eps and min_y < by + bh - eps:
                return True
    return False

def check_file(filepath):
    print("=" * 60)
    print("VERIFYING GEOMETRY:", filepath)
    print("=" * 60)
    nodes, edges = parse_diagram(filepath)
    print(f"Loaded {len(nodes)} classes, {len(edges)} edges.")
    
    # 1. Check box crossings
    box_crossings = []
    for e in edges:
        pts = e['pts']
        for i in range(len(pts) - 1):
            seg = (pts[i], pts[i+1])
            for nid, node in nodes.items():
                # Allow entering/leaving own source and target
                if segment_intersects_box_interior(seg[0], seg[1], node):
                    box_crossings.append((e['id'], e['sid'], e['tid'], nid, node['val'], seg))
                    
    print(f"Box interior crossings found: {len(box_crossings)}")
    for bc in box_crossings:
        print(f"  CROSSING: Edge {bc[0]} ({bc[1]}->{bc[2]}) cuts box {bc[3]} ({bc[4]}) on seg {bc[5]}")

    # 2. Check overlapping edge segments
    # Horizontal segments overlap if same y and overlapping x
    # Vertical segments overlap if same x and overlapping y
    vert_segs = []
    horiz_segs = []
    for e in edges:
        pts = e['pts']
        for i in range(len(pts) - 1):
            p1, p2 = pts[i], pts[i+1]
            if abs(p1[0] - p2[0]) < 0.001 and abs(p1[1] - p2[1]) > 0.1: # vertical
                x = round(p1[0], 1)
                y_min = min(p1[1], p2[1])
                y_max = max(p1[1], p2[1])
                vert_segs.append((e['id'], x, y_min, y_max))
            elif abs(p1[1] - p2[1]) < 0.001 and abs(p1[0] - p2[0]) > 0.1: # horizontal
                y = round(p1[1], 1)
                x_min = min(p1[0], p2[0])
                x_max = max(p1[0], p2[0])
                horiz_segs.append((e['id'], y, x_min, x_max))

    v_overlaps = []
    for i in range(len(vert_segs)):
        for j in range(i + 1, len(vert_segs)):
            e1, x1, y1_min, y1_max = vert_segs[i]
            e2, x2, y2_min, y2_max = vert_segs[j]
            if abs(x1 - x2) < 2.0: # same vertical line
                overlap_min = max(y1_min, y2_min)
                overlap_max = min(y1_max, y2_max)
                if overlap_max - overlap_min > 5.0: # non-trivial overlap
                    v_overlaps.append((e1, e2, x1, overlap_min, overlap_max))

    h_overlaps = []
    for i in range(len(horiz_segs)):
        for j in range(i + 1, len(horiz_segs)):
            e1, y1, x1_min, x1_max = horiz_segs[i]
            e2, y2, x2_min, x2_max = horiz_segs[j]
            if abs(y1 - y2) < 2.0: # same horizontal line
                overlap_min = max(x1_min, x2_min)
                overlap_max = min(x1_max, x2_max)
                if overlap_max - overlap_min > 5.0: # non-trivial overlap
                    h_overlaps.append((e1, e2, y1, overlap_min, overlap_max))

    print(f"Vertical segment overlaps: {len(v_overlaps)}")
    for vo in v_overlaps[:5]:
        print(f"  V-OVERLAP: {vo[0]} and {vo[1]} at x={vo[2]} (y: {vo[3]}..{vo[4]})")
    print(f"Horizontal segment overlaps: {len(h_overlaps)}")
    for ho in h_overlaps[:5]:
        print(f"  H-OVERLAP: {ho[0]} and {ho[1]} at y={ho[2]} (x: {ho[3]}..{ho[4]})")

if __name__ == '__main__':
    for p in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
        check_file(p)
