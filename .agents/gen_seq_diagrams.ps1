
$dir = "d:\Documents\Book\Do_an\Frevia\frevia-clone\sequence-diagrams\ptai"

function Make([string]$id, [string]$name, [string]$inner) {
    return @"
<mxfile host="app.diagrams.net"><diagram id="$id" name="$name"><mxGraphModel dx="1422" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1935" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>$inner</root></mxGraphModel></diagram></mxfile>
"@
}

function MJBase([string]$actorLabel) {
    return @"
<mxCell id="actor" value="$actorLabel" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;" vertex="1" parent="1"><mxGeometry x="85" y="200" width="30" height="60" as="geometry"/></mxCell>
<mxCell id="actor_line" value="" style="endArrow=none;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="100" y="282" as="sourcePoint"/><mxPoint x="100" y="1815" as="targetPoint"/></mxGeometry></mxCell>
<mxCell id="bar_actor_0" value="" style="html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;" vertex="1" parent="1"><mxGeometry x="95" y="330" width="10" height="1280" as="geometry"/></mxCell>
"@
}

function Lifeline([string]$id, [string]$label, [int]$x, [int]$barY, [int]$barH) {
    $w = 160
    return @"
<mxCell id="ll_$id" value="$label" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;" vertex="1" parent="1"><mxGeometry x="$x" y="240" width="$w" height="1575" as="geometry"/></mxCell>
<mxCell id="bar_$id" value="" style="html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;" vertex="1" parent="ll_$id"><mxGeometry x="75" y="$barY" width="10" height="$barH" as="geometry"/></mxCell>
"@
}

function JwtRef() {
    return @"
<mxCell id="m_rf1" value="ref" style="shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;" vertex="1" parent="1"><mxGeometry x="420" y="420" width="300" height="56" as="geometry"/></mxCell>
<mxCell id="m_rl1" value="3.1. Verify jwt" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;" vertex="1" parent="1"><mxGeometry x="520" y="433" width="195" height="30" as="geometry"/></mxCell>
<mxCell id="m_of1" value="opt" style="shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;" vertex="1" parent="1"><mxGeometry x="10" y="500" width="560" height="145" as="geometry"/></mxCell>
<mxCell id="m_ol1" value="[invalid token]" style="text;html=1;align=left;fontSize=12;" vertex="1" parent="1"><mxGeometry x="110" y="500" width="130" height="30" as="geometry"/></mxCell>
<mxCell id="m_e_jwt1" value="3.1.1. Return 401 Unauthorized" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="510" y="565" as="sourcePoint"/><mxPoint x="305" y="565" as="targetPoint"/></mxGeometry></mxCell>
<mxCell id="m_e_jwt2" value="3.1.2. Show Unauthorized" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="295" y="620" as="sourcePoint"/><mxPoint x="105" y="620" as="targetPoint"/></mxGeometry></mxCell>
"@
}

function Arrow([string]$id, [string]$label, [int]$x1, [int]$y1, [int]$x2, [int]$y2, [bool]$ret=$false) {
    $style = if ($ret) { "html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;" } else { "html=1;verticalAlign=bottom;endArrow=block;" }
    return @"
<mxCell id="$id" value="$label" style="$style" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="$x1" y="$y1" as="sourcePoint"/><mxPoint x="$x2" y="$y2" as="targetPoint"/></mxGeometry></mxCell>
"@
}

# ============================================================
# Shared lifelines for Manage-Job UCs
# view=225, route=435, ctrl=650, svc=880, repo=1090, prisma=1325
# ============================================================
function MJLifelines() {
    return (Lifeline "view" ":ManageJobView" 225 90 1280) +
           (Lifeline "route" ":ManageJobRoute" 435 150 1165) +
           (Lifeline "ctrl" ":ManageJobController" 650 430 835) +
           (Lifeline "svc" ":ManageJobService" 880 490 720) +
           (Lifeline "repo" ":ManageJobRepository" 1090 550 310) +
           (Lifeline "prisma" ":PrismaService" 1325 610 175)
}

# ============================================================
# UC-11.03 Publish Job
# ============================================================
$uc1103 = (MJBase "Client") + (MJLifelines) + (JwtRef) + @"
$(Arrow "e0" "1. Click Publish" 105 330 295 330)
$(Arrow "e1" "2. PATCH /manage-jobs/:id/status {status: OPEN}" 305 390 505 390)
$(Arrow "e2" "3. changeJobStatus(id, userId, body)" 520 675 732 675)
$(Arrow "e3" "4. changeJobStatus(userId, id, body)" 742 735 962 735)
$(Arrow "e4" "5. changeJobStatus(userId, jobId, status)" 972 795 1172 795)
$(Arrow "e5" "6. checkJobOwner() — job.findFirst(id, clientId, deletedAt:null)" 1182 855 1395 855)
$(Arrow "e6" "7. Execute query" 1405 915 1520 915)
$(Arrow "e7" "8. Return job | null" 1520 975 1405 975 $true)
$(Arrow "e8" "9. prisma.job.update({data:{status}})" 1182 1050 1395 1050)
$(Arrow "e9" "10. Execute update" 1405 1110 1520 1110)
$(Arrow "e10" "11. Return updated job" 1520 1170 1405 1170 $true)
$(Arrow "e11" "12. Return normalizeJob(job)" 1395 1230 1182 1230 $true)
$(Arrow "e12" "13. embeddingOutbox(UPSERT/DELETE, JOB, id)" 962 1285 962 1285)
$(Arrow "e13" "14. Return updated job" 1172 1335 962 1335 $true)
$(Arrow "e14" "15. Return 200 updated job" 952 1395 742 1395 $true)
$(Arrow "e15" "16. Return 200" 730 1450 520 1450 $true)
$(Arrow "e16" "17. Return 200" 510 1505 305 1505 $true)
$(Arrow "e17" "18. Show Job published successfully" 295 1560 105 1560 $true)
"@
Make "uc11-03-publish-job" "UC-11.03-Publish-Job" $uc1103 | Set-Content "$dir\UC-11.03_-_Publish_Job.drawio" -Encoding UTF8
Write-Host "UC-11.03 done"

# ============================================================
# UC-11.04 Update Job
# ============================================================
$uc1104 = (MJBase "Client") + (MJLifelines) + (JwtRef) + @"
$(Arrow "e0" "1. Edit job form" 105 330 295 330)
$(Arrow "e1" "2. PATCH /manage-jobs/:id {title,description,budget,skills,categories,deadline}" 305 390 505 390)
$(Arrow "e2" "3. updateJob(id, userId, body)" 520 675 732 675)
$(Arrow "e3" "4. updateJob(userId, id, body)" 742 735 962 735)
$(Arrow "e4" "5. updateJob(userId, jobId, data)" 972 795 1172 795)
$(Arrow "e5" "6. checkJobOwner(userId, jobId)" 1182 855 1395 855)
$(Arrow "e6" "7. Execute owner check" 1405 915 1520 915)
$(Arrow "e7" "8. Return job | null" 1520 975 1405 975 $true)
$(Arrow "e8" "9. prisma.transaction(assertCategories, findUniqueOrThrow, update, deleteSkills, deleteCategories, replaceSkills, replaceCategories, findUniqueOrThrow)" 1182 1040 1395 1040)
$(Arrow "e9" "10. Execute transaction" 1405 1110 1520 1110)
$(Arrow "e10" "11. Return updated job" 1520 1170 1405 1170 $true)
$(Arrow "e11" "12. Return normalizeJob(updatedJob)" 1395 1230 1182 1230 $true)
$(Arrow "e12" "13. embeddingOutbox(UPSERT, JOB, id)" 962 1285 962 1285)
$(Arrow "e13" "14. Return updated job" 1172 1335 962 1335 $true)
$(Arrow "e14" "15. Return 200" 952 1390 742 1390 $true)
$(Arrow "e15" "16. Return 200" 730 1445 520 1445 $true)
$(Arrow "e16" "17. Return 200" 510 1500 305 1500 $true)
$(Arrow "e17" "18. Show Job updated successfully" 295 1555 105 1555 $true)
"@
Make "uc11-04-update-job" "UC-11.04-Update-Job" $uc1104 | Set-Content "$dir\UC-11.04_-_Update_Job.drawio" -Encoding UTF8
Write-Host "UC-11.04 done"

# ============================================================
# UC-11.05 Delete Job
# ============================================================
$uc1105 = (MJBase "Client") + (MJLifelines) + (JwtRef) + @"
$(Arrow "e0" "1. Click Delete Job" 105 330 295 330)
$(Arrow "e1" "2. DELETE /manage-jobs/:id" 305 390 505 390)
$(Arrow "e2" "3. deleteJob(id, userId)" 520 675 732 675)
$(Arrow "e3" "4. deleteJob(userId, id)" 742 735 962 735)
$(Arrow "e4" "5. deleteJob(userId, jobId)" 972 795 1172 795)
$(Arrow "e5" "6. checkJobOwner(userId, jobId)" 1182 855 1395 855)
$(Arrow "e6" "7. Execute findFirst query" 1405 915 1520 915)
$(Arrow "e7" "8. Return job | null" 1520 975 1405 975 $true)
$(Arrow "e8" "9. prisma.job.update({data:{deletedAt: new Date()}})" 1182 1050 1395 1050)
$(Arrow "e9" "10. Execute soft-delete" 1405 1110 1520 1110)
$(Arrow "e10" "11. Return void" 1520 1170 1405 1170 $true)
$(Arrow "e11" "12. Return void" 1395 1225 1182 1225 $true)
$(Arrow "e12" "13. embeddingOutbox(DELETE, JOB, jobId)" 962 1280 962 1280)
$(Arrow "e13" "14. Return void" 1172 1330 962 1330 $true)
$(Arrow "e14" "15. Return 200" 952 1385 742 1385 $true)
$(Arrow "e15" "16. Return 200" 730 1440 520 1440 $true)
$(Arrow "e16" "17. Return 200" 510 1495 305 1495 $true)
$(Arrow "e17" "18. Show Job deleted successfully" 295 1550 105 1550 $true)
"@
Make "uc11-05-delete-job" "UC-11.05-Delete-Job" $uc1105 | Set-Content "$dir\UC-11.05_-_Delete_Job.drawio" -Encoding UTF8
Write-Host "UC-11.05 done"

# ============================================================
# UC-11.06 Change Job Status
# ============================================================
$uc1106 = (MJBase "Client") + (MJLifelines) + (JwtRef) + @"
$(Arrow "e0" "1. Select new status from dropdown" 105 330 295 330)
$(Arrow "e1" "2. PATCH /manage-jobs/:id/status {status}" 305 390 505 390)
$(Arrow "e2" "3. changeJobStatus(id, userId, body)" 520 675 732 675)
$(Arrow "e3" "4. changeJobStatus(userId, id, body)" 742 735 962 735)
$(Arrow "e4" "5. changeJobStatus(userId, jobId, status)" 972 795 1172 795)
$(Arrow "e5" "6. checkJobOwner(userId, jobId)" 1182 855 1395 855)
$(Arrow "e6" "7. Execute owner check" 1405 915 1520 915)
$(Arrow "e7" "8. Return job | null" 1520 975 1405 975 $true)
$(Arrow "e8" "9. prisma.job.update({data:{status}})" 1182 1050 1395 1050)
$(Arrow "e9" "10. Execute update" 1405 1110 1520 1110)
$(Arrow "e10" "11. Return updated job" 1520 1170 1405 1170 $true)
$(Arrow "e11" "12. Return normalizeJob(job)" 1395 1230 1182 1230 $true)
$(Arrow "e12" "13. embeddingOutbox(UPSERT if OPEN else DELETE, JOB, id)" 962 1285 962 1285)
$(Arrow "e13" "14. Return updated job" 1172 1335 962 1335 $true)
$(Arrow "e14" "15. Return 200" 952 1390 742 1390 $true)
$(Arrow "e15" "16. Return 200" 730 1445 520 1445 $true)
$(Arrow "e16" "17. Return 200" 510 1500 305 1500 $true)
$(Arrow "e17" "18. Show Status updated" 295 1555 105 1555 $true)
"@
Make "uc11-06-change-status" "UC-11.06-Change-Job-Status" $uc1106 | Set-Content "$dir\UC-11.06_-_Change_Job_Status.drawio" -Encoding UTF8
Write-Host "UC-11.06 done"

Write-Host "All UC-11 done!"
