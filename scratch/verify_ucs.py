import xml.etree.ElementTree as ET

ucs = [
    'class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio',
    'class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio',
    'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio',
]

for s in ucs:
    tree = ET.parse(s)
    root = tree.getroot()
    diagrams = root.findall('.//diagram')
    if not diagrams:
        diagrams = [root]
    print(f"\n==================== {s} ====================")
    for d in diagrams:
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
                
                # Check entryX, entryY
                ex = [p for p in style.split(';') if p.startswith('entryX=')]
                ey = [p for p in style.split(';') if p.startswith('entryY=')]
                
                tgt_cell = cells.get(tgt)
                if tgt_cell is not None:
                    tgeo = tgt_cell.find('mxGeometry')
                    if tgeo is not None and tgeo.get('x') is not None:
                        tx = float(tgeo.get('x'))
                        ty = float(tgeo.get('y'))
                        tw = float(tgeo.get('width', 0))
                        th = float(tgeo.get('height', 0))
                        entry_x_val = float(ex[0].split('=')[1]) if ex else None
                        entry_y_val = float(ey[0].split('=')[1]) if ey else None
                        if entry_x_val in [0.0, 1.0] and pts:
                            conn_y = ty + entry_y_val * th
                            last_y = pts[-1][1]
                            if abs(conn_y - last_y) > 1.0:
                                print(f"  WARNING: Edge {cid} ({src}->{tgt}) enters at Y={conn_y} but last waypoint Y={last_y} (diff={conn_y - last_y})")
                        elif not ex or not ey:
                            print(f"  MISSING ENTRY: Edge {cid} ({src}->{tgt}) has no entryX/entryY")
