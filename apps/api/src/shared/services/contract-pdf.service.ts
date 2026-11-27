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

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      allLines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          allLines.push(currentLine);
        }
        currentLine = word;
      }
    }
    if (currentLine) {
      allLines.push(currentLine);
    }
  }
  return allLines;
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
      checkPageBreak(16);
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + contentWidth, y: currentY },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });
      currentY -= 14;
    };

    const drawSectionHeader = (title: string) => {
      checkPageBreak(25);
      page.drawText(title, {
        x: margin,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.05, 0.05, 0.05),
      });
      currentY -= 14;
    };

    const drawParagraph = (
      text: string,
      options?: {
        isBold?: boolean;
        size?: number;
        color?: any;
        indent?: number;
        spacingAfter?: number;
      },
    ) => {
      const f = options?.isBold ? fontBold : font;
      const sz = options?.size ?? 7.5;
      const clr = options?.color ?? rgb(0.3, 0.3, 0.3);
      const indent = options?.indent ?? 0;
      const lineHeight = sz * 1.35;
      const spacingAfter = options?.spacingAfter ?? 6;
      const maxW = contentWidth - indent;

      const lines = wrapText(sanitizeText(text), f, sz, maxW);
      for (const line of lines) {
        if (!line.trim()) {
          currentY -= lineHeight * 0.5;
          continue;
        }
        checkPageBreak(lineHeight + 5);
        page.drawText(line, {
          x: margin + indent,
          y: currentY,
          size: sz,
          font: f,
          color: clr,
        });
        currentY -= lineHeight;
      }
      currentY -= spacingAfter;
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
      Math.round(totalAmount * 0.03 * 100) / 100;
    const feePercent =
      totalAmount > 0 ? Math.round((platformFee / totalAmount) * 100) : 3;

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

    // --- 1. PARTIES (No Location, clean names & emails) ---
    checkPageBreak(50);
    drawSectionHeader('1.   PARTIES');

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

    // Divider line between parties
    const freelancerColX = margin + partiesColWidth + 20;
    page.drawLine({
      start: { x: freelancerColX - 10, y: currentY + 2 },
      end: { x: freelancerColX - 10, y: currentY - 28 },
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

    currentY -= 38;
    drawDivider();

    // --- 2. SCOPE AND DELIVERABLES (Plain text wrapping, no table box) ---
    const jobTitle = sanitizeText(contract.job.title);
    const deliverablesSummary = sanitizeText(
      contract.terms ||
        'Fully functional deliverables, complete source code, design assets, and technical documentation.',
    );

    checkPageBreak(50);
    drawSectionHeader('2.   SCOPE AND DELIVERABLES');
    drawParagraph(
      `The Freelancer agrees to perform the professional services and provide all agreed deliverables for the project: "${jobTitle}".`,
      { size: 7.5, color: rgb(0.2, 0.2, 0.2) },
    );
    drawParagraph(`Deliverables & Scope of Work: ${deliverablesSummary}`, {
      size: 7.5,
      color: rgb(0.3, 0.3, 0.3),
    });
    drawParagraph(
      'All deliverables shall adhere to technical best practices, industry quality standards, and the specifications agreed upon in the accepted job proposal. Deliverables must be fully functional and documented for Client review and acceptance.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 3. PRICE AND PAYMENT SCHEDULE (Plain text wrapping, no table grid) ---
    const clientContractFee =
      Number(contract.clientPlatformFee) > 0
        ? Number(contract.clientPlatformFee)
        : platformFee > 0
          ? platformFee
          : Math.round(totalAmount * 0.03 * 100) / 100;
    const clientFeeRate =
      totalAmount > 0 && feePercent >= 0
        ? Math.round((clientContractFee / totalAmount) * 100)
        : 3;

    const milestonesToRender =
      contract.milestones.length > 0
        ? contract.milestones
        : [
            {
              id: 1,
              title:
                sanitizeText(contract.job.title) || 'Deliverables execution',
              description: 'Initial deliverables and development progress',
              amount: totalAmount,
              dueDate: contract.expiresAt || new Date(),
            },
          ];

    checkPageBreak(60);
    drawSectionHeader('3.   PRICE AND PAYMENT SCHEDULE');
    drawParagraph(
      `The total agreed contract value is ${formatMoney(totalAmount)} (USD). Payment is structured into milestone-based disbursements administered via Frevia Escrow protection. The Client funds milestones in advance via Stripe prior to commencement of work. The Client contract fee is ${clientFeeRate}% (${formatMoney(clientContractFee)}). The Freelancer is charged a 5% platform service fee upon release of each approved milestone payout.`,
      { size: 7.5, color: rgb(0.2, 0.2, 0.2) },
    );

    drawParagraph('Milestone Schedule:', {
      size: 7.5,
      isBold: true,
      color: rgb(0.1, 0.1, 0.1),
      spacingAfter: 3,
    });

    for (let i = 0; i < milestonesToRender.length; i++) {
      const m = milestonesToRender[i];
      const mTitle = sanitizeText(m.title) || `Milestone ${i + 1}`;
      const mDesc = m.description ? ` - ${sanitizeText(m.description)}` : '';
      const mText = `* Milestone ${i + 1}: ${mTitle}${mDesc}. Amount: ${formatMoney(m.amount)} USD. Target Due Date: ${formatDate(m.dueDate)}. (Protected by Frevia Escrow).`;

      drawParagraph(mText, {
        size: 7.5,
        color: rgb(0.25, 0.25, 0.25),
        indent: 10,
        spacingAfter: 4,
      });
    }

    drawParagraph(
      'Payment Protection & Escrow Release: All milestone funds remain securely held in Escrow and are disbursed to the Freelancer only after the Client formally inspects and approves the submitted work, or following a binding arbitration determination.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3), spacingAfter: 6 },
    );
    drawDivider();

    // --- 4. REVISIONS AND ACCEPTANCE CRITERIA ---
    checkPageBreak(45);
    drawSectionHeader('4.   REVISIONS AND ACCEPTANCE CRITERIA');
    drawParagraph(
      'The Client shall have a standard inspection period of up to 14 calendar days following milestone submission to review deliverables and request adjustments. The Client is entitled to up to 2 rounds of reasonable revisions within the original agreed scope. Any requested revisions exceeding the agreed scope or requiring fundamental architectural changes must be negotiated as an additional milestone or formal contract amendment.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 5. TIMELINE AND CLIENT DEPENDENCIES ---
    checkPageBreak(45);
    drawSectionHeader('5.   TIMELINE AND CLIENT DEPENDENCIES');
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
    drawParagraph(
      `${contractEndClause}The Freelancer agrees to complete the deliverables by ${formatDate(finalDue)}. The Client shall provide necessary materials, technical credentials, feedback, and approvals in a timely manner. Delays in Client-provided dependencies shall proportionally extend the delivery timeline.`,
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 6. INTELLECTUAL PROPERTY AND WORK PRODUCT OWNERSHIP ---
    checkPageBreak(50);
    drawSectionHeader('6.   INTELLECTUAL PROPERTY AND OWNERSHIP');
    drawParagraph(
      'Upon full payment and release of milestone funds, all intellectual property rights, copyrights, and ownership in custom deliverables created under this Agreement shall belong exclusively to the Client. The Freelancer retains all rights to pre-existing tools, libraries, codebases, and general expertise utilized during the engagement. Unless restricted by a separate written Non-Disclosure Agreement, the Freelancer retains the right to showcase the completed project in their professional portfolio.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 7. CONFIDENTIALITY AND DATA PROTECTION ---
    checkPageBreak(45);
    drawSectionHeader('7.   CONFIDENTIALITY AND NON-DISCLOSURE');
    drawParagraph(
      'Both parties agree to hold all proprietary data, business processes, source code, customer information, and project materials in strict confidence. Neither party shall disclose or utilize confidential information for any purpose outside the performance of this Agreement without prior written authorization, except as required by law.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 8. ESCROW ARBITRATION AND DISPUTE RESOLUTION ---
    checkPageBreak(50);
    drawSectionHeader('8.   ESCROW ARBITRATION AND DISPUTE RESOLUTION');
    drawParagraph(
      "If a dispute arises regarding milestone completion, deliverable quality, or fund release that cannot be resolved amicably, either party may formally initiate a Dispute through the Frevia Resolution Center. Both parties agree to participate in good faith, submit all relevant evidence, and abide by the final, binding determination issued by Frevia's arbitration staff.",
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 9. ANTI-CIRCUMVENTION AND DIRECT ENGAGEMENT POLICY ---
    checkPageBreak(45);
    drawSectionHeader('9.   ANTI-CIRCUMVENTION AND PLATFORM INTEGRITY');
    drawParagraph(
      'In accordance with Frevia platform rules and the User Agreement, both parties agree to conduct all communication, milestone submissions, and payment transactions exclusively through Frevia and Stripe. Any attempt to solicit or process off-platform payments constitutes a material breach resulting in immediate contract termination, forfeiture of escrow protections, and account suspension.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 10. TERMINATION AND CANCELLATION ---
    checkPageBreak(45);
    drawSectionHeader('10.   TERMINATION AND CANCELLATION');
    drawParagraph(
      'This Agreement may be terminated by mutual written agreement, or by either party upon notice in the event of a material breach by the other party. In the event of early termination, the Freelancer shall be compensated for all milestones completed and approved up to the date of termination. Any unallocated escrow funds for milestones not commenced shall be promptly refunded to the Client.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 11. GENERAL TERMS AND INDEPENDENT CONTRACTOR STATUS ---
    checkPageBreak(45);
    drawSectionHeader('11.   GENERAL TERMS AND INDEPENDENT CONTRACTOR');
    drawParagraph(
      'The Freelancer acts as an independent contractor and not as an employee, agent, or partner of the Client or Frevia. This Agreement constitutes the complete understanding between the parties and supersedes all prior negotiations. If any provision is deemed unenforceable, the remaining provisions shall remain in full force and effect.',
      { size: 7.5, color: rgb(0.3, 0.3, 0.3) },
    );
    drawDivider();

    // --- 12. SIGNATURES AND ELECTRONIC ACKNOWLEDGEMENT ---
    checkPageBreak(85);
    drawSectionHeader('12.   SIGNATURES AND ELECTRONIC ACKNOWLEDGEMENT');
    drawParagraph(
      'By applying electronic signatures below, both parties confirm that they have read, understood, and agreed to all terms, milestone obligations, and platform rules set forth in this Agreement.',
      { size: 7.5, color: rgb(0.35, 0.35, 0.35), spacingAfter: 20 },
    );

    checkPageBreak(55);
    const sigLineWidth = 160;

    // Client Signature Line
    page.drawLine({
      start: { x: margin + 20, y: currentY },
      end: { x: margin + 20 + sigLineWidth, y: currentY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Freelancer Signature Line
    page.drawLine({
      start: { x: freelancerColX + 10, y: currentY },
      end: { x: freelancerColX + 10 + sigLineWidth, y: currentY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentY -= 12;

    // Client signature text
    page.drawText(clientName, {
      x: margin + 20,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText('Client', {
      x: margin + 20,
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
        x: margin + 20,
        y: currentY - 21,
        size: 7,
        font,
        color: clientSignDate ? rgb(0.1, 0.5, 0.2) : rgb(0.5, 0.5, 0.5),
      },
    );

    // Freelancer signature text
    page.drawText(freelancerName, {
      x: freelancerColX + 10,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText('Freelancer', {
      x: freelancerColX + 10,
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
        x: freelancerColX + 10,
        y: currentY - 21,
        size: 7,
        font,
        color: freelancerSignDate ? rgb(0.1, 0.5, 0.2) : rgb(0.5, 0.5, 0.5),
      },
    );

    // Add page footers
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      p.drawLine({
        start: { x: margin, y: margin - 10 },
        end: { x: margin + contentWidth, y: margin - 10 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
      p.drawText(`Frevia Freelance Agreement ${contractCode}`, {
        x: margin,
        y: margin - 20,
        size: 7,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });
      const pageNumberStr = `Page ${i + 1} of ${pages.length}`;
      const pageNumWidth = font.widthOfTextAtSize(pageNumberStr, 7);
      p.drawText(pageNumberStr, {
        x: margin + contentWidth - pageNumWidth,
        y: margin - 20,
        size: 7,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });
    }

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
