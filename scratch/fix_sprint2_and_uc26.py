import xml.etree.ElementTree as ET

def fix_uc26():
    path = 'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio'
    tree = ET.parse(path)
    root = tree.getroot()
    
    edge_updates = {
        'sub_e_route_ctrl': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;dashed=1;exitX=1;exitY=0.25;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('680', '256'), ('680', '170')],
        },
        'sub_e_route_auth': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.55;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('670', '324'), ('670', '405')],
        },
        'sub_e_route_perm': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.85;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('660', '392'), ('660', '595')],
        },
        'sub_e_ctrl_svc': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
            'pts': [('980', '20'), ('2080', '20')],
        },
        'sub_e_ctrl_dtoSubmit': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.3;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1280', '126'), ('1280', '131')],
        },
        'sub_e_svc_dtoSubmit': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.3;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1780', '135'), ('1780', '131')],
        },
        'sub_e_ctrl_dtoRequest': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.6;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1280', '192'), ('1280', '279')],
        },
        'sub_e_svc_dtoRequest': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.55;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1780', '197'), ('1780', '279')],
        },
        'sub_e_ctrl_dtoGet': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.85;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1290', '247'), ('1290', '413')],
        },
        'sub_e_svc_dtoGet': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.75;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('1790', '247'), ('1790', '413')],
        },
        'sub_e_svc_typeSub': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.9;exitDx=0;exitDy=0;entryX=1;entryY=0.3;entryDx=0;entryDy=0;',
            'pts': [('1800', '285'), ('1800', '606')],
        },
        'sub_e_svc_repo': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
            'pts': [],
        },
        'sub_e_repo_schemaSub': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.2;exitDx=0;exitDy=0;entryX=0;entryY=0.7;entryDx=0;entryDy=0;',
            'pts': [('2375', '396'), ('2375', '331')],
        },
        'sub_e_repo_schemaSubFile': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('2385', '480'), ('2385', '521')],
        },
        'sub_e_repo_schemaMilestone': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=1;exitY=0.8;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
            'pts': [('2395', '564'), ('2395', '703')],
        },
        'sub_rel_milestone_sub': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.3;exitDx=0;exitDy=0;entryX=0;entryY=0.8;entryDx=0;entryDy=0;',
            'pts': [('2360', '659'), ('2360', '370')],
        },
        'sub_rel_sub_subFile': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
            'pts': [],
        },
        'sub_rel_contract_milestone': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
            'pts': [],
        },
        'sub_rel_user_sub': {
            'style': 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.9;entryDx=0;entryDy=0;',
            'pts': [('2350', '1095'), ('2350', '409')],
        },
    }

    for c in root.findall('.//mxCell'):
        eid = c.get('id')
        if eid in edge_updates:
            upd = edge_updates[eid]
            c.set('style', upd['style'])
            geo = c.find('mxGeometry')
            if geo is not None:
                arr = geo.find('Array')
                if arr is not None:
                    geo.remove(arr)
                if upd['pts']:
                    arr = ET.SubElement(geo, 'Array', {'as': 'points'})
                    for px, py in upd['pts']:
                        ET.SubElement(arr, 'mxPoint', {'x': str(px), 'y': str(py)})

    tree.write(path, encoding='utf-8', xml_declaration=False)
    print(f"Fixed {path} successfully.")

def build_sprint2_combined():
    # Read UC-24, UC-25, UC-26 xml models
    tree_uc24 = ET.parse('class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio')
    tree_uc25 = ET.parse('class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio')
    tree_uc26 = ET.parse('class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio')

    def get_model_xml(tree):
        root = tree.getroot()
        if root.tag == 'mxGraphModel':
            return ET.tostring(root, encoding='unicode')
        elif root.find('.//mxGraphModel') is not None:
            return ET.tostring(root.find('.//mxGraphModel'), encoding='unicode')
        return ""

    m24 = get_model_xml(tree_uc24)
    m25 = get_model_xml(tree_uc25)
    m26 = get_model_xml(tree_uc26)

    xml_multipage = f'''<mxfile host="Electron" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/29.0.3 Chrome/140.0.7339.249 Electron/38.7.0 Safari/537.36" version="29.0.3">
  <diagram id="uc24" name="UC-24 Manage Milestone">
{m24}
  </diagram>
  <diagram id="uc25" name="UC-25 Manage Milestone File">
{m25}
  </diagram>
  <diagram id="uc26" name="UC-26 Manage Milestone Submission">
{m26}
  </diagram>
</mxfile>
'''
    sprint2_path = 'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio'
    with open(sprint2_path, 'w', encoding='utf-8') as f:
        f.write(xml_multipage)
    print(f"Written 3-part diagram to {sprint2_path}")

if __name__ == '__main__':
    fix_uc26()
    build_sprint2_combined()
