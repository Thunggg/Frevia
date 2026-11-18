jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { ReviewService } from '../../src/routes/reviews/review.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('ReviewService (UF-151 to UF-158)',()=>{
const repository={findContract:jest.fn(),findManyByContract:jest.fn(),findById:jest.fn(),findByContractAndReviewer:jest.fn(),create:jest.fn(),update:jest.fn(),softDelete:jest.fn(),findResponseByReview:jest.fn(),createResponse:jest.fn(),findResponseById:jest.fn(),updateResponse:jest.fn(),softDeleteResponse:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new ReviewService(repository as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
contract={id:20,clientId:10,freelancerId:30,status:'COMPLETED',client:{profile:{displayName:'Client'}},freelancer:{profile:{displayName:'Freelancer'}}};
review={id:11,contractId:20,reviewerId:10,revieweeId:30,overallRating:new Prisma.Decimal(4.5),response:null,reviewee:{profile:{displayName:'Freelancer'}}};
repository.findContract.mockResolvedValue(contract);repository.findManyByContract.mockResolvedValue([review]);
repository.findById.mockResolvedValue(review);repository.findByContractAndReviewer.mockResolvedValue(null);
repository.create.mockResolvedValue(review);repository.update.mockResolvedValue(review);
repository.findResponseByReview.mockResolvedValue(null);repository.createResponse.mockResolvedValue({id:40,responseText:'Thank you'});
repository.findResponseById.mockResolvedValue({id:40,userId:30});repository.updateResponse.mockResolvedValue({id:40,responseText:'Updated'});
});
describe('UF-151 list',()=>{
// UF-151: UTCID01: Xử lý tình huống returns the expected result for list; đối chiếu kết quả và tác động phụ.
it("returns the expected result for list",async()=>{


const result = await service.list(10,20);
expect(result).toEqual([{...review,overallRating:4.5}]);

});
// UTCID02: Từ chối tình huống rejects a missing contract; trả mã 404.
it("rejects a missing contract",async()=>{
repository.findContract.mockResolvedValue(null);

await expect(service.list(10,20)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewContractNotFound","path":"contractId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a nonparticipant; trả mã 403.
it("rejects a nonparticipant",async()=>{
repository.findContract.mockResolvedValue({...contract,clientId:99,freelancerId:98});

await expect(service.list(10,20)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-152 detail',()=>{
// UF-152: UTCID01: Xử lý tình huống returns the expected result for detail; đối chiếu kết quả và tác động phụ.
it("returns the expected result for detail",async()=>{


const result = await service.detail(10,11);
expect(result).toEqual({...review,overallRating:4.5});

});
// UTCID02: Từ chối tình huống rejects a missing contract; trả mã 404.
it("rejects a missing contract",async()=>{
repository.findContract.mockResolvedValue(null);

await expect(service.detail(10,11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewContractNotFound","path":"contractId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a nonparticipant; trả mã 403.
it("rejects a nonparticipant",async()=>{
repository.findContract.mockResolvedValue({...contract,clientId:99,freelancerId:98});

await expect(service.detail(10,11)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.detail(10,11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewNotFound","path":"reviewId"}],"error":"Not Found","statusCode":404}});

});
// UTCID05: Xử lý tình huống hides a soft deleted response; đối chiếu kết quả và tác động phụ.
it("hides a soft deleted response",async()=>{
repository.findById.mockResolvedValue({...review,response:{id:40,deletedAt:fixedDate}});

const result = await service.detail(10,11);
expect(result).toEqual({...review,overallRating:4.5,response:null});

});
});
describe('UF-153 create',()=>{
// UF-153: UTCID01: Xử lý tình huống returns the expected result for create; đối chiếu kết quả và tác động phụ.
it("returns the expected result for create",async()=>{


const result = await service.create(10,20,{overallRating:4.5});
expect(result).toEqual({...review,overallRating:4.5});

});
// UTCID02: Từ chối tình huống rejects a missing contract; trả mã 404.
it("rejects a missing contract",async()=>{
repository.findContract.mockResolvedValue(null);

await expect(service.create(10,20,{overallRating:4.5})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewContractNotFound","path":"contractId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a nonparticipant; trả mã 403.
it("rejects a nonparticipant",async()=>{
repository.findContract.mockResolvedValue({...contract,clientId:99,freelancerId:98});

await expect(service.create(10,20,{overallRating:4.5})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects a contract that is not completed; trả mã 400.
it("rejects a contract that is not completed",async()=>{
repository.findContract.mockResolvedValue({...contract,status:'ACTIVE'});

await expect(service.create(10,20,{overallRating:4.5})).rejects.toMatchObject({status: 400, response: {"message":[{"message":"Error.ReviewContractNotCompleted","path":"contractId"}],"error":"Bad Request","statusCode":400}});

});
// UTCID05: Từ chối tình huống rejects a duplicate review; trả mã 409.
it("rejects a duplicate review",async()=>{
repository.findByContractAndReviewer.mockResolvedValue({id:11});

await expect(service.create(10,20,{overallRating:4.5})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ReviewAlreadyExists","path":"contractId"}],"error":"Conflict","statusCode":409}});
expect(repository.create).not.toHaveBeenCalled();
});
// UTCID06: Từ chối tình huống maps a concurrent review insertion; trả mã 409.
it("maps a concurrent review insertion",async()=>{
repository.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));

await expect(service.create(10,20,{overallRating:4.5})).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ReviewAlreadyExists","path":"contractId"}],"error":"Conflict","statusCode":409}});

});
// UTCID07: Xử lý tình huống derives the client as reviewee for a freelancer; đối chiếu kết quả và tác động phụ.
it("derives the client as reviewee for a freelancer",async()=>{


const result = await service.create(30,20,{overallRating:4.5});
expect(result).toEqual({...review,overallRating:4.5});
expect(repository.create).toHaveBeenCalledWith(20,30,10,'Freelancer',{overallRating:4.5},undefined);
});
// UTCID08: Xử lý tình huống accepts overallRating minimum; đối chiếu kết quả và tác động phụ.
it("accepts overallRating minimum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":1});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":1});
});
// UTCID09: Xử lý tình huống accepts overallRating maximum; đối chiếu kết quả và tác động phụ.
it("accepts overallRating maximum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":5});
});
// UTCID10: Từ chối tình huống rejects overallRating below minimum; trả mã 400.
it("rejects overallRating below minimum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":0});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID11: Từ chối tình huống rejects overallRating above maximum; trả mã 400.
it("rejects overallRating above maximum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":6});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Too big: expected number to be <=5"}]);
});
// UTCID12: Xử lý tình huống accepts overallRating fraction; đối chiếu kết quả và tác động phụ.
it("accepts overallRating fraction",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4.5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4.5});
});
// UTCID13: Xử lý tình huống accepts overallRating numeric string; đối chiếu kết quả và tác động phụ.
it("accepts overallRating numeric string",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":"4"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4});
});
// UTCID14: Từ chối tình huống rejects overallRating not numeric; trả mã 400.
it("rejects overallRating not numeric",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":"bad"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Invalid input: expected number, received NaN"}]);
});
// UTCID15: Xử lý tình huống accepts comment null; đối chiếu kết quả và tác động phụ.
it("accepts comment null",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"comment":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"comment":null});
});
// UTCID16: Xử lý tình huống accepts comment maximum; đối chiếu kết quả và tác động phụ.
it("accepts comment maximum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"comment":'x'.repeat(3000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"comment":'x'.repeat(3000)});
});
// UTCID17: Từ chối tình huống rejects comment above maximum; trả mã 400.
it("rejects comment above maximum",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"comment":'x'.repeat(3001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["comment"],"message":"Too big: expected string to have <=3000 characters"}]);
});
// UTCID18: Xử lý tình huống accepts breakdown null; đối chiếu kết quả và tác động phụ.
it("accepts breakdown null",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":null});
});
// UTCID19: Xử lý tình huống accepts breakdown maximum count; đối chiếu kết quả và tác động phụ.
it("accepts breakdown maximum count",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4}});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4}});
});
// UTCID20: Từ chối tình huống rejects breakdown above count; trả mã 400.
it("rejects breakdown above count",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4,"criterion10":4}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown"],"message":"A review can contain at most 10 rating criteria."}]);
});
// UTCID21: Từ chối tình huống rejects breakdown invalid rating; trả mã 400.
it("rejects breakdown invalid rating",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":{"quality":0}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown","quality"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID22: Xử lý tình huống accepts breakdown maximum key; đối chiếu kết quả và tác động phụ.
it("accepts breakdown maximum key",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
});
// UTCID23: Từ chối tình huống rejects breakdown above key; trả mã 400.
it("rejects breakdown above key",async()=>{


const result = shared.CreateReviewSchema.safeParse({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown","xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],"message":"Invalid key in record"}]);
});
// UTCID24: Từ chối tình huống rejects overallRating missing; trả mã 400.
it("rejects overallRating missing",async()=>{


const result = shared.CreateReviewSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Invalid input: expected number, received NaN"}]);
});
});
describe('UF-154 update',()=>{
// UF-154: UTCID01: Xử lý tình huống returns the expected result for update; đối chiếu kết quả và tác động phụ.
it("returns the expected result for update",async()=>{


const result = await service.update(10,11,{overallRating:4.5});
expect(result).toEqual({...review,overallRating:4.5});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.update(10,11,{overallRating:4.5})).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewNotFound","path":"reviewId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a different record owner; trả mã 403.
it("rejects a different record owner",async()=>{


await expect(service.update(99,11,{overallRating:4.5})).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Xử lý tình huống accepts overallRating minimum; đối chiếu kết quả và tác động phụ.
it("accepts overallRating minimum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":1});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":1});
});
// UTCID05: Xử lý tình huống accepts overallRating maximum; đối chiếu kết quả và tác động phụ.
it("accepts overallRating maximum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":5});
});
// UTCID06: Từ chối tình huống rejects overallRating below minimum; trả mã 400.
it("rejects overallRating below minimum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":0});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID07: Từ chối tình huống rejects overallRating above maximum; trả mã 400.
it("rejects overallRating above maximum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":6});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Too big: expected number to be <=5"}]);
});
// UTCID08: Xử lý tình huống accepts overallRating fraction; đối chiếu kết quả và tác động phụ.
it("accepts overallRating fraction",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4.5});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4.5});
});
// UTCID09: Xử lý tình huống accepts overallRating numeric string; đối chiếu kết quả và tác động phụ.
it("accepts overallRating numeric string",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":"4"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4});
});
// UTCID10: Từ chối tình huống rejects overallRating not numeric; trả mã 400.
it("rejects overallRating not numeric",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":"bad"});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["overallRating"],"message":"Invalid input: expected number, received NaN"}]);
});
// UTCID11: Xử lý tình huống accepts comment null; đối chiếu kết quả và tác động phụ.
it("accepts comment null",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"comment":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"comment":null});
});
// UTCID12: Xử lý tình huống accepts comment maximum; đối chiếu kết quả và tác động phụ.
it("accepts comment maximum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"comment":'x'.repeat(3000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"comment":'x'.repeat(3000)});
});
// UTCID13: Từ chối tình huống rejects comment above maximum; trả mã 400.
it("rejects comment above maximum",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"comment":'x'.repeat(3001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["comment"],"message":"Too big: expected string to have <=3000 characters"}]);
});
// UTCID14: Xử lý tình huống accepts breakdown null; đối chiếu kết quả và tác động phụ.
it("accepts breakdown null",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":null});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":null});
});
// UTCID15: Xử lý tình huống accepts breakdown maximum count; đối chiếu kết quả và tác động phụ.
it("accepts breakdown maximum count",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4}});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4}});
});
// UTCID16: Từ chối tình huống rejects breakdown above count; trả mã 400.
it("rejects breakdown above count",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":{"criterion0":4,"criterion1":4,"criterion2":4,"criterion3":4,"criterion4":4,"criterion5":4,"criterion6":4,"criterion7":4,"criterion8":4,"criterion9":4,"criterion10":4}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown"],"message":"A review can contain at most 10 rating criteria."}]);
});
// UTCID17: Từ chối tình huống rejects breakdown invalid rating; trả mã 400.
it("rejects breakdown invalid rating",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":{"quality":0}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown","quality"],"message":"Too small: expected number to be >=1"}]);
});
// UTCID18: Xử lý tình huống accepts breakdown maximum key; đối chiếu kết quả và tác động phụ.
it("accepts breakdown maximum key",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
});
// UTCID19: Từ chối tình huống rejects breakdown above key; trả mã 400.
it("rejects breakdown above key",async()=>{


const result = shared.UpdateReviewSchema.safeParse({"overallRating":4,"breakdown":{"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":4}});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["breakdown","xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],"message":"Invalid key in record"}]);
});
// UTCID20: Từ chối tình huống rejects overallRating empty update; trả mã 400.
it("rejects overallRating empty update",async()=>{


const result = shared.UpdateReviewSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":[],"message":"Provide at least one field to update."}]);
});
});
describe('UF-155 remove',()=>{
// UF-155: UTCID01: Xử lý tình huống returns the expected result for remove; đối chiếu kết quả và tác động phụ.
it("returns the expected result for remove",async()=>{


const result = await service.remove(10,11);
expect(result).toEqual({message:shared.ReviewMessage.DELETED});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.remove(10,11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewNotFound","path":"reviewId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a different record owner; trả mã 403.
it("rejects a different record owner",async()=>{


await expect(service.remove(99,11)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
});
describe('UF-156 respond',()=>{
// UF-156: UTCID01: Xử lý tình huống returns the expected result for respond; đối chiếu kết quả và tác động phụ.
it("returns the expected result for respond",async()=>{


const result = await service.respond(30,11,'Thank you');
expect(result).toEqual({id:40,responseText:'Thank you'});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.respond(30,11,'Thank you')).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewNotFound","path":"reviewId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a different record owner; trả mã 403.
it("rejects a different record owner",async()=>{


await expect(service.respond(99,11,'Thank you')).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects an active existing response; trả mã 409.
it("rejects an active existing response",async()=>{
repository.findResponseByReview.mockResolvedValue({id:40,deletedAt:null});

await expect(service.respond(30,11,'Thank you')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ReviewResponseAlreadyExists","path":"reviewId"}],"error":"Conflict","statusCode":409}});

});
// UTCID05: Xử lý tình huống restores a soft deleted response; đối chiếu kết quả và tác động phụ.
it("restores a soft deleted response",async()=>{
repository.findResponseByReview.mockResolvedValue({id:40,deletedAt:fixedDate});

const result = await service.respond(30,11,'Thank you');
expect(result).toEqual({id:40,responseText:'Thank you'});
expect(repository.createResponse).toHaveBeenCalledWith(11,30,10,20,'Freelancer','Thank you',40);
});
// UTCID06: Từ chối tình huống maps a concurrent response insertion; trả mã 409.
it("maps a concurrent response insertion",async()=>{
repository.createResponse.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate',{code:'P2002',clientVersion:'7'}));

await expect(service.respond(30,11,'Thank you')).rejects.toMatchObject({status: 409, response: {"message":[{"message":"Error.ReviewResponseAlreadyExists","path":"reviewId"}],"error":"Conflict","statusCode":409}});

});
// UTCID07: Từ chối tình huống rejects responseText missing; trả mã 400.
it("rejects responseText missing",async()=>{


const result = shared.CreateReviewResponseSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID08: Từ chối tình huống rejects responseText empty; trả mã 400.
it("rejects responseText empty",async()=>{


const result = shared.CreateReviewResponseSchema.safeParse({"responseText":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID09: Xử lý tình huống accepts responseText minimum; đối chiếu kết quả và tác động phụ.
it("accepts responseText minimum",async()=>{


const result = shared.CreateReviewResponseSchema.safeParse({"responseText":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"responseText":"x"});
});
// UTCID10: Xử lý tình huống accepts responseText maximum; đối chiếu kết quả và tác động phụ.
it("accepts responseText maximum",async()=>{


const result = shared.CreateReviewResponseSchema.safeParse({"responseText":'x'.repeat(3000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"responseText":'x'.repeat(3000)});
});
// UTCID11: Từ chối tình huống rejects responseText above maximum; trả mã 400.
it("rejects responseText above maximum",async()=>{


const result = shared.CreateReviewResponseSchema.safeParse({"responseText":'x'.repeat(3001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Too big: expected string to have <=3000 characters"}]);
});
});
describe('UF-157 updateResponse',()=>{
// UF-157: UTCID01: Xử lý tình huống returns the expected result for updateResponse; đối chiếu kết quả và tác động phụ.
it("returns the expected result for updateResponse",async()=>{


const result = await service.updateResponse(30,40,'Updated');
expect(result).toEqual({id:40,responseText:'Updated'});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findResponseById.mockResolvedValue(null);

await expect(service.updateResponse(30,40,'Updated')).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewResponseNotFound","path":"responseId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a different record owner; trả mã 403.
it("rejects a different record owner",async()=>{


await expect(service.updateResponse(99,40,'Updated')).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
// UTCID04: Từ chối tình huống rejects responseText missing; trả mã 400.
it("rejects responseText missing",async()=>{


const result = shared.UpdateReviewResponseSchema.safeParse({});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Invalid input: expected string, received undefined"}]);
});
// UTCID05: Từ chối tình huống rejects responseText empty; trả mã 400.
it("rejects responseText empty",async()=>{


const result = shared.UpdateReviewResponseSchema.safeParse({"responseText":""});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Too small: expected string to have >=1 characters"}]);
});
// UTCID06: Xử lý tình huống accepts responseText minimum; đối chiếu kết quả và tác động phụ.
it("accepts responseText minimum",async()=>{


const result = shared.UpdateReviewResponseSchema.safeParse({"responseText":"x"});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"responseText":"x"});
});
// UTCID07: Xử lý tình huống accepts responseText maximum; đối chiếu kết quả và tác động phụ.
it("accepts responseText maximum",async()=>{


const result = shared.UpdateReviewResponseSchema.safeParse({"responseText":'x'.repeat(3000)});
expect(result.success).toBe(true);
if(result.success) expect(result.data).toEqual({"responseText":'x'.repeat(3000)});
});
// UTCID08: Từ chối tình huống rejects responseText above maximum; trả mã 400.
it("rejects responseText above maximum",async()=>{


const result = shared.UpdateReviewResponseSchema.safeParse({"responseText":'x'.repeat(3001)});
expect(result.success).toBe(false);
if(!result.success) expect(result.error.issues.map(i=>({path:i.path,message:i.message}))).toEqual([{"path":["responseText"],"message":"Too big: expected string to have <=3000 characters"}]);
});
});
describe('UF-158 removeResponse',()=>{
// UF-158: UTCID01: Xử lý tình huống returns the expected result for removeResponse; đối chiếu kết quả và tác động phụ.
it("returns the expected result for removeResponse",async()=>{


const result = await service.removeResponse(30,40);
expect(result).toEqual({message:shared.ReviewMessage.RESPONSE_DELETED});

});
// UTCID02: Từ chối tình huống rejects a missing record; trả mã 404.
it("rejects a missing record",async()=>{
repository.findResponseById.mockResolvedValue(null);

await expect(service.removeResponse(30,40)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.ReviewResponseNotFound","path":"responseId"}],"error":"Not Found","statusCode":404}});

});
// UTCID03: Từ chối tình huống rejects a different record owner; trả mã 403.
it("rejects a different record owner",async()=>{


await expect(service.removeResponse(99,40)).rejects.toMatchObject({status: 403, response: {"message":[{"message":"Error.ReviewForbidden","path":"review"}],"error":"Forbidden","statusCode":403}});

});
});
});
