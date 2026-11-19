jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { AuthService } from '../../src/routes/auth/auth.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('AuthService (UF-149 to UF-150)',()=>{
const repository={findUserByEmail:jest.fn(),createUserAndRegister:jest.fn(),findVerificationCodeByEmailAndType:jest.fn(),upsertVerificationCode:jest.fn(),findUserForLogin:jest.fn(),createSession:jest.fn(),findUniqueRefreshTokenIncludeUserRole:jest.fn(),deleteSessionByRefreshToken:jest.fn(),update:jest.fn(),deleteVerifycationCode:jest.fn(),findVerificationCode:jest.fn(),findUserById:jest.fn(),switchPrimaryRole:jest.fn(),joinRole:jest.fn(),findUserByEmailIncludeRoles:jest.fn(),createUserAndRegisterGoogle:jest.fn(),createOauthAccount:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new AuthService({} as never,{} as never,{} as never,repository as never,token as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
repository.switchPrimaryRole.mockResolvedValue({id:3,name:'Freelancer'});repository.joinRole.mockResolvedValue({status:'joined',role:{id:3,name:'Freelancer'}});token.signAccessToken.mockResolvedValue('access-token');
});
describe('UF-149 switchRole',()=>{
// UF-149: UTCID01: Xử lý tình huống issues a token for the same session; đối chiếu kết quả và tác động phụ.
it("issues a token for the same session",async()=>{


const result = await service.switchRole(10,22,{role:shared.RoleName.FREELANCER});
expect(result).toEqual({accessToken:'access-token'});
expect(token.signAccessToken).toHaveBeenCalledWith({userId:10,roleId:3,roleName:'Freelancer',sessionId:22});
});
// UTCID02: Từ chối tình huống rejects an unavailable role; trả mã 404.
it("rejects an unavailable role",async()=>{
repository.switchPrimaryRole.mockResolvedValue(null);

await expect(service.switchRole(10,22,{role:shared.RoleName.FREELANCER})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.RoleNotFound","path":"role"}],"error":"Not Found","statusCode":404}});
expect(token.signAccessToken).not.toHaveBeenCalled();
});
// UTCID03: Từ chối tình huống rejects role missing; trả mã 400.
it("rejects role missing",async()=>{


const result = shared.SwitchRoleBodySchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["role"],"message":"Invalid option: expected one of \"Freelancer\"|\"Client\""}]);
});
// UTCID04: Xử lý tình huống accepts role client; đối chiếu kết quả và tác động phụ.
it("accepts role client",async()=>{


const result = shared.SwitchRoleBodySchema.safeParse({"role":"Client"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"role":"Client"});
});
// UTCID05: Từ chối tình huống rejects role admin; trả mã 400.
it("rejects role admin",async()=>{


const result = shared.SwitchRoleBodySchema.safeParse({"role":"ADMIN"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["role"],"message":"Invalid option: expected one of \"Freelancer\"|\"Client\""}]);
});
});
describe('UF-150 joinRole',()=>{
// UF-150: UTCID01: Xử lý tình huống issues a token for the same session; đối chiếu kết quả và tác động phụ.
it("issues a token for the same session",async()=>{


const result = await service.joinRole(10,22,{role:shared.RoleName.FREELANCER});
expect(result).toEqual({accessToken:'access-token'});
expect(token.signAccessToken).toHaveBeenCalledWith({userId:10,roleId:3,roleName:'Freelancer',sessionId:22});
});
// UTCID02: Từ chối tình huống rejects an unavailable role; trả mã 404.
it("rejects an unavailable role",async()=>{
repository.joinRole.mockResolvedValue(null);

await expect(service.joinRole(10,22,{role:shared.RoleName.FREELANCER})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.RoleNotFound","path":"role"}],"error":"Not Found","statusCode":404}});
expect(token.signAccessToken).not.toHaveBeenCalled();
});
// UTCID03: Từ chối tình huống rejects an already assigned role; trả mã 409.
it("rejects an already assigned role",async()=>{
repository.joinRole.mockResolvedValue({status:'already-assigned'});

await expect(service.joinRole(10,22,{role:shared.RoleName.FREELANCER})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.RoleAlreadyAssigned","path":"role"}],"error":"Conflict","statusCode":409}});
expect(token.signAccessToken).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống maps a concurrent role assignment; trả mã 409.
it("maps a concurrent role assignment",async()=>{
repository.joinRole.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));

await expect(service.joinRole(10,22,{role:shared.RoleName.FREELANCER})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.RoleAlreadyAssigned","path":"role"}],"error":"Conflict","statusCode":409}});

});
// UTCID05: Từ chối tình huống rejects role missing; trả mã 400.
it("rejects role missing",async()=>{


const result = shared.JoinRoleBodySchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["role"],"message":"Invalid option: expected one of \"Freelancer\"|\"Client\""}]);
});
// UTCID06: Xử lý tình huống accepts role client; đối chiếu kết quả và tác động phụ.
it("accepts role client",async()=>{


const result = shared.JoinRoleBodySchema.safeParse({"role":"Client"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"role":"Client"});
});
// UTCID07: Từ chối tình huống rejects role admin; trả mã 400.
it("rejects role admin",async()=>{


const result = shared.JoinRoleBodySchema.safeParse({"role":"ADMIN"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["role"],"message":"Invalid option: expected one of \"Freelancer\"|\"Client\""}]);
});
});
});
