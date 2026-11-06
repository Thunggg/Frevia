import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from './prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

function sanitizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    .trim();
}

function formatMoney(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

@Injectable()
export class ContractPdfService {
  private readonly logger = new Logger(ContractPdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Generates a formal PDF agreement document buffer using pdf-lib.
   */
  async buildContractPdfBuffer(contract: {
    id: number;
    slug: string;
    totalAmount: number;
    platformFee: number;
    clientPlatformFee?: number | null;
    terms?: string | null;
    signedAt?: Date | null;
    clientSignedAt?: Date | null;
    freelancerSignedAt?: Date | null;
    createdAt: Date;
    client: { email: string; profile?: { displayName?: string | null } | null };
    freelancer: {
      email: string;
      profile?: { displayName?: string | null } | null;
    };
    job: { title: string };
    milestones: Array<{
      id: number;
      title: string;
      description?: string | null;
      amount: number;
      dueDate?: Date | null;
    }>;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    const checkPageBreak = (neededHeight: number) => {
      if (currentY - neededHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
    };

    // --- Header ---
    page.drawRectangle({
      x: margin,
      y: currentY - 60,
      width: contentWidth,
      height: 60,
      color: rgb(0.04, 0.12, 0.28), // Deep Navy
    });

    page.drawText('FREVIA FREELANCE SERVICE AGREEMENT', {
      x: margin + 15,
      y: currentY - 25,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(
      `Official Contract Document | Status: ACTIVE (Fully Executed & Funded)`,
      {
        x: margin + 15,
        y: currentY - 45,
        size: 9,
        font,
        color: rgb(0.8, 0.88, 1),
      },
    );

    currentY -= 80;

    // --- Metadata Summary Box ---
    page.drawRectangle({
      x: margin,
      y: currentY - 55,
      width: contentWidth,
      height: 55,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.93),
      borderWidth: 1,
    });

    page.drawText(`Contract ID: #${contract.id}`, {
      x: margin + 12,
      y: currentY - 20,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Slug: ${contract.slug}`, {
      x: margin + 12,
      y: currentY - 38,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(
      `Execution Date: ${formatDate(contract.signedAt ?? contract.createdAt)}`,
      {
        x: margin + 280,
        y: currentY - 20,
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2),
      },
    );

    page.drawText(`Total Value: ${formatMoney(contract.totalAmount)}`, {
      x: margin + 280,
      y: currentY - 38,
      size: 10,
      font: fontBold,
      color: rgb(0.0, 0.45, 0.15),
    });

    currentY -= 75;

    // --- Parties Involved ---
    page.drawText('1. PARTIES TO THIS AGREEMENT', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 15;

    const clientName = sanitizeText(
      contract.client.profile?.displayName || 'Client',
    );
    const freelancerName = sanitizeText(
      contract.freelancer.profile?.displayName || 'Freelancer',
    );

    // Box for Client & Freelancer
    const boxWidth = (contentWidth - 15) / 2;
    // Client box
    page.drawRectangle({
      x: margin,
      y: currentY - 60,
      width: boxWidth,
      height: 60,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 1,
    });
    page.drawText('CLIENT (PARTY A)', {
      x: margin + 10,
      y: currentY - 18,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });
    page.drawText(`Name: ${clientName}`, {
      x: margin + 10,
      y: currentY - 34,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Email: ${contract.client.email}`, {
      x: margin + 10,
      y: currentY - 48,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Freelancer box
    page.drawRectangle({
      x: margin + boxWidth + 15,
      y: currentY - 60,
      width: boxWidth,
      height: 60,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 1,
    });
    page.drawText('FREELANCER (PARTY B)', {
      x: margin + boxWidth + 25,
      y: currentY - 18,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });
    page.drawText(`Name: ${freelancerName}`, {
      x: margin + boxWidth + 25,
      y: currentY - 34,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Email: ${contract.freelancer.email}`, {
      x: margin + boxWidth + 25,
      y: currentY - 48,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    currentY -= 80;

    // --- Project Scope ---
    page.drawText('2. PROJECT & SERVICE SCOPE', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 16;

    page.drawText(`Job Title: ${sanitizeText(contract.job.title)}`, {
      x: margin,
      y: currentY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 20;

    // --- Financial Terms & Platform Fee ---
    page.drawText('3. FINANCIAL TERMS & PLATFORM ACTIVATION', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 15;

    page.drawText(
      `Total Contract Value: ${formatMoney(contract.totalAmount)}`,
      {
        x: margin,
        y: currentY,
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      },
    );
    currentY -= 14;

    const clientFee =
      contract.clientPlatformFee ??
      Math.round(Number(contract.totalAmount) * 0.03 * 100) / 100;
    const freelancerFee =
      Math.round(Number(contract.totalAmount) * 0.05 * 100) / 100;
    page.drawText(
      `Platform Service Fees: Client 3% (${formatMoney(clientFee)}) | Freelancer 5% (${formatMoney(freelancerFee)})`,
      {
        x: margin,
        y: currentY,
        size: 9,
        font,
        color: rgb(0.1, 0.5, 0.2),
      },
    );
    currentY -= 22;

    // --- Milestones Section ---
    checkPageBreak(100);
    page.drawText('4. AGREED MILESTONES & DELIVERABLES', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 16;

    // Milestones header table
    page.drawRectangle({
      x: margin,
      y: currentY - 18,
      width: contentWidth,
      height: 18,
      color: rgb(0.9, 0.93, 0.97),
    });
    page.drawText('Milestone Title', {
      x: margin + 8,
      y: currentY - 13,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    page.drawText('Due Date', {
      x: margin + 290,
      y: currentY - 13,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    page.drawText('Amount', {
      x: margin + 410,
      y: currentY - 13,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    currentY -= 20;

    for (const ms of contract.milestones) {
      checkPageBreak(25);
      const title = sanitizeText(ms.title);
      page.drawText(title.length > 50 ? `${title.slice(0, 48)}...` : title, {
        x: margin + 8,
        y: currentY - 12,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(formatDate(ms.dueDate), {
        x: margin + 290,
        y: currentY - 12,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(formatMoney(ms.amount), {
        x: margin + 410,
        y: currentY - 12,
        size: 8,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawLine({
        start: { x: margin, y: currentY - 16 },
        end: { x: margin + contentWidth, y: currentY - 16 },
        thickness: 0.5,
        color: rgb(0.88, 0.88, 0.88),
      });
      currentY -= 20;
    }

    currentY -= 15;

    // --- Terms & Provisions ---
    checkPageBreak(120);
    page.drawText('5. TERMS & SPECIAL CONDITIONS', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 15;

    const termsText =
      sanitizeText(contract.terms) ||
      'Standard Frevia freelance terms apply. Both parties agree to deliver work and approve milestones in good faith in accordance with platform policies, escrow procedures, and dispute resolution mechanisms.';

    // Simple word wrapping for terms
    const words = termsText.split(/\s+/);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 85) {
        checkPageBreak(16);
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: 8,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
        currentY -= 13;
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) {
      checkPageBreak(16);
      page.drawText(line, {
        x: margin,
        y: currentY,
        size: 8,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });
      currentY -= 15;
    }

    // --- Execution and Signatures ---
    checkPageBreak(90);
    currentY -= 10;
    page.drawText('6. EXECUTION & ELECTRONIC SIGNATURES', {
      x: margin,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 16;

    const sigBoxWidth = (contentWidth - 15) / 2;
    page.drawRectangle({
      x: margin,
      y: currentY - 50,
      width: sigBoxWidth,
      height: 50,
      color: rgb(0.97, 0.99, 0.97),
      borderColor: rgb(0.7, 0.85, 0.7),
      borderWidth: 1,
    });
    page.drawText('[ELECTRONICALLY SIGNED]', {
      x: margin + 10,
      y: currentY - 18,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.2),
    });
    page.drawText(`Client: ${clientName}`, {
      x: margin + 10,
      y: currentY - 32,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(
      `Date: ${formatDate(contract.clientSignedAt ?? contract.signedAt ?? contract.createdAt)}`,
      {
        x: margin + 10,
        y: currentY - 44,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      },
    );

    page.drawRectangle({
      x: margin + sigBoxWidth + 15,
      y: currentY - 50,
      width: sigBoxWidth,
      height: 50,
      color: rgb(0.97, 0.99, 0.97),
      borderColor: rgb(0.7, 0.85, 0.7),
      borderWidth: 1,
    });
    page.drawText('[ELECTRONICALLY SIGNED]', {
      x: margin + sigBoxWidth + 25,
      y: currentY - 18,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.2),
    });
    page.drawText(`Freelancer: ${freelancerName}`, {
      x: margin + sigBoxWidth + 25,
      y: currentY - 32,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(
      `Date: ${formatDate(contract.freelancerSignedAt ?? contract.signedAt ?? contract.createdAt)}`,
      {
        x: margin + sigBoxWidth + 25,
        y: currentY - 44,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      },
    );

    currentY -= 65;

    // Footer note
    page.drawText(
      'Frevia Platform Verified Contract - Generated automatically upon full execution and fee settlement.',
      {
        x: margin,
        y: 25,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      },
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generates contract PDF and saves it into SharedFile for the contract.
   * If a PDF already exists for this contract, it updates it.
   */
  async generateAndSaveContractPdf(contractId: number) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          client: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
          freelancer: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
          job: { select: { title: true } },
          milestones: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              description: true,
              amount: true,
              dueDate: true,
            },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!contract) {
        this.logger.warn(
          `Contract #${contractId} not found for PDF generation.`,
        );
        return null;
      }

      const totalAmount = Number(contract.totalAmount);
      const platformFee = Number(contract.platformFee);
      const clientPlatformFee = Number(contract.clientPlatformFee);

      const pdfBuffer = await this.buildContractPdfBuffer({
        id: contract.id,
        slug: contract.slug,
        totalAmount,
        platformFee,
        clientPlatformFee,
        terms: contract.terms,
        signedAt: contract.signedAt,
        clientSignedAt: contract.clientSignedAt,
        freelancerSignedAt: contract.freelancerSignedAt,
        createdAt: contract.createdAt,
        client: contract.client,
        freelancer: contract.freelancer,
        job: contract.job,
        milestones: contract.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: m.dueDate,
        })),
      });

      const fileName = `Contract-${contract.id}-${contract.slug}.pdf`;
      let fileUrl: string;
      let publicId = `contract-${contract.id}-pdf`;

      if (this.cloudinaryService.isConfigured()) {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          pdfBuffer,
          fileName,
          `frevia/contracts/${contract.id}`,
        );
        fileUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;
      } else {
        const relativePath = join('contracts', String(contract.id), fileName);
        const absolutePath = join(process.cwd(), 'uploads', relativePath);
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, pdfBuffer);
        fileUrl = `local://${relativePath.replace(/\\/g, '/')}`;
      }

      // Check if a shared file for this contract PDF already exists
      const existing = await this.prisma.sharedFile.findFirst({
        where: {
          contractId: contract.id,
          fileName,
          deletedAt: null,
        },
      });

      if (existing) {
        return await this.prisma.sharedFile.update({
          where: { id: existing.id },
          data: {
            fileUrl,
            publicId,
          },
        });
      }

      return await this.prisma.sharedFile.create({
        data: {
          contractId: contract.id,
          uploaderId: contract.clientId,
          fileUrl,
          publicId,
          fileName,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate and save PDF for contract #${contractId}:`,
        error instanceof Error ? error.stack : error,
      );
      return null;
    }
  }
}
