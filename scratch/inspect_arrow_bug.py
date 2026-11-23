import xml.etree.ElementTree as ET

def find_arrow_bug(path):
    print("=" * 60)
    print("INSPECTING:", path)
    print("=" * 60)
    root = ET.parse(path).getroot()
    nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1'}
    for e in root.findall('.//mxCell'):
        if e.get('edge') == '1':
            eid = e.get('id')
            sid = e.get('source')
            tid = e.get('target')
            style = e.get('style', '')
            geo = e.find('mxGeometry')
            pts = []
            if geo is not None and geo.find('Array') is not None:
                pts = [(float(p.get('x')), float(p.get('y'))) for p in geo.find('Array').findall('mxPoint')]
            
            # Find target node
            tn = nodes.get(tid)
            sn = nodes.get(sid)
            if not tn or not sn:
                continue
            tgeo = tn.find('mxGeometry')
            tx = float(tgeo.get('x', 0))
            ty = float(tgeo.get('y', 0))
            tw = float(tgeo.get('width', 0))
            th = float(tgeo.get('height', 0))
            
            # extract entryX, entryY
            entryX = 0.5
            entryY = 0.5
            for part in style.split(';'):
                if part.startswith('entryX='):
                    entryX = float(part.split('=')[1])
                elif part.startswith('entryY='):
                    entryY = float(part.split('=')[1])
                    
            target_pt = (tx + tw * entryX, ty + th * entryY)
            if pts:
                last_pt = pts[-1]
                # If the last waypoint has the same X as target_pt, then the final segment is VERTICAL!
                # If the final segment is vertical, the arrow points UP or DOWN into the target point!
                dx = target_pt[0] - last_pt[0]
                dy = target_pt[1] - last_pt[1]
                if abs(dx) < 1.0 and abs(dy) > 1.0:
                    print(f"BUGGY FINAL SEGMENT (VERTICAL!): {eid} ({sid} -> {tid})")
                    print(f"   last_pt={last_pt}, target_pt={target_pt}, entryX={entryX}, entryY={entryY}")
                    print(f"   all pts={pts}")
                    print(f"   style={style}")

if __name__ == '__main__':
    for p in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
        find_arrow_bug(p)
