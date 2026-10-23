import { AuthMessage } from "./auth.message";

/**
 * Message validation cho hồ sơ tài khoản (account-profile.model.ts).
 *
 * Quy ước: giá trị là key i18n dạng "Error.X" để proxy BFF và
 * useTranslatedResolver dịch được. KHÔNG dùng câu tiếng Anh trực tiếp — làm vậy
 * thì message sẽ hiển thị nguyên tiếng Anh cho người dùng.
 *
 * Các key đã tồn tại trong từ điển backend được TÁI DỤNG thay vì tạo bản trùng:
 * Error.BioTooLong, Error.CompanyNameTooLong, Error.CompanyDescriptionTooLong,
 * Error.InvalidWebsite, Error.InvalidUrl.
 */
export const AccountProfileMessage = {
  // --- Hồ sơ chung ---
  DISPLAY_NAME_REQUIRED: "Error.DisplayNameRequired",
  DISPLAY_NAME_TOO_LONG: "Error.DisplayNameTooLong",
  BIO_TOO_LONG: "Error.BioTooLong",

  // --- Hồ sơ công ty ---
  COMPANY_NAME_REQUIRED: "Error.CompanyNameRequired",
  COMPANY_NAME_TOO_LONG: "Error.CompanyNameTooLong",
  COMPANY_DESCRIPTION_TOO_LONG: "Error.CompanyDescriptionTooLong",
  INVALID_COMPANY_WEBSITE: "Error.InvalidWebsite",

  // --- Liên kết mạng xã hội ---
  INVALID_SOCIAL_URL: "Error.InvalidUrl",

  // --- Mật khẩu ---
  // Các quy tắc độ dài/ký tự dùng chung key với luồng auth (xem user.model.ts).
  PASSWORD_REQUIRED: AuthMessage.PASSWORD_REQUIRED,
  PASSWORD_TOO_SHORT: AuthMessage.PASSWORD_TOO_SHORT,
  PASSWORD_TOO_LONG: AuthMessage.PASSWORD_TOO_LONG,
  PASSWORD_NEED_UPPERCASE: AuthMessage.PASSWORD_NEED_UPPERCASE,
  PASSWORD_NEED_NUMBER: AuthMessage.PASSWORD_NEED_NUMBER,
  PASSWORD_NOT_MATCH: AuthMessage.PASSWORD_NOT_MATCH,
  PASSWORD_SAME_AS_CURRENT: "Error.PasswordSameAsCurrent",
} as const;
