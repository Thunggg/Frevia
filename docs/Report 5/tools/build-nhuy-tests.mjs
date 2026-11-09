// Generate readable Jest cases and the matching matrix catalogue from one source.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const root = path.resolve(import.meta.dirname, "../../..");
const require = createRequire(path.join(root, "apps/api/package.json"));
const shared = require("@shared/types");
const ts = require("typescript");
const groups = [];
let next = 122;
const q = JSON.stringify;
const literal = (value) =>
  q(value).replace(/"(x{80,})"/g, (_, s) => `'x'.repeat(${s.length})`);
const suites = {};
function suite(key, cls, source, setup) {
  const serviceText = fs.readFileSync(
    path.join(root, "apps/api/src/routes", source + ".service.ts"),
    "utf8",
  );
  const methods = [
    ...new Set(
      [
        ...serviceText.matchAll(
          /this\.(?:repository|profileRepository|portfolioRepository|authRepository)\s*\.\s*(\w+)\s*\(/g,
        ),
      ].map((m) => m[1]),
    ),
  ];
  suites[key] = { key, cls, source, setup, methods };
}
function group(key, method, uc, module, endpoint, defaults = {}) {
  const id = `UF-${next++}`;
  const g = {
    id,
    key,
    method,
    uc: uc.split(" "),
    module,
    endpoint,
    defaults,
    cases: [],
  };
  groups.push(g);
  return g;
}
function add(
  g,
  name,
  arrange,
  assertion,
  inputs = {},
  type = "N",
  confirm = name,
) {
  const c = {
    id: `UTCID${String(g.cases.length + 1).padStart(2, "0")}`,
    name,
    arrange,
    assertion,
    inputs: { ...g.defaults, ...inputs },
    type,
    confirm,
  };
  g.cases.push(c);
  return c;
}
function ok(
  g,
  name,
  arrange,
  action,
  expected,
  inputs = {},
  type = "N",
  checks = "",
) {
  return add(
    g,
    name,
    arrange,
    `const result = await ${action};\nexpect(result).toEqual(${expected});\n${checks}`,
    inputs,
    type,
    `Returns ${expected}`,
  );
}
function errorInfo(source, factory) {
  const sourcePath = path.join(
    root,
    "apps/api/src/routes",
    source + ".error.ts",
  );
  const js = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "exports", "module", js)(require, mod.exports, mod);
  const e = mod.exports[factory]();
  return { status: e.getStatus(), response: e.getResponse() };
}
function bad(
  g,
  name,
  arrange,
  action,
  factory,
  inputs = {},
  checks = "",
  source = suites[g.key].source,
) {
  const info = errorInfo(source, factory);
  const c = add(
    g,
    name,
    arrange,
    `await expect(${action}).rejects.toMatchObject({status: ${info.status}, response: ${q(info.response)}});\n${checks}`,
    inputs,
    "A",
    `HTTP ${info.status}. ${q(info.response)}`,
  );
  c.http = info.status;
  return c;
}
const person = `const profile = {id:5,userId:10,bio:'Existing bio',profileCompletionPercent:80,freelancerProfile:{id:7,education:['University'],certifications:[],languages:[],experience:[]},user:{userRoles:[{role:{name:'Freelancer'}}]}};`;
suite(
  "profiles",
  "ProfileService",
  "profiles/profile",
  `${person}
repository.findFreelancerProfileById.mockResolvedValue(profile);
repository.updateFreelancerProfile.mockResolvedValue({profileCompletionPercent:80});
repository.findSkillsByProfileId.mockResolvedValue([]);
repository.findOrCreateCatalogSkill.mockResolvedValue({id:3,name:'TypeScript'});
repository.findSkillByProfileIdAndSkillId.mockResolvedValue(null);
repository.addSkillToProfile.mockResolvedValue({id:11,skillId:3,proficiencyLevel:5});
repository.findSkillById.mockResolvedValue({id:11,freelancerProfile:{profile:{id:5,userId:10}}});
repository.deleteSkill.mockResolvedValue({id:11});`,
);
const accountUser = `{id:10,email:'client@example.test',profile:{id:5,userId:10,displayName:' Client ',profileCompletionPercent:80,avatarUrl:null,updatedAt:new Date('2026-11-09T00:00:00Z')},userRoles:[{isPrimary:true,role:{name:'Client'}}]}`;
suite(
  "account",
  "AccountProfileService",
  "account-profile/account-profile",
  `const user = ${accountUser};
repository.findUserWithRoles.mockImplementation(async (id:number)=>id===10?user:{...user,id,profile:{...user.profile,userId:id},userRoles:[{role:{name:'Freelancer'}}]});
repository.findGeneralProfile.mockResolvedValue(user);
repository.findPasswordCredential.mockResolvedValue({profile:{id:5},password:'old-hash'});
repository.findClientProfile.mockResolvedValue({id:5,user:{userRoles:[{role:{name:'Client'}}]},clientProfile:{id:8}});
repository.findSocialLinks.mockResolvedValue([]);
repository.findSocialLinkByPlatform.mockResolvedValue(null);
repository.createSocialLink.mockResolvedValue({id:4,platform:'GITHUB',url:'https://github.com/test'});
repository.findSocialLinkById.mockResolvedValue({id:4,profile:{userId:10}});
repository.findFavorites.mockResolvedValue([]);repository.findFollowing.mockResolvedValue([]);
repository.findFavorite.mockResolvedValue(null);repository.findFollow.mockResolvedValue(null);
repository.findIdentityDocuments.mockResolvedValue([]);
repository.updateClientProfile.mockResolvedValue({profileCompletionPercent:80});
repository.updateGeneralProfile.mockResolvedValue({profileCompletionPercent:80});
repository.updateAvatar.mockResolvedValue({updatedAt:new Date('2026-11-09T00:00:00Z')});
repository.createIdentityDocument.mockResolvedValue({id:4,fileUrl:'https://cdn.test/id.pdf'});
hashing.verify.mockResolvedValue(true);hashing.hash.mockResolvedValue('new-hash');`,
);
suite(
  "portfolios",
  "PortfolioService",
  "portfolios/portfolio",
  `${person}
repository.findFreelancerProfileById.mockResolvedValue(profile);
repository.findPortfoliosByFreelancerProfileId.mockResolvedValue([]);
repository.findPortfolioById.mockResolvedValue({id:11,title:'Project'});
repository.findPortfolioWithProfile.mockResolvedValue({id:11,freelancerProfile:{profile:{userId:10}}});
repository.addPortfolioToProfile.mockResolvedValue({id:11,title:'Project'});
repository.updatePortfolio.mockResolvedValue({id:11,title:'Updated'});`,
);
suite(
  "reviews",
  "ReviewService",
  "reviews/review",
  `const contract={id:20,clientId:10,freelancerId:30,status:'COMPLETED',client:{profile:{displayName:'Client'}},freelancer:{profile:{displayName:'Freelancer'}}};
const review={id:11,contractId:20,reviewerId:10,revieweeId:30,overallRating:new Prisma.Decimal(4.5),response:null,reviewee:{profile:{displayName:'Freelancer'}}};
repository.findContract.mockResolvedValue(contract);repository.findManyByContract.mockResolvedValue([review]);
repository.findById.mockResolvedValue(review);repository.findByContractAndReviewer.mockResolvedValue(null);
repository.create.mockResolvedValue(review);repository.update.mockResolvedValue(review);
repository.findResponseByReview.mockResolvedValue(null);repository.createResponse.mockResolvedValue({id:40,responseText:'Thank you'});
repository.findResponseById.mockResolvedValue({id:40,userId:30});repository.updateResponse.mockResolvedValue({id:40,responseText:'Updated'});`,
);
suite(
  "notifications",
  "NotificationService",
  "notifications/notification",
  `repository.findAll.mockResolvedValue([]);repository.findById.mockResolvedValue({id:11,userId:10,isRead:false});repository.markRead.mockResolvedValue({id:11,isRead:true});repository.markAllRead.mockResolvedValue({count:2});`,
);
suite(
  "revisions",
  "ProfileRevisionService",
  "profile-revisions/profile-revision",
  `const revision={id:11,status:'PENDING',profileType:'CLIENT',proposedData:{displayName:'Client',companyName:'Company'},userId:10};
repository.findById.mockResolvedValue(revision);repository.review.mockResolvedValue({...revision,status:'APPROVED'});
repository.findMany.mockResolvedValue({revisions:[revision],total:11});
repository.findLatestForUser.mockResolvedValue(null);
repository.findProfileForSnapshot.mockResolvedValue({id:5,displayName:'Client',bio:null,availabilityStatus:'AVAILABLE',clientProfile:{companyName:'Old'},freelancerProfile:null,expertProfile:null});
repository.submit.mockResolvedValue({id:11,status:'PENDING'});`,
);
suite(
  "expert",
  "ExpertProfileService",
  "expert-profile/expert-profile",
  `const expertUser={id:10,profile:{id:5,displayName:'Expert',avatarUrl:null,bio:null,profileCompletionPercent:30,expertProfile:null},userRoles:[{role:{name:'Expert'}}]};
repository.findByUserId.mockResolvedValue(expertUser);repository.hasPendingRevision.mockResolvedValue(false);`,
);
suite(
  "roles",
  "AuthService",
  "auth/auth",
  `repository.switchPrimaryRole.mockResolvedValue({id:3,name:'Freelancer'});repository.joinRole.mockResolvedValue({status:'joined',role:{id:3,name:'Freelancer'}});token.signAccessToken.mockResolvedValue('access-token');`,
);

const owner = {
  profileId: 5,
  currentUserId: 10,
  profile: "present",
  role: "Freelancer",
  ownerId: 10,
};
let g = group(
  "profiles",
  "viewProfile",
  "UC-07.01",
  "Freelancer Profile",
  "GET /profiles/5",
  { profileId: 5, profile: "present", role: "Freelancer" },
);
ok(g, "returns a freelancer profile", "", "service.viewProfile(5)", "profile");
for (const [name, arr, inp] of [
  [
    "missing profile",
    "repository.findFreelancerProfileById.mockResolvedValue(null);",
    { profile: "null" },
  ],
  [
    "non-freelancer profile",
    "repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});",
    { role: "empty" },
  ],
])
  bad(
    g,
    `rejects a ${name}`,
    arr,
    "service.viewProfile(5)",
    "FreelancerProfileNotFoundException",
    inp,
  );
g = group(
  "profiles",
  "updateProfile",
  "UC-07.02",
  "Freelancer Profile",
  "PUT /profiles/5",
  owner,
);
const profileInput = "{displayName:'Name',title:'Engineer'}";
ok(
  g,
  "updates an owned profile and preserves omitted fields",
  "",
  `service.updateProfile(5,10,${profileInput})`,
  "{message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null}",
  {},
  "N",
  "expect(repository.updateFreelancerProfile).toHaveBeenCalledWith(5,expect.objectContaining({bio:'Existing bio',education:['University']}));expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:'UPSERT',documentType:'CV',documentId:5});",
);
ok(
  g,
  "submits a weak profile for manual review",
  "revisions.requiresManualReview.mockReturnValue(true);",
  `service.updateProfile(5,10,${profileInput})`,
  "{reviewRequired:true}",
  { reviewRequired: true },
  "N",
  "expect(repository.updateFreelancerProfile).not.toHaveBeenCalled();expect(revisions.submitFreelancer).toHaveBeenCalled();",
);
bad(
  g,
  "rejects updating another account",
  "",
  `service.updateProfile(5,99,${profileInput})`,
  "ProfileForbiddenException",
  { currentUserId: 99 },
  "expect(repository.updateFreelancerProfile).not.toHaveBeenCalled();",
);
for (const m of ["updateProfile", "getSkills", "addSkill"]) {
  const target =
    m === "updateProfile"
      ? g
      : group(
          "profiles",
          m,
          m === "getSkills" ? "UC-08.01" : "UC-08.02",
          "Freelancer Skills",
          m === "getSkills"
            ? "GET /profiles/5/skills"
            : "POST /profiles/5/skills",
          owner,
        );
  const action =
    m === "getSkills"
      ? "service.getSkills(5)"
      : m === "addSkill"
        ? "service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})"
        : `service.updateProfile(5,10,${profileInput})`;
  for (const missing of [true, false])
    bad(
      target,
      missing
        ? "rejects a missing profile"
        : "rejects a profile without freelancer membership",
      `repository.findFreelancerProfileById.mockResolvedValue(${missing ? "null" : "{...profile,user:{userRoles:[]}}"});`,
      action,
      "FreelancerProfileNotFoundException",
      missing ? { profile: "null" } : { role: "empty" },
    );
  if (m === "getSkills") {
    ok(target, "returns an empty skill list", "", action, "[]");
    ok(
      target,
      "returns existing skills",
      "repository.findSkillsByProfileId.mockResolvedValue([{id:11,skillId:3}]);",
      action,
      "[{id:11,skillId:3}]",
      { skills: "present" },
    );
  }
  if (m === "addSkill") {
    ok(
      target,
      "adds the canonical catalog skill",
      "",
      action,
      "{id:11,skillId:3,proficiencyLevel:5}",
      {},
      "N",
      "expect(repository.addSkillToProfile).toHaveBeenCalledWith(5,3,5);expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:'UPSERT',documentType:'CV',documentId:5});",
    );
    bad(
      target,
      "rejects adding to another account",
      "",
      action.replace("(5,10,", "(5,99,"),
      "ProfileForbiddenException",
      { currentUserId: 99 },
      "expect(repository.findOrCreateCatalogSkill).not.toHaveBeenCalled();",
    );
    bad(
      target,
      "rejects an existing skill",
      "repository.findSkillByProfileIdAndSkillId.mockResolvedValue({id:11});",
      action,
      "FreelancerSkillDuplicateException",
      { existingSkill: "present" },
      "expect(repository.addSkillToProfile).not.toHaveBeenCalled();",
    );
    bad(
      target,
      "maps a concurrent duplicate insertion",
      "repository.addSkillToProfile.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));",
      action,
      "FreelancerSkillDuplicateException",
      { repositoryError: "P2002" },
    );
    add(
      target,
      "propagates an unexpected repository error",
      "const failure=new Error('database offline');repository.addSkillToProfile.mockRejectedValue(failure);",
      `await expect(${action}).rejects.toBe(failure);`,
      { repositoryError: "database offline" },
      "A",
      "Propagates the original repository error",
    );
  }
}
g = group(
  "profiles",
  "deleteSkill",
  "UC-08.03",
  "Freelancer Skills",
  "DELETE /profiles/skills/11",
  { skillId: 11, currentUserId: 10, skill: "present", ownerId: 10 },
);
ok(
  g,
  "deletes an owned skill",
  "",
  "service.deleteSkill(11,10)",
  "{id:11}",
  {},
  "N",
  'expect(repository.deleteSkill).toHaveBeenCalledWith(11);expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:"UPSERT",documentType:"CV",documentId:5});',
);
bad(
  g,
  "rejects a missing skill",
  "repository.findSkillById.mockResolvedValue(null);",
  "service.deleteSkill(11,10)",
  "FreelancerSkillNotFoundException",
  { skill: "null" },
);
bad(
  g,
  "rejects deleting another account skill",
  "",
  "service.deleteSkill(11,99)",
  "SkillForbiddenException",
  { currentUserId: 99 },
  "expect(repository.deleteSkill).not.toHaveBeenCalled();",
);

const portfolios = [
  [
    "getPortfolios",
    "UC-09.01",
    "GET /profiles/5/portfolios",
    "service.getPortfolios(5)",
    "[]",
    "findFreelancerProfileById",
  ],
  [
    "addPortfolio",
    "UC-09.02",
    "POST /profiles/5/portfolios",
    "service.addPortfolio(5,10,{title:'Project'})",
    "{id:11,title:'Project'}",
    "findFreelancerProfileById",
  ],
  [
    "getPortfolioDetail",
    "UC-09.03",
    "GET /profiles/portfolios/11",
    "service.getPortfolioDetail(11)",
    "{id:11,title:'Project'}",
    "findPortfolioById",
  ],
  [
    "updatePortfolio",
    "UC-09.04",
    "PUT /profiles/portfolios/11",
    "service.updatePortfolio(11,10,{title:'Updated'})",
    "{id:11,title:'Updated'}",
    "findPortfolioWithProfile",
  ],
  [
    "deletePortfolio",
    "UC-09.05",
    "DELETE /profiles/portfolios/11",
    "service.deletePortfolio(11,10)",
    "{message:shared.PortfolioMessage.PORTFOLIO_DELETED}",
    "findPortfolioWithProfile",
  ],
];
for (const [method, uc, ep, act, expected, find] of portfolios) {
  g = group("portfolios", method, uc, "Portfolio", ep, {
    id: method.includes("Portfolios") ? 5 : 11,
    record: "present",
    ownerId: 10,
    currentUserId: 10,
  });
  ok(g, `returns the expected result for ${method}`, "", act, expected);
  bad(
    g,
    "rejects a missing record",
    `repository.${find}.mockResolvedValue(null);`,
    act,
    find === "findFreelancerProfileById"
      ? "FreelancerProfileNotFoundException"
      : "PortfolioNotFoundException",
    { record: "null" },
  );
  if (["addPortfolio", "updatePortfolio", "deletePortfolio"].includes(method))
    bad(
      g,
      "rejects another portfolio owner",
      "",
      act.replace(",10", ",99"),
      "PortfolioForbiddenException",
      { currentUserId: 99 },
      `expect(repository.${method === "addPortfolio" ? "addPortfolioToProfile" : method}).not.toHaveBeenCalled();`,
    );
  if (find === "findFreelancerProfileById")
    bad(
      g,
      "rejects a profile without freelancer membership",
      "repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});",
      act,
      "FreelancerProfileNotFoundException",
      { role: "Client" },
    );
  if (method === "getPortfolios")
    ok(
      g,
      "returns an empty list before the freelancer subprofile exists",
      "repository.findFreelancerProfileById.mockResolvedValue({...profile,freelancerProfile:null});",
      act,
      "[]",
      { freelancerProfile: "null" },
    );
  const factory =
    method === "updatePortfolio"
      ? "UnableToUpdatePortfolioException"
      : method === "deletePortfolio"
        ? "UnableToDeletePortfolioException"
        : "UnableToLoadPortfoliosException";
  bad(
    g,
    "maps an unexpected repository failure",
    `repository.${find}.mockRejectedValue(new Error('database offline'));`,
    act,
    factory,
    { repositoryError: "database offline" },
  );
}

// Role checks belong to AccountProfileService. JWT/RBAC are tested separately.
function roleFailures(target, action, role = "CLIENT") {
  bad(
    target,
    "rejects a missing account",
    "repository.findUserWithRoles.mockResolvedValue(null);",
    action,
    "ProfileNotFoundException",
    { account: "null" },
  );
  bad(
    target,
    `rejects an account without ${role} membership`,
    "repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});",
    action,
    "AccountProfileForbiddenException",
    { role: "empty" },
  );
}
g = group(
  "account",
  "getClientProfile",
  "UC-19.01",
  "Client Profile",
  "GET /clients/10",
  { userId: 10, clientProfile: "present", role: "Client" },
);
ok(
  g,
  "returns the client profile",
  "",
  "service.getClientProfile(10)",
  "{id:5,user:{userRoles:[{role:{name:'Client'}}]},clientProfile:{id:8}}",
);
for (const [value, field] of [
  ["null", "profile"],
  ["{user:{userRoles:[]},clientProfile:{id:8}}", "role"],
  [
    "{user:{userRoles:[{role:{name:'Client'}}]},clientProfile:null}",
    "clientProfile",
  ],
])
  bad(
    g,
    `rejects a missing ${field}`,
    `repository.findClientProfile.mockResolvedValue(${value});`,
    "service.getClientProfile(10)",
    "ClientProfileNotFoundException",
    { [field]: "null" },
  );
g = group(
  "account",
  "updateClientProfile",
  "UC-19.02",
  "Client Profile",
  "PUT /clients/me/profile",
  { userId: 10, account: "present", role: "Client", reviewRequired: false },
);
const clientAct = "service.updateClientProfile(10,{companyName:'Company'})";
ok(
  g,
  "updates company information directly",
  "",
  clientAct,
  "{message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null}",
);
ok(
  g,
  "queues company information for manual review",
  "revisions.requiresManualReview.mockReturnValue(true);",
  clientAct,
  "{reviewRequired:true}",
  { reviewRequired: true },
  "N",
  "expect(repository.updateClientProfile).not.toHaveBeenCalled();",
);
roleFailures(g, clientAct);
g = group(
  "account",
  "getSocialLinks",
  "UC-20.01",
  "Social Links",
  "GET /social-links",
  { userId: 10, links: "empty" },
);
ok(
  g,
  "returns an empty social link list",
  "",
  "service.getSocialLinks(10)",
  "[]",
);
bad(
  g,
  "rejects a missing social profile",
  "repository.findSocialLinks.mockResolvedValue(null);",
  "service.getSocialLinks(10)",
  "ProfileNotFoundException",
  { links: "null" },
);
g = group(
  "account",
  "addSocialLink",
  "UC-20.02",
  "Social Links",
  "POST /social-links",
  { userId: 10, profile: "present", duplicate: false },
);
const socialAct =
  "service.addSocialLink(10,{platform:'GITHUB',url:'https://github.com/test'})";
ok(
  g,
  "creates a social link",
  "",
  socialAct,
  "{id:4,platform:'GITHUB',url:'https://github.com/test'}",
  {},
  "N",
  "expect(repository.createSocialLink).toHaveBeenCalledWith(10,{platform:'GITHUB',url:'https://github.com/test'});",
);
bad(
  g,
  "rejects a missing profile",
  "repository.findSocialLinks.mockResolvedValue(null);",
  socialAct,
  "ProfileNotFoundException",
  { profile: "null" },
);
bad(
  g,
  "rejects a duplicate platform",
  "repository.findSocialLinkByPlatform.mockResolvedValue({id:4});",
  socialAct,
  "SocialLinkDuplicateException",
  { duplicate: true },
  "expect(repository.createSocialLink).not.toHaveBeenCalled();",
);
g = group(
  "account",
  "deleteSocialLink",
  "UC-20.03",
  "Social Links",
  "DELETE /social-links/4",
  { linkId: 4, userId: 10, ownerId: 10, link: "present" },
);
ok(
  g,
  "deletes an owned social link",
  "",
  "service.deleteSocialLink(10,4)",
  "{message:'Social link deleted successfully.'}",
  {},
  "N",
  "expect(repository.deleteSocialLink).toHaveBeenCalledWith(4);",
);
bad(
  g,
  "rejects a missing social link",
  "repository.findSocialLinkById.mockResolvedValue(null);",
  "service.deleteSocialLink(10,4)",
  "SocialLinkNotFoundException",
  { link: "null" },
);
bad(
  g,
  "rejects another social link owner",
  "",
  "service.deleteSocialLink(99,4)",
  "AccountProfileForbiddenException",
  { userId: 99 },
  "expect(repository.deleteSocialLink).not.toHaveBeenCalled();",
);
for (const [list, create, remove, uc, module, route] of [
  [
    "getFavorites",
    "addFavorite",
    "removeFavorite",
    "21",
    "Favorite Freelancers",
    "favorites",
  ],
  [
    "getFollowing",
    "followFreelancer",
    "unfollowFreelancer",
    "29",
    "Following Freelancers",
    "following",
  ],
]) {
  const following = uc === "29",
    find = following ? "findFollow" : "findFavorite",
    repoList = following ? "findFollowing" : "findFavorites";
  g = group(
    "account",
    list,
    `UC-${uc}.01`,
    module,
    `GET /${route}/freelancers`,
    { userId: 10, account: "present", role: "Client", records: "empty" },
  );
  ok(g, "returns an empty relationship list", "", `service.${list}(10)`, "[]");
  ok(
    g,
    "omits freelancers with no freelancer profile",
    `repository.${repoList}.mockResolvedValue([{freelancerId:30,createdAt:fixedDate,freelancer:{profile:null}},{freelancerId:31,createdAt:fixedDate,freelancer:{profile:{freelancerProfile:{id:8}}}}]);`,
    `service.${list}(10)`,
    "[{freelancerId:31,createdAt:fixedDate,profile:{freelancerProfile:{id:8}}}]",
    { records: "one visible" },
  );
  roleFailures(g, `service.${list}(10)`);
  g = group(
    "account",
    create,
    `UC-${uc}.02`,
    module,
    `POST /${route}/freelancers/30`,
    {
      userId: 10,
      freelancerId: 30,
      account: "present",
      role: "Client",
      target: "Freelancer",
      duplicate: false,
    },
  );
  const action = `service.${create}(10,30)`;
  ok(
    g,
    "creates a freelancer relationship",
    "",
    action,
    `{message:${q(following ? "You are now following this freelancer." : "Freelancer added to favorites.")}}`,
    {},
    "N",
    `expect(repository.${following ? "createFollowWithNotification" : "createFavorite"}).toHaveBeenCalledWith(10,30${following ? ",'Client'" : ""});`,
  );
  roleFailures(g, action);
  bad(
    g,
    "rejects a self relationship",
    "",
    `service.${create}(10,10)`,
    "FreelancerNotFoundException",
    { freelancerId: 10 },
  );
  bad(
    g,
    "rejects a duplicate relationship",
    `repository.${find}.mockResolvedValue({id:1});`,
    action,
    following ? "FollowDuplicateException" : "FavoriteDuplicateException",
    { duplicate: true },
    `expect(repository.${following ? "createFollowWithNotification" : "createFavorite"}).not.toHaveBeenCalled();`,
  );
  if (!following)
    bad(
      g,
      "rejects a target without freelancer membership",
      "repository.findUserWithRoles.mockResolvedValueOnce(user).mockResolvedValueOnce({...user,userRoles:[]});",
      action,
      "FreelancerNotFoundException",
      { target: "Client" },
    );
  else {
    bad(
      g,
      "rejects a target without freelancer membership",
      "repository.findUserWithRoles.mockResolvedValueOnce(user).mockResolvedValueOnce({...user,userRoles:[]});",
      action,
      "AccountProfileForbiddenException",
      { target: "Client" },
    );
    ok(
      g,
      "uses the fallback follower name",
      "repository.findUserWithRoles.mockResolvedValueOnce({...user,profile:{...user.profile,displayName:' '}});",
      action,
      "{message:'You are now following this freelancer.'}",
      { displayName: "space" },
      "N",
      "expect(repository.createFollowWithNotification).toHaveBeenCalledWith(10,30,'A client');",
    );
  }
  g = group(
    "account",
    remove,
    `UC-${uc}.03`,
    module,
    `DELETE /${route}/freelancers/30`,
    {
      userId: 10,
      freelancerId: 30,
      account: "present",
      role: "Client",
      relationship: "present",
    },
  );
  ok(
    g,
    "removes an existing relationship",
    `repository.${find}.mockResolvedValue({id:1});`,
    `service.${remove}(10,30)`,
    `{message:${q(following ? "You unfollowed this freelancer." : "Freelancer removed from favorites.")}}`,
    {},
    "N",
    `expect(repository.${following ? "deleteFollow" : "deleteFavorite"}).toHaveBeenCalledWith(10,30);`,
  );
  bad(
    g,
    "rejects a missing relationship",
    "",
    `service.${remove}(10,30)`,
    following ? "FollowNotFoundException" : "FavoriteNotFoundException",
    { relationship: "null" },
  );
  roleFailures(g, `service.${remove}(10,30)`);
}

for (const [method, uc, ep, act, expected] of [
  ["getAll", "UC-30.01", "GET /notifications", "service.getAll(10)", "[]"],
  [
    "markRead",
    "UC-30.02",
    "PATCH /notifications/11/read",
    "service.markRead(10,11)",
    "{id:11,isRead:true}",
  ],
  [
    "markAllRead",
    "UC-30.03",
    "PATCH /notifications/read-all",
    "service.markAllRead(10)",
    "{message:shared.NotificationMessage.MARKED_ALL_READ,count:2}",
  ],
  [
    "delete",
    "UC-30.04",
    "DELETE /notifications/11",
    "service.delete(10,11)",
    "{message:shared.NotificationMessage.DELETED}",
  ],
]) {
  g = group("notifications", method, uc, "Notifications", ep, {
    userId: 10,
    notificationId: 11,
    notification: "present",
    isRead: false,
  });
  ok(g, `returns the expected result for ${method}`, "", act, expected);
  if (method === "markRead" || method === "delete")
    bad(
      g,
      "rejects a notification not found for the current user",
      "repository.findById.mockResolvedValue(null);",
      act,
      "NotificationNotFoundException",
      { notification: "null" },
      `expect(repository.${method === "delete" ? "softDelete" : "markRead"}).not.toHaveBeenCalled();`,
    );
  if (method === "markRead")
    ok(
      g,
      "does not rewrite an already read notification",
      "repository.findById.mockResolvedValue({id:11,isRead:true});",
      act,
      "{id:11,isRead:true}",
      { isRead: true },
      "N",
      "expect(repository.markRead).not.toHaveBeenCalled();",
    );
  if (method === "markAllRead")
    ok(
      g,
      "returns zero when nothing is unread",
      "repository.markAllRead.mockResolvedValue({count:0});",
      act,
      "{message:shared.NotificationMessage.MARKED_ALL_READ,count:0}",
      { unreadCount: 0 },
      "B",
    );
}
for (const [method, uc] of [
  ["switchRole", "UC-31.01"],
  ["joinRole", "UC-31.02"],
]) {
  g = group(
    "roles",
    method,
    uc,
    "Role Switching",
    `POST /auth/${method === "switchRole" ? "switch-role" : "join-role"}`,
    { userId: 10, sessionId: 22, role: "Freelancer", assignment: "available" },
  );
  const action = `service.${method}(10,22,{role:shared.RoleName.FREELANCER})`;
  ok(
    g,
    "issues a token for the same session",
    "",
    action,
    "{accessToken:'access-token'}",
    {},
    "N",
    "expect(token.signAccessToken).toHaveBeenCalledWith({userId:10,roleId:3,roleName:'Freelancer',sessionId:22});",
  );
  bad(
    g,
    "rejects an unavailable role",
    `repository.${method === "switchRole" ? "switchPrimaryRole" : "joinRole"}.mockResolvedValue(null);`,
    action,
    "RoleNotFoundException",
    { assignment: "null" },
    "expect(token.signAccessToken).not.toHaveBeenCalled();",
  );
  if (method === "joinRole") {
    bad(
      g,
      "rejects an already assigned role",
      "repository.joinRole.mockResolvedValue({status:'already-assigned'});",
      action,
      "RoleAlreadyAssignedException",
      { assignment: "already-assigned" },
      "expect(token.signAccessToken).not.toHaveBeenCalled();",
    );
    bad(
      g,
      "maps a concurrent role assignment",
      "repository.joinRole.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));",
      action,
      "RoleAlreadyAssignedException",
      { repositoryError: "P2002" },
    );
  }
}

for (const [method, uc, ep, action, expected] of [
  [
    "list",
    "UC-39.01",
    "GET /reviews/contracts/20",
    "service.list(10,20)",
    "[{...review,overallRating:4.5}]",
  ],
  [
    "detail",
    "UC-39.02",
    "GET /reviews/11",
    "service.detail(10,11)",
    "{...review,overallRating:4.5}",
  ],
  [
    "create",
    "UC-39.03",
    "POST /reviews/contracts/20",
    "service.create(10,20,{overallRating:4.5})",
    "{...review,overallRating:4.5}",
  ],
  [
    "update",
    "UC-39.04",
    "PATCH /reviews/11",
    "service.update(10,11,{overallRating:4.5})",
    "{...review,overallRating:4.5}",
  ],
  [
    "remove",
    "UC-39.05",
    "DELETE /reviews/11",
    "service.remove(10,11)",
    "{message:shared.ReviewMessage.DELETED}",
  ],
  [
    "respond",
    "UC-40.01",
    "POST /reviews/11/response",
    "service.respond(30,11,'Thank you')",
    "{id:40,responseText:'Thank you'}",
  ],
  [
    "updateResponse",
    "UC-40.02",
    "PATCH /reviews/responses/40",
    "service.updateResponse(30,40,'Updated')",
    "{id:40,responseText:'Updated'}",
  ],
  [
    "removeResponse",
    "UC-40.03",
    "DELETE /reviews/responses/40",
    "service.removeResponse(30,40)",
    "{message:shared.ReviewMessage.RESPONSE_DELETED}",
  ],
]) {
  g = group(
    "reviews",
    method,
    uc,
    uc.startsWith("UC-39") ? "Reviews" : "Review Responses",
    ep,
    {
      userId: method.includes("Response") || method === "respond" ? 30 : 10,
      record: "present",
      owner: "allowed",
    },
  );
  ok(g, `returns the expected result for ${method}`, "", action, expected);
  if (["list", "detail", "create"].includes(method)) {
    bad(
      g,
      "rejects a missing contract",
      "repository.findContract.mockResolvedValue(null);",
      action,
      "ReviewContractNotFoundException",
      { contract: "null" },
    );
    bad(
      g,
      "rejects a nonparticipant",
      "repository.findContract.mockResolvedValue({...contract,clientId:99,freelancerId:98});",
      action,
      "ReviewForbiddenException",
      { participant: false },
    );
  }
  if (method !== "list")
    bad(
      g,
      "rejects a missing record",
      `repository.${method.includes("Response") ? "findResponseById" : "findById"}.mockResolvedValue(null);`,
      action,
      method.includes("Response")
        ? "ReviewResponseNotFoundException"
        : "ReviewNotFoundException",
      { record: "null" },
    );
  // create reads the contract rather than an existing review.
  if (method === "create") g.cases.pop();
  if (
    [
      "update",
      "remove",
      "respond",
      "updateResponse",
      "removeResponse",
    ].includes(method)
  )
    bad(
      g,
      "rejects a different record owner",
      "",
      action.replace("(10,", "(99,").replace("(30,", "(99,"),
      "ReviewForbiddenException",
      { owner: "other" },
    );
  if (method === "create") {
    bad(
      g,
      "rejects a contract that is not completed",
      "repository.findContract.mockResolvedValue({...contract,status:'ACTIVE'});",
      action,
      "ReviewContractNotCompletedException",
      { contractStatus: "ACTIVE" },
    );
    bad(
      g,
      "rejects a duplicate review",
      "repository.findByContractAndReviewer.mockResolvedValue({id:11});",
      action,
      "ReviewAlreadyExistsException",
      { duplicate: true },
      "expect(repository.create).not.toHaveBeenCalled();",
    );
    bad(
      g,
      "maps a concurrent review insertion",
      "repository.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));",
      action,
      "ReviewAlreadyExistsException",
      { repositoryError: "P2002" },
    );
    ok(
      g,
      "derives the client as reviewee for a freelancer",
      "",
      action.replace("(10,", "(30,"),
      expected,
      { userId: 30 },
      "N",
      "expect(repository.create).toHaveBeenCalledWith(20,30,10,'Freelancer',{overallRating:4.5});",
    );
  }
  if (method === "respond") {
    bad(
      g,
      "rejects an active existing response",
      "repository.findResponseByReview.mockResolvedValue({id:40,deletedAt:null});",
      action,
      "ReviewResponseAlreadyExistsException",
      { response: "active" },
    );
    ok(
      g,
      "restores a soft deleted response",
      "repository.findResponseByReview.mockResolvedValue({id:40,deletedAt:fixedDate});",
      action,
      expected,
      { response: "deleted" },
      "N",
      "expect(repository.createResponse).toHaveBeenCalledWith(11,30,10,20,'Freelancer','Thank you',40);",
    );
    bad(
      g,
      "maps a concurrent response insertion",
      "repository.createResponse.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));",
      action,
      "ReviewResponseAlreadyExistsException",
      { repositoryError: "P2002" },
    );
  }
  if (method === "detail")
    ok(
      g,
      "hides a soft deleted response",
      "repository.findById.mockResolvedValue({...review,response:{id:40,deletedAt:fixedDate}});",
      action,
      "{...review,overallRating:4.5,response:null}",
      { response: "deleted" },
    );
}

g = group(
  "account",
  "getGeneralProfile",
  "UC-41.01",
  "Account Profile",
  "GET /account-profile",
  { userId: 10, profile: "present" },
);
ok(
  g,
  "returns profile data with role membership",
  "",
  "service.getGeneralProfile(10)",
  "{...user.profile,email:user.email,roles:[{name:'Client',isPrimary:true}]}",
);
bad(
  g,
  "rejects a missing general profile",
  "repository.findGeneralProfile.mockResolvedValue(null);",
  "service.getGeneralProfile(10)",
  "ProfileNotFoundException",
  { profile: "null" },
);
ok(
  g,
  "presents a versioned local avatar URL",
  "repository.findGeneralProfile.mockResolvedValue({...user,profile:{...user.profile,avatarUrl:'local://avatars/10/avatar.png'}});",
  "service.getGeneralProfile(10)",
  "{...user.profile,avatarUrl:'/api/backend/account-profile/avatar/10/file?v=1794182400000',email:user.email,roles:[{name:'Client',isPrimary:true}]}",
  { avatarUrl: "local avatar" },
);
g = group(
  "account",
  "updateGeneralProfile",
  "UC-41.02",
  "Account Profile",
  "PUT /account-profile",
  { userId: 10, profile: "present", role: "Client", reviewRequired: false },
);
const generalAct = "service.updateGeneralProfile(10,{displayName:'Name'})";
ok(
  g,
  "updates a strong profile directly",
  "",
  generalAct,
  "{message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null}",
);
ok(
  g,
  "queues a weak primary profile",
  "revisions.requiresManualReview.mockReturnValue(true);",
  generalAct,
  "{reviewRequired:true}",
  { reviewRequired: true },
  "N",
  "expect(repository.updateGeneralProfile).not.toHaveBeenCalled();",
);
ok(
  g,
  "updates an administrative profile",
  "repository.findGeneralProfile.mockResolvedValue({...user,userRoles:[{isPrimary:true,role:{name:'Admin'}}]});",
  generalAct,
  "{message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null}",
  { role: "Admin" },
);
bad(
  g,
  "rejects a missing account",
  "repository.findGeneralProfile.mockResolvedValue(null);",
  generalAct,
  "ProfileNotFoundException",
  { profile: "null" },
);
g = group(
  "account",
  "changePassword",
  "UC-41.03",
  "Account Profile",
  "PUT /account-profile/password",
  {
    userId: 10,
    profile: "present",
    password: "old-hash",
    currentPasswordMatches: true,
  },
);
const passAct =
  "service.changePassword(10,{currentPassword:'OldPass1',newPassword:'NewPass1',confirmPassword:'NewPass1'})";
ok(
  g,
  "hashes and saves the new password",
  "",
  passAct,
  "{message:'Password changed successfully.'}",
  {},
  "N",
  "expect(hashing.verify).toHaveBeenCalledWith('OldPass1','old-hash');expect(hashing.hash).toHaveBeenCalledWith('NewPass1');expect(repository.updatePassword).toHaveBeenCalledWith(10,'new-hash');",
);
bad(
  g,
  "rejects a missing profile",
  "repository.findPasswordCredential.mockResolvedValue(null);",
  passAct,
  "ProfileNotFoundException",
  { profile: "null" },
);
bad(
  g,
  "rejects a social sign in account",
  "repository.findPasswordCredential.mockResolvedValue({profile:{id:5},password:null});",
  passAct,
  "PasswordUnavailableException",
  { password: "null" },
);
bad(
  g,
  "rejects an incorrect current password",
  "hashing.verify.mockResolvedValue(false);",
  passAct,
  "CurrentPasswordIncorrectException",
  { currentPasswordMatches: false },
  "expect(repository.updatePassword).not.toHaveBeenCalled();expect(hashing.hash).not.toHaveBeenCalled();",
);
g = group(
  "account",
  "uploadAvatar",
  "UC-41.04",
  "Account Profile",
  "POST /account-profile/avatar",
  {
    userId: 10,
    profile: "present",
    file: "present",
    mime: "image/png",
    size: 8,
    signature: "PNG",
  },
);
const png =
  "{originalname:'avatar.png',mimetype:'image/png',size:8,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File";
const avatarAct = `service.uploadAvatar(10,${png})`;
ok(
  g,
  "uploads a valid avatar to cloud storage",
  "",
  avatarAct,
  "{avatarUrl:'https://cdn.test/file'}",
);
bad(
  g,
  "rejects a missing avatar",
  "",
  "service.uploadAvatar(10)",
  "AvatarFileRequiredException",
  { file: "undefined" },
);
bad(
  g,
  "rejects a missing account",
  "repository.findGeneralProfile.mockResolvedValue(null);",
  avatarAct,
  "ProfileNotFoundException",
  { profile: "null" },
);
for (const [field, value, expr] of [
  ["size", 5242881, png.replace("size:8", "size:5242881")],
  [
    "mime",
    "image/jpeg",
    png.replace("mimetype:'image/png'", "mimetype:'image/jpeg'"),
  ],
  [
    "signature",
    "text",
    png.replace(
      "Buffer.from([137,80,78,71,13,10,26,10])",
      "Buffer.from('invalid')",
    ),
  ],
])
  bad(
    g,
    `rejects invalid avatar ${field}`,
    "",
    `service.uploadAvatar(10,${expr})`,
    "AvatarFileInvalidException",
    { [field]: value },
    "expect(repository.updateAvatar).not.toHaveBeenCalled();",
  );
ok(
  g,
  "accepts an avatar of exactly five MiB",
  "",
  avatarAct.replace("size:8", "size:5242880"),
  "{avatarUrl:'https://cdn.test/file'}",
  { size: 5242880 },
  "B",
);

for (const [method, uc, ep, action] of [
  [
    "list",
    "UC-47.01",
    "GET /admin/profile-revisions",
    "service.list({page:1,limit:10})",
  ],
  [
    "detail",
    "UC-47.02",
    "GET /admin/profile-revisions/11",
    "service.detail(11)",
  ],
  [
    "approve",
    "UC-47.03",
    "PATCH /admin/profile-revisions/11/approve",
    "service.approve(11,99,' Approved ')",
  ],
  [
    "reject",
    "UC-47.04",
    "PATCH /admin/profile-revisions/11/reject",
    "service.reject(11,99,' Fix data ')",
  ],
  [
    "latestForUser",
    "UC-47.05",
    "GET /profile-revisions/me?type=FREELANCER",
    "service.latestForUser(10,'FREELANCER')",
  ],
]) {
  g = group("revisions", method, uc, "Profile Revision Review", ep, {
    id: 11,
    status: "PENDING",
    profileType: "CLIENT",
  });
  if (method === "list")
    ok(
      g,
      "paginates pending revisions",
      "",
      action,
      "{revisions:[revision],pagination:{page:1,limit:10,total:11,totalPages:2}}",
      {},
      "N",
      "expect(repository.syncLowStrengthProfiles).toHaveBeenCalledWith(20);",
    );
  else if (method === "latestForUser")
    ok(
      g,
      "returns null when no revision exists",
      "",
      action,
      "{revision:null}",
    );
  else {
    ok(
      g,
      `returns the expected result for ${method}`,
      method === "reject"
        ? "repository.review.mockResolvedValue({...revision,status:'REJECTED'});"
        : "",
      action,
      method === "detail"
        ? "revision"
        : `{...revision,status:'${method === "reject" ? "REJECTED" : "APPROVED"}'}`,
      {},
      "N",
      method === "detail"
        ? ""
        : `expect(repository.review).toHaveBeenCalledWith(11,99,'${method === "reject" ? "REJECTED" : "APPROVED"}','${method === "reject" ? "Fix data" : "Approved"}',expect.any(Object),'CLIENT');`,
    );
    bad(
      g,
      "rejects a missing revision",
      "repository.findById.mockResolvedValue(null);",
      action,
      "ProfileRevisionNotFoundException",
      { revision: "null" },
    );
    if (method !== "detail") {
      bad(
        g,
        "rejects a revision that is no longer pending",
        "repository.findById.mockResolvedValue({...revision,status:'APPROVED'});",
        action,
        "ProfileRevisionAlreadyReviewedException",
        { status: "APPROVED" },
        "expect(repository.review).not.toHaveBeenCalled();",
      );
      bad(
        g,
        "rejects a concurrent review claim",
        "repository.review.mockResolvedValue(null);",
        action,
        "ProfileRevisionAlreadyReviewedException",
        { reviewClaim: "null" },
      );
      for (const profileType of ["FREELANCER", "EXPERT"])
        ok(
          g,
          `reviews a ${profileType.toLowerCase()} snapshot`,
          `repository.findById.mockResolvedValue({...revision,profileType:'${profileType}',proposedData:${profileType === "FREELANCER" ? "{displayName:'Name',title:'Engineer'}" : "{displayName:'Expert',title:null,expertise:[],education:[],certifications:[]}"}});`,
          action,
          `{...revision,status:'APPROVED'}`,
          { profileType },
        );
    }
  }
}
g = group(
  "revisions",
  "requiresManualReview",
  "UC-07.02 UC-19.02 UC-41.02",
  "Profile Revision Review",
  "Internal method",
  { profileStrength: 20 },
);
for (const [n, expected] of [
  [19, true],
  [20, false],
  [21, false],
])
  add(
    g,
    `returns ${expected} for strength ${n}`,
    "",
    `expect(service.requiresManualReview(${n})).toBe(${expected});`,
    { profileStrength: n },
    "B",
    `Returns ${expected}`,
  );
g = group(
  "expert",
  "submitUpdate",
  "UC-47.06",
  "Expert Profile",
  "PUT /expert-profile/me",
  { userId: 10, profile: "present", role: "Expert", pendingRevision: false },
);
const expertInput =
  "{displayName:'Expert',expertise:[' AI ','ai',''],education:[],certifications:[],website:''}";
const expertAct = `service.submitUpdate(10,${expertInput})`;
ok(
  g,
  "sanitizes lists and submits an expert revision",
  "",
  expertAct,
  "{reviewRequired:true}",
  {},
  "N",
  "expect(revisions.submitExpert).toHaveBeenCalledWith(10,5,expect.objectContaining({expertise:['AI'],website:null}),expect.any(Number));",
);
bad(
  g,
  "rejects a missing expert account",
  "repository.findByUserId.mockResolvedValue(null);",
  expertAct,
  "ExpertProfileNotFoundException",
  { profile: "null" },
);
bad(
  g,
  "rejects an account without expert membership",
  "repository.findByUserId.mockResolvedValue({...expertUser,userRoles:[]});",
  expertAct,
  "NotAnExpertAccountException",
  { role: "empty" },
);
bad(
  g,
  "rejects a pending expert revision",
  "repository.hasPendingRevision.mockResolvedValue(true);",
  expertAct,
  "ExpertProfilePendingRevisionException",
  { pendingRevision: true },
  "expect(revisions.submitExpert).not.toHaveBeenCalled();",
);

// CV and identity use independent storage mocks, never the real filesystem.
g = group(
  "account",
  "uploadIdentityDocument",
  "UC-18.01",
  "Identity Verification",
  "POST /identity-verifications/documents",
  {
    userId: 30,
    account: "present",
    role: "Freelancer",
    file: "present",
    mime: "application/pdf",
    size: 1024,
  },
);
const identityFile =
  "{originalname:'id.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-')} as Express.Multer.File";
const identityAct = `service.uploadIdentityDocument(30,'ID_CARD',${identityFile})`;
ok(
  g,
  "uploads an identity document",
  "",
  identityAct,
  "{id:4,fileUrl:'https://cdn.test/id.pdf',backFileUrl:null,qrConsistency:null}",
);
roleFailures(g, identityAct, "FREELANCER");
bad(
  g,
  "rejects a missing identity document",
  "",
  "service.uploadIdentityDocument(30,'ID_CARD')",
  "IdentityFileRequiredException",
  { file: "undefined" },
);
bad(
  g,
  "rejects an identity document above ten MiB",
  "",
  identityAct.replace("size:1024", "size:10485761"),
  "IdentityFileInvalidException",
  { size: 10485761 },
);
bad(
  g,
  "rejects an unsupported identity MIME type",
  "",
  identityAct.replace("mimetype:'application/pdf'", "mimetype:'text/plain'"),
  "IdentityFileInvalidException",
  { mime: "text/plain" },
);
ok(
  g,
  "accepts an identity document of exactly ten MiB",
  "",
  identityAct.replace("size:1024", "size:10485760"),
  "{id:4,fileUrl:'https://cdn.test/id.pdf',backFileUrl:null,qrConsistency:null}",
  { size: 10485760 },
  "B",
);
g = group(
  "account",
  "getIdentityStatus",
  "UC-18.02",
  "Identity Verification",
  "GET /identity-verifications/status",
  { userId: 30, account: "present", role: "Freelancer", documents: "empty" },
);
ok(
  g,
  "returns null before any submission",
  "",
  "service.getIdentityStatus(30)",
  "{status:null,documents:[]}",
);
roleFailures(g, "service.getIdentityStatus(30)", "FREELANCER");
ok(
  g,
  "presents local front and back document URLs",
  "repository.findIdentityDocuments.mockResolvedValue([{id:4,status:'PENDING',fileUrl:'local://id/front.png',backFileUrl:'local://id/back.png'}]);",
  "service.getIdentityStatus(30)",
  "{status:'PENDING',documents:[{id:4,status:'PENDING',fileUrl:'/api/backend/identity-verifications/documents/4/file',backFileUrl:'/api/backend/identity-verifications/documents/4/file?side=back',qrConsistency:null}]}",
  { documents: "PENDING" },
);

// Share the ProfileService mock suite for CV methods.
const cvSetup = `\nObject.assign(profile.freelancerProfile,{cvUrl:'local://cvs/10/cv.pdf',cvFileName:'cv.pdf',cvPublicId:null});
repository.updateCv.mockResolvedValue({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',cvUrl:'local://cvs/10/cv.pdf',freelancerProfile:{id:7,profile:{userId:10}}});
repository.confirmCvAnalysis.mockResolvedValue({profileCompletionPercent:90});repository.discardCvAnalysis.mockResolvedValue({id:40});`;
suites.profiles.setup += cvSetup;
for (const [method, ucs, ep, action, expected] of [
  [
    "uploadCv",
    "UC-07.03",
    "POST /profiles/5/cv",
    "service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)",
    "{cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'}",
  ],
  [
    "replaceCv",
    "UC-07.05",
    "POST /profiles/5/cv",
    "service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)",
    "{cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'}",
  ],
  [
    "getCvFile",
    "UC-07.04",
    "GET /profiles/5/cv/file",
    "service.getCvFile(5,10)",
    "{absolutePath:path.resolve('uploads/cvs/10/cv.pdf'),fileName:'cv.pdf'}",
  ],
  [
    "deleteCv",
    "UC-07.06",
    "DELETE /profiles/5/cv",
    "service.deleteCv(5,10)",
    "{message:'CV deleted successfully.'}",
  ],
  [
    "confirmCvAnalysis",
    "UC-07.03",
    "POST /profiles/5/cv/analysis/40/confirm",
    "service.confirmCvAnalysis(5,10,40,{})",
    "{message:shared.ProfileMessage.CV_ANALYSIS_CONFIRMED,status:'CONFIRMED',counts:{skills:0,experience:0,education:0,projects:0},profileCompletionPercent:90}",
  ],
  [
    "discardCvAnalysis",
    "UC-07.03",
    "POST /profiles/5/cv/analysis/40/discard",
    "service.discardCvAnalysis(5,10,40)",
    "{message:shared.ProfileMessage.CV_ANALYSIS_DISCARDED,status:'DISCARDED'}",
  ],
]) {
  g = group("profiles", method, ucs, "CV Management", ep, {
    profileId: 5,
    currentUserId: 10,
    profile: "present",
    role: "Freelancer",
    ownerId: 10,
    cv: "present",
  });
  ok(g, `returns the expected result for ${method}`, "", action, expected);
  bad(
    g,
    "rejects a missing freelancer profile",
    "repository.findFreelancerProfileById.mockResolvedValue(null);",
    action,
    "FreelancerProfileNotFoundException",
    { profile: "null" },
  );
  bad(
    g,
    "rejects another CV owner",
    "",
    action.replace("(5,10", "(5,99"),
    "ProfileForbiddenException",
    { currentUserId: 99 },
  );
  if (method === "uploadCv") {
    bad(
      g,
      "rejects a missing CV file",
      "",
      "service.uploadCv(5,10)",
      "CvFileRequiredException",
      { file: "undefined" },
    );
    bad(
      g,
      "rejects a CV above ten MiB",
      "",
      action.replace("size:1024", "size:10485761"),
      "CvFileTooLargeException",
      { size: 10485761 },
    );
    bad(
      g,
      "rejects a non PDF MIME type",
      "",
      action.replace("mimetype:'application/pdf'", "mimetype:'text/plain'"),
      "CvFileTypeException",
      { mime: "text/plain" },
    );
    bad(
      g,
      "rejects an invalid PDF signature",
      "",
      action.replace("Buffer.from('%PDF-1.7')", "Buffer.from('invalid')"),
      "CvFileInvalidException",
      { signature: "invalid" },
    );
    ok(
      g,
      "accepts a CV of exactly ten MiB",
      "",
      action.replace("size:1024", "size:10485760"),
      expected,
      { size: 10485760 },
      "B",
    );
    ok(
      g,
      "accepts a PDF signature after leading bytes",
      "",
      action.replace("'%PDF-1.7'", "'  %PDF-1.7'"),
      expected,
      { signature: "leading spaces" },
      "N",
    );
    ok(
      g,
      "replaces the previous cloud asset",
      "Object.assign(profile.freelancerProfile,{cvPublicId:'old-asset'});",
      action,
      expected,
      { oldStorage: "Cloudinary" },
      "N",
      "expect(cloudinary.deleteFile).toHaveBeenCalledWith('old-asset');",
    );
  } else if (["deleteCv", "getCvFile"].includes(method))
    bad(
      g,
      "rejects a profile without a CV",
      "Object.assign(profile.freelancerProfile,{cvUrl:null});",
      action,
      "CvNotFoundException",
      { cv: "null" },
    );
  if (method === "getCvFile") {
    ok(
      g,
      "returns a remote CV URL",
      "Object.assign(profile.freelancerProfile,{cvUrl:'https://cdn.test/cv.pdf'});",
      action,
      "{remoteUrl:'https://cdn.test/cv.pdf',fileName:'cv.pdf'}",
      { storage: "remote" },
    );
    bad(
      g,
      "rejects a stored path outside uploads",
      "Object.assign(profile.freelancerProfile,{cvUrl:'local://../../private.pdf'});",
      action,
      "CvNotFoundException",
      { cvUrl: "local://../../private.pdf" },
    );
  }
  if (method.includes("CvAnalysis")) {
    bad(
      g,
      "rejects a missing analysis",
      "repository.findCvAnalysisById.mockResolvedValue(null);",
      action,
      "CvAnalysisNotFoundException",
      { analysis: "null" },
    );
    bad(
      g,
      "rejects an analysis for a different freelancer profile",
      "repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:99,profile:{userId:10}}});",
      action,
      "CvAnalysisNotFoundException",
      { analysisProfileId: 99 },
    );
    if (method === "confirmCvAnalysis")
      bad(
        g,
        "rejects a processed analysis",
        "repository.findCvAnalysisById.mockResolvedValue({id:40,status:'CONFIRMED',freelancerProfile:{id:7,profile:{userId:10}}});",
        action,
        "CvAnalysisNotPendingException",
        { analysisStatus: "CONFIRMED" },
      );
    bad(
      g,
      "rejects an analysis owned by another user",
      "repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:7,profile:{userId:99}}});",
      action,
      "ProfileForbiddenException",
      { analysisOwnerId: 99 },
    );
    bad(
      g,
      "rejects a lost optimistic claim",
      `repository.${method}.mockResolvedValue(null);`,
      action,
      "CvAnalysisNotPendingException",
      { claim: "null" },
    );
    if (method === "confirmCvAnalysis")
      bad(
        g,
        "rejects an analysis of a replaced CV",
        "repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',cvUrl:'old.pdf',freelancerProfile:{id:7,profile:{userId:10}}});",
        action,
        "CvAnalysisStaleException",
        { analysisCvUrl: "old.pdf" },
      );
  }
}

// Additional CV branches are part of upload/replace workflows in Report 3.
const draft =
  "{id:40,status:'PENDING',cvUrl:'local://cvs/10/cv.pdf',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[],payload:{skills:[],experience:[],education:[],projects:[],summary:null},createdAt:fixedDate,updatedAt:fixedDate}";
suites.profiles.setup += `\nconst draft=${draft};repository.createCvAnalysis.mockResolvedValue(draft);repository.findPendingCvAnalysis.mockResolvedValue(draft);ai.analyze.mockResolvedValue({skills:[],experience:[],education:[],projects:[],summary:null,meta:{source:'pdf_text',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]}});resolver.resolveSkillEntries.mockResolvedValue([]);`;
for (const method of ["analyzeCv", "getCvAnalysis"]) {
  g = group(
    "profiles",
    method,
    "UC-07.03 UC-07.05",
    "CV Management",
    method === "analyzeCv"
      ? "POST /profiles/5/cv/analyze"
      : "GET /profiles/5/cv/analysis",
    owner,
  );
  const action = `service.${method}(5,10)`;
  const expected =
    "{id:40,status:'PENDING',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,isStale:false,payload:{skills:[],experience:[],education:[],projects:[],summary:null},meta:{source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]},createdAt:fixedDate,updatedAt:fixedDate}";
  ok(
    g,
    "returns a pending CV analysis draft",
    "",
    action,
    method === "analyzeCv" ? `{suggestions:[],analysis:${expected}}` : expected,
  );
  bad(
    g,
    "rejects a missing freelancer profile",
    "repository.findFreelancerProfileById.mockResolvedValue(null);",
    action,
    "FreelancerProfileNotFoundException",
    { profile: "null" },
  );
  bad(
    g,
    "rejects another CV owner",
    "",
    action.replace("(5,10", "(5,99"),
    "ProfileForbiddenException",
    { currentUserId: 99 },
  );
  if (method === "analyzeCv") {
    bad(
      g,
      "rejects a profile without a CV",
      "Object.assign(profile.freelancerProfile,{cvUrl:null});",
      action,
      "CvNotFoundException",
      { cv: "null" },
    );
    bad(
      g,
      "maps an unavailable AI service",
      "ai.analyze.mockRejectedValue(new Error('AI offline'));",
      action,
      "CvAiUnavailableException",
      { ai: "offline" },
      "expect(repository.createCvAnalysis).not.toHaveBeenCalled();",
    );
    add(
      g,
      "deduplicates canonical skill suggestions",
      "ai.analyze.mockResolvedValue({skills:[{name:'JS',proficiencyLevel:5},{name:'JavaScript',proficiencyLevel:6},{name:'Python',proficiencyLevel:4}],experience:[],education:[],projects:[],summary:null,meta:{source:'pdf_text',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]}});resolver.resolveSkillEntries.mockResolvedValue([{name:'JS',skill:{name:'JavaScript'}},{name:'JavaScript',skill:{name:'JavaScript'}},{name:'Python',skill:{name:'Python'}}]);repository.findSkillsByProfileId.mockResolvedValue([{skill:{name:'python'}}]);",
      `const result=await ${action};\nexpect(result.suggestions).toEqual([{skillName:'JavaScript',proficiencyLevel:5}]);`,
      { skills: "canonical duplicates" },
      "N",
      "Returns one JavaScript suggestion at proficiencyLevel 5; omits the existing Python skill",
    );
  } else {
    bad(
      g,
      "rejects a missing pending draft",
      "repository.findPendingCvAnalysis.mockResolvedValue(null);",
      action,
      "CvAnalysisNotFoundException",
      { draft: "null" },
    );
    ok(
      g,
      "flags a draft from a replaced CV",
      "Object.assign(profile.freelancerProfile,{cvUrl:'new.pdf'});",
      action,
      expected.replace("isStale:false", "isStale:true"),
      { cvUrl: "new.pdf" },
    );
  }
}
// Test the private snapshot decision through its public entry methods.
g = group(
  "revisions",
  "submit",
  "UC-07.02 UC-19.02 UC-41.02 UC-47.06",
  "Profile Revision Review",
  "Internal snapshot method",
  { userId: 10, profileId: 5, snapshot: "present", profileType: "FREELANCER" },
);
for (const [method, profileType, data] of [
  ["submitFreelancer", "FREELANCER", "{displayName:'Name',title:'Engineer'}"],
  ["submitClient", "CLIENT", "{companyName:'Company'}"],
  [
    "submitExpert",
    "EXPERT",
    "{displayName:'Expert',expertise:[],education:[],certifications:[]}",
  ],
])
  ok(
    g,
    `stores a ${profileType.toLowerCase()} snapshot without publishing`,
    "",
    `service.${method}(10,5,${data},19)`,
    "{message:shared.ProfileMessage.PROFILE_REVISION_SUBMITTED,reviewRequired:true,profileStrength:19,revision:{id:11,status:'PENDING'}}",
    { profileType },
    "N",
    `expect(repository.submit).toHaveBeenCalledWith(10,5,'${profileType}',expect.any(Object),expect.objectContaining(${data}),19);`,
  );
bad(
  g,
  "rejects a missing snapshot",
  "repository.findProfileForSnapshot.mockResolvedValue(null);",
  "service.submitClient(10,5,{companyName:'Company'},19)",
  "ProfileRevisionNotFoundException",
  { snapshot: "null" },
);

g = group(
  "account",
  "submitIdentityAiCheck",
  "UC-18.01",
  "Identity Verification",
  "POST /identity-verifications/ai-check",
  {
    userId: 30,
    role: "Freelancer",
    front: "present",
    selfie: "present",
    livenessCount: 1,
    latestStatus: "empty",
    aiStatus: "VERIFIED",
    duplicateIdentity: false,
  },
);
const image =
  "{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File";
const aiFiles = `{front:${image},selfie:${image},liveness:[${image}]}`;
const aiAction = `service.submitIdentityAiCheck(30,'ID_CARD',${aiFiles})`;
suites.account.setup += `\nidentityAi.verify.mockResolvedValue({status:'VERIFIED',ocr:{front:{document_number:'0012 3456 7890'}},face_match:{match_score:0.99}});repository.findApprovedIdentityDocumentByIdentityNumber.mockResolvedValue(null);repository.createIdentityAiDocument.mockImplementation(async (data:Record<string,unknown>)=>({id:4,...data}));`;
add(
  g,
  "keeps an AI verified identity pending for administrator review",
  "",
  `const result=await ${aiAction};\nexpect(result.status).toBe('PENDING');expect(repository.createIdentityAiDocument).toHaveBeenCalledWith(expect.objectContaining({status:'PENDING',reviewNotes:null,aiStatus:'VERIFIED',aiScore:0.99}));expect(repository.findApprovedIdentityDocumentByIdentityNumber).toHaveBeenCalledWith(30,'001234567890');`,
  {},
  "N",
  'Returns a PENDING identity document; normalized identityNumber = "001234567890"',
);
roleFailures(g, aiAction, "FREELANCER");
bad(
  g,
  "requires a front image",
  "",
  aiAction.replace(`front:${image},`, ""),
  "IdentityAiFrontRequiredException",
  { front: "undefined" },
);
bad(
  g,
  "requires a selfie image",
  "",
  aiAction.replace(`selfie:${image},`, ""),
  "IdentityAiSelfieRequiredException",
  { selfie: "undefined" },
);
for (const count of [0, 41])
  bad(
    g,
    `rejects ${count} liveness frames`,
    "",
    aiAction.replace(
      `liveness:[${image}]`,
      `liveness:Array(${count}).fill(${image})`,
    ),
    "IdentityAiLivenessRequiredException",
    { livenessCount: count },
  );
bad(
  g,
  "rejects a liveness frame above two MiB",
  "",
  aiAction.replace(
    `liveness:[${image}]`,
    `liveness:[${image.replace("size:1024", "size:2097153")}]`,
  ),
  "IdentityAiFramesInvalidException",
  { frameSize: 2097153 },
);
bad(
  g,
  "rejects a liveness frame with an unsupported MIME type",
  "",
  aiAction.replace(
    `liveness:[${image}]`,
    `liveness:[${image.replace("mimetype:'image/png'", "mimetype:'application/pdf'")}]`,
  ),
  "IdentityAiFramesInvalidException",
  { frameMime: "application/pdf" },
);
bad(
  g,
  "rejects an already approved identity",
  "repository.findIdentityDocuments.mockResolvedValue([{status:'APPROVED'}]);",
  aiAction,
  "IdentityAlreadyVerifiedException",
  { latestStatus: "APPROVED" },
  "expect(identityAi.verify).not.toHaveBeenCalled();",
);
add(
  g,
  "rejects a duplicate approved identity from another account",
  "repository.findApprovedIdentityDocumentByIdentityNumber.mockResolvedValue({id:99});",
  `const result=await ${aiAction};expect(result.status).toBe('REJECTED');expect(repository.createIdentityAiDocument).toHaveBeenCalledWith(expect.objectContaining({duplicateOfId:99,status:'REJECTED',reviewNotes:'This ID card (001234567890) is already verified by another account.'}));`,
  { duplicateIdentity: true },
  "N",
  'Returns REJECTED. "This ID card (001234567890) is already verified by another account."',
);
add(
  g,
  "keeps the AI rejection reason",
  "identityAi.verify.mockResolvedValue({status:'REJECTED',rejection_reason:' Face mismatch '});",
  `const result=await ${aiAction};expect(result.status).toBe('REJECTED');expect(result.reviewNotes).toBe('Face mismatch');`,
  { aiStatus: "REJECTED" },
  "N",
  'Returns REJECTED with reviewNotes "Face mismatch"',
);
add(
  g,
  "uses the fallback AI rejection reason",
  "identityAi.verify.mockResolvedValue({status:''});",
  `const result=await ${aiAction};expect(result.status).toBe('REJECTED');expect(result.aiStatus).toBe('UNKNOWN');expect(result.reviewNotes).toBe('AI verification failed.');`,
  { aiStatus: "empty" },
  "N",
  'Returns REJECTED with aiStatus UNKNOWN and reviewNotes "AI verification failed."',
);
add(
  g,
  "creates no document when AI verification fails",
  "const failure=new Error('AI offline');identityAi.verify.mockRejectedValue(failure);",
  `await expect(${aiAction}).rejects.toBe(failure);expect(repository.createIdentityAiDocument).not.toHaveBeenCalled();expect(cloudinary.uploadFile).not.toHaveBeenCalled();`,
  { ai: "offline" },
  "A",
  "Propagates the AI error; creates no document",
);
add(
  g,
  "accepts forty liveness frames",
  "",
  `await ${aiAction.replace(`liveness:[${image}]`, `liveness:Array(40).fill(${image})`)};expect(identityAi.verify).toHaveBeenCalledWith(expect.objectContaining({liveness:expect.any(Array)}));expect(identityAi.verify.mock.calls[0][0].liveness).toHaveLength(40);`,
  { livenessCount: 40 },
  "B",
  "Accepts exactly 40 liveness frames",
);
// Identity image exceptions take a field path; assert its literal contract.
for (const [field, size, mime] of [
  ["front", 10485761, "image/png"],
  ["front", 1024, "application/pdf"],
  ["selfie", 10485761, "image/png"],
]) {
  const replacement = image
    .replace("size:1024", `size:${size}`)
    .replace("mimetype:'image/png'", `mimetype:'${mime}'`);
  add(
    g,
    `rejects invalid ${field} ${size === 1024 ? "MIME type" : "size"}`,
    "",
    `await expect(${aiAction.replace(`${field}:${image}`, `${field}:${replacement}`)}).rejects.toMatchObject({status:400,response:{message:[{message:'Only JPG, PNG, or WEBP images up to 10 MB are accepted for AI verification.',path:'${field}'}]}});expect(identityAi.verify).not.toHaveBeenCalled();`,
    { [`${field}Size`]: size, [`${field}Mime`]: mime },
    "A",
    `HTTP 400. "Only JPG, PNG, or WEBP images up to 10 MB are accepted for AI verification." path=${field}`,
  );
}
groups
  .find((g) => g.key === "revisions" && g.method === "list")
  .uc.push("UC-47.05");

// Add schema boundaries to the same method matrix (validation is controller-side).
function schema(g, name, base, field, values) {
  for (const [label, value, type = "B"] of values) {
    const input = structuredClone(base);
    if (value === undefined) delete input[field];
    else input[field] = value;
    const parsed = shared[name].safeParse(input);
    const expected = parsed.success;
    const issues = expected
      ? []
      : parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
    if (!expected && new Set(issues.map((i) => i.path.join("."))).size > 1)
      throw Error(`Multiple invalid fields: ${name} ${label}`);
    const assertion =
      `const result = shared.${name}.safeParse(${literal(input)});\nexpect(result.success).toBe(${expected});` +
      (expected
        ? `\nif(result.success) expect(result.data).toEqual(${literal(parsed.data)});`
        : `\nif(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual(${q(issues)});`);
    const c = add(
      g,
      `${expected ? "accepts" : "rejects"} ${field} ${label}`,
      "",
      assertion,
      {
        ...base,
        [field]: value === undefined ? "undefined" : value,
        layer: "DTO schema",
      },
      type,
      expected
        ? "DTO validation succeeds"
        : `HTTP 400 via ZodValidationPipe. ${q(issues)}`,
    );
    c.schema = name;
    c.http = expected ? null : 400;
  }
}
function text(g, s, b, f, min, max) {
  schema(g, s, b, f, [
    ["missing", undefined, "A"],
    ["empty", "", min ? "A" : "B"],
    ["minimum", "x".repeat(min || 1), "B"],
    ["maximum", "x".repeat(max), "B"],
    ["above maximum", "x".repeat(max + 1), "A"],
  ]);
}
const find = (m) => groups.find((g) => g.method === m);
let base = { displayName: "Name", title: "Engineer" };
for (const f of ["displayName", "title"])
  text(find("updateProfile"), "UpdateFreelancerProfileSchema", base, f, 1, 255);
schema(find("updateProfile"), "UpdateFreelancerProfileSchema", base, "bio", [
  ["null", null, "N"],
  ["maximum", "x".repeat(5000)],
  ["above maximum", "x".repeat(5001), "A"],
]);
schema(
  find("updateProfile"),
  "UpdateFreelancerProfileSchema",
  base,
  "availabilityStatus",
  [
    ["available", "AVAILABLE", "N"],
    ["invalid", "INVALID", "A"],
  ],
);
for (const f of ["education", "certifications", "languages", "experience"])
  schema(find("updateProfile"), "UpdateFreelancerProfileSchema", base, f, [
    ["null", null, "N"],
    ["empty", []],
    ["maximum count", Array.from({ length: 20 }, (_, i) => "Item" + i)],
    ["above count", Array.from({ length: 21 }, (_, i) => "Item" + i), "A"],
    ["empty entry", [""], "A"],
    ["maximum entry", ["x".repeat(255)]],
    ["above entry", ["x".repeat(256)], "A"],
  ]);
base = { skillName: "TypeScript", proficiencyLevel: 5 };
text(find("addSkill"), "AddFreelancerSkillSchema", base, "skillName", 1, 100);
schema(find("addSkill"), "AddFreelancerSkillSchema", base, "proficiencyLevel", [
  ["missing", undefined, "A"],
  ["zero", 0, "A"],
  ["minimum", 1],
  ["maximum", 10],
  ["above maximum", 11, "A"],
  ["fraction", 1.5, "A"],
  ["string", "5", "A"],
]);
for (const [method, s] of [
  ["addPortfolio", "AddPortfolioSchema"],
  ["updatePortfolio", "UpdatePortfolioSchema"],
]) {
  const g = find(method),
    b = { title: "Project" };
  text(g, s, b, "title", 1, 255);
  schema(g, s, b, "description", [
    ["null", null, "N"],
    ["maximum", "x".repeat(5000)],
    ["above maximum", "x".repeat(5001), "A"],
  ]);
  schema(g, s, b, "technologies", [
    ["empty", []],
    ["maximum count", Array.from({ length: 20 }, (_, i) => "Tech" + i)],
    ["above count", Array.from({ length: 21 }, (_, i) => "Tech" + i), "A"],
    ["empty entry", [""], "A"],
    ["maximum entry", ["x".repeat(100)]],
    ["above entry", ["x".repeat(101)], "A"],
  ]);
  schema(g, s, b, "projectUrl", [
    ["null", null, "N"],
    ["HTTPS", "https://example.test/project", "N"],
    ["HTTP", "http://example.test", "N"],
    ["invalid", "invalid", "A"],
    ["FTP", "ftp://example.test", "A"],
    ["maximum", "https://example.test/" + "x".repeat(479)],
    ["above maximum", "https://example.test/" + "x".repeat(480), "A"],
  ]);
}
base = { companyName: "Company" };
text(
  find("updateClientProfile"),
  "UpdateClientProfileSchema",
  base,
  "companyName",
  1,
  255,
);
schema(
  find("updateClientProfile"),
  "UpdateClientProfileSchema",
  base,
  "companyDescription",
  [
    ["null", null, "N"],
    ["maximum", "x".repeat(5000)],
    ["above maximum", "x".repeat(5001), "A"],
  ],
);
schema(
  find("updateClientProfile"),
  "UpdateClientProfileSchema",
  base,
  "website",
  [
    ["null", null, "N"],
    ["valid", "https://example.test", "N"],
    ["invalid", "invalid", "A"],
  ],
);
base = { platform: "GITHUB", url: "https://github.com/test" };
schema(find("addSocialLink"), "AddSocialLinkSchema", base, "platform", [
  ["missing", undefined, "A"],
  ["invalid", "INVALID", "A"],
  ["other", "OTHER", "N"],
]);
schema(find("addSocialLink"), "AddSocialLinkSchema", base, "url", [
  ["missing", undefined, "A"],
  ["invalid", "invalid", "A"],
]);
schema(
  find("uploadIdentityDocument"),
  "UploadIdentityDocumentSchema",
  { documentType: "ID_CARD" },
  "documentType",
  [
    ["missing", undefined, "A"],
    ["invalid", "INVALID", "A"],
    ["passport", "PASSPORT", "N"],
  ],
);
for (const method of ["switchRole", "joinRole"])
  schema(
    find(method),
    method === "switchRole" ? "SwitchRoleBodySchema" : "JoinRoleBodySchema",
    { role: "Freelancer" },
    "role",
    [
      ["missing", undefined, "A"],
      ["client", shared.RoleName.CLIENT, "N"],
      ["admin", "ADMIN", "A"],
    ],
  );
for (const [method, s] of [
  ["create", "CreateReviewSchema"],
  ["update", "UpdateReviewSchema"],
]) {
  const g = groups.find((g) => g.key === "reviews" && g.method === method),
    b = { overallRating: 4 };
  schema(g, s, b, "overallRating", [
    ["minimum", 1],
    ["maximum", 5],
    ["below minimum", 0, "A"],
    ["above maximum", 6, "A"],
    ["fraction", 4.5, "N"],
    ["numeric string", "4", "N"],
    ["not numeric", "bad", "A"],
  ]);
  schema(g, s, b, "comment", [
    ["null", null, "N"],
    ["maximum", "x".repeat(3000)],
    ["above maximum", "x".repeat(3001), "A"],
  ]);
  schema(g, s, b, "breakdown", [
    ["null", null, "N"],
    [
      "maximum count",
      Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => ["criterion" + i, 4]),
      ),
    ],
    [
      "above count",
      Object.fromEntries(
        Array.from({ length: 11 }, (_, i) => ["criterion" + i, 4]),
      ),
      "A",
    ],
    ["invalid rating", { quality: 0 }, "A"],
    ["maximum key", { ["x".repeat(50)]: 4 }],
    ["above key", { ["x".repeat(51)]: 4 }, "A"],
  ]);
}
for (const [method, s] of [
  ["respond", "CreateReviewResponseSchema"],
  ["updateResponse", "UpdateReviewResponseSchema"],
])
  text(find(method), s, { responseText: "Thanks" }, "responseText", 1, 3000);
text(
  find("updateGeneralProfile"),
  "UpdateGeneralProfileSchema",
  { displayName: "Name" },
  "displayName",
  1,
  255,
);
schema(
  find("updateGeneralProfile"),
  "UpdateGeneralProfileSchema",
  { displayName: "Name" },
  "bio",
  [
    ["null", null, "N"],
    ["maximum", "x".repeat(5000)],
    ["above maximum", "x".repeat(5001), "A"],
  ],
);
base = {
  currentPassword: "OldPass1",
  newPassword: "NewPass1",
  confirmPassword: "NewPass1",
};
schema(
  find("changePassword"),
  "ChangePasswordSchema",
  base,
  "currentPassword",
  [
    ["missing", undefined, "A"],
    ["empty", "", "A"],
  ],
);
schema(
  find("changePassword"),
  "ChangePasswordSchema",
  base,
  "confirmPassword",
  [["mismatch", "Different1", "A"]],
);
for (const [label, value, type] of [
  ["minimum", "NewPass1", "B"],
  ["below minimum", "NewPas1", "A"],
  ["maximum", "A1" + "x".repeat(30), "B"],
  ["above maximum", "A1" + "x".repeat(31), "A"],
  ["without uppercase", "newpass1", "A"],
  ["without number", "NewPassx", "A"],
  ["same current", "OldPass1", "A"],
]) {
  const b = { ...base, newPassword: value, confirmPassword: value };
  schema(find("changePassword"), "ChangePasswordSchema", b, "newPassword", [
    [label, value, type],
  ]);
}
g = find("list"); // revisions list has its own group; avoid ReviewService list.
g = groups.find((g) => g.key === "revisions" && g.method === "list");
for (const [f, values] of [
  [
    "page",
    [
      ["zero", 0, "A"],
      ["minimum", 1],
      ["fraction", 1.5, "A"],
    ],
  ],
  [
    "limit",
    [
      ["zero", 0, "A"],
      ["minimum", 1],
      ["maximum", 100],
      ["above maximum", 101, "A"],
    ],
  ],
  [
    "status",
    [
      ["invalid", "INVALID", "A"],
      ["pending", "PENDING", "N"],
    ],
  ],
  [
    "profileType",
    [
      ["invalid", "INVALID", "A"],
      ["expert", "EXPERT", "N"],
    ],
  ],
  [
    "search",
    [
      ["maximum", "x".repeat(255)],
      ["above maximum", "x".repeat(256), "A"],
    ],
  ],
])
  schema(
    g,
    "ProfileRevisionAdminFilterSchema",
    { page: 1, limit: 10 },
    f,
    values,
  );
schema(find("approve"), "ApproveProfileRevisionSchema", {}, "reviewNotes", [
  ["null", null, "N"],
  ["maximum", "x".repeat(1000)],
  ["above maximum", "x".repeat(1001), "A"],
]);
text(
  find("reject"),
  "RejectProfileRevisionSchema",
  { reviewNotes: "Fix" },
  "reviewNotes",
  1,
  1000,
);
base = {
  displayName: "Expert",
  expertise: [],
  education: [],
  certifications: [],
};
text(
  find("submitUpdate"),
  "UpdateExpertProfileSchema",
  base,
  "displayName",
  1,
  255,
);
for (const [f, max] of [
  ["title", 255],
  ["bio", 5000],
])
  schema(find("submitUpdate"), "UpdateExpertProfileSchema", base, f, [
    ["null", null, "N"],
    ["maximum", "x".repeat(max)],
    ["above maximum", "x".repeat(max + 1), "A"],
  ]);
schema(
  find("submitUpdate"),
  "UpdateExpertProfileSchema",
  base,
  "yearsOfExperience",
  [
    ["null", null, "N"],
    ["minimum", 0],
    ["maximum", 80],
    ["below minimum", -1, "A"],
    ["above maximum", 81, "A"],
    ["fraction", 1.5, "A"],
  ],
);
for (const [f, max] of [
  ["expertise", 100],
  ["education", 500],
  ["certifications", 500],
])
  schema(find("submitUpdate"), "UpdateExpertProfileSchema", base, f, [
    ["normalized", [" AI ", "ai", ""], "N"],
    ["maximum count", Array.from({ length: 20 }, (_, i) => "Item" + i)],
    [
      "above unique count",
      Array.from({ length: 21 }, (_, i) => "Item" + i),
      "A",
    ],
    ["maximum raw count", Array(100).fill("AI")],
    ["above raw count", Array(101).fill("AI"), "A"],
    ["maximum entry", ["x".repeat(max)]],
    ["above entry", ["x".repeat(max + 1)], "A"],
  ]);
schema(find("submitUpdate"), "UpdateExpertProfileSchema", base, "website", [
  ["empty", "", "N"],
  ["null", null, "N"],
  ["invalid", "invalid", "A"],
  ["maximum", "https://example.test/" + "x".repeat(479)],
  ["above maximum", "https://example.test/" + "x".repeat(480), "A"],
]);

// Strict object schemas reject one extra field, with all declared fields valid.
for (const [method, s, base] of [
  [
    "updateProfile",
    "UpdateFreelancerProfileSchema",
    { displayName: "Name", title: "Engineer" },
  ],
  [
    "addSkill",
    "AddFreelancerSkillSchema",
    { skillName: "TypeScript", proficiencyLevel: 5 },
  ],
  ["addPortfolio", "AddPortfolioSchema", { title: "Project" }],
  ["updatePortfolio", "UpdatePortfolioSchema", { title: "Project" }],
  [
    "addSocialLink",
    "AddSocialLinkSchema",
    { platform: "GITHUB", url: "https://example.test" },
  ],
  [
    "updateClientProfile",
    "UpdateClientProfileSchema",
    { companyName: "Company" },
  ],
  [
    "updateGeneralProfile",
    "UpdateGeneralProfileSchema",
    { displayName: "Name" },
  ],
  [
    "uploadIdentityDocument",
    "UploadIdentityDocumentSchema",
    { documentType: "ID_CARD" },
  ],
])
  schema(find(method), s, base, "unexpected", [
    ["unknown field", "value", "A"],
  ]);

// CV confirmation accepts structured user-edited AI results. Exercise each
// independent constraint instead of multiplying all fields across all cases.
g = find("confirmCvAnalysis");
const cvEntries = {
  skills: { skillName: "TypeScript", proficiencyLevel: 5 },
  experience: {
    title: "Engineer",
    company: "Company",
    startDate: "2020-01",
    endDate: null,
    isCurrent: true,
    description: null,
  },
  education: {
    degree: "Bachelor",
    school: "University",
    startYear: 2020,
    endYear: 2024,
    description: null,
  },
  projects: {
    name: "Project",
    technologies: ["TypeScript"],
    description: null,
  },
};
for (const [field, max] of [
  ["skills", 50],
  ["experience", 20],
  ["education", 10],
  ["projects", 20],
])
  schema(g, "CvAnalysisConfirmSchema", {}, field, [
    ["empty", []],
    ["maximum count", Array(max).fill(cvEntries[field])],
    ["above count", Array(max + 1).fill(cvEntries[field]), "A"],
  ]);
for (const [field, key, min, max] of [
  ["skills", "skillName", 1, 100],
  ["experience", "title", 0, 150],
  ["experience", "company", 0, 150],
  ["experience", "startDate", 0, 10],
  ["experience", "endDate", 0, 10],
  ["experience", "description", 0, 1000],
  ["education", "degree", 0, 150],
  ["education", "school", 0, 150],
  ["education", "description", 0, 1000],
  ["projects", "name", 1, 150],
  ["projects", "description", 0, 1000],
]) {
  const item = cvEntries[field];
  schema(g, "CvAnalysisConfirmSchema", {}, field, [
    [`${key} maximum`, [{ ...item, [key]: "x".repeat(max) }]],
    [`${key} above maximum`, [{ ...item, [key]: "x".repeat(max + 1) }], "A"],
  ]);
  if (min)
    schema(g, "CvAnalysisConfirmSchema", {}, field, [
      [`${key} empty`, [{ ...item, [key]: "" }], "A"],
      [`${key} minimum`, [{ ...item, [key]: "x" }]],
    ]);
  else
    schema(g, "CvAnalysisConfirmSchema", {}, field, [
      [`${key} null`, [{ ...item, [key]: null }], "N"],
    ]);
}
for (const [label, n, type] of [
  ["minimum", 1, "B"],
  ["maximum", 10, "B"],
  ["zero", 0, "A"],
  ["above maximum", 11, "A"],
  ["fraction", 1.5, "A"],
])
  schema(g, "CvAnalysisConfirmSchema", {}, "skills", [
    [
      `proficiency ${label}`,
      [{ ...cvEntries.skills, proficiencyLevel: n }],
      type,
    ],
  ]);
for (const key of ["startYear", "endYear"])
  for (const [label, n, type] of [
    ["minimum", 1950, "B"],
    ["maximum", 2100, "B"],
    ["below minimum", 1949, "A"],
    ["above maximum", 2101, "A"],
    ["fraction", 2020.5, "A"],
    ["null", null, "N"],
  ])
    schema(g, "CvAnalysisConfirmSchema", {}, "education", [
      [`${key} ${label}`, [{ ...cvEntries.education, [key]: n }], type],
    ]);
schema(g, "CvAnalysisConfirmSchema", {}, "projects", [
  [
    "technologies maximum count",
    [{ ...cvEntries.projects, technologies: Array(30).fill("TypeScript") }],
  ],
  [
    "technologies above count",
    [{ ...cvEntries.projects, technologies: Array(31).fill("TypeScript") }],
    "A",
  ],
  ["technology empty", [{ ...cvEntries.projects, technologies: [""] }], "A"],
  [
    "technology maximum entry",
    [{ ...cvEntries.projects, technologies: ["x".repeat(60)] }],
  ],
  [
    "technology above entry",
    [{ ...cvEntries.projects, technologies: ["x".repeat(61)] }],
    "A",
  ],
]);
schema(g, "CvAnalysisConfirmSchema", {}, "unexpected", [
  ["unknown field", "value", "A"],
]);
schema(
  groups.find((g) => g.key === "reviews" && g.method === "create"),
  "CreateReviewSchema",
  {},
  "overallRating",
  [["missing", undefined, "A"]],
);
schema(
  groups.find((g) => g.key === "reviews" && g.method === "update"),
  "UpdateReviewSchema",
  {},
  "overallRating",
  [["empty update", undefined, "A"]],
);

function generate() {
  // Primary matrices follow the UC order supplied by Nhat Huy. A method shared
  // by multiple UCs keeps one matrix; supporting methods follow the primary list.
  const primaryOrder = [
    "profiles.viewProfile",
    "profiles.updateProfile",
    "profiles.getSkills",
    "profiles.addSkill",
    "profiles.deleteSkill",
    "portfolios.getPortfolios",
    "portfolios.addPortfolio",
    "portfolios.getPortfolioDetail",
    "portfolios.updatePortfolio",
    "portfolios.deletePortfolio",
    "account.uploadIdentityDocument",
    "account.getIdentityStatus",
    "account.getClientProfile",
    "account.updateClientProfile",
    "account.getSocialLinks",
    "account.addSocialLink",
    "account.deleteSocialLink",
    "account.getFavorites",
    "account.addFavorite",
    "account.removeFavorite",
    "account.getFollowing",
    "account.followFreelancer",
    "account.unfollowFreelancer",
    "notifications.getAll",
    "notifications.markRead",
    "notifications.markAllRead",
    "notifications.delete",
    "roles.switchRole",
    "roles.joinRole",
    "reviews.list",
    "reviews.detail",
    "reviews.create",
    "reviews.update",
    "reviews.remove",
    "reviews.respond",
    "reviews.updateResponse",
    "reviews.removeResponse",
    "account.getGeneralProfile",
    "account.updateGeneralProfile",
    "account.changePassword",
    "account.uploadAvatar",
    "revisions.list",
    "revisions.detail",
    "revisions.approve",
    "revisions.reject",
    "revisions.latestForUser",
    "expert.submitUpdate",
    "profiles.uploadCv",
    "profiles.replaceCv",
    "profiles.getCvFile",
    "profiles.deleteCv",
  ];
  const supportingOrder = [
    "revisions.requiresManualReview",
    "revisions.submit",
    "account.submitIdentityAiCheck",
    "profiles.analyzeCv",
    "profiles.getCvAnalysis",
    "profiles.confirmCvAnalysis",
    "profiles.discardCvAnalysis",
  ];
  const methodOrder = [...primaryOrder, ...supportingOrder];
  if (
    methodOrder.length !== groups.length ||
    new Set(methodOrder).size !== groups.length
  )
    throw new Error("Invalid Nhat Huy method order");
  for (const entry of groups)
    if (!methodOrder.includes(`${entry.key}.${entry.method}`))
      throw new Error(`Unordered method: ${entry.key}.${entry.method}`);
  groups.sort(
    (a, b) =>
      methodOrder.indexOf(`${a.key}.${a.method}`) -
      methodOrder.indexOf(`${b.key}.${b.method}`),
  );
  groups.forEach((entry, index) => {
    entry.id = `UF-${122 + index}`;
  });
  for (const g of groups) {
    const s = suites[g.key];
    g.className = s.cls;
    g.source = `apps/api/src/routes/${s.source}.service.ts`;
    const file = ts.createSourceFile(
      g.source,
      fs.readFileSync(path.join(root, g.source), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node) => {
      if (
        ts.isMethodDeclaration(node) &&
        node.name?.getText(file) === g.method
      ) {
        g.line =
          file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
        g.loc = file.getLineAndCharacterOfPosition(node.end).line + 2 - g.line;
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    for (const c of g.cases)
      c.confirm = c.confirm.replace(/shared\.(\w+)\.(\w+)/g, (full, a, b) =>
        shared[a]?.[b] === undefined ? full : q(shared[a][b]),
      );
  }
  const out = path.join(root, "apps/api/test/nhuy");
  fs.mkdirSync(out, { recursive: true });
  for (const s of Object.values(suites)) {
    const own = groups.filter((g) => g.key === s.key);
    const imports = `import { Prisma } from '@prisma/client';\nimport * as shared from '@shared/types';\nimport * as path from 'path';\nimport * as storage from 'fs/promises';\nimport { ${s.cls} } from '../../src/routes/${s.source}.service';\n`;
    const storage = `jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));\n`;
    const mocks = `const repository={${s.methods.map((m) => `${m}:jest.fn()`).join(",")}};\nconst revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};\nconst cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};\nconst hashing={verify:jest.fn(),hash:jest.fn()};\nconst outbox={enqueueAndProcess:jest.fn()};\nconst ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};\nconst identityAi={verify:jest.fn(),livenessPose:jest.fn()};\nconst token={signAccessToken:jest.fn()};\nconst fixedDate=new Date('2026-11-09T00:00:00Z');\n`;
    const args = {
      profiles: "repository,cloudinary,ai,resolver,revisions,outbox",
      account: "repository,revisions,cloudinary,hashing,identityAi",
      portfolios: "repository",
      reviews: "repository",
      notifications: "repository",
      revisions: "repository",
      expert: "repository,revisions",
      roles: "{}, {}, {},repository,token",
    }[s.key];
    const construction = `const service=new ${s.cls}(${args
      .split(",")
      .map((a) => a.trim() + " as never")
      .join(",")});`;
    let text = `${storage}${imports}\n// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.\ndescribe('${s.cls} (${own[0].id} to ${own.at(-1).id})',()=>{\n${mocks}${construction}\nlet profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;\nbeforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();\ncloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);\nrevisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));\nfor(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});\n${s.setup.replace(/const (profile|user|contract|review|revision|expertUser)\s*=/g, "$1=")}\n});\n`;
    text = text.replace(
      "jest.resetAllMocks();",
      'jest.resetAllMocks();\nfor(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));',
    );
    for (const g of own) {
      text += `describe('${g.id} ${g.method}',()=>{\n`;
      for (const [i, c] of g.cases.entries())
        text += `// ${i === 0 ? g.id + ": " : ""}${c.id}: ${c.type === "A" ? "Từ chối" : "Xử lý"} tình huống ${c.name}; ${c.http ? "trả mã " + c.http : "đối chiếu kết quả và tác động phụ"}.\nit(${q(c.name)},async()=>{\n${c.arrange}\n\n${c.assertion}\n});\n`;
      text += "});\n";
    }
    text += "});\n";
    fs.writeFileSync(path.join(out, `${s.key}.unit-spec.ts`), text);
  }
  const coverage = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs/Report 3/nhuy-coverage.json"),
      "utf8",
    ),
  );
  const missing = coverage.functions.filter(
    (u) => !groups.some((g) => g.uc.includes(u.id)),
  );
  if (missing.length) throw Error("Unmapped UCs " + missing.map((u) => u.id));
  fs.writeFileSync(
    path.join(import.meta.dirname, "nhuy-test-catalog.json"),
    JSON.stringify(
      { date: "2026-11-09", owner: "Nguyen Lu Nhat Huy", groups },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${groups.length} methods; ${groups.reduce((n, g) => n + g.cases.length, 0)} cases; all ${coverage.count} UCs mapped`,
  );
}
generate();
