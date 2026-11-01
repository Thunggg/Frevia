
$dir = "d:\Documents\Book\Do_an\Frevia\frevia-clone\sequence-diagrams\ptai"

function Make([string]$id, [string]$name, [string]$inner) {
    return "<mxfile host=`"app.diagrams.net`"><diagram id=`"$id`" name=`"$name`"><mxGraphModel dx=`"1422`" dy=`"800`" grid=`"1`" gridSize=`"10`" guides=`"1`" tooltips=`"1`" connect=`"1`" arrows=`"1`" fold=`"1`" page=`"1`" pageScale=`"1`" pageWidth=`"1654`" pageHeight=`"1935`" math=`"0`" shadow=`"0`"><root><mxCell id=`"0`"/><mxCell id=`"1`" parent=`"0`"/>$inner</root></mxGraphModel></diagram></mxfile>"
}
function Actor([string]$label) {
    return "<mxCell id=`"actor`" value=`"$label`" style=`"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"85`" y=`"200`" width=`"30`" height=`"60`" as=`"geometry`"/></mxCell><mxCell id=`"actor_line`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"100`" y=`"282`" as=`"sourcePoint`"/><mxPoint x=`"100`" y=`"1815`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"bar_actor`" value=`"`" style=`"html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"95`" y=`"330`" width=`"10`" height=`"1280`" as=`"geometry`"/></mxCell>"
}
function LL([string]$id, [string]$label, [int]$x, [int]$barY, [int]$barH, [int]$w=160) {
    return "<mxCell id=`"ll_$id`" value=`"$label`" style=`"shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"$x`" y=`"240`" width=`"$w`" height=`"1575`" as=`"geometry`"/></mxCell><mxCell id=`"bar_$id`" value=`"`" style=`"html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;`" vertex=`"1`" parent=`"ll_$id`"><mxGeometry x=`"$([int]($w/2-5))`" y=`"$barY`" width=`"10`" height=`"$barH`" as=`"geometry`"/></mxCell>"
}
function Arr([string]$id, [string]$lbl, [int]$x1,[int]$y1,[int]$x2,[int]$y2,[bool]$ret=$false) {
    $s = if($ret){"html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;"}else{"html=1;verticalAlign=bottom;endArrow=block;"}
    return "<mxCell id=`"$id`" value=`"$lbl`" style=`"$s`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"$x1`" y=`"$y1`" as=`"sourcePoint`"/><mxPoint x=`"$x2`" y=`"$y2`" as=`"targetPoint`"/></mxGeometry></mxCell>"
}
function JwtRef() {
    return "<mxCell id=`"m_rf1`" value=`"ref`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"420`" y=`"420`" width=`"300`" height=`"56`" as=`"geometry`"/></mxCell><mxCell id=`"m_rl1`" value=`"3.1. Verify jwt`" style=`"text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"520`" y=`"433`" width=`"195`" height=`"30`" as=`"geometry`"/></mxCell><mxCell id=`"m_of1`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"10`" y=`"500`" width=`"560`" height=`"145`" as=`"geometry`"/></mxCell><mxCell id=`"m_ol1`" value=`"[invalid token]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"110`" y=`"500`" width=`"130`" height=`"30`" as=`"geometry`"/></mxCell>$(Arr 'jwtErr1' '3.1.1. Return 401 Unauthorized' 510 565 305 565 $true)$(Arr 'jwtErr2' '3.1.2. Show Unauthorized' 295 620 105 620 $true)"
}

# UC-23 uses JobAlertService (not yet impl — pattern mirrors SavedSearch)
# view=225, route=435, ctrl=650, svc=875, repo=1090, prisma=1310
function JALifelines() {
    return (Actor "Freelancer") +
           (LL "view" ":JobAlertView" 225 90 1280) +
           (LL "route" ":JobAlertRoute" 435 150 1165) +
           (LL "ctrl" ":JobAlertController" 650 430 835 175) +
           (LL "svc" ":JobAlertService" 875 490 720) +
           (LL "repo" ":JobAlertRepository" 1090 550 310 175) +
           (LL "prisma" ":PrismaService" 1310 610 175 140)
}

# UC-23.01 View Job Alert List
$uc2301 = (JALifelines) + (JwtRef) +
    (Arr "e0" "1. Navigate to Job Alerts page" 105 330 295 330) +
    (Arr "e1" "2. GET /job-alerts" 305 390 505 390) +
    (Arr "e2" "3. getJobAlerts(userId)" 520 675 737 675) +
    (Arr "e3" "4. getJobAlerts(userId)" 747 735 970 735) +
    (Arr "e4" "5. findAllByUserId(userId)" 980 795 1182 795) +
    (Arr "e5" "6. prisma.jobAlert.findMany({where:{userId}, orderBy:{createdAt:desc}})" 1192 855 1400 855) +
    (Arr "e6" "7. Execute findMany" 1410 915 1510 915) +
    (Arr "e7" "8. Return JobAlert[]" 1510 975 1410 975 $true) +
    (Arr "e8" "9. Return JobAlert[]" 1400 1030 1192 1030 $true) +
    (Arr "e9" "10. Return JobAlert[]" 1182 1085 980 1085 $true) +
    (Arr "e10" "11. Return JobAlert[]" 970 1140 747 1140 $true) +
    (Arr "e11" "12. Return 200 JobAlert[]" 737 1195 520 1195 $true) +
    (Arr "e12" "13. Return 200" 510 1250 305 1250 $true) +
    (Arr "e13" "14. Display job alert list (name, keywords, categories)" 295 1305 105 1305 $true)
Make "uc23-01-view-alert-list" "UC-23.01-View-Job-Alert-List" $uc2301 | Set-Content "$dir\UC-23.01_-_View_Job_Alert_List.drawio" -Encoding UTF8
Write-Host "UC-23.01 done"

# UC-23.02 View Job Alert Detail
$uc2302 = (JALifelines) + (JwtRef) +
    (Arr "e0" "1. Click on a job alert" 105 330 295 330) +
    (Arr "e1" "2. GET /job-alerts/:id" 305 390 505 390) +
    (Arr "e2" "3. getJobAlertDetail(userId, id)" 520 675 737 675) +
    (Arr "e3" "4. getJobAlertDetail(userId, id)" 747 735 970 735) +
    (Arr "e4" "5. findByIdAndUserId(id, userId)" 980 795 1182 795) +
    (Arr "e5" "6. prisma.jobAlert.findFirst({where:{id,userId}})" 1192 855 1400 855) +
    (Arr "e6" "7. Execute findFirst" 1410 915 1510 915) +
    (Arr "e7" "8. Return JobAlert | null" 1510 975 1410 975 $true) +
    "<mxCell id=`"alt`" value=`"alt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"20`" y=`"1010`" width=`"1500`" height=`"450`" as=`"geometry`"/></mxCell><mxCell id=`"alt_lbl0`" value=`"[jobAlert == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1012`" width=`"170`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e8_1' '9.1.1. throw JobAlertNotFoundException()' 1182 1065 980 1065 $true)$(Arr 'e8_2' '9.1.2. Return 404 Not Found' 970 1115 747 1115 $true)$(Arr 'e8_3' '9.1.3. Return 404' 737 1165 520 1165 $true)$(Arr 'e8_4' '9.1.4. Return 404' 510 1215 305 1215 $true)$(Arr 'e8_5' '9.1.5. Show Not Found' 295 1265 105 1265 $true)" +
    "<mxCell id=`"alt_div`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"20`" y=`"1300`" as=`"sourcePoint`"/><mxPoint x=`"1520`" y=`"1300`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"alt_lbl1`" value=`"[jobAlert found]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1302`" width=`"170`" height=`"28`" as=`"geometry`"/></mxCell>" +
    (Arr "e9_1" "9.2.1. Return JobAlert" 1182 1360 980 1360 $true) +
    (Arr "e9_2" "9.2.2. Return JobAlert" 970 1415 747 1415 $true) +
    (Arr "e9_3" "9.2.3. Return 200 JobAlert" 737 1465 520 1465 $true) +
    (Arr "e9_4" "9.2.4. Return 200" 510 1515 305 1515 $true) +
    (Arr "e9_5" "9.2.5. Display job alert detail" 295 1565 105 1565 $true)
Make "uc23-02-view-alert-detail" "UC-23.02-View-Job-Alert-Detail" $uc2302 | Set-Content "$dir\UC-23.02_-_View_Job_Alert_Detail.drawio" -Encoding UTF8
Write-Host "UC-23.02 done"

# UC-23.03 Create Job Alert
$uc2303 = (JALifelines) + (JwtRef) +
    (Arr "e0" "1. Click Create Job Alert" 105 330 295 330) +
    (Arr "e1" "2. POST /job-alerts {name, keywords, categories, frequency}" 305 390 505 390) +
    (Arr "e2" "3. createJobAlert(userId, body)" 520 675 737 675) +
    (Arr "e3" "4. createJobAlert(userId, body)" 747 735 970 735) +
    (Arr "e4" "5. create(userId, data)" 980 795 1182 795) +
    (Arr "e5" "6. prisma.jobAlert.create({data:{userId, name, keywords, categories, frequency}})" 1192 855 1400 855) +
    (Arr "e6" "7. Execute create" 1410 915 1510 915) +
    (Arr "e7" "8. Return JobAlert" 1510 975 1410 975 $true) +
    (Arr "e8" "9. Return JobAlert" 1400 1030 1192 1030 $true) +
    (Arr "e9" "10. Return JobAlert" 1182 1085 980 1085 $true) +
    (Arr "e10" "11. Return JobAlert" 970 1140 747 1140 $true) +
    (Arr "e11" "12. Return 201 JobAlert" 737 1195 520 1195 $true) +
    (Arr "e12" "13. Return 201" 510 1250 305 1250 $true) +
    (Arr "e13" "14. Show Job alert created successfully" 295 1305 105 1305 $true)
Make "uc23-03-create-alert" "UC-23.03-Create-Job-Alert" $uc2303 | Set-Content "$dir\UC-23.03_-_Create_Job_Alert.drawio" -Encoding UTF8
Write-Host "UC-23.03 done"

# UC-23.04 Update Job Alert
$uc2304 = (JALifelines) + (JwtRef) +
    (Arr "e0" "1. Click Edit on a job alert" 105 330 295 330) +
    (Arr "e1" "2. PATCH /job-alerts/:id {name, keywords, categories, frequency}" 305 390 505 390) +
    (Arr "e2" "3. updateJobAlert(userId, id, body)" 520 675 737 675) +
    (Arr "e3" "4. updateJobAlert(userId, id, body)" 747 735 970 735) +
    (Arr "e4" "5. update(id, userId, data)" 980 795 1182 795) +
    (Arr "e5" "6. prisma.jobAlert.findFirst({where:{id,userId}}) — verify ownership" 1192 855 1400 855) +
    (Arr "e6" "7. Execute findFirst" 1410 915 1510 915) +
    (Arr "e7" "8. Return alert | null" 1510 975 1410 975 $true) +
    "<mxCell id=`"opt_nf`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1060`" y=`"1000`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_nf_lbl`" value=`"[alert == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1165`" y=`"1002`" width=`"140`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_nf' '9.1. throw JobAlertNotFoundException()' 1400 1050 1192 1050 $true)" +
    (Arr "e8" "9. prisma.jobAlert.update({where:{id,userId}, data:{name,keywords,categories,frequency}})" 1192 1110 1400 1110) +
    (Arr "e9" "10. Execute update" 1410 1170 1510 1170) +
    (Arr "e10" "11. Return updated JobAlert" 1510 1230 1410 1230 $true) +
    (Arr "e11" "12. Return updated JobAlert" 1400 1285 1182 1285 $true) +
    (Arr "e12" "13. Return updated JobAlert" 1182 1340 980 1340 $true) +
    (Arr "e13" "14. Return updated JobAlert" 970 1395 747 1395 $true) +
    (Arr "e14" "15. Return 200" 737 1450 520 1450 $true) +
    (Arr "e15" "16. Return 200" 510 1505 305 1505 $true) +
    (Arr "e16" "17. Show Job alert updated" 295 1560 105 1560 $true)
Make "uc23-04-update-alert" "UC-23.04-Update-Job-Alert" $uc2304 | Set-Content "$dir\UC-23.04_-_Update_Job_Alert.drawio" -Encoding UTF8
Write-Host "UC-23.04 done"

# UC-23.05 Delete Job Alert
$uc2305 = (JALifelines) + (JwtRef) +
    (Arr "e0" "1. Click Delete Job Alert" 105 330 295 330) +
    (Arr "e1" "2. DELETE /job-alerts/:id" 305 390 505 390) +
    (Arr "e2" "3. deleteJobAlert(userId, id)" 520 675 737 675) +
    (Arr "e3" "4. deleteJobAlert(userId, id)" 747 735 970 735) +
    (Arr "e4" "5. delete(id, userId)" 980 795 1182 795) +
    (Arr "e5" "6. prisma.jobAlert.deleteMany({where:{id,userId}})" 1192 855 1400 855) +
    (Arr "e6" "7. Execute deleteMany" 1410 915 1510 915) +
    (Arr "e7" "8. Return {count}" 1510 975 1410 975 $true) +
    (Arr "e8" "9. Return count > 0 (boolean)" 1400 1030 1192 1030 $true) +
    "<mxCell id=`"alt`" value=`"alt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"20`" y=`"1065`" width=`"1500`" height=`"430`" as=`"geometry`"/></mxCell><mxCell id=`"alt_lbl0`" value=`"[deleted == false]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1067`" width=`"180`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e9_1' '10.1.1. throw JobAlertNotFoundException()' 1182 1120 980 1120 $true)$(Arr 'e9_2' '10.1.2. Return 404' 970 1170 747 1170 $true)$(Arr 'e9_3' '10.1.3. Return 404' 737 1220 520 1220 $true)$(Arr 'e9_4' '10.1.4. Show Not Found' 295 1270 105 1270 $true)" +
    "<mxCell id=`"alt_div`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"20`" y=`"1305`" as=`"sourcePoint`"/><mxPoint x=`"1520`" y=`"1305`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"alt_lbl1`" value=`"[deleted == true]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1307`" width=`"180`" height=`"28`" as=`"geometry`"/></mxCell>" +
    (Arr "e10_1" "10.2.1. Return void" 1182 1360 980 1360 $true) +
    (Arr "e10_2" "10.2.2. Return 200" 970 1415 747 1415 $true) +
    (Arr "e10_3" "10.2.3. Return 200" 737 1465 520 1465 $true) +
    (Arr "e10_4" "10.2.4. Return 200" 510 1515 305 1515 $true) +
    (Arr "e10_5" "10.2.5. Show Job alert deleted" 295 1565 105 1565 $true)
Make "uc23-05-delete-alert" "UC-23.05-Delete-Job-Alert" $uc2305 | Set-Content "$dir\UC-23.05_-_Delete_Job_Alert.drawio" -Encoding UTF8
Write-Host "UC-23.05 done"
Write-Host "All UC-23 done!"
