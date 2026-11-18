jest.mock('fs/promises',()=>({mkdir:jest.fn().mockResolvedValue(undefined),writeFile:jest.fn().mockResolvedValue(undefined),unlink:jest.fn().mockResolvedValue(undefined),readFile:jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7'))}));
import { Prisma } from '@prisma/client';
import * as shared from '@shared/types';
import * as path from 'path';
import * as storage from 'fs/promises';
import { NotificationService } from '../../src/routes/notifications/notification.service';

// Generated from docs/Report 5/tools/build-nhuy-tests.mjs.
describe('NotificationService (UF-145 to UF-148)',()=>{
const repository={findAll:jest.fn(),findById:jest.fn(),markRead:jest.fn(),markAllRead:jest.fn(),softDelete:jest.fn()};
const revisions={requiresManualReview:jest.fn(),directUpdateResult:jest.fn(),submitFreelancer:jest.fn(),submitClient:jest.fn(),submitGeneral:jest.fn(),submitExpert:jest.fn()};
const cloudinary={isConfigured:jest.fn(),uploadFile:jest.fn(),deleteFile:jest.fn()};
const hashing={verify:jest.fn(),hash:jest.fn()};
const outbox={enqueueAndProcess:jest.fn()};
const ai={analyze:jest.fn()};const resolver={resolveSkillEntries:jest.fn()};
const identityAi={verify:jest.fn(),livenessPose:jest.fn()};
const token={signAccessToken:jest.fn()};
const fixedDate=new Date('2026-11-09T00:00:00Z');
const service=new NotificationService(repository as never);
let profile:any;let user:any;let contract:any;let review:any;let revision:any;let expertUser:any;
beforeEach(()=>{jest.clearAllMocks();jest.resetAllMocks();
for(const fn of [storage.mkdir,storage.writeFile,storage.unlink]) (fn as jest.Mock).mockResolvedValue(undefined);(storage.readFile as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7"));
cloudinary.isConfigured.mockReturnValue(true);cloudinary.uploadFile.mockResolvedValue({secure_url:'https://cdn.test/file',public_id:'new-asset'});cloudinary.deleteFile.mockResolvedValue(undefined);outbox.enqueueAndProcess.mockResolvedValue(undefined);
revisions.requiresManualReview.mockReturnValue(false);revisions.directUpdateResult.mockImplementation((strength:number)=>({message:'Success.ProfileUpdated',reviewRequired:false,profileStrength:strength,revision:null}));
for(const m of ['submitFreelancer','submitClient','submitGeneral','submitExpert'] as const)revisions[m].mockResolvedValue({reviewRequired:true});
repository.findAll.mockResolvedValue([]);repository.findById.mockResolvedValue({id:11,userId:10,isRead:false});repository.markRead.mockResolvedValue({id:11,isRead:true});repository.markAllRead.mockResolvedValue({count:2});
});
describe('UF-145 getAll',()=>{
// UF-145: UTCID01: Xử lý tình huống returns the expected result for getAll; đối chiếu kết quả và tác động phụ.
it("returns the expected result for getAll",async()=>{


const result = await service.getAll(10);
expect(result).toEqual([]);

});
});
describe('UF-146 markRead',()=>{
// UF-146: UTCID01: Xử lý tình huống returns the expected result for markRead; đối chiếu kết quả và tác động phụ.
it("returns the expected result for markRead",async()=>{


const result = await service.markRead(10,11);
expect(result).toEqual({id:11,isRead:true});

});
// UTCID02: Từ chối tình huống rejects a notification not found for the current user; trả mã 404.
it("rejects a notification not found for the current user",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.markRead(10,11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.NotificationNotFound","path":"notificationId"}],"error":"Not Found","statusCode":404}});
expect(repository.markRead).not.toHaveBeenCalled();
});
// UTCID03: Xử lý tình huống does not rewrite an already read notification; đối chiếu kết quả và tác động phụ.
it("does not rewrite an already read notification",async()=>{
repository.findById.mockResolvedValue({id:11,isRead:true});

const result = await service.markRead(10,11);
expect(result).toEqual({id:11,isRead:true});
expect(repository.markRead).not.toHaveBeenCalled();
});
});
describe('UF-147 markAllRead',()=>{
// UF-147: UTCID01: Xử lý tình huống returns the expected result for markAllRead; đối chiếu kết quả và tác động phụ.
it("returns the expected result for markAllRead",async()=>{


const result = await service.markAllRead(10);
expect(result).toEqual({message:shared.NotificationMessage.MARKED_ALL_READ,count:2});

});
// UTCID02: Xử lý tình huống returns zero when nothing is unread; đối chiếu kết quả và tác động phụ.
it("returns zero when nothing is unread",async()=>{
repository.markAllRead.mockResolvedValue({count:0});

const result = await service.markAllRead(10);
expect(result).toEqual({message:shared.NotificationMessage.MARKED_ALL_READ,count:0});

});
});
describe('UF-148 delete',()=>{
// UF-148: UTCID01: Xử lý tình huống returns the expected result for delete; đối chiếu kết quả và tác động phụ.
it("returns the expected result for delete",async()=>{


const result = await service.delete(10,11);
expect(result).toEqual({message:shared.NotificationMessage.DELETED});

});
// UTCID02: Từ chối tình huống rejects a notification not found for the current user; trả mã 404.
it("rejects a notification not found for the current user",async()=>{
repository.findById.mockResolvedValue(null);

await expect(service.delete(10,11)).rejects.toMatchObject({status: 404, response: {"message":[{"message":"Error.NotificationNotFound","path":"notificationId"}],"error":"Not Found","statusCode":404}});
expect(repository.softDelete).not.toHaveBeenCalled();
});
});
});
