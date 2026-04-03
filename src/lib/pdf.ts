import { jsPDF } from "jspdf";

interface PdfDownloadOptions {
  title: string;
  content: string;
  fileName: string;
}

type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

type HeadingBlock = {
  type: "heading";
  text: string;
};

type ListBlock = {
  type: "list";
  items: Array<{
    kind: "ordered" | "unordered";
    marker: string;
    text: string;
    indent: number;
  }>;
};

type DividerBlock = {
  type: "divider";
};

type ContentBlock = ParagraphBlock | HeadingBlock | ListBlock | DividerBlock;

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "document";

const normalizeContent = (content: string) =>
  content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\t/g, "    "));

const isDividerLine = (line: string) => /^[-_=]{5,}$/.test(line.trim());

const parseContentBlocks = (content: string): ContentBlock[] => {
  const lines = normalizeContent(content);
  const blocks: ContentBlock[] = [];

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (isDividerLine(line)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const headingMatch = rawLine.match(/^\s*(#{1,6})\s+(.+)$/);
    const domainHeadingMatch = rawLine.match(/^\s*\d+\.\s*Domain:\s+(.+)$/i);
    const labelHeadingMatch = rawLine.match(/^\s*(Domain|Section|Control|Category):\s+(.+)$/i);

    if (headingMatch) {
      blocks.push({ type: "heading", text: headingMatch[2].trim() });
      index += 1;
      continue;
    }

    if (domainHeadingMatch) {
      blocks.push({
        type: "heading",
        text: `Domain: ${domainHeadingMatch[1].trim()}`,
      });
      index += 1;
      continue;
    }

    if (labelHeadingMatch) {
      blocks.push({
        type: "heading",
        text: `${labelHeadingMatch[1]}: ${labelHeadingMatch[2].trim()}`,
      });
      index += 1;
      continue;
    }

    const listItems: ListBlock["items"] = [];
    let listCursor = index;

    while (listCursor < lines.length) {
      const listRaw = lines[listCursor];
      const listTrimmed = listRaw.trim();
      if (!listTrimmed) {
        break;
      }

      const leadingSpaces = (listRaw.match(/^\s*/) ?? [""])[0].length;
      const unorderedMatch = listTrimmed.match(/^[-*•]\s+(.+)$/);
      if (unorderedMatch) {
        listItems.push({
          kind: "unordered",
          marker: "-",
          text: unorderedMatch[1].trim(),
          indent: Math.floor(leadingSpaces / 2),
        });
        listCursor += 1;
        continue;
      }

      const orderedMatch = listTrimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (orderedMatch) {
        listItems.push({
          kind: "ordered",
          marker: `${orderedMatch[1]}.`,
          text: orderedMatch[2].trim(),
          indent: Math.floor(leadingSpaces / 2),
        });
        listCursor += 1;
        continue;
      }

      break;
    }

    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      index = listCursor;
      continue;
    }

    const paragraphLines: string[] = [];
    let paragraphCursor = index;
    while (paragraphCursor < lines.length) {
      const paragraphLine = lines[paragraphCursor];
      const paragraphTrimmed = paragraphLine.trim();
      if (!paragraphTrimmed) {
        break;
      }

      if (isDividerLine(paragraphTrimmed)) {
        break;
      }

      if (
        /^\s*(#{1,6})\s+/.test(paragraphLine) ||
        /^\s*\d+\.\s*Domain:\s+/i.test(paragraphLine) ||
        /^\s*(Domain|Section|Control|Category):\s+/i.test(paragraphLine) ||
        /^\s*[-*•]\s+/.test(paragraphLine) ||
        /^\s*\d+[.)]\s+/.test(paragraphLine)
      ) {
        break;
      }

      paragraphLines.push(paragraphTrimmed);
      paragraphCursor += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join(" "),
      });
      index = paragraphCursor;
      continue;
    }

    index += 1;
  }

  return blocks;
};

export const downloadTextAsPdf = ({
  title,
  content,
  fileName,
}: PdfDownloadOptions) => {
  if (!content.trim()) {
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 46;
  const footerHeight = 28;
  const lineHeight = 16;
  const contentWidth = pageWidth - margin * 2;
  const blocks = parseContentBlocks(content);
  const maxY = pageHeight - margin - footerHeight;

  const drawPageHeader = () => {
    doc.setDrawColor(220, 226, 232);
    doc.line(margin, margin, pageWidth - margin, margin);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120, 133, 150);

    const dateStr = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    doc.text("PolicyGuard", margin, margin - 10, { align: "left" });
    doc.text(title, pageWidth / 2, margin - 10, { align: "center" });
    doc.text(dateStr, pageWidth - margin, margin - 10, { align: "right" });
  };

  const drawPageFooter = () => {
    const pageNumber = doc.getNumberOfPages();
    doc.setDrawColor(220, 226, 232);
    doc.line(
      margin,
      pageHeight - footerHeight - 6,
      pageWidth - margin,
      pageHeight - footerHeight - 6
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120, 133, 150);

    doc.text("Confidential", margin, pageHeight - footerHeight + 10, {
      align: "left",
    });
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - footerHeight + 10, {
      align: "center",
    });
    doc.text(
      "Generated by PolicyGuard",
      pageWidth - margin,
      pageHeight - footerHeight + 10,
      { align: "right" }
    );
  };

  const ensureSpace = (requiredHeight: number, resetY: () => void, currentY: number) => {
    if (currentY + requiredHeight > maxY) {
      drawPageFooter();
      doc.addPage();
      resetY();
      return true;
    }

    return false;
  };

  // ============================================================
  //   PREMIUM COVER PAGE — Full Bleed Design
  // ============================================================
  const cX = pageWidth / 2;

  // — Layer 1: Dark Hero band (top 48%)
  doc.setFillColor(11, 17, 36);
  doc.rect(0, 0, pageWidth, pageHeight * 0.48, "F");

  // — Layer 2: Deep-blue mid strip beneath hero
  doc.setFillColor(18, 40, 90);
  doc.rect(0, pageHeight * 0.48, pageWidth, pageHeight * 0.04, "F");

  // — Layer 3: Light content zone (lower 48%)
  doc.setFillColor(248, 250, 255);
  doc.rect(0, pageHeight * 0.52, pageWidth, pageHeight * 0.48, "F");

  // — Decorative: large faint circle (top-right corner)
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.4);
  doc.circle(pageWidth - 40, -20, 130, "S");
  doc.setLineWidth(0.2);
  doc.circle(pageWidth - 40, -20, 170, "S");

  // — Decorative: small faint circle (bottom-left corner)
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.4);
  doc.circle(40, pageHeight + 20, 100, "S");

  // — Decorative: vertical accent bar (left edge, hero zone)
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 5, pageHeight * 0.48, "F");

  // — Decorative: horizontal electric-blue rule below hero
  doc.setFillColor(59, 130, 246);
  doc.rect(0, pageHeight * 0.48, pageWidth, 3, "F");

  // — Decorative: small square dots top-left (brand mark)
  const dotY = 22;
  doc.setFillColor(59, 130, 246);
  doc.rect(20, dotY, 6, 6, "F");
  doc.setFillColor(99, 162, 255);
  doc.rect(30, dotY, 6, 6, "F");
  doc.setFillColor(147, 197, 253);
  doc.rect(40, dotY, 6, 6, "F");

  // — Brand name (top-right of hero)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("POLICYGUARD AI", pageWidth - margin, 32, { align: "right" });

  // — Eyebrow label (top of hero body)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text("NIST COMPLIANCE  •  AI-POWERED ANALYSIS", 30, pageHeight * 0.25);

  // — Thin rule below eyebrow
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(30, pageHeight * 0.27, pageWidth - 30, pageHeight * 0.27);
  doc.setLineWidth(1);

  // — Main Title (large, white, hero zone)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(255, 255, 255);
  const coverTitleY = pageHeight * 0.31;
  const wrappedCoverTitle = doc.splitTextToSize(title.toUpperCase(), pageWidth - 60);
  doc.text(wrappedCoverTitle, 30, coverTitleY);

  // — Subtitle (below title, muted blue-white)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(147, 197, 253);
  doc.text("Based on NIST Security Framework", 30, coverTitleY + wrappedCoverTitle.length * 44 + 4);

  // ——— Mid-strip badge ———
  const badgeY = pageHeight * 0.48 - 1;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(cX - 90, badgeY - 14, 180, 22, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("STRATEGIC COMPLIANCE REPORT", cX, badgeY + 2, { align: "center" });

  // ——— Light zone content ———
  const lz = pageHeight * 0.55; // light zone top baseline

  // Generated By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("GENERATED BY", margin, lz);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(11, 17, 36);
  doc.text("PolicyGuard AI", margin, lz + 18);

  // Vertical divider between metadata columns
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(cX, lz - 6, cX, lz + 56);

  // Report Date
  const coverDateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("REPORT DATE", cX + 20, lz);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(11, 17, 36);
  doc.text(coverDateStr, cX + 20, lz + 18);

  // Horizontal rule below metadata
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(margin, lz + 40, pageWidth - margin, lz + 40);
  doc.setLineWidth(1);

  // Classification chips
  const chipY = lz + 64;
  const chipData = [
    { label: "CONFIDENTIAL", bg: [239, 68, 68] as [number, number, number], fg: [255, 255, 255] as [number, number, number] },
    { label: "AI GENERATED", bg: [37, 99, 235] as [number, number, number], fg: [255, 255, 255] as [number, number, number] },
    { label: "NIST FRAMEWORK", bg: [16, 185, 129] as [number, number, number], fg: [255, 255, 255] as [number, number, number] },
  ];
  let chipX = margin;
  chipData.forEach(({ label, bg, fg }) => {
    const chipW = doc.getTextWidth(label) + 16;
    doc.setFillColor(...bg);
    doc.roundedRect(chipX, chipY - 11, chipW, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...fg);
    doc.text(label, chipX + 8, chipY + 1);
    chipX += chipW + 8;
  });

  // — Bottom dark footer strip
  doc.setFillColor(11, 17, 36);
  doc.rect(0, pageHeight - 36, pageWidth, 36, "F");

  // Thin electric blue rule above footer
  doc.setFillColor(59, 130, 246);
  doc.rect(0, pageHeight - 37, pageWidth, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Confidential  •  For Internal Use Only  •  PolicyGuard AI", cX, pageHeight - 20, { align: "center" });

  // Add new page for actual content
  doc.addPage();
  drawPageHeader();

  let cursorY = margin + 20;

  const resetYAfterPageBreak = () => {
    drawPageHeader();
    cursorY = margin + 20;
  };

  blocks.forEach((block) => {
    if (block.type === "divider") {
      ensureSpace(18, resetYAfterPageBreak, cursorY);
      doc.setDrawColor(220, 226, 232);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 18;
      return;
    }

    if (block.type === "heading") {
      const headingLines = doc.splitTextToSize(block.text, contentWidth);
      const headingHeight = headingLines.length * 18 + 8;
      const pageChanged = ensureSpace(headingHeight, resetYAfterPageBreak, cursorY);

      if (pageChanged) {
        doc.setDrawColor(220, 226, 232);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(35, 55, 79);
      doc.text(headingLines, margin, cursorY);
      cursorY += headingLines.length * 18 + 8;
      return;
    }

    if (block.type === "paragraph") {
      const paragraphLines = doc.splitTextToSize(block.text, contentWidth);
      const paragraphHeight = paragraphLines.length * lineHeight + 10;
      ensureSpace(paragraphHeight, resetYAfterPageBreak, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(48, 61, 78);
      doc.text(paragraphLines, margin, cursorY);
      cursorY += paragraphLines.length * lineHeight + 10;
      return;
    }

    if (block.type === "list") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(48, 61, 78);

      block.items.forEach((item) => {
        const indentOffset = Math.min(item.indent, 6) * 10;
        const markerX = margin + indentOffset;
        const textX = markerX + 14;
        const availableWidth = contentWidth - indentOffset - 14;
        const itemLines = doc.splitTextToSize(item.text, availableWidth);
        const itemHeight = itemLines.length * lineHeight + 6;
        const pageChanged = ensureSpace(itemHeight, resetYAfterPageBreak, cursorY);

        if (pageChanged) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(48, 61, 78);
        }

        doc.setFont("helvetica", item.kind === "ordered" ? "bold" : "normal");
        doc.text(item.marker, markerX, cursorY);

        doc.setFont("helvetica", "normal");
        doc.text(itemLines, textX, cursorY);
        cursorY += itemLines.length * lineHeight + 6;
      });

      cursorY += 4;
    }
  });

  drawPageFooter();

  doc.save(`${sanitizeFileName(fileName)}.pdf`);
};
