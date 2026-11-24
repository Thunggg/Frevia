import xml.etree.ElementTree as ET
import glob

def check_diagram(fname):
    tree = ET.parse(fname)
    root = tree.getroot()
    diagrams = root.findall('.//diagram')
    if not diagrams:
        diagrams = [root]
    for d in diagrams:
        dname = d.get('name', 'Page')
        cells = {c.get('id'): c for c in d.findall('.//mxCell')}
        for cid, c in cells.items():
            if c.get('edge') == '1':
                src = c.get('source')
                tgt = c.get('target')
                style = c.get('style', '')
                geo = c.find('mxGeometry')
                pts = []
                if geo is not None:
                    pts_elem = geo.find('Array')
                    if pts_elem is not None:
                        for pt in pts_elem.findall('mxPoint'):
                            pts.append((float(pt.get('x')), float(pt.get('y'))))
                
                # Check for vertical approach to side of box
                # If entryX is 0 or 1, the entry is on the left or right face.
                # If there are waypoints and the last segment is vertical (pt[-1][0] == tgt_x, but pt[-1][1] != tgt_y)
                # or if Draw.io auto-routes vertically into a side face:
                entryX = None
                entryY = None
                for p in style.split(';'):
                    if p.startswith('entryX='):
                        entryX = float(p.split('=')[1])
                    if p.startswith('entryY='):
                        entryY = float(p.split('=')[1])
                
                tgt_cell = cells.get(tgt)
                if tgt_cell is not None:
                    tgeo = tgt_cell.find('mxGeometry')
                    if tgeo is not None and tgeo.get('x') is not None:
                        tx = float(tgeo.get('x'))
                        ty = float(tgeo.get('y'))
                        tw = float(tgeo.get('width', 0))
                        th = float(tgeo.get('height', 0))
                        
                        if entryX is not None and entryY is not None:
                            conn_x = tx + entryX * tw
                            conn_y = ty + entryY * th
                            if pts:
                                last_x, last_y = pts[-1]
                                # Check angle of last segment:
                                dx = conn_x - last_x
                                dy = conn_y - last_y
                                # If entry is on left (entryX=0) or right (entryX=1), the last segment SHOULD be horizontal (dy == 0 and dx != 0)
                                if entryX in [0.0, 1.0]:
                                    if abs(dy) > 1.0 and abs(dx) < 1.0:
                                        print(f"[{fname}] {dname} VERTICAL ENTRY BUG: Edge {cid} ({src}->{tgt}) enters at ({conn_x},{conn_y}) but last pt is ({last_x},{last_y}) -> vertical diff {dy}!")
                                    elif abs(dy) > 1.0 and abs(dx) > 1.0:
                                        print(f"[{fname}] {dname} DIAGONAL ENTRY: Edge {cid} ({src}->{tgt}) enters at ({conn_x},{conn_y}) from ({last_x},{last_y})")

print("Checking all drawio files for vertical edge entry bugs...")
for f in glob.glob('class-diagrams/*.drawio'):
    try:
        check_diagram(f)
    except Exception as e:
        print(f"Error checking {f}: {e}")
