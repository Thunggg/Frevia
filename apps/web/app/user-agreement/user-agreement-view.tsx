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
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Users,
} from "@/components/icons";
import { Header, type UserRole } from "@/components/header";
import { Footer } from "@/components/footer";

type Props = {
  headerRole: UserRole;
};

export function UserAgreementView({ headerRole }: Props) {
  const locale = useLocale();
  const isVi = locale === "vi";
  const [activeSection, setActiveSection] = useState<string>("overview");

  const sections = isVi
    ? [
        { id: "overview", title: "1. Tổng quan & Mô hình hoạt động", icon: Gavel },
        { id: "eligibility", title: "2. Điều kiện tham gia & Bảo mật tài khoản", icon: Lock },
        { id: "profiles", title: "3. Hồ sơ Freelancer & Portfolio", icon: Users },
        { id: "jobs-proposals", title: "4. Đăng việc & Gửi đề xuất (Proposal)", icon: FileText },
        { id: "contracts-milestones", title: "5. Hợp đồng & Cột mốc (Milestones)", icon: CheckCircle2 },
        { id: "payments", title: "6. Thanh toán qua Stripe & Ký quỹ", icon: CreditCard },
        { id: "disputes", title: "7. Giải quyết tranh chấp (Dispute)", icon: AlertTriangle },
        { id: "conduct", title: "8. Quy tắc ứng xử & Diễn đàn cộng đồng", icon: MessageSquare },
        { id: "intellectual-property", title: "9. Quyền sở hữu trí tuệ", icon: ShieldCheck },
        { id: "termination", title: "10. Chấm dứt & Điều khoản chung", icon: AlertTriangle },
      ]
    : [
        { id: "overview", title: "1. Overview & Marketplace Model", icon: Gavel },
        { id: "eligibility", title: "2. Eligibility & Account Security", icon: Lock },
        { id: "profiles", title: "3. Freelancer Profiles & Portfolios", icon: Users },
        { id: "jobs-proposals", title: "4. Job Postings & Proposals", icon: FileText },
        { id: "contracts-milestones", title: "5. Milestone Contracts & Deliverables", icon: CheckCircle2 },
        { id: "payments", title: "6. Payments via Stripe & Escrow", icon: CreditCard },
        { id: "disputes", title: "7. Dispute Resolution & Arbitration", icon: AlertTriangle },
        { id: "conduct", title: "8. Code of Conduct & Community Forum", icon: MessageSquare },
        { id: "intellectual-property", title: "9. Intellectual Property Rights", icon: ShieldCheck },
        { id: "termination", title: "10. Termination & General Terms", icon: AlertTriangle },
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
                <FileText className="size-3.5" />
                {isVi ? "Văn bản pháp lý" : "Legal Document"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isVi ? "Cập nhật lần cuối: Tháng 11/2026" : "Last Modified: November 2026"}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {isVi ? "Thỏa thuận Người dùng Freelancer" : "Freelancer User Agreement"}
            </h1>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isVi
                ? "Thỏa thuận này quy định các điều khoản và điều kiện khi bạn sử dụng nền tảng Frevia để kết nối, hợp tác dự án theo cột mốc, xử lý thanh toán qua Stripe và tham gia cộng đồng."
                : "This User Agreement outlines the terms and conditions governing your use of the Frevia platform for project matching, milestone-based contracts, Stripe payments, and community interactions."}
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
                  {isVi ? "Mục lục điều khoản" : "Table of Contents"}
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
                      ? "Cần giải đáp về điều khoản? Vui lòng gửi email đến"
                      : "Questions regarding these terms? Contact us at"}{" "}
                    <a
                      href="mailto:support@frevia.com"
                      className="font-semibold text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      support@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <div className="lg:col-span-8 space-y-12">
              {/* Notice Box */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-foreground/90 dark:text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 shrink-0 text-[#4fae2e] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {isVi ? "Tóm tắt quan trọng trước khi đăng ký" : "Key Notice Before Registering"}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {isVi
                        ? "Bằng cách đánh dấu vào ô 'Tôi đồng ý với Thỏa thuận Người dùng Freelancer và Chính sách Quyền riêng tư', bạn cam kết tuân thủ đầy đủ các quyền và nghĩa vụ được nêu rõ trong văn bản này."
                        : "By checking 'I agree to the Freelancer User Agreement and Privacy Policy' during registration, you confirm that you have read, understood, and agreed to be bound by all provisions set forth herein."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section id="overview" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Tổng quan & Mô hình hoạt động" : "Overview & Marketplace Model"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Frevia là sàn giao dịch việc làm trực tuyến (Online Freelance Marketplace), đóng vai trò nền tảng trung gian kết nối các Freelancer (Người cung cấp dịch vụ) với Khách hàng (Client/Employer - Người tuyển dụng và thuê dịch vụ)."
                      : "Frevia operates an online curated marketplace facilitating connections between independent Freelancers (service providers) and Clients (employers and business clients) for project engagements."}
                  </p>
                  <p>
                    {isVi
                      ? "Mối quan hệ Nhà thầu Độc lập (Independent Contractor): Freelancer là đối tác kinh doanh độc lập, không phải là nhân viên, người lao động, đại lý hay đối tác liên doanh của Frevia hoặc Khách hàng. Frevia không trực tiếp tuyển dụng, trả lương định kỳ, quản lý nhân sự hay giám sát giờ làm của Freelancer."
                      : "Independent Contractor Relationship: Freelancers are independent contractors and not employees, agents, or partners of Frevia or Clients. Nothing in this Agreement creates an employment, agency, or partnership relationship."}
                  </p>
                  <p>
                    {isVi
                      ? "Frevia cung cấp các công cụ quản lý dự án, hợp đồng theo cột mốc (milestone), trung gian thanh toán và xử lý tranh chấp nhằm đảm bảo giao dịch diễn ra an toàn, minh bạch."
                      : "Frevia provides matching systems, milestone-based contract templates, secure payment mediation, and dispute arbitration to ensure transparent and safe transactions."}
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="eligibility" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Điều kiện tham gia & Bảo mật tài khoản" : "Eligibility & Account Security"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">{isVi ? "Độ tuổi:" : "Minimum Age:"}</strong>{" "}
                      {isVi
                        ? "Bạn phải từ đủ 18 tuổi trở lên (hoặc đủ tuổi chịu trách nhiệm dân sự theo pháp luật hiện hành) để đăng ký và giao kết hợp đồng trên Frevia."
                        : "You must be at least 18 years old and capable of forming legally binding contracts."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Xác thực tài khoản:" : "Account Verification:"}</strong>{" "}
                      {isVi
                        ? "Mỗi tài khoản được liên kết với một địa chỉ email duy nhất và xác thực thông qua mã OTP hoặc đăng nhập Google OAuth. Mật khẩu được mã hóa an toàn bằng thuật toán bcrypt."
                        : "Each account requires a verified email address via OTP or secure Google OAuth. Passwords are encrypted with bcrypt hashing."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Quản lý phiên đăng nhập:" : "Session Control:"}</strong>{" "}
                      {isVi
                        ? "Bạn có thể kiểm tra danh sách thiết bị/phiên đang đăng nhập và thu hồi phiên (revoke session) từ xa bất kỳ lúc nào trong trang Cài đặt."
                        : "You can monitor active sessions and remotely revoke unauthorized device sessions in your Account Settings."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Xác minh danh tính (KYC):" : "Identity Verification (KYC):"}</strong>{" "}
                      {isVi
                        ? "Freelancer có thể tự nguyện tải lên tài liệu tùy thân (Căn cước công dân/Hộ chiếu) và ảnh selfie để nhận huy hiệu xác minh danh tính. Dữ liệu này được kiểm duyệt bảo mật nhằm phòng chống gian lận và mạo danh."
                        : "Freelancers may submit government-issued identification documents and verification photos to obtain verified badges, preventing fraud and impersonation."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section id="profiles" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Hồ sơ Freelancer & Portfolio" : "Freelancer Profiles & Portfolios"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Freelancer có trách nhiệm đảm bảo mọi thông tin trên hồ sơ (chức danh, kỹ năng, kinh nghiệm làm việc, học vấn, mức thù lao theo giờ) là chính xác, trung thực và được cập nhật."
                      : "Freelancers are responsible for providing truthful, accurate, and up-to-date information regarding their professional title, skill taxonomy, work experience, and rates."}
                  </p>
                  <p>
                    {isVi
                      ? "Tác phẩm Portfolio tải lên phải do chính Freelancer thực hiện hoặc có đầy đủ quyền sở hữu/sử dụng hợp pháp. Nghiêm cấm mạo danh tác phẩm của người khác."
                      : "All portfolio items and project samples uploaded must represent the freelancer's original work or work they hold legitimate license to showcase."}
                  </p>
                  <p>
                    {isVi
                      ? "Tính năng Tải lên CV & Phân tích AI: Frevia hỗ trợ trích xuất kỹ năng từ tệp CV của bạn để đề xuất công việc phù hợp. Các thay đổi hồ sơ lớn có thể được kiểm duyệt (Profile Revision) trước khi xuất hiện công khai."
                      : "CV Analysis & AI Matching: Frevia parses uploaded CV documents to extract skills and improve job recommendations. Significant profile revisions are subject to moderation."}
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="jobs-proposals" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    4
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Đăng việc & Gửi đề xuất (Proposal)" : "Job Postings & Proposals"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Khách hàng đăng tin tuyển dụng với mô tả công việc cụ thể, danh mục ngành nghề, kỹ năng yêu cầu và ngân sách dự kiến."
                      : "Clients post job requisitions specifying scope of work, category taxonomy, required skills, and expected budget."}
                  </p>
                  <p>
                    {isVi
                      ? "Freelancer tìm kiếm việc làm, gửi Đề xuất (Proposal) nêu rõ giá thầu, thời gian hoàn thành dự kiến, kế hoạch cột mốc và tệp đính kèm liên quan. Khách hàng và Freelancer có thể trao đổi trực tiếp qua hệ thống tin nhắn tích hợp của Frevia."
                      : "Freelancers submit proposals detailing pricing, delivery estimates, proposed milestone splits, and supporting attachments. Both parties may communicate via Frevia's messaging system."}
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="contracts-milestones" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    5
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Hợp đồng & Cột mốc (Milestones)" : "Milestone Contracts & Deliverables"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Hợp đồng dịch vụ trên Frevia được tổ chức theo Cột mốc (Milestones). Mỗi cột mốc định nghĩa rõ: kết quả bàn giao cụ thể (deliverables), hạn chót (deadline) và số tiền thanh toán tương ứng."
                      : "Contracts on Frevia operate under defined Milestones. Each milestone specifies deliverable outcomes, deadlines, and allocated payment amounts."}
                  </p>
                  <p>
                    {isVi
                      ? "Nộp sản phẩm (Submission): Khi hoàn thành, Freelancer tải tệp kết quả lên hệ thống để Khách hàng nghiệm thu."
                      : "Submissions: Freelancers upload completed work files and progress notes through the milestone submission portal for client acceptance."}
                  </p>
                  <p>
                    {isVi
                      ? "Nghiệm thu: Khách hàng có nghĩa vụ kiểm tra sản phẩm với tinh thần thiện chí và phê duyệt giải ngân cột mốc hoặc yêu cầu chỉnh sửa trong phạm vi đã thỏa thuận."
                      : "Client Review: Clients must review deliverables in good faith and either release milestone funds or request revisions aligned with the agreed scope."}
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="payments" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    6
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Thanh toán qua Stripe & Ký quỹ an toàn" : "Payments via Stripe & Escrow"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">{isVi ? "Cổng thanh toán Stripe:" : "Stripe Processing:"}</strong>{" "}
                      {isVi
                        ? "Mọi giao dịch nạp tiền, tạm giữ và thanh toán được thực hiện an toàn qua Stripe. Frevia không lưu trữ số thẻ tín dụng hoặc mã CVV trên máy chủ của mình."
                        : "All payments are processed securely via Stripe. Frevia never stores raw credit card details or CVVs on its servers."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Tạm giữ cột mốc (Escrow Hold):" : "Milestone Hold (Escrow):"}</strong>{" "}
                      {isVi
                        ? "Trước khi Freelancer bắt đầu thực hiện cột mốc, Khách hàng phải nạp tiền tạm giữ qua Stripe. Số tiền này được bảo đảm và sẽ tự động giải ngân cho Freelancer khi Khách hàng nhấn 'Phê duyệt'."
                        : "Clients fund the milestone via Stripe prior to work commencement. Funds are held in escrow and released to the freelancer upon client approval."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Nghiêm cấm giao dịch ngoài sàn:" : "Anti-Circumvention Rule:"}</strong>{" "}
                      {isVi
                        ? "Nghiêm cấm hành vi thanh toán ngoài nền tảng Frevia đối với các dự án đã tìm thấy trên sàn. Vi phạm sẽ dẫn đến việc khóa tài khoản vĩnh viễn và mất quyền bảo vệ thanh toán."
                        : "Bypassing Frevia or Stripe to conduct off-platform payments for engagements originated on the platform is strictly prohibited and results in immediate account suspension."}
                    </li>
                    <li>
                      <strong className="text-foreground">{isVi ? "Hóa đơn điện tử:" : "Electronic Invoices:"}</strong>{" "}
                      {isVi
                        ? "Hệ thống tự động xuất hóa đơn (Invoice) và biên lai giao dịch cho mỗi cột mốc được thanh toán thành công."
                        : "Digital invoices and transaction receipts are automatically generated upon successful milestone payouts."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="disputes" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    7
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Giải quyết tranh chấp (Dispute)" : "Dispute Resolution & Arbitration"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Khi xảy ra bất đồng về chất lượng sản phẩm bàn giao hoặc việc giải ngân cột mốc mà hai bên không tự thương lượng được, Khách hàng hoặc Freelancer có quyền khởi tạo Tranh chấp (Dispute)."
                      : "If a client and freelancer cannot reach agreement regarding deliverables or payment release, either party may formally initiate a Dispute."}
                  </p>
                  <p>
                    {isVi
                      ? "Quy trình giải quyết: Cả hai bên tải lên bằng chứng (tệp bàn giao, lịch sử tin nhắn, yêu cầu chỉnh sửa). Đội ngũ quản trị viên Frevia sẽ thẩm định khách quan dựa trên điều khoản hợp đồng và bằng chứng để đưa ra phán quyết ràng buộc (giải ngân toàn bộ cho freelancer, hoàn tiền cho khách hàng hoặc chia tỷ lệ thỏa đáng)."
                      : "Arbitration Process: Both parties submit evidence (files, messages, contract specifications). Frevia arbitration staff conducts an objective review and issues a final, binding decision (full payout, refund, or proportionate allocation)."}
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="conduct" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Quy tắc ứng xử & Diễn đàn cộng đồng" : "Code of Conduct & Community Forum"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Người dùng cam kết giao tiếp lịch sự, tôn trọng trong tin nhắn và diễn đàn. Nghiêm cấm các hành vi: quấy rối, đe dọa, xúc phạm danh dự, phát tán phần mềm độc hại, gửi thư rác (spam) hoặc lừa đảo."
                      : "Users agree to interact professionally and courteously. Harassment, abusive language, fraud, malware distribution, phishing, and spam are strictly prohibited."}
                  </p>
                  <p>
                    {isVi
                      ? "Cơ chế báo cáo vi phạm: Bài viết hoặc bình luận vi phạm trên Diễn đàn có thể bị thành viên báo cáo (Forum Report) và quản trị viên có quyền ẩn nội dung, khóa quyền đăng hoặc cấm tài khoản vi phạm."
                      : "Community Moderation: Inappropriate forum posts or comments may be flagged by users for review, and moderators reserve the right to remove content or ban offending accounts."}
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="intellectual-property" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    9
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Quyền sở hữu trí tuệ" : "Intellectual Property Rights"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Sản phẩm bàn giao dự án: Khi Khách hàng đã thanh toán đầy đủ tiền cột mốc theo hợp đồng, quyền sở hữu trí tuệ đối với các sản phẩm được tạo riêng cho dự án sẽ chuyển giao trọn vẹn cho Khách hàng (trừ khi hai bên có thỏa thuận văn bản khác)."
                      : "Work Product Ownership: Upon complete release of milestone payments, all intellectual property rights in custom deliverables produced for the client transfer to the Client."}
                  </p>
                  <p>
                    {isVi
                      ? "Tài sản trí tuệ sẵn có của Freelancer: Freelancer giữ quyền đối với các công cụ, mã nguồn khung hoặc thư viện sẵn có mà mình đã phát triển trước đó, đồng thời giữ quyền đưa tác phẩm vào Portfolio của mình trừ khi có thỏa thuận bảo mật (NDA) riêng."
                      : "Pre-existing IP: Freelancers retain ownership of their pre-existing frameworks and retain portfolio display rights unless restricted by a specific Non-Disclosure Agreement."}
                  </p>
                  <p>
                    {isVi
                      ? "Sở hữu nền tảng: Thương hiệu Frevia, logo, thiết kế giao diện và mã nguồn hệ thống thuộc quyền sở hữu độc quyền của Frevia."
                      : "Frevia Platform IP: Frevia trademarks, brand logos, user interface designs, and platform codebase remain the exclusive property of Frevia."}
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="termination" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    10
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {isVi ? "Chấm dứt & Điều khoản chung" : "Termination & General Terms"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>
                    {isVi
                      ? "Frevia có quyền tạm ngưng hoặc đóng vĩnh viễn tài khoản của người dùng có hành vi vi phạm nghiêm trọng Thỏa thuận này, gian lận thanh toán hoặc gây nguy hại đến an toàn hệ thống."
                      : "Frevia reserves the right to suspend or terminate accounts that breach this Agreement, engage in financial fraud, or jeopardize marketplace integrity."}
                  </p>
                  <p>
                    {isVi
                      ? "Giới hạn trách nhiệm: Nền tảng được cung cấp trên nguyên tắc 'nguyên trạng' (as-is). Frevia nỗ lực tối đa đảm bảo tính ổn định và bảo mật nhưng không chịu trách nhiệm đối với các tổn thất gián tiếp phát sinh từ sự cố mạng hoặc tranh chấp cá nhân giữa các bên ngoài thẩm quyền phân xử."
                      : "Limitation of Liability: The platform is provided 'as is' and 'as available'. Frevia disclaims indirect or consequential damages to the maximum extent permitted by applicable law."}
                  </p>
                </div>
              </section>

              {/* Contact Card */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground">
                  {isVi ? "Bạn có thắc mắc về Thỏa thuận Người dùng?" : "Questions About This Agreement?"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {isVi
                    ? "Nếu bạn cần làm rõ bất kỳ điều khoản nào, vui lòng liên hệ với bộ phận hỗ trợ pháp lý và người dùng của Frevia qua địa chỉ email hoặc diễn đàn hỗ trợ."
                    : "For inquiries or clarifications regarding these terms, contact our support and legal operations team via email or our community forum."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="mailto:support@frevia.com"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4fae2e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#439c27]"
                  >
                    {isVi ? "Gửi email hỗ trợ" : "Contact Support"}
                  </a>
                  <Link
                    href="/privacy-policy"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {isVi ? "Xem Chính sách Quyền riêng tư" : "View Privacy Policy"}
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

