const fs=require('node:fs');
const path=require('node:path');
const cases=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const esc=s=>String(s).replace(/[&%_#$]/g,c=>'\\'+c);
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
const methodMeaning={
 findFreelancerProfileById:'Retrieve the freelancer profile and account roles; reject a missing or non-freelancer account',
 viewProfile:'Retrieve the public freelancer profile',
 updateFreelancerProfile:'Update the owned profile and its professional fields; recalculate completion strength in the transaction',
 findSkillsByProfileId:'Load active catalog skills attached to the freelancer, sorted by name',
 findOrCreateCatalogSkill:'Find the active catalog skill by trimmed name, ignoring case; create a unique catalog entry if absent',
 findSkillByProfileIdAndSkillId:'Check whether this freelancer already has the selected catalog skill',
 addSkillToProfile:'Create the freelancer-skill association with its proficiency level',
 findSkillById:'Retrieve the skill association and its owner',
 deleteSkill:'Delete the freelancer-skill association while retaining the catalog skill',
 findPortfoliosByFreelancerProfileId:'Retrieve non-deleted portfolio items, newest first',
 addPortfolioToProfile:'Create the portfolio item and create the role profile if required within the transaction',
 findPortfolioById:'Retrieve a non-deleted portfolio item',
 findPortfolioWithProfile:'Retrieve the portfolio item and its owning profile',
 updatePortfolio:'Update the provided portfolio fields',
 deletePortfolio:'Mark the portfolio item deleted without physically removing it',
 findUserWithRoles:'Retrieve the active account, profile and assigned roles for authorization',
 createIdentityDocument:'Store the document metadata with initial PENDING status',
 findIdentityDocuments:'Retrieve the user identity documents in descending creation order',
 findApprovedIdentityDocumentByIdentityNumber:'Check whether another user already has an approved document with the same normalized identity number',
 createIdentityAiDocument:'Store the AI verification result, document metadata, review notes and diagnostic summaries',
 findClientProfile:'Retrieve the public client profile and social links',
 updateClientProfile:'Update company information and recalculate profile strength in a transaction',
 findSocialLinks:'Retrieve the current profile social links ordered by platform',
 findSocialLinkByPlatform:'Check for an existing social link using the selected platform',
 createSocialLink:'Create the social link on the current user profile',
 findSocialLinkById:'Retrieve the social link and profile owner',
 deleteSocialLink:'Delete the authorized social link',
 findFavorites:'Retrieve favorite freelancers and their profiles, newest favorites first',
 findFavorite:'Check the favorite relationship using the client/freelancer composite key',
 createFavorite:'Save the favorite relationship',
 deleteFavorite:'Remove only the selected favorite relationship',
 findFollowing:'Retrieve followed freelancers, excluding deleted or banned target accounts',
 findFollow:'Check the follow relationship using the client/freelancer composite key',
 createFollowWithNotification:'Save the follow relationship and notify the freelancer in one transaction',
 deleteFollow:'Remove the follow relationship',
 switchPrimaryRole:'Verify the existing target role assignment and make it primary atomically',
 joinRole:'Check the target role, create the corresponding role profile if needed and assign it as primary in one transaction',
 findContract:'Retrieve the non-deleted contract and its participants',
 findManyByContract:'Retrieve non-deleted reviews for the contract in descending creation order',
 findByContractAndReviewer:'Check whether the current participant has already reviewed this contract, including a previously deleted review',
 findResponseByReview:'Check the response record, including a previously soft-deleted response',
 findResponseById:'Retrieve the non-deleted response and its author',
 createResponse:'Create or restore the response and notify the reviewer in the same transaction',
 updateResponse:'Save the response author changes',
 softDeleteResponse:'Mark the response deleted',
 findGeneralProfile:'Retrieve the current account profile, email and assigned roles',
 updateGeneralProfile:'Save display name and biography, recalculating completion strength for supported primary roles',
 findPasswordCredential:'Retrieve the current password hash and confirm that the profile exists',
 updatePassword:'Replace the stored credential with the newly hashed password',
 updateAvatar:'Save the avatar URL and return the updated profile timestamp',
 syncLowStrengthProfiles:'Synchronize low-strength active profiles that have no revision for their role type',
 findMany:'Retrieve matching profile revision records and total count for pagination',
 hasPendingRevision:'Check whether this expert already has a PENDING update request',
 updateCv:'Save the new CV metadata and upload timestamp on the freelancer profile',
 clearCv:'Clear CV URL, filename, storage identifier and upload time',
};
function businessOperation(s) {
 const names=[...s.matchAll(/\b([a-zA-Z]\w*)\(/g)].map(x=>x[1]);
 for(const name of names)if(methodMeaning[name])return methodMeaning[name]+'.';
 return s;
}
const screenFor=c=>{
 const g=Number(c.id.slice(3,5));
 if(c.id.startsWith('UC-07.0')&&c.sprint===5)return ['Freelancer CV settings','PDF selector, current CV filename/link, Replace and Delete actions; upload progress and error message.'];
 if(g===7)return ['Freelancer public profile and edit dialog','Display name, title, biography, availability, education, certifications and languages; Save and request-review state.'];
 if(g===8)return ['Freelancer skills section','Skill catalog picker, proficiency selector, skill list and delete confirmation.'];
 if(g===9)return ['Freelancer portfolio section','Portfolio cards/detail, title, description, technologies, project URL and create/edit/delete controls.'];
 if(g===18)return ['Identity verification settings','Document type, document images/PDF; AI flow has front/back, selfie and liveness capture; latest status and review notes.'];
 if(g===19)return ['Client profile / company settings','Company name, description and website; profile display and update confirmation.'];
 if(g===20)return ['Account social-link settings','Platform selector, URL input, existing links and remove action.'];
 if(g===21)return ['Favorite freelancers list / freelancer profile','Freelancer cards, favorite state and remove action; empty list and error state.'];
 if(g===29)return ['Following freelancers list / freelancer profile','Freelancer cards, Follow/Unfollow actions and following state.'];
 if(g===30)return ['Notification page and notification menu','Notification title/message/time, read state, mark one/all read and delete controls.'];
 if(g===31)return ['Account role selector','Assigned CLIENT/FREELANCER roles, Join New Role action, pending/error state and destination workspace.'];
 if(g===39||g===40)return ['Contract reviews panel','Rating, breakdown, comment, reviewer/reviewee information and response text; author-dependent edit/delete controls.'];
 if(g===41)return ['General account settings','Display name, biography, email, role summary, avatar upload and current/new password fields.'];
 if(c.id==='UC-47.06')return ['Expert profile editor','Display name, title, biography, expertise, years of experience, education, certifications, website and pending-review state.'];
 return ['Administrator profile request list/detail','Search, status/type filters, pagination, current/proposed values, profile strength, review notes and Approve/Reject controls.'];
};
for(let sprint=1;sprint<=5;sprint++) {
 const list=cases.filter(c=>c.sprint===sprint);
 const sp=`docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Subsections/sprint${sprint}/nhuy.tex`;
 const fp=`docs/Report 3/sections/4.Subsections/sprint${sprint}/nhuy.tex`;
 let a=fs.readFileSync(sp,'utf8'),b=fs.readFileSync(fp,'utf8');
 for(const c of list) {
  for(const op of c.operations){const old=esc(op),next=esc(businessOperation(op));a=a.split(old).join(next);b=b.split(old).join(next);}
  const [screen,controls]=screenFor(c);
  const endpoint=`\\textbf{Interface/API mapping:} ${esc(c.endpoint)}`;
  b=b.replace(endpoint,`\\textbf{Screen layout and controls:} ${esc(screen)}. ${esc(controls)} These controls describe the implemented screen structure; they are not a captured execution screenshot.\n\n${endpoint}`);
 }
 write(sp,a);write(fp,b);
}
// Additional screen/authorization requirements, without altering other authors' tables.
let overview='\\subsubsection{Account and Profile Screen Requirements -- Nguyen Lu Nhat Huy}\n\\begin{longtable}{|L{2.3cm}|L{3.2cm}|L{8.4cm}|}\\hline\nScope & Actor / Access & Screen information and controls \\\\ \\hline\n';
const seen=new Set();for(const c of cases){const [screen,controls]=screenFor(c);if(seen.has(screen))continue;seen.add(screen);overview+=`${esc(screen)} & ${esc(c.auth?c.actor+'; JWT and endpoint permission':'Public read')} & ${esc(controls)} \\\\ \\hline\n`;}
overview+='\\end{longtable}\nProfile ownership, contract participation and review authorship remain server-side checks even when UI controls are hidden. Expert is an additional authenticated actor for expert profile editing. Administrators need permission for the administrative revision endpoints.\n';
write('docs/Report 3/sections/4.Subsections/nhuy-screen-overview.tex',overview);
let target='docs/Report 3/sections/4.Subsections/4.1.System_Functional_Overview.tex';let text=fs.readFileSync(target,'utf8');if(!text.includes('nhuy-screen-overview'))write(target,text+'\n\\input{sections/4.Subsections/nhuy-screen-overview}\n');
const rules=[
 ['BR-NH-01','Protected account actions require a valid active session and permission for the HTTP method/path; user identity comes from the token. Public freelancer/client profile reads are exempt.'],
 ['BR-NH-02','Freelancer profile, skill, portfolio and CV writes require ownership; a user cannot mutate another profile through a supplied identifier.'],
 ['BR-NH-03','Freelancer and client profile changes below 20 percent strength are submitted as revisions; changes at or above the threshold may update directly. Expert self-updates always require review and cannot be submitted while an expert revision is pending.'],
 ['BR-NH-04','Social links are unique per profile/platform; deletion requires ownership. Favorite and following relationships use the client/freelancer composite key and reject duplicates.'],
 ['BR-NH-05','Identity documents support validated upload and AI submission. AI VERIFIED leads to PENDING administrative review, not automatic approval. A document already approved for another user forces rejection.'],
 ['BR-NH-06','Following a freelancer creates the relationship and NEW_FOLLOWER notification in one transaction. Following lists exclude deleted or banned target users.'],
 ['BR-NH-07','Notifications are read or deleted only within the current user account. Delete is soft deletion. Mark-all-read affects only active unread records belonging to that user.'],
 ['BR-NH-08','Switch Role requires an existing active target assignment; Join New Role only accepts CLIENT/FREELANCER, ensures the role profile and makes the new assignment primary atomically. A new access token uses the existing session.'],
 ['BR-NH-09','Only contract participants may list/detail contract reviews. A new review requires COMPLETED and is unique per contract/reviewer even after soft deletion. Only the reviewer may update/delete that review.'],
 ['BR-NH-10','Only the reviewee may respond. A deleted response is restored instead of inserting a second response. Only its author may update/delete it. Create/restore includes the reviewer notification in the transaction.'],
 ['BR-NH-11','Password change requires an existing password credential and successful current-password verification. Only the newly hashed password is persisted.'],
 ['BR-NH-12','Avatar uploads require JPEG/PNG/WEBP signatures matching the declared MIME type and a maximum of 5 MB. CV uploads require PDF signature and MIME, maximum 10 MB.'],
 ['BR-NH-13','A revision may be reviewed only while PENDING. Conditional claim, approved profile application, strength recalculation and notification are atomic; rejection leaves the live profile unchanged.'],
 ['BR-NH-14','Upload and Replace CV use the same endpoint. New metadata is saved before old-file cleanup; Delete clears metadata after cleanup. Cleanup errors are ignored as implemented. File access checks ownership and local path containment.'],
];
write('docs/Report 3/sections/nhuy-business-rules.tex','\\subsection{Account, Profile and Review Business Rules}\n\\begin{longtable}{|L{2.4cm}|L{11.8cm}|}\\hline\nID & Rule Definition \\\\ \\hline\n'+rules.map(([id,t])=>`${id} & ${esc(t)} \\\\ \\hline`).join('\n')+'\n\\end{longtable}\n');
target='docs/Report 3/sections/3.Business_Rule.tex';text=fs.readFileSync(target,'utf8');if(!text.includes('nhuy-business-rules'))write(target,text+'\n\\input{sections/nhuy-business-rules}\n');
// Relevant persistence entities and constraints complement the existing global ERD.
const schema=fs.readFileSync('apps/api/prisma/schema.prisma','utf8');
const models=['Profile','FreelancerProfile','FreelancerSkill','PortfolioItem','ClientProfile','Expert','SocialLink','FavoriteFreelancer','FollowFreelancer','Notification','Review','ReviewResponse','ProfileRevision','IdVerificationDocument','UserRole'];
let db='\\subsection{Profile, Account and Review Persistence -- Nguyen Lu Nhat Huy}\nThe following model fields and constraints support the five sprint modules; names are taken from the Prisma schema. Related global database diagrams remain in the preceding sections.\n';
for(const model of models){const m=schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`));if(!m)continue;const fields=m[1].split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('//'));db+=`\\subsubsection{${model}}\n\\begin{longtable}{|L{3.3cm}|L{10.8cm}|}\\hline\nField / constraint & Type and mapping \\\\ \\hline\n`+fields.map(s=>{const [name,...rest]=s.split(/\s+/);return `${esc(name)} & ${esc(rest.join(' '))} \\\\ \\hline`;}).join('\n')+'\n\\end{longtable}\n';}
write('docs/Report 4/sections/nhuy/database.tex',db);
target='docs/Report 4/sections/5.Database_Design.tex';text=fs.readFileSync(target,'utf8');if(!text.includes('sections/nhuy/database'))write(target,text+'\n\\input{sections/nhuy/database}\n');
console.log('Enriched business flows, screen controls, 14 business rules and persistence models.');
