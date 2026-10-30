
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

# ============================================================
# Lifelines for UC-12 Bookmark (uses ManageJobService/Repo)
# Freelancer actor
# ============================================================
function BookmarkLifelines() {
    return (Actor "Freelancer") +
           (LL "view" ":ManageJobView" 225 90 1280) +
           (LL "route" ":ManageJobRoute" 435 150 1165) +
           (LL "ctrl" ":ManageJobController" 650 430 835 175) +
           (LL "svc" ":ManageJobService" 875 490 720) +
           (LL "repo" ":ManageJobRepository" 1085 550 310 175) +
           (LL "prisma" ":PrismaService" 1310 610 175 140)
}

# UC-12.01 View Bookmarked Job List
$uc1201 = (BookmarkLifelines) + (JwtRef) +
    (Arr "e0" "1. Navigate to Bookmarks page" 105 330 295 330) +
    (Arr "e1" "2. GET /manage-jobs/bookmarks?page&limit" 305 390 505 390) +
    (Arr "e2" "3. viewBookmarkedJob(userId, roleName, query)" 520 675 732 675) +
    (Arr "e3" "4. viewBookmarkedJob(userId, roleName, filter)" 742 735 962 735) +
    "<mxCell id=`"opt_role`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"500`" y=`"765`" width=`"590`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_role_lbl`" value=`"[roleName != FREELANCER]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"600`" y=`"767`" width=`"200`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_role_err' '4.1. throw BookmarkJobOnlyForFreelancerException()' 962 810 742 810 $true)" +
    (Arr "e4" "5. assertFreelancerRole(roleName)" 952 865 952 865) +
    (Arr "e5" "6. getBookmarkedJobLists(userId, filter)" 962 920 1172 920) +
    (Arr "e6" "7. prisma.transaction([jobBookmark.findMany({where:{userId, job:{deletedAt:null,status:OPEN}}}, select:{job:{...}}, skip, take), jobBookmark.count(where)])" 1182 980 1400 980) +
    (Arr "e7" "8. Execute transaction" 1410 1040 1510 1040) +
    (Arr "e8" "9. Return [bookmarks, total]" 1510 1100 1410 1100 $true) +
    (Arr "e9" "10. Return {jobs, total}" 1400 1155 1182 1155 $true) +
    (Arr "e10" "11. Return {data, pagination}" 1172 1210 962 1210 $true) +
    (Arr "e11" "12. Return {data, pagination}" 952 1265 742 1265 $true) +
    (Arr "e12" "13. Return {data, pagination}" 730 1320 520 1320 $true) +
    (Arr "e13" "14. Return {data, pagination}" 510 1375 305 1375 $true) +
    (Arr "e14" "15. Display bookmarked job list with pagination" 295 1430 105 1430 $true)
Make "uc12-01-view-bookmarked-list" "UC-12.01-View-Bookmarked-Job-List" $uc1201 | Set-Content "$dir\UC-12.01_-_View_Bookmarked_Job_List.drawio" -Encoding UTF8
Write-Host "UC-12.01 done"

# UC-12.02 Bookmark Job
$uc1202 = (BookmarkLifelines) + (JwtRef) +
    (Arr "e0" "1. Click Bookmark on a job" 105 330 295 330) +
    (Arr "e1" "2. POST /manage-jobs/jobs/:slug/bookmark" 305 390 505 390) +
    (Arr "e2" "3. bookmarkJob(userId, roleName, slug)" 520 675 732 675) +
    (Arr "e3" "4. bookmarkJob(userId, roleName, slug)" 742 735 962 735) +
    (Arr "e4" "5. assertFreelancerRole(roleName)" 952 790 952 790) +
    (Arr "e5" "6. findJobBySlug(slug) — job.findFirst({slug,status:OPEN,deletedAt:null})" 962 845 1172 845) +
    (Arr "e6" "7. Execute findFirst" 1182 905 1400 905) +
    (Arr "e7" "8. Return job | null" 1400 960 1182 960 $true) +
    "<mxCell id=`"opt_notfound`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"930`" y=`"985`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_notfound_lbl`" value=`"[job == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1030`" y=`"987`" width=`"140`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_nf' '9.1. throw JobNotFoundException()' 1172 1035 962 1035 $true)" +
    (Arr "e8" "9. findBookmark(userId, job.id) — jobBookmark.findUnique" 962 1090 1172 1090) +
    (Arr "e9" "10. Return bookmark | null" 1172 1150 962 1150 $true) +
    "<mxCell id=`"opt_dup`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"930`" y=`"1175`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_dup_lbl`" value=`"[bookmark already exists]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1030`" y=`"1177`" width=`"200`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_dup' '10.1. throw JobAlreadyBookmarkedException()' 1172 1225 962 1225 $true)" +
    (Arr "e10" "11. bookmarkJob(userId, job.id) — jobBookmark.create({userId, jobId})" 962 1280 1172 1280) +
    (Arr "e11" "12. Execute create" 1182 1340 1400 1340) +
    (Arr "e12" "13. Return created bookmark" 1400 1400 1182 1400 $true) +
    (Arr "e13" "14. Return void" 1172 1455 962 1455 $true) +
    (Arr "e14" "15. Return 201" 952 1510 742 1510 $true) +
    (Arr "e15" "16. Return 201" 730 1560 520 1560 $true) +
    (Arr "e16" "17. Return 201" 510 1610 305 1610 $true) +
    (Arr "e17" "18. Show Job bookmarked" 295 1660 105 1660 $true)
Make "uc12-02-bookmark-job" "UC-12.02-Bookmark-Job" $uc1202 | Set-Content "$dir\UC-12.02_-_Bookmark_Job.drawio" -Encoding UTF8
Write-Host "UC-12.02 done"

# UC-12.03 Remove Bookmark
$uc1203 = (BookmarkLifelines) + (JwtRef) +
    (Arr "e0" "1. Click Remove Bookmark" 105 330 295 330) +
    (Arr "e1" "2. DELETE /manage-jobs/bookmarks/:slug" 305 390 505 390) +
    (Arr "e2" "3. removeBookmark(userId, slug)" 520 675 732 675) +
    (Arr "e3" "4. removeBookmark(userId, slug)" 742 735 962 735) +
    (Arr "e4" "5. findJobBySlug(slug)" 962 795 1172 795) +
    (Arr "e5" "6. Execute findFirst query" 1182 855 1400 855) +
    (Arr "e6" "7. Return job | null" 1400 910 1182 910 $true) +
    "<mxCell id=`"opt_nf`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"930`" y=`"935`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_nf_lbl`" value=`"[job == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1030`" y=`"937`" width=`"140`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_nf' '8.1. throw JobNotFoundException()' 1172 985 962 985 $true)" +
    (Arr "e7" "8. findBookmark(userId, job.id)" 962 1040 1172 1040) +
    (Arr "e8" "9. Return bookmark | null" 1172 1100 962 1100 $true) +
    "<mxCell id=`"opt_nb`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"930`" y=`"1125`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_nb_lbl`" value=`"[bookmark == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1030`" y=`"1127`" width=`"160`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_nb' '9.1. throw BookmarkNotFoundException()' 1172 1175 962 1175 $true)" +
    (Arr "e9" "10. removeBookmark(userId, job.id) — jobBookmark.delete({userId_jobId})" 962 1230 1172 1230) +
    (Arr "e10" "11. Execute delete" 1182 1290 1400 1290) +
    (Arr "e11" "12. Return deleted bookmark" 1400 1350 1182 1350 $true) +
    (Arr "e12" "13. Return void" 1172 1405 962 1405 $true) +
    (Arr "e13" "14. Return 200" 952 1460 742 1460 $true) +
    (Arr "e14" "15. Return 200" 730 1510 520 1510 $true) +
    (Arr "e15" "16. Return 200" 510 1560 305 1560 $true) +
    (Arr "e16" "17. Show Bookmark removed" 295 1610 105 1610 $true)
Make "uc12-03-remove-bookmark" "UC-12.03-Remove-Bookmark" $uc1203 | Set-Content "$dir\UC-12.03_-_Remove_Bookmark.drawio" -Encoding UTF8
Write-Host "UC-12.03 done"

Write-Host "All UC-12 done!"
