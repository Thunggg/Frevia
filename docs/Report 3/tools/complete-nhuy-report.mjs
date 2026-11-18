import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const report = path.join(root, 'docs/Report 3');
const specs = 'sections/2.Subsections/2.2.Subsections/2.2.3.Subsections';
const read = (p) => fs.readFileSync(path.join(report, p), 'utf8');
const screenshotPath = path.join(report, 'nhuy-screenshots.json');
const screenshots = fs.existsSync(screenshotPath) ? JSON.parse(fs.readFileSync(screenshotPath, 'utf8')).functions : {};
const write = (p, text) => {
  if (p.includes('sections/3.Subsections/sprint') && p.endsWith('/nhuy.tex')) {
    text = text.split(/(?=\\subsubsection\{Function:)/).map(section => {
      const id = section.match(/\\subsubsection\{Function:.*\((UC-\d+\.\d+)\)/)?.[1];
      const capture = screenshots[id];
      if (!capture) return section;
      if (!fs.existsSync(path.join(report, capture.image))) throw new Error(`Missing screenshot: ${capture.image}`);
      const start = section.indexOf('\\fnhead{Screen Layout (Mock-up Description)}');
      const end = section.indexOf('\\fnhead{Function Details}', start);
      if (start < 0 || end < 0) throw new Error(`Missing screen-layout block: ${id}`);
      return section.slice(0, start) + `\\fnhead{Screen Layout (Mock-up Description)}\n\\screenfigure[0.98]{${capture.image}}{${tex(capture.caption)}}\n${tex(capture.description)}\n\\par\\smallskip\\noindent\\textit{Captured from the running application on 09 November 2026.}\n\n` + section.slice(end);
    }).join('');
    text = text.replaceAll('\\subsection{', '\\Needspace{12\\baselineskip}\n\\subsection{')
      .replaceAll('\\subsubsection{Function:', '\\Needspace{10\\baselineskip}\n\\subsubsection{Function:')
      .replaceAll('\\fnhead{', '\\Needspace{7\\baselineskip}\n\\fnhead{')
      .replaceAll('\\sublabel{', '\\Needspace{5\\baselineskip}\n\\sublabel{')
      .replaceAll('\\fnhead{Function Details}', '\\Needspace{18\\baselineskip}\n\\fnhead{Function Details}')
      .replaceAll('\\sublabel{Input Data}', '\\Needspace{14\\baselineskip}\n\\sublabel{Input Data}')
      .replaceAll('\\sublabel{Output Data}', '\\Needspace{14\\baselineskip}\n\\sublabel{Output Data}');
  }
  if (p.includes('2.2.3.Subsections/'))
    text = text.replaceAll('\\subparagraph{', '\\Needspace{8\\baselineskip}\n\\subparagraph{');
  fs.mkdirSync(path.dirname(path.join(report, p)), { recursive: true });
  fs.writeFileSync(path.join(report, p), text.trim() + '\n');
};
const tex = (s) => String(s).replace(/[\\{}%&#_$~^]/g, c => ({'\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$','~':'\\textasciitilde{}','^':'\\textasciicircum{}'}[c]));
const tt = (s) => `{\\small\\texttt{${tex(s).replaceAll('/', '/\\allowbreak{}').replaceAll(';', ';\\allowbreak{}')}}}`;
const items = (values, ordered = false) => `\\begin{${ordered ? 'enumerate' : 'itemize'}}[leftmargin=1.7em,itemsep=2pt,topsep=3pt]\n${values.map(v => `\\item ${tex(v)}`).join('\n')}\n\\end{${ordered ? 'enumerate' : 'itemize'}}`;
const rows = (values) => values.map(([a,b]) => `${tex(a)} & ${tex(b)} \\\\ \\hline`).join('\n');
const dataTable = (values) => `\\begin{specdatatable}{Data}{Definition}\n${rows(values)}\n\\end{specdatatable}`;
const modules = {
  '07': {name:'Freelancer Profile Management', actor:'Freelancer', screen:'/freelancer/profile; /profiles/[id]', entities:'Profile, FreelancerProfile, ProfileRevision', inputs:[['displayName / title','Required trimmed text, 1--255 characters each.'],['bio','Optional text up to 5,000 characters; null clears it.'],['education / certifications / languages / experience','Each list has at most 20 non-empty entries, each up to 255 characters.'],['availabilityStatus','A supported availability enum value.']], rules:['Use Profile.id for profile routes; User.id identifies the owner and must not be substituted for the profile ID.','Only the owner changes professional data. Public output excludes credentials and private CV locations.','Omitted optional fields are preserved. An explicit null or empty list clears the corresponding value.','Freelancer and Client updates below 20 percent profile strength require a pending revision; other updates apply directly. Pending changes are not shown as approved public data.'], layout:'Profile header with name and availability; professional sections; Skills and Portfolio panels; owner-only Edit and CV controls.'},
  '08': {name:'Freelancer Skills Management', actor:'Freelancer', screen:'/profiles/[id]; /freelancer/profile', entities:'Profile, FreelancerProfile, FreelancerSkill, Skill', inputs:[['skillName','Required trimmed name up to 100 characters, entered or selected from suggestions.'],['proficiencyLevel','Required integer from 1 to 10.'],['id','Skill deletion uses FreelancerSkill.id, not Skill.id.']], rules:['A freelancer can add and delete mappings only on their own profile.','The pair (freelancerProfileId, skillId) must be unique, including concurrent requests.','Deleting a skill permanently removes FreelancerSkill but retains the shared Skill definition.','Show an empty state when there are no active skills.'], layout:'Skill list with catalog name, proficiency /10 and owner-only remove action; Add Skill dialog with suggestions and level selector.'},
  '09': {name:'Portfolio Management', actor:'Freelancer', screen:'/profiles/[id]; /freelancer/profile', entities:'Profile, FreelancerProfile, PortfolioItem', inputs:[['title','Required trimmed title, 1--255 characters.'],['description','Optional text, up to 5,000 characters.'],['technologies','At most 20 non-empty names, each up to 100 characters.'],['projectUrl','Optional HTTP/HTTPS project link up to 500 characters.']], rules:['Only the owning freelancer creates, updates or deletes a portfolio item.','Only items whose deletedAt is null are listed, opened or edited.','Deletion sets deletedAt; it does not hard-delete the item.','The agreed database scope is title, description, technologies and project URL; media gallery, uploads and project role are excluded.'], layout:'Portfolio card grid with title, description and technologies; detail dialog; owner-only Add, Edit and Delete controls; confirmation before deletion.'},
  '18': {name:'Identity Verification', actor:'Freelancer', screen:'/account-profile (Identity Verification tab)', entities:'User, IdVerificationDocument, FreelancerProfile', inputs:[['documentType','Supported identity-document type.'],['front / back','Document images; both sides where required by document type.'],['selfie / liveness','Selfie and captured liveness frames for the AI path.'],['document file','Manual-path JPEG, PNG, WebP or PDF; maximum 5 MB under the identity business rule.']], rules:['Only an authenticated freelancer submits or reads their own verification status.','At most one active PENDING or APPROVED request is allowed per freelancer.','Documents are confidential; storage delivery and file endpoints must enforce authorization.','AI success creates PENDING for administrator review; AI rejection records REJECTED with a reason. AI transport failure must not create a successful request.','Rejected users may resubmit after correcting the stated problem. NOT_SUBMITTED is displayed when API status is null.'], layout:'Document-type and front/back selectors; webcam liveness panel for AI submission; Submit; latest status badge, submission history and rejection instructions.'},
  '19': {name:'Client Profile Management', actor:'Client', screen:'/clients/[userId]; /client/profile', entities:'User, Profile, ClientProfile, SocialLink, ProfileRevision', inputs:[['companyName','Required trimmed company name, up to 255 characters.'],['companyDescription','Optional company description up to 5,000 characters.'],['website','Optional HTTP/HTTPS URL, at most 255 characters.']], rules:['Public client output contains approved company and profile fields, never password hashes, payment tokens or private identity documents.','Only the authenticated Client updates their own company; the server derives the user ID from authentication.','Apply the profile revision policy when strength is below 20 percent.','Industry and location are outside the current ClientProfile schema. Hiring statistics are not part of the current response contract.'], layout:'Public company header, description, website and social links; owner link to settings; Company tab with name, description and website fields.'},
  '20': {name:'Social Links Management', actor:'Client, Freelancer', screen:'/account-profile (Social Links); /client/profile; public profile', entities:'Profile, SocialLink', inputs:[['platform','One supported social platform enum value.'],['url','Required HTTP/HTTPS URL up to the SocialLink varchar(500) limit.'],['id','SocialLink.id of the link selected for deletion.']], rules:['At most one link per platform per profile is allowed, including concurrent submissions.','Only the owning user can add or hard-delete a social link.','Open approved external links in a new tab with rel="noopener noreferrer".','Profile.id links the SocialLink table; the authenticated User.id resolves that profile.'], layout:'Platform selector and URL input; saved links with labels and external-link icons; delete confirmation; public link area with empty-state handling.'},
  '21': {name:'Favorite Freelancers', actor:'Client', screen:'/client/profile (Favorites); /profiles/[id]', entities:'User, Profile, FreelancerProfile, FavoriteFreelancer', inputs:[['freelancerId','Target freelancer User.id, not Profile.id.']], rules:['Only an authenticated Client manages their own favorites.','Reject self-favoriting and targets without an active Freelancer role.','The composite key (clientId, freelancerId) prevents duplicate relationships.','Removal hard-deletes only the relationship; no freelancer account or profile is deleted.','A successful add must be visible after list reload, including a new freelancer with minimal professional data.'], layout:'Favorite toggle on public freelancer profile; Favorites list with name, title, skills, profile link and Remove action; empty state.'},
  '29': {name:'Following Management', actor:'Client', screen:'/client/profile (Following); /profiles/[id]', entities:'User, FollowFreelancer, Notification', inputs:[['freelancerId','Target freelancer User.id.']], rules:['Only a Client follows or unfollows an active freelancer; self-follow is rejected.','A unique (clientId, freelancerId) mapping prevents duplicates.','Create the follow and its recipient notification together in a transaction.','Unfollow hard-deletes the mapping without deleting either user.'], layout:'Following cards with profile links and Unfollow; discovery section and Follow action; empty-state message.'},
  '30': {name:'Notification Management', actor:'Client, Freelancer, Expert, Admin', screen:'Header notification menu; /notifications', entities:'Notification', inputs:[['id','Positive notification ID, scoped to the authenticated recipient.']], rules:['A user reads and changes only their own notifications.','Exclude rows with deletedAt set and sort by createdAt descending.','Mark-read sets isRead=true; mark-all affects only the recipient unread active rows.','Deletion is a soft delete and updates the displayed list and unread count.'], layout:'Notification list with title, content, timestamp and unread indication; Mark as Read, Mark All as Read and Delete controls.'},
  '31': {name:'Role Switching and Enrollment', actor:'Client, Freelancer, Expert', screen:'Header role menu; role enrollment dialog', entities:'User, Role, UserRole, Session', inputs:[['roleName','Supported role name, never an administrator privilege chosen by a regular user.']], rules:['Switch only to a role already assigned to the authenticated user.','Join only roles allowed for self-enrollment; no duplicate UserRole mapping is permitted.','Maintain exactly one active primary role for an account; role-context changes issue updated session tokens.','Switching roles does not create a second user account or grant access to other users records.'], layout:'Header showing current role, assigned role options and Join Role action; enrollment confirmation; destination dashboard after success.'},
  '39': {name:'Contract Review Management', actor:'Client, Freelancer', screen:'/client/contracts/[slug]; /freelancer/contracts/[slug]', entities:'Contract, Review, Notification', inputs:[['overallRating','Required numeric rating from 1 to 5 when creating.'],['breakdown','Optional ratings map: at most 10 criteria, names up to 50 characters, values 1--5.'],['comment','Optional trimmed feedback, up to 3,000 characters.'],['contractId / reviewId','Positive database identifiers; contract page URLs use slug.']], rules:['Only contract participants can list or view contract reviews.','A review can be created only after the contract is COMPLETED, for the other party.','The pair (contractId, reviewerId) is unique.','Only the review author edits or soft-deletes their review.','An update must contain at least one accepted field. The current schema does not require a non-empty comment or an integer overall rating.'], layout:'Contract Reviews section with author, rating, breakdown and comment; Write Review dialog; author-only Edit and Delete actions.'},
  '40': {name:'Review Response Management', actor:'Client, Freelancer', screen:'Contract Reviews section', entities:'Review, ReviewResponse, Notification', inputs:[['responseText','Required trimmed response, 1--3,000 characters.'],['reviewId / responseId','Review being answered or existing response identifier.']], rules:['Only the user being reviewed may respond.','There is at most one active response per review.','Only the response author edits or soft-deletes it.','Soft-deleted responses must not be rendered as active feedback.'], layout:'Response beneath its review with author and time; Respond/Edit form; response-author-only Delete confirmation.'},
  '41': {name:'General Account Profile', actor:'Client, Freelancer, Expert, Admin', screen:'/account-profile (General Settings)', entities:'User, Profile, ProfileRevision', inputs:[['displayName','Required trimmed text up to 255 characters.'],['bio','Optional trimmed text up to 5,000 characters.'],['currentPassword / newPassword / confirmPassword','Current credential plus matching replacement; replacement is 8--32 characters with uppercase and numeric characters.'],['avatar','JPEG, PNG or WebP image up to 5 MB; validate actual image content.']], rules:['The server resolves the account from the session; users cannot edit another account via body IDs.','Verify the current password before hashing and storing a replacement; do not log credentials.','Apply the profile revision policy to general profile changes.','Avatar files must be validated; missing stored files return 404 without terminating the API process.'], layout:'Read-only email and role summary; display name and bio form; avatar picker; separate password-change form and confirmation field.'},
  '47': {name:'Profile Revision Review and Expert Profile', actor:'Admin', screen:'/admin/profile-revisions; /expert/profile', entities:'ProfileRevision, Profile, FreelancerProfile, ClientProfile, Expert, Notification', inputs:[['page / limit / search / status / profileType','Validated review-list filters; PENDING, APPROVED or REJECTED status.'],['id / reviewNotes','Revision identifier and administrator decision notes; a rejection requires explanatory notes.'],['expert profile fields','Name, title, bio, expertise, yearsOfExperience 0--80, education, certifications and optional website.']], rules:['Only an authorized administrator can inspect or decide profile revisions.','Only PENDING revisions may be approved or rejected. Decision and profile writes are transactional.','Approval applies validated proposed data to the correct subtype; rejection retains existing public data.','Record reviewer, decision time and notes; preserve history and notify the requester.','An Expert submits their own update as a pending revision. Administrative expert editing is a separate authorized operation.'], layout:'Admin filter bar and revision table; current/proposed comparison panel; Approve/Reject controls and note field; Expert form with submission status.'},
};

const functions = [];
modules['31'].actor = 'Client, Freelancer';
modules['31'].inputs = [['role', 'JSON field role; allowed values are Client or Freelancer. Expert and Admin are not self-enrollment options.']];
modules['31'].rules[1] = 'Self-enrollment permits only Client or Freelancer; reject unsupported roles and duplicate UserRole mappings.';
const cvRules = [
  'Only the owning freelancer can upload, view, replace or delete their CV.',
  'Uploads are PDF-only, at most 10 MB, and must have a valid PDF signature; reject missing, oversized or invalid files.',
  'Store CV URL, file name, public ID and upload time on FreelancerProfile. Do not expose private storage paths in public profile responses.',
  'A replacement updates metadata only after the new file is stored. A missing local file returns 404 without crashing the API.',
  'Deleting a CV clears its metadata and triggers a search-index update; it does not delete the profile or previously confirmed professional sections.',
];
const moduleFor = f => f.group === '07' && f.sprint === 5 ? { ...modules['07'], name: 'Freelancer CV Management', rules: cvRules, layout: 'Current CV file name; Upload or Replace PDF picker; View/Download and Delete confirmation; progress, validation and error feedback.' } : modules[f.group];
function add(group, sprint, suffix, name, endpoint, action, effect, input) {
  const id = `UC-${group}.${String(suffix).padStart(2,'0')}`;
  functions.push({id,group,sprint,name,endpoint,action,effect,input});
}
add('07',1,1,'View Freelancer Profile','GET /profiles/:id','view','Retrieve approved Profile and FreelancerProfile fields in one response.');
add('07',1,2,'Update Freelancer Profile','PUT /profiles/:id','update','Persist basic and professional fields together or create a pending revision under the review policy.');
add('08',1,1,'View Freelancer Skill List','GET /profiles/:id/skills','list','Join FreelancerSkill with active Skill catalog entries and show proficiency levels.');
add('08',1,2,'Add Freelancer Skill','POST /profiles/:id/skills','create','Resolve or create the canonical catalog skill and insert one owned FreelancerSkill mapping.');
add('08',1,3,'Delete Freelancer Skill','DELETE /profiles/skills/:id','delete','Hard-delete the owned mapping while retaining its Skill catalog entry.');
add('09',1,1,'View Portfolio List','GET /profiles/:id/portfolios','list','List only non-deleted PortfolioItem records of the selected freelancer.');
add('09',1,2,'Add Portfolio','POST /profiles/:id/portfolios','create','Create an owned portfolio item with title, description, technologies and project link.');
add('09',1,3,'View Portfolio Detail','GET /profiles/portfolios/:id','view','Display a single non-deleted portfolio item and its external project link.');
add('09',1,4,'Update Portfolio','PUT /profiles/portfolios/:id','update','Save validated edits on an owned, non-deleted portfolio item.');
add('09',1,5,'Delete Portfolio','DELETE /profiles/portfolios/:id','delete','Set deletedAt and remove the item from active list and detail results.');
add('18',2,1,'Upload Identity Documents','POST /identity-verifications/ai-check; POST /identity-verifications/documents','create','Validate the active-request constraint, securely store the submitted evidence, and record the verification outcome for review.');
add('18',2,2,'View Verification Status','GET /identity-verifications/status','view','Return the latest verification state and submission history with rejection notes where present.');
add('19',2,1,'View Client Profile','GET /clients/:userId','view','Combine approved public Profile, ClientProfile and SocialLink fields without private user information.');
add('19',2,2,'Update Company Information','PUT /clients/me/profile','update','Save or submit the authenticated Client company information according to the revision policy.');
add('20',2,1,'View Social Link List','GET /social-links; GET /clients/:userId','list','Retrieve links for the current account settings or the public client response; public freelancer rendering is a tracked gap.');
add('20',2,2,'Add Social Link','POST /social-links','create','Validate the platform and external URL, then insert one link on the authenticated user profile.');
add('20',2,3,'Delete Social Link','DELETE /social-links/:id','delete','Hard-delete the selected owned social link after confirmation.');
add('21',2,1,'View Favorite Freelancer List','GET /favorites/freelancers','list','Load the current Client favorites and join public freelancer details.');
add('21',2,2,'Add Freelancer to Favorites','POST /favorites/freelancers/:freelancerId','create','Insert a unique relationship from the current Client to an active freelancer.');
add('21',2,3,'Remove Freelancer from Favorites','DELETE /favorites/freelancers/:freelancerId','delete','Hard-delete the current Client relationship and update the favorite toggle and list.');
add('29',3,1,'View Following List','GET /following/freelancers','list','Load freelancer relationships owned by the current Client and show the following state.');
add('29',3,2,'Follow Freelancer','POST /following/freelancers/:freelancerId','create','Create a unique follow mapping and notify the target freelancer.');
add('29',3,3,'Unfollow Freelancer','DELETE /following/freelancers/:freelancerId','delete','Remove only the current Client follow relationship.');
add('30',3,1,'View Notification List','GET /notifications','list','Load the recipient active notifications in reverse chronological order.');
add('30',3,2,'Mark Notification as Read','PATCH /notifications/:id/read','update','Set isRead to true on one owned notification.','notification id');
add('30',3,3,'Mark All Notifications as Read','PATCH /notifications/read-all','update','Update the current recipient unread, non-deleted notifications together.','authenticated recipient; no notification id');
add('30',3,4,'Delete Notification','DELETE /notifications/:id','delete','Set deletedAt on the owned notification and hide it from the list.');
add('31',3,1,'Switch Role','POST /auth/switch-role','update','Change the primary role to an already assigned role and issue updated authentication tokens.');
add('31',3,2,'Join New Role','POST /auth/join-role','create','Enroll in an allowed new role without duplicating the account or granting administrator privileges.');
add('39',4,1,'View Review List','GET /reviews/contracts/:contractId','list','Retrieve reviews and active responses for a contract after verifying participant access.');
add('39',4,2,'View Review Detail','GET /reviews/:reviewId','view','Retrieve one review and response after checking contract participation.');
add('39',4,3,'Write Review','POST /reviews/contracts/:contractId','create','Create one review of the other participant in a completed contract and notify that participant.');
add('39',4,4,'Update Review','PATCH /reviews/:reviewId','update','Update accepted fields of an existing review authored by the current user.');
add('39',4,5,'Delete Review','DELETE /reviews/:reviewId','delete','Soft-delete the owned review so it no longer appears as active feedback.');
add('40',4,1,'Respond to Review','POST /reviews/:reviewId/response','create','Create an active response from the reviewee and notify the review author.');
add('40',4,2,'Update Review Response','PATCH /reviews/responses/:responseId','update','Save validated text in the current user response.');
add('40',4,3,'Delete Review Response','DELETE /reviews/responses/:responseId','delete','Soft-delete the response authored by the current user.');
add('41',4,1,'View Profile','GET /account-profile','view','Read the authenticated account profile, email and assigned roles.');
add('41',4,2,'Update Profile','PUT /account-profile','update','Save or submit general display name and biography according to profile strength.','displayName; optional bio');
add('41',4,3,'Change Password','PUT /account-profile/password','update','Verify the current credential, hash the confirmed replacement and update the password.','currentPassword; newPassword; confirmPassword');
add('41',4,4,'Upload Avatar','POST /account-profile/avatar','upload','Validate image content and size, store it, and update the owned avatar URL.','multipart file');
add('47',5,1,'View Pending Profile Update Request List','GET /admin/profile-revisions','list','Filter and paginate revisions, defaulting the review workflow to pending requests.');
add('47',5,2,'View Profile Update Request Detail','GET /admin/profile-revisions/:id','view','Display the current and proposed snapshots, requester, profile type and prior review notes.');
add('47',5,3,'Approve Profile Update Request','PATCH /admin/profile-revisions/:id/approve','approve','Apply validated proposed changes and record an APPROVED decision atomically.','revision id; optional reviewNotes');
add('47',5,4,'Reject Profile Update Request','PATCH /admin/profile-revisions/:id/reject','reject','Keep approved profile data unchanged and record REJECTED with an explanatory note.','revision id; required reviewNotes');
add('47',5,5,'View Profile Update Request History','GET /admin/profile-revisions; GET /profile-revisions/me?type=...','list','Allow Admin to filter historical decisions; a requester can read only their latest revision for a profile type.');
add('47',5,6,'Update Profile Expert','PUT /expert-profile/me','update','Submit the owned Expert profile as a pending revision for administrator review.','expert profile fields');
for (const [suffix,name,endpoint,action,effect] of [
  [3,'Upload CV','POST /profiles/:id/cv','upload','Validate a PDF up to 10 MB and attach it to the owned FreelancerProfile.'],
  [4,'View CV','GET /profiles/:id/cv/file','view','Authorize the owner and serve or redirect to the current CV; return 404 when its stored file is unavailable.'],
  [5,'Replace CV','POST /profiles/:id/cv','upload','Store a valid replacement PDF, update CV metadata and clean up the previous file after a successful update.'],
  [6,'Delete CV','DELETE /profiles/:id/cv','delete','Clear CV URL, public ID, file name and upload time, and update the related search index.'],
]) add('07',5,suffix,name,endpoint,action,effect,'CV upload: multipart PDF file, maximum 10 MB; Profile.id');

const publicIds = new Set(['UC-07.01','UC-08.01','UC-09.01','UC-09.03','UC-19.01']);
const actorFor = f => f.id === 'UC-47.06' ? 'Expert' : publicIds.has(f.id) ? 'Guest, Client, Freelancer' : modules[f.group].actor;
const preFor = f => [publicIds.has(f.id) ? 'The requested active profile or item exists.' : 'The actor is authenticated and has the required role and resource permission.', f.group === '39' || f.group === '40' ? 'The authenticated user is an authorized participant in the referenced contract.' : f.group === '47' && ['approve','reject'].includes(f.action) ? 'The selected revision exists and is still PENDING.' : 'The relevant database and dependent services are available.'];
function flowFor(f) {
  const m = moduleFor(f);
  return [
    `The actor opens ${m.screen} and selects ${f.name}.`,
    f.action === 'view' || f.action === 'list' ? 'The application submits the selected identifier or list filters.' : 'The application presents the current values or action confirmation; the actor supplies the required data and submits.',
    'The API checks authentication where required, authorization, resource existence and input validity.',
    f.effect,
    f.action === 'view' || f.action === 'list' ? 'The screen renders the response, or an explicit empty state for a valid empty collection.' : 'After the transaction succeeds, the screen displays the result and reloads affected data; a pending revision is labeled as awaiting review.',
  ];
}
function exceptionsFor(f) {
  const errors = [['E1','Missing or expired authentication, or insufficient role/ownership: deny the operation and do not change data.'],['E2','Missing, deleted or inaccessible resource: show a not-found result.'],['E3','Invalid input, duplicate relationship, or invalid workflow state: explain the problem and retain the entered values.'],['E4','Database, network or storage failure: report a retryable error; do not report success or terminate the API process.']];
  if (f.action === 'view' || f.action === 'list') errors[2] = ['A1','A valid empty collection displays an empty state; it must not be treated as a missing account.'];
  if (f.group === '18') errors.push(['E5','An active PENDING/APPROVED request blocks resubmission. An unavailable AI service is reported without creating a successful verification record.']);
  return errors;
}
function specificInputs(f) {
  if (f.input) return [['Accepted input',f.input]];
  if (f.action === 'delete' || f.action === 'view') return [['Identifier',f.endpoint.includes('me') || f.endpoint.endsWith('status') || f.endpoint === 'GET /account-profile' ? 'Authenticated user context; no other user ID can replace it.' : 'Positive resource ID from the route; ownership is checked by the API.']];
  if (f.action === 'list') return [['Selection',f.group === '47' ? 'Validated page, limit, search, status and profileType filters.' : 'Current account or selected profile/contract; no pagination is assumed unless exposed by the endpoint.']];
  return modules[f.group].inputs;
}
const outputsFor = f => [['Result', f.effect],['Failure','Structured error without sensitive data; no successful UI state when the operation failed.']];

function ucTable(f) {
  const m = moduleFor(f);
  const fields = [
    ['UC ID and Name',`${f.id} ${f.name}`],['Created By:','Nguyen Lu Nhat Huy; updated 08/11/2026'],['Primary Actor:',actorFor(f)],['Trigger:',`The actor selects ${f.name} from ${m.screen}.`],['Description:',f.effect],['Preconditions:',preFor(f).join(' ')],['Post-conditions:',f.action === 'view' || f.action === 'list' ? 'Authorized data is displayed without modifying the underlying records.' : f.effect],
  ];
  const line = (label, content) => `${tex(label)} & \\multicolumn{3}{L{11.1cm}|}{${content}} \\\\ \\hline`;
  return `\\subparagraph{${tex(f.id+' '+f.name)}}\n\n{\\singlespacing\n\\setlength{\\extrarowheight}{3pt}\n\\begin{longtable}{|L{3.2cm}|L{4.1cm}|L{2.7cm}|L{4.1cm}|}\n\\hline\n\\endfirsthead\n\\hline\n\\endhead\n\\hline\\endfoot\n\\endlastfoot\n${fields.map(([a,b]) => line(a,tex(b))).join('\n')}\n${line('Normal Flow:',flowFor(f).map((v,i)=>`${i+1}. ${tex(v)}`).join(' \\newline '))}\n${line('Alternative Flows:',tex(f.action==='view'||f.action==='list' ? 'No matching records: display an empty state. A failed request offers Retry.' : 'Cancel before submission: discard unsaved input or close the confirmation without changing stored data.'))}\n${line('Exceptions:',exceptionsFor(f).map(([id,text])=>`\\textbf{${id}:} ${tex(text)}`).join(' \\newline '))}\n${line('Priority:',tex(['18','31','47'].includes(f.group)?'High':'Medium'))}\n${line('Frequency of Use:','As required by the actor workflow.')}\n${line('Business Rules:',m.rules.map((rule,i)=>`\\textbf{BR-NH-${f.group === "07" && f.sprint === 5 ? "CV" : f.group}-${String(i+1).padStart(2,'0')}:} ${tex(rule)}`).join(' \\newline '))}\n${line('Other Information:',`${tt(f.endpoint)}. Persistent entities: ${tex(m.entities)}.`)}\n${line('Assumptions:',tex('This specification defines the required behavior; implementation gaps are recorded separately and do not imply that every requirement has passed acceptance.'))}\n\\end{longtable}\n}\n`;
}
function functional(f) {
  const m=moduleFor(f);
  return `\\subsubsection{Function: ${tex(f.name)} (${f.id})}\n\\label{fn:nhuy-${f.id.toLowerCase().replaceAll('.','-')}}\n\n\\fnhead{Function Trigger}\n${tex(`The actor selects ${f.name}. Navigation: ${m.screen}.`)}\n\n\\fnhead{Function Description}\n\\sublabel{Actors / Roles}\n${tex(actorFor(f))}.\n\\sublabel{Purpose}\n${tex(f.effect)}\n\\sublabel{Interface and Data Processing}\n${tt(f.endpoint)}. ${tex(`The browser calls the Next.js BFF, which forwards authenticated requests to the NestJS API. The server derives the acting user from authentication and accesses ${m.entities}. Route IDs are validated independently from owner IDs.`)}\n\n\\fnhead{Screen Layout (Mock-up Description)}\n\\begin{center}\n\\fbox{\\begin{minipage}{0.88\\linewidth}\n\\textbf{${tex(f.name)}}\\par\\smallskip\n${tex(m.layout)}\\par\\smallskip\n\\textit{Schematic interface description, not an application screenshot.}\n\\end{minipage}}\n\\end{center}\n\n\\fnhead{Function Details}\n\\sublabel{Input Data}\n${dataTable(specificInputs(f))}\n\\sublabel{Validation and Business Rules}\n${items(m.rules)}\n\\sublabel{Normal Flow}\n${items(flowFor(f),true)}\n\\sublabel{Alternative Flow}\n${tex(f.action==='view'||f.action==='list'?'Show an informative empty state for a valid empty result and allow retry after a transport failure.':'Cancel before submission closes the form or confirmation without persisting changes. On failure, preserve user input for correction and retry.')}\n\\sublabel{Abnormal Flow / Exception Handling}\n\\begin{flowtable}{Case}{Description}\n${rows(exceptionsFor(f))}\n\\end{flowtable}\n\\sublabel{Output Data}\n${dataTable(outputsFor(f))}\n\\sublabel{Acceptance Criteria}\n${items([`Successful ${f.name.toLowerCase()} produces the documented response and survives a reload where data is persisted.`,'An unauthorized actor cannot access or modify the resource.','Invalid input and missing resources do not create a false success state or expose sensitive data.'])}\n`;
}

// Replace only Nhuy-owned use-case sources; keep other contributors intact.
const bySprint = n => functions.filter(f => f.sprint === n);
for (let sprint=1;sprint<=5;sprint++) {
  const list=bySprint(sprint);
  let previous='';
  const body=list.map(f=>{ const heading=f.group!==previous ? `\\paragraph{${tex(moduleFor(f).name)}}\n` : ''; previous=f.group; return heading+ucTable(f); }).join('\n');
  if(sprint===1){
    for(const [group,file] of [['07','2.2.3.3.Profile_Management.tex'],['08','2.2.3.4.Skills_Management.tex'],['09','2.2.3.5.Portfolio_Management.tex']])
      write(`${specs}/sprint1/${file}`,`% Nhuy -- canonical use-case identifiers, 08/11/2026\n\\paragraph{${tex(modules[group].name)}}\n${list.filter(f=>f.group===group).map(ucTable).join('\n')}`);
  } else {
    const target=`${specs}/sprint${sprint}/nhuy.tex`;
    write(target,`% Nhuy -- canonical use-case identifiers, 08/11/2026\n${body}`);
    // Existing extensionless files are the previous sources, not additional content.
    const old=path.join(report,`${specs}/sprint${sprint}/nhuy`);
    if(fs.existsSync(old)) fs.unlinkSync(old);
  }
  previous='';
  const descriptions=list.map(f=>{ const heading=f.group!==previous ? `\\subsection{${tex(moduleFor(f).name)}}\n` : ''; previous=f.group; return heading+functional(f); }).join('\n');
  write(`sections/3.Subsections/sprint${sprint}/nhuy.tex`,`% Functional requirements -- Nguyen Lu Nhat Huy -- Sprint ${sprint}\n${descriptions}`);
}

let main=read('sections/3.Functional_Requirements.tex');
main=main.replace(/% The feature descriptions[\s\S]*?% ===================\r?\n% Sprint2/,'% ===================\n% Sprint2');
for(let n=1;n<=5;n++) {
  const line=`\\input{sections/3.Subsections/sprint${n}/nhuy}`;
  if(!main.includes(line)) {
    const anchor=`\\input{sections/3.Subsections/sprint${n}/tthuan}`;
    main=main.replace(anchor,anchor+'\n'+line);
  }
}
write('sections/3.Functional_Requirements.tex',main);

// Canonicalize only the owned entries in the shared overview table.
const overviewPath='sections/2.Subsections/2.2.Subsections/2.2.2.Use_Case_Description.tex';
let overview=read(overviewPath);
const ids = new Set(functions.map(f=>f.id));
const aliases = new Set(['View Detailed Freelancer Profile','Update Your Detailed Freelancer Profile','View List Freelancer Skill','Add New Portfolio','View Client Profile Detail','View Social Links','View Favorite Freelancers','Add to Favorites','Remove from Favorites','View Reviews List','Edit Review','Edit Response','Delete Response','Get Profile','View List of Pending Profile Update Requests']);
for(const f of functions) aliases.add(f.name);
overview=overview.split(/\r?\n/).filter(line=>{
  if(!/^UC-/.test(line))return true;
  const cells=line.split('&').map(s=>s.trim());
  return !ids.has(cells[0])&&!aliases.has(cells[1]);
}).join('\n');
const newRows=functions.map(f=>`${f.id} & ${tex(f.name)} & ${tex(actorFor(f))} & ${tex(f.effect)} \\\\\n\\hline`).join('\n');
overview=overview.replace('\\end{longtable}',`% Nhuy -- canonical Sprint 1--5 use cases\n${newRows}\n\\end{longtable}`);
// Fit the four-column overview inside the A4 text area.
overview=overview.replaceAll('p{2.2cm}','p{1.8cm}').replaceAll('p{3cm}','p{2.7cm}').replaceAll('p{7.5cm}','p{6.7cm}');
write(overviewPath,overview);

let changes=read('sections/record_of_changes.tex');
changes=changes.replace(' & & & \\\\ \\hline','08/11/2026 & A, M & N. L. N. Huy & Completed 51 owned use cases, functional specifications, canonical IDs and schema-aligned scope across five sprints. \\\\ \\hline');
write('sections/record_of_changes.tex',changes);

// Add a readable module-level traceability and gap register to the report.
const gapRows=[
 ['UC-18.01','Identity request uniqueness, confidential storage delivery and 5 MB/WebP validation remain acceptance gaps in the earlier audit. The AI UI accepts images and liveness; a manual PDF path needs separate UI verification.'],
 ['UC-19.02; UC-20.02','HTTP/HTTPS-only URL validation and database-length limits require enforcement. Industry/location and portfolio media are excluded from the agreed database scope.'],
 ['UC-20.01; UC-20.03','Public Freelancer social links and a confirmation step before deleting a social link require UI completion.'],
 ['UC-21.01--02','Favorites must consistently display new freelancers after a successful add and exclude invalid targets.'],
 ['All owned UCs','A complete SRS is not evidence of completed implementation. Repeat integration and browser acceptance tests on the latest dev revision before marking these requirements verified.'],
];
const trace=`\\subsection{Nhuy Requirement Traceability and Acceptance Scope}\n\\label{sec:nhuy-traceability}\nThe following register covers the 51 use cases owned by Nguyen Lu Nhat Huy across Sprints 1--5. Use-case identifiers follow the project UC catalog. The specifications state required behavior; the acceptance-gap register distinguishes requirements from verified implementation. Screen layouts are schematic descriptions rather than fabricated screenshots.\n\n\\begin{longtable}{|p{1.2cm}|p{2.5cm}|p{4.2cm}|p{5.8cm}|}\n\\hline\\rowcolor{headerbg}Sprint & UC group & Feature & Persistent entities \\\\ \\hline\n\\endfirsthead\n\\hline\\rowcolor{headerbg}Sprint & UC group & Feature & Persistent entities \\\\ \\hline\\endhead\n${Object.entries(modules).sort(([a],[b])=>Number(a)-Number(b)).map(([group,m])=>`${[...new Set(functions.filter(f=>f.group===group).map(f=>f.sprint))].join(', ')} & UC-${group} & ${tex(m.name)} & ${tex(m.entities)} \\\\ \\hline`).join('\n')}\n\\end{longtable}\n\n\\subsubsection{Acceptance Gaps Requiring Verification}\nThe following issues were identified in the earlier source/database audit. They are not asserted to be fixed by this documentation update. Revalidate them against the latest merged dev source.\n\\begin{flowtable}{UC}{Acceptance gap}\n${rows(gapRows)}\n\\end{flowtable}\n\n\\subsubsection{Schema and Identifier Conventions}\n${items(['Profile.id identifies a general profile; User.id identifies an account. FreelancerProfile.id identifies the professional subtype. The three identifiers are not interchangeable.','Client public profile routes and favorite/follow targets use User.id. Freelancer public profile routes use Profile.id.','Contract URLs use the current slug route, while review APIs accept Contract.id.','Portfolio scope is title, description, technologies and projectUrl. Client company scope is companyName, companyDescription and website.','CV upload is PDF-only, maximum 10 MB. Avatar upload is JPEG/PNG/WebP, maximum 5 MB. Identity-document acceptance rules are recorded independently from these limits.'])}`;
write('sections/3.Subsections/nhuy-traceability.tex',trace.replace('Screen layouts are schematic descriptions rather than fabricated screenshots.', `Screenshots are included for ${Object.keys(screenshots).length} captured functions and described as observed; remaining screen layouts are schematic descriptions awaiting capture.`).replace('\\begin{flowtable}{UC}{Acceptance gap}', '\\begin{specdatatable}{UC}{Acceptance gap}').replace('\\end{flowtable}', '\\end{specdatatable}'));
main=read('sections/3.Functional_Requirements.tex');
if(!main.includes('nhuy-traceability'))write('sections/3.Functional_Requirements.tex',main+'\n\\input{sections/3.Subsections/nhuy-traceability}\n');

// Shared business-rule registry: scoped entries use a distinct collision-free prefix.
let business=read('sections/5.Subsections/5.1.Business_Rules.tex');
business=business.replace(/BR-PORT-03 &[^\n]*/, 'BR-PORT-03 & Portfolio fields are limited to title, description, technologies and an optional HTTP/HTTPS project URL within the database limit. \\\\ \\hline');
const rules=Object.entries({...modules, CV: {rules: cvRules}}).flatMap(([group,m])=>m.rules.map((rule,i)=>`BR-NH-${group}-${String(i+1).padStart(2,'0')} & ${tex(rule)} \\\\ \\hline`)).join('\n');
business=business.replace(/% Nhuy -- Sprint 1--5 scoped rules[\s\S]*?(?=\\end\{longtable\})/, '');
business=business.replace('\\end{longtable}',`% Nhuy -- Sprint 1--5 scoped rules\n${rules}\n\\end{longtable}`);
write('sections/5.Subsections/5.1.Business_Rules.tex',business);

// Standalone review copy uses the same preamble and source files as the full report.
const screensPath='sections/3.Subsections/3.1.Subsections/3.1.2.Screen_Descriptions.tex';
let screens=read(screensPath);
const descriptions={
  9:'Public approved freelancer profile combining basic and professional details, active skills and portfolio items. Owner-only controls are hidden from other visitors.',
  10:'Public approved client profile with display name, company name, description, website and social links. Private account and identity fields are excluded.',
  15:'Freelancer settings for biography, professional title, education, certifications, languages, experience, availability and profile strength.',
  16:'Owner-only professional profile form; saves directly or submits a pending revision under the profile review policy.',
  18:'Skill-name input with catalog suggestions and a required proficiency level from 1 to 10.',
  20:'Owner-only PDF CV upload, maximum 10 MB, with file-content validation and progress feedback.',
  21:'Authorized CV view/download using the current file location; unavailable local files return a recoverable not-found response.',
  23:'Confirmation before clearing the current CV metadata and removing the attached file where storage permits.',
  24:'List of active portfolio entries with title, description and technologies; public view and owner-only management controls.',
  25:'Portfolio form with required title, optional description, technologies and an optional HTTP/HTTPS project URL. Media upload is outside the agreed schema scope.',
  26:'Active portfolio detail with title, full description, technologies and the external project link.',
  27:'Owner-only form to edit title, description, technologies and project URL of an active portfolio item.',
  54:'Contract-scoped review list available only to contract participants, including active responses and ratings.',
  57:'Author-only review form to update accepted rating and comment fields; contract participation and resource ownership remain enforced.',
  68:'Client company settings for company name, company description and website; public display uses approved data.',
  103:'Author-only form to update a submitted contract review using the validated review API.',
};
screens=screens.split(/\r?\n/).map(line=>{
  const match=line.match(/^(\d+) & ([^&]+) & ([^&]+) & /);
  return match && descriptions[match[1]] ? `${match[1]} & ${match[2]} & ${match[3]} & ${tex(descriptions[match[1]])} \\\\ \\hline` : line;
}).join('\n');
write(screensPath,screens);
const authPath='sections/3.Subsections/3.1.Subsections/3.1.3.Screen_Authorization.tex';
let authorization=read(authPath);
authorization=authorization.replace(/^24 & Portfolio List &.*$/m,'24 & Portfolio List & \\checkmark & \\checkmark & \\checkmark & \\\\ \\hline');
authorization=authorization.replace(/^54 & Review List &.*$/m,'54 & Review List & & \\checkmark & \\checkmark & \\\\ \\hline');
write(authPath,authorization);

let full=read('main.tex');
if(!full.includes('\\usepackage{needspace}')) {
  full=full.replace('\\usepackage{setspace}', '\\usepackage{setspace}\n\\usepackage{needspace}');
  write('main.tex',full);
}
const preamble=full.slice(0,full.indexOf('\\begin{document}'));
const specInputs=[`${specs}/sprint1/2.2.3.3.Profile_Management`,`${specs}/sprint1/2.2.3.4.Skills_Management`,`${specs}/sprint1/2.2.3.5.Portfolio_Management`,...Array.from({length:4},(_,i)=>`${specs}/sprint${i+2}/nhuy`)];
write('nhuy-report3.tex',`${preamble}\n\\begin{document}\n\\begin{center}\\Large\\textbf{FREVIA -- Report 3}\\par\\large Nguyen Lu Nhat Huy -- Sprints 1--5\\par\\normalsize Updated 08 November 2026\\end{center}\n\\tableofcontents\n\\newpage\n\\section{Use Case Specifications}\n\\subsection{Owned Use Cases}\n\\subsubsection{Sprint 1--5}\n${specInputs.map(p=>`\\input{${p}}`).join('\n')}\n\\section{Functional Requirements}\n${Array.from({length:5},(_,i)=>`\\input{sections/3.Subsections/sprint${i+1}/nhuy}`).join('\n')}\n\\input{sections/3.Subsections/nhuy-traceability}\n\\end{document}`);
write('nhuy-coverage.json',JSON.stringify({updated:'2026-11-08',count:functions.length,sprints:Array.from({length:5},(_,i)=>({sprint:i+1,count:bySprint(i+1).length})),functions},null,2));
console.log(JSON.stringify({useCases:functions.length,perSprint:Array.from({length:5},(_,i)=>bySprint(i+1).length)}));
