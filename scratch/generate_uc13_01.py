import xml.etree.ElementTree as ET

def generate_uc13_01_xml():
    # Lifeline centers
    X_ACTOR = 100
    X_VIEW = 320
    X_ROUTE = 570
    X_CTRL = 840
    X_SVC = 1130
    X_REPO = 1420
    X_DB = 1710

    # Overall dimensions
    CANVAS_WIDTH = 1900
    PAGE_HEIGHT = 2650
    LIFELINE_TOP_Y = 140
    LIFELINE_HEIGHT = 2440

    root = ET.Element('mxfile', {
        'host': 'Electron',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) draw.io/29.0.3',
        'version': '29.0.3'
    })
    
    diagram = ET.SubElement(root, 'diagram', {
        'id': 'uc13-01-create-contract',
        'name': 'UC-13.01 Create Contract'
    })
    
    graph_model = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '1600',
        'dy': '900',
        'grid': '1',
        'gridSize': '10',
        'guides': '1',
        'tooltips': '1',
        'connect': '1',
        'arrows': '1',
        'fold': '1',
        'page': '1',
        'pageScale': '1',
        'pageWidth': str(CANVAS_WIDTH),
        'pageHeight': str(PAGE_HEIGHT),
        'math': '0',
        'shadow': '0'
    })
    
    m_root = ET.SubElement(graph_model, 'root')
    ET.SubElement(m_root, 'mxCell', {'id': '0'})
    ET.SubElement(m_root, 'mxCell', {'id': '1', 'parent': '0'})

    def add_cell(cid, parent_id, value, style, vertex=None, edge=None, source=None, target=None, geo=None):
        attribs = {'id': cid, 'parent': parent_id}
        if value is not None:
            attribs['value'] = value
        if style:
            attribs['style'] = style
        if vertex:
            attribs['vertex'] = '1'
        if edge:
            attribs['edge'] = '1'
        if source:
            attribs['source'] = source
        if target:
            attribs['target'] = target
        cell = ET.SubElement(m_root, 'mxCell', attribs)
        if geo:
            g_elem = ET.SubElement(cell, 'mxGeometry', geo)
            if 'points' in geo:
                pts_arr = ET.SubElement(g_elem, 'Array', {'as': 'points'})
                for px, py in geo['points']:
                    ET.SubElement(pts_arr, 'mxPoint', {'x': str(px), 'y': str(py)})
        return cell

    # 1. Lifelines
    # Actor: Client
    add_cell('actor_client', '1', 'Client',
             'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontStyle=1;fontSize=13;',
             vertex=True, geo={'x': str(X_ACTOR - 20), 'y': '40', 'width': '40', 'height': '70', 'as': 'geometry'})
    add_cell('ll_actor', '1', '',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#666666;dashed=1;',
             vertex=True, geo={'x': str(X_ACTOR - 5), 'y': str(LIFELINE_TOP_Y), 'width': '10', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})

    # :ContractView
    add_cell('ll_view', '1', ':ContractView',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_VIEW - 80), 'y': '80', 'width': '160', 'height': str(LIFELINE_HEIGHT + 60), 'as': 'geometry'})

    # :ContractRoute
    add_cell('ll_route', '1', ':ContractRoute',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_ROUTE - 80), 'y': '80', 'width': '160', 'height': str(LIFELINE_HEIGHT + 60), 'as': 'geometry'})

    # :ContractController
    add_cell('ll_ctrl', '1', ':ContractController',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_CTRL - 90), 'y': '80', 'width': '180', 'height': str(LIFELINE_HEIGHT + 60), 'as': 'geometry'})

    # :ContractService
    add_cell('ll_svc', '1', ':ContractService',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#ffe6cc;strokeColor=#d79b00;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_SVC - 85), 'y': '80', 'width': '170', 'height': str(LIFELINE_HEIGHT + 60), 'as': 'geometry'})

    # :ContractRepo
    add_cell('ll_repo', '1', ':ContractRepo',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_REPO - 80), 'y': '80', 'width': '160', 'height': str(LIFELINE_HEIGHT + 60), 'as': 'geometry'})

    # :Database
    add_cell('db_icon', '1', '',
             'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#f8cecc;strokeColor=#b85450;',
             vertex=True, geo={'x': str(X_DB - 30), 'y': '50', 'width': '60', 'height': '60', 'as': 'geometry'})
    add_cell('db_label', '1', ':Database',
             'text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;fontStyle=1;fontSize=12;',
             vertex=True, geo={'x': str(X_DB - 45), 'y': '112', 'width': '90', 'height': '26', 'as': 'geometry'})
    add_cell('ll_db', '1', '',
             'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#b85450;dashed=1;',
             vertex=True, geo={'x': str(X_DB - 5), 'y': str(LIFELINE_TOP_Y), 'width': '10', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})

    # Activation bars
    add_cell('bar_actor', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#808080;strokeColor=#000000;',
             vertex=True, geo={'x': str(X_ACTOR - 5), 'y': '200', 'width': '10', 'height': '2320', 'as': 'geometry'})
    add_cell('bar_view', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#e1d5e7;strokeColor=#9673a6;',
             vertex=True, geo={'x': str(X_VIEW - 5), 'y': '210', 'width': '10', 'height': '2300', 'as': 'geometry'})
    add_cell('bar_route', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#dae8fc;strokeColor=#6c8ebf;',
             vertex=True, geo={'x': str(X_ROUTE - 5), 'y': '420', 'width': '10', 'height': '2040', 'as': 'geometry'})
    add_cell('bar_ctrl', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#d5e8d4;strokeColor=#82b366;',
             vertex=True, geo={'x': str(X_CTRL - 5), 'y': '660', 'width': '10', 'height': '1750', 'as': 'geometry'})
    add_cell('bar_svc', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#ffe6cc;strokeColor=#d79b00;',
             vertex=True, geo={'x': str(X_SVC - 5), 'y': '720', 'width': '10', 'height': '1640', 'as': 'geometry'})

    # Repo bars
    add_cell('bar_repo_1', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#fff2cc;strokeColor=#d6b656;',
             vertex=True, geo={'x': str(X_REPO - 5), 'y': '780', 'width': '10', 'height': '240', 'as': 'geometry'})
    add_cell('bar_repo_2', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#fff2cc;strokeColor=#d6b656;',
             vertex=True, geo={'x': str(X_REPO - 5), 'y': '1460', 'width': '10', 'height': '170', 'as': 'geometry'})
    add_cell('bar_repo_3', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#fff2cc;strokeColor=#d6b656;',
             vertex=True, geo={'x': str(X_REPO - 5), 'y': '1955', 'width': '10', 'height': '330', 'as': 'geometry'})

    # DB bars
    add_cell('bar_db_1', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#f8cecc;strokeColor=#b85450;',
             vertex=True, geo={'x': str(X_DB - 5), 'y': '840', 'width': '10', 'height': '135', 'as': 'geometry'})
    add_cell('bar_db_2', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#f8cecc;strokeColor=#b85450;',
             vertex=True, geo={'x': str(X_DB - 5), 'y': '1515', 'width': '10', 'height': '75', 'as': 'geometry'})
    add_cell('bar_db_3', '1', '', 'html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#f8cecc;strokeColor=#b85450;',
             vertex=True, geo={'x': str(X_DB - 5), 'y': '2080', 'width': '10', 'height': '160', 'as': 'geometry'})

    # Edge Styles
    SYNC_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#000000;labelBackgroundColor=#ffffff;align=center;verticalAlign=bottom;fontSize=11;whiteSpace=wrap;"
    REPLY_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;endArrow=open;endFill=0;strokeColor=#333333;labelBackgroundColor=#ffffff;align=center;verticalAlign=bottom;fontSize=11;whiteSpace=wrap;"
    SELF_CALL_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#000000;labelBackgroundColor=#ffffff;align=left;verticalAlign=bottom;fontSize=11;whiteSpace=wrap;"

    def add_msg(mid, src_x, tgt_x, y, label, is_reply=False, is_self=False, self_dx=50, self_dy=30):
        style = REPLY_STYLE if is_reply else SYNC_STYLE
        if is_self:
            style = SELF_CALL_STYLE
            geo = {'x': str(src_x), 'y': str(y), 'width': '0', 'height': '0', 'as': 'geometry',
                   'points': [(src_x, y), (src_x + self_dx, y), (src_x + self_dx, y + self_dy), (src_x, y + self_dy)]}
        else:
            geo = {'x': str(src_x), 'y': str(y), 'width': '0', 'height': '0', 'as': 'geometry',
                   'points': [(src_x, y), (tgt_x, y)]}
        add_cell(mid, '1', label, style, edge=True, geo=geo)

    # Sequence Messages
    # 1. Fill details
    add_msg('msg_1', X_ACTOR, X_VIEW, 220,
            "1. Enter contract details<br>(proposalId, totalAmount, terms, expiresAt, milestones)")

    # 2. View validates client-side
    add_msg('msg_2', X_VIEW, X_VIEW, 265,
            "2. Validate form data<br>(Zod schema &amp; required fields)", is_self=True, self_dx=50, self_dy=30)

    # Frame: opt [invalid form data]
    add_cell('opt_frame_data', '1', 'opt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=25;fontSize=11;fillColor=none;strokeColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR - 30), 'y': '310', 'width': str(X_VIEW - X_ACTOR + 70), 'height': '80', 'as': 'geometry'})
    add_cell('opt_lbl_data', '1', '[invalid form data]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR + 40), 'y': '310', 'width': '130', 'height': '25', 'as': 'geometry'})
    add_msg('msg_2_err', X_VIEW, X_ACTOR, 355,
            "2.1. Display form validation error message", is_reply=True)

    # 3. POST /contracts
    add_msg('msg_3', X_VIEW, X_ROUTE, 430,
            "3. POST /api/contracts<br>(CreateContractBodyDTO)")

    # Frame: ref Verify JWT & Check Permission
    add_cell('ref_jwt', '1', 'ref',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=25;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;',
             vertex=True, geo={'x': str(X_ROUTE - 40), 'y': '485', 'width': '240', 'height': '55', 'as': 'geometry'})
    add_cell('ref_jwt_lbl', '1', 'Verify JWT &amp; Check Permission<br>(AuthGuard, CLIENT role required)',
             'text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=10;',
             vertex=True, geo={'x': str(X_ROUTE - 30), 'y': '495', 'width': '220', 'height': '40', 'as': 'geometry'})

    # Frame: opt [unauthorized]
    add_cell('opt_frame_auth', '1', 'opt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=25;fontSize=11;fillColor=none;strokeColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_VIEW - 30), 'y': '555', 'width': str(X_ROUTE - X_VIEW + 60), 'height': '80', 'as': 'geometry'})
    add_cell('opt_lbl_auth', '1', '[unauthorized / 401]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_VIEW + 40), 'y': '555', 'width': '140', 'height': '25', 'as': 'geometry'})
    add_msg('msg_auth_err', X_ROUTE, X_VIEW, 605,
            "3.1. 401 Unauthorized / Redirect to login", is_reply=True)

    # 4. Route -> Controller
    add_msg('msg_4', X_ROUTE, X_CTRL, 670,
            "4. createContract(@UserActive('userId') userId, body)")

    # 5. Controller -> Service
    add_msg('msg_5', X_CTRL, X_SVC, 730,
            "5. createContract(clientId, body)")

    # 6. Service -> Repo
    add_msg('msg_6', X_SVC, X_REPO, 790,
            "6. findProposalWithJob(body.proposalId)")

    # 7. Repo -> DB
    add_msg('msg_7', X_REPO, X_DB, 850,
            "7. prisma.proposal.findUnique({where: {id}, include: {job}})")

    # 8. DB self query
    add_msg('msg_8', X_DB, X_DB, 895,
            "8. SELECT proposal JOIN job<br>WHERE id = proposalId", is_self=True, self_dx=50, self_dy=30)

    # 9-10. Return proposal
    add_msg('msg_9', X_DB, X_REPO, 955,
            "9. Return proposal record with job", is_reply=True)
    add_msg('msg_10', X_REPO, X_SVC, 1000,
            "10. Return proposal with job", is_reply=True)

    # 11. Service validates rules
    add_msg('msg_11', X_SVC, X_SVC, 1050,
            "11. Validate proposal status, ownership,<br>positions, expiresAt &amp; milestones total",
            is_self=True, self_dx=60, self_dy=40)

    # ALT 1: Validation failed vs Valid proposal
    add_cell('alt_frame_valid', '1', 'alt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=25;fontSize=11;fillColor=none;strokeColor=#000000;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR - 40), 'y': '1150', 'width': str(X_DB - X_ACTOR + 80), 'height': '1360', 'as': 'geometry'})
    add_cell('alt_lbl_inv', '1', '[proposal invalid / not owner / positions filled / amount mismatch]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR + 30), 'y': '1150', 'width': '400', 'height': '25', 'as': 'geometry'})

    # 11.1 Failure flow
    add_msg('msg_err_svc_ctrl', X_SVC, X_CTRL, 1200,
            "11.1.1. Throw HttpException<br>(ProposalNotFound 404 / Forbidden 403 / AmountMismatch 400)", is_reply=True)
    add_msg('msg_err_ctrl_rt', X_CTRL, X_ROUTE, 1250,
            "11.1.2. HTTP 4xx Error response", is_reply=True)
    add_msg('msg_err_rt_vw', X_ROUTE, X_VIEW, 1300,
            "11.1.3. Return error response DTO", is_reply=True)
    add_msg('msg_err_vw_act', X_VIEW, X_ACTOR, 1350,
            "11.1.4. Show error toast message<br>(e.g. \"Milestone amounts must equal contract total\")", is_reply=True)

    # ALT 1 Divider
    add_cell('alt_div_1', '1', '',
             'edgeStyle=none;html=1;strokeColor=#666666;dashed=1;dashPattern=8 8;endArrow=none;strokeWidth=1;',
             edge=True, geo={'x': str(X_ACTOR - 40), 'y': '1410', 'width': '0', 'height': '0', 'as': 'geometry',
                             'points': [(X_ACTOR - 40, 1410), (X_DB + 40, 1410)]})
    add_cell('alt_lbl_val_ok', '1', '[proposal is valid &amp; actionable]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#2d7600;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR + 30), 'y': '1415', 'width': '240', 'height': '25', 'as': 'geometry'})

    # 12-15. Check existing contract
    add_msg('msg_12', X_SVC, X_REPO, 1460,
            "12. findContractByProposalId(body.proposalId)")
    add_msg('msg_13', X_REPO, X_DB, 1515,
            "13. prisma.contract.findUnique({where: {proposalId}})")
    add_msg('msg_14', X_DB, X_REPO, 1565,
            "14. Return existing contract or null", is_reply=True)
    add_msg('msg_15', X_REPO, X_SVC, 1610,
            "15. Return existing contract or null", is_reply=True)

    # ALT 2: Existing contract check (409 vs Proceed)
    add_cell('alt_frame_exist', '1', 'alt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=25;fontSize=11;fillColor=none;strokeColor=#4d4d4d;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR - 20), 'y': '1660', 'width': str(X_DB - X_ACTOR + 50), 'height': '830', 'as': 'geometry'})
    add_cell('alt_lbl_exist', '1', '[contract already exists for proposal]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#b85450;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR + 50), 'y': '1660', 'width': '260', 'height': '25', 'as': 'geometry'})

    # 15.1 Conflict flow
    add_msg('msg_err409_svc_ctrl', X_SVC, X_CTRL, 1710,
            "15.1.1. Throw ContractAlreadyExistsException() (409 Conflict)", is_reply=True)
    add_msg('msg_err409_ctrl_rt', X_CTRL, X_ROUTE, 1760,
            "15.1.2. HTTP 409 Conflict", is_reply=True)
    add_msg('msg_err409_rt_vw', X_ROUTE, X_VIEW, 1810,
            "15.1.3. Return 409 Conflict response", is_reply=True)
    add_msg('msg_err409_vw_act', X_VIEW, X_ACTOR, 1860,
            "15.1.4. Show toast \"Contract already exists for this proposal\"", is_reply=True)

    # ALT 2 Divider
    add_cell('alt_div_2', '1', '',
             'edgeStyle=none;html=1;strokeColor=#666666;dashed=1;dashPattern=8 8;endArrow=none;strokeWidth=1;',
             edge=True, geo={'x': str(X_ACTOR - 20), 'y': '1910', 'width': '0', 'height': '0', 'as': 'geometry',
                             'points': [(X_ACTOR - 20, 1910), (X_DB + 30, 1910)]})
    add_cell('alt_lbl_no_exist', '1', '[contract does not exist -> proceed creation in transaction]',
             'text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];strokeColor=none;fillColor=none;fontSize=11;fontColor=#2d7600;fontStyle=1;',
             vertex=True, geo={'x': str(X_ACTOR + 50), 'y': '1915', 'width': '370', 'height': '25', 'as': 'geometry'})

    # 16-25. Proceed creation
    add_msg('msg_16', X_SVC, X_REPO, 1960,
            "16. createContract(body, clientId, proposal.freelancerId, proposal.job.id)")
    add_msg('msg_17', X_REPO, X_REPO, 2015,
            "17. Generate slug, calculate platform fee &amp;<br>begin prisma.$transaction(async tx =&gt; {...})",
            is_self=True, self_dx=60, self_dy=40)
    add_msg('msg_18', X_REPO, X_DB, 2085,
            "18. tx.contract.create({status: AWAITING_PAYMENT, ...})<br>&amp; tx.milestone.createMany({data: milestonesData})")
    add_msg('msg_19', X_DB, X_DB, 2145,
            "19. INSERT INTO contracts &amp;<br>INSERT INTO milestones", is_self=True, self_dx=50, self_dy=35)
    add_msg('msg_20', X_DB, X_REPO, 2215,
            "20. Return created contract &amp; milestones", is_reply=True)
    add_msg('msg_21', X_REPO, X_SVC, 2265,
            "21. Return created contract entity", is_reply=True)
    add_msg('msg_22', X_SVC, X_CTRL, 2315,
            "22. Return contract data", is_reply=True)
    add_msg('msg_23', X_CTRL, X_ROUTE, 2365,
            "23. 201 Created (CreateContractResponseDTO)", is_reply=True)
    add_msg('msg_24', X_ROUTE, X_VIEW, 2415,
            "24. 201 Created with contract slug &amp; details", is_reply=True)
    add_msg('msg_25', X_VIEW, X_ACTOR, 2465,
            "25. Display success toast &amp;<br>redirect to /client/contracts/:slug", is_reply=True)

    return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')

xml_content = generate_uc13_01_xml()
output_path = 'sequence-diagrams-remake/ntin/UC-13.01-create-contract.drawio'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(xml_content)
print(f"Updated {output_path} successfully! Size: {len(xml_content)} bytes")
