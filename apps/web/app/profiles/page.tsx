import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Star, ArrowRight, ShieldCheck } from "lucide-react";

// Danh sách các chuyên gia nổi bật để khách xem hồ sơ
const FEATURED_FREELANCERS = [
  {
    id: 1,
    name: "Alex Nguyen",
    title: "Senior Full-Stack & Cloud Architect",
    avatar: "https://i.pinimg.com/1200x/6d/10/c3/6d10c39c28732a13a03c99c7245878d1.jpg",
    rating: "4.98",
    completedJobs: 48,
    hourlyRate: "$45/hr",
    bio: "Hơn 7 năm kinh nghiệm phát triển hệ thống phân tán, microservices với NestJS, React, Next.js và kiến trúc đám mây AWS.",
    skills: ["React", "Next.js", "NestJS", "PostgreSQL", "AWS", "Docker"],
    badge: "Top Rated Plus",
  },
  {
    id: 2,
    name: "Minh Tran",
    title: "Lead UI/UX & Product Designer",
    avatar: "https://i.pinimg.com/736x/06/52/bf/0652bfda4c1b457989e013ebca7e3f8f.jpg",
    rating: "5.0",
    completedJobs: 36,
    hourlyRate: "$40/hr",
    bio: "Chuyên gia thiết kế Design System, SaaS Dashboard, Mobile App UI với phong cách tối giản, hiện đại và tối ưu chuyển đổi người dùng.",
    skills: ["Figma", "Design Systems", "UI/UX", "User Research", "Wireframing"],
    badge: "Top Rated",
  },
  {
    id: 3,
    name: "David Le",
    title: "Senior Mobile Engineer (Flutter & React Native)",
    avatar: "https://i.pinimg.com/1200x/49/1a/38/491a381ccbb6ea8306d8d4b014555d54.jpg",
    rating: "4.95",
    completedJobs: 52,
    hourlyRate: "$38/hr",
    bio: "Phát triển ứng dụng iOS & Android đa nền tảng mượt mà, tối ưu hiệu năng 60fps, tích hợp thanh toán Stripe và push notifications realtime.",
    skills: ["Flutter", "React Native", "iOS", "Android", "Firebase"],
    badge: "Top Rated",
  },
  {
    id: 4,
    name: "Sarah Pham",
    title: "AI & Machine Learning Engineer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    rating: "4.97",
    completedJobs: 29,
    hourlyRate: "$55/hr",
    bio: "Tích hợp LLM, xây dựng hệ thống RAG thông minh, fine-tuning mô hình ngôn ngữ và triển khai giải pháp AI xử lý ngôn ngữ tự nhiên.",
    skills: ["Python", "PyTorch", "LLM", "LangChain", "OpenAI API", "FastAPI"],
    badge: "Top Rated Plus",
  },
  {
    id: 5,
    name: "Hoang Vu",
    title: "DevOps & Infrastructure Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    rating: "4.92",
    completedJobs: 41,
    hourlyRate: "$48/hr",
    bio: "Thiết lập CI/CD pipeline tự động, hạ tầng Kubernetes (K8s), Terraform và giải pháp bảo mật hạ tầng đám mây cho doanh nghiệp.",
    skills: ["Kubernetes", "Docker", "Terraform", "CI/CD", "AWS", "Linux"],
    badge: "Top Rated",
  },
  {
    id: 6,
    name: "Lan Anh Do",
    title: "Senior Brand & Visual Identity Designer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    rating: "5.0",
    completedJobs: 33,
    hourlyRate: "$35/hr",
    bio: "Sáng tạo nhận diện thương hiệu độc đáo cho các startup công nghệ, thiết kế typography và ấn phẩm marketing kỹ thuật số cao cấp.",
    skills: ["Brand Identity", "Illustrator", "Photoshop", "Typography", "Visual Design"],
    badge: "Top Rated",
  },
];

export default function FreelancerDirectoryPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="GUEST" />

      <main className="flex-1">
        {/* Hero section */}
        <section className="border-b border-border/40 bg-zinc-50/70 py-12 sm:py-16 dark:bg-zinc-950/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="size-3.5" />
                Mạng lưới Freelancer đã xác minh hồ sơ
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Khám phá Top Freelancer Tài Năng
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                Tìm kiếm và kết nối trực tiếp với các chuyên gia lập trình, thiết kế và công nghệ hàng đầu trên nền tảng Frevia.
              </p>

              {/* Quick Search */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="text-muted-foreground self-center">Kỹ năng phổ biến:</span>
                {["React", "Node.js", "UI/UX", "Flutter", "Python AI", "AWS"].map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="rounded-full bg-white px-3 py-1 font-normal text-foreground dark:bg-zinc-900 border-border/70 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Freelancer Grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURED_FREELANCERS.map((freelancer) => (
                <div
                  key={freelancer.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 dark:bg-zinc-900 dark:border-zinc-800"
                >
                  <div>
                    {/* Header: Avatar + Name + Rating */}
                    <div className="flex items-start gap-4">
                      <Avatar className="size-16 rounded-2xl border border-border/80">
                        <AvatarImage src={freelancer.avatar} alt={freelancer.name} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-blue-50 text-blue-600 font-bold dark:bg-blue-950 dark:text-blue-400">
                          {freelancer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h2 className="text-base font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">
                            {freelancer.name}
                          </h2>
                          <span className="text-xs font-semibold text-foreground shrink-0">
                            {freelancer.hourlyRate}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {freelancer.title}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            <span>{freelancer.rating}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            ({freelancer.completedJobs} dự án)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="mt-4 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {freelancer.bio}
                    </p>

                    {/* Skills pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {freelancer.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Sẵn sàng nhận việc
                    </span>

                    <Button
                      size="sm"
                      asChild
                      className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-xs px-4"
                    >
                      <Link href={`/profiles/${freelancer.id}`}>
                        Xem hồ sơ
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
