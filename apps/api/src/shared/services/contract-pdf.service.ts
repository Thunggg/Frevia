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
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
   * Generates a formal PDF agreement document buffer matching the Frevia agreement sheet layout.
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
    expiresAt?: Date | null;
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
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    const checkPageBreak = (neededHeight: number) => {
      if (currentY - neededHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
    };

    const drawDivider = () => {
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + contentWidth, y: currentY },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });
      currentY -= 14;
    };

    // --- Format Header Codes ---
    const contractYear = contract.createdAt
      ? new Date(contract.createdAt).getFullYear()
      : 2025;
    const contractCode =
      contract.slug?.startsWith('CTR-') || contract.slug?.startsWith('CON-')
        ? `#${contract.slug}`
        : `#CON-${contractYear}-${String(contract.id).padStart(4, '0')}`;

    const clientName = sanitizeText(
      contract.client.profile?.displayName ||
        contract.client.email.split('@')[0] ||
        'Client',
    );
    const freelancerName = sanitizeText(
      contract.freelancer.profile?.displayName ||
        contract.freelancer.email.split('@')[0] ||
        'Freelancer',
    );

    const totalAmount = Number(contract.totalAmount) || 0;
    const platformFee =
      Number(contract.platformFee) ||
      Number(contract.clientPlatformFee) ||
      totalAmount * 0.1;
    const feePercent =
      totalAmount > 0 ? Math.round((platformFee / totalAmount) * 100) : 10;

    // --- 1. Top Header (Logo & Contract Agreement code) ---
    page.drawText('frevia', {
      x: margin,
      y: currentY - 12,
      size: 24,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    const headerRightText = 'CONTRACT AGREEMENT';
    const headerRightWidth = fontBold.widthOfTextAtSize(headerRightText, 9);
    page.drawText(headerRightText, {
      x: margin + contentWidth - headerRightWidth,
      y: currentY,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    const codeWidth = font.widthOfTextAtSize(contractCode, 9);
    page.drawText(contractCode, {
      x: margin + contentWidth - codeWidth,
      y: currentY - 14,
      size: 9,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });

    currentY -= 26;

    // Horizontal top black line
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin + contentWidth, y: currentY },
      thickness: 1.2,
      color: rgb(0.05, 0.05, 0.05),
    });

    currentY -= 30;

    // --- 2. Title & Metadata Summary ---
    page.drawText('Freelance', {
      x: margin,
      y: currentY,
      size: 22,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText('Contract Agreement', {
      x: margin,
      y: currentY - 24,
      size: 22,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    const introText =
      'This Freelance Contract Agreement ("Agreement") is made and entered into between the parties below on this day, and governs the terms of the freelance work.';
    page.drawText(introText, {
      x: margin,
      y: currentY - 44,
      size: 7.5,
      font,
      color: rgb(0.35, 0.35, 0.35),
      maxWidth: 340,
      lineHeight: 10,
    });

    // Vertical line before meta
    const metaColX = margin + 370;
    page.drawLine({
      start: { x: metaColX - 15, y: currentY + 4 },
      end: { x: metaColX - 15, y: currentY - 62 },
      thickness: 0.6,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Created At
    page.drawText('Created At', {
      x: metaColX,
      y: currentY,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(formatDate(contract.createdAt), {
      x: metaColX,
      y: currentY - 11,
      size: 8,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Contract End Date
    page.drawText('Contract End Date', {
      x: metaColX,
      y: currentY - 23,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(formatDate(contract.expiresAt), {
      x: metaColX,
      y: currentY - 34,
      size: 8,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Version
    page.drawText('Version', {
      x: metaColX,
      y: currentY - 46,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('v1.0', {
      x: metaColX,
      y: currentY - 57,
      size: 8,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= 76;

    // --- 1. PARTIES ---
    page.drawText('1.   PARTIES', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 14;

    const partiesColWidth = (contentWidth - 20) / 2;

    // Client Column
    page.drawText('Client', {
      x: margin,
      y: currentY,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    page.drawText(clientName, {
      x: margin,
      y: currentY - 12,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText(`Email: ${contract.client.email}`, {
      x: margin,
      y: currentY - 24,
      size: 7.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('Location: Ho Chi Minh City, Vietnam', {
      x: margin,
      y: currentY - 35,
      size: 7.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Divider line between parties
    const freelancerColX = margin + partiesColWidth + 20;
    page.drawLine({
      start: { x: freelancerColX - 10, y: currentY + 2 },
      end: { x: freelancerColX - 10, y: currentY - 38 },
      thickness: 0.6,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Freelancer Column
    page.drawText('Freelancer', {
      x: freelancerColX,
      y: currentY,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    page.drawText(freelancerName, {
      x: freelancerColX,
      y: currentY - 12,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText(`Email: ${contract.freelancer.email}`, {
      x: freelancerColX,
      y: currentY - 24,
      size: 7.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('Location: Hanoi, Vietnam', {
      x: freelancerColX,
      y: currentY - 35,
      size: 7.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    currentY -= 50;
    drawDivider();

    // --- 2. SCOPE AND DELIVERABLES ---
    page.drawText('2.   SCOPE AND DELIVERABLES', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      'The Freelancer agrees to provide the services described in the job proposal:',
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 14;

    const boxHeight = 22;
    page.drawRectangle({
      x: margin,
      y: currentY - boxHeight,
      width: contentWidth,
      height: boxHeight,
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.6,
      color: rgb(1, 1, 1),
    });

    const boxMidX = margin + contentWidth / 2;
    page.drawLine({
      start: { x: boxMidX, y: currentY },
      end: { x: boxMidX, y: currentY - boxHeight },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });

    const jobTitle = sanitizeText(contract.job.title);
    page.drawText(
      `Job Title: ${jobTitle.length > 38 ? `${jobTitle.slice(0, 36)}...` : jobTitle}`,
      {
        x: margin + 6,
        y: currentY - 14,
        size: 7.5,
        font,
        color: rgb(0.15, 0.15, 0.15),
      },
    );

    const deliverablesSummary = sanitizeText(
      contract.terms ||
        'Fully functional deliverables, source code and documentation.',
    );
    page.drawText(
      `Deliverables: ${deliverablesSummary.length > 38 ? `${deliverablesSummary.slice(0, 36)}...` : deliverablesSummary}`,
      {
        x: boxMidX + 6,
        y: currentY - 14,
        size: 7.5,
        font,
        color: rgb(0.15, 0.15, 0.15),
      },
    );

    currentY -= boxHeight + 10;
    drawDivider();

    // --- 3. PRICE AND PAYMENT SCHEDULE ---
    page.drawText('3.   PRICE AND PAYMENT SCHEDULE', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      `The total contract value is ${formatMoney(totalAmount)} (USD), including a platform fee of ${feePercent}% (${formatMoney(platformFee)}). Payment will be released per milestone via Stripe.`,
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 14;

    // Table Header
    const rowHeight = 18;
    page.drawRectangle({
      x: margin,
      y: currentY - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.6,
      color: rgb(0.97, 0.97, 0.97),
    });

    const col1X = margin + 45;
    const col2X = margin + 330;
    const col3X = margin + 420;

    page.drawLine({
      start: { x: col1X, y: currentY },
      end: { x: col1X, y: currentY - rowHeight },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });
    page.drawLine({
      start: { x: col2X, y: currentY },
      end: { x: col2X, y: currentY - rowHeight },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });
    page.drawLine({
      start: { x: col3X, y: currentY },
      end: { x: col3X, y: currentY - rowHeight },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });

    page.drawText('Milestone', {
      x: margin + 6,
      y: currentY - 12,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('Description', {
      x: col1X + 6,
      y: currentY - 12,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('Amount (USD)', {
      x: col2X + 6,
      y: currentY - 12,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('Due Date', {
      x: col3X + 6,
      y: currentY - 12,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= rowHeight;

    const milestonesToRender =
      contract.milestones.length > 0
        ? contract.milestones
        : [
            {
              id: 1,
              title:
                sanitizeText(contract.job.title) || 'Deliverables execution',
              amount: totalAmount,
              dueDate: contract.expiresAt || new Date(),
            },
          ];

    for (let i = 0; i < milestonesToRender.length; i++) {
      checkPageBreak(rowHeight + 10);
      const m = milestonesToRender[i];

      page.drawRectangle({
        x: margin,
        y: currentY - rowHeight,
        width: contentWidth,
        height: rowHeight,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.6,
        color: rgb(1, 1, 1),
      });

      page.drawLine({
        start: { x: col1X, y: currentY },
        end: { x: col1X, y: currentY - rowHeight },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });
      page.drawLine({
        start: { x: col2X, y: currentY },
        end: { x: col2X, y: currentY - rowHeight },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });
      page.drawLine({
        start: { x: col3X, y: currentY },
        end: { x: col3X, y: currentY - rowHeight },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });

      page.drawText(String(i + 1), {
        x: margin + 18,
        y: currentY - 12,
        size: 7.5,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      const title = sanitizeText(m.title);
      page.drawText(title.length > 48 ? `${title.slice(0, 46)}...` : title, {
        x: col1X + 6,
        y: currentY - 12,
        size: 7.5,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(formatMoney(m.amount), {
        x: col2X + 6,
        y: currentY - 12,
        size: 7.5,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(formatDate(m.dueDate), {
        x: col3X + 6,
        y: currentY - 12,
        size: 7.5,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      currentY -= rowHeight;
    }

    currentY -= 8;
    drawDivider();

    // --- 4. REVISIONS AND EXTRA WORK ---
    checkPageBreak(40);
    page.drawText('4.   REVISIONS AND EXTRA WORK', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      'The Client is entitled to up to 2 free revisions. Any additional work beyond the original scope will be discussed and billed separately.',
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 14;
    drawDivider();

    // --- 5. TIMELINE AND CLIENT DEPENDENCIES ---
    checkPageBreak(40);
    page.drawText('5.   TIMELINE AND CLIENT DEPENDENCIES', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    const latestMilestoneDue = milestonesToRender
      .map((m) => (m.dueDate ? new Date(m.dueDate).getTime() : 0))
      .reduce((max, t) => (t > max ? t : max), 0);
    const finalDue =
      latestMilestoneDue > 0
        ? new Date(latestMilestoneDue)
        : contract.expiresAt;
    const contractEndClause = contract.expiresAt
      ? `This Agreement has a contract end date of ${formatDate(contract.expiresAt)}. `
      : '';
    page.drawText(
      `${contractEndClause}The Freelancer agrees to complete the deliverables by ${formatDate(finalDue)}. The Client shall provide necessary materials and feedback in a timely manner.`,
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
        maxWidth: contentWidth,
        lineHeight: 10,
      },
    );
    currentY -= 24;
    drawDivider();

    // --- 6. OWNERSHIP ---
    checkPageBreak(40);
    page.drawText('6.   OWNERSHIP', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      'Upon full payment, the intellectual property rights of the deliverables shall belong to the Client, except for pre-existing materials and tools used by the Freelancer.',
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 14;
    drawDivider();

    // --- 7. DISPUTE RESOLUTION ---
    checkPageBreak(40);
    page.drawText('7.   DISPUTE RESOLUTION', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      "In case of any dispute, both parties agree to follow Frevia's dispute resolution process. If unresolved, the matter may be brought to the competent court under applicable law.",
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 14;
    drawDivider();

    // --- 8. SIGNATURES ---
    checkPageBreak(80);
    page.drawText('8.   SIGNATURES', {
      x: margin,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    currentY -= 12;

    page.drawText(
      'By signing this Agreement, both parties agree to the terms and conditions stated above.',
      {
        x: margin,
        y: currentY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
    currentY -= 25;

    const sigLineWidth = 160;

    // Client Signature Line
    page.drawLine({
      start: { x: margin + 30, y: currentY },
      end: { x: margin + 30 + sigLineWidth, y: currentY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Freelancer Signature Line
    page.drawLine({
      start: { x: freelancerColX + 15, y: currentY },
      end: { x: freelancerColX + 15 + sigLineWidth, y: currentY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentY -= 12;

    // Client signature text
    page.drawText(clientName, {
      x: margin + 30,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText('Client', {
      x: margin + 30,
      y: currentY - 11,
      size: 7.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const clientSignDate = contract.clientSignedAt || contract.signedAt;
    page.drawText(
      contract.clientSignedAt || contract.signedAt
        ? formatDate(clientSignDate)
        : '(Pending Signature)',
      {
        x: margin + 30,
        y: currentY - 21,
        size: 7,
        font,
        color: clientSignDate ? rgb(0.1, 0.5, 0.2) : rgb(0.5, 0.5, 0.5),
      },
    );

    // Freelancer signature text
    page.drawText(freelancerName, {
      x: freelancerColX + 15,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText('Freelancer', {
      x: freelancerColX + 15,
      y: currentY - 11,
      size: 7.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const freelancerSignDate = contract.freelancerSignedAt || contract.signedAt;
    page.drawText(
      contract.freelancerSignedAt || contract.signedAt
        ? formatDate(freelancerSignDate)
        : '(Pending Signature)',
      {
        x: freelancerColX + 15,
        y: currentY - 21,
        size: 7,
        font,
        color: freelancerSignDate ? rgb(0.1, 0.5, 0.2) : rgb(0.5, 0.5, 0.5),
      },
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Builds contract PDF buffer directly for streaming or storage.
   */
  async getContractPdfBuffer(
    contractId: number,
  ): Promise<{ buffer: Buffer; fileName: string } | null> {
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
      this.logger.warn(`Contract #${contractId} not found for PDF generation.`);
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
      expiresAt: contract.expiresAt,
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
    return { buffer: pdfBuffer, fileName };
  }

  /**
   * Generates contract PDF and saves it into SharedFile for the contract.
   * If a PDF already exists for this contract, it updates it.
   */
  async generateAndSaveContractPdf(contractId: number) {
    try {
      const generated = await this.getContractPdfBuffer(contractId);
      if (!generated) return null;

      const { buffer: pdfBuffer, fileName } = generated;
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        select: { id: true, clientId: true },
      });
      if (!contract) return null;
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
