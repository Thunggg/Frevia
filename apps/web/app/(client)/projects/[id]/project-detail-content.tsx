import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProjectDetail } from '../project-detail';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

interface ProjectDetailContentProps {
  projectId: string
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header role="CLIENT" />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProjectDetail projectId={projectId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
