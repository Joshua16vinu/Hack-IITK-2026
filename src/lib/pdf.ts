import { jsPDF } from "jspdf";
import type { PdfDownloadOptions } from "@/types";

type ParagraphBlock = { type: "paragraph"; text: string };
type HeadingBlock   = { type: "heading";   level: number; text: string };
type ListBlock      = {
  type: "list";
  items: Array<{ kind: "ordered" | "unordered"; marker: string; text: string; indent: number }>;
};
type DividerBlock   = { type: "divider" };
type ContentBlock   = ParagraphBlock | HeadingBlock | ListBlock | DividerBlock;

// ─── helpers ─────────────────────────────────────────────────────────────────

const sanitizeFileName = (v: string) =>
  v.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "document";

const toPdfSafeText = (v: string) =>
  v
    .normalize("NFKD")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/·/g, " - ")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "");

const normalizeContent = (s: string) =>
  s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\t/g, "    "));

const isDivider = (l: string) => /^[-_=]{5,}$/.test(l.trim());

// ─── block parser ─────────────────────────────────────────────────────────────

const parseBlocks = (content: string): ContentBlock[] => {
  const lines  = normalizeContent(toPdfSafeText(content));
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw  = lines[i];
    const line = raw.trim();
    if (!line)              { i++; continue; }
    if (isDivider(line))    { blocks.push({ type: "divider" }); i++; continue; }

    // Markdown headings (# → level 1-6)
    const hm = raw.match(/^\s*(#{1,6})\s+(.+)$/);
    if (hm) { blocks.push({ type: "heading", level: hm[1].length, text: hm[2].trim() }); i++; continue; }

    // "Domain: …" / "1. Domain: …" → level 2
    const dm = raw.match(/^\s*(?:\d+\.\s*)?Domain:\s+(.+)$/i);
    if (dm) { blocks.push({ type: "heading", level: 2, text: `Domain: ${dm[1].trim()}` }); i++; continue; }

    // "Section/Control/Category: …" → level 3
    const lm = raw.match(/^\s*(Section|Control|Category):\s+(.+)$/i);
    if (lm) { blocks.push({ type: "heading", level: 3, text: `${lm[1]}: ${lm[2].trim()}` }); i++; continue; }

    // list items
    const items: ListBlock["items"] = [];
    let lc = i;
    while (lc < lines.length) {
      const lr = lines[lc]; const lt = lr.trim();
      if (!lt) break;
      const sp = (lr.match(/^\s*/) ?? [""])[0].length;
      const um = lt.match(/^[-*•]\s+(.+)$/);
      if (um) { items.push({ kind: "unordered", marker: "•", text: um[1].trim(), indent: Math.floor(sp / 2) }); lc++; continue; }
      const om = lt.match(/^(\d+)[.)]\s+(.+)$/);
      if (om) { items.push({ kind: "ordered",   marker: `${om[1]}.`, text: om[2].trim(), indent: Math.floor(sp / 2) }); lc++; continue; }
      break;
    }
    if (items.length) { blocks.push({ type: "list", items }); i = lc; continue; }

    // paragraph (collect until blank / heading / list)
    const pls: string[] = [];
    let pc = i;
    while (pc < lines.length) {
      const pl = lines[pc]; const pt = pl.trim();
      if (!pt || isDivider(pt)) break;
      if (/^\s*(#{1,6})\s+/.test(pl) || /^\s*(?:\d+\.\s*)?Domain:\s+/i.test(pl) ||
          /^\s*(Section|Control|Category):\s+/i.test(pl) ||
          /^\s*[-*•]\s+/.test(pl) || /^\s*\d+[.)]\s+/.test(pl)) break;
      pls.push(pt); pc++;
    }
    if (pls.length) { blocks.push({ type: "paragraph", text: pls.join(" ") }); i = pc; continue; }
    i++;
  }
  return blocks;
};

// ─── main export ──────────────────────────────────────────────────────────────

export const downloadTextAsPdf = ({ title, content, fileName }: PdfDownloadOptions) => {
  if (!content.trim()) return;

  const doc         = new jsPDF({ unit: "pt", format: "a4" });
  const PW          = doc.internal.pageSize.getWidth();
  const PH          = doc.internal.pageSize.getHeight();
  const ML          = 56;           // margin left
  const MR          = 56;           // margin right
  const CW          = PW - ML - MR; // content width
  const FOOTER_H    = 36;
  const HEADER_H    = 44;
  const LH          = 17;           // line height for body
  const MAX_Y       = PH - FOOTER_H - 16;
  const blocks      = parseBlocks(content);

  // ─── colour palette ───────────────────────────────────────────
  /* Consulting-grade: navy / gold accent / slate greys */
  type RGB = [number, number, number];
  const navy:    RGB = [10,  22,  50];
  const gold:    RGB = [180, 140, 60];
  const blueLight: RGB = [200, 216, 248];
  const slate800: RGB = [30,  41,  59];
  const slate600: RGB = [71,  85,  105];
  const slate400: RGB = [148, 163, 184];
  const slate200: RGB = [226, 232, 240];
  const offWhite: RGB = [248, 249, 252];
  const white:    RGB = [255, 255, 255];

  const setFill  = (c: RGB) => doc.setFillColor(...c);
  const setDraw  = (c: RGB) => doc.setDrawColor(...c);
  const setColor = (c: RGB) => doc.setTextColor(...c);
  const setFont  = (w: "normal"|"bold"|"italic") => doc.setFont("helvetica", w);

  // ─── header / footer (content pages) ─────────────────────────

  let cursorY = HEADER_H + 8;

  const drawHeader = () => {
    // thin navy top bar
    setFill(navy); doc.rect(0, 0, PW, 6, "F");
    // off-white header bg
    setFill(offWhite); doc.rect(0, 6, PW, HEADER_H - 6, "F");
    // gold left accent
    setFill(gold); doc.rect(0, 6, 4, HEADER_H - 6, "F");
    // separator line
    setDraw(slate200); doc.setLineWidth(0.5);
    doc.line(0, HEADER_H, PW, HEADER_H);

    const ds = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    setFont("bold"); doc.setFontSize(9); setColor(navy);
    doc.text("PolicyGuard", ML, 30);
    setFont("normal"); doc.setFontSize(8.5); setColor(slate400);
    doc.text(ds, PW - MR, 30, { align: "right" });
  };

  const drawFooter = () => {
    const p = doc.getNumberOfPages();
    setDraw(slate200); doc.setLineWidth(0.5);
    doc.line(ML, PH - FOOTER_H, PW - MR, PH - FOOTER_H);
    setFont("normal"); doc.setFontSize(8.5); setColor(slate400);
    doc.text(`Page  ${p}`, PW / 2, PH - FOOTER_H + 16, { align: "center" });
    // navy bottom bar
    setFill(navy); doc.rect(0, PH - 8, PW, 8, "F");
  };

  const resetPage = () => {
    drawHeader();
    cursorY = HEADER_H + 18;
  };

  const ensureSpace = (h: number) => {
    if (cursorY + h > MAX_Y) { drawFooter(); doc.addPage(); resetPage(); return true; }
    return false;
  };

  // ════════════════════════════════════════════════════════════════════════
  //  COVER PAGE — Premium Consulting Style
  // ════════════════════════════════════════════════════════════════════════
  // ── full navy background ────────────────────────────────────────────────
  setFill(navy); doc.rect(0, 0, PW, PH, "F");

  // ── top gold stripe ─────────────────────────────────────────────────────
  setFill(gold); doc.rect(0, 0, PW, 8, "F");

  // ── bottom gold stripe ──────────────────────────────────────────────────
  setFill(gold); doc.rect(0, PH - 8, PW, 8, "F");

  // ── left vertical gold bar ──────────────────────────────────────────────
  setFill(gold); doc.rect(0, 0, 6, PH, "F");

  // ── decorative concentric arcs top-right ────────────────────────────────
  setDraw([255, 255, 255]); doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.setLineWidth(0.6);
  doc.circle(PW + 10, 0, 180, "S");
  doc.setLineWidth(0.4);
  doc.circle(PW + 10, 0, 240, "S");
  doc.circle(PW + 10, 0, 300, "S");
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setLineWidth(1);

  // ── decorative arc bottom-left ───────────────────────────────────────────
  setDraw([255, 255, 255]); doc.setGState(doc.GState({ opacity: 0.05 }));
  doc.setLineWidth(0.5);
  doc.circle(-10, PH + 10, 160, "S");
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── thin horizontal gold rule near top ─────────────────────────────────
  setDraw(gold); doc.setLineWidth(0.6);
  doc.line(ML, 60, PW - MR, 60);

  // ── PolicyGuard brand name (top-left) ──────────────────────────────────
  setFont("bold"); doc.setFontSize(10.5); setColor(slate400);
  doc.text("P O L I C Y G U A R D", ML, 48);

  // ── date top-right ──────────────────────────────────────────────────────
  const coverDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
  setFont("normal"); doc.setFontSize(9); setColor(slate400);
  doc.text(coverDate, PW - MR, 48, { align: "right" });

  // ── category label ──────────────────────────────────────────────────────
  const catY = PH * 0.30;
  setFont("bold"); doc.setFontSize(9); setColor(gold);
  doc.text("NIST  CYBERSECURITY  FRAMEWORK  -  COMPLIANCE  REPORT", ML, catY);

  // thin gold rule below category
  setDraw(gold); doc.setLineWidth(0.7);
  doc.line(ML, catY + 10, PW - MR, catY + 10);
  doc.setLineWidth(1);

  // ── MAIN TITLE ──────────────────────────────────────────────────────────
  const titleY = catY + 55;
  setFont("bold"); doc.setFontSize(42); setColor(white);
  const wrTitle = doc.splitTextToSize(toPdfSafeText(title.toUpperCase()), PW - ML - MR);
  doc.text(wrTitle, ML, titleY);

  // ── subtitle ────────────────────────────────────────────────────────────
  const subY = titleY + wrTitle.length * 40;
  setFont("normal"); doc.setFontSize(15); setColor(blueLight);
  doc.text("Based on NIST Cybersecurity Framework", ML, subY);

  // ── metadata card ────────────────────────────────────────────────────────
  const cardY = PH * 0.65;
  const cardH = 60;

  // card bg — very subtle white overlay
  setFill(white); doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.roundedRect(ML, cardY, CW, cardH, 4, 4, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // card top gold border line
  setDraw(gold); doc.setLineWidth(1);
  doc.line(ML, cardY, ML + CW, cardY);
  doc.setLineWidth(1);

  // col positions
  const col1X = ML + 24;
  const col2X = ML + CW / 2 + 10;
  const lbY   = cardY + 24;
  const valY  = cardY + 40;

  // Generated By
  setFont("bold"); doc.setFontSize(8); setColor(gold);
  doc.text("GENERATED  BY", col1X, lbY);
  setFont("bold"); doc.setFontSize(15); setColor(white);
  doc.text("PolicyGuard", col1X, valY);

  // vertical divider inside card
  setDraw(slate600); doc.setLineWidth(0.5);
  doc.line(ML + CW / 2, cardY + 14, ML + CW / 2, cardY + cardH - 14);

  // Report Date
  setFont("bold"); doc.setFontSize(8); setColor(gold);
  doc.text("REPORT  DATE", col2X, lbY);
  setFont("bold"); doc.setFontSize(15); setColor(white);
  doc.text(coverDate, col2X, valY);

  // ── chips row ────────────────────────────────────────────────────────────
  const chipY = cardY + cardH + 22;
  type Chip = { label: string; bg: RGB; fg: RGB };
  const chips: Chip[] = [
    { label: "CONFIDENTIAL",   bg: [160, 30, 30],   fg: white },
    { label: "NIST FRAMEWORK", bg: [20, 100, 80],   fg: white },
    // { label: "INTERNAL USE",   bg: [50, 70, 100],   fg: white },
  ];
  let cx = ML;
  chips.forEach(({ label, bg, fg }) => {
    setFont("bold"); doc.setFontSize(7.5);
    const w = doc.getTextWidth(label) + 16;
    setFill(bg); doc.roundedRect(cx, chipY - 9, w, 15, 3, 3, "F");
    setColor(fg); doc.text(label, cx + 8, chipY + 3);
    cx += w + 8;
  });

  // ── bottom footer bar ────────────────────────────────────────────────────
  const footerBarY = PH - 50;
  setDraw(slate600); doc.setLineWidth(0.5);
  doc.line(ML, footerBarY, PW - MR, footerBarY);
  setFont("normal"); doc.setFontSize(9); setColor(slate400);
  doc.text("Confidential Report", ML, footerBarY + 18);
  doc.text("For Internal Use Only", PW - MR, footerBarY + 18, { align: "right" });

  // ════════════════════════════════════════════════════════════════════════
  //  CONTENT PAGES
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  resetPage();

  blocks.forEach((block) => {

    // ── divider ────────────────────────────────────────────────────────────
    if (block.type === "divider") {
      ensureSpace(24);
      setDraw(slate200); doc.setLineWidth(0.5);
      doc.line(ML, cursorY, PW - MR, cursorY);
      doc.setLineWidth(1);
      cursorY += 24;
      return;
    }

    // ── headings ───────────────────────────────────────────────────────────
    if (block.type === "heading") {
      const lvl = block.level ?? 2;

      if (lvl === 1) {
        // ── H1: full-width navy block, gold left bar, white text ──────────
        const wrapped = doc.splitTextToSize(block.text.toUpperCase(), CW - 28);
        const bH = wrapped.length * 20 + 20;
        ensureSpace(bH + 20);
        // navy fill
        setFill(navy); doc.rect(ML, cursorY, CW, bH, "F");
        // gold left accent
        setFill(gold); doc.rect(ML, cursorY, 5, bH, "F");
        setFont("bold"); doc.setFontSize(12.5); setColor(white);
        doc.text(wrapped, ML + 16, cursorY + 14);
        cursorY += bH + 20;

      } else if (lvl === 2) {
        // ── H2: off-white bg, navy left bar, gold underline ───────────────
        const wrapped = doc.splitTextToSize(block.text, CW - 20);
        const bH = wrapped.length * 19 + 16;
        ensureSpace(bH + 16);
        setFill(offWhite); doc.rect(ML, cursorY, CW, bH, "F");
        setFill(navy);     doc.rect(ML, cursorY, 4, bH, "F");
        // gold underline
        setDraw(gold); doc.setLineWidth(0.6);
        doc.line(ML + 4, cursorY + bH, ML + CW, cursorY + bH);
        doc.setLineWidth(1);
        setFont("bold"); doc.setFontSize(12); setColor(navy);
        doc.text(wrapped, ML + 14, cursorY + 13);
        cursorY += bH + 16;

      } else if (lvl === 3) {
        // ── H3: bold navy text, short gold underline ──────────────────────
        const wrapped = doc.splitTextToSize(block.text, CW);
        const bH = wrapped.length * 17 + 14;
        ensureSpace(bH);
        setFont("bold"); doc.setFontSize(11); setColor(navy);
        doc.text(wrapped, ML, cursorY + 12);
        setDraw(gold); doc.setLineWidth(0.8);
        const ruleW = Math.min(doc.getTextWidth(wrapped[0]), CW * 0.5);
        doc.line(ML, cursorY + 16, ML + ruleW, cursorY + 16);
        doc.setLineWidth(1);
        cursorY += bH;

      } else {
        // ── H4+: italic slate label ───────────────────────────────────────
        const wrapped = doc.splitTextToSize(block.text, CW);
        const bH = wrapped.length * 15 + 10;
        ensureSpace(bH);
        setFont("bold"); doc.setFontSize(10.5); setColor(slate600);
        doc.text(wrapped, ML, cursorY + 11);
        cursorY += bH;
      }
      return;
    }

    // ── paragraph ─────────────────────────────────────────────────────────
    if (block.type === "paragraph") {
      const wrapped = doc.splitTextToSize(block.text, CW);
      const bH = wrapped.length * LH + 10;
      ensureSpace(bH);
      setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
      doc.text(wrapped, ML, cursorY);
      cursorY += bH;
      return;
    }

    // ── list ──────────────────────────────────────────────────────────────
    if (block.type === "list") {
      block.items.forEach((item) => {
        const indW  = Math.min(item.indent, 4) * 14;
        const mX    = ML + indW;
        const tX    = mX + 18;
        const avail = CW - indW - 18;
        const wrapped = doc.splitTextToSize(item.text, avail);
        const bH = wrapped.length * LH + 6;
        ensureSpace(bH);

        if (item.kind === "unordered") {
          // ── slate filled square bullet (NOT blue) ─────────────────────
          setFill(slate600);
          doc.rect(mX + 1, cursorY - 5.5, 4, 4, "F");
          setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
        } else {
          // ── slate numbered marker (NOT blue) ─────────────────────────
          setFont("bold"); doc.setFontSize(10.5); setColor(slate600);
          doc.text(item.marker, mX, cursorY);
          setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
        }

        doc.text(wrapped, tX, cursorY);
        cursorY += bH;
      });
      cursorY += 6;
    }
  });

  drawFooter();
  doc.save(`${sanitizeFileName(fileName)}.pdf`);
};

// ─── consolidated (multi-section) report ─────────────────────────────────────

export interface ConsolidatedPdfOptions {
  gapContent: string;
  revisedPolicyContent: string;
  roadmapContent: string;
  fileName?: string;
}

export const downloadConsolidatedPdf = ({
  gapContent,
  revisedPolicyContent,
  roadmapContent,
  fileName = "comprehensive-compliance-report",
}: ConsolidatedPdfOptions) => {
  const doc         = new jsPDF({ unit: "pt", format: "a4" });
  const PW          = doc.internal.pageSize.getWidth();
  const PH          = doc.internal.pageSize.getHeight();
  const ML          = 56;
  const MR          = 56;
  const CW          = PW - ML - MR;
  const FOOTER_H    = 36;
  const HEADER_H    = 44;
  const LH          = 17;
  const MAX_Y       = PH - FOOTER_H - 16;

  type RGB = [number, number, number];
  const navy:      RGB = [10,  22,  50];
  const gold:      RGB = [180, 140, 60];
  const blueLight: RGB = [200, 216, 248];
  const slate800:  RGB = [30,  41,  59];
  const slate600:  RGB = [71,  85,  105];
  const slate400:  RGB = [148, 163, 184];
  const slate200:  RGB = [226, 232, 240];
  const offWhite:  RGB = [248, 249, 252];
  const white:     RGB = [255, 255, 255];

  const setFill  = (c: RGB) => doc.setFillColor(...c);
  const setDraw  = (c: RGB) => doc.setDrawColor(...c);
  const setColor = (c: RGB) => doc.setTextColor(...c);
  const setFont  = (w: "normal"|"bold"|"italic") => doc.setFont("helvetica", w);

  let cursorY = HEADER_H + 8;

  const drawHeader = () => {
    setFill(navy); doc.rect(0, 0, PW, 6, "F");
    setFill(offWhite); doc.rect(0, 6, PW, HEADER_H - 6, "F");
    setFill(gold); doc.rect(0, 6, 4, HEADER_H - 6, "F");
    setDraw(slate200); doc.setLineWidth(0.5);
    doc.line(0, HEADER_H, PW, HEADER_H);
    const ds = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    setFont("bold"); doc.setFontSize(9); setColor(navy);
    doc.text("PolicyGuard", ML, 30);
    setFont("normal"); doc.setFontSize(8.5); setColor(slate400);
    doc.text(ds, PW - MR, 30, { align: "right" });
  };

  const drawFooter = () => {
    const p = doc.getNumberOfPages();
    setDraw(slate200); doc.setLineWidth(0.5);
    doc.line(ML, PH - FOOTER_H, PW - MR, PH - FOOTER_H);
    setFont("normal"); doc.setFontSize(8.5); setColor(slate400);
    doc.text(`Page  ${p}`, PW / 2, PH - FOOTER_H + 16, { align: "center" });
    setFill(navy); doc.rect(0, PH - 8, PW, 8, "F");
  };

  const resetPage = () => {
    drawHeader();
    cursorY = HEADER_H + 18;
  };

  const ensureSpace = (h: number) => {
    if (cursorY + h > MAX_Y) { drawFooter(); doc.addPage(); resetPage(); return true; }
    return false;
  };

  // ── Cover Page ───────────────────────────────────────────────────────────
  setFill(navy); doc.rect(0, 0, PW, PH, "F");
  setFill(gold); doc.rect(0, 0, PW, 8, "F");
  setFill(gold); doc.rect(0, PH - 8, PW, 8, "F");
  setFill(gold); doc.rect(0, 0, 6, PH, "F");

  setDraw([255, 255, 255]); doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.setLineWidth(0.6); doc.circle(PW + 10, 0, 180, "S");
  doc.setLineWidth(0.4); doc.circle(PW + 10, 0, 240, "S");
  doc.circle(PW + 10, 0, 300, "S");
  doc.setGState(doc.GState({ opacity: 1 })); doc.setLineWidth(1);

  setDraw(gold); doc.setLineWidth(0.6);
  doc.line(ML, 60, PW - MR, 60);

  setFont("bold"); doc.setFontSize(10.5); setColor(slate400);
  doc.text("P O L I C Y G U A R D", ML, 48);

  const coverDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
  setFont("normal"); doc.setFontSize(9); setColor(slate400);
  doc.text(coverDate, PW - MR, 48, { align: "right" });

  const catY = PH * 0.30;
  setFont("bold"); doc.setFontSize(9); setColor(gold);
  doc.text("NIST  CYBERSECURITY  FRAMEWORK  -  COMPLIANCE  REPORT", ML, catY);
  setDraw(gold); doc.setLineWidth(0.7);
  doc.line(ML, catY + 10, PW - MR, catY + 10); doc.setLineWidth(1);

  const titleY = catY + 55;
  setFont("bold"); doc.setFontSize(34); setColor(white);
  const wrTitle = doc.splitTextToSize("COMPREHENSIVE\nCOMPLIANCE REPORT", PW - ML - MR);
  doc.text(wrTitle, ML, titleY);

  const subY = titleY + wrTitle.length * 32 + 6;
  setFont("normal"); doc.setFontSize(13); setColor(blueLight);
  doc.text("Gap Analysis  -  Revised Policy  -  Implementation Roadmap", ML, subY);

  const cardY = PH * 0.66;
  const cardH = 60;
  setFill(white); doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.roundedRect(ML, cardY, CW, cardH, 4, 4, "F");
  doc.setGState(doc.GState({ opacity: 1 }));
  setDraw(gold); doc.setLineWidth(1);
  doc.line(ML, cardY, ML + CW, cardY);
  const col1X = ML + 24; const col2X = ML + CW / 2 + 10;
  const lbY = cardY + 24; const valY = cardY + 40;
  setFont("bold"); doc.setFontSize(8); setColor(gold);
  doc.text("GENERATED  BY", col1X, lbY);
  setFont("bold"); doc.setFontSize(15); setColor(white);
  doc.text("PolicyGuard", col1X, valY);
  setDraw(slate600); doc.setLineWidth(0.5);
  doc.line(ML + CW / 2, cardY + 14, ML + CW / 2, cardY + cardH - 14);
  setFont("bold"); doc.setFontSize(8); setColor(gold);
  doc.text("REPORT  DATE", col2X, lbY);
  setFont("bold"); doc.setFontSize(15); setColor(white);
  doc.text(coverDate, col2X, valY);

  const chipY = cardY + cardH + 22;
  type Chip = { label: string; bg: RGB; fg: RGB };
  const chips: Chip[] = [
    { label: "CONFIDENTIAL",   bg: [160, 30, 30], fg: white },
    { label: "NIST FRAMEWORK", bg: [20, 100, 80], fg: white },
  ];
  let cx = ML;
  chips.forEach(({ label, bg, fg }) => {
    setFont("bold"); doc.setFontSize(7.5);
    const w = doc.getTextWidth(label) + 16;
    setFill(bg); doc.roundedRect(cx, chipY - 9, w, 15, 3, 3, "F");
    setColor(fg); doc.text(label, cx + 8, chipY + 3);
    cx += w + 8;
  });

  const footerBarY = PH - 50;
  setDraw(slate600); doc.setLineWidth(0.5);
  doc.line(ML, footerBarY, PW - MR, footerBarY);
  setFont("normal"); doc.setFontSize(9); setColor(slate400);
  doc.text("Confidential Report", ML, footerBarY + 18);
  doc.text("For Internal Use Only", PW - MR, footerBarY + 18, { align: "right" });

  // ── helper: draw a full-width section banner on a new page ───────────────
  const drawSectionBanner = (label: string, subtitle: string) => {
    if (doc.getNumberOfPages() > 1) {
      drawFooter();
    }
    doc.addPage();
    // full navy bg for banner area
    setFill(navy); doc.rect(0, 0, PW, 120, "F");
    setFill(gold); doc.rect(0, 0, PW, 6, "F");
    setFill(gold); doc.rect(0, 0, 6, 120, "F");
    setFont("bold"); doc.setFontSize(9); setColor(gold);
    doc.text("POLICYGUARD  -  COMPLIANCE  REPORT", ML + 10, 36);
    setFont("bold"); doc.setFontSize(26); setColor(white);
    doc.text(toPdfSafeText(label.toUpperCase()), ML + 10, 72);
    setFont("normal"); doc.setFontSize(12); setColor(blueLight);
    doc.text(toPdfSafeText(subtitle), ML + 10, 96);
    setDraw(gold); doc.setLineWidth(0.8);
    doc.line(ML + 10, 108, PW - MR, 108);
    cursorY = 140;
  };

  // ── helper: render a section's parsed blocks ─────────────────────────────
  const renderBlocks = (content: string) => {
    const blocks = parseBlocks(content);

    blocks.forEach((block) => {
      if (block.type === "divider") {
        ensureSpace(24);
        setDraw(slate200); doc.setLineWidth(0.5);
        doc.line(ML, cursorY, PW - MR, cursorY);
        doc.setLineWidth(1); cursorY += 24; return;
      }

      if (block.type === "heading") {
        const lvl = block.level ?? 2;
        if (lvl === 1) {
          const wrapped = doc.splitTextToSize(block.text.toUpperCase(), CW - 28);
          const bH = wrapped.length * 20 + 20;
          ensureSpace(bH + 20);
          setFill(navy); doc.rect(ML, cursorY, CW, bH, "F");
          setFill(gold); doc.rect(ML, cursorY, 5, bH, "F");
          setFont("bold"); doc.setFontSize(12.5); setColor(white);
          doc.text(wrapped, ML + 16, cursorY + 14); cursorY += bH + 20;
        } else if (lvl === 2) {
          const wrapped = doc.splitTextToSize(block.text, CW - 20);
          const bH = wrapped.length * 19 + 16;
          ensureSpace(bH + 16);
          setFill(offWhite); doc.rect(ML, cursorY, CW, bH, "F");
          setFill(navy); doc.rect(ML, cursorY, 4, bH, "F");
          setDraw(gold); doc.setLineWidth(0.6);
          doc.line(ML + 4, cursorY + bH, ML + CW, cursorY + bH);
          doc.setLineWidth(1);
          setFont("bold"); doc.setFontSize(12); setColor(navy);
          doc.text(wrapped, ML + 14, cursorY + 13); cursorY += bH + 16;
        } else if (lvl === 3) {
          const wrapped = doc.splitTextToSize(block.text, CW);
          const bH = wrapped.length * 17 + 14;
          ensureSpace(bH);
          setFont("bold"); doc.setFontSize(11); setColor(navy);
          doc.text(wrapped, ML, cursorY + 12);
          setDraw(gold); doc.setLineWidth(0.8);
          const ruleW = Math.min(doc.getTextWidth(wrapped[0]), CW * 0.5);
          doc.line(ML, cursorY + 16, ML + ruleW, cursorY + 16);
          doc.setLineWidth(1); cursorY += bH;
        } else {
          const wrapped = doc.splitTextToSize(block.text, CW);
          const bH = wrapped.length * 15 + 10;
          ensureSpace(bH);
          setFont("bold"); doc.setFontSize(10.5); setColor(slate600);
          doc.text(wrapped, ML, cursorY + 11); cursorY += bH;
        }
        return;
      }

      if (block.type === "paragraph") {
        const wrapped = doc.splitTextToSize(block.text, CW);
        const bH = wrapped.length * LH + 10;
        ensureSpace(bH);
        setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
        doc.text(wrapped, ML, cursorY); cursorY += bH; return;
      }

      if (block.type === "list") {
        block.items.forEach((item) => {
          const indW  = Math.min(item.indent, 4) * 14;
          const mX    = ML + indW;
          const tX    = mX + 18;
          const avail = CW - indW - 18;
          const wrapped = doc.splitTextToSize(item.text, avail);
          const bH = wrapped.length * LH + 6;
          ensureSpace(bH);
          if (item.kind === "unordered") {
            setFill(slate600); doc.rect(mX + 1, cursorY - 5.5, 4, 4, "F");
            setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
          } else {
            setFont("bold"); doc.setFontSize(10.5); setColor(slate600);
            doc.text(item.marker, mX, cursorY);
            setFont("normal"); doc.setFontSize(10.5); setColor(slate800);
          }
          doc.text(wrapped, tX, cursorY); cursorY += bH;
        });
        cursorY += 6;
      }
    });
  };

  // ── Section 1: Gap Analysis ──────────────────────────────────────────────
  drawSectionBanner("Section 1: Gap Analysis", "Identified compliance gaps across policy domains");
  renderBlocks(gapContent);

  // ── Section 2: Revised Policy ────────────────────────────────────────────
  drawSectionBanner("Section 2: Revised Policy", "AI-generated policy addressing all identified gaps");
  renderBlocks(revisedPolicyContent);

  // ── Section 3: Implementation Roadmap ────────────────────────────────────
  drawSectionBanner("Section 3: Roadmap", "Step-by-step rollout plan for the revised policy");
  renderBlocks(roadmapContent);

  drawFooter();
  doc.save(`${sanitizeFileName(fileName)}.pdf`);
};
