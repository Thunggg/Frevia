const { Diagram } = require('./generate-freelancer-sequences.cjs');
const diagrams = [];
function make(id, slug, title, controller, domain, actor) {
  const d = new Diagram(id, slug, title, domain, true);
  d.names = [actor, `:${controller.replace('Controller', 'View')}`, `:${controller.replace('Controller', 'Route')}`, `:${controller}`, `:${domain}Service`, `:${domain}Repository`, ':PrismaService', 'Database'];
  diagrams.push(d); return d;
}
const admin = (id, slug, title) => make(id, slug, title, 'ProfileRevisionAdminController', 'ProfileRevision', 'Administrator');
function revision(d) {
  d.query('findById(id)', 'profileRevision.findUnique(id; revisionSelect)', 'SELECT revision with user/admin identity and snapshot data', 'Revision or null');
  d.stop('[revision missing]', '404 ProfileRevisionNotFoundException');
}
function list(d, status) {
  d.start('list(filter)', `GET /admin/profile-revisions?status=${status}&page=&limit=&profileType=&search=`, status === 'PENDING' ? 'Open pending profile requests' : 'Open request history; choose ALL, APPROVED or REJECTED');
  d.query('syncLowStrengthProfiles(20)', 'profile.findMany(strength <20; active non-banned users with primary CLIENT/FREELANCER/EXPERT); $transaction', 'SELECT candidates; for each user/type create snapshot PENDING revision only if no revision of any status exists', 'Synchronization complete');
  d.query('findMany({page, limit, status, profileType, search})', '$transaction: profileRevision.findMany(skip, take, createdAt desc); profileRevision.count(same filters)', 'SELECT matching revisions and COUNT; search email/displayName case-insensitive', '{ revisions, total }');
  d.msg(4, 4, 'Build pagination: page, limit, total, totalPages=ceil(total/limit)');
  d.finish('ProfileRevisionAdminListDto', status === 'PENDING' ? 'Display pending request list or empty state' : 'Display history with status, admin, review notes and reviewed time');
}
let d = admin('UC-47.01', 'view-pending-profile-update-request-list', 'View Pending Profile Update Request List'); list(d, 'PENDING');
d = admin('UC-47.02', 'view-profile-update-request-detail', 'View Profile Update Request Detail');
d.start('detail(id)', 'GET /admin/profile-revisions/:id', 'Open profile update request'); revision(d);
d.finish('ProfileRevisionDetailDto', 'Display currentData, proposedData, profile type, strength and review information');
for (const approve of [true, false]) {
  const action = approve ? 'approve' : 'reject';
  const status = approve ? 'APPROVED' : 'REJECTED';
  d = admin(approve ? 'UC-47.03' : 'UC-47.04', `${action}-profile-update-request`, approve ? 'Approve Profile Update Request' : 'Reject Profile Update Request');
  d.start(`${action}(id, adminId, reviewNotes) -> review(...)`, `PATCH /admin/profile-revisions/:id/${action}`, approve ? 'Approve request; optional review notes' : 'Enter rejection reason; Reject', true); revision(d);
  d.stop('[revision.status != PENDING]', '409 ProfileRevisionAlreadyReviewedException');
  d.msg(4, 4, 'Trim reviewNotes; parse proposedData with schema selected by FREELANCER / CLIENT / EXPERT');
  d.frame('ref', 'ProfileRevisionRepository.review: all claim, profile, notification and final-read operations below are one interactive Prisma transaction', () => { d.y += 40; });
  d.query(`review: claim PENDING revision as ${status}`, `transaction.profileRevision.updateMany(id; status PENDING -> ${status}; adminId, reviewNotes, reviewedAt)`, 'Conditional UPDATE pending revision; prevents concurrent double review', '{ count }');
  d.stop('[claim count == 0: repository returns null]', '409 ProfileRevisionAlreadyReviewedException');
  d.query('review: load target profile and user', 'transaction.profileRevision.findUniqueOrThrow(id; select profileId,userId)', 'SELECT revision profileId and userId', 'Revision target');
  if (approve) {
    d.query('review: apply proposedData by profileType', 'transaction.profile.update; freelancerProfile / clientProfile / expert.upsert', 'UPDATE base Profile; UPSERT matching role profile with approved fields', 'Updated role profile');
    d.query('review: recompute completion strength', 'transaction.profile.findUniqueOrThrow(include role profiles, skill/active portfolio counts); profile.update', 'SELECT updated profile; calculate role-specific strength; UPDATE profileCompletionPercent', 'Updated strength');
  } else {
    d.msg(4, 4, 'Reject leaves live profile data and completion strength unchanged');
  }
  d.query('review: notify owner and return result', 'transaction.notification.create; profileRevision.findUnique(revisionSelect)', `INSERT SYSTEM_ANNOUNCEMENT kind PROFILE_${approve ? 'APPROVED' : 'REJECTED'}; SELECT reviewed revision; COMMIT`, 'Reviewed revision');
  d.finish('ProfileRevisionDetailDto', 'Display reviewed request; refresh administrative list');
}
d = admin('UC-47.05', 'view-profile-update-request-history', 'View Profile Update Request History'); list(d, 'APPROVED or REJECTED (omit for ALL)');
d = make('UC-47.06', 'update-profile-expert', 'Update Profile Expert', 'ExpertProfileController', 'ExpertProfile', 'Expert');
d.start('updateMine(userId, input) -> submitUpdate(userId, input)', 'PUT /expert-profile/me', 'Edit expert profile; Submit', true);
d.query('context: findByUserId(userId)', 'user.findFirst(id; deletedAt null; include expert profile and active roles)', 'SELECT active user, expert profile and roles', 'User or null');
d.stop('[user or base profile missing]', '404 ExpertProfileNotFoundException');
d.stop('[user lacks active EXPERT role]', '403 NotAnExpertAccountException');
d.query('hasPendingRevision(userId)', 'profileRevision.findFirst(userId; profileType EXPERT; status PENDING)', 'SELECT pending expert revision', 'Revision id or null');
d.stop('[pending expert revision exists]', '409 ExpertProfilePendingRevisionException');
d.msg(4, 4, 'sanitize: trim and deduplicate expertise/education/certifications; normalize website; calculateExpertProfileStrength');
d.frame('ref', 'ProfileRevisionService.submitExpert: ProfileRevisionRepository.findProfileForSnapshot; submit transaction creates/updates PENDING EXPERT revision; live profile unchanged, regardless of strength', () => { d.y += 50; });
d.finish('ExpertProfileUpdateResponseDto (reviewRequired true)', 'Show request submitted for review');
function cv(id, slug, title) { return make(id, slug, title, 'ProfileController', 'Profile', 'Freelancer'); }
function owner(d) {
  d.query('getOwnedFreelancerProfile: findFreelancerProfileById(profileId)', 'profile.findFirst(id); fallback findFirst(userId); include freelancerProfile and roles', 'SELECT profile of non-deleted user with freelancer data and roles', 'Profile or null');
  d.stop('[profile missing OR user lacks FREELANCER role]', '404 FreelancerProfileNotFoundException');
  d.stop('[profile.userId != currentUserId]', '403 ProfileForbiddenException');
}
for (const replace of [false, true]) {
  d = cv(replace ? 'UC-07.05' : 'UC-07.03', replace ? 'replace-cv' : 'upload-cv', replace ? 'Replace CV' : 'Upload CV');
  d.start('uploadCv(profileId, currentUserId, file)', 'POST /profiles/:id/cv', replace ? 'Choose replacement PDF; Upload' : 'Choose PDF CV; Upload', true); owner(d);
  d.stop('[file missing]', '400 CvFileRequiredException');
  d.stop('[MIME != application/pdf OR first bytes != %PDF- OR size >10 MB]', '400 CvFileInvalidException');
  d.alternative('[Cloudinary configured]', () => {
    d.frame('ref', 'CloudinaryService.uploadFile(file, frevia/cvs/userId): secure_url and public_id', () => { d.y += 35; });
  }, '[else: local filesystem]', () => {
    d.frame('ref', 'mkdir/writeFile uploads/cvs/userId/UUID.pdf; cvUrl=local://path; cvPublicId=null', () => { d.y += 35; });
  });
  d.query('updateCv(profile.id, {cvUrl, cvFileName, cvPublicId})', 'freelancerProfile.upsert(profileId; CV metadata and cvUploadedAt=new Date())', 'UPSERT new CV metadata into FreelancerProfile', 'Stored CV metadata');
  d.frame('opt', '[previous CV has cvPublicId OR local:// URL]', () => {
    d.frame('ref', 'After new metadata saved: Cloudinary.deleteFile(old publicId), else resolve safe local path and unlink(old file). Cleanup errors are ignored.', () => { d.y += 40; });
  });
  d.msg(4, 4, 'Return local proxy URL /api/backend/profiles/:id/cv/file or remote cvUrl, plus cvFileName');
  d.finish('CvUploadResponseDto { cvUrl, cvFileName }', 'Display stored CV filename and link', '201 Created');
}
d = cv('UC-07.04', 'view-cv', 'View CV');
d.start('getCvFile(profileId, currentUserId)', 'GET /profiles/:id/cv/file', 'Open CV file link'); owner(d);
d.stop('[CV URL missing]', '404 CvNotFoundException');
d.alternative('[remote cvUrl]', () => {
  d.msg(4, 3, '{ remoteUrl, fileName }', true);
  d.msg(3, 2, 'response.redirect(remoteUrl)', true);
  d.msg(2, 1, '302 Found: remote CV URL', true);
}, '[else: local:// CV URL]', () => {
  d.msg(4, 4, 'resolveLocalCvPath: resolve under uploads root; reject traversal or absolute escape');
  d.stop('[resolved path invalid]', '404 CvNotFoundException');
  d.msg(4, 3, '{ absolutePath, fileName }', true);
  d.frame('ref', 'Controller: Content-Disposition attachment with sanitized filename; Content-Type application/pdf; StreamableFile(createReadStream(path))', () => { d.y += 40; });
  d.msg(3, 2, 'Return CV file stream', true);
  d.msg(2, 1, '200 OK: PDF stream', true);
});
d.msg(1, 0, 'Browser follows remote redirect or receives PDF download', true);
d = cv('UC-07.06', 'delete-cv', 'Delete CV');
d.start('deleteCv(profileId, currentUserId)', 'DELETE /profiles/:id/cv', 'Delete uploaded CV'); owner(d);
d.stop('[CV URL missing]', '404 CvNotFoundException');
d.frame('ref', 'If cvPublicId: Cloudinary.deleteFile; else if local://: resolve safe path and unlink. Cleanup errors ignored; metadata clear follows.', () => { d.y += 45; });
d.query('clearCv(profile.id)', 'freelancerProfile.update(profileId; CV fields null)', 'SET cvUrl, cvFileName, cvPublicId, cvUploadedAt to NULL', 'Cleared CV metadata');
d.finish('{ message: CV deleted successfully. }', 'Clear displayed CV filename and link; show success');
for (const diagram of diagrams) diagram.save();
