import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type {
  AdminCreatePortfolioItemBodyType,
  AdminCreateUserBodyType,
  AdminReplaceFreelancerSkillsBodyType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateFreelancerProfileBodyType,
  AdminUpdatePortfolioItemBodyType,
  AdminUpdateUserBodyType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { MessageResDTO } from '../../shared/dtos/response.dto';
import {
  AdminClientProfileResponseDto,
  AdminCreatePortfolioItemBodyDto,
  AdminCreateUserBodyDto,
  AdminCreateUserResponseDto,
  AdminReplaceFreelancerSkillsBodyDto,
  AdminSkillCatalogListDto,
  AdminUpdateClientProfileBodyDto,
  AdminUpdateFreelancerProfileBodyDto,
  AdminUpdatePortfolioItemBodyDto,
  AdminUpdateUserBodyDto,
  AdminUpdateUserResponseDto,
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  AdminUserQueryDto,
} from './users.dto';
import { UsersService } from './users.service';

// Các endpoint quản lý User dành riêng cho Admin.
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // Tạo tài khoản mới (email + password + role khởi tạo)
  @Post()
  @ZodSerializerDto(AdminCreateUserResponseDto)
  createUser(@Body() body: AdminCreateUserBodyDto) {
    return this.service.createUser(body as AdminCreateUserBodyType);
  }

  // Sửa thông tin chung account: email / displayName / trạng thái ban
  @Patch(':id')
  @ZodSerializerDto(AdminUpdateUserResponseDto)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') actorId: number,
    @Body() body: AdminUpdateUserBodyDto,
  ) {
    return this.service.updateUser(
      id,
      actorId,
      body as AdminUpdateUserBodyType,
    );
  }

  // Sửa hồ sơ Client của 1 user (companyName / description / website)
  @Patch(':id/client-profile')
  @ZodSerializerDto(AdminClientProfileResponseDto)
  updateClientProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminUpdateClientProfileBodyDto,
  ) {
    return this.service.updateClientProfile(
      id,
      body as AdminUpdateClientProfileBodyType,
    );
  }

  // Sửa "giới thiệu" hồ sơ Freelancer (professional title + bio)
  @Patch(':id/freelancer-profile')
  @ZodSerializerDto(MessageResDTO)
  updateFreelancerProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminUpdateFreelancerProfileBodyDto,
  ) {
    return this.service.updateFreelancerProfile(
      id,
      body as AdminUpdateFreelancerProfileBodyType,
    );
  }

  // Thay thế toàn bộ danh sách kỹ năng của hồ sơ Freelancer
  @Put(':id/freelancer-profile/skills')
  @ZodSerializerDto(MessageResDTO)
  replaceFreelancerSkills(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReplaceFreelancerSkillsBodyDto,
  ) {
    return this.service.replaceFreelancerSkills(
      id,
      body as AdminReplaceFreelancerSkillsBodyType,
    );
  }

  // Tạo mới 1 portfolio item cho hồ sơ Freelancer
  @Post(':id/freelancer-profile/portfolio-items')
  @ZodSerializerDto(MessageResDTO)
  createPortfolioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminCreatePortfolioItemBodyDto,
  ) {
    return this.service.createPortfolioItem(
      id,
      body as AdminCreatePortfolioItemBodyType,
    );
  }

  // Sửa 1 portfolio item (chỉ item thuộc freelancer profile của user đó)
  @Patch(':id/freelancer-profile/portfolio-items/:itemId')
  @ZodSerializerDto(MessageResDTO)
  updatePortfolioItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: AdminUpdatePortfolioItemBodyDto,
  ) {
    return this.service.updatePortfolioItem(
      id,
      itemId,
      body as AdminUpdatePortfolioItemBodyType,
    );
  }

  // Xoá mềm (soft-delete) 1 portfolio item
  @Delete(':id/freelancer-profile/portfolio-items/:itemId')
  @ZodSerializerDto(MessageResDTO)
  deletePortfolioItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.service.deletePortfolioItem(id, itemId);
  }

  // Danh sách user (phân trang / tìm kiếm / lọc role) cho trang Admin
  @Get()
  @ZodSerializerDto(AdminUserListResponseDto)
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.service.getUsers(query);
  }

  // Catalog Skill (active) để dialog chọn kỹ năng.
  // Lưu ý: phải đặt TRƯỚC @Get(':id') để không bị route param nuốt mất.
  @Get('skills-catalog')
  @ZodSerializerDto(AdminSkillCatalogListDto)
  getSkillCatalog() {
    return this.service.listSkillCatalog();
  }

  // Chi tiết 1 user (dùng cho trang User Detail)
  @Get(':id')
  @ZodSerializerDto(AdminUserDetailResponseDto)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUserById(id);
  }
}
