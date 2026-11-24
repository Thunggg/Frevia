import xml.etree.ElementTree as ET

def update_edges_in_element(root_or_elem):
    edges_updated = 0
    for c in root_or_elem.findall('.//mxCell'):
        cid = c.get('id')
        if cid == 'sub_rel_contract_milestone':
            c.set('value', '1..*')
            c.set('style', 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=#ffffff;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;')
            edges_updated += 1
        elif cid == 'sub_rel_sub_subFile':
            c.set('value', '0..*')
            c.set('style', 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=#ffffff;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;')
            edges_updated += 1
        elif cid == 'sub_rel_milestone_sub':
            c.set('value', '0..*')
            c.set('style', 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=#ffffff;exitX=1;exitY=0.3;exitDx=0;exitDy=0;entryX=1;entryY=0.55;entryDx=0;entryDy=0;')
            geo = c.find('mxGeometry')
            if geo is not None:
                # remove old points and set new
                for ch in list(geo):
                    geo.remove(ch)
                arr = ET.SubElement(geo, 'Array', {'as': 'points'})
                ET.SubElement(arr, 'mxPoint', {'x': '2780', 'y': '660'})
                ET.SubElement(arr, 'mxPoint', {'x': '2780', 'y': '273'})
            edges_updated += 1
        elif cid == 'sub_rel_user_sub':
            c.set('value', '0..*')
            c.set('style', 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=#ffffff;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.25;entryDx=0;entryDy=0;')
            geo = c.find('mxGeometry')
            if geo is not None:
                for ch in list(geo):
                    geo.remove(ch)
                arr = ET.SubElement(geo, 'Array', {'as': 'points'})
                ET.SubElement(arr, 'mxPoint', {'x': '2820', 'y': '1095'})
                ET.SubElement(arr, 'mxPoint', {'x': '2820', 'y': '157'})
            edges_updated += 1
    return edges_updated

# 1. Update UC-24_Manage_Milestone_Class_Diagram.drawio
f1 = 'class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio'
tree1 = ET.parse(f1)
cnt1 = update_edges_in_element(tree1.getroot())
tree1.write(f1, encoding='utf-8', xml_declaration=True)
print(f"Updated {f1}: {cnt1} edges modified")

# 2. Update UC-26_Manage_Milestone_Submission_Class_Diagram.drawio
f2 = 'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio'
tree2 = ET.parse(f2)
cnt2 = update_edges_in_element(tree2.getroot())
tree2.write(f2, encoding='utf-8', xml_declaration=True)
print(f"Updated {f2}: {cnt2} edges modified")
