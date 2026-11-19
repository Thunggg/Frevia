jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { AccountProfileService } from '../../src/routes/account-profile/account-profile.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('AccountProfileService (UF-132 to UF-175)',()=>{
const repository={findGeneralProfile:jest.fn(),updateGeneralProfile:jest.fn(),findPasswordCredential:jest.fn(),updatePassword:jest.fn(),updateAvatar:jest.fn(),findUserWithRoles:jest.fn(),createIdentityDocument:jest.fn(),findIdentityDocuments:jest.fn(),findApprovedIdentityDocumentByIdentityNumber:jest.fn(),createIdentityAiDocument:jest.fn(),findIdentityDocumentById:jest.fn(),findClientProfile:jest.fn(),updateClientProfile:jest.fn(),findSocialLinks:jest.fn(),findSocialLinkByPlatform:jest.fn(),createSocialLink:jest.fn(),findSocialLinkById:jest.fn(),deleteSocialLink:jest.fn(),findFavorites:jest.fn(),findFavorite:jest.fn(),createFavorite:jest.fn(),deleteFavorite:jest.fn(),findFollowing:jest.fn(),findDiscoverableFreelancers:jest.fn(),findFollow:jest.fn(),createFollowWithNotification:jest.fn(),deleteFollow:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new AccountProfileService(repository as never,revisions as never,cloudinary as never,hashing as never,identityAi as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
user= {id:10,email:'client@example.test',profile:{id:5,userId:10,displayName:' Client ',profileCompletionPercent:80,avatarUrl:null,updatedAt:new Date('2026-11-09T00:00:00Z')},userRoles:[{isPrimary:true,role:{name:'Client'}}]};
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
hashing.verify.mockResolvedValue(true);hashing.hash.mockResolvedValue('new-hash');
identityAi.verify.mockResolvedValue({status:'VERIFIED',ocr:{front:{document_number:'0012 3456 7890'}},face_match:{match_score:0.99}});repository.findApprovedIdentityDocumentByIdentityNumber.mockResolvedValue(null);repository.createIdentityAiDocument.mockImplementation(async (data:Record<string,unknown>)=>({id:4,...data}));
});
describe('UF-132 uploadIdentityDocument',()=>{
// UF-132: UTCID01: Xử lý tình huống uploads an identity document; đối chiếu kết quả và tác động phụ.
it("uploads an identity document",async()=>{


const result = await service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-')} as Express.Multer.File);
expect(result).toEqual({id:4,fileUrl:'https://cdn.test/id.pdf',backFileUrl:null,qrConsistency:null});

});
// UTCID02: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-')} as Express.Multer.File)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without FREELANCER membership; trả mã 403.
it("rejects an account without FREELANCER membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-')} as Express.Multer.File)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing identity document; trả mã 400.
it("rejects a missing identity document",async()=>{


await expect(service.uploadIdentityDocument(30,'ID_CARD')).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please select an identity document.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID05: Từ chối tình huống rejects an identity document above ten MiB; trả mã 400.
it("rejects an identity document above ten MiB",async()=>{


await expect(service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'application/pdf',size:10485761,buffer:Buffer.from('%PDF-')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only PDF, JPG, JPEG, or PNG files up to 10 MB are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID06: Từ chối tình huống rejects an unsupported identity MIME type; trả mã 400.
it("rejects an unsupported identity MIME type",async()=>{


await expect(service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'text/plain',size:1024,buffer:Buffer.from('%PDF-')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only PDF, JPG, JPEG, or PNG files up to 10 MB are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID07: Xử lý tình huống accepts an identity document of exactly ten MiB; đối chiếu kết quả và tác động phụ.
it("accepts an identity document of exactly ten MiB",async()=>{


const result = await service.uploadIdentityDocument(30,'ID_CARD',{originalname:'id.pdf',mimetype:'application/pdf',size:10485760,buffer:Buffer.from('%PDF-')} as Express.Multer.File);
expect(result).toEqual({id:4,fileUrl:'https://cdn.test/id.pdf',backFileUrl:null,qrConsistency:null});

});
// UTCID08: Từ chối tình huống rejects documentType missing; trả mã 400.
it("rejects documentType missing",async()=>{


const result = shared.UploadIdentityDocumentSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["documentType"],"message":"Invalid option: expected one of \"PASSPORT\"|\"ID_CARD\"|\"DRIVER_LICENSE\"|\"RESIDENCE_PERMIT\"|\"OTHER\""}]);
});
// UTCID09: Từ chối tình huống rejects documentType invalid; trả mã 400.
it("rejects documentType invalid",async()=>{


const result = shared.UploadIdentityDocumentSchema.safeParse({"documentType":"INVALID"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["documentType"],"message":"Invalid option: expected one of \"PASSPORT\"|\"ID_CARD\"|\"DRIVER_LICENSE\"|\"RESIDENCE_PERMIT\"|\"OTHER\""}]);
});
// UTCID10: Xử lý tình huống accepts documentType passport; đối chiếu kết quả và tác động phụ.
it("accepts documentType passport",async()=>{


const result = shared.UploadIdentityDocumentSchema.safeParse({"documentType":"PASSPORT"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"documentType":"PASSPORT"});
});
// UTCID11: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.UploadIdentityDocumentSchema.safeParse({"documentType":"ID_CARD","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-133 getIdentityStatus',()=>{
// UF-133: UTCID01: Xử lý tình huống returns null before any submission; đối chiếu kết quả và tác động phụ.
it("returns null before any submission",async()=>{


const result = await service.getIdentityStatus(30);
expect(result).toEqual({status:null,documents:[]});

});
// UTCID02: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.getIdentityStatus(30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without FREELANCER membership; trả mã 403.
it("rejects an account without FREELANCER membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.getIdentityStatus(30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Xử lý tình huống presents local front and back document URLs; đối chiếu kết quả và tác động phụ.
it("presents local front and back document URLs",async()=>{
repository.findIdentityDocuments.mockResolvedValue([{id:4,status:'PENDING',fileUrl:'local://id/front.png',backFileUrl:'local://id/back.png'}]);

const result = await service.getIdentityStatus(30);
expect(result).toEqual({status:'PENDING',documents:[{id:4,status:'PENDING',fileUrl:'/api/backend/identity-verifications/documents/4/file',backFileUrl:'/api/backend/identity-verifications/documents/4/file?side=back',qrConsistency:null}]});

});
});
describe('UF-134 getClientProfile',()=>{
// UF-134: UTCID01: Xử lý tình huống returns the client profile; đối chiếu kết quả và tác động phụ.
it("returns the client profile",async()=>{


const result = await service.getClientProfile(10);
expect(result).toEqual({id:5,user:{userRoles:[{role:{name:'Client'}}]},clientProfile:{id:8}});

});
// UTCID02: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findClientProfile.mockResolvedValue(null);

await expect(service.getClientProfile(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Client profile not found.","path":"userId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a missing role; trả mã 404.
it("rejects a missing role",async()=>{
repository.findClientProfile.mockResolvedValue({user:{userRoles:[]},clientProfile:{id:8}});

await expect(service.getClientProfile(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Client profile not found.","path":"userId"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects a missing clientProfile; trả mã 404.
it("rejects a missing clientProfile",async()=>{
repository.findClientProfile.mockResolvedValue({user:{userRoles:[{role:{name:'Client'}}]},clientProfile:null});

await expect(service.getClientProfile(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Client profile not found.","path":"userId"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-135 updateClientProfile',()=>{
// UF-135: UTCID01: Xử lý tình huống updates company information directly; đối chiếu kết quả và tác động phụ.
it("updates company information directly",async()=>{


const result = await service.updateClientProfile(10,{companyName:'Company'});
expect(result).toEqual({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null});

});
// UTCID02: Xử lý tình huống queues company information for manual review; đối chiếu kết quả và tác động phụ.
it("queues company information for manual review",async()=>{
revisions.requiresManualReview.mockReturnValue(true);

const result = await service.updateClientProfile(10,{companyName:'Company'});
expect(result).toEqual({reviewRequired:true});
expect(repository.updateClientProfile).not.toHaveBeenCalled();
});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.updateClientProfile(10,{companyName:'Company'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.updateClientProfile(10,{companyName:'Company'})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID05: Từ chối tình huống rejects companyName missing; trả mã 400.
it("rejects companyName missing",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["companyName"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID06: Từ chối tình huống rejects companyName empty; trả mã 400.
it("rejects companyName empty",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["companyName"],"message":"Error.CompanyNameRequired"}]);
});
// UTCID07: Xử lý tình huống accepts companyName minimum; đối chiếu kết quả và tác động phụ.
it("accepts companyName minimum",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":"x"});
});
// UTCID08: Xử lý tình huống accepts companyName maximum; đối chiếu kết quả và tác động phụ.
it("accepts companyName maximum",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":'x'.repeat(255)});
});
// UTCID09: Từ chối tình huống rejects companyName above maximum; trả mã 400.
it("rejects companyName above maximum",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["companyName"],"message":"Error.CompanyNameTooLong"}]);
});
// UTCID10: Xử lý tình huống accepts companyDescription null; đối chiếu kết quả và tác động phụ.
it("accepts companyDescription null",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","companyDescription":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":"Company","companyDescription":null});
});
// UTCID11: Xử lý tình huống accepts companyDescription maximum; đối chiếu kết quả và tác động phụ.
it("accepts companyDescription maximum",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","companyDescription":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":"Company","companyDescription":'x'.repeat(5000)});
});
// UTCID12: Từ chối tình huống rejects companyDescription above maximum; trả mã 400.
it("rejects companyDescription above maximum",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","companyDescription":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["companyDescription"],"message":"Error.CompanyDescriptionTooLong"}]);
});
// UTCID13: Xử lý tình huống accepts website null; đối chiếu kết quả và tác động phụ.
it("accepts website null",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","website":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":"Company","website":null});
});
// UTCID14: Xử lý tình huống accepts website valid; đối chiếu kết quả và tác động phụ.
it("accepts website valid",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","website":"https://example.test"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"companyName":"Company","website":"https://example.test"});
});
// UTCID15: Từ chối tình huống rejects website invalid; trả mã 400.
it("rejects website invalid",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","website":"invalid"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["website"],"message":"Error.InvalidWebsite"}]);
});
// UTCID16: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.UpdateClientProfileSchema.safeParse({"companyName":"Company","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-136 getSocialLinks',()=>{
// UF-136: UTCID01: Xử lý tình huống returns an empty social link list; đối chiếu kết quả và tác động phụ.
it("returns an empty social link list",async()=>{


const result = await service.getSocialLinks(10);
expect(result).toEqual([]);

});
// UTCID02: Từ chối tình huống rejects a missing social profile; trả mã 404.
it("rejects a missing social profile",async()=>{
repository.findSocialLinks.mockResolvedValue(null);

await expect(service.getSocialLinks(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-137 addSocialLink',()=>{
// UF-137: UTCID01: Xử lý tình huống creates a social link; đối chiếu kết quả và tác động phụ.
it("creates a social link",async()=>{


const result = await service.addSocialLink(10,{platform:'GITHUB',url:'https://github.com/test'});
expect(result).toEqual({id:4,platform:'GITHUB',url:'https://github.com/test'});
expect(repository.createSocialLink).toHaveBeenCalledWith(10,{platform:'GITHUB',url:'https://github.com/test'});
});
// UTCID02: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findSocialLinks.mockResolvedValue(null);

await expect(service.addSocialLink(10,{platform:'GITHUB',url:'https://github.com/test'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a duplicate platform; trả mã 409.
it("rejects a duplicate platform",async()=>{
repository.findSocialLinkByPlatform.mockResolvedValue({id:4});

await expect(service.addSocialLink(10,{platform:'GITHUB',url:'https://github.com/test'})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"A link for this platform already exists.","path":"platform"}],"error":"Conflict","statusCode":409}});
expect(repository.createSocialLink).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống rejects platform missing; trả mã 400.
it("rejects platform missing",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"url":"https://github.com/test"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["platform"],"message":"Invalid option: expected one of \"GITHUB\"|\"LINKEDIN\"|\"TWITTER\"|\"FACEBOOK\"|\"INSTAGRAM\"|\"YOUTUBE\"|\"WEBSITE\"|\"OTHER\""}]);
});
// UTCID05: Từ chối tình huống rejects platform invalid; trả mã 400.
it("rejects platform invalid",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"platform":"INVALID","url":"https://github.com/test"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["platform"],"message":"Invalid option: expected one of \"GITHUB\"|\"LINKEDIN\"|\"TWITTER\"|\"FACEBOOK\"|\"INSTAGRAM\"|\"YOUTUBE\"|\"WEBSITE\"|\"OTHER\""}]);
});
// UTCID06: Xử lý tình huống accepts platform other; đối chiếu kết quả và tác động phụ.
it("accepts platform other",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"platform":"OTHER","url":"https://github.com/test"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"platform":"OTHER","url":"https://github.com/test"});
});
// UTCID07: Từ chối tình huống rejects url missing; trả mã 400.
it("rejects url missing",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"platform":"GITHUB"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["url"],"message":"Error.InvalidUrl"}]);
});
// UTCID08: Từ chối tình huống rejects url invalid; trả mã 400.
it("rejects url invalid",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"platform":"GITHUB","url":"invalid"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["url"],"message":"Error.InvalidUrl"}]);
});
// UTCID09: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.AddSocialLinkSchema.safeParse({"platform":"GITHUB","url":"https://example.test","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-138 deleteSocialLink',()=>{
// UF-138: UTCID01: Xử lý tình huống deletes an owned social link; đối chiếu kết quả và tác động phụ.
it("deletes an owned social link",async()=>{


const result = await service.deleteSocialLink(10,4);
expect(result).toEqual({message:'Social link deleted successfully.'});
expect(repository.deleteSocialLink).toHaveBeenCalledWith(4);
});
// UTCID02: Từ chối tình huống rejects a missing social link; trả mã 404.
it("rejects a missing social link",async()=>{
repository.findSocialLinkById.mockResolvedValue(null);

await expect(service.deleteSocialLink(10,4)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Social link not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another social link owner; trả mã 403.
it("rejects another social link owner",async()=>{


await expect(service.deleteSocialLink(99,4)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});
expect(repository.deleteSocialLink).not.toHaveBeenCalled();
});
});
describe('UF-139 getFavorites',()=>{
// UF-139: UTCID01: Xử lý tình huống returns an empty relationship list; đối chiếu kết quả và tác động phụ.
it("returns an empty relationship list",async()=>{


const result = await service.getFavorites(10);
expect(result).toEqual([]);

});
// UTCID02: Xử lý tình huống omits freelancers with no freelancer profile; đối chiếu kết quả và tác động phụ.
it("omits freelancers with no freelancer profile",async()=>{
repository.findFavorites.mockResolvedValue([{freelancerId:30,createdAt:fixedDate,freelancer:{profile:null}},{freelancerId:31,createdAt:fixedDate,freelancer:{profile:{freelancerProfile:{id:8}}}}]);

const result = await service.getFavorites(10);
expect(result).toEqual([{freelancerId:31,createdAt:fixedDate,profile:{freelancerProfile:{id:8}}}]);

});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.getFavorites(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.getFavorites(10)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-140 addFavorite',()=>{
// UF-140: UTCID01: Xử lý tình huống creates a freelancer relationship; đối chiếu kết quả và tác động phụ.
it("creates a freelancer relationship",async()=>{


const result = await service.addFavorite(10,30);
expect(result).toEqual({message:"Freelancer added to favorites."});
expect(repository.createFavorite).toHaveBeenCalledWith(10,30);
});
// UTCID02: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.addFavorite(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.addFavorite(10,30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a self relationship; trả mã 404.
it("rejects a self relationship",async()=>{


await expect(service.addFavorite(10,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer not found.","path":"freelancerId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects a duplicate relationship; trả mã 409.
it("rejects a duplicate relationship",async()=>{
repository.findFavorite.mockResolvedValue({id:1});

await expect(service.addFavorite(10,30)).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Freelancer is already in your favorites.","path":"freelancerId"}],"error":"Conflict","statusCode":409}});
expect(repository.createFavorite).not.toHaveBeenCalled();
});
// UTCID06: Từ chối tình huống rejects a target without freelancer membership; trả mã 404.
it("rejects a target without freelancer membership",async()=>{
repository.findUserWithRoles.mockResolvedValueOnce(user).mockResolvedValueOnce({...user,userRoles:[]});

await expect(service.addFavorite(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer not found.","path":"freelancerId"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-141 removeFavorite',()=>{
// UF-141: UTCID01: Xử lý tình huống removes an existing relationship; đối chiếu kết quả và tác động phụ.
it("removes an existing relationship",async()=>{
repository.findFavorite.mockResolvedValue({id:1});

const result = await service.removeFavorite(10,30);
expect(result).toEqual({message:"Freelancer removed from favorites."});
expect(repository.deleteFavorite).toHaveBeenCalledWith(10,30);
});
// UTCID02: Từ chối tình huống rejects a missing relationship; trả mã 404.
it("rejects a missing relationship",async()=>{


await expect(service.removeFavorite(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Favorite freelancer not found.","path":"freelancerId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.removeFavorite(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.removeFavorite(10,30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-142 getFollowing',()=>{
// UF-142: UTCID01: Xử lý tình huống returns an empty relationship list; đối chiếu kết quả và tác động phụ.
it("returns an empty relationship list",async()=>{


const result = await service.getFollowing(10);
expect(result).toEqual([]);

});
// UTCID02: Xử lý tình huống omits freelancers with no freelancer profile; đối chiếu kết quả và tác động phụ.
it("omits freelancers with no freelancer profile",async()=>{
repository.findFollowing.mockResolvedValue([{freelancerId:30,createdAt:fixedDate,freelancer:{profile:null}},{freelancerId:31,createdAt:fixedDate,freelancer:{profile:{freelancerProfile:{id:8}}}}]);

const result = await service.getFollowing(10);
expect(result).toEqual([{freelancerId:31,createdAt:fixedDate,profile:{freelancerProfile:{id:8}}}]);

});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.getFollowing(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.getFollowing(10)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-143 followFreelancer',()=>{
// UF-143: UTCID01: Xử lý tình huống creates a freelancer relationship; đối chiếu kết quả và tác động phụ.
it("creates a freelancer relationship",async()=>{


const result = await service.followFreelancer(10,30);
expect(result).toEqual({message:"You are now following this freelancer."});
expect(repository.createFollowWithNotification).toHaveBeenCalledWith(10,30,'Client');
});
// UTCID02: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.followFreelancer(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.followFreelancer(10,30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a self relationship; trả mã 404.
it("rejects a self relationship",async()=>{


await expect(service.followFreelancer(10,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer not found.","path":"freelancerId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects a duplicate relationship; trả mã 409.
it("rejects a duplicate relationship",async()=>{
repository.findFollow.mockResolvedValue({id:1});

await expect(service.followFreelancer(10,30)).rejects.toMatchObject({status: 409, response: {"message":[{"message":"You are already following this freelancer.","path":"freelancerId"}],"error":"Conflict","statusCode":409}});
expect(repository.createFollowWithNotification).not.toHaveBeenCalled();
});
// UTCID06: Từ chối tình huống rejects a target without freelancer membership; trả mã 403.
it("rejects a target without freelancer membership",async()=>{
repository.findUserWithRoles.mockResolvedValueOnce(user).mockResolvedValueOnce({...user,userRoles:[]});

await expect(service.followFreelancer(10,30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID07: Xử lý tình huống uses the fallback follower name; đối chiếu kết quả và tác động phụ.
it("uses the fallback follower name",async()=>{
repository.findUserWithRoles.mockResolvedValueOnce({...user,profile:{...user.profile,displayName:' '}});

const result = await service.followFreelancer(10,30);
expect(result).toEqual({message:'You are now following this freelancer.'});
expect(repository.createFollowWithNotification).toHaveBeenCalledWith(10,30,'A client');
});
});
describe('UF-144 unfollowFreelancer',()=>{
// UF-144: UTCID01: Xử lý tình huống removes an existing relationship; đối chiếu kết quả và tác động phụ.
it("removes an existing relationship",async()=>{
repository.findFollow.mockResolvedValue({id:1});

const result = await service.unfollowFreelancer(10,30);
expect(result).toEqual({message:"You unfollowed this freelancer."});
expect(repository.deleteFollow).toHaveBeenCalledWith(10,30);
});
// UTCID02: Từ chối tình huống rejects a missing relationship; trả mã 404.
it("rejects a missing relationship",async()=>{


await expect(service.unfollowFreelancer(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Followed freelancer not found.","path":"freelancerId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.unfollowFreelancer(10,30)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects an account without CLIENT membership; trả mã 403.
it("rejects an account without CLIENT membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.unfollowFreelancer(10,30)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-159 getGeneralProfile',()=>{
// UF-159: UTCID01: Xử lý tình huống returns profile data with role membership; đối chiếu kết quả và tác động phụ.
it("returns profile data with role membership",async()=>{


const result = await service.getGeneralProfile(10);
expect(result).toEqual({...user.profile,email:user.email,roles:[{name:'Client',isPrimary:true}]});

});
// UTCID02: Từ chối tình huống rejects a missing general profile; trả mã 404.
it("rejects a missing general profile",async()=>{
repository.findGeneralProfile.mockResolvedValue(null);

await expect(service.getGeneralProfile(10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Xử lý tình huống presents a versioned local avatar URL; đối chiếu kết quả và tác động phụ.
it("presents a versioned local avatar URL",async()=>{
repository.findGeneralProfile.mockResolvedValue({...user,profile:{...user.profile,avatarUrl:'local://avatars/10/avatar.png'}});

const result = await service.getGeneralProfile(10);
expect(result).toEqual({...user.profile,avatarUrl:'/api/backend/account-profile/avatar/10/file?v=1794182400000',email:user.email,roles:[{name:'Client',isPrimary:true}]});

});
});
describe('UF-160 updateGeneralProfile',()=>{
// UF-160: UTCID01: Xử lý tình huống updates a strong profile directly; đối chiếu kết quả và tác động phụ.
it("updates a strong profile directly",async()=>{


const result = await service.updateGeneralProfile(10,{displayName:'Name'});
expect(result).toEqual({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null});

});
// UTCID02: Xử lý tình huống queues a weak primary profile; đối chiếu kết quả và tác động phụ.
it("queues a weak primary profile",async()=>{
revisions.requiresManualReview.mockReturnValue(true);

const result = await service.updateGeneralProfile(10,{displayName:'Name'});
expect(result).toEqual({reviewRequired:true});
expect(repository.updateGeneralProfile).not.toHaveBeenCalled();
});
// UTCID03: Xử lý tình huống updates an administrative profile; đối chiếu kết quả và tác động phụ.
it("updates an administrative profile",async()=>{
repository.findGeneralProfile.mockResolvedValue({...user,userRoles:[{isPrimary:true,role:{name:'Admin'}}]});

const result = await service.updateGeneralProfile(10,{displayName:'Name'});
expect(result).toEqual({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null});

});
// UTCID04: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findGeneralProfile.mockResolvedValue(null);

await expect(service.updateGeneralProfile(10,{displayName:'Name'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects displayName missing; trả mã 400.
it("rejects displayName missing",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID06: Từ chối tình huống rejects displayName empty; trả mã 400.
it("rejects displayName empty",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Error.DisplayNameRequired"}]);
});
// UTCID07: Xử lý tình huống accepts displayName minimum; đối chiếu kết quả và tác động phụ.
it("accepts displayName minimum",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"x"});
});
// UTCID08: Xử lý tình huống accepts displayName maximum; đối chiếu kết quả và tác động phụ.
it("accepts displayName maximum",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":'x'.repeat(255)});
});
// UTCID09: Từ chối tình huống rejects displayName above maximum; trả mã 400.
it("rejects displayName above maximum",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Error.DisplayNameTooLong"}]);
});
// UTCID10: Xử lý tình huống accepts bio null; đối chiếu kết quả và tác động phụ.
it("accepts bio null",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":"Name","bio":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","bio":null});
});
// UTCID11: Xử lý tình huống accepts bio maximum; đối chiếu kết quả và tác động phụ.
it("accepts bio maximum",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":"Name","bio":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","bio":'x'.repeat(5000)});
});
// UTCID12: Từ chối tình huống rejects bio above maximum; trả mã 400.
it("rejects bio above maximum",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":"Name","bio":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["bio"],"message":"Error.BioTooLong"}]);
});
// UTCID13: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.UpdateGeneralProfileSchema.safeParse({"displayName":"Name","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-161 changePassword',()=>{
// UF-161: UTCID01: Xử lý tình huống hashes and saves the new password; đối chiếu kết quả và tác động phụ.
it("hashes and saves the new password",async()=>{


const result = await service.changePassword(10,{currentPassword:'OldPass1',newPassword:'NewPass1',confirmPassword:'NewPass1'});
expect(result).toEqual({message:'Password changed successfully.'});
expect(hashing.verify).toHaveBeenCalledWith('OldPass1','old-hash');expect(hashing.hash).toHaveBeenCalledWith('NewPass1');expect(repository.updatePassword).toHaveBeenCalledWith(10,'new-hash');
});
// UTCID02: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findPasswordCredential.mockResolvedValue(null);

await expect(service.changePassword(10,{currentPassword:'OldPass1',newPassword:'NewPass1',confirmPassword:'NewPass1'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a social sign in account; trả mã 400.
it("rejects a social sign in account",async()=>{
repository.findPasswordCredential.mockResolvedValue({profile:{id:5},password:null});

await expect(service.changePassword(10,{currentPassword:'OldPass1',newPassword:'NewPass1',confirmPassword:'NewPass1'})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This account uses social sign-in and does not have a password yet.","path":"currentPassword"}],"error":"Bad Request","statusCode":400}});

});
// UTCID04: Từ chối tình huống rejects an incorrect current password; trả mã 400.
it("rejects an incorrect current password",async()=>{
hashing.verify.mockResolvedValue(false);

await expect(service.changePassword(10,{currentPassword:'OldPass1',newPassword:'NewPass1',confirmPassword:'NewPass1'})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Current password is incorrect.","path":"currentPassword"}],"error":"Bad Request","statusCode":400}});
expect(repository.updatePassword).not.toHaveBeenCalled();expect(hashing.hash).not.toHaveBeenCalled();
});
// UTCID05: Từ chối tình huống rejects currentPassword missing; trả mã 400.
it("rejects currentPassword missing",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"newPassword":"NewPass1","confirmPassword":"NewPass1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["currentPassword"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID06: Từ chối tình huống rejects currentPassword empty; trả mã 400.
it("rejects currentPassword empty",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"","newPassword":"NewPass1","confirmPassword":"NewPass1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["currentPassword"],"message":"Error.PasswordRequired"}]);
});
// UTCID07: Từ chối tình huống rejects confirmPassword mismatch; trả mã 400.
it("rejects confirmPassword mismatch",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"NewPass1","confirmPassword":"Different1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["confirmPassword"],"message":"Error.PasswordNotMatch"}]);
});
// UTCID08: Xử lý tình huống accepts newPassword minimum; đối chiếu kết quả và tác động phụ.
it("accepts newPassword minimum",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"NewPass1","confirmPassword":"NewPass1"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"currentPassword":"OldPass1","newPassword":"NewPass1","confirmPassword":"NewPass1"});
});
// UTCID09: Từ chối tình huống rejects newPassword below minimum; trả mã 400.
it("rejects newPassword below minimum",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"NewPas1","confirmPassword":"NewPas1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["newPassword"],"message":"Error.PasswordTooShort"}]);
});
// UTCID10: Xử lý tình huống accepts newPassword maximum; đối chiếu kết quả và tác động phụ.
it("accepts newPassword maximum",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","confirmPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"currentPassword":"OldPass1","newPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","confirmPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
});
// UTCID11: Từ chối tình huống rejects newPassword above maximum; trả mã 400.
it("rejects newPassword above maximum",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","confirmPassword":"A1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["newPassword"],"message":"Error.PasswordTooLong"}]);
});
// UTCID12: Từ chối tình huống rejects newPassword without uppercase; trả mã 400.
it("rejects newPassword without uppercase",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"newpass1","confirmPassword":"newpass1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["newPassword"],"message":"Error.PasswordNeedUppercase"}]);
});
// UTCID13: Từ chối tình huống rejects newPassword without number; trả mã 400.
it("rejects newPassword without number",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"NewPassx","confirmPassword":"NewPassx"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["newPassword"],"message":"Error.PasswordNeedNumber"}]);
});
// UTCID14: Từ chối tình huống rejects newPassword same current; trả mã 400.
it("rejects newPassword same current",async()=>{


const result = shared.ChangePasswordSchema.safeParse({"currentPassword":"OldPass1","newPassword":"OldPass1","confirmPassword":"OldPass1"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["newPassword"],"message":"Error.PasswordSameAsCurrent"}]);
});
});
describe('UF-162 uploadAvatar',()=>{
// UF-162: UTCID01: Xử lý tình huống uploads a valid avatar to cloud storage; đối chiếu kết quả và tác động phụ.
it("uploads a valid avatar to cloud storage",async()=>{


const result = await service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/png',size:8,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File);
expect(result).toEqual({avatarUrl:'https://cdn.test/file'});

});
// UTCID02: Từ chối tình huống rejects a missing avatar; trả mã 400.
it("rejects a missing avatar",async()=>{


await expect(service.uploadAvatar(10)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please select an avatar image.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID03: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findGeneralProfile.mockResolvedValue(null);

await expect(service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/png',size:8,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Từ chối tình huống rejects invalid avatar size; trả mã 400.
it("rejects invalid avatar size",async()=>{


await expect(service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/png',size:5242881,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only JPG, PNG, or WebP images up to 5 MB are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});
expect(repository.updateAvatar).not.toHaveBeenCalled();
});
// UTCID05: Từ chối tình huống rejects invalid avatar mime; trả mã 400.
it("rejects invalid avatar mime",async()=>{


await expect(service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/jpeg',size:8,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only JPG, PNG, or WebP images up to 5 MB are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});
expect(repository.updateAvatar).not.toHaveBeenCalled();
});
// UTCID06: Từ chối tình huống rejects invalid avatar signature; trả mã 400.
it("rejects invalid avatar signature",async()=>{


await expect(service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/png',size:8,buffer:Buffer.from('invalid')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only JPG, PNG, or WebP images up to 5 MB are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});
expect(repository.updateAvatar).not.toHaveBeenCalled();
});
// UTCID07: Xử lý tình huống accepts an avatar of exactly five MiB; đối chiếu kết quả và tác động phụ.
it("accepts an avatar of exactly five MiB",async()=>{


const result = await service.uploadAvatar(10,{originalname:'avatar.png',mimetype:'image/png',size:5242880,buffer:Buffer.from([137,80,78,71,13,10,26,10])} as Express.Multer.File);
expect(result).toEqual({avatarUrl:'https://cdn.test/file'});

});
});
describe('UF-175 submitIdentityAiCheck',()=>{
// UF-175: UTCID01: Xử lý tình huống keeps an AI verified identity pending for administrator review; đối chiếu kết quả và tác động phụ.
it("keeps an AI verified identity pending for administrator review",async()=>{


const result=await service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]});
expect(result.status).toBe('PENDING');expect(repository.createIdentityAiDocument).toHaveBeenCalledWith(expect.objectContaining({status:'PENDING',reviewNotes:null,aiStatus:'VERIFIED',aiScore:0.99}));expect(repository.findApprovedIdentityDocumentByIdentityNumber).toHaveBeenCalledWith(30,'001234567890');
});
// UTCID02: Từ chối tình huống rejects a missing account; trả mã 404.
it("rejects a missing account",async()=>{
repository.findUserWithRoles.mockResolvedValue(null);

await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Profile not found.","path":"profile"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without FREELANCER membership; trả mã 403.
it("rejects an account without FREELANCER membership",async()=>{
repository.findUserWithRoles.mockResolvedValue({...user,userRoles:[]});

await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"This action is not available for your role.","path":"role"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống requires a front image; trả mã 400.
it("requires a front image",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please provide the front image of your ID card.","path":"front"}],"error":"Bad Request","statusCode":400}});

});
// UTCID05: Từ chối tình huống requires a selfie image; trả mã 400.
it("requires a selfie image",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please complete the liveness check to capture a selfie.","path":"selfie"}],"error":"Bad Request","statusCode":400}});

});
// UTCID06: Từ chối tình huống rejects 0 liveness frames; trả mã 400.
it("rejects 0 liveness frames",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:Array(0).fill({originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File)})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please complete the liveness check before submitting.","path":"liveness"}],"error":"Bad Request","statusCode":400}});

});
// UTCID07: Từ chối tình huống rejects 41 liveness frames; trả mã 400.
it("rejects 41 liveness frames",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:Array(41).fill({originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File)})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please complete the liveness check before submitting.","path":"liveness"}],"error":"Bad Request","statusCode":400}});

});
// UTCID08: Từ chối tình huống rejects a liveness frame above two MiB; trả mã 400.
it("rejects a liveness frame above two MiB",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:2097153,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Liveness frames must be JPG, PNG, or WEBP images up to 2 MB (max 40 frames).","path":"liveness"}],"error":"Bad Request","statusCode":400}});

});
// UTCID09: Từ chối tình huống rejects a liveness frame with an unsupported MIME type; trả mã 400.
it("rejects a liveness frame with an unsupported MIME type",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'application/pdf',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Liveness frames must be JPG, PNG, or WEBP images up to 2 MB (max 40 frames).","path":"liveness"}],"error":"Bad Request","statusCode":400}});

});
// UTCID10: Từ chối tình huống rejects an already approved identity; trả mã 409.
it("rejects an already approved identity",async()=>{
repository.findIdentityDocuments.mockResolvedValue([{status:'APPROVED'}]);

await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Your identity has already been verified.","path":"documentType"}],"error":"Conflict","statusCode":409}});
expect(identityAi.verify).not.toHaveBeenCalled();
});
// UTCID11: Xử lý tình huống rejects a duplicate approved identity from another account; đối chiếu kết quả và tác động phụ.
it("rejects a duplicate approved identity from another account",async()=>{
repository.findApprovedIdentityDocumentByIdentityNumber.mockResolvedValue({id:99});

const result=await service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]});expect(result.status).toBe('REJECTED');expect(repository.createIdentityAiDocument).toHaveBeenCalledWith(expect.objectContaining({duplicateOfId:99,status:'REJECTED',reviewNotes:'This ID card (001234567890) is already verified by another account.'}));
});
// UTCID12: Xử lý tình huống keeps the AI rejection reason; đối chiếu kết quả và tác động phụ.
it("keeps the AI rejection reason",async()=>{
identityAi.verify.mockResolvedValue({status:'REJECTED',rejection_reason:' Face mismatch '});

const result=await service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]});expect(result.status).toBe('REJECTED');expect(result.reviewNotes).toBe('Face mismatch');
});
// UTCID13: Xử lý tình huống uses the fallback AI rejection reason; đối chiếu kết quả và tác động phụ.
it("uses the fallback AI rejection reason",async()=>{
identityAi.verify.mockResolvedValue({status:''});

const result=await service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]});expect(result.status).toBe('REJECTED');expect(result.aiStatus).toBe('UNKNOWN');expect(result.reviewNotes).toBe('AI verification failed.');
});
// UTCID14: Từ chối tình huống creates no document when AI verification fails; đối chiếu kết quả và tác động phụ.
it("creates no document when AI verification fails",async()=>{
const failure=new Error('AI offline');identityAi.verify.mockRejectedValue(failure);

await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toBe(failure);expect(repository.createIdentityAiDocument).not.toHaveBeenCalled();expect(cloudinary.uploadFile).not.toHaveBeenCalled();
});
// UTCID15: Xử lý tình huống accepts forty liveness frames; đối chiếu kết quả và tác động phụ.
it("accepts forty liveness frames",async()=>{


await service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:Array(40).fill({originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File)});expect(identityAi.verify).toHaveBeenCalledWith(expect.objectContaining({liveness:expect.any(Array)}));expect(identityAi.verify.mock.calls[0][0].liveness).toHaveLength(40);
});
// UTCID16: Từ chối tình huống rejects invalid front size; đối chiếu kết quả và tác động phụ.
it("rejects invalid front size",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:10485761,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status:400,response:{message:[{message:'Only JPG, PNG, or WEBP images up to 10 MB are accepted for AI verification.',path:'front'}]}});expect(identityAi.verify).not.toHaveBeenCalled();
});
// UTCID17: Từ chối tình huống rejects invalid front MIME type; đối chiếu kết quả và tác động phụ.
it("rejects invalid front MIME type",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'application/pdf',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status:400,response:{message:[{message:'Only JPG, PNG, or WEBP images up to 10 MB are accepted for AI verification.',path:'front'}]}});expect(identityAi.verify).not.toHaveBeenCalled();
});
// UTCID18: Từ chối tình huống rejects invalid selfie size; đối chiếu kết quả và tác động phụ.
it("rejects invalid selfie size",async()=>{


await expect(service.submitIdentityAiCheck(30,'ID_CARD',{front:{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File,selfie:{originalname:'id.png',mimetype:'image/png',size:10485761,buffer:Buffer.from('image')} as Express.Multer.File,liveness:[{originalname:'id.png',mimetype:'image/png',size:1024,buffer:Buffer.from('image')} as Express.Multer.File]})).rejects.toMatchObject({status:400,response:{message:[{message:'Only JPG, PNG, or WEBP images up to 10 MB are accepted for AI verification.',path:'selfie'}]}});expect(identityAi.verify).not.toHaveBeenCalled();
});
});
});
