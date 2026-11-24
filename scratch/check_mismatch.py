import xml.etree.ElementTree as ET

for fname in ['class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio',
              'class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio',
              'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio']:
    print(f"==================== {fname} ====================")
    tree = ET.parse(fname)
    root = tree.getroot()
    diagrams = root.findall('.//diagram')
    if not diagrams:
        diagrams = [root] # bare mxGraphModel
    
    for d in diagrams:
        dname = d.get('name', 'default')
        print(f"--- Diagram/Tab: {dname} ---")
        cells = {c.get('id'): c for c in d.findall('.//mxCell')}
        for cid, c in cells.items():
            if 'dto' in cid.lower() and c.get('vertex') == '1':
                geo = c.find('mxGeometry')
                if geo is not None:
                    print(f"  DTO {cid}: x={geo.get('x')}, y={geo.get('y')}, w={geo.get('width')}, h={geo.get('height')}")
        
        for cid, c in cells.items():
            if c.get('edge') == '1':
                tgt = c.get('target', '')
                src = c.get('source', '')
                style = c.get('style', '')
                geo = c.find('mxGeometry')
                pts = []
                if geo is not None:
                    pts_elem = geo.find('Array')
                    if pts_elem is not None:
                        for pt in pts_elem.findall('mxPoint'):
                            pts.append((float(pt.get('x')), float(pt.get('y'))))
                # Check if it connects to DTO or has arrow pointing up
                if 'dto' in tgt.lower() or 'dto' in src.lower():
                    # Calculate target connection point
                    tgt_cell = cells.get(tgt)
                    tgt_y = None
                    if tgt_cell is not None:
                        tgeo = tgt_cell.find('mxGeometry')
                        if tgeo is not None and tgeo.get('y') is not None:
                            ty = float(tgeo.get('y'))
                            th = float(tgeo.get('height', 0))
                            # parse entryY
                            ey = 0.5
                            for p in style.split(';'):
                                if p.startswith('entryY='):
                                    ey = float(p.split('=')[1])
                            target_conn_y = ty + ey * th
                            print(f"  Edge {cid}: {src} -> {tgt} (target_conn_y={target_conn_y})")
                            print(f"      pts={pts}, entryY={ey}")
                            if pts:
                                last_pt_y = pts[-1][1]
                                if abs(last_pt_y - target_conn_y) > 2.0:
                                    print(f"      *** MISMATCH! last pt y={last_pt_y} != conn_y={target_conn_y} (diff={target_conn_y - last_pt_y}) ***")
