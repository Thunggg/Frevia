import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const details = (message: string, path: string) => [{ message, path }];

export const AccountProfileForbiddenException = () =>
  new ForbiddenException(
    details('This action is not available for your role.', 'role'),
  );
export const ProfileNotFoundException = () =>
  new NotFoundException(details('Profile not found.', 'profile'));
export const ClientProfileNotFoundException = () =>
  new NotFoundException(details('Client profile not found.', 'userId'));
export const FreelancerNotFoundException = () =>
  new NotFoundException(details('Freelancer not found.', 'freelancerId'));
export const IdentityFileRequiredException = () =>
  new BadRequestException(
    details('Please select an identity document.', 'file'),
  );
export const IdentityFileInvalidException = () =>
  new BadRequestException(
    details(
      'Only PDF, JPG, JPEG, or PNG files up to 10 MB are accepted.',
      'file',
    ),
  );
export const IdentityDocumentNotFoundException = () =>
  new NotFoundException(details('Identity document not found.', 'id'));
export const SocialLinkDuplicateException = () =>
  new ConflictException(
    details('A link for this platform already exists.', 'platform'),
  );
export const SocialLinkNotFoundException = () =>
  new NotFoundException(details('Social link not found.', 'id'));
export const FavoriteDuplicateException = () =>
  new ConflictException(
    details('Freelancer is already in your favorites.', 'freelancerId'),
  );
export const FavoriteNotFoundException = () =>
  new NotFoundException(
    details('Favorite freelancer not found.', 'freelancerId'),
  );
export const FollowDuplicateException = () =>
  new ConflictException(
    details('You are already following this freelancer.', 'freelancerId'),
  );
export const FollowNotFoundException = () =>
  new NotFoundException(
    details('Followed freelancer not found.', 'freelancerId'),
  );
export const AvatarFileRequiredException = () =>
  new BadRequestException(details('Please select an avatar image.', 'file'));
export const AvatarFileInvalidException = () =>
  new BadRequestException(
    details('Only JPG, PNG, or WebP images up to 5 MB are accepted.', 'file'),
  );
export const AvatarNotFoundException = () =>
  new NotFoundException(details('Avatar image not found.', 'avatar'));
export const PasswordUnavailableException = () =>
  new BadRequestException(
    details(
      'This account uses social sign-in and does not have a password yet.',
      'currentPassword',
    ),
  );
export const CurrentPasswordIncorrectException = () =>
  new BadRequestException(
    details('Current password is incorrect.', 'currentPassword'),
  );
