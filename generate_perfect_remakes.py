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

def save_tree(mxfile, filename):
    tree = ET.ElementTree(mxfile)
    ET.indent(tree, space="  ", level=0)
    tree.write(filename, encoding="utf-8", xml_declaration=False)
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

    # Lifelines
    add_cell(root, "lf_view", value=":RoleView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="lf_view", x=70, y=100, w=10, h=2540) # 340 to 2880

    add_cell(root, "lf_route", value=":RoleRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="lf_route", x=55, y=210, w=10, h=2380) # 450 to 2830

    add_cell(root, "lf_controller", value=":RoleController", style=STYLE_LIFELINE, x=640, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="lf_controller", x=65, y=540, w=10, h=2000) # 780 to 2780

    add_cell(root, "lf_service", value=":RoleService", style=STYLE_LIFELINE, x=850, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="lf_service", x=65, y=590, w=10, h=1900) # 830 to 2730
    add_cell(root, "act_self_find_role", style=STYLE_SELF_BAR, parent="lf_service", x=70, y=930, w=10, h=20) # 1170 to 1190
    add_cell(root, "act_self_sys_role", style=STYLE_SELF_BAR, parent="lf_service", x=70, y=1270, w=10, h=20) # 1510 to 1530
    add_cell(root, "act_self_user_count", style=STYLE_SELF_BAR, parent="lf_service", x=70, y=1890, w=10, h=20) # 2130 to 2150

    add_cell(root, "lf_repo", value=":RoleRepo", style=STYLE_LIFELINE, x=1060, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=640, w=10, h=230) # 880 to 1110
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=1600, w=10, h=230) # 1840 to 2070
    add_cell(root, "act_repo_3", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=2210, w=10, h=230) # 2450 to 2680

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=690, w=10, h=140) # 930 to 1070
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=1650, w=10, h=140) # 1890 to 2030
    add_cell(root, "act_prisma_3", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=2260, w=10, h=140) # 2500 to 2640

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, x=1475, y=980, w=10, h=50) # 980 to 1030
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, x=1475, y=1940, w=10, h=50) # 1940 to 1990
    add_cell(root, "act_db_3", style=STYLE_ACT_BAR, x=1475, y=2550, w=10, h=50) # 2550 to 2600

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
    add_edge(root, "m12", value="12. Handle find role result", style=STYLE_MSG, sx=925, sy=1150, tx=930, ty=1170,
             points=[(965, 1150), (965, 1170)], target="act_self_find_role")

    # Outer Alt 1 (Role Existence)
    add_cell(root, "fr_alt_1", value="alt", style=STYLE_FRAME, x=40, y=1210, w=1500, h=1760)
    add_cell(root, "g_find_1", value="[role not found]", style=STYLE_GUARD, x=120, y=1210, w=150, h=30)
    add_edge(root, "m12_1_1", value="12.1.1. throw 404 RoleNotFound", style=STYLE_REPLY, sx=915, sy=1250, tx=715, ty=1250)
    add_edge(root, "m12_1_2", value="12.1.2. Return 404 response", style=STYLE_REPLY, sx=705, sy=1300, tx=505, ty=1300)
    add_edge(root, "m12_1_3", value="12.1.3. Return 404 response", style=STYLE_REPLY, sx=495, sy=1350, tx=305, ty=1350)
    add_edge(root, "m12_1_4", value='12.1.4. Show message "Role not found"', style=STYLE_REPLY, sx=295, sy=1400, tx=105, ty=1400)

    add_edge(root, "div_alt_1", style=STYLE_DIVIDER, sx=40, sy=1450, tx=1540, ty=1450)
    add_cell(root, "g_find_2", value="[role found]", style=STYLE_GUARD, x=120, y=1455, w=150, h=30)

    # Step 2: System role check
    add_edge(root, "m12_2_1", value="12.2.1. Check role is not a system role", style=STYLE_MSG, sx=925, sy=1490, tx=930, ty=1510,
             points=[(965, 1490), (965, 1510)], target="act_self_sys_role")

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
    add_edge(root, "m12_2_1_2_7", value="12.2.1.2.7. Handle user count result", style=STYLE_MSG, sx=925, sy=2110, tx=930, ty=2130,
             points=[(965, 2110), (965, 2130)], target="act_self_user_count")

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
# 2. UC-06.06 UPDATE ROLE PERMISSIONS (Full Logic)
# ==============================================================================
def build_uc_06_06():
    Y_BOTTOM = 3050
    mxfile, root = create_base_diagram("UC-06_06-update-role-permissions", "UC-06.06 Update Role Permissions", 1654, Y_BOTTOM + 100)

    # Actor
    add_cell(root, "lf_actor", value="Admin", style=STYLE_ACTOR, x=85, y=200, w=30, h=60)
    add_edge(root, "dash_actor", style=STYLE_DASH_LINE, sx=100, sy=282, tx=100, ty=Y_BOTTOM)
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, x=95, y=340, w=10, h=2585) # 340 to 2925

    # Lifelines
    add_cell(root, "lf_view", value=":RoleView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="lf_view", x=70, y=100, w=10, h=2585) # 340 to 2925
    add_cell(root, "act_self_validate", style=STYLE_SELF_BAR, parent="lf_view", x=75, y=170, w=10, h=20) # 410 to 430

    add_cell(root, "lf_route", value=":RoleRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="lf_route", x=55, y=330, w=10, h=2305) # 570 to 2875

    add_cell(root, "lf_controller", value=":RoleController", style=STYLE_LIFELINE, x=640, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="lf_controller", x=65, y=650, w=10, h=1935) # 890 to 2825

    add_cell(root, "lf_service", value=":RoleService", style=STYLE_LIFELINE, x=850, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="lf_service", x=65, y=700, w=10, h=1835) # 940 to 2775
    add_cell(root, "act_self_find_role", style=STYLE_SELF_BAR, parent="lf_service", x=70, y=1040, w=10, h=20) # 1280 to 1300
    add_cell(root, "act_self_val_perm", style=STYLE_SELF_BAR, parent="lf_service", x=70, y=1650, w=10, h=20) # 1890 to 1910

    add_cell(root, "lf_repo", value=":RoleRepo", style=STYLE_LIFELINE, x=1060, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo_1", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=750, w=10, h=230) # 990 to 1220
    add_cell(root, "act_repo_2", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=1360, w=10, h=230) # 1600 to 1830
    add_cell(root, "act_repo_3", style=STYLE_ACT_BAR, parent="lf_repo", x=60, y=1985, w=10, h=500) # 2225 to 2725

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma_1", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=800, w=10, h=140) # 1040 to 1180
    add_cell(root, "act_prisma_2", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=1410, w=10, h=140) # 1650 to 1790
    add_cell(root, "act_prisma_3", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=2035, w=10, h=410) # 2275 to 2685

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db_1", style=STYLE_ACT_BAR, x=1475, y=1090, w=10, h=50) # 1090 to 1140
    add_cell(root, "act_db_2", style=STYLE_ACT_BAR, x=1475, y=1700, w=10, h=50) # 1700 to 1750
    add_cell(root, "act_db_3", style=STYLE_ACT_BAR, x=1475, y=2325, w=10, h=50) # 2325 to 2375
    add_cell(root, "act_db_4", style=STYLE_ACT_BAR, x=1475, y=2595, w=10, h=50) # 2595 to 2645

    # Messages
    add_edge(root, "m1", value="1. Select permissions for role", style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value="2. Check validate permissions", style=STYLE_MSG, sx=305, sy=390, tx=310, ty=410,
             points=[(345, 390), (345, 410)], target="act_self_validate")

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
    add_edge(root, "m12", value="12. Handle find role result", style=STYLE_MSG, sx=925, sy=1260, tx=930, ty=1280,
             points=[(965, 1260), (965, 1280)], target="act_self_find_role")

    # Outer Alt 1 (Role Existence)
    add_cell(root, "fr_alt_1", value="alt", style=STYLE_FRAME, x=40, y=1320, w=1500, h=1665)
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
    add_edge(root, "m12_2_7", value="12.2.7. Handle validate permissions result", style=STYLE_MSG, sx=925, sy=1870, tx=930, ty=1890,
             points=[(965, 1870), (965, 1890)], target="act_self_val_perm")

    # Nested Alt 2 (Permission validation)
    add_cell(root, "fr_alt_2", value="alt", style=STYLE_FRAME, x=55, y=1930, w=1470, h=1035)
    add_cell(root, "g_perm_1", value="[activeIds.length !==&lt;br&gt;permissionIds.length]", style=STYLE_GUARD, x=120, y=1930, w=160, h=36)
    add_edge(root, "m12_2_7_1_1", value="12.2.7.1.1. throw 400 InvalidPermissionIds", style=STYLE_REPLY, sx=915, sy=1975, tx=715, ty=1975)
    add_edge(root, "m12_2_7_1_2", value="12.2.7.1.2. Return 400 response", style=STYLE_REPLY, sx=705, sy=2025, tx=505, ty=2025)
    add_edge(root, "m12_2_7_1_3", value="12.2.7.1.3. Return 400 response", style=STYLE_REPLY, sx=495, sy=2075, tx=305, ty=2075)
    add_edge(root, "m12_2_7_1_4", value='12.2.7.1.4. Show message "Invalid permission IDs"', style=STYLE_REPLY, sx=295, sy=2125, tx=105, ty=2125)

    add_edge(root, "div_alt_2", style=STYLE_DIVIDER, sx=55, sy=2175, tx=1525, ty=2175)
    add_cell(root, "g_perm_2", value="[activeIds.length ===&lt;br&gt;permissionIds.length]", style=STYLE_GUARD, x=120, y=2180, w=160, h=36)

    # Step 3: Replace permissions & reload role
    add_edge(root, "m12_2_7_2_1", value="12.2.7.2.1. replaceRolePermissions(id, permissionIds)", style=STYLE_MSG, sx=925, sy=2225, tx=1120, ty=2225)
    add_edge(root, "m12_2_7_2_2", value="12.2.7.2.2. prisma.$transaction([deleteMany, createMany])", style=STYLE_MSG, sx=1130, sy=2275, tx=1310, ty=2275)
    add_edge(root, "m12_2_7_2_3", value="12.2.7.2.3. Execute DELETE &amp; INSERT queries", style=STYLE_MSG, sx=1320, sy=2325, tx=1475, ty=2325)
    add_edge(root, "m12_2_7_2_4", value="12.2.7.2.4. Return result", style=STYLE_REPLY, sx=1475, sy=2375, tx=1320, ty=2375)
    add_edge(root, "m12_2_7_2_5", value="12.2.7.2.5. Return result", style=STYLE_REPLY, sx=1310, sy=2415, tx=1130, ty=2415)
    add_edge(root, "m12_2_7_2_6", value="12.2.7.2.6. Return result", style=STYLE_REPLY, sx=1120, sy=2455, tx=925, ty=2455)

    add_edge(root, "m12_2_7_2_7", value="12.2.7.2.7. findById(id)", style=STYLE_MSG, sx=925, sy=2495, tx=1120, ty=2495)
    add_edge(root, "m12_2_7_2_8", value="12.2.7.2.8. prisma.role.findFirst({ where: { id }, include: { permissions } })", style=STYLE_MSG, sx=1130, sy=2545, tx=1310, ty=2545)
    add_edge(root, "m12_2_7_2_9", value="12.2.7.2.9. Execute SELECT query", style=STYLE_MSG, sx=1320, sy=2595, tx=1475, ty=2595)
    add_edge(root, "m12_2_7_2_10", value="12.2.7.2.10. Return updated role", style=STYLE_REPLY, sx=1475, sy=2645, tx=1320, ty=2645)
    add_edge(root, "m12_2_7_2_11", value="12.2.7.2.11. Return updated role", style=STYLE_REPLY, sx=1310, sy=2685, tx=1130, ty=2685)
    add_edge(root, "m12_2_7_2_12", value="12.2.7.2.12. Return updated role", style=STYLE_REPLY, sx=1120, sy=2725, tx=925, ty=2725)
    add_edge(root, "m12_2_7_2_13", value="12.2.7.2.13. Return updated role", style=STYLE_REPLY, sx=915, sy=2775, tx=715, ty=2775)
    add_edge(root, "m12_2_7_2_14", value="12.2.7.2.14. Return 200 response", style=STYLE_REPLY, sx=705, sy=2825, tx=505, ty=2825)
    add_edge(root, "m12_2_7_2_15", value="12.2.7.2.15. Return 200 response", style=STYLE_REPLY, sx=495, sy=2875, tx=305, ty=2875)
    add_edge(root, "m12_2_7_2_16", value='12.2.7.2.16. Show message "Permissions updated successfully"', style=STYLE_REPLY, sx=295, sy=2925, tx=105, ty=2925)

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
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":ForumCategoryView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="lf_view", x=70, y=100, w=10, h=1305) # 340 to 1645
    add_cell(root, "act_self_param", style=STYLE_SELF_BAR, parent="lf_view", x=75, y=170, w=10, h=20) # 410 to 430

    add_cell(root, "lf_route", value=":ForumCategoryRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="lf_route", x=55, y=210, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":ForumCategoryController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="lf_controller", x=70, y=530, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":ForumCategoryService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="lf_service", x=70, y=580, w=10, h=675) # 820 to 1495
    add_cell(root, "act_self_query", style=STYLE_SELF_BAR, parent="lf_service", x=75, y=920, w=10, h=20) # 1160 to 1180

    add_cell(root, "lf_repo", value=":ForumCategoryRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="lf_repo", x=65, y=630, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=680, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "Forum categories"', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value="2. Check query parameters", style=STYLE_MSG, sx=305, sy=390, tx=310, ty=410,
             points=[(345, 390), (345, 410)], target="act_self_param")
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
    add_edge(root, "m12", value="12. Handle query result", style=STYLE_MSG, sx=925, sy=1140, tx=930, ty=1160,
             points=[(965, 1140), (965, 1160)], target="act_self_query")

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
    add_cell(root, "act_actor", style=STYLE_ACT_BAR, x=95, y=340, w=10, h=1305) # 340 to 1645

    # Lifelines - standard center coordinates: 300, 500, 710, 920, 1125, 1315, 1480
    add_cell(root, "lf_view", value=":ForumCategoryView", style=STYLE_LIFELINE, x=225, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_view", style=STYLE_ACT_BAR, parent="lf_view", x=70, y=100, w=10, h=1305) # 340 to 1645
    add_cell(root, "act_self_param", style=STYLE_SELF_BAR, parent="lf_view", x=75, y=170, w=10, h=20) # 410 to 430

    add_cell(root, "lf_route", value=":ForumCategoryRoute", style=STYLE_LIFELINE, x=440, y=240, w=120, h=Y_BOTTOM - 240)
    add_cell(root, "act_route", style=STYLE_ACT_BAR, parent="lf_route", x=55, y=210, w=10, h=1145) # 450 to 1595

    add_cell(root, "lf_controller", value=":ForumCategoryController", style=STYLE_LIFELINE, x=635, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_controller", style=STYLE_ACT_BAR, parent="lf_controller", x=70, y=530, w=10, h=775) # 770 to 1545

    add_cell(root, "lf_service", value=":ForumCategoryService", style=STYLE_LIFELINE, x=845, y=240, w=150, h=Y_BOTTOM - 240)
    add_cell(root, "act_service", style=STYLE_ACT_BAR, parent="lf_service", x=70, y=580, w=10, h=675) # 820 to 1495
    add_cell(root, "act_self_query", style=STYLE_SELF_BAR, parent="lf_service", x=75, y=920, w=10, h=20) # 1160 to 1180

    add_cell(root, "lf_repo", value=":ForumCategoryRepo", style=STYLE_LIFELINE, x=1055, y=240, w=140, h=Y_BOTTOM - 240)
    add_cell(root, "act_repo", style=STYLE_ACT_BAR, parent="lf_repo", x=65, y=630, w=10, h=230) # 870 to 1100

    add_cell(root, "lf_prisma", value=":PrismaService", style=STYLE_LIFELINE, x=1250, y=240, w=130, h=Y_BOTTOM - 240)
    add_cell(root, "act_prisma", style=STYLE_ACT_BAR, parent="lf_prisma", x=60, y=680, w=10, h=140) # 920 to 1060

    add_cell(root, "node_db", style=STYLE_DB_ICON, x=1450, y=220, w=60, h=70)
    add_cell(root, "node_db_lbl", value="Database", style=STYLE_DB_LABEL, x=1450, y=292, w=60, h=30)
    add_edge(root, "dash_db", style=STYLE_DASH_LINE, sx=1480, sy=322, tx=1480, ty=Y_BOTTOM)
    add_cell(root, "act_db", style=STYLE_ACT_BAR, x=1475, y=970, w=10, h=50) # 970 to 1020

    # Messages
    add_edge(root, "m1", value='1. Click "View detail" on a category', style=STYLE_MSG, sx=105, sy=340, tx=295, ty=340)
    add_edge(root, "m2", value="2. Check category id parameter", style=STYLE_MSG, sx=305, sy=390, tx=310, ty=410,
             points=[(345, 390), (345, 410)], target="act_self_param")
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
    add_edge(root, "m12", value="12. Handle query result", style=STYLE_MSG, sx=925, sy=1140, tx=930, ty=1160,
             points=[(965, 1140), (965, 1160)], target="act_self_query")

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

if __name__ == "__main__":
    out_dir = "sequence-diagrams-remake"
    os.makedirs(out_dir, exist_ok=True)

    # 1. UC-06.05
    f1 = build_uc_06_05()
    p1 = os.path.join(out_dir, "UC-06.05-delete-role.drawio")
    save_tree(f1, p1)
    shutil.copyfile(p1, os.path.join(out_dir, "UC-06_05-delete-role.drawio"))

    # 2. UC-06.06
    f2 = build_uc_06_06()
    p2 = os.path.join(out_dir, "UC-06.06-update-role-permissions.drawio")
    save_tree(f2, p2)
    shutil.copyfile(p2, os.path.join(out_dir, "UC-06_06-update-role-permissions.drawio"))

    # 3. UC-14.01
    f3 = build_uc_14_01()
    p3 = os.path.join(out_dir, "UC-14.01-view-forum-category-list.drawio")
    save_tree(f3, p3)

    # 4. UC-14.02
    f4 = build_uc_14_02()
    p4 = os.path.join(out_dir, "UC-14.02-view-forum-category-detail.drawio")
    save_tree(f4, p4)

    print("All 4 perfect diagrams generated successfully in sequence-diagrams-remake")
