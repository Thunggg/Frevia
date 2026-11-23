from diagram_engine import DiagramEngine
from check_edges import sprint2_cols

eng = DiagramEngine('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
eng.layout(sprint2_cols)
for nid in sprint2_cols[2]:
    n = eng.nodes[nid]
    print(f"{nid:25}: x={n['x']}, w={n['w']}, right={n['x']+n['w']}")
print('Col 2 info:', eng.col_info[2])
print('Col 3 info:', eng.col_info[3])
