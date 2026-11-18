jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { PortfolioService } from '../../src/routes/portfolios/portfolio.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('PortfolioService (UF-127 to UF-131)',()=>{
const repository={findFreelancerProfileById:jest.fn(),findPortfoliosByFreelancerProfileId:jest.fn(),addPortfolioToProfile:jest.fn(),findPortfolioById:jest.fn(),findPortfolioWithProfile:jest.fn(),updatePortfolio:jest.fn(),deletePortfolio:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new PortfolioService(repository as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
profile= {id:5,userId:10,bio:'Existing bio',profileCompletionPercent:80,freelancerProfile:{id:7,education:['University'],certifications:[],languages:[],experience:[]},user:{userRoles:[{role:{name:'Freelancer'}}]}};
repository.findFreelancerProfileById.mockResolvedValue(profile);
repository.findPortfoliosByFreelancerProfileId.mockResolvedValue([]);
repository.findPortfolioById.mockResolvedValue({id:11,title:'Project'});
repository.findPortfolioWithProfile.mockResolvedValue({id:11,freelancerProfile:{profile:{userId:10}}});
repository.addPortfolioToProfile.mockResolvedValue({id:11,title:'Project'});
repository.updatePortfolio.mockResolvedValue({id:11,title:'Updated'});
});
describe('UF-127 getPortfolios',()=>{
// UF-127: UTCID01: Xử lý tình huống returns the expected result for getPortfolios; đối chiếu kết quả và tác động phụ.
it("returns the expected result for getPortfolios",async()=>{


const result = await service.getPortfolios(5);
expect(result).toEqual([]);

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.getPortfolios(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a profile without freelancer membership; trả mã 404.
it("rejects a profile without freelancer membership",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.getPortfolios(5)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID04: Xử lý tình huống returns an empty list before the freelancer subprofile exists; đối chiếu kết quả và tác động phụ.
it("returns an empty list before the freelancer subprofile exists",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,freelancerProfile:null});

const result = await service.getPortfolios(5);
expect(result).toEqual([]);

});
// UTCID05: Từ chối tình huống maps an unexpected repository failure; trả mã 500.
it("maps an unexpected repository failure",async()=>{
repository.findFreelancerProfileById.mockRejectedValue(new Error('database offline'));

await expect(service.getPortfolios(5)).rejects.toMatchObject({status: 500, response: {"message":[{"message":"Unable to load portfolios. Please try again later.","path":"portfolios"}],"error":"Internal Server Error","statusCode":500}});

});
});
describe('UF-128 addPortfolio',()=>{
// UF-128: UTCID01: Xử lý tình huống returns the expected result for addPortfolio; đối chiếu kết quả và tác động phụ.
it("returns the expected result for addPortfolio",async()=>{


const result = await service.addPortfolio(5,10,{title:'Project'});
expect(result).toEqual({id:11,title:'Project'});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findFreelancerProfileById.mockResolvedValue(null);

await expect(service.addPortfolio(5,10,{title:'Project'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another portfolio owner; trả mã 403.
it("rejects another portfolio owner",async()=>{


await expect(service.addPortfolio(5,99,{title:'Project'})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only edit your own portfolios.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.addPortfolioToProfile).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống rejects a profile without freelancer membership; trả mã 404.
it("rejects a profile without freelancer membership",async()=>{
repository.findFreelancerProfileById.mockResolvedValue({...profile,user:{userRoles:[]}});

await expect(service.addPortfolio(5,10,{title:'Project'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Freelancer profile not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Từ chối tình huống maps an unexpected repository failure; trả mã 500.
it("maps an unexpected repository failure",async()=>{
repository.findFreelancerProfileById.mockRejectedValue(new Error('database offline'));

await expect(service.addPortfolio(5,10,{title:'Project'})).rejects.toMatchObject({status: 500, response: {"message":[{"message":"Unable to load portfolios. Please try again later.","path":"portfolios"}],"error":"Internal Server Error","statusCode":500}});

});
// UTCID06: Từ chối tình huống rejects title missing; trả mã 400.
it("rejects title missing",async()=>{


const result = shared.AddPortfolioSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title is required."}]);
});
// UTCID07: Từ chối tình huống rejects title empty; trả mã 400.
it("rejects title empty",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title is required."}]);
});
// UTCID08: Xử lý tình huống accepts title minimum; đối chiếu kết quả và tác động phụ.
it("accepts title minimum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"x"});
});
// UTCID09: Xử lý tình huống accepts title maximum; đối chiếu kết quả và tác động phụ.
it("accepts title maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":'x'.repeat(255)});
});
// UTCID10: Từ chối tình huống rejects title above maximum; trả mã 400.
it("rejects title above maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title must not exceed 255 characters."}]);
});
// UTCID11: Xử lý tình huống accepts description null; đối chiếu kết quả và tác động phụ.
it("accepts description null",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","description":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","description":null});
});
// UTCID12: Xử lý tình huống accepts description maximum; đối chiếu kết quả và tác động phụ.
it("accepts description maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","description":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","description":'x'.repeat(5000)});
});
// UTCID13: Từ chối tình huống rejects description above maximum; trả mã 400.
it("rejects description above maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","description":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["description"],"message":"Portfolio description must not exceed 5,000 characters."}]);
});
// UTCID14: Xử lý tình huống accepts technologies empty; đối chiếu kết quả và tác động phụ.
it("accepts technologies empty",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":[]});
});
// UTCID15: Xử lý tình huống accepts technologies maximum count; đối chiếu kết quả và tác động phụ.
it("accepts technologies maximum count",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19"]});
});
// UTCID16: Từ chối tình huống rejects technologies above count; trả mã 400.
it("rejects technologies above count",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19","Tech20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies"],"message":"A portfolio can contain at most 20 technologies."}]);
});
// UTCID17: Từ chối tình huống rejects technologies empty entry; trả mã 400.
it("rejects technologies empty entry",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID18: Xử lý tình huống accepts technologies maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts technologies maximum entry",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":['x'.repeat(100)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":['x'.repeat(100)]});
});
// UTCID19: Từ chối tình huống rejects technologies above entry; trả mã 400.
it("rejects technologies above entry",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","technologies":['x'.repeat(101)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies",0],"message":"Too big: expected string to have <=100 characters"}]);
});
// UTCID20: Xử lý tình huống accepts projectUrl null; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl null",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":null});
});
// UTCID21: Xử lý tình huống accepts projectUrl HTTPS; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl HTTPS",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/project"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"https://example.test/project"});
});
// UTCID22: Xử lý tình huống accepts projectUrl HTTP; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl HTTP",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"http://example.test"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"http://example.test"});
});
// UTCID23: Từ chối tình huống rejects projectUrl invalid; trả mã 400.
it("rejects projectUrl invalid",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"invalid"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."},{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID24: Từ chối tình huống rejects projectUrl FTP; trả mã 400.
it("rejects projectUrl FTP",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"ftp://example.test"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID25: Xử lý tình huống accepts projectUrl maximum; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
});
// UTCID26: Từ chối tình huống rejects projectUrl above maximum; trả mã 400.
it("rejects projectUrl above maximum",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID27: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.AddPortfolioSchema.safeParse({"title":"Project","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-129 getPortfolioDetail',()=>{
// UF-129: UTCID01: Xử lý tình huống returns the expected result for getPortfolioDetail; đối chiếu kết quả và tác động phụ.
it("returns the expected result for getPortfolioDetail",async()=>{


const result = await service.getPortfolioDetail(11);
expect(result).toEqual({id:11,title:'Project'});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findPortfolioById.mockResolvedValue(null);

await expect(service.getPortfolioDetail(11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Portfolio not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống maps an unexpected repository failure; trả mã 500.
it("maps an unexpected repository failure",async()=>{
repository.findPortfolioById.mockRejectedValue(new Error('database offline'));

await expect(service.getPortfolioDetail(11)).rejects.toMatchObject({status: 500, response: {"message":[{"message":"Unable to load portfolios. Please try again later.","path":"portfolios"}],"error":"Internal Server Error","statusCode":500}});

});
});
describe('UF-130 updatePortfolio',()=>{
// UF-130: UTCID01: Xử lý tình huống returns the expected result for updatePortfolio; đối chiếu kết quả và tác động phụ.
it("returns the expected result for updatePortfolio",async()=>{


const result = await service.updatePortfolio(11,10,{title:'Updated'});
expect(result).toEqual({id:11,title:'Updated'});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findPortfolioWithProfile.mockResolvedValue(null);

await expect(service.updatePortfolio(11,10,{title:'Updated'})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Portfolio not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another portfolio owner; trả mã 403.
it("rejects another portfolio owner",async()=>{


await expect(service.updatePortfolio(11,99,{title:'Updated'})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only edit your own portfolios.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.updatePortfolio).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống maps an unexpected repository failure; trả mã 500.
it("maps an unexpected repository failure",async()=>{
repository.findPortfolioWithProfile.mockRejectedValue(new Error('database offline'));

await expect(service.updatePortfolio(11,10,{title:'Updated'})).rejects.toMatchObject({status: 500, response: {"message":[{"message":"Unable to update portfolio. Please try again later.","path":"portfolios"}],"error":"Internal Server Error","statusCode":500}});

});
// UTCID05: Từ chối tình huống rejects title missing; trả mã 400.
it("rejects title missing",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title is required."}]);
});
// UTCID06: Từ chối tình huống rejects title empty; trả mã 400.
it("rejects title empty",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title is required."}]);
});
// UTCID07: Xử lý tình huống accepts title minimum; đối chiếu kết quả và tác động phụ.
it("accepts title minimum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"x"});
});
// UTCID08: Xử lý tình huống accepts title maximum; đối chiếu kết quả và tác động phụ.
it("accepts title maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":'x'.repeat(255)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":'x'.repeat(255)});
});
// UTCID09: Từ chối tình huống rejects title above maximum; trả mã 400.
it("rejects title above maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":'x'.repeat(256)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["title"],"message":"Portfolio title must not exceed 255 characters."}]);
});
// UTCID10: Xử lý tình huống accepts description null; đối chiếu kết quả và tác động phụ.
it("accepts description null",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","description":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","description":null});
});
// UTCID11: Xử lý tình huống accepts description maximum; đối chiếu kết quả và tác động phụ.
it("accepts description maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","description":'x'.repeat(5000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","description":'x'.repeat(5000)});
});
// UTCID12: Từ chối tình huống rejects description above maximum; trả mã 400.
it("rejects description above maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","description":'x'.repeat(5001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["description"],"message":"Portfolio description must not exceed 5,000 characters."}]);
});
// UTCID13: Xử lý tình huống accepts technologies empty; đối chiếu kết quả và tác động phụ.
it("accepts technologies empty",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":[]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":[]});
});
// UTCID14: Xử lý tình huống accepts technologies maximum count; đối chiếu kết quả và tác động phụ.
it("accepts technologies maximum count",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19"]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19"]});
});
// UTCID15: Từ chối tình huống rejects technologies above count; trả mã 400.
it("rejects technologies above count",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":["Tech0","Tech1","Tech2","Tech3","Tech4","Tech5","Tech6","Tech7","Tech8","Tech9","Tech10","Tech11","Tech12","Tech13","Tech14","Tech15","Tech16","Tech17","Tech18","Tech19","Tech20"]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies"],"message":"A portfolio can contain at most 20 technologies."}]);
});
// UTCID16: Từ chối tình huống rejects technologies empty entry; trả mã 400.
it("rejects technologies empty entry",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":[""]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies",0],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID17: Xử lý tình huống accepts technologies maximum entry; đối chiếu kết quả và tác động phụ.
it("accepts technologies maximum entry",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":['x'.repeat(100)]});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","technologies":['x'.repeat(100)]});
});
// UTCID18: Từ chối tình huống rejects technologies above entry; trả mã 400.
it("rejects technologies above entry",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","technologies":['x'.repeat(101)]});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["technologies",0],"message":"Too big: expected string to have <=100 characters"}]);
});
// UTCID19: Xử lý tình huống accepts projectUrl null; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl null",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":null});
});
// UTCID20: Xử lý tình huống accepts projectUrl HTTPS; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl HTTPS",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/project"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"https://example.test/project"});
});
// UTCID21: Xử lý tình huống accepts projectUrl HTTP; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl HTTP",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"http://example.test"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"http://example.test"});
});
// UTCID22: Từ chối tình huống rejects projectUrl invalid; trả mã 400.
it("rejects projectUrl invalid",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"invalid"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."},{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID23: Từ chối tình huống rejects projectUrl FTP; trả mã 400.
it("rejects projectUrl FTP",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"ftp://example.test"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID24: Xử lý tình huống accepts projectUrl maximum; đối chiếu kết quả và tác động phụ.
it("accepts projectUrl maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
});
// UTCID25: Từ chối tình huống rejects projectUrl above maximum; trả mã 400.
it("rejects projectUrl above maximum",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","projectUrl":"https://example.test/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["projectUrl"],"message":"Please enter a valid URL."}]);
});
// UTCID26: Từ chối tình huống rejects unexpected unknown field; trả mã 400.
it("rejects unexpected unknown field",async()=>{


const result = shared.UpdatePortfolioSchema.safeParse({"title":"Project","unexpected":"value"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Unrecognized key: \"unexpected\""}]);
});
});
describe('UF-131 deletePortfolio',()=>{
// UF-131: UTCID01: Xử lý tình huống returns the expected result for deletePortfolio; đối chiếu kết quả và tác động phụ.
it("returns the expected result for deletePortfolio",async()=>{


const result = await service.deletePortfolio(11,10);
expect(result).toEqual({message:shared.PortfolioMessage.PORTFOLIO_DELETED});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findPortfolioWithProfile.mockResolvedValue(null);

await expect(service.deletePortfolio(11,10)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Portfolio not found.","path":"id"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects another portfolio owner; trả mã 403.
it("rejects another portfolio owner",async()=>{


await expect(service.deletePortfolio(11,99)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"You can only edit your own portfolios.","path":"userId"}],"error":"Forbidden","statusCode":403}});
expect(repository.deletePortfolio).not.toHaveBeenCalled();
});
// UTCID04: Từ chối tình huống maps an unexpected repository failure; trả mã 500.
it("maps an unexpected repository failure",async()=>{
repository.findPortfolioWithProfile.mockRejectedValue(new Error('database offline'));

await expect(service.deletePortfolio(11,10)).rejects.toMatchObject({status: 500, response: {"message":[{"message":"Unable to delete portfolio. Please try again later.","path":"portfolios"}],"error":"Internal Server Error","statusCode":500}});

});
});
});
