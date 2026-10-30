const { Diagram } = require('./generate-freelancer-sequences.cjs');
const diagrams = [];
function make(id, slug, title, account = false) {
  const controller = account ? 'GeneralAccountProfile' : 'Review';
  const domain = account ? 'AccountProfile' : 'Review';
  const d = new Diagram(id, slug, title, domain, true);
  d.names = ['Authenticated User', `:${controller}View`, `:${controller}Route`, `:${controller}Controller`, `:${domain}Service`, `:${domain}Repository`, ':PrismaService', 'Database'];
  diagrams.push(d); return d;
}
function participant(d) {
  d.query('requireContractParticipant: findContract(contractId)', 'contract.findFirst(id; deletedAt null; select participants, status, display names)', 'SELECT active contract and participants', 'Contract or null');
  d.stop('[contract missing]', '404 ReviewContractNotFoundException');
  d.stop('[userId is neither clientId nor freelancerId]', '403 ReviewForbiddenException');
}
function review(d) {
  d.query('findById(reviewId)', 'review.findFirst(id; deletedAt null; select review, reviewer, reviewee, response)', 'SELECT active Review with parties and response', 'Review or null');
  d.stop('[review missing or soft-deleted]', '404 ReviewNotFoundException');
}
function present(d) {
  d.msg(4, 4, 'present(review): convert Decimal overallRating to number; hide soft-deleted response as null');
}
let d = make('UC-39.01', 'view-review-list', 'View Review List');
d.start('list(userId, contractId)', 'GET /reviews/contracts/:contractId', 'Open reviews for a contract'); participant(d);
d.query('findManyByContract(contractId)', 'review.findMany(contractId; deletedAt null; createdAt desc; reviewSelect)', 'SELECT active reviews newest first with parties and responses', 'Review[]'); present(d);
d.finish('ReviewListDto', 'Display contract reviews or empty list');
d = make('UC-39.02', 'view-review-detail', 'View Review Detail');
d.start('detail(userId, reviewId)', 'GET /reviews/:reviewId', 'Open review detail'); review(d); participant(d); present(d);
d.finish('ReviewDto', 'Display rating, breakdown, comment and active response');
d = make('UC-39.03', 'write-review', 'Write Review');
d.start('create(userId, contractId, input)', 'POST /reviews/contracts/:contractId', 'Enter overallRating, optional breakdown and comment; Submit', true); participant(d);
d.stop('[contract.status != COMPLETED]', '400 ReviewContractNotCompletedException');
d.query('findByContractAndReviewer(contractId, userId)', 'review.findUnique(contractId_reviewerId; including deleted review)', 'SELECT review id for this contract and reviewer', 'Review id or null');
d.stop('[review already exists, including soft-deleted]', '409 ReviewAlreadyExistsException');
d.msg(4, 4, 'Choose the other participant as reviewee; use reviewer displayName or fallback');
d.query('create(contractId, userId, revieweeId, reviewerName, input)', '$transaction: review.create(reviewSelect); notification.create', 'INSERT Review; INSERT REVIEW_RECEIVED notification for reviewee; COMMIT', 'Created review');
d.frame('ref', 'On Prisma P2002 in create: transaction rolls back; return 409 ReviewAlreadyExistsException', () => { d.y += 35; });
present(d); d.finish('ReviewDto', 'Display created review', '201 Created');
for (const update of [true, false]) {
  d = make(update ? 'UC-39.04' : 'UC-39.05', update ? 'update-review' : 'delete-review', update ? 'Update Review' : 'Delete Review');
  d.start(update ? 'update(userId, reviewId, input)' : 'remove(userId, reviewId)', `${update ? 'PATCH' : 'DELETE'} /reviews/:reviewId`, update ? 'Edit review; Save' : 'Delete review', update); review(d);
  d.stop('[review.reviewerId != userId]', '403 ReviewForbiddenException');
  d.query(update ? 'update(reviewId, input)' : 'softDelete(reviewId)', update ? 'review.update(id; only provided overallRating, breakdown, comment; reviewSelect)' : 'review.update(id; deletedAt new Date())', update ? 'UPDATE provided review fields' : 'UPDATE Review.deletedAt (soft delete)', update ? 'Updated review' : 'Soft-deleted review');
  if (update) present(d);
  d.finish(update ? 'ReviewDto' : '{ message: ReviewMessage.DELETED }', update ? 'Display updated review' : 'Remove review from visible list');
}
d = make('UC-40.01', 'respond-to-review', 'Respond to Review');
d.start('respond(userId, reviewId, responseText)', 'POST /reviews/:reviewId/response', 'Enter response text; Submit', true); review(d);
d.stop('[review.revieweeId != userId]', '403 ReviewForbiddenException');
d.query('findResponseByReview(reviewId)', 'reviewResponse.findUnique(reviewId; select id, deletedAt)', 'SELECT response including soft-deleted record', 'Existing response or null');
d.stop('[existing response is not soft-deleted]', '409 ReviewResponseAlreadyExistsException');
d.msg(4, 4, 'Resolve responder displayName or CONTRACT_PARTICIPANT fallback');
d.alternative('[existing response is soft-deleted]', () => {
  d.query('createResponse(..., existingResponse.id)', '$transaction: reviewResponse.update(deletedAt null, userId, responseText); notification.create', 'RESTORE response; INSERT REVIEW_RESPONSE_RECEIVED notification for reviewer; COMMIT', 'Restored response with responder profile');
}, '[else: no existing response]', () => {
  d.query('createResponse(..., no deletedResponseId)', '$transaction: reviewResponse.create; notification.create', 'INSERT response; INSERT REVIEW_RESPONSE_RECEIVED notification for reviewer; COMMIT', 'Created response with responder profile');
});
d.frame('ref', 'On Prisma P2002 in createResponse: rollback; return 409 ReviewResponseAlreadyExistsException; other errors propagate', () => { d.y += 35; });
d.finish('ReviewResponseDto', 'Display response to review', '201 Created');
for (const update of [true, false]) {
  d = make(update ? 'UC-40.02' : 'UC-40.03', update ? 'update-review-response' : 'delete-review-response', update ? 'Update Review Response' : 'Delete Review Response');
  d.start(update ? 'updateResponse(userId, responseId, responseText)' : 'removeResponse(userId, responseId)', `${update ? 'PATCH' : 'DELETE'} /reviews/responses/:responseId`, update ? 'Edit response; Save' : 'Delete response', update);
  d.query('findResponseById(responseId)', 'reviewResponse.findFirst(id; deletedAt null; select id, reviewId, userId)', 'SELECT active review response', 'Response or null');
  d.stop('[response missing or soft-deleted]', '404 ReviewResponseNotFoundException');
  d.stop('[response.userId != userId]', '403 ReviewForbiddenException');
  d.query(update ? 'updateResponse(responseId, responseText)' : 'softDeleteResponse(responseId)', update ? 'reviewResponse.update(id; responseText; include user.profile)' : 'reviewResponse.update(id; deletedAt new Date())', update ? 'UPDATE responseText' : 'UPDATE ReviewResponse.deletedAt (soft delete)', update ? 'Updated response with responder profile' : 'Soft-deleted response');
  d.finish(update ? 'ReviewResponseDto' : '{ message: ReviewMessage.RESPONSE_DELETED }', update ? 'Display updated response' : 'Hide deleted response');
}
function general(d) {
  d.query('findGeneralProfile(userId)', 'user.findFirst(id; deletedAt null; select email, profile, roles by createdAt asc)', 'SELECT active user profile, email and assigned roles', 'User or null');
  d.stop('[user or profile missing]', '404 ProfileNotFoundException');
}
d = make('UC-41.01', 'view-profile', 'View Profile', true);
d.start('get(userId) -> getGeneralProfile(userId)', 'GET /account-profile', 'Open account profile settings'); general(d);
d.msg(4, 4, 'presentGeneralProfile: include email and roles; present local avatar URL with updatedAt version');
d.finish('GeneralProfileDto', 'Display current user profile, email, avatar and roles');
d = make('UC-41.02', 'update-profile', 'Update Profile', true);
d.start('update(userId, input) -> updateGeneralProfile(userId, input)', 'PUT /account-profile', 'Edit displayName and bio; Save', true); general(d);
d.msg(4, 4, 'Find primaryRole from assigned userRoles');
d.alternative('[primary CLIENT/FREELANCER AND profileCompletionPercent < 20]', () => {
  d.frame('ref', 'ProfileRevisionService.submitGeneral: choose CLIENT/FREELANCER revision; ProfileRevisionRepository reads snapshot and creates/updates PENDING revision in transaction; live profile unchanged', () => { d.y += 45; });
  d.msg(4, 4, 'Result: reviewRequired true, pending revision, original profileStrength');
}, '[else: direct update]', () => {
  d.query('updateGeneralProfile(userId, input, primaryRole if CLIENT/FREELANCER)', 'profile.findUniqueOrThrow(include role profiles and freelancer counts); profile.update', 'SELECT profile; calculate client/freelancer strength or preserve strength for other roles; UPDATE displayName, bio, completion percent', 'Updated profile');
  d.frame('opt', '[primary role is neither CLIENT nor FREELANCER]', () => {
    general(d);
  });
  d.msg(4, 4, 'ProfileRevisionService.directUpdateResult: reviewRequired false, revision null, profileStrength');
});
d.finish('ProfileRevisionSubmissionDto', 'Show submitted / updated message');
d = make('UC-41.03', 'change-password', 'Change Password', true);
d.start('changePassword(userId, input)', 'PUT /account-profile/password', 'Enter current password and new password; Submit', true);
d.query('findPasswordCredential(userId)', 'user.findFirst(id; deletedAt null; select password and profile id)', 'SELECT current password hash and profile existence', 'Credential or null');
d.stop('[user or profile missing]', '404 ProfileNotFoundException');
d.stop('[user has no password credential]', '400 PasswordUnavailableException');
d.frame('ref', 'HashingService.verify(input.currentPassword, user.password)', () => { d.y += 35; });
d.stop('[current password does not match]', '400 CurrentPasswordIncorrectException');
d.frame('ref', 'HashingService.hash(input.newPassword): produce new password hash', () => { d.y += 35; });
d.query('updatePassword(userId, passwordHash)', 'user.update(id; password: passwordHash)', 'UPDATE User.password with new hash', 'Updated user');
d.finish('{ message: Password changed successfully. }', 'Clear password inputs; show success');
d = make('UC-41.04', 'upload-avatar', 'Upload Avatar', true);
d.start('uploadAvatar(userId, file)', 'POST /account-profile/avatar', 'Select avatar image; Upload multipart file', true); general(d);
d.stop('[file missing]', '400 AvatarFileRequiredException');
d.msg(4, 4, 'detectAvatarType(file.buffer): recognize JPEG / PNG / WEBP magic bytes');
d.stop('[unrecognized format OR detected MIME != declared MIME OR size > 5 MB]', '400 AvatarFileInvalidException');
d.alternative('[CloudinaryService.isConfigured()]', () => {
  d.frame('ref', 'CloudinaryService.uploadFile(file, frevia/avatars/userId): return secure_url', () => { d.y += 35; });
}, '[else: local storage]', () => {
  d.frame('ref', 'mkdir/writeFile: uploads/avatars/userId/UUID + detected extension; build local:// URL', () => { d.y += 35; });
});
d.query('updateAvatar(userId, avatarUrl)', 'profile.update(userId; avatarUrl; select avatarUrl, updatedAt)', 'UPDATE Profile.avatarUrl', 'Updated avatar metadata');
d.msg(4, 4, 'presentAvatarUrl: use remote URL or local proxy /account-profile/avatar/:userId/file?v=updatedAt');
d.finish('AvatarUploadResponseDto { avatarUrl }', 'Display new avatar; invalidate me query; show success', '201 Created');
for (const diagram of diagrams) diagram.save();
