import { jsPDF } from "jspdf";

interface PdfDownloadOptions {
  title: string;
  content: string;
  fileName: string;
}

type ParagraphBlock = { type: "paragraph"; text: string };
type HeadingBlock   = { type: "heading";   level: number; text: string };
type ListBlock      = {
  type: "list";
  items: Array<{ kind: "ordered" | "unordered"; marker: string; text: string; indent: number }>;
};
type DividerBlock = { type: "divider" };
type ContentBlock = ParagraphBlock | HeadingBlock | ListBlock | DividerBlock;

// ─── helpers ────────────────────────────────────────────────────────────────

const sanitizeFileName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "document";

const normalizeContent = (content: string) =>
  content.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\t/g, "    "));

const isDividerLine = (line: string) => /^[-_=]{5,}$/.test(line.trim());

// ─── block parser ───────────────────────────────────────────────────────────

const parseContentBlocks = (content: string): ContentBlock[] => {
  const lines = normalizeContent(content);
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw  = lines[i];
    const line = raw.trim();

    if (!line) { i++; continue; }

    if (isDividerLine(line)) { blocks.push({ type: "divider" }); i++; continue; }

    // Markdown headings  →  level 1-6
    const hMatch = raw.match(/^\s*(#{1,6})\s+(.+)$/);
    if (hMatch) {
      blocks.push({ type: "heading", level: hMatch[1].length, text: hMatch[2].trim() });
      i++; continue;
    }

    // "Domain: …"  /  "1. Domain: …"  etc → level-2 heading
    const domMatch = raw.match(/^\s*(?:\d+\.\s*)?Domain:\s+(.+)$/i);
    if (domMatch) {
      blocks.push({ type: "heading", level: 2, text: `Domain: ${domMatch[1].trim()}` });
      i++; continue;
    }

    // "Section: …" / "Control: …" / "Category: …" → level-3 heading
    const labelMatch = raw.match(/^\s*(Section|Control|Category):\s+(.+)$/i);
    if (labelMatch) {
      blocks.push({ type: "heading", level: 3, text: `${labelMatch[1]}: ${labelMatch[2].trim()}` });
      i++; continue;
    }

    // list items
    const listItems: ListBlock["items"] = [];
    let lc = i;
    while (lc < lines.length) {
      const lr = lines[lc];
      const lt = lr.trim();
      if (!lt) break;
      const spaces = (lr.match(/^\s*/) ?? [""])[0].length;
      const uMatch = lt.match(/^[-*•]\s+(.+)$/);
      if (uMatch) { listItems.push({ kind: "unordered", marker: "•", text: uMatch[1].trim(), indent: Math.floor(spaces / 2) }); lc++; continue; }
      const oMatch = lt.match(/^(\d+)[.)]\s+(.+)$/);
      if (oMatch) { listItems.push({ kind: "ordered", marker: `${oMatch[1]}.`, text: oMatch[2].trim(), indent: Math.floor(spaces / 2) }); lc++; continue; }
      break;
    }
    if (listItems.length) { blocks.push({ type: "list", items: listItems }); i = lc; continue; }

    // paragraph
    const pLines: string[] = [];
    let pc = i;
    while (pc < lines.length) {
      const pl = lines[pc];
      const pt = pl.trim();
      if (!pt || isDividerLine(pt)) break;
      if (/^\s*(#{1,6})\s+/.test(pl) || /^\s*(?:\d+\.\s*)?Domain:\s+/i.test(pl) ||
          /^\s*(Section|Control|Category):\s+/i.test(pl) ||
          /^\s*[-*•]\s+/.test(pl) || /^\s*\d+[.)]\s+/.test(pl)) break;
      pLines.push(pt); pc++;
    }
    if (pLines.length) { blocks.push({ type: "paragraph", text: pLines.join(" ") }); i = pc; continue; }

    i++;
  }

  return blocks;
};

// ─── main export ─────────────────────────────────────────────────────────────

export const downloadTextAsPdf = ({ title, content, fileName }: PdfDownloadOptions) => {
  if (!content.trim()) return;

  const doc         = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth   = doc.internal.pageSize.getWidth();
  const pageHeight  = doc.internal.pageSize.getHeight();
  const margin      = 52;
  const contentW    = pageWidth - margin * 2;
  const footerH     = 32;
  const lh          = 17;
  const maxY        = pageHeight - margin - footerH;
  const blocks      = parseContentBlocks(content);

  // ── colour palette ────────────────────────────────────────────
  const C = {
    navy:      [11,  17,  36]  as [number,number,number],
    blue:      [37,  99,  235] as [number,number,number],
    blueSoft:  [59,  130, 246] as [number,number,number],
    blueLight: [147, 197, 253] as [number,number,number],
    teal:      [13,  148, 136] as [number,number,number],
    slate700:  [51,  65,  85]  as [number,number,number],
    slate500:  [100, 116, 139] as [number,number,number],
    slate400:  [148, 163, 184] as [number,number,number],
    slate200:  [226, 232, 240] as [number,number,number],
    iceBlue:   [241, 245, 252] as [number,number,number],
    white:     [255, 255, 255] as [number,number,number],
    red:       [220, 38,  38]  as [number,number,number],
    green:     [16,  185, 129] as [number,number,number],
  };

  const fill  = (c: [number,number,number]) => doc.setFillColor(...c);
  const draw  = (c: [number,number,number]) => doc.setDrawColor(...c);
  const color = (c: [number,number,number]) => doc.setTextColor(...c);
  const font  = (w: "normal"|"bold"|"italic") => doc.setFont("helvetica", w);

  // ── header / footer (content pages) ──────────────────────────

  const drawHeader = () => {
    // left accent stripe
    fill(C.blue); doc.rect(0, 0, 4, 40, "F");
    // bg tint
    fill(C.iceBlue); doc.rect(4, 0, pageWidth - 4, 40, "F");
    // brand
    font("bold"); doc.setFontSize(9.5); color(C.blue);
    doc.text("PolicyGuard", margin, 16);
    // centre report title
    font("normal"); doc.setFontSize(9); color(C.slate500);
    doc.text(title, pageWidth / 2, 16, { align: "center" });
    // date
    const ds = new Intl.DateTimeFormat("en-US",{ day:"2-digit",month:"short",year:"numeric" }).format(new Date());
    font("normal"); doc.setFontSize(9); color(C.slate400);
    doc.text(ds, pageWidth - margin, 16, { align: "right" });
    // separator
    draw(C.slate200); doc.setLineWidth(0.5); doc.line(0, 40, pageWidth, 40);
  };

  const drawFooter = () => {
    const p = doc.getNumberOfPages();
    draw(C.slate200); doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - footerH - 4, pageWidth - margin, pageHeight - footerH - 4);
    font("normal"); doc.setFontSize(8.5); color(C.slate400);
    doc.text("Confidential", margin, pageHeight - footerH + 12, { align: "left" });
    doc.text(`Page ${p}`, pageWidth / 2, pageHeight - footerH + 12, { align: "center" });
    doc.text("Generated by PolicyGuard", pageWidth - margin, pageHeight - footerH + 12, { align: "right" });
  };

  const resetY = () => { drawHeader(); cursorY = 56; };

  const ensureSpace = (h: number) => {
    if (cursorY + h > maxY) { drawFooter(); doc.addPage(); resetY(); return true; }
    return false;
  };

  // ════════════════════════════════════════════════════════════════
  //  COVER PAGE
  // ════════════════════════════════════════════════════════════════
  const cX = pageWidth / 2;

  // ── full-page bg ──────────────────────────────────────────────
  fill(C.navy); doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── top-right large ghost circle ─────────────────────────────
  draw(C.blueSoft); doc.setLineWidth(0.3);
  doc.circle(pageWidth + 20, -30, 210, "S");
  doc.setLineWidth(0.15);
  doc.circle(pageWidth + 20, -30, 270, "S");

  // ── bottom-left ghost circle ──────────────────────────────────
  doc.setLineWidth(0.3);
  doc.circle(-30, pageHeight + 20, 160, "S");

  // ── left accent bar (full height) ────────────────────────────
  fill(C.blue); doc.rect(0, 0, 6, pageHeight, "F");

  // ── diagonal accent parallelogram top-right ───────────────────
  // drawn as 4 filled rects staggered to simulate a slash
  for (let k = 0; k < 6; k++) {
    const alpha = 0.06 - k * 0.009;
    doc.setFillColor(59, 130, 246);
    doc.setGState(doc.GState({ opacity: alpha }));
    doc.rect(pageWidth - 160 + k * 28, 0, 22, pageHeight * 0.5, "F");
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── brand dots (top-left) ─────────────────────────────────────
  const dp = 26;
  [[59,130,246],[99,162,255],[147,197,253]].forEach(([r,g,b], k) => {
    fill([r,g,b] as [number,number,number]);
    doc.rect(18 + k * 12, dp, 8, 8, "F");
  });

  // ── brand name top-right ──────────────────────────────────────
  font("bold"); doc.setFontSize(11); color(C.slate400);
  doc.text("POLICYGUARD", pageWidth - margin, 36, { align: "right" });

  // ── eyebrow tag ───────────────────────────────────────────────
  const eyeY = pageHeight * 0.28;
  font("bold"); doc.setFontSize(9); color(C.blueSoft);
  doc.text("NIST  COMPLIANCE   ·   SECURITY   ·   ANALYSIS", margin + 10, eyeY);

  // thin rule
  draw(C.blue); doc.setLineWidth(0.8);
  doc.line(margin + 10, eyeY + 8, pageWidth - margin, eyeY + 8);
  doc.setLineWidth(1);

  // ── main title ────────────────────────────────────────────────
  font("bold"); doc.setFontSize(44); color(C.white);
  const titleY = eyeY + 32;
  const wrTitle = doc.splitTextToSize(title.toUpperCase(), pageWidth - margin * 2 - 20);
  doc.text(wrTitle, margin + 10, titleY);

  // ── subtitle ─────────────────────────────────────────────────
  font("normal"); doc.setFontSize(15); color(C.blueLight);
  doc.text("Based on NIST Security Framework", margin + 10, titleY + wrTitle.length * 50 + 2);

  // ── divider card area ─────────────────────────────────────────
  const cardTop = pageHeight * 0.60;
  // card bg
  fill([255,255,255]); doc.setGState(doc.GState({ opacity: 0.05 }));
  doc.roundedRect(margin, cardTop, contentW, pageHeight * 0.27, 6, 6, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // card border
  draw(C.blue); doc.setLineWidth(0.6);
  doc.roundedRect(margin, cardTop, contentW, pageHeight * 0.27, 6, 6, "S");
  doc.setLineWidth(1);

  // blue left inset on card
  fill(C.blue); doc.rect(margin, cardTop, 4, pageHeight * 0.27, "F");

  const colW  = contentW / 2;
  const cLx   = margin + 20;
  const cRx   = margin + colW + 20;
  const row1  = cardTop + 30;
  const row2  = cardTop + 52;

  // label/value helper
  const meta = (lx: number, label: string, value: string) => {
    font("bold"); doc.setFontSize(8); color(C.blueSoft);
    doc.text(label, lx, row1);
    font("bold"); doc.setFontSize(14); color(C.white);
    doc.text(value, lx, row2);
  };

  // Generated By
  meta(cLx, "GENERATED BY", "PolicyGuard AI");

  // vertical divider inside card
  draw([255,255,255]); doc.setGState(doc.GState({ opacity: 0.15 }));
  doc.setLineWidth(0.6);
  doc.line(margin + colW, cardTop + 14, margin + colW, cardTop + pageHeight * 0.27 - 14);
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setLineWidth(1);

  // Report Date
  const ds2 = new Intl.DateTimeFormat("en-US",{ month:"long",day:"numeric",year:"numeric" }).format(new Date());
  meta(cRx, "REPORT DATE", ds2);

  // ── chips ─────────────────────────────────────────────────────
  const chipsY = cardTop + pageHeight * 0.27 - 26;
  const chips: [string,[number,number,number]][] = [
    ["CONFIDENTIAL",   C.red],
    ["NIST FRAMEWORK", C.teal],
    ["INTERNAL USE",   C.slate500],
  ];
  let chX = cLx;
  chips.forEach(([label, bg]) => {
    font("bold"); doc.setFontSize(7.5);
    const w = doc.getTextWidth(label) + 14;
    fill(bg); doc.roundedRect(chX, chipsY - 9, w, 14, 3, 3, "F");
    color(C.white); doc.text(label, chX + 7, chipsY + 2);
    chX += w + 7;
  });

  // ── bottom footer strip ───────────────────────────────────────
  fill(C.blue); doc.rect(0, pageHeight - 26, pageWidth, 26, "F");
  font("normal"); doc.setFontSize(8.5); color(C.white);
  doc.text(
    "Confidential  ·  For Internal Use Only  ·  PolicyGuard AI",
    cX, pageHeight - 10, { align: "center" }
  );

  // ════════════════════════════════════════════════════════════════
  //  CONTENT PAGES
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader();
  let cursorY = 56;

  blocks.forEach((block) => {

    // ── divider ────────────────────────────────────────────────
    if (block.type === "divider") {
      ensureSpace(20);
      draw(C.slate200); doc.setLineWidth(0.6);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      doc.setLineWidth(1);
      cursorY += 20;
      return;
    }

    // ── headings ───────────────────────────────────────────────
    if (block.type === "heading") {
      const lvl = block.level ?? 2;

      if (lvl === 1) {
        // H1 — full-width navy bar
        const wrapped = doc.splitTextToSize(block.text.toUpperCase(), contentW - 24);
        const barH = wrapped.length * 20 + 16;
        ensureSpace(barH + 12);
        fill(C.navy); doc.rect(margin, cursorY, contentW, barH, "F");
        fill(C.blue); doc.rect(margin, cursorY, 5, barH, "F");
        font("bold"); doc.setFontSize(13); color(C.white);
        doc.text(wrapped, margin + 14, cursorY + 14);
        cursorY += barH + 12;

      } else if (lvl === 2) {
        // H2 — iceBlue band with blue left bar
        const wrapped = doc.splitTextToSize(block.text, contentW - 20);
        const barH = wrapped.length * 18 + 14;
        ensureSpace(barH + 10);
        fill(C.iceBlue); doc.rect(margin, cursorY, contentW, barH, "F");
        fill(C.blue);    doc.rect(margin, cursorY, 4, barH, "F");
        font("bold"); doc.setFontSize(12); color(C.slate700);
        doc.text(wrapped, margin + 12, cursorY + 12);
        cursorY += barH + 10;

      } else {
        // H3+ — inline with coloured underline
        const wrapped = doc.splitTextToSize(block.text, contentW);
        const blockH = wrapped.length * 16 + 10;
        ensureSpace(blockH);
        font("bold"); doc.setFontSize(11); color(C.blue);
        doc.text(wrapped, margin, cursorY + 12);
        draw(C.blueLight); doc.setLineWidth(0.5);
        doc.line(margin, cursorY + 16, margin + Math.min(doc.getTextWidth(wrapped[0]), contentW), cursorY + 16);
        doc.setLineWidth(1);
        cursorY += blockH;
      }
      return;
    }

    // ── paragraph ─────────────────────────────────────────────
    if (block.type === "paragraph") {
      const wrapped = doc.splitTextToSize(block.text, contentW);
      const blockH  = wrapped.length * lh + 10;
      ensureSpace(blockH);
      font("normal"); doc.setFontSize(10.5); color(C.slate700);
      doc.text(wrapped, margin, cursorY);
      cursorY += blockH;
      return;
    }

    // ── list ──────────────────────────────────────────────────
    if (block.type === "list") {
      block.items.forEach((item) => {
        const iOff  = Math.min(item.indent, 5) * 12;
        const mX    = margin + iOff;
        const tX    = mX + 16;
        const avail = contentW - iOff - 16;
        const wrapped = doc.splitTextToSize(item.text, avail);
        const itemH   = wrapped.length * lh + 5;
        ensureSpace(itemH);

        if (item.kind === "unordered") {
          // bullet dot
          fill(C.blue);
          doc.circle(mX + 3, cursorY - 3.5, 2.5, "F");
          font("normal"); doc.setFontSize(10.5); color(C.slate700);
        } else {
          // numbered marker
          font("bold"); doc.setFontSize(10); color(C.blue);
          doc.text(item.marker, mX, cursorY);
          font("normal"); doc.setFontSize(10.5); color(C.slate700);
        }

        doc.text(wrapped, tX, cursorY);
        cursorY += itemH;
      });
      cursorY += 4;
    }
  });

  drawFooter();
  doc.save(`${sanitizeFileName(fileName)}.pdf`);
};
