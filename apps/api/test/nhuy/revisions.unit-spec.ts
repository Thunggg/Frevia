jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { ProfileRevisionService } from '../../src/routes/profile-revisions/profile-revision.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('ProfileRevisionService (UF-163 to UF-174)',()=>{
const repository={findProfileForSnapshot:jest.fn(),submit:jest.fn(),findLatestForUser:jest.fn(),syncLowStrengthProfiles:jest.fn(),findMany:jest.fn(),findById:jest.fn(),review:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new ProfileRevisionService(repository as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
revision={id:11,status:'PENDING',profileType:'CLIENT',proposedData:{displayName:'Client',companyName:'Company'},userId:10};
repository.findById.mockResolvedValue(revision);repository.review.mockResolvedValue({...revision,status:'APPROVED'});
repository.findMany.mockResolvedValue({revisions:[revision],total:11});
repository.findLatestForUser.mockResolvedValue(null);
repository.findProfileForSnapshot.mockResolvedValue({id:5,displayName:'Client',bio:null,availabilityStatus:'AVAILABLE',clientProfile:{companyName:'Old'},freelancerProfile:null,expertProfile:null});
repository.submit.mockResolvedValue({id:11,status:'PENDING'});
});
describe('UF-163 list',()=>{
// UF-163: UTCID01: Xử lý tình huống paginates pending revisions; đối chiếu kết quả và tác động phụ.
it("paginates pending revisions",async()=>{


const result = await service.list({page:1,limit:10});
expect(result).toEqual({revisions:[revision],pagination:{page:1,limit:10,total:11,totalPages:2}});
expect(repository.syncLowStrengthProfiles).toHaveBeenCalledWith(20);
});
// UTCID02: Từ chối tình huống rejects page zero; trả mã 400.
it("rejects page zero",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":0,"limit":10});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["page"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID03: Xử lý tình huống accepts page minimum; đối chiếu kết quả và tác động phụ.
it("accepts page minimum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":10});
});
// UTCID04: Từ chối tình huống rejects page fraction; trả mã 400.
it("rejects page fraction",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1.5,"limit":10});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["page"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID05: Từ chối tình huống rejects limit zero; trả mã 400.
it("rejects limit zero",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":0});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["limit"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID06: Xử lý tình huống accepts limit minimum; đối chiếu kết quả và tác động phụ.
it("accepts limit minimum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":1});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":1});
});
// UTCID07: Xử lý tình huống accepts limit maximum; đối chiếu kết quả và tác động phụ.
it("accepts limit maximum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":100});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":100});
});
// UTCID08: Từ chối tình huống rejects limit above maximum; trả mã 400.
it("rejects limit above maximum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":101});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["limit"],"message":"Too big: expected number to be <=100"}]);
});
// UTCID09: Từ chối tình huống rejects status invalid; trả mã 400.
it("rejects status invalid",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"status":"INVALID"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["status"],"message":"Invalid option: expected one of \"PENDING\"|\"APPROVED\"|\"REJECTED\""}]);
});
// UTCID10: Xử lý tình huống accepts status pending; đối chiếu kết quả và tác động phụ.
it("accepts status pending",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"status":"PENDING"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":10,"status":"PENDING"});
});
// UTCID11: Từ chối tình huống rejects profileType invalid; trả mã 400.
it("rejects profileType invalid",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"profileType":"INVALID"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["profileType"],"message":"Invalid option: expected one of \"CLIENT\"|\"FREELANCER\"|\"EXPERT\""}]);
});
// UTCID12: Xử lý tình huống accepts profileType expert; đối chiếu kết quả và tác động phụ.
it("accepts profileType expert",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"profileType":"EXPERT"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":10,"profileType":"EXPERT"});
});
// UTCID13: Xử lý tình huống accepts search maximum; đối chiếu kết quả và tác động phụ.
it("accepts search maximum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"search":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"page":1,"limit":10,"search":'x'.repeat(255)});
});
// UTCID14: Từ chối tình huống rejects search above maximum; trả mã 400.
it("rejects search above maximum",async()=>{


const result = shared.ProfileRevisionAdminFilterSchema.safeParse({"page":1,"limit":10,"search":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["search"],"message":"Too big: expected string to have <=255 characters"}]);
});
});
describe('UF-164 detail',()=>{
// UF-164: UTCID01: Xử lý tình huống returns the expected result for detail; đối chiếu kết quả và tác động phụ.
it("returns the expected result for detail",async()=>{


const result = await service.detail(11);
expect(result).toEqual(revision);

});
// UTCID02: Từ chối tình huống rejects a missing revision; trả mã 404.
it("rejects a missing revision",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.detail(11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ProfileRevisionNotFound","path":"id"}],"error":"Not Found","statusCode":404}});

});
});
describe('UF-165 approve',()=>{
// UF-165: UTCID01: Xử lý tình huống returns the expected result for approve; đối chiếu kết quả và tác động phụ.
it("returns the expected result for approve",async()=>{


const result = await service.approve(11,99,' Approved ');
expect(result).toEqual({...revision,status:'APPROVED'});
expect(repository.review).toHaveBeenCalledWith(11,99,'APPROVED','Approved',expect.any(Object),'CLIENT');
});
// UTCID02: Từ chối tình huống rejects a missing revision; trả mã 404.
it("rejects a missing revision",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.approve(11,99,' Approved ')).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ProfileRevisionNotFound","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a revision that is no longer pending; trả mã 409.
it("rejects a revision that is no longer pending",async()=>{
repository.findById.mockResolvedValue({...revision,status:'APPROVED'});

await expect(service.approve(11,99,' Approved ')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ProfileRevisionAlreadyReviewed","path":"status"}],"error":"Conflict","statusCode":409}});
expect(repository.review).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống rejects a concurrent review claim; trả mã 409.
it("rejects a concurrent review claim",async()=>{
repository.review.mockResolvedValue(null);

await expect(service.approve(11,99,' Approved ')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ProfileRevisionAlreadyReviewed","path":"status"}],"error":"Conflict","statusCode":409}});

});
// UTCID05: Xử lý tình huống reviews a freelancer snapshot; đối chiếu kết quả và tác động phụ.
it("reviews a freelancer snapshot",async()=>{
repository.findById.mockResolvedValue({...revision,profileType:'FREELANCER',proposedData:{displayName:'Name',title:'Engineer'}});

const result = await service.approve(11,99,' Approved ');
expect(result).toEqual({...revision,status:'APPROVED'});

});
// UTCID06: Xử lý tình huống reviews a expert snapshot; đối chiếu kết quả và tác động phụ.
it("reviews a expert snapshot",async()=>{
repository.findById.mockResolvedValue({...revision,profileType:'EXPERT',proposedData:{displayName:'Expert',title:null,expertise:[],education:[],certifications:[]}});

const result = await service.approve(11,99,' Approved ');
expect(result).toEqual({...revision,status:'APPROVED'});

});
// UTCID07: Xử lý tình huống accepts reviewNotes null; đối chiếu kết quả và tác động phụ.
it("accepts reviewNotes null",async()=>{


const result = shared.ApproveProfileRevisionSchema.safeParse({"reviewNotes":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"reviewNotes":null});
});
// UTCID08: Xử lý tình huống accepts reviewNotes maximum; đối chiếu kết quả và tác động phụ.
it("accepts reviewNotes maximum",async()=>{


const result = shared.ApproveProfileRevisionSchema.safeParse({"reviewNotes":'x'.repeat(1000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"reviewNotes":'x'.repeat(1000)});
});
// UTCID09: Từ chối tình huống rejects reviewNotes above maximum; trả mã 400.
it("rejects reviewNotes above maximum",async()=>{


const result = shared.ApproveProfileRevisionSchema.safeParse({"reviewNotes":'x'.repeat(1001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["reviewNotes"],"message":"Too big: expected string to have <=1000 characters"}]);
});
});
describe('UF-166 reject',()=>{
// UF-166: UTCID01: Xử lý tình huống returns the expected result for reject; đối chiếu kết quả và tác động phụ.
it("returns the expected result for reject",async()=>{
repository.review.mockResolvedValue({...revision,status:'REJECTED'});

const result = await service.reject(11,99,' Fix data ');
expect(result).toEqual({...revision,status:'REJECTED'});
expect(repository.review).toHaveBeenCalledWith(11,99,'REJECTED','Fix data',expect.any(Object),'CLIENT');
});
// UTCID02: Từ chối tình huống rejects a missing revision; trả mã 404.
it("rejects a missing revision",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.reject(11,99,' Fix data ')).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ProfileRevisionNotFound","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a revision that is no longer pending; trả mã 409.
it("rejects a revision that is no longer pending",async()=>{
repository.findById.mockResolvedValue({...revision,status:'APPROVED'});

await expect(service.reject(11,99,' Fix data ')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ProfileRevisionAlreadyReviewed","path":"status"}],"error":"Conflict","statusCode":409}});
expect(repository.review).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống rejects a concurrent review claim; trả mã 409.
it("rejects a concurrent review claim",async()=>{
repository.review.mockResolvedValue(null);

await expect(service.reject(11,99,' Fix data ')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ProfileRevisionAlreadyReviewed","path":"status"}],"error":"Conflict","statusCode":409}});

});
// UTCID05: Xử lý tình huống reviews a freelancer snapshot; đối chiếu kết quả và tác động phụ.
it("reviews a freelancer snapshot",async()=>{
repository.findById.mockResolvedValue({...revision,profileType:'FREELANCER',proposedData:{displayName:'Name',title:'Engineer'}});

const result = await service.reject(11,99,' Fix data ');
expect(result).toEqual({...revision,status:'APPROVED'});

});
// UTCID06: Xử lý tình huống reviews a expert snapshot; đối chiếu kết quả và tác động phụ.
it("reviews a expert snapshot",async()=>{
repository.findById.mockResolvedValue({...revision,profileType:'EXPERT',proposedData:{displayName:'Expert',title:null,expertise:[],education:[],certifications:[]}});

const result = await service.reject(11,99,' Fix data ');
expect(result).toEqual({...revision,status:'APPROVED'});

});
// UTCID07: Từ chối tình huống rejects reviewNotes missing; trả mã 400.
it("rejects reviewNotes missing",async()=>{


const result = shared.RejectProfileRevisionSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["reviewNotes"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID08: Từ chối tình huống rejects reviewNotes empty; trả mã 400.
it("rejects reviewNotes empty",async()=>{


const result = shared.RejectProfileRevisionSchema.safeParse({"reviewNotes":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["reviewNotes"],"message":"A rejection reason is required."}]);
});
// UTCID09: Xử lý tình huống accepts reviewNotes minimum; đối chiếu kết quả và tác động phụ.
it("accepts reviewNotes minimum",async()=>{


const result = shared.RejectProfileRevisionSchema.safeParse({"reviewNotes":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"reviewNotes":"x"});
});
// UTCID10: Xử lý tình huống accepts reviewNotes maximum; đối chiếu kết quả và tác động phụ.
it("accepts reviewNotes maximum",async()=>{


const result = shared.RejectProfileRevisionSchema.safeParse({"reviewNotes":'x'.repeat(1000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"reviewNotes":'x'.repeat(1000)});
});
// UTCID11: Từ chối tình huống rejects reviewNotes above maximum; trả mã 400.
it("rejects reviewNotes above maximum",async()=>{


const result = shared.RejectProfileRevisionSchema.safeParse({"reviewNotes":'x'.repeat(1001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["reviewNotes"],"message":"Too big: expected string to have <=1000 characters"}]);
});
});
describe('UF-167 latestForUser',()=>{
// UF-167: UTCID01: Xử lý tình huống returns null when no revision exists; đối chiếu kết quả và tác động phụ.
it("returns null when no revision exists",async()=>{


const result = await service.latestForUser(10,'FREELANCER');
expect(result).toEqual({revision:null});

});
});
describe('UF-173 requiresManualReview',()=>{
// UF-173: UTCID01: Xử lý tình huống returns true for strength 19; đối chiếu kết quả và tác động phụ.
it("returns true for strength 19",async()=>{


expect(service.requiresManualReview(19)).toBe(true);
});
// UTCID02: Xử lý tình huống returns false for strength 20; đối chiếu kết quả và tác động phụ.
it("returns false for strength 20",async()=>{


expect(service.requiresManualReview(20)).toBe(false);
});
// UTCID03: Xử lý tình huống returns false for strength 21; đối chiếu kết quả và tác động phụ.
it("returns false for strength 21",async()=>{


expect(service.requiresManualReview(21)).toBe(false);
});
});
describe('UF-174 submit',()=>{
// UF-174: UTCID01: Xử lý tình huống stores a freelancer snapshot without publishing; đối chiếu kết quả và tác động phụ.
it("stores a freelancer snapshot without publishing",async()=>{


const result = await service.submitFreelancer(10,5,{displayName:'Name',title:'Engineer'},19);
expect(result).toEqual({message:shared.ProfileMessage.PROFILE_REVISION_SUBMITTED,reviewRequired:true,profileStrength:19,revision:{id:11,status:'PENDING'}});
expect(repository.submit).toHaveBeenCalledWith(10,5,'FREELANCER',expect.any(Object),expect.objectContaining({displayName:'Name',title:'Engineer'}),19);
});
// UTCID02: Xử lý tình huống stores a client snapshot without publishing; đối chiếu kết quả và tác động phụ.
it("stores a client snapshot without publishing",async()=>{


const result = await service.submitClient(10,5,{companyName:'Company'},19);
expect(result).toEqual({message:shared.ProfileMessage.PROFILE_REVISION_SUBMITTED,reviewRequired:true,profileStrength:19,revision:{id:11,status:'PENDING'}});
expect(repository.submit).toHaveBeenCalledWith(10,5,'CLIENT',expect.any(Object),expect.objectContaining({companyName:'Company'}),19);
});
// UTCID03: Xử lý tình huống stores a expert snapshot without publishing; đối chiếu kết quả và tác động phụ.
it("stores a expert snapshot without publishing",async()=>{


const result = await service.submitExpert(10,5,{displayName:'Expert',expertise:[],education:[],certifications:[]},19);
expect(result).toEqual({message:shared.ProfileMessage.PROFILE_REVISION_SUBMITTED,reviewRequired:true,profileStrength:19,revision:{id:11,status:'PENDING'}});
expect(repository.submit).toHaveBeenCalledWith(10,5,'EXPERT',expect.any(Object),expect.objectContaining({displayName:'Expert',expertise:[],education:[],certifications:[]}),19);
});
// UTCID04: Từ chối tình huống rejects a missing snapshot; trả mã 404.
it("rejects a missing snapshot",async()=>{
repository.findProfileForSnapshot.mockResolvedValue(null);

await expect(service.submitClient(10,5,{companyName:'Company'},19)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ProfileRevisionNotFound","path":"id"}],"error":"Not Found","statusCode":404}});

});
});
});
