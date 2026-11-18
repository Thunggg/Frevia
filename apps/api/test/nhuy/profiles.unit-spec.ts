jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { ProfileService } from '../../src/routes/profiles/profile.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('ProfileService (UF-122 to UF-179)',()=>{
const repository={findFreelancerProfileById:jest.fn(),updateCv:jest.fn(),clearCv:jest.fn(),findSkillsByProfileId:jest.fn(),createCvAnalysis:jest.fn(),findPendingCvAnalysis:jest.fn(),findCvAnalysisById:jest.fn(),findOrCreateCatalogSkill:jest.fn(),confirmCvAnalysis:jest.fn(),discardCvAnalysis:jest.fn(),updateFreelancerProfile:jest.fn(),searchActiveCatalogSkills:jest.fn(),findSkillByProfileIdAndSkillId:jest.fn(),addSkillToProfile:jest.fn(),findSkillById:jest.fn(),deleteSkill:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new ProfileService(repository as never,cloudinary as never,ai as never,resolver as never,revisions as never,outbox as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
profile= {id:5,userId:10,bio:'Existing bio',profileCompletionPercent:80,freelancerProfile:{id:7,education:['University'],certifications:[],languages:[],experience:[]},user:{userRoles:[{role:{name:'Freelancer'}}]}};
repository.findFreelancerProfileById.mockResolvedValue(profile);
repository.updateFreelancerProfile.mockResolvedValue({profileCompletionPercent:80});
repository.findSkillsByProfileId.mockResolvedValue([]);
repository.findOrCreateCatalogSkill.mockResolvedValue({id:3,name:'TypeScript'});
repository.findSkillByProfileIdAndSkillId.mockResolvedValue(null);
repository.addSkillToProfile.mockResolvedValue({id:11,skillId:3,proficiencyLevel:5});
repository.findSkillById.mockResolvedValue({id:11,freelancerProfile:{profile:{id:5,userId:10}}});
repository.deleteSkill.mockResolvedValue({id:11});
Object.assign(profile.freelancerProfile,{cvUrl:'local://cvs/10/cv.pdf',cvFileName:'cv.pdf',cvPublicId:null});
repository.updateCv.mockResolvedValue({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',cvUrl:'local://cvs/10/cv.pdf',freelancerProfile:{id:7,profile:{userId:10}}});
repository.confirmCvAnalysis.mockResolvedValue({profileCompletionPercent:90});repository.discardCvAnalysis.mockResolvedValue({id:40});
const draft={id:40,status:'PENDING',cvUrl:'local://cvs/10/cv.pdf',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[],payload:{skills:[],experience:[],education:[],projects:[],summary:null},createdAt:fixedDate,updatedAt:fixedDate};repository.createCvAnalysis.mockResolvedValue(draft);repository.findPendingCvAnalysis.mockResolvedValue(draft);ai.analyze.mockResolvedValue({skills:[],experience:[],education:[],projects:[],summary:null,meta:{source:'pdf_text',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]}});resolver.resolveSkillEntries.mockResolvedValue([]);
});
describe('UF-122 viewProfile',()=>{
// UF-122: UTCID01: Xử lý tình huống returns a freelancer profile; đối chiếu kết quả và tác động phụ.
it("returns a freelancer profile",async()=>{


const result = await service.viewProfile(5);
expect(result).toEqual(profile);

});
// UTCID02: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.viewProfile(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a non-freelancer profile; trả mã 404.
it("rejects a non-freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.viewProfile(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-123 updateProfile',()=>{
// UF-123: UTCID01: Xử lý tình huống updates an owned profile and preserves omitted fields; đối chiếu kết quả và tác động phụ.
it("updates an owned profile and preserves omitted fields",async()=>{


const result = await service.updateProfile(5,10,{displayName:'Name',title:'Engineer'});
expect(result).toEqual({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:80,revision:null});
expect(repository.updateFreelancerProfile).toHaveBeenCalledWith(5,expect.objectContaining({bio:'Existing bio',education:['University']}));expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:'UPSERT',documentType:'CV',documentId:5});
});
// UTCID02: Xử lý tình huống submits a weak profile for manual review; đối chiếu kết quả và tác động phụ.
it("submits a weak profile for manual review",async()=>{
revisions.requiresManualReview.mockReturnValue(true);

const result = await service.updateProfile(5,10,{displayName:'Name',title:'Engineer'});
expect(result).toEqual({reviewRequired:true});
expect(repository.updateFreelancerProfile).not.toHaveBeenCalled();expect(revisions.submitFreelancer).toHaveBeenCalled();
});
// UTCID03: Từ chối tình huống rejects updating another account; trả mã 403.
it("rejects updating another account",async()=>{


await expect(service.updateProfile(5,99,{displayName:'Name',title:'Engineer'})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.updateFreelancerProfile).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.updateProfile(5,10,{displayName:'Name',title:'Engineer'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects a profile without freelancer membership; trả mã 404.
it("rejects a profile without freelancer membership",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.updateProfile(5,10,{displayName:'Name',title:'Engineer'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID06: Từ chối tình huống rejects displayName missing; trả mã 400.
it("rejects displayName missing",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"title":"Engineer"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Display name is required."}]);
});
// UTCID07: Từ chối tình huống rejects displayName empty; trả mã 400.
it("rejects displayName empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"","title":"Engineer"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Display name is required."}]);
});
// UTCID08: Xử lý tình huống accepts displayName minimum; đối chiếu kết quả và tác động phụ.
it("accepts displayName minimum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"x","title":"Engineer"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"x","title":"Engineer"});
});
// UTCID09: Xử lý tình huống accepts displayName maximum; đối chiếu kết quả và tác động phụ.
it("accepts displayName maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":'x'.repeat(255),"title":"Engineer"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":'x'.repeat(255),"title":"Engineer"});
});
// UTCID10: Từ chối tình huống rejects displayName above maximum; trả mã 400.
it("rejects displayName above maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":'x'.repeat(256),"title":"Engineer"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID11: Từ chối tình huống rejects title missing; trả mã 400.
it("rejects title missing",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Title is required."}]);
});
// UTCID12: Từ chối tình huống rejects title empty; trả mã 400.
it("rejects title empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Title is required."}]);
});
// UTCID13: Xử lý tình huống accepts title minimum; đối chiếu kết quả và tác động phụ.
it("accepts title minimum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"x"});
});
// UTCID14: Xử lý tình huống accepts title maximum; đối chiếu kết quả và tác động phụ.
it("accepts title maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":'x'.repeat(255)});
});
// UTCID15: Từ chối tình huống rejects title above maximum; trả mã 400.
it("rejects title above maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID16: Xử lý tình huống accepts bio null; đối chiếu kết quả và tác động phụ.
it("accepts bio null",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","bio":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","bio":null});
});
// UTCID17: Xử lý tình huống accepts bio maximum; đối chiếu kết quả và tác động phụ.
it("accepts bio maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","bio":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","bio":'x'.repeat(5000)});
});
// UTCID18: Từ chối tình huống rejects bio above maximum; trả mã 400.
it("rejects bio above maximum",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","bio":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["bio"],"message":"Too big: expected string to have <=5000 characters"}]);
});
// UTCID19: Xử lý tình huống accepts availabilityStatus available; đối chiếu kết quả và tác động phụ.
it("accepts availabilityStatus available",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","availabilityStatus":"AVAILABLE"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","availabilityStatus":"AVAILABLE"});
});
// UTCID20: Từ chối tình huống rejects availabilityStatus invalid; trả mã 400.
it("rejects availabilityStatus invalid",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","availabilityStatus":"INVALID"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["availabilityStatus"],"message":"Invalid option: expected one of \"AVAILABLE\"|\"BUSY\"|\"AWAY\"|\"OFFLINE\""}]);
});
// UTCID21: Xử lý tình huống accepts education null; đối chiếu kết quả và tác động phụ.
it("accepts education null",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","education":null});
});
// UTCID22: Xử lý tình huống accepts education empty; đối chiếu kết quả và tác động phụ.
it("accepts education empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","education":[]});
});
// UTCID23: Xử lý tình huống accepts education maximum count; đối chiếu kết quả và tác động phụ.
it("accepts education maximum count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
});
// UTCID24: Từ chối tình huống rejects education above count; trả mã 400.
it("rejects education above count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID25: Từ chối tình huống rejects education empty entry; trả mã 400.
it("rejects education empty entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID26: Xử lý tình huống accepts education maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts education maximum entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":['x'.repeat(255)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","education":['x'.repeat(255)]});
});
// UTCID27: Từ chối tình huống rejects education above entry; trả mã 400.
it("rejects education above entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","education":['x'.repeat(256)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID28: Xử lý tình huống accepts certifications null; đối chiếu kết quả và tác động phụ.
it("accepts certifications null",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","certifications":null});
});
// UTCID29: Xử lý tình huống accepts certifications empty; đối chiếu kết quả và tác động phụ.
it("accepts certifications empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","certifications":[]});
});
// UTCID30: Xử lý tình huống accepts certifications maximum count; đối chiếu kết quả và tác động phụ.
it("accepts certifications maximum count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
});
// UTCID31: Từ chối tình huống rejects certifications above count; trả mã 400.
it("rejects certifications above count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID32: Từ chối tình huống rejects certifications empty entry; trả mã 400.
it("rejects certifications empty entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID33: Xử lý tình huống accepts certifications maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts certifications maximum entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":['x'.repeat(255)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","certifications":['x'.repeat(255)]});
});
// UTCID34: Từ chối tình huống rejects certifications above entry; trả mã 400.
it("rejects certifications above entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","certifications":['x'.repeat(256)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications",0],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID35: Xử lý tình huống accepts languages null; đối chiếu kết quả và tác động phụ.
it("accepts languages null",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","languages":null});
});
// UTCID36: Xử lý tình huống accepts languages empty; đối chiếu kết quả và tác động phụ.
it("accepts languages empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","languages":[]});
});
// UTCID37: Xử lý tình huống accepts languages maximum count; đối chiếu kết quả và tác động phụ.
it("accepts languages maximum count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","languages":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
});
// UTCID38: Từ chối tình huống rejects languages above count; trả mã 400.
it("rejects languages above count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["languages"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID39: Từ chối tình huống rejects languages empty entry; trả mã 400.
it("rejects languages empty entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["languages",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID40: Xử lý tình huống accepts languages maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts languages maximum entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":['x'.repeat(255)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","languages":['x'.repeat(255)]});
});
// UTCID41: Từ chối tình huống rejects languages above entry; trả mã 400.
it("rejects languages above entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","languages":['x'.repeat(256)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["languages",0],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID42: Xử lý tình huống accepts experience null; đối chiếu kết quả và tác động phụ.
it("accepts experience null",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","experience":null});
});
// UTCID43: Xử lý tình huống accepts experience empty; đối chiếu kết quả và tác động phụ.
it("accepts experience empty",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","experience":[]});
});
// UTCID44: Xử lý tình huống accepts experience maximum count; đối chiếu kết quả và tác động phụ.
it("accepts experience maximum count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","experience":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
});
// UTCID45: Từ chối tình huống rejects experience above count; trả mã 400.
it("rejects experience above count",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID46: Từ chối tình huống rejects experience empty entry; trả mã 400.
it("rejects experience empty entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID47: Xử lý tình huống accepts experience maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts experience maximum entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":['x'.repeat(255)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Name","title":"Engineer","experience":['x'.repeat(255)]});
});
// UTCID48: Từ chối tình huống rejects experience above entry; trả mã 400.
it("rejects experience above entry",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","experience":['x'.repeat(256)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID49: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.UpdateFreelancerProfileSchema.safeParse({"displayName":"Name","title":"Engineer","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-124 getSkills',()=>{
// UF-124: UTCID01: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.getSkills(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID02: Từ chối tình huống rejects a profile without freelancer membership; trả mã 404.
it("rejects a profile without freelancer membership",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.getSkills(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Xử lý tình huống returns an empty skill list; đối chiếu kết quả và tác động phụ.
it("returns an empty skill list",async()=>{


const result = await service.getSkills(5);
expect(result).toEqual([]);

});
// UTCID04: Xử lý tình huống returns existing skills; đối chiếu kết quả và tác động phụ.
it("returns existing skills",async()=>{
repository.findSkillsByProfileId.mockResolvedValue([{id:11,skillId:3}]);

const result = await service.getSkills(5);
expect(result).toEqual([{id:11,skillId:3}]);

});
});
describe('UF-125 addSkill',()=>{
// UF-125: UTCID01: Từ chối tình huống rejects a missing profile; trả mã 404.
it("rejects a missing profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID02: Từ chối tình huống rejects a profile without freelancer membership; trả mã 404.
it("rejects a profile without freelancer membership",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Xử lý tình huống adds the canonical catalog skill; đối chiếu kết quả và tác động phụ.
it("adds the canonical catalog skill",async()=>{


const result = await service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5});
expect(result).toEqual({id:11,skillId:3,proficiencyLevel:5});
expect(repository.addSkillToProfile).toHaveBeenCalledWith(5,3,5);expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:'UPSERT',documentType:'CV',documentId:5});
});
// UTCID04: Từ chối tình huống rejects adding to another account; trả mã 403.
it("rejects adding to another account",async()=>{


await expect(service.addSkill(5,99,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.findOrCreateCatalogSkill).not.toHaveBeenCalled();
});
// UTCID05: Từ chối tình huống rejects an existing skill; trả mã 400.
it("rejects an existing skill",async()=>{
repository.findSkillByProfileIdAndSkillId.mockResolvedValue({id:11});

await expect(service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This skill has already been added to your profile.","path":"skillName"}],"error":"Bad Request","statusCode":400}});
expect(repository.addSkillToProfile).not.toHaveBeenCalled();
});
// UTCID06: Từ chối tình huống maps a concurrent duplicate insertion; trả mã 400.
it("maps a concurrent duplicate insertion",async()=>{
repository.addSkillToProfile.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));

await expect(service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This skill has already been added to your profile.","path":"skillName"}],"error":"Bad Request","statusCode":400}});

});
// UTCID07: Từ chối tình huống propagates an unexpected repository error; đối chiếu kết quả và tác động phụ.
it("propagates an unexpected repository error",async()=>{
const failure=new Error('database offline');repository.addSkillToProfile.mockRejectedValue(failure);

await expect(service.addSkill(5,10,{skillName:'TypeScript',proficiencyLevel:5})).rejects.toBe(failure);
});
// UTCID08: Từ chối tình huống rejects skillName missing; trả mã 400.
it("rejects skillName missing",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"proficiencyLevel":5});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skillName"],"message":"Skill name is required."}]);
});
// UTCID09: Từ chối tình huống rejects skillName empty; trả mã 400.
it("rejects skillName empty",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"","proficiencyLevel":5});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skillName"],"message":"Skill name is required."}]);
});
// UTCID10: Xử lý tình huống accepts skillName minimum; đối chiếu kết quả và tác động phụ.
it("accepts skillName minimum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"x","proficiencyLevel":5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skillName":"x","proficiencyLevel":5});
});
// UTCID11: Xử lý tình huống accepts skillName maximum; đối chiếu kết quả và tác động phụ.
it("accepts skillName maximum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":'x'.repeat(100),"proficiencyLevel":5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skillName":'x'.repeat(100),"proficiencyLevel":5});
});
// UTCID12: Từ chối tình huống rejects skillName above maximum; trả mã 400.
it("rejects skillName above maximum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":'x'.repeat(101),"proficiencyLevel":5});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skillName"],"message":"Too big: expected string to have <=100 characters"}]);
});
// UTCID13: Từ chối tình huống rejects proficiencyLevel missing; trả mã 400.
it("rejects proficiencyLevel missing",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["proficiencyLevel"],"message":"Proficiency level is required."}]);
});
// UTCID14: Từ chối tình huống rejects proficiencyLevel zero; trả mã 400.
it("rejects proficiencyLevel zero",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":0});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["proficiencyLevel"],"message":"Proficiency level must be between 1 and 10."}]);
});
// UTCID15: Xử lý tình huống accepts proficiencyLevel minimum; đối chiếu kết quả và tác động phụ.
it("accepts proficiencyLevel minimum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":1});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skillName":"TypeScript","proficiencyLevel":1});
});
// UTCID16: Xử lý tình huống accepts proficiencyLevel maximum; đối chiếu kết quả và tác động phụ.
it("accepts proficiencyLevel maximum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":10});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skillName":"TypeScript","proficiencyLevel":10});
});
// UTCID17: Từ chối tình huống rejects proficiencyLevel above maximum; trả mã 400.
it("rejects proficiencyLevel above maximum",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":11});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["proficiencyLevel"],"message":"Proficiency level must be between 1 and 10."}]);
});
// UTCID18: Từ chối tình huống rejects proficiencyLevel fraction; trả mã 400.
it("rejects proficiencyLevel fraction",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":1.5});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["proficiencyLevel"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID19: Từ chối tình huống rejects proficiencyLevel string; trả mã 400.
it("rejects proficiencyLevel string",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":"5"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["proficiencyLevel"],"message":"Proficiency level is required."}]);
});
// UTCID20: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.AddFreelancerSkillSchema.safeParse({"skillName":"TypeScript","proficiencyLevel":5,"unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-126 deleteSkill',()=>{
// UF-126: UTCID01: Xử lý tình huống deletes an owned skill; đối chiếu kết quả và tác động phụ.
it("deletes an owned skill",async()=>{


const result = await service.deleteSkill(11,10);
expect(result).toEqual({id:11});
expect(repository.deleteSkill).toHaveBeenCalledWith(11);expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({eventType:"UPSERT",documentType:"CV",documentId:5});
});
// UTCID02: Từ chối tình huống rejects a missing skill; trả mã 404.
it("rejects a missing skill",async()=>{
repository.findSkillById.mockResolvedValue(null);

await expect(service.deleteSkill(11,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Skill not found or already deleted.","path":"skillId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects deleting another account skill; trả mã 403.
it("rejects deleting another account skill",async()=>{


await expect(service.deleteSkill(11,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only delete your own skills.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.deleteSkill).not.toHaveBeenCalled();
});
});
describe('UF-169 uploadCv',()=>{
// UF-169: UTCID01: Xử lý tình huống returns the expected result for uploadCv; đối chiếu kết quả và tác động phụ.
it("returns the expected result for uploadCv",async()=>{


const result = await service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File);
expect(result).toEqual({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.uploadCv(5,99,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing CV file; trả mã 400.
it("rejects a missing CV file",async()=>{


await expect(service.uploadCv(5,10)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Please select a CV file.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID05: Từ chối tình huống rejects a CV above ten MiB; trả mã 400.
it("rejects a CV above ten MiB",async()=>{


await expect(service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:10485761,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"The CV must be 10 MB or smaller.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID06: Từ chối tình huống rejects a non PDF MIME type; trả mã 400.
it("rejects a non PDF MIME type",async()=>{


await expect(service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'text/plain',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Only PDF CV files are accepted.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID07: Từ chối tình huống rejects an invalid PDF signature; trả mã 400.
it("rejects an invalid PDF signature",async()=>{


await expect(service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('invalid')} as Express.Multer.File)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"The selected file is not a valid PDF.","path":"file"}],"error":"Bad Request","statusCode":400}});

});
// UTCID08: Xử lý tình huống accepts a CV of exactly ten MiB; đối chiếu kết quả và tác động phụ.
it("accepts a CV of exactly ten MiB",async()=>{


const result = await service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:10485760,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File);
expect(result).toEqual({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});

});
// UTCID09: Xử lý tình huống accepts a PDF signature after leading bytes; đối chiếu kết quả và tác động phụ.
it("accepts a PDF signature after leading bytes",async()=>{


const result = await service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('  %PDF-1.7')} as Express.Multer.File);
expect(result).toEqual({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});

});
// UTCID10: Xử lý tình huống replaces the previous cloud asset; đối chiếu kết quả và tác động phụ.
it("replaces the previous cloud asset",async()=>{
Object.assign(profile.freelancerProfile,{cvPublicId:'old-asset'});

const result = await service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File);
expect(result).toEqual({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});
expect(cloudinary.deleteFile).toHaveBeenCalledWith('old-asset');
});
});
describe('UF-170 replaceCv',()=>{
// UF-170: UTCID01: Xử lý tình huống returns the expected result for replaceCv; đối chiếu kết quả và tác động phụ.
it("returns the expected result for replaceCv",async()=>{


const result = await service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File);
expect(result).toEqual({cvUrl:'https://cdn.test/file',cvFileName:'cv.pdf'});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.uploadCv(5,10,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.uploadCv(5,99,{originalname:'cv.pdf',mimetype:'application/pdf',size:1024,buffer:Buffer.from('%PDF-1.7')} as Express.Multer.File)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-171 getCvFile',()=>{
// UF-171: UTCID01: Xử lý tình huống returns the expected result for getCvFile; đối chiếu kết quả và tác động phụ.
it("returns the expected result for getCvFile",async()=>{


const result = await service.getCvFile(5,10);
expect(result).toEqual({absolutePath:path.resolve('uploads/cvs/10/cv.pdf'),fileName:'cv.pdf'});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.getCvFile(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.getCvFile(5,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a profile without a CV; trả mã 404.
it("rejects a profile without a CV",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:null});

await expect(service.getCvFile(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV not found.","path":"cv"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Xử lý tình huống returns a remote CV URL; đối chiếu kết quả và tác động phụ.
it("returns a remote CV URL",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:'https://cdn.test/cv.pdf'});

const result = await service.getCvFile(5,10);
expect(result).toEqual({remoteUrl:'https://cdn.test/cv.pdf',fileName:'cv.pdf'});

});
// UTCID06: Từ chối tình huống rejects a stored path outside uploads; trả mã 404.
it("rejects a stored path outside uploads",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:'local://../../private.pdf'});

await expect(service.getCvFile(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV not found.","path":"cv"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-172 deleteCv',()=>{
// UF-172: UTCID01: Xử lý tình huống returns the expected result for deleteCv; đối chiếu kết quả và tác động phụ.
it("returns the expected result for deleteCv",async()=>{


const result = await service.deleteCv(5,10);
expect(result).toEqual({message:'CV deleted successfully.'});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.deleteCv(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.deleteCv(5,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a profile without a CV; trả mã 404.
it("rejects a profile without a CV",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:null});

await expect(service.deleteCv(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV not found.","path":"cv"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-176 analyzeCv',()=>{
// UF-176: UTCID01: Xử lý tình huống returns a pending CV analysis draft; đối chiếu kết quả và tác động phụ.
it("returns a pending CV analysis draft",async()=>{


const result = await service.analyzeCv(5,10);
expect(result).toEqual({suggestions:[],analysis:{id:40,status:'PENDING',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,isStale:false,payload:{skills:[],experience:[],education:[],projects:[],summary:null},meta:{source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]},createdAt:fixedDate,updatedAt:fixedDate}});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.analyzeCv(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.analyzeCv(5,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a profile without a CV; trả mã 404.
it("rejects a profile without a CV",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:null});

await expect(service.analyzeCv(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV not found.","path":"cv"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống maps an unavailable AI service; trả mã 503.
it("maps an unavailable AI service",async()=>{
ai.analyze.mockRejectedValue(new Error('AI offline'));

await expect(service.analyzeCv(5,10)).rejects.toMatchObject({status: 503, response: {"message":[{"message":"The AI CV analysis service is unavailable. Please try again later.","path":"cv"}],"error":"Service Unavailable","statusCode":503}});
expect(repository.createCvAnalysis).not.toHaveBeenCalled();
});
// UTCID06: Xử lý tình huống deduplicates canonical skill suggestions; đối chiếu kết quả và tác động phụ.
it("deduplicates canonical skill suggestions",async()=>{
ai.analyze.mockResolvedValue({skills:[{name:'JS',proficiencyLevel:5},{name:'JavaScript',proficiencyLevel:6},{name:'Python',proficiencyLevel:4}],experience:[],education:[],projects:[],summary:null,meta:{source:'pdf_text',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]}});resolver.resolveSkillEntries.mockResolvedValue([{name:'JS',skill:{name:'JavaScript'}},{name:'JavaScript',skill:{name:'JavaScript'}},{name:'Python',skill:{name:'Python'}}]);repository.findSkillsByProfileId.mockResolvedValue([{skill:{name:'python'}}]);

const result=await service.analyzeCv(5,10);
expect(result.suggestions).toEqual([{skillName:'JavaScript',proficiencyLevel:5}]);
});
});
describe('UF-177 getCvAnalysis',()=>{
// UF-177: UTCID01: Xử lý tình huống returns a pending CV analysis draft; đối chiếu kết quả và tác động phụ.
it("returns a pending CV analysis draft",async()=>{


const result = await service.getCvAnalysis(5,10);
expect(result).toEqual({id:40,status:'PENDING',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,isStale:false,payload:{skills:[],experience:[],education:[],projects:[],summary:null},meta:{source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]},createdAt:fixedDate,updatedAt:fixedDate});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.getCvAnalysis(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.getCvAnalysis(5,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing pending draft; trả mã 404.
it("rejects a missing pending draft",async()=>{
repository.findPendingCvAnalysis.mockResolvedValue(null);

await expect(service.getCvAnalysis(5,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV analysis draft not found.","path":"analysisId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Xử lý tình huống flags a draft from a replaced CV; đối chiếu kết quả và tác động phụ.
it("flags a draft from a replaced CV",async()=>{
Object.assign(profile.freelancerProfile,{cvUrl:'new.pdf'});

const result = await service.getCvAnalysis(5,10);
expect(result).toEqual({id:40,status:'PENDING',cvFileName:'cv.pdf',cvUploadedAt:fixedDate,isStale:true,payload:{skills:[],experience:[],education:[],projects:[],summary:null},meta:{source:'PDF_TEXT',pages:1,chars:100,truncated:false,ocrUsed:false,model:null,durationMs:10,warnings:[]},createdAt:fixedDate,updatedAt:fixedDate});

});
});
describe('UF-178 confirmCvAnalysis',()=>{
// UF-178: UTCID01: Xử lý tình huống returns the expected result for confirmCvAnalysis; đối chiếu kết quả và tác động phụ.
it("returns the expected result for confirmCvAnalysis",async()=>{


const result = await service.confirmCvAnalysis(5,10,40,{});
expect(result).toEqual({message:shared.ProfileMessage.CV_ANALYSIS_CONFIRMED,status:'CONFIRMED',counts:{skills:0,experience:0,education:0,projects:0},profileCompletionPercent:90});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.confirmCvAnalysis(5,99,40,{})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing analysis; trả mã 404.
it("rejects a missing analysis",async()=>{
repository.findCvAnalysisById.mockResolvedValue(null);

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV analysis draft not found.","path":"analysisId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects an analysis for a different freelancer profile; trả mã 404.
it("rejects an analysis for a different freelancer profile",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:99,profile:{userId:10}}});

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV analysis draft not found.","path":"analysisId"}],"error":"Not Found","statusCode":404}});

});
// UTCID06: Từ chối tình huống rejects a processed analysis; trả mã 400.
it("rejects a processed analysis",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'CONFIRMED',freelancerProfile:{id:7,profile:{userId:10}}});

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This CV analysis has already been confirmed or discarded.","path":"analysisId"}],"error":"Bad Request","statusCode":400}});

});
// UTCID07: Từ chối tình huống rejects an analysis owned by another user; trả mã 403.
it("rejects an analysis owned by another user",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:7,profile:{userId:99}}});

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID08: Từ chối tình huống rejects a lost optimistic claim; trả mã 400.
it("rejects a lost optimistic claim",async()=>{
repository.confirmCvAnalysis.mockResolvedValue(null);

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This CV analysis has already been confirmed or discarded.","path":"analysisId"}],"error":"Bad Request","statusCode":400}});

});
// UTCID09: Từ chối tình huống rejects an analysis of a replaced CV; trả mã 400.
it("rejects an analysis of a replaced CV",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',cvUrl:'old.pdf',freelancerProfile:{id:7,profile:{userId:10}}});

await expect(service.confirmCvAnalysis(5,10,40,{})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This analysis is outdated because the CV has changed. Please analyze the CV again.","path":"analysisId"}],"error":"Bad Request","statusCode":400}});

});
// UTCID10: Xử lý tình huống accepts skills empty; đối chiếu kết quả và tác động phụ.
it("accepts skills empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[]});
});
// UTCID11: Xử lý tình huống accepts skills maximum count; đối chiếu kết quả và tác động phụ.
it("accepts skills maximum count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5}]});
});
// UTCID12: Từ chối tình huống rejects skills above count; trả mã 400.
it("rejects skills above count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5},{"skillName":"TypeScript","proficiencyLevel":5}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills"],"message":"Too big: expected array to have <=50 items"}]);
});
// UTCID13: Xử lý tình huống accepts experience empty; đối chiếu kết quả và tác động phụ.
it("accepts experience empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[]});
});
// UTCID14: Xử lý tình huống accepts experience maximum count; đối chiếu kết quả và tác động phụ.
it("accepts experience maximum count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID15: Từ chối tình huống rejects experience above count; trả mã 400.
it("rejects experience above count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null},{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID16: Xử lý tình huống accepts education empty; đối chiếu kết quả và tác động phụ.
it("accepts education empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[]});
});
// UTCID17: Xử lý tình huống accepts education maximum count; đối chiếu kết quả và tác động phụ.
it("accepts education maximum count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID18: Từ chối tình huống rejects education above count; trả mã 400.
it("rejects education above count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null},{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education"],"message":"Too big: expected array to have <=10 items"}]);
});
// UTCID19: Xử lý tình huống accepts projects empty; đối chiếu kết quả và tác động phụ.
it("accepts projects empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[]});
});
// UTCID20: Xử lý tình huống accepts projects maximum count; đối chiếu kết quả và tác động phụ.
it("accepts projects maximum count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null}]});
});
// UTCID21: Từ chối tình huống rejects projects above count; trả mã 400.
it("rejects projects above count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null},{"name":"Project","technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID22: Xử lý tình huống accepts skills skillName maximum; đối chiếu kết quả và tác động phụ.
it("accepts skills skillName maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":'x'.repeat(100),"proficiencyLevel":5}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[{"skillName":'x'.repeat(100),"proficiencyLevel":5}]});
});
// UTCID23: Từ chối tình huống rejects skills skillName above maximum; trả mã 400.
it("rejects skills skillName above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":'x'.repeat(101),"proficiencyLevel":5}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills",0,"skillName"],"message":"Too big: expected string to have <=100 characters"}]);
});
// UTCID24: Từ chối tình huống rejects skills skillName empty; trả mã 400.
it("rejects skills skillName empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"","proficiencyLevel":5}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills",0,"skillName"],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID25: Xử lý tình huống accepts skills skillName minimum; đối chiếu kết quả và tác động phụ.
it("accepts skills skillName minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"x","proficiencyLevel":5}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[{"skillName":"x","proficiencyLevel":5}]});
});
// UTCID26: Xử lý tình huống accepts experience title maximum; đối chiếu kết quả và tác động phụ.
it("accepts experience title maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":'x'.repeat(150),"company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":'x'.repeat(150),"company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID27: Từ chối tình huống rejects experience title above maximum; trả mã 400.
it("rejects experience title above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":'x'.repeat(151),"company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0,"title"],"message":"Too big: expected string to have <=150 characters"}]);
});
// UTCID28: Xử lý tình huống accepts experience title null; đối chiếu kết quả và tác động phụ.
it("accepts experience title null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":null,"company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":null,"company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID29: Xử lý tình huống accepts experience company maximum; đối chiếu kết quả và tác động phụ.
it("accepts experience company maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":'x'.repeat(150),"startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":'x'.repeat(150),"startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID30: Từ chối tình huống rejects experience company above maximum; trả mã 400.
it("rejects experience company above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":'x'.repeat(151),"startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0,"company"],"message":"Too big: expected string to have <=150 characters"}]);
});
// UTCID31: Xử lý tình huống accepts experience company null; đối chiếu kết quả và tác động phụ.
it("accepts experience company null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":null,"startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":null,"startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID32: Xử lý tình huống accepts experience startDate maximum; đối chiếu kết quả và tác động phụ.
it("accepts experience startDate maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"xxxxxxxxxx","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"xxxxxxxxxx","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID33: Từ chối tình huống rejects experience startDate above maximum; trả mã 400.
it("rejects experience startDate above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"xxxxxxxxxxx","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0,"startDate"],"message":"Too big: expected string to have <=10 characters"}]);
});
// UTCID34: Xử lý tình huống accepts experience startDate null; đối chiếu kết quả và tác động phụ.
it("accepts experience startDate null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":null,"endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":null,"endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID35: Xử lý tình huống accepts experience endDate maximum; đối chiếu kết quả và tác động phụ.
it("accepts experience endDate maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":"xxxxxxxxxx","isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":"xxxxxxxxxx","isCurrent":true,"description":null}]});
});
// UTCID36: Từ chối tình huống rejects experience endDate above maximum; trả mã 400.
it("rejects experience endDate above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":"xxxxxxxxxxx","isCurrent":true,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0,"endDate"],"message":"Too big: expected string to have <=10 characters"}]);
});
// UTCID37: Xử lý tình huống accepts experience endDate null; đối chiếu kết quả và tác động phụ.
it("accepts experience endDate null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID38: Xử lý tình huống accepts experience description maximum; đối chiếu kết quả và tác động phụ.
it("accepts experience description maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":'x'.repeat(1000)}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":'x'.repeat(1000)}]});
});
// UTCID39: Từ chối tình huống rejects experience description above maximum; trả mã 400.
it("rejects experience description above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":'x'.repeat(1001)}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["experience",0,"description"],"message":"Too big: expected string to have <=1000 characters"}]);
});
// UTCID40: Xử lý tình huống accepts experience description null; đối chiếu kết quả và tác động phụ.
it("accepts experience description null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"experience":[{"title":"Engineer","company":"Company","startDate":"2020-01","endDate":null,"isCurrent":true,"description":null}]});
});
// UTCID41: Xử lý tình huống accepts education degree maximum; đối chiếu kết quả và tác động phụ.
it("accepts education degree maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":'x'.repeat(150),"school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":'x'.repeat(150),"school":"University","startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID42: Từ chối tình huống rejects education degree above maximum; trả mã 400.
it("rejects education degree above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":'x'.repeat(151),"school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"degree"],"message":"Too big: expected string to have <=150 characters"}]);
});
// UTCID43: Xử lý tình huống accepts education degree null; đối chiếu kết quả và tác động phụ.
it("accepts education degree null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":null,"school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":null,"school":"University","startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID44: Xử lý tình huống accepts education school maximum; đối chiếu kết quả và tác động phụ.
it("accepts education school maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":'x'.repeat(150),"startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":'x'.repeat(150),"startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID45: Từ chối tình huống rejects education school above maximum; trả mã 400.
it("rejects education school above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":'x'.repeat(151),"startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"school"],"message":"Too big: expected string to have <=150 characters"}]);
});
// UTCID46: Xử lý tình huống accepts education school null; đối chiếu kết quả và tác động phụ.
it("accepts education school null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":null,"startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":null,"startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID47: Xử lý tình huống accepts education description maximum; đối chiếu kết quả và tác động phụ.
it("accepts education description maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":'x'.repeat(1000)}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":'x'.repeat(1000)}]});
});
// UTCID48: Từ chối tình huống rejects education description above maximum; trả mã 400.
it("rejects education description above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":'x'.repeat(1001)}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"description"],"message":"Too big: expected string to have <=1000 characters"}]);
});
// UTCID49: Xử lý tình huống accepts education description null; đối chiếu kết quả và tác động phụ.
it("accepts education description null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2024,"description":null}]});
});
// UTCID50: Xử lý tình huống accepts projects name maximum; đối chiếu kết quả và tác động phụ.
it("accepts projects name maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":'x'.repeat(150),"technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":'x'.repeat(150),"technologies":["TypeScript"],"description":null}]});
});
// UTCID51: Từ chối tình huống rejects projects name above maximum; trả mã 400.
it("rejects projects name above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":'x'.repeat(151),"technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"name"],"message":"Too big: expected string to have <=150 characters"}]);
});
// UTCID52: Từ chối tình huống rejects projects name empty; trả mã 400.
it("rejects projects name empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"","technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"name"],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID53: Xử lý tình huống accepts projects name minimum; đối chiếu kết quả và tác động phụ.
it("accepts projects name minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"x","technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"x","technologies":["TypeScript"],"description":null}]});
});
// UTCID54: Xử lý tình huống accepts projects description maximum; đối chiếu kết quả và tác động phụ.
it("accepts projects description maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript"],"description":'x'.repeat(1000)}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"Project","technologies":["TypeScript"],"description":'x'.repeat(1000)}]});
});
// UTCID55: Từ chối tình huống rejects projects description above maximum; trả mã 400.
it("rejects projects description above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript"],"description":'x'.repeat(1001)}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"description"],"message":"Too big: expected string to have <=1000 characters"}]);
});
// UTCID56: Xử lý tình huống accepts projects description null; đối chiếu kết quả và tác động phụ.
it("accepts projects description null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"Project","technologies":["TypeScript"],"description":null}]});
});
// UTCID57: Xử lý tình huống accepts skills proficiency minimum; đối chiếu kết quả và tác động phụ.
it("accepts skills proficiency minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":1}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[{"skillName":"TypeScript","proficiencyLevel":1}]});
});
// UTCID58: Xử lý tình huống accepts skills proficiency maximum; đối chiếu kết quả và tác động phụ.
it("accepts skills proficiency maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":10}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"skills":[{"skillName":"TypeScript","proficiencyLevel":10}]});
});
// UTCID59: Từ chối tình huống rejects skills proficiency zero; trả mã 400.
it("rejects skills proficiency zero",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":0}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills",0,"proficiencyLevel"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID60: Từ chối tình huống rejects skills proficiency above maximum; trả mã 400.
it("rejects skills proficiency above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":11}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills",0,"proficiencyLevel"],"message":"Too big: expected number to be <=10"}]);
});
// UTCID61: Từ chối tình huống rejects skills proficiency fraction; trả mã 400.
it("rejects skills proficiency fraction",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"skills":[{"skillName":"TypeScript","proficiencyLevel":1.5}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["skills",0,"proficiencyLevel"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID62: Xử lý tình huống accepts education startYear minimum; đối chiếu kết quả và tác động phụ.
it("accepts education startYear minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":1950,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":1950,"endYear":2024,"description":null}]});
});
// UTCID63: Xử lý tình huống accepts education startYear maximum; đối chiếu kết quả và tác động phụ.
it("accepts education startYear maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2100,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2100,"endYear":2024,"description":null}]});
});
// UTCID64: Từ chối tình huống rejects education startYear below minimum; trả mã 400.
it("rejects education startYear below minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":1949,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"startYear"],"message":"Too small: expected number to be >=1950"}]);
});
// UTCID65: Từ chối tình huống rejects education startYear above maximum; trả mã 400.
it("rejects education startYear above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2101,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"startYear"],"message":"Too big: expected number to be <=2100"}]);
});
// UTCID66: Từ chối tình huống rejects education startYear fraction; trả mã 400.
it("rejects education startYear fraction",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020.5,"endYear":2024,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"startYear"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID67: Xử lý tình huống accepts education startYear null; đối chiếu kết quả và tác động phụ.
it("accepts education startYear null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":null,"endYear":2024,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":null,"endYear":2024,"description":null}]});
});
// UTCID68: Xử lý tình huống accepts education endYear minimum; đối chiếu kết quả và tác động phụ.
it("accepts education endYear minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":1950,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":1950,"description":null}]});
});
// UTCID69: Xử lý tình huống accepts education endYear maximum; đối chiếu kết quả và tác động phụ.
it("accepts education endYear maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2100,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2100,"description":null}]});
});
// UTCID70: Từ chối tình huống rejects education endYear below minimum; trả mã 400.
it("rejects education endYear below minimum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":1949,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"endYear"],"message":"Too small: expected number to be >=1950"}]);
});
// UTCID71: Từ chối tình huống rejects education endYear above maximum; trả mã 400.
it("rejects education endYear above maximum",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2101,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"endYear"],"message":"Too big: expected number to be <=2100"}]);
});
// UTCID72: Từ chối tình huống rejects education endYear fraction; trả mã 400.
it("rejects education endYear fraction",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":2020.5,"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0,"endYear"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID73: Xử lý tình huống accepts education endYear null; đối chiếu kết quả và tác động phụ.
it("accepts education endYear null",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":null,"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"education":[{"degree":"Bachelor","school":"University","startYear":2020,"endYear":null,"description":null}]});
});
// UTCID74: Xử lý tình huống accepts projects technologies maximum count; đối chiếu kết quả và tác động phụ.
it("accepts projects technologies maximum count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"Project","technologies":["TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript"],"description":null}]});
});
// UTCID75: Từ chối tình huống rejects projects technologies above count; trả mã 400.
it("rejects projects technologies above count",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript","TypeScript"],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"technologies"],"message":"Too big: expected array to have <=30 items"}]);
});
// UTCID76: Từ chối tình huống rejects projects technology empty; trả mã 400.
it("rejects projects technology empty",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":[""],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"technologies",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID77: Xử lý tình huống accepts projects technology maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts projects technology maximum entry",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],"description":null}]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"projects":[{"name":"Project","technologies":["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],"description":null}]});
});
// UTCID78: Từ chối tình huống rejects projects technology above entry; trả mã 400.
it("rejects projects technology above entry",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"projects":[{"name":"Project","technologies":["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],"description":null}]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projects",0,"technologies",0],"message":"Too big: expected string to have <=60 characters"}]);
});
// UTCID79: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.CvAnalysisConfirmSchema.safeParse({"unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-179 discardCvAnalysis',()=>{
// UF-179: UTCID01: Xử lý tình huống returns the expected result for discardCvAnalysis; đối chiếu kết quả và tác động phụ.
it("returns the expected result for discardCvAnalysis",async()=>{


const result = await service.discardCvAnalysis(5,10,40);
expect(result).toEqual({message:shared.ProfileMessage.CV_ANALYSIS_DISCARDED,status:'DISCARDED'});

});
// UTCID02: Từ chối tình huống rejects a missing freelancer profile; trả mã 404.
it("rejects a missing freelancer profile",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.discardCvAnalysis(5,10,40)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another CV owner; trả mã 403.
it("rejects another CV owner",async()=>{


await expect(service.discardCvAnalysis(5,99,40)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing analysis; trả mã 404.
it("rejects a missing analysis",async()=>{
repository.findCvAnalysisById.mockResolvedValue(null);

await expect(service.discardCvAnalysis(5,10,40)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV analysis draft not found.","path":"analysisId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống rejects an analysis for a different freelancer profile; trả mã 404.
it("rejects an analysis for a different freelancer profile",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:99,profile:{userId:10}}});

await expect(service.discardCvAnalysis(5,10,40)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"CV analysis draft not found.","path":"analysisId"}],"error":"Not Found","statusCode":404}});

});
// UTCID06: Từ chối tình huống rejects an analysis owned by another user; trả mã 403.
it("rejects an analysis owned by another user",async()=>{
repository.findCvAnalysisById.mockResolvedValue({id:40,status:'PENDING',freelancerProfile:{id:7,profile:{userId:99}}});

await expect(service.discardCvAnalysis(5,10,40)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only update your own profile.","path":"userId"}],"error":"Forbidden","statusCode":403}});

});
// UTCID07: Từ chối tình huống rejects a lost optimistic claim; trả mã 400.
it("rejects a lost optimistic claim",async()=>{
repository.discardCvAnalysis.mockResolvedValue(null);

await expect(service.discardCvAnalysis(5,10,40)).rejects.toMatchObject({status: 400, response: {"message":[{"message":"This CV analysis has already been confirmed or discarded.","path":"analysisId"}],"error":"Bad Request","statusCode":400}});

});
});
});
