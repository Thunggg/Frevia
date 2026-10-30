import xml.etree.ElementTree as ET
import os
import shutil

STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;whiteSpace=wrap;"
STYLE_LIFELINE = 'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;newEdgeStyle={"curved":0,"rounded":0};'
STYLE_ACT_BAR = 'html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;newEdgeStyle={"curved":0,"rounded":0};'
STYLE_SELF_BAR = 'html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;newEdgeStyle={"curved":0,"rounded":0};fontSize=13;'
STYLE_MSG = "html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=12;"
STYLE_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;curved=0;rounded=0;fontSize=12;"
STYLE_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;"
STYLE_REF_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;"
STYLE_GUARD = "text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;"
STYLE_DIVIDER = "endArrow=none;dashed=1;html=1;rounded=0;"
STYLE_DASH_LINE = "endArrow=none;dashed=1;html=1;rounded=0;"
STYLE_DB_ICON = "strokeWidth=2;html=1;shape=mxgraph.flowchart.database;whiteSpace=wrap;"
STYLE_DB_LABEL = "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;"

def create_base_diagram(diag_id, diag_name, page_width=1654, page_height=3200):
    mxfile = ET.Element('mxfile', {
        'host': 'Electron',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/29.0.3 Chrome/140.0.7339.249 Electron/38.7.0 Safari/537.36',
        'version': '29.0.3'
    })
    diagram = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
    model = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '1600', 'dy': '900', 'grid': '1', 'gridSize': '10',
        'guides': '1', 'tooltips': '1', 'connect': '1', 'arrows': '1',
        'fold': '1', 'page': '1', 'pageScale': '1',
        'pageWidth': str(page_width), 'pageHeight': str(page_height),
        'math': '0', 'shadow': '0'
    })
    root = ET.SubElement(model, 'root')
    ET.SubElement(root, 'mxCell', {'id': '0'})
    ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})
    return mxfile, root

def add_cell(root, id_val, value="", style="", parent="1", vertex="1", x=None, y=None, w=None, h=None):
    cell = ET.SubElement(root, 'mxCell', {
        'id': id_val,
        'value': value,
        'style': style,
        'parent': parent,
        'vertex': vertex
    })
    if x is not None and y is not None and w is not None and h is not None:
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'
        })
    return cell

def add_edge(root, id_val, value="", style="", parent="1", sx=None, sy=None, tx=None, ty=None, points=None, source=None, target=None):
    attrs = {
        'id': id_val,
        'value': value,
        'style': style,
        'parent': parent,
        'edge': '1'
    }
    if source: attrs['source'] = source
    if target: attrs['target'] = target
    cell = ET.SubElement(root, 'mxCell', attrs)
    geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
    if sx is not None and sy is not None:
        ET.SubElement(geom, 'mxPoint', {'x': str(sx), 'y': str(sy), 'as': 'sourcePoint'})
    if tx is not None and ty is not None:
        ET.SubElement(geom, 'mxPoint', {'x': str(tx), 'y': str(ty), 'as': 'targetPoint'})
    if points:
        pts = ET.SubElement(geom, 'Array', {'as': 'points'})
        for px, py in points:
            ET.SubElement(pts, 'mxPoint', {'x': str(px), 'y': str(py)})
    return cell

def add_rule14_self_call(root, bar_id, edge_id, value, bar_x, bar_y, main_right_x, sy, ty, mid_x):
    """
    Implements Rule 14 with clean positioning (no overlap onto arrow UI):
    - Text starts past mid_x (outside loop)
    - align=left so text expands to the right
    - verticalAlign=bottom with offset y=-12 so text sits safely above the horizontal arrow
    """
    bar = ET.SubElement(root, 'mxCell', {
        'id': bar_id,
        'value': '',
        'style': STYLE_SELF_BAR,
        'vertex': '1',
        'parent': '1'
    })
    ET.SubElement(bar, 'mxGeometry', {
        'x': str(bar_x),
        'y': str(bar_y),
        'width': '10',
        'height': '20',
        'as': 'geometry'
    })

    edge = ET.SubElement(root, 'mxCell', {
        'id': edge_id,
        'value': value,
        'style': 'html=1;align=left;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=12;',
        'edge': '1',
        'target': bar_id,
        'parent': '1'
    })
    geom = ET.SubElement(edge, 'mxGeometry', {
        'x': '0',
        'y': '0',
        'relative': '1',
        'as': 'geometry'
    })
    ET.SubElement(geom, 'mxPoint', {'x': str(main_right_x), 'y': str(sy), 'as': 'sourcePoint'})
    ET.SubElement(geom, 'mxPoint', {'x': str(bar_x + 10), 'y': str(ty), 'as': 'targetPoint'})
    pts = ET.SubElement(geom, 'Array', {'as': 'points'})
    ET.SubElement(pts, 'mxPoint', {'x': str(mid_x), 'y': str(sy)})
    ET.SubElement(pts, 'mxPoint', {'x': str(mid_x), 'y': str(ty + 5)})
    # Offset x=45 pushes text from main_right_x (925) to 970 (past mid_x=965)
    # Offset y=-12 lifts text above sy=1140
    ET.SubElement(geom, 'mxPoint', {'x': '45', 'y': '-12', 'as': 'offset'})
    return bar, edge

def save_tree(mxfile, filename):
    tree = ET.ElementTree(mxfile)
    ET.indent(tree, space="  ", level=0)
    tree.write(filename, encoding="utf-8", xml_declaration=False)
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    # Fix double-escaped HTML entities so draw.io renders them as rich formatting, not literal tags
    content = content.replace('&amp;lt;br&amp;gt;', '&lt;br&gt;')
    content = content.replace('&amp;lt;div&amp;gt;', '&lt;div&gt;')
    content = content.replace('&amp;lt;/div&amp;gt;', '&lt;/div&gt;')
    content = content.replace('&amp;amp;nbsp;', '&amp;nbsp;')
    content = content.replace('&amp;quot;', '&quot;')
    content = content.replace('&amp;lt;', '&lt;')
    content = content.replace('&amp;gt;', '&gt;')
    content = content.replace('&amp;amp;', '&amp;')
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Generated {filename}")

# ==============================================================================
# 1. UC-06.05 DELETE ROLE (Full Logic)
# ==============================================================================
def build_uc_06_05():
    Y_BOTTOM = 3050
    mxfile, root = create_base_diagram("UC-06_05-delete-role", "UC-06.05 Delete Role", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, x=95, y=340, w=10, h=2540) # 340 to 2880

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":RoleView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=2540) # 340 to 2880

    add_cell(root, "lf_route", value=":RoleRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=2380) # 450 to 2830

    add_cell(root, "lf_controller", value=":RoleController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=780, w=10, h=2000) # 780 to 2780

    add_cell(root, "lf_service", value=":RoleService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=830, w=10, h=1900) # 830 to 2730

    add_cell(root, "lf_repo", value=":RoleRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=880, w=10, h=230) # 880 to 1110
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1840, w=10, h=230) # 1840 to 2070
    add_cell(root, "act_repo_3", style=STYLE_ACT_BAR, parent="1", x=1120, y=2450, w=10, h=230) # 2450 to 2680

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=930, w=10, h=140) # 930 to 1070
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1890, w=10, h=140) # 1890 to 2030
    add_cell(root, "act_prisma_3", style=STYLE_ACT_BAR, parent="1", x=1310, y=2500, w=10, h=140) # 2500 to 2640

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=980, w=10, h=50) # 980 to 1030
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1940, w=10, h=50) # 1940 to 1990
    add_cell(root, "act_db_3", style=STYLE_ACT_BAR, parent="1", x=1475, y=2550, w=10, h=50) # 2550 to 2600

    # Messages
    add_edge(root, "m1", value='1. Click "Delete" on a role', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Click "Confirm delete"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. DELETE /api/backend/api/roles/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. DELETE /api/roles/:id", style=STYLE_MSG, sx=505, sy=780, tx=705, ty=780)
    add_edge(root, "m5", value="5. deleteRole(id)", style=STYLE_MSG, sx=715, sy=830, tx=915, ty=830)

    # Step 1: findById
    add_edge(root, "m6", value="6. findById(id)", style=STYLE_MSG, sx=925, sy=880, tx=1120, ty=880)
    add_edge(root, "m7", value="7. prisma.role.findFirst({ where: { id, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=930, tx=1310, ty=930)
    add_edge(root, "m8", value="8. Execute SELECT query", style=STYLE_MSG, sx=1320, sy=980, tx=1475, ty=980)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1030, tx=1320, ty=1030)
    add_edge(root, "m10", value="10. Return role or null", style=STYLE_REPLY, sx=1310, sy=1070, tx=1130, ty=1070)
    add_edge(root, "m11", value="11. Return role or null", style=STYLE_REPLY, sx=1120, sy=1110, tx=925, ty=1110)

    # Self-call 1 on Service (Rule 14)
    add_rule14_self_call(root, "act_self_find_role", "m12", "12. Handle find role&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1170, main_right_x=925, sy=1150, ty=1170, mid_x=965)

    # Outer Alt 1 (Role Existence)
    add_cell(root, "fr_alt_1", value="alt", style=STYLE_FRAME, x=40, y=1210, w=1500, h=1760)
    add_cell(root, "g_find_1", value="[role not found]", style=STYLE_GUARD, x=120, y=1210, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 RoleNotFound", style=STYLE_REPLY, sx=915, sy=1250, tx=715, ty=1250)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1300, tx=505, ty=1300)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1350, tx=305, ty=1350)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Role not found"', style=STYLE_REPLY, sx=295, sy=1400, tx=105, ty=1400)

    add_edge(root, "div_alt_1", style=STYLE_DIVIDER, sx=40, sy=1450, tx=1540, ty=1450)
    add_cell(root, "g_find_2", value="[role found]", style=STYLE_GUARD, x=120, y=1455, w=150, h=30)

    # Step 2: System role check (Rule 14)
    add_rule14_self_call(root, "act_self_sys_role", "m12_2_1", "12.2.1. Check role is not&nbsp;<div>a system role</div>",
                         bar_x=920, bar_y=1510, main_right_x=925, sy=1490, ty=1510, mid_x=965)

    # Nested Alt 2 (System role)
    add_cell(root, "fr_alt_2", value="alt", style=STYLE_FRAME, x=55, y=1550, w=1470, h=1400)
    add_cell(root, "g_sys_1", value="[role is a system role]", style=STYLE_GUARD, x=120, y=1550, w=150, h=30)
    add_edge(root, "m12_2_1_1_1", value="12.2.1.1.1. throw 403 CannotModifySystemRole", style=STYLE_REPLY, sx=915, sy=1590, tx=715, ty=1590)
    add_edge(root, "m12_2_1_1_2", value="12.2.1.1.2. Return 403 response", style=STYLE_REPLY, sx=705, sy=1640, tx=505, ty=1640)
    add_edge(root, "m12_2_1_1_3", value="12.2.1.1.3. Return 403 response", style=STYLE_REPLY, sx=495, sy=1690, tx=305, ty=1690)
    add_edge(root, "m12_2_1_1_4", value='12.2.1.1.4. Show message "Cannot delete system role"', style=STYLE_REPLY, sx=295, sy=1740, tx=105, ty=1740)

    add_edge(root, "div_alt_2", style=STYLE_DIVIDER, sx=55, sy=1790, tx=1525, ty=1790)
    add_cell(root, "g_sys_2", value="[role is not&lt;br&gt;a system role]", style=STYLE_GUARD, x=120, y=1795, w=160, h=36)

    # Step 3: Count assigned users
    add_edge(root, "m12_2_1_2_1", value="12.2.1.2.1. countAssignedUsers(id)", style=STYLE_MSG, sx=925, sy=1840, tx=1120, ty=1840)
    add_edge(root, "m12_2_1_2_2", value="12.2.1.2.2. prisma.userRole.count({ where: { roleId: id } })", style=STYLE_MSG, sx=1130, sy=1890, tx=1310, ty=1890)
    add_edge(root, "m12_2_1_2_3", value="12.2.1.2.3. Execute COUNT query", style=STYLE_MSG, sx=1320, sy=1940, tx=1475, ty=1940)
    add_edge(root, "m12_2_1_2_4", value="12.2.1.2.4. Return user count", style=STYLE_REPLY, sx=1475, sy=1990, tx=1320, ty=1990)
    add_edge(root, "m12_2_1_2_5", value="12.2.1.2.5. Return user count", style=STYLE_REPLY, sx=1310, sy=2030, tx=1130, ty=2030)
    add_edge(root, "m12_2_1_2_6", value="12.2.1.2.6. Return user count", style=STYLE_REPLY, sx=1120, sy=2070, tx=925, ty=2070)

    # Self-call 3 on Service (Rule 14)
    add_rule14_self_call(root, "act_self_user_count", "m12_2_1_2_7", "12.2.1.2.7. Handle user count&nbsp;<div>result</div>",
                         bar_x=920, bar_y=2130, main_right_x=925, sy=2110, ty=2130, mid_x=965)

    # Nested Alt 3 (Role in use check)
    add_cell(root, "fr_alt_3", value="alt", style=STYLE_FRAME, x=70, y=2170, w=1440, h=760)
    add_cell(root, "g_use_1", value="[assignedUserCount &gt; 0]", style=STYLE_GUARD, x=120, y=2170, w=150, h=30)
    add_edge(root, "m12_2_1_2_7_1_1", value="12.2.1.2.7.1.1. throw 400 RoleInUse", style=STYLE_REPLY, sx=915, sy=2210, tx=715, ty=2210)
    add_edge(root, "m12_2_1_2_7_1_2", value="12.2.1.2.7.1.2. Return 400 response", style=STYLE_REPLY, sx=705, sy=2260, tx=505, ty=2260)
    add_edge(root, "m12_2_1_2_7_1_3", value="12.2.1.2.7.1.3. Return 400 response", style=STYLE_REPLY, sx=495, sy=2310, tx=305, ty=2310)
    add_edge(root, "m12_2_1_2_7_1_4", value='12.2.1.2.7.1.4. Show message "Role is in use by users"', style=STYLE_REPLY, sx=295, sy=2360, tx=105, ty=2360)

    add_edge(root, "div_alt_3", style=STYLE_DIVIDER, sx=70, sy=2410, tx=1510, ty=2410)
    add_cell(root, "g_use_2", value="[assignedUserCount == 0]", style=STYLE_GUARD, x=120, y=2415, w=150, h=30)

    # Step 4: Soft delete
    add_edge(root, "m12_2_1_2_7_2_1", value="12.2.1.2.7.2.1. softDeleteRole(id)", style=STYLE_MSG, sx=925, sy=2450, tx=1120, ty=2450)
    add_edge(root, "m12_2_1_2_7_2_2", value="12.2.1.2.7.2.2. prisma.role.update({ where: { id, deletedAt: null }, data: { deletedAt } })", style=STYLE_MSG, sx=1130, sy=2500, tx=1310, ty=2500)
    add_edge(root, "m12_2_1_2_7_2_3", value="12.2.1.2.7.2.3. Execute UPDATE query", style=STYLE_MSG, sx=1320, sy=2550, tx=1475, ty=2550)
    add_edge(root, "m12_2_1_2_7_2_4", value="12.2.1.2.7.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=2600, tx=1320, ty=2600)
    add_edge(root, "m12_2_1_2_7_2_5", value="12.2.1.2.7.2.5. Return result", style=STYLE_REPLY, sx=1310, sy=2640, tx=1130, ty=2640)
    add_edge(root, "m12_2_1_2_7_2_6", value="12.2.1.2.7.2.6. Return result", style=STYLE_REPLY, sx=1120, sy=2680, tx=925, ty=2680)
    add_edge(root, "m12_2_1_2_7_2_7", value='12.2.1.2.7.2.7. Return { message: "ROLE_DELETED" }', style=STYLE_REPLY, sx=915, sy=2730, tx=715, ty=2730)
    add_edge(root, "m12_2_1_2_7_2_8", value="12.2.1.2.7.2.8. Return 200 response", style=STYLE_REPLY, sx=705, sy=2780, tx=505, ty=2780)
    add_edge(root, "m12_2_1_2_7_2_9", value="12.2.1.2.7.2.9. Return 200 response", style=STYLE_REPLY, sx=495, sy=2830, tx=305, ty=2830)
    add_edge(root, "m12_2_1_2_7_2_10", value='12.2.1.2.7.2.10. Show message "Role deleted successfully" and refresh list', style=STYLE_REPLY, sx=295, sy=2880, tx=105, ty=2880)

    return mxfile

# ==============================================================================
# 2. UC-06.06 UPDATE ROLE PERMISSIONS (Full Logic with Rule 13 & 14)
# ==============================================================================
def build_uc_06_06():
    Y_BOTTOM = 3150
    mxfile, root = create_base_diagram("UC-06_06-update-role-permissions", "UC-06.06 Update Role Permissions", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, x=95, y=340, w=10, h=2655) # 340 to 2995

    # Lifelines
    add_cell(root, "lf_view", value=":RoleView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=2655) # 340 to 2995

    add_cell(root, "lf_route", value=":RoleRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=570, w=10, h=2375) # 570 to 2945

    add_cell(root, "lf_controller", value=":RoleController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=890, w=10, h=2005) # 890 to 2895

    add_cell(root, "lf_service", value=":RoleService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=940, w=10, h=1905) # 940 to 2845

    add_cell(root, "lf_repo", value=":RoleRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=990, w=10, h=230) # 990 to 1220
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1600, w=10, h=230) # 1600 to 1830
    add_cell(root, "act_repo_3", style=STYLE_ACT_BAR, parent="1", x=1120, y=2225, w=10, h=230) # 2225 to 2455

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=1040, w=10, h=140) # 1040 to 1180
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1650, w=10, h=140) # 1650 to 1790
    add_cell(root, "act_prisma_3", style=STYLE_ACT_BAR, parent="1", x=1310, y=2275, w=10, h=140) # 2275 to 2415

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=1090, w=10, h=50) # 1090 to 1140
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1700, w=10, h=50) # 1700 to 1750
    add_cell(root, "act_db_3", style=STYLE_ACT_BAR, parent="1", x=1475, y=2325, w=10, h=50) # 2325 to 2375

    # Messages
    add_edge(root, "m1", value="1. Select permissions for role", style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_validate", "m2", "2. Check validate&nbsp;<div>permissions</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_cell(root, "fr_opt", value="opt", style=STYLE_FRAME, x=40, y=440, w=340, h=100)
    add_cell(root, "g_opt", value="[invalid data]", style=STYLE_GUARD, x=120, y=440, w=120, h=30)
    add_edge(root, "m2_1_1", value="2.1.1. Display validation error message", style=STYLE_REPLY, sx=295, sy=490, tx=105, ty=490)

    add_edge(root, "m3", value="3. PUT /api/backend/api/roles/:id/permissions", style=STYLE_MSG, sx=305, sy=570, tx=495, ty=570)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=610, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=625, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=680, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=680, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=725, tx=305, ty=725)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=755, tx=105, ty=755)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=775, tx=580, ty=775)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=780, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=805, tx=305, ty=805)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=835, tx=105, ty=835)

    # Controller & Service
    add_edge(root, "m4", value="4. PUT /api/roles/:id/permissions", style=STYLE_MSG, sx=505, sy=890, tx=705, ty=890)
    add_edge(root, "m5", value="5. setRolePermissions(id, body)", style=STYLE_MSG, sx=715, sy=940, tx=915, ty=940)

    # Step 1: findById
    add_edge(root, "m6", value="6. findById(id)", style=STYLE_MSG, sx=925, sy=990, tx=1120, ty=990)
    add_edge(root, "m7", value="7. prisma.role.findFirst({ where: { id, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=1040, tx=1310, ty=1040)
    add_edge(root, "m8", value="8. Execute SELECT query", style=STYLE_MSG, sx=1320, sy=1090, tx=1475, ty=1090)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1140, tx=1320, ty=1140)
    add_edge(root, "m10", value="10. Return role or null", style=STYLE_REPLY, sx=1310, sy=1180, tx=1130, ty=1180)
    add_edge(root, "m11", value="11. Return role or null", style=STYLE_REPLY, sx=1120, sy=1220, tx=925, ty=1220)

    # Self-call 1 on Service (Rule 14)
    add_rule14_self_call(root, "act_self_find_role", "m12", "12. Handle find&nbsp;<div>role result</div>",
                         bar_x=920, bar_y=1280, main_right_x=925, sy=1260, ty=1280, mid_x=965)

    # Outer Alt 1 (Role Existence)
    add_cell(root, "fr_alt_1", value="alt", style=STYLE_FRAME, x=40, y=1320, w=1500, h=1760)
    add_cell(root, "g_find_1", value="[role not found]", style=STYLE_GUARD, x=120, y=1320, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 RoleNotFound", style=STYLE_REPLY, sx=915, sy=1360, tx=715, ty=1360)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1410, tx=505, ty=1410)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1460, tx=305, ty=1460)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Role not found"', style=STYLE_REPLY, sx=295, sy=1510, tx=105, ty=1510)

    add_edge(root, "div_alt_1", style=STYLE_DIVIDER, sx=40, sy=1560, tx=1540, ty=1560)
    add_cell(root, "g_find_2", value="[role found]", style=STYLE_GUARD, x=120, y=1565, w=150, h=30)

    # Step 2: findActivePermissionIds
    add_edge(root, "m12_2_1", value="12.2.1. findActivePermissionIds(permissionIds)", style=STYLE_MSG, sx=925, sy=1600, tx=1120, ty=1600)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.permission.findMany({ where: { id: { in: ids }, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=1650, tx=1310, ty=1650)
    add_edge(root, "m12_2_3", value="12.2.3. Execute SELECT query", style=STYLE_MSG, sx=1320, sy=1700, tx=1475, ty=1700)
    add_edge(root, "m12_2_4", value="12.2.4. Return active permissions", style=STYLE_REPLY, sx=1475, sy=1750, tx=1320, ty=1750)
    add_edge(root, "m12_2_5", value="12.2.5. Return active IDs", style=STYLE_REPLY, sx=1310, sy=1790, tx=1130, ty=1790)
    add_edge(root, "m12_2_6", value="12.2.6. Return active IDs", style=STYLE_REPLY, sx=1120, sy=1830, tx=925, ty=1830)

    # Self-call 2 on Service (Rule 14)
    add_rule14_self_call(root, "act_self_val_perm", "m12_2_7", "12.2.7. Handle validate&lt;div&gt;&amp;nbsp;permissions result&lt;/div&gt;",
                         bar_x=920, bar_y=1890, main_right_x=925, sy=1870, ty=1890, mid_x=965)

    # Nested Alt 2 (Permission validation)
    add_cell(root, "fr_alt_2", value="alt", style=STYLE_FRAME, x=55, y=1930, w=1470, h=1130)
    add_cell(root, "g_perm_1", value="[activeIds.length !==&lt;br&gt;permissionIds.length]", style=STYLE_GUARD, x=120, y=1930, w=160, h=36)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 400 InvalidPermissionIds", style=STYLE_REPLY, sx=915, sy=1975, tx=715, ty=1975)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return 400 response", style=STYLE_REPLY, sx=705, sy=2025, tx=505, ty=2025)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return 400 response", style=STYLE_REPLY, sx=495, sy=2075, tx=305, ty=2075)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Invalid permission IDs"', style=STYLE_REPLY, sx=295, sy=2125, tx=105, ty=2125)

    add_edge(root, "div_alt_2", style=STYLE_DIVIDER, sx=55, sy=2175, tx=1525, ty=2175)
    add_cell(root, "g_perm_2", value="[activeIds.length ===&lt;br&gt;permissionIds.length]", style=STYLE_GUARD, x=120, y=2180, w=160, h=36)

    # Step 3: Replace permissions
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. replaceRolePermissions&lt;div&gt;(id, permissionIds)&lt;/div&gt;", style=STYLE_MSG, sx=925, sy=2225, tx=1120, ty=2225)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. prisma.$transaction&lt;div&gt;([deleteMany, createMany])&lt;/div&gt;", style=STYLE_MSG, sx=1130, sy=2275, tx=1310, ty=2275)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Execute DELETE&amp;nbsp;&lt;div&gt;&amp;amp; INSERT queries&lt;/div&gt;", style=STYLE_MSG, sx=1320, sy=2325, tx=1475, ty=2325)
    add_edge(root, "m12_2_7_2_4", value="12.2.7.2.4. Return&amp;nbsp;&lt;div&gt;result or error&lt;/div&gt;", style=STYLE_REPLY, sx=1475, sy=2375, tx=1320, ty=2375)
    add_edge(root, "m12_2_7_2_5", value="12.2.7.2.5. Return result&amp;nbsp;&lt;div&gt;or propagate error&lt;/div&gt;", style=STYLE_REPLY, sx=1310, sy=2415, tx=1130, ty=2415)
    add_edge(root, "m12_2_7_2_6", value="12.2.7.2.6. Return result&amp;nbsp;&lt;div&gt;or propagate error&lt;/div&gt;", style=STYLE_REPLY, sx=1120, sy=2455, tx=925, ty=2455)

    # Self-call 3 on Service (Rule 13 & 14 - user's exact specification)
    add_rule14_self_call(root, "act_self_update_perm", "m12_2_7_2_7", "12.2.7.2.7. Handle update&amp;nbsp;&lt;div&gt;permissions result&lt;/div&gt;",
                         bar_x=920, bar_y=2515, main_right_x=925, sy=2495, ty=2515, mid_x=965)

    # Nested Alt 3 (Update Result check - Rule 13)
    add_cell(root, "fr_alt_3", value="alt", style=STYLE_FRAME, x=70, y=2550, w=1440, h=485)
    add_cell(root, "g_update_1", value="[update permissions failed]", style=STYLE_GUARD, x=120, y=2550, w=160, h=36)
    add_edge(root, "m12_2_7_2_7_1_1", value="12.2.7.2.7.1.1. throw 500&amp;nbsp;&lt;div&gt;FailedToSetRolePermissions&lt;/div&gt;", style=STYLE_REPLY, sx=915, sy=2595, tx=715, ty=2595)
    add_edge(root, "m12_2_7_2_7_1_2", value="12.2.7.2.7.1.2. Return 500 response", style=STYLE_REPLY, sx=705, sy=2645, tx=505, ty=2645)
    add_edge(root, "m12_2_7_2_7_1_3", value="12.2.7.2.7.1.3. Return&amp;nbsp;&lt;div&gt;500 response&lt;/div&gt;", style=STYLE_REPLY, sx=495, sy=2695, tx=305, ty=2695)
    add_edge(root, "m12_2_7_2_7_1_4", value='12.2.7.2.7.1.4. Show&amp;nbsp;&lt;div&gt;message "Failed to update&amp;nbsp;&lt;/div&gt;&lt;div&gt;role permissions"&lt;/div&gt;', style=STYLE_REPLY, sx=295, sy=2745, tx=105, ty=2745)

    add_edge(root, "div_alt_3", style=STYLE_DIVIDER, sx=70, sy=2795, tx=1510, ty=2795)
    add_cell(root, "g_update_2", value="[update permissions successfully]", style=STYLE_GUARD, x=120, y=2800, w=160, h=36)
    add_edge(root, "m12_2_7_2_7_2_1", value="12.2.7.2.7.2.1. Return updated role", style=STYLE_REPLY, sx=915, sy=2845, tx=715, ty=2845)
    add_edge(root, "m12_2_7_2_7_2_2", value="12.2.7.2.7.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=2895, tx=505, ty=2895)
    add_edge(root, "m12_2_7_2_7_2_3", value="12.2.7.2.7.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=2945, tx=305, ty=2945)
    add_edge(root, "m12_2_7_2_7_2_4", value='12.2.7.2.7.2.4. Show message&amp;nbsp;&lt;div&gt;"Permissions updated&lt;/div&gt;&lt;div&gt;&amp;nbsp;successfully"&lt;/div&gt;', style=STYLE_REPLY, sx=295, sy=2995, tx=105, ty=2995)

    return mxfile

# ==============================================================================
# 3. UC-14.01 VIEW FORUM CATEGORY LIST
# ==============================================================================
def build_uc_14_01():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-14.01-view-forum-category-list", "UC-14.01 View Forum Category List", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":ForumCategoryView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":ForumCategoryRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":ForumCategoryController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":ForumCategoryService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":ForumCategoryRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "Forum categories"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check query&nbsp;<div>parameters</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/forums/admin/categories", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/forums/admin/categories", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getAdminCategoryLists(roleName, query)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. getAdminCategoryLists(query)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.forumCategory.findMany({ where: { deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find active categories", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return result", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return result", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle query&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[categories list&lt;br&gt;is empty]", style=STYLE_GUARD, x=120, y=1200, w=160, h=36)
    add_edge(root, "m12_1_1", value="12.1.1. Return empty list", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return empty list", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return empty list", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "No categories found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[categories list&lt;br&gt;is not empty]", style=STYLE_GUARD, x=120, y=1450, w=160, h=36)
    add_edge(root, "m12_2_1", value="12.2.1. Return categories list &amp; pagination", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display category list with post count", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 4. UC-14.02 VIEW FORUM CATEGORY DETAIL
# ==============================================================================
def build_uc_14_02():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-14.02-view-forum-category-detail", "UC-14.02 View Forum Category Detail", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":ForumCategoryView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":ForumCategoryRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":ForumCategoryController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":ForumCategoryService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":ForumCategoryRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "View detail" on a category', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check category id&nbsp;<div>parameter</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/forums/admin/categories/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/forums/admin/categories/:id", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getAdminCategoryById(roleName, id)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. getAdminCategoryById(id)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.forumCategory.findFirst({ where: { id } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find category", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return category or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return category or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle query&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[category is null]", style=STYLE_GUARD, x=120, y=1200, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 ForumCategoryNotFound", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Category not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[category is not null]", style=STYLE_GUARD, x=120, y=1450, w=150, h=30)
    add_edge(root, "m12_2_1", value="12.2.1. Return category detail", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display category detail (name, slug, description, postCount)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 5. UC-15.01 VIEW PERMISSION LIST
# ==============================================================================
def build_uc_15_01():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-15.01-view-permission-list", "UC-15.01 View Permission List", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":PermissionView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":PermissionRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":PermissionsController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":PermissionsService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":PermissionsRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "Permissions"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check query&nbsp;<div>parameters</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/permissions", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/permissions", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getPermissions(query)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findAll(filter)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.$transaction([findMany, count, findMany(modules)])", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find permissions, count and modules", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return result", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return { permissions, total, modules }", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle query&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result (Rule 4, Rule 7, Rule 13)
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[permissions list&lt;br&gt;is empty]", style=STYLE_GUARD, x=120, y=1200, w=160, h=36)
    add_edge(root, "m12_1_1", value="12.1.1. Return empty list &amp; pagination", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "No permissions found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[permissions list&lt;br&gt;is not empty]", style=STYLE_GUARD, x=120, y=1450, w=160, h=36)
    add_edge(root, "m12_2_1", value="12.2.1. Return permissions list &amp; pagination", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display permission list (id, name, path, method, module)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 6. UC-15.02 VIEW PERMISSION DETAIL
# ==============================================================================
def build_uc_15_02():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-15.02-view-permission-detail", "UC-15.02 View Permission Detail", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":PermissionView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":PermissionRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":PermissionsController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":PermissionsService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":PermissionsRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "View detail"&lt;br&gt;on a permission', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check permission id&nbsp;<div>parameter</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/permissions/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/permissions/:id", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getPermissionById(id)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findById(id)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.permission.findFirst({ where: { id, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find permission", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return permission or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return permission or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle find permission&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result (Rule 4, Rule 7, Rule 13)
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[permission is null]", style=STYLE_GUARD, x=120, y=1200, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 PermissionNotFound", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Permission not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[permission is not null]", style=STYLE_GUARD, x=120, y=1450, w=150, h=30)
    add_edge(root, "m12_2_1", value="12.2.1. Return permission detail", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display permission detail (name, path, method, module)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 7. UC-16.01 VIEW SESSION LIST
# ==============================================================================
def build_uc_16_01():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-16.01-view-session-list", "UC-16.01 View Session List", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Client / Freelancer", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":SessionView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":SessionRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":SessionsController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":SessionsService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":SessionsRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "Active sessions"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check query&nbsp;<div>parameters</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/sessions", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed<br>|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/sessions", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getMySessions(userId, query, sessionId)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findAllByUserId(userId, filter, currentSessionId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.$transaction([findMany, count])", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find active sessions and count", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return result", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return { sessions, total }", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle find sessions&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result (Rule 5, Rule 7, Rule 13)
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[sessions list<br>is empty]", style=STYLE_GUARD, x=120, y=1200, w=160, h=36)
    add_edge(root, "m12_1_1", value="12.1.1. Return empty list &amp; pagination", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "No active sessions"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[sessions list<br>is not empty]", style=STYLE_GUARD, x=120, y=1450, w=160, h=36)
    add_edge(root, "m12_2_1", value="12.2.1. Return sessions list &amp; pagination", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display active session list (device, IP, login time)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 8. UC-16.02 VIEW SESSION DETAIL
# ==============================================================================
def build_uc_16_02():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-16.02-view-session-detail", "UC-16.02 View Session Detail", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Client / Freelancer", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":SessionView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":SessionRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":SessionsController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":SessionsService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":SessionsRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "View detail"<br>on a session', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check session id&nbsp;<div>parameter</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/backend/api/sessions/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed<br>|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/sessions/:id", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getMySessionById(id, userId, sessionId)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findByIdForUser(id, userId, sessionId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.session.findFirst({ where: { id, userId } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find login session", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return session or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return session or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle find session&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result (Rule 5, Rule 7, Rule 13)
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[session is null<br>or not owned]", style=STYLE_GUARD, x=120, y=1200, w=160, h=36)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 SessionNotFound", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Session not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[session is valid]", style=STYLE_GUARD, x=120, y=1450, w=160, h=36)
    add_edge(root, "m12_2_1", value="12.2.1. Return session detail", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display session info (device, IP address, login time)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# 9. UC-16.03 REVOKE SESSION
# ==============================================================================
def build_uc_16_03():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-16.03-revoke-session", "UC-16.03 Revoke Session", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Client / Freelancer", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1950) # 340 to 2290

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":SessionView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1950) # 340 to 2290

    add_cell(root, "lf_route", value=":SessionRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1790) # 450 to 2240

    add_cell(root, "lf_controller", value=":SessionsController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=780, w=10, h=1410) # 780 to 2190

    add_cell(root, "lf_service", value=":SessionsService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=830, w=10, h=1310) # 830 to 2140

    add_cell(root, "lf_repo", value=":SessionsRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=880, w=10, h=230) # 880 to 1110
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1500, w=10, h=230) # 1500 to 1730

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=930, w=10, h=140) # 930 to 1070
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1550, w=10, h=140) # 1550 to 1690

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=980, w=10, h=50) # 980 to 1030
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1600, w=10, h=50) # 1600 to 1650

    # Messages
    add_edge(root, "m1", value='1. Click "Revoke" on a session', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Click "Confirm revoke"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. DELETE /api/backend/api/sessions/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed<br>|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. DELETE /api/sessions/:id", style=STYLE_MSG, sx=505, sy=780, tx=705, ty=780)
    add_edge(root, "m5", value="5. revokeMySession(id, userId, sessionId)", style=STYLE_MSG, sx=715, sy=830, tx=915, ty=830)

    # Step 1: Find session
    add_edge(root, "m6", value="6. deleteActiveByIdForUser(id, userId)", style=STYLE_MSG, sx=925, sy=880, tx=1120, ty=880)
    add_edge(root, "m7", value="7. prisma.session.findFirst({ where: { id, userId } })", style=STYLE_MSG, sx=1130, sy=930, tx=1310, ty=930)
    add_edge(root, "m8", value="8. Execute SELECT query to find session", style=STYLE_MSG, sx=1320, sy=980, tx=1475, ty=980)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1030, tx=1320, ty=1030)
    add_edge(root, "m10", value="10. Return session or null", style=STYLE_REPLY, sx=1310, sy=1070, tx=1130, ty=1070)
    add_edge(root, "m11", value="11. Return session or null", style=STYLE_REPLY, sx=1120, sy=1110, tx=925, ty=1110)

    # Self-call 1 on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_find_session", "m12", "12. Handle find session&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1170, main_right_x=925, sy=1150, ty=1170, mid_x=965)

    # Outer Alt 1 (Session validity) (Rule 5 & 7)
    add_cell(root, "fr_alt_1", value="alt", style=STYLE_FRAME, x=40, y=1210, w=1500, h=1180)
    add_cell(root, "g_find_1", value="[session is null || expired]", style=STYLE_GUARD, x=120, y=1210, w=160, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404/400 error", style=STYLE_REPLY, sx=915, sy=1250, tx=715, ty=1250)
    add_edge(root, "m12_1_2", value="12.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1300, tx=505, ty=1300)
    add_edge(root, "m12_1_3", value="12.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1350, tx=305, ty=1350)
    add_edge(root, "m12_1_4", value="12.1.4. Show error message", style=STYLE_REPLY, sx=295, sy=1400, tx=105, ty=1400)

    add_edge(root, "div_alt_1", style=STYLE_DIVIDER, sx=40, sy=1450, tx=1540, ty=1450)
    add_cell(root, "g_find_2", value="[session is valid]", style=STYLE_GUARD, x=120, y=1455, w=160, h=30)

    # Step 2: Delete session
    add_edge(root, "m12_2_1", value="12.2.1. prisma.session.delete({ where: { id } })", style=STYLE_MSG, sx=925, sy=1500, tx=1120, ty=1500)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.session.delete({ where: { id: session.id } })", style=STYLE_MSG, sx=1130, sy=1550, tx=1310, ty=1550)
    add_edge(root, "m12_2_3", value="12.2.3. Execute DELETE query to revoke session", style=STYLE_MSG, sx=1320, sy=1600, tx=1475, ty=1600)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1650, tx=1320, ty=1650)
    add_edge(root, "m12_2_5", value="12.2.5. Return result", style=STYLE_REPLY, sx=1310, sy=1690, tx=1130, ty=1690)
    add_edge(root, "m12_2_6", value="12.2.6. Return delete result", style=STYLE_REPLY, sx=1120, sy=1730, tx=925, ty=1730)

    # Self-call 2 on Service (Rule 1 & Rule 14)
    add_rule14_self_call(root, "act_self_delete_session", "m12_2_7", "12.2.7. Handle delete session&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1790, main_right_x=925, sy=1770, ty=1790, mid_x=965)

    # Nested Alt 2 (Revoke Result check) (Rule 5 & 7)
    add_cell(root, "fr_alt_2", value="alt", style=STYLE_FRAME, x=55, y=1830, w=1470, h=520)
    add_cell(root, "g_rev_1", value="[revoke failed]", style=STYLE_GUARD, x=120, y=1830, w=160, h=30)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw FailedToRevokeSessionException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return 500 response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return 500 response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Revoke session failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "div_alt_2", style=STYLE_DIVIDER, sx=55, sy=2070, tx=1525, ty=2070)
    add_cell(root, "g_rev_2", value="[revoke success]", style=STYLE_GUARD, x=120, y=2075, w=160, h=30)
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return { message, loggedOut }", style=STYLE_REPLY, sx=915, sy=2120, tx=715, ty=2120)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 response", style=STYLE_REPLY, sx=705, sy=2170, tx=505, ty=2170)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 response", style=STYLE_REPLY, sx=495, sy=2220, tx=305, ty=2220)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message "Device logged out remotely" &amp; refresh', style=STYLE_REPLY, sx=295, sy=2270, tx=105, ty=2270)

    return mxfile

def build_uc_28_01():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-28.01-view-user-list", "UC-28.01 View User List", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "User management"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check query&nbsp;<div>parameters</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/users?search=&role=&status=&page=&limit=", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/users?search=&role=&status=&page=&limit=", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getUsers(query)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. getUsers(query)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.$transaction([user.findMany, user.count])", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find users and count", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return [users, total]", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return [users, total]", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return { data, meta }", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle get users&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[users list&lt;br&gt;is empty]", style=STYLE_GUARD, x=120, y=1200, w=160, h=36)
    add_edge(root, "m12_1_1", value="12.1.1. Return empty list (data: [], meta)", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 200 OK (empty list)", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 200 OK (empty list)", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "No users found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[users found]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)
    add_edge(root, "m12_2_1", value="12.2.1. Return AdminUserListResponseDto", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 OK (data, meta)", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 OK (data, meta)", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display user list (name, email,&lt;br&gt;role, status) with search, filter, sort", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# UC-28.02: View User Detail
# ==============================================================================
def build_uc_28_02():
    Y_BOTTOM = 1750
    mxfile, root = create_base_diagram("UC-28.02-view-user-detail", "UC-28.02 View User Detail", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1305) # 340 to 1645

    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=675) # 820 to 1495

    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "View detail" on a user', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_rule14_self_call(root, "act_self_param", "m2", "2. Check user id&nbsp;<div>parameter</div>",
                         bar_x=300, bar_y=410, main_right_x=305, sy=390, ty=410, mid_x=345)

    add_edge(root, "m3", value="3. GET /api/users/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. GET /api/users/:id", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. getUserById(id)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. getUserById(id)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({ where: { id, deletedAt: null }, include: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute query to find user detail by id", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return user or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return user or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_query", "m12", "12. Handle find user&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Alt query result
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=485)
    add_cell(root, "g_alt_1", value="[user is null]", style=STYLE_GUARD, x=120, y=1200, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFoundException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "User not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[user exists]", style=STYLE_GUARD, x=120, y=1455, w=150, h=25)
    add_edge(root, "m12_2_1", value="12.2.1. Return AdminUserDetailResponseDto", style=STYLE_REPLY, sx=915, sy=1495, tx=715, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. Return 200 OK (user detail)", style=STYLE_REPLY, sx=705, sy=1545, tx=505, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Return 200 OK (user detail)", style=STYLE_REPLY, sx=495, sy=1595, tx=305, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Display general account info and role&lt;br&gt;profile tabs (Client/Freelancer/Custom role)", style=STYLE_REPLY, sx=295, sy=1645, tx=105, ty=1645)

    return mxfile

# ==============================================================================
# UC-28.03: Create User
# ==============================================================================
def build_uc_28_03():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.03-create-user", "UC-28.03 Create User", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1945)

    # Lifelines
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1945)

    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1785)

    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1415)

    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1315)

    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages
    add_edge(root, "m1", value='1. Click "Create user"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Input email, password, fullName, roleId & Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. POST /api/users", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. POST /api/users", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. createUser(body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findUserByEmail(body.email)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({ where: { email, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to check email", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return existing user or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return existing user or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find user&nbsp;<div>email result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[email already exists]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 409 EmailAlreadyExistsException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 409 Conflict response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 409 Conflict response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "User email already exists"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[email available]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    # Step 2: create user in DB
    add_edge(root, "m12_2_1", value="12.2.1. createUserByAdmin(data)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.user.create({ data: { email, password, profile, userRoles } })", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute INSERT query to create user", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return created user", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return created user", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_create", "m12_2_7", "12.2.7. Handle creation&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[creation failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500 FailedToCreateUserException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Create user failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return AdminCreateUserResponseDto", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 201 Created response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 201 Created response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message "Create user success" & refresh list', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

# ==============================================================================
# UC-28.04: Update User
# ==============================================================================
def build_uc_28_04():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.04-update-user", "UC-28.04 Update User", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1945)

    # Lifelines
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1945)

    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1785)

    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1415)

    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1315)

    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages
    add_edge(root, "m1", value='1. Click "Edit" on a user', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Edit general account info (email, fullName, isBanned) & Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PATCH /api/users/:id", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. PATCH /api/users/:id", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. updateUser(id, actorId, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. updateUserByAdmin(id, data)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({ where: { id, deletedAt: null } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find existing user", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return existing user or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return existing user or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find user&nbsp;<div>result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[user is null]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFoundException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 Not Found response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 Not Found response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "User not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[user exists]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    # Step 2: update user in DB
    add_edge(root, "m12_2_1", value="12.2.1. prisma.$transaction(update user & delete sessions if banned)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. tx.user.update({ where: { id }, data: { ... } })", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute UPDATE query to update user info", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated user", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated user", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update&nbsp;<div>user result</div>",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500 FailedToUpdateUserException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Update user failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return AdminUpdateUserResponseDto", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message "Update user success" & refresh list', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

# ==============================================================================
# UC-28.05: Update Client Profile
# ==============================================================================
def build_uc_28_05():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.05-update-client-profile", "UC-28.05 Update Client Profile", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1945)

    # Lifelines
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1945)

    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1785)

    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1415)

    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1315)

    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages
    add_edge(root, "m1", value='1. Click "Edit" on Client profile tab', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Edit companyName, companyDescription, website & Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PATCH /api/users/:id/client-profile", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)

    # JWT Ref & Alt
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=450, y=490, w=260, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=525, y=505, w=160, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed&lt;br&gt;|| session is null]", style=STYLE_GUARD, x=120, y=560, w=160, h=36)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    # Controller & Service
    add_edge(root, "m4", value="4. PATCH /api/users/:id/client-profile", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. updateClientProfile(id, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findClientProfileEditContext(userId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({ where: { id: userId, deletedAt: null }, select: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find client profile context", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return context or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return context or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find client profile&nbsp;<div>context result</div>",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[!context || !canEdit]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFound / 403 NoClientRoleException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return 403/404 error response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return 403/404 error response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Client profile not found or permission denied"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[canEdit]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    # Step 2: update client profile in DB
    add_edge(root, "m12_2_1", value="12.2.1. upsertClientProfileByAdmin(userId, data)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.user.update({ where: { id: userId }, data: { profile: { ... } } })", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute UPSERT query to update client profile", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated clientProfile", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated clientProfile", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update client&nbsp;<div>profile result</div>",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500 FailedToUpdateClientProfileException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Update client profile failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return AdminClientProfileResponseDto", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message "Update client profile success" & refresh tab', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

def build_uc_28_06():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.06-update-freelancer-basic-info", "UC-28.06 Update Freelancer Basic Info", 1654, Y_BOTTOM + 100)

    # Actor & Lifelines
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)

    # Frames and Dividers (created BEFORE activation bars so bars are drawn ON TOP)
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=440, y=490, w=180, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=475, y=505, w=130, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed || session is null]", style=STYLE_GUARD, x=120, y=560, w=320, h=20)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)

    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[!context || !canEdit]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[canEdit]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)

    # Activation bars (created AFTER frames so they render in foreground)
    # Endpoints match last arrows exactly:
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1935)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1935)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1775)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1405)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1305)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages (wrapped to prevent overlapping activation bars)
    add_edge(root, "m1", value='1. Click "Edit" on&lt;br&gt;Freelancer basic info tab', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Edit title, bio, languages,&lt;br&gt;education, certifications&lt;br&gt;&amp; Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PATCH&lt;br&gt;/api/users/:id/freelancer-profile", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    add_edge(root, "m4", value="4. PATCH&lt;br&gt;/api/users/:id/freelancer-profile", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. updateFreelancerProfile(&lt;br&gt;id, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findFreelancerProfileEditContext(&lt;br&gt;userId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({&lt;br&gt;where: { id: userId,&lt;br&gt;deletedAt: null },&lt;br&gt;select: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find&lt;br&gt;freelancer profile context", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return context or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return context or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find freelancer&lt;br&gt;profile context result",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFound /&lt;br&gt;403 NoFreelancerRoleException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message&lt;br&gt;"Freelancer profile not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    # Step 2: update freelancer profile in DB
    add_edge(root, "m12_2_1", value="12.2.1. updateFreelancerProfileByAdmin(&lt;br&gt;userId, data)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.user.update({&lt;br&gt;where: { id: userId },&lt;br&gt;data: { profile: { ... } } })", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute UPDATE query to&lt;br&gt;update freelancer profile", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated result", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated result", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update freelancer&lt;br&gt;basic info result",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500&lt;br&gt;FailedToUpdateFreelancerProfileException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message&lt;br&gt;"Update freelancer basic info failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return MessageResDTO", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message&lt;br&gt;"Update freelancer basic info success"&lt;br&gt;&amp; refresh tab', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

# ==============================================================================
# UC-28.07: Update Freelancer Skills
# ==============================================================================
def build_uc_28_07():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.07-update-freelancer-skills", "UC-28.07 Update Freelancer Skills", 1654, Y_BOTTOM + 100)

    # Actor & Lifelines
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)

    # Frames and Dividers (created BEFORE activation bars)
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=440, y=490, w=180, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=475, y=505, w=130, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed || session is null]", style=STYLE_GUARD, x=120, y=560, w=320, h=20)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)

    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[!context || !canEdit]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[canEdit]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)

    # Activation bars (created AFTER frames so they render in foreground)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1935)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1935)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1775)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1405)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1305)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages (wrapped to prevent overlapping activation bars)
    add_edge(root, "m1", value='1. Click "Edit skills" on&lt;br&gt;Freelancer skills tab', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Select skills from catalog&lt;br&gt;&amp; Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PUT&lt;br&gt;/api/users/:id/freelancer-profile/skills", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    add_edge(root, "m4", value="4. PUT&lt;br&gt;/api/users/:id/freelancer-profile/skills", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. replaceFreelancerSkills(&lt;br&gt;id, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findFreelancerProfileEditContext(&lt;br&gt;userId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({&lt;br&gt;where: { id: userId,&lt;br&gt;deletedAt: null },&lt;br&gt;select: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find&lt;br&gt;freelancer profile context", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return context or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return context or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find freelancer&lt;br&gt;profile context result",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFound /&lt;br&gt;403 NoFreelancerRoleException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message&lt;br&gt;"Freelancer profile not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    # Step 2: replace skills in DB
    add_edge(root, "m12_2_1", value="12.2.1. replaceFreelancerSkills(&lt;br&gt;freelancerProfileId, skills)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.$transaction([&lt;br&gt;deleteMany skills,&lt;br&gt;createMany skills])", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute transaction query&lt;br&gt;to replace skills", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated skills result", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated skills result", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update skills result",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500&lt;br&gt;FailedToSaveSkillsException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message&lt;br&gt;"Update skills failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return MessageResDTO", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message&lt;br&gt;"Update skills success"&lt;br&gt;&amp; refresh list', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

# ==============================================================================
# UC-28.08: Update Portfolio
# ==============================================================================
def build_uc_28_08():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.08-update-portfolio", "UC-28.08 Update Portfolio", 1654, Y_BOTTOM + 100)

    # Actor & Lifelines
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "lf_controller", value=":UsersController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_service", value=":UsersService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_repo", value=":UsersRepository", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)

    # Frames and Dividers (created BEFORE activation bars)
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=440, y=490, w=180, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=475, y=505, w=130, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed || session is null]", style=STYLE_GUARD, x=120, y=560, w=320, h=20)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)

    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[!context || !canEdit]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[canEdit]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)

    # Activation bars (created AFTER frames so they render in foreground)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1935)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1935)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1775)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1405)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1305)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages (wrapped to prevent overlapping activation bars)
    add_edge(root, "m1", value='1. Click "Edit portfolio" on&lt;br&gt;Portfolio tab', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Edit portfolio items&lt;br&gt;&amp; Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PATCH /api/users/:id/&lt;br&gt;freelancer-profile/portfolio-items/:itemId", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    add_edge(root, "m4", value="4. PATCH /api/users/:id/&lt;br&gt;freelancer-profile/portfolio-items/:itemId", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. updatePortfolioItem(&lt;br&gt;id, itemId, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findFreelancerProfileEditContext(&lt;br&gt;userId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({&lt;br&gt;where: { id: userId,&lt;br&gt;deletedAt: null },&lt;br&gt;select: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find&lt;br&gt;freelancer profile context", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return context or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return context or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find portfolio&lt;br&gt;context result",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 UserNotFound /&lt;br&gt;403 NoFreelancerRoleException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message&lt;br&gt;"Portfolio not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    # Step 2: update portfolio item in DB
    add_edge(root, "m12_2_1", value="12.2.1. updatePortfolioItemByAdmin(&lt;br&gt;itemId, data)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.portfolioItem.update({&lt;br&gt;where: { id: itemId },&lt;br&gt;data: { ... } })", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute UPDATE query to&lt;br&gt;update portfolio item", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated portfolio item", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated portfolio item", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update portfolio result",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500&lt;br&gt;FailedToUpdatePortfolioItemException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message&lt;br&gt;"Update portfolio failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return MessageResDTO", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message&lt;br&gt;"Update portfolio success"&lt;br&gt;&amp; refresh list', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

# ==============================================================================
# UC-28.09: Update Expert Profile
# ==============================================================================
def build_uc_28_09():
    Y_BOTTOM = 2450
    mxfile, root = create_base_diagram("UC-28.09-update-expert-profile", "UC-28.09 Update Expert Profile", 1654, Y_BOTTOM + 100)

    # Actor & Lifelines
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "lf_view", value=":UserView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "lf_route", value=":UserRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "lf_controller", value=":AdminExpertProfileController", style=STYLE_LIFELINE, x=615, y=240, w=190, h=Y_BOTTOM - 240)
    add_cell(root, "lf_service", value=":ExpertProfileService", style=STYLE_LIFELINE, x=835, y=240, w=170, h=Y_BOTTOM - 240)
    add_cell(root, "lf_repo", value=":ExpertProfileRepository", style=STYLE_LIFELINE, x=1045, y=240, w=160, h=Y_BOTTOM - 240)
    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)

    # Frames and Dividers (created BEFORE activation bars)
    add_cell(root, "fr_ref", value="ref", style=STYLE_REF_FRAME, x=440, y=490, w=180, h=50)
    add_cell(root, "fr_ref_lbl", value="3.1. Verify jwt", style=STYLE_GUARD, x=475, y=505, w=130, h=20)

    add_cell(root, "fr_jwt_alt", value="alt", style=STYLE_FRAME, x=40, y=560, w=540, h=180)
    add_cell(root, "g_jwt_1", value="[no Bearer token || verify failed || session is null]", style=STYLE_GUARD, x=120, y=560, w=320, h=20)
    add_edge(root, "div_jwt", style=STYLE_DIVIDER, sx=40, sy=655, tx=580, ty=655)
    add_cell(root, "g_jwt_2", value="[user is banned or deleted]", style=STYLE_GUARD, x=120, y=660, w=160, h=25)

    add_cell(root, "fr_alt", value="alt", style=STYLE_FRAME, x=40, y=1200, w=1500, h=1180)
    add_cell(root, "g_alt_1", value="[!user || !hasExpertRole]", style=STYLE_GUARD, x=120, y=1200, w=160, h=30)
    add_edge(root, "div_alt", style=STYLE_DIVIDER, sx=40, sy=1445, tx=1540, ty=1445)
    add_cell(root, "g_alt_2", value="[hasExpertRole]", style=STYLE_GUARD, x=120, y=1455, w=160, h=25)

    add_cell(root, "fr_nested_alt", value="alt", style=STYLE_FRAME, x=60, y=1825, w=1460, h=515)
    add_cell(root, "g_nested_1", value="[update failed / error]", style=STYLE_GUARD, x=140, y=1825, w=170, h=30)
    add_edge(root, "div_nested_alt", style=STYLE_DIVIDER, sx=60, sy=2070, tx=1520, ty=2070)
    add_cell(root, "g_nested_2", value="[success]", style=STYLE_GUARD, x=140, y=2080, w=150, h=25)

    # Activation bars (created AFTER frames so they render in foreground)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, parent="1", x=95, y=340, w=10, h=1935)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="1", x=295, y=340, w=10, h=1935)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="1", x=495, y=450, w=10, h=1775)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="1", x=705, y=770, w=10, h=1405)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="1", x=915, y=820, w=10, h=1305)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="1", x=1120, y=870, w=10, h=230)
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="1", x=1120, y=1495, w=10, h=230)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="1", x=1310, y=920, w=10, h=140)
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="1", x=1310, y=1545, w=10, h=140)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, parent="1", x=1475, y=970, w=10, h=50)
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, parent="1", x=1475, y=1595, w=10, h=50)

    # Messages (wrapped to prevent overlapping activation bars)
    add_edge(root, "m1", value='1. Click "Edit" on&lt;br&gt;Expert profile tab', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value='2. Edit title, bio, expertise,&lt;br&gt;yearsOfExperience &amp; Click "Save"', style=STYLE_MSG, sx=105, sy=390, tx=295, ty=390)
    add_edge(root, "m3", value="3. PATCH /api/users/:id/&lt;br&gt;expert-profile", style=STYLE_MSG, sx=305, sy=450, tx=495, ty=450)
    add_edge(root, "msg_jwt_401", value="3.1.1. Return 401 response", style=STYLE_REPLY, sx=495, sy=605, tx=305, ty=605)
    add_edge(root, "msg_jwt_401_ui", value="3.1.2. Return error message", style=STYLE_REPLY, sx=295, sy=635, tx=105, ty=635)
    add_edge(root, "msg_jwt_403", value="3.2.1. Return 403 response", style=STYLE_REPLY, sx=495, sy=685, tx=305, ty=685)
    add_edge(root, "msg_jwt_403_ui", value="3.2.2. Return error message", style=STYLE_REPLY, sx=295, sy=715, tx=105, ty=715)

    add_edge(root, "m4", value="4. PATCH /api/users/:id/&lt;br&gt;expert-profile", style=STYLE_MSG, sx=505, sy=770, tx=705, ty=770)
    add_edge(root, "m5", value="5. update(id, adminId, body)", style=STYLE_MSG, sx=715, sy=820, tx=915, ty=820)
    add_edge(root, "m6", value="6. findByUserId(userId)", style=STYLE_MSG, sx=925, sy=870, tx=1120, ty=870)
    add_edge(root, "m7", value="7. prisma.user.findUnique({&lt;br&gt;where: { id: userId,&lt;br&gt;deletedAt: null },&lt;br&gt;select: { ... } })", style=STYLE_MSG, sx=1130, sy=920, tx=1310, ty=920)
    add_edge(root, "m8", value="8. Execute SELECT query to find&lt;br&gt;expert profile context", style=STYLE_MSG, sx=1320, sy=970, tx=1475, ty=970)
    add_edge(root, "m9", value="9. Return result", style=STYLE_REPLY, sx=1475, sy=1020, tx=1320, ty=1020)
    add_edge(root, "m10", value="10. Return user context or null", style=STYLE_REPLY, sx=1310, sy=1060, tx=1130, ty=1060)
    add_edge(root, "m11", value="11. Return user context or null", style=STYLE_REPLY, sx=1120, sy=1100, tx=925, ty=1100)

    # Self-call on Service (Rule 14)
    add_rule14_self_call(root, "act_self_check", "m12", "12. Handle find expert profile&lt;br&gt;context result",
                         bar_x=920, bar_y=1160, main_right_x=925, sy=1140, ty=1160, mid_x=965)

    # Outer Alt
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 ExpertProfileNotFound /&lt;br&gt;403 NotAnExpertAccountException", style=STYLE_REPLY, sx=915, sy=1245, tx=715, ty=1245)
    add_edge(root, "m12_1_2", value="12.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1295, tx=505, ty=1295)
    add_edge(root, "m12_1_3", value="12.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1345, tx=305, ty=1345)
    add_edge(root, "m12_1_4", value='12.1.4. Show message&lt;br&gt;"Expert profile not found"', style=STYLE_REPLY, sx=295, sy=1395, tx=105, ty=1395)

    # Step 2: update expert profile in DB
    add_edge(root, "m12_2_1", value="12.2.1. updateDirect(userId,&lt;br&gt;adminId, sanitized, strength)", style=STYLE_MSG, sx=925, sy=1495, tx=1120, ty=1495)
    add_edge(root, "m12_2_2", value="12.2.2. prisma.$transaction([&lt;br&gt;profileRevision.updateMany,&lt;br&gt;expertProfile.upsert])", style=STYLE_MSG, sx=1130, sy=1545, tx=1310, ty=1545)
    add_edge(root, "m12_2_3", value="12.2.3. Execute UPDATE query to&lt;br&gt;update expert profile", style=STYLE_MSG, sx=1320, sy=1595, tx=1475, ty=1595)
    add_edge(root, "m12_2_4", value="12.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=1645, tx=1320, ty=1645)
    add_edge(root, "m12_2_5", value="12.2.5. Return updated result", style=STYLE_REPLY, sx=1310, sy=1685, tx=1130, ty=1685)
    add_edge(root, "m12_2_6", value="12.2.6. Return updated result", style=STYLE_REPLY, sx=1120, sy=1725, tx=925, ty=1725)

    add_rule14_self_call(root, "act_self_update", "m12_2_7", "12.2.7. Handle update expert profile result",
                         bar_x=920, bar_y=1785, main_right_x=925, sy=1765, ty=1785, mid_x=965)

    # Nested Alt
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 500&lt;br&gt;FailedToUpdateExpertProfileException", style=STYLE_REPLY, sx=915, sy=1870, tx=715, ty=1870)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return error response", style=STYLE_REPLY, sx=705, sy=1920, tx=505, ty=1920)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return error response", style=STYLE_REPLY, sx=495, sy=1970, tx=305, ty=1970)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message&lt;br&gt;"Update expert profile failed"', style=STYLE_REPLY, sx=295, sy=2020, tx=105, ty=2020)

    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. Return MessageResDTO", style=STYLE_REPLY, sx=915, sy=2125, tx=715, ty=2125)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. Return 200 OK response", style=STYLE_REPLY, sx=705, sy=2175, tx=505, ty=2175)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Return 200 OK response", style=STYLE_REPLY, sx=495, sy=2225, tx=305, ty=2225)
    add_edge(root, "m12_2_7_2_4", value='12.2.7.2.4. Show message&lt;br&gt;"Update expert profile success"&lt;br&gt;&amp; refresh tab', style=STYLE_REPLY, sx=295, sy=2275, tx=105, ty=2275)

    return mxfile

if __name__ == "__main__":
    out_dir = "sequence-diagrams-remake"
    target_dir = "sequence-diagrams"
    upload_dir = r"C:\Users\ASUS\.gemini\antigravity\brain\9714116c-2560-4830-b0f0-b02794b6a43c\.user_uploaded"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(target_dir, exist_ok=True)

    # Only generate the files sent by user in this request:
    files_to_build = [
        ("UC-28.06-update-freelancer-basic-info.drawio", build_uc_28_06, "media_1793382155566_f6784263.drawio"),
        ("UC-28.07-update-freelancer-skills.drawio", build_uc_28_07, "media_1793382155566_376a9a81.drawio"),
        ("UC-28.08-update-portfolio.drawio", build_uc_28_08, "media_1793382155568_be9fe02b.drawio"),
        ("UC-28.09-update-expert-profile.drawio", build_uc_28_09, "media_1793382155568_ef2d93be.drawio"),
    ]

    for fname, builder, upload_name in files_to_build:
        mx = builder()
        p = os.path.join(out_dir, fname)
        save_tree(mx, p)
        shutil.copyfile(p, os.path.join(target_dir, fname))
        if upload_name and os.path.exists(upload_dir):
            upload_path = os.path.join(upload_dir, upload_name)
            shutil.copyfile(p, upload_path)
            print(f"  -> synced to upload {upload_name}")

    print(f"Successfully generated and synced {len(files_to_build)} requested diagrams!")
