import { PDFDocument, PDFPage } from 'pdf-lib';
import { CloudinaryService } from './cloudinary.service';
import { ContractPdfService } from './contract-pdf.service';
import { PrismaService } from './prisma.service';

describe('ContractPdfService', () => {
  it('renders contract end date in the generated signed PDF buffer', async () => {
    const drawTextSpy = jest.spyOn(PDFPage.prototype, 'drawText');
    const service = new ContractPdfService(
      {} as PrismaService,
      { isConfigured: () => false } as unknown as CloudinaryService,
    );

    const expiresAt = new Date('2027-03-15T16:59:59.999Z');
    const formattedExpiry = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(expiresAt);

    const buffer = await service.buildContractPdfBuffer({
      id: 17,
      slug: 'contract-landingpage-test',
      totalAmount: 500,
      platformFee: 15,
      clientPlatformFee: 15,
      terms: 'Deliver responsive landing page.',
      signedAt: new Date('2026-11-10T10:00:00.000Z'),
      clientSignedAt: new Date('2026-11-10T09:00:00.000Z'),
      freelancerSignedAt: new Date('2026-11-10T10:00:00.000Z'),
      createdAt: new Date('2026-11-08T10:00:00.000Z'),
      expiresAt,
      client: {
        email: 'client@example.com',
        profile: { displayName: 'Jordan' },
      },
      freelancer: {
        email: 'freelancer@example.com',
        profile: { displayName: 'Alex' },
      },
      job: { title: 'Landing Page Redesign' },
      milestones: [
        {
          id: 1,
          title: 'Phase 1',
          description: 'Initial design',
          amount: 500,
          dueDate: new Date('2027-03-10T16:59:59.999Z'),
        },
      ],
    });

    expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
    const parsedPdf = await PDFDocument.load(buffer);
    expect(parsedPdf.getPageCount()).toBeGreaterThanOrEqual(1);

    const renderedTexts = drawTextSpy.mock.calls.map((call) => call[0]);
    expect(renderedTexts).toContain('Contract End Date');
    expect(renderedTexts).toContain(formattedExpiry);
    expect(
      renderedTexts.some((text) =>
        text.includes(`contract end date of ${formattedExpiry}`),
      ),
    ).toBe(true);

    drawTextSpy.mockRestore();
  });
});
