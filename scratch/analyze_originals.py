import xml.etree.ElementTree as ET
import glob

def analyze_original_diagrams():
    files = [
        'class-diagrams/UC-13_Manage_Contract_Class_Diagram.drawio',
        'class-diagrams/UC-13_Shared_File_Class_Diagram.drawio',
        'class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio',
        'class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio',
        'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio',
        'class-diagrams/UC-33_Dispute_Management_Class_Diagram.drawio',
        'class-diagrams/UC-43_Payment_Management_Class_Diagram.drawio',
    ]
    for path in files:
        root = ET.parse(path).getroot()
        cells = root.findall('.//mxCell')
        nodes = [c for c in cells if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')]
        edges = [c for c in cells if c.get('edge') == '1']
        edges_with_pts = 0
        for e in edges:
            geo = e.find('mxGeometry')
            if geo is not None and geo.find('Array') is not None:
                edges_with_pts += 1
        print(f"{path}: {len(nodes)} classes, {len(edges)} edges ({edges_with_pts} with waypoints)")

if __name__ == '__main__':
    analyze_original_diagrams()
