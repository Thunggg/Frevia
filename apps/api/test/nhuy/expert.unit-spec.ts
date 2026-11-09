jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { ExpertProfileService } from '../../src/routes/expert-profile/expert-profile.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('ExpertProfileService (UF-168 to UF-168)',()=>{
const repository={findByUserId:jest.fn(),hasPendingRevision:jest.fn(),updateDirect:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new ExpertProfileService(repository as never,revisions as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
expertUser={id:10,profile:{id:5,displayName:'Expert',avatarUrl:null,bio:null,profileCompletionPercent:30,expertProfile:null},userRoles:[{role:{name:'Expert'}}]};
repository.findByUserId.mockResolvedValue(expertUser);repository.hasPendingRevision.mockResolvedValue(false);
});
describe('UF-168 submitUpdate',()=>{
// UF-168: UTCID01: Xử lý tình huống sanitizes lists and submits an expert revision; đối chiếu kết quả và tác động phụ.
it("sanitizes lists and submits an expert revision",async()=>{


const result = await service.submitUpdate(10,{displayName:'Expert',expertise:[' AI ','ai',''],education:[],certifications:[],website:''});
expect(result).toEqual({reviewRequired:true});
expect(revisions.submitExpert).toHaveBeenCalledWith(10,5,expect.objectContaining({expertise:['AI'],website:null}),expect.any(Number));
});
// UTCID02: Từ chối tình huống rejects a missing expert account; trả mã 404.
it("rejects a missing expert account",async()=>{
repository.findByUserId.mockResolvedValue(null);

await expect(service.submitUpdate(10,{displayName:'Expert',expertise:[' AI ','ai',''],education:[],certifications:[],website:''})).rejects.toMatchObject({status: 404, response: {"message":"Error.ExpertProfileNotFound","error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects an account without expert membership; trả mã 403.
it("rejects an account without expert membership",async()=>{
repository.findByUserId.mockResolvedValue({...expertUser,userRoles:[]});

await expect(service.submitUpdate(10,{displayName:'Expert',expertise:[' AI ','ai',''],education:[],certifications:[],website:''})).rejects.toMatchObject({status: 403, response: {"message":"Error.NotAnExpertAccount","error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a pending expert revision; trả mã 409.
it("rejects a pending expert revision",async()=>{
repository.hasPendingRevision.mockResolvedValue(true);

await expect(service.submitUpdate(10,{displayName:'Expert',expertise:[' AI ','ai',''],education:[],certifications:[],website:''})).rejects.toMatchObject({status: 409, response: {"message":"Error.ExpertProfilePendingRevision","error":"Conflict","statusCode":409}});
expect(revisions.submitExpert).not.toHaveBeenCalled();
});
// UTCID05: Từ chối tình huống rejects displayName missing; trả mã 400.
it("rejects displayName missing",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"expertise":[],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID06: Từ chối tình huống rejects displayName empty; trả mã 400.
it("rejects displayName empty",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"","expertise":[],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID07: Xử lý tình huống accepts displayName minimum; đối chiếu kết quả và tác động phụ.
it("accepts displayName minimum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"x","expertise":[],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"x","expertise":[],"education":[],"certifications":[]});
});
// UTCID08: Xử lý tình huống accepts displayName maximum; đối chiếu kết quả và tác động phụ.
it("accepts displayName maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":'x'.repeat(255),"expertise":[],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":'x'.repeat(255),"expertise":[],"education":[],"certifications":[]});
});
// UTCID09: Từ chối tình huống rejects displayName above maximum; trả mã 400.
it("rejects displayName above maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":'x'.repeat(256),"expertise":[],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["displayName"],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID10: Xử lý tình huống accepts title null; đối chiếu kết quả và tác động phụ.
it("accepts title null",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"title":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","title":null,"expertise":[],"education":[],"certifications":[]});
});
// UTCID11: Xử lý tình huống accepts title maximum; đối chiếu kết quả và tác động phụ.
it("accepts title maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"title":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","title":'x'.repeat(255),"expertise":[],"education":[],"certifications":[]});
});
// UTCID12: Từ chối tình huống rejects title above maximum; trả mã 400.
it("rejects title above maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"title":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Too big: expected string to have <=255 characters"}]);
});
// UTCID13: Xử lý tình huống accepts bio null; đối chiếu kết quả và tác động phụ.
it("accepts bio null",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"bio":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","bio":null,"expertise":[],"education":[],"certifications":[]});
});
// UTCID14: Xử lý tình huống accepts bio maximum; đối chiếu kết quả và tác động phụ.
it("accepts bio maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"bio":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","bio":'x'.repeat(5000),"expertise":[],"education":[],"certifications":[]});
});
// UTCID15: Từ chối tình huống rejects bio above maximum; trả mã 400.
it("rejects bio above maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"bio":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["bio"],"message":"Too big: expected string to have <=5000 characters"}]);
});
// UTCID16: Xử lý tình huống accepts yearsOfExperience null; đối chiếu kết quả và tác động phụ.
it("accepts yearsOfExperience null",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"yearsOfExperience":null,"education":[],"certifications":[]});
});
// UTCID17: Xử lý tình huống accepts yearsOfExperience minimum; đối chiếu kết quả và tác động phụ.
it("accepts yearsOfExperience minimum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":0});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"yearsOfExperience":0,"education":[],"certifications":[]});
});
// UTCID18: Xử lý tình huống accepts yearsOfExperience maximum; đối chiếu kết quả và tác động phụ.
it("accepts yearsOfExperience maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":80});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"yearsOfExperience":80,"education":[],"certifications":[]});
});
// UTCID19: Từ chối tình huống rejects yearsOfExperience below minimum; trả mã 400.
it("rejects yearsOfExperience below minimum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":-1});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["yearsOfExperience"],"message":"Too small: expected number to be >=0"}]);
});
// UTCID20: Từ chối tình huống rejects yearsOfExperience above maximum; trả mã 400.
it("rejects yearsOfExperience above maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":81});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["yearsOfExperience"],"message":"Too big: expected number to be <=80"}]);
});
// UTCID21: Từ chối tình huống rejects yearsOfExperience fraction; trả mã 400.
it("rejects yearsOfExperience fraction",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"yearsOfExperience":1.5});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["yearsOfExperience"],"message":"Invalid input: expected int, received number"}]);
});
// UTCID22: Xử lý tình huống accepts expertise normalized; đối chiếu kết quả và tác động phụ.
it("accepts expertise normalized",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[" AI ","ai",""],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":["AI"],"education":[],"certifications":[]});
});
// UTCID23: Xử lý tình huống accepts expertise maximum count; đối chiếu kết quả và tác động phụ.
it("accepts expertise maximum count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"],"education":[],"certifications":[]});
});
// UTCID24: Từ chối tình huống rejects expertise above unique count; trả mã 400.
it("rejects expertise above unique count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["expertise"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID25: Xử lý tình huống accepts expertise maximum raw count; đối chiếu kết quả và tác động phụ.
it("accepts expertise maximum raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":["AI"],"education":[],"certifications":[]});
});
// UTCID26: Từ chối tình huống rejects expertise above raw count; trả mã 400.
it("rejects expertise above raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["expertise"],"message":"Too big: expected array to have <=100 items"}]);
});
// UTCID27: Xử lý tình huống accepts expertise maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts expertise maximum entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":['x'.repeat(100)],"education":[],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":['x'.repeat(100)],"education":[],"certifications":[]});
});
// UTCID28: Từ chối tình huống rejects expertise above entry; trả mã 400.
it("rejects expertise above entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":['x'.repeat(101)],"education":[],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["expertise",0],"message":"Too big: expected string to have <=100 characters"}]);
});
// UTCID29: Xử lý tình huống accepts education normalized; đối chiếu kết quả và tác động phụ.
it("accepts education normalized",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[" AI ","ai",""],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":["AI"],"certifications":[]});
});
// UTCID30: Xử lý tình huống accepts education maximum count; đối chiếu kết quả và tác động phụ.
it("accepts education maximum count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"],"certifications":[]});
});
// UTCID31: Từ chối tình huống rejects education above unique count; trả mã 400.
it("rejects education above unique count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID32: Xử lý tình huống accepts education maximum raw count; đối chiếu kết quả và tác động phụ.
it("accepts education maximum raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":["AI"],"certifications":[]});
});
// UTCID33: Từ chối tình huống rejects education above raw count; trả mã 400.
it("rejects education above raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education"],"message":"Too big: expected array to have <=100 items"}]);
});
// UTCID34: Xử lý tình huống accepts education maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts education maximum entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":['x'.repeat(500)],"certifications":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":['x'.repeat(500)],"certifications":[]});
});
// UTCID35: Từ chối tình huống rejects education above entry; trả mã 400.
it("rejects education above entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":['x'.repeat(501)],"certifications":[]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["education",0],"message":"Too big: expected string to have <=500 characters"}]);
});
// UTCID36: Xử lý tình huống accepts certifications normalized; đối chiếu kết quả và tác động phụ.
it("accepts certifications normalized",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[" AI ","ai",""]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":["AI"]});
});
// UTCID37: Xử lý tình huống accepts certifications maximum count; đối chiếu kết quả và tác động phụ.
it("accepts certifications maximum count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19"]});
});
// UTCID38: Từ chối tình huống rejects certifications above unique count; trả mã 400.
it("rejects certifications above unique count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":["Item0","Item1","Item2","Item3","Item4","Item5","Item6","Item7","Item8","Item9","Item10","Item11","Item12","Item13","Item14","Item15","Item16","Item17","Item18","Item19","Item20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications"],"message":"Too big: expected array to have <=20 items"}]);
});
// UTCID39: Xử lý tình huống accepts certifications maximum raw count; đối chiếu kết quả và tác động phụ.
it("accepts certifications maximum raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":["AI"]});
});
// UTCID40: Từ chối tình huống rejects certifications above raw count; trả mã 400.
it("rejects certifications above raw count",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":["AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI","AI"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications"],"message":"Too big: expected array to have <=100 items"}]);
});
// UTCID41: Xử lý tình huống accepts certifications maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts certifications maximum entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":['x'.repeat(500)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":['x'.repeat(500)]});
});
// UTCID42: Từ chối tình huống rejects certifications above entry; trả mã 400.
it("rejects certifications above entry",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":['x'.repeat(501)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["certifications",0],"message":"Too big: expected string to have <=500 characters"}]);
});
// UTCID43: Xử lý tình huống accepts website empty; đối chiếu kết quả và tác động phụ.
it("accepts website empty",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":""});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":""});
});
// UTCID44: Xử lý tình huống accepts website null; đối chiếu kết quả và tác động phụ.
it("accepts website null",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":null});
});
// UTCID45: Từ chối tình huống rejects website invalid; trả mã 400.
it("rejects website invalid",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":"invalid"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["website"],"message":"Invalid URL"}]);
});
// UTCID46: Xử lý tình huống accepts website maximum; đối chiếu kết quả và tác động phụ.
it("accepts website maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
});
// UTCID47: Từ chối tình huống rejects website above maximum; trả mã 400.
it("rejects website above maximum",async()=>{


const result = shared.UpdateExpertProfileSchema.safeParse({"displayName":"Expert","expertise":[],"education":[],"certifications":[],"website":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["website"],"message":"Too big: expected string to have <=500 characters"}]);
});
});
});
