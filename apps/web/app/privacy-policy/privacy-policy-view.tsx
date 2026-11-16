"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  Gavel,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Shield,
} from "@/components/icons";
import { Header, type UserRole } from "@/components/header";
import { Footer } from "@/components/footer";

type Props = {
  headerRole: UserRole;
};

export function PrivacyPolicyView({ headerRole }: Props) {
  const locale = useLocale();
  const isVi = locale === "vi";
  const [activeSection, setActiveSection] = useState<string>("collection");

  const sections = isVi
    ? [
        { id: "principles", title: "1. Nguyên tắc bảo vệ quyền riêng tư", icon: ShieldCheck },
        { id: "collection", title: "2. Dữ liệu cá nhân chúng tôi thu thập", icon: FileText },
        { id: "usage", title: "3. Mục đích sử dụng thông tin", icon: CheckCircle2 },
        { id: "third-parties", title: "4. Đơn vị xử lý dữ liệu bên thứ ba", icon: Shield },
        { id: "security", title: "5. Biện pháp an toàn & Thời hạn lưu trữ", icon: Lock },
        { id: "user-rights", title: "6. Quyền của bạn đối với dữ liệu", icon: Gavel },
        { id: "cookies", title: "7. Cookie & Quản lý phiên (Sessions)", icon: Eye },
        { id: "contact", title: "8. Thông tin liên hệ & Khiếu nại", icon: AlertTriangle },
      ]
    : [
        { id: "principles", title: "1. Privacy Principles & Scope", icon: ShieldCheck },
        { id: "collection", title: "2. Information We Collect", icon: FileText },
        { id: "usage", title: "3. How We Use Personal Information", icon: CheckCircle2 },
        { id: "third-parties", title: "4. Third-Party Service Providers", icon: Shield },
        { id: "security", title: "5. Data Security & Retention", icon: Lock },
        { id: "user-rights", title: "6. Your Rights & Choices", icon: Gavel },
        { id: "cookies", title: "7. Cookies & Session Management", icon: Eye },
        { id: "contact", title: "8. Contact Us & Inquiries", icon: AlertTriangle },
      ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header role={headerRole} />

      <main className="flex-1">
        {/* Hero Header */}
        <div className="border-b border-border/60 bg-linear-to-b from-emerald-500/5 via-background to-background py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-[#4fae2e] mb-6"
            >
              <ArrowLeft className="size-4" />
              <span>{isVi ? "Quay lại trang chủ" : "Back to Home"}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#4fae2e] dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                {isVi ? "Chính sách Bảo mật" : "Privacy Policy"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isVi ? "Cập nhật lần cuối: Tháng 11/2026" : "Last Modified: November 2026"}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {isVi ? "Chính sách Quyền riêng tư Frevia" : "Frevia Privacy Policy"}
            </h1>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isVi
                ? "Chính sách này giải thích cách Frevia thu thập, sử dụng, bảo mật và quản lý thông tin cá nhân của bạn khi bạn sử dụng nền tảng sàn giao dịch việc làm của chúng tôi."
                : "This policy explains how Frevia collects, uses, protects, and handles your personal information across our freelance marketplace platform."}
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3 px-2">
                  {isVi ? "Mục lục chính sách" : "Table of Contents"}
                </h3>
                <nav className="flex flex-col space-y-1">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[#4fae2e]/10 text-[#4fae2e] font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <IconComponent className="size-4 shrink-0 text-[#4fae2e]" />
                        <span className="truncate">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isVi
                      ? "Bạn muốn yêu cầu trích xuất hoặc xóa dữ liệu? Liên hệ"
                      : "Need to request data export or deletion? Contact"}{" "}
                    <a
                      href="mailto:privacy@frevia.com"
                      className="font-semibold text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      privacy@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <div className="lg:col-span-8 space-y-12">
              {/* Core Commitment Card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-foreground/90 dark:text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 shrink-0 text-[#4fae2e] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {isVi ? "Cam kết bảo mật của Frevia" : "Our Privacy Commitment"}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {isVi
                        ? "Chúng tôi không bán, cho thuê hay thương mại hóa dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị hoặc quảng cáo độc lập. Dữ liệu chỉ được sử dụng để vận hành sàn, kết nối việc làm và bảo vệ an toàn thanh toán."
                        : "We do not sell, rent, or monetize your personal data to third parties for independent marketing or advertising. Your information is used strictly to operate the platform, facilitate work contracts, and protect financial transactions."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section id="principles" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Nguyên tắc bảo vệ quyền riêng tư" : "Privacy Principles & Scope"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Chính sách quyền riêng tư này áp dụng cho toàn bộ người dùng (bao gồm Freelancer, Khách hàng và Khách truy cập) khi tương tác với nền tảng Frevia."
                      : "This Privacy Policy applies to all users (including Freelancers, Clients, and Visitors) interacting with the Frevia platform."}
                  </p>
                  <p>
                    {isVi
                      ? "Chúng tôi xử lý dữ liệu dựa trên các căn cứ hợp pháp: sự đồng ý của bạn khi đăng ký tài khoản, việc thực hiện hợp đồng dịch vụ mà bạn là một bên tham gia, và nghĩa vụ tuân thủ pháp luật phòng chống gian lận tài chính."
                      : "We process personal data based on lawful grounds: your consent upon account registration, the performance of contracts to which you are party, and compliance with anti-fraud legal requirements."}
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="collection" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Dữ liệu cá nhân chúng tôi thu thập" : "Information We Collect"}
                  </h2>
                </div>
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "1. Thông tin tài khoản & Xác thực" : "1. Account & Authentication Data"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Họ và tên, địa chỉ email, mật khẩu băm (bcrypt hash), vai trò lựa chọn (Freelancer hoặc Khách hàng), ảnh đại diện (avatar), mã OTP xác thực và tài khoản liên kết Google OAuth."
                        : "Full name, email address, bcrypt password hash, selected primary role, avatar image, email OTP verification codes, and linked Google OAuth account details."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "2. Hồ sơ nghề nghiệp & Portfolio" : "2. Professional Profile & Portfolio Data"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Chức danh, tiểu sử giới thiệu, mức thù lao, danh mục kỹ năng, lịch sử kinh nghiệm làm việc, trình độ học vấn, các tác phẩm portfolio tải lên và tệp CV/sơ yếu lý lịch."
                        : "Professional headline, biography, hourly rate, skills taxonomy, work experience history, education history, portfolio showcase items, and uploaded CV/resume files."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "3. Dữ liệu xác minh danh tính (KYC)" : "3. Identity Verification (KYC) Data"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Ảnh chụp mặt trước/mặt sau Căn cước công dân hoặc Hộ chiếu và ảnh chụp khuôn mặt (selfie) do người dùng tự nguyện gửi để xác minh tài khoản. Dữ liệu này chỉ phục vụ mục đích kiểm duyệt danh tính và chống giả mạo."
                        : "Government-issued identity documents (front/back photos) and verification selfies voluntarily submitted by users to verify identity and earn verified platform badges."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "4. Dữ liệu Hợp đồng, Cột mốc & Thanh toán" : "4. Contracts, Milestones & Transaction Data"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Nội dung tin đăng việc, hồ sơ đề xuất (bids), điều khoản hợp đồng cột mốc, tệp kết quả bàn giao, mã định danh khách hàng và giao dịch Stripe (Stripe Customer ID, Payment Intent ID), hóa đơn điện tử (Invoices). Frevia tuyệt đối không lưu trữ thông tin thẻ ngân hàng trực tiếp."
                        : "Job listings, proposals, milestone contract terms, deliverable submission files, Stripe customer/payment intent IDs, and invoice records. Frevia never stores raw payment card numbers."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "5. Tin nhắn & Diễn đàn cộng đồng" : "5. Direct Messages & Forum Interactions"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Tin nhắn trực tiếp trao đổi giữa Khách hàng và Freelancer, tệp đính kèm chia sẻ trong dự án, bài viết, bình luận và lượt thích trên Diễn đàn."
                        : "Direct messages exchanged between clients and freelancers, shared project files, forum posts, comments, likes, and community reports."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {isVi ? "6. Dữ liệu kỹ thuật & Nhật ký hoạt động" : "6. Technical & Activity Logs"}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {isVi
                        ? "Địa chỉ IP, loại thiết bị, thông tin trình duyệt, mã phiên đăng nhập (session tokens), thời gian truy cập và nhật ký lỗi hệ thống."
                        : "IP address, device type, browser user agent, session tokens, login history, and access timestamps."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="usage" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Mục đích sử dụng thông tin" : "How We Use Personal Information"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">{isVi ? "Vận hành dịch vụ:" : "Core Services:"}</strong>{" "}
                      {isVi
                        ? "Xác thực danh tính khi đăng nhập, hiển thị hồ sơ cá nhân, hỗ trợ tìm kiếm và kết nối công việc phù hợp."
                        : "Authenticating accounts, displaying professional profiles, and matching freelancers with client job posts."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Quản lý hợp đồng & Thanh toán:" : "Contract & Escrow:"}</strong>{" "}
                      {isVi
                        ? "Tạo hợp đồng theo cột mốc, tạm giữ và giải ngân tiền qua Stripe, lưu trữ lịch sử bàn giao sản phẩm và xuất hóa đơn."
                        : "Executing milestone contracts, escrow holding and payout via Stripe, deliverable tracking, and invoicing."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Giải quyết tranh chấp:" : "Dispute Arbitration:"}</strong>{" "}
                      {isVi
                        ? "Sử dụng tệp bàn giao và lịch sử tin nhắn để quản trị viên đánh giá khách quan khi xảy ra khiếu nại giữa hai bên."
                        : "Using project submissions and communications to fairly arbitrate disputes between clients and freelancers."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Trí tuệ nhân tạo (AI):" : "AI Recommendations:"}</strong>{" "}
                      {isVi
                        ? "Phân tích nội dung CV và kỹ năng để gợi ý các công việc hoặc ứng viên phù hợp nhất trên nền tảng."
                        : "Analyzing CV skills and project metadata to generate intelligent job and talent recommendations."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Bảo vệ an toàn nền tảng:" : "Security & Fraud Prevention:"}</strong>{" "}
                      {isVi
                        ? "Kiểm duyệt từ khóa vi phạm (Banned Keywords), ngăn chặn thư rác, tài khoản mạo danh và tấn công mạng."
                        : "Detecting banned keywords, preventing spam, unauthorized access, and malicious activity."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="third-parties" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    4
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Đơn vị xử lý dữ liệu bên thứ ba" : "Third-Party Service Providers"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Frevia hợp tác với các nhà cung cấp dịch vụ hạ tầng uy tín hàng đầu nhằm đảm bảo an toàn tuyệt đối cho người dùng:"
                      : "Frevia collaborates with industry-leading infrastructure partners to guarantee data integrity and security:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">Stripe:</strong>{" "}
                      {isVi
                        ? "Xử lý toàn bộ giao dịch thẻ, tài khoản ngân hàng và ký quỹ cột mốc tuân thủ nghiêm ngặt chuẩn bảo mật PCI-DSS Level 1."
                        : "Processes card transactions, payouts, and milestone holds in strict compliance with PCI-DSS Level 1 security standards."}
                    </li>
                    <li>
                      <strong className="text-foreground">Cloudinary:</strong>{" "}
                      {isVi
                        ? "Lưu trữ đám mây an toàn đối với ảnh đại diện, tác phẩm portfolio, tệp CV và các tài liệu bàn giao dự án."
                        : "Provides secure cloud storage for avatars, portfolio media, CV files, and milestone deliverables."}
                    </li>
                    <li>
                      <strong className="text-foreground">Google OAuth:</strong>{" "}
                      {isVi
                        ? "Hỗ trợ xác thực đăng nhập một chạm bảo mật thông qua tài khoản Google khi người dùng lựa chọn."
                        : "Enables secure single sign-on authentication when selected by the user."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="security" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    5
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Biện pháp an toàn & Thời hạn lưu trữ" : "Data Security & Retention"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Chúng tôi áp dụng các tiêu chuẩn an ninh mạng nghiêm ngặt: mã hóa toàn diện dữ liệu truyền tải qua HTTPS/TLS, băm mật khẩu một chiều bằng bcrypt, xác thực phân quyền vai trò (RBAC) và kiểm tra phiên đăng nhập bảo mật."
                      : "We employ strict security measures: TLS/HTTPS transport encryption, irreversible bcrypt password hashing, role-based access control (RBAC), and verified session tokens."}
                  </p>
                  <p>
                    {isVi
                      ? "Thời hạn lưu trữ: Dữ liệu tài khoản được duy trì trong suốt thời gian bạn sử dụng dịch vụ. Các hóa đơn và hồ sơ hợp đồng hoàn thành được lưu trữ theo quy định pháp luật về kế toán và phòng chống gian lận thương mại."
                      : "Retention Period: Account data is retained for the duration of active service. Invoices and completed contract records are archived to comply with accounting and anti-fraud regulations."}
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="user-rights" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    6
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Quyền của bạn đối với dữ liệu" : "Your Rights & Choices"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">{isVi ? "Quyền xem & chỉnh sửa:" : "Access & Modification:"}</strong>{" "}
                      {isVi
                        ? "Bạn có thể tự do xem và chỉnh sửa thông tin hồ sơ, kỹ năng, kinh nghiệm và cài đặt thông báo trong trang Hồ sơ cá nhân."
                        : "You can view and modify your profile details, skills, and notification settings anytime in your Account Settings."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Quyền quản lý phiên:" : "Session Management:"}</strong>{" "}
                      {isVi
                        ? "Bạn có quyền kiểm tra tất cả các thiết bị đang kết nối vào tài khoản của mình và thu hồi quyền truy cập (revoke session) ngay lập tức."
                        : "You can audit all active device sessions and revoke access immediately for any unrecognized login."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Quyền yêu cầu xóa tài khoản:" : "Account Deletion:"}</strong>{" "}
                      {isVi
                        ? "Bạn có quyền yêu cầu vô hiệu hóa hoặc xóa tài khoản vĩnh viễn khi không còn hợp đồng hoặc số dư tranh chấp đang diễn ra."
                        : "You may request permanent account deletion provided you have no active contracts or pending dispute proceedings."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    7
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Cookie & Quản lý phiên (Sessions)" : "Cookies & Session Management"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Frevia chỉ sử dụng các cookie thiết yếu (Essential Cookies) phục vụ hoạt động cơ bản của hệ thống:"
                      : "Frevia uses only essential cookies necessary for foundational platform operation:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">accessToken:</strong>{" "}
                      {isVi
                        ? "Lưu trữ mã phiên đăng nhập an toàn (HttpOnly) nhằm duy trì trạng thái đăng nhập."
                        : "Secures authentication state across page transitions."}
                    </li>
                    <li>
                      <strong className="text-foreground">locale / theme:</strong>{" "}
                      {isVi
                        ? "Ghi nhớ ngôn ngữ ưu tiên (Tiếng Việt hoặc Tiếng Anh) và chế độ giao diện (Sáng hoặc Tối)."
                        : "Remembers your preferred language (EN or VI) and UI theme (Light or Dark)."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="contact" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Thông tin liên hệ & Khiếu nại" : "Contact Us & Inquiries"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Nếu bạn có bất kỳ câu hỏi, góp ý hoặc khiếu nại liên quan đến quyền riêng tư và xử lý dữ liệu, vui lòng liên hệ:"
                      : "For privacy questions, data requests, or complaints, please reach out to our data protection team:"}
                  </p>
                  <p className="font-semibold text-foreground">
                    Email:{" "}
                    <a
                      href="mailto:privacy@frevia.com"
                      className="text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      privacy@frevia.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Action Card */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground">
                  {isVi ? "Tìm hiểu thêm các điều khoản của Frevia" : "Learn More About Frevia Terms"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {isVi
                    ? "Đọc thêm Thỏa thuận Người dùng Freelancer để nắm rõ quyền và trách nhiệm khi hợp tác dự án và nhận thanh toán."
                    : "Read our Freelancer User Agreement to understand rights, deliverables, and payment release terms."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/user-agreement"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4fae2e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#439c27]"
                  >
                    {isVi ? "Xem Thỏa thuận Người dùng" : "View User Agreement"}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {isVi ? "Quay lại trang Đăng ký" : "Back to Register"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

