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

  // --- Colored Centered Cover Page Design ---
  const centerX = pageWidth / 2;

  // 1. Structural Accent Bars
  // Top Header Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(37, 99, 235); // vibrant blue-600
  doc.rect(0, 28, pageWidth, 6, "F");

  // Bottom Footer Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, pageHeight - 28, pageWidth, 28, "F");
  doc.setFillColor(37, 99, 235); // vibrant blue-600
  doc.rect(0, pageHeight - 34, pageWidth, 6, "F");

  // 2. Subtle Title Background Block
  doc.setFillColor(244, 248, 255); // pale icy blue
  doc.rect(0, pageHeight * 0.35, pageWidth, pageHeight * 0.22, "F");

  // Top Section (Organization)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235); // vibrant blue
  doc.text("STRATEGIC COMPLIANCE ANALYSIS", centerX, pageHeight * 0.18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("P O L I C Y G U A R D   A I", centerX, pageHeight * 0.21, { align: "center" });

  // Center Section (Main Title inside the pale blue block)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(15, 23, 42); // dark slate
  const coverTitleY = pageHeight * 0.44;
  const wrappedCoverTitle = doc.splitTextToSize(title.toUpperCase(), contentWidth - 40);
  doc.text(wrappedCoverTitle, centerX, coverTitleY, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(100, 116, 139); // slate-500
  const subtitleY = coverTitleY + wrappedCoverTitle.length * 42;
  doc.text("Based on NIST Framework", centerX, subtitleY, { align: "center" });

  // Middle-Lower Section (Date)
  const coverDateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  // Date Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text("REPORT DATE", centerX, pageHeight * 0.74, { align: "center" });

  // Date Actual
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(coverDateStr, centerX, pageHeight * 0.77, { align: "center" });

  // Bottom Section (Confidential Note overlapping bottom dark bar)
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240); // slate-200 (light text on dark bg)
  doc.text("Confidential Report  •  Generated Automatically", centerX, pageHeight - 16, { align: "center" });

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
