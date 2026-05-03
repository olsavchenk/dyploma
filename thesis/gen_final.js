// gen_final.js — merges parts 1-5 into a single thesis_FINAL.docx
// Each gen_partN.js exports its `children` array via module.exports when required.

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, PageBreak, LineRuleType,
  Footer, PageNumber
} = require('docx');
const fs = require('fs');

// ===== Unified page / font settings (consistent with all part files) =====
const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN_TOP = 1134, MARGIN_BOTTOM = 1134, MARGIN_LEFT = 1701, MARGIN_RIGHT = 851;
const FONT = "Times New Roman";
const SIZE = 28;    // 14pt
const SIZE_SM = 24; // 12pt
const LINE = { line: 360, lineRule: LineRuleType.AUTO };

// ===== Table of contents (manual, static — the numbering is approximate) =====
function tocHeading() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { ...LINE, before: 240, after: 240 },
    indent: { firstLine: 0 },
    children: [new TextRun({ text: "ЗМІСТ", font: FONT, size: SIZE, bold: true })]
  });
}
function tocLine(text, page) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { firstLine: 0 },
    spacing: { ...LINE, before: 0, after: 0 },
    tabStops: [{ type: "right", position: 9354, leader: "dot" }],
    children: [
      new TextRun({ text, font: FONT, size: SIZE }),
      new TextRun({ text: "\t" + page, font: FONT, size: SIZE })
    ]
  });
}
function emptyPara() {
  return new Paragraph({ spacing: LINE, children: [new TextRun({ text: "", font: FONT, size: SIZE })] });
}

// ===== Load part children =====
const part1 = require('./gen_part1.js').children;
const part2 = require('./gen_part2.js').children;
const part3 = require('./gen_part3.js').children;
const part4 = require('./gen_part4.js').children;
const part5 = require('./gen_part5.js').children;

console.log(`Loaded children: p1=${part1.length}, p2=${part2.length}, p3=${part3.length}, p4=${part4.length}, p5=${part5.length}`);

// ===== Build TOC block =====
const toc = [];
toc.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
toc.push(tocHeading());
toc.push(emptyPara());
toc.push(tocLine("АНОТАЦІЯ", "3"));
toc.push(tocLine("ANNOTATION", "4"));
toc.push(tocLine("ВСТУП", "5"));
toc.push(tocLine("РОЗДІЛ 1. АНАЛІЗ ПРЕДМЕТНОЇ ОБЛАСТІ", "7"));
toc.push(tocLine("    1.1 Огляд ринку EdTech-платформ", "7"));
toc.push(tocLine("    1.2 Концепція адаптивного навчання", "9"));
toc.push(tocLine("    1.3 Гейміфікація в освіті", "10"));
toc.push(tocLine("    1.4 Застосування LLM для генерації контенту", "11"));
toc.push(tocLine("    1.5 Функціональні вимоги до платформи Stride", "12"));
toc.push(tocLine("    1.6 Нефункціональні вимоги", "13"));
toc.push(tocLine("    Висновки до розділу 1", "14"));
toc.push(tocLine("РОЗДІЛ 2. ПРОЄКТУВАННЯ СИСТЕМИ", "15"));
toc.push(tocLine("    2.1 Загальна архітектура платформи", "15"));
toc.push(tocLine("    2.2 Модель даних", "16"));
toc.push(tocLine("    2.3 Алгоритм адаптивного навчання", "18"));
toc.push(tocLine("    2.4 Пайплайн генерації завдань через ШІ", "19"));
toc.push(tocLine("    2.5 Система гейміфікації", "20"));
toc.push(tocLine("    2.6 Архітектура Angular-фронтенду", "21"));
toc.push(tocLine("    2.7 Безпека та автентифікація", "22"));
toc.push(tocLine("    Висновки до розділу 2", "22"));
toc.push(tocLine("РОЗДІЛ 3. РЕАЛІЗАЦІЯ ТА ТЕСТУВАННЯ", "23"));
toc.push(tocLine("    3.1 Опис інтерфейсу платформи", "23"));
toc.push(tocLine("    3.2 Інсталяція та налаштування", "25"));
toc.push(tocLine("    3.3 Керівництво користувача", "26"));
toc.push(tocLine("    3.4 Тестовий приклад", "27"));
toc.push(tocLine("    3.5 Аналіз результатів", "28"));
toc.push(tocLine("    Висновки до розділу 3", "29"));
toc.push(tocLine("ЗАГАЛЬНІ ВИСНОВКИ", "30"));
toc.push(tocLine("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ", "32"));
toc.push(tocLine("ДОДАТКИ", "36"));

// ===== Merge all children =====
// Order: Part 1 (title + annotation + intro) → TOC → Parts 2-5
// Note: Part 1 contains the title page already. TOC is inserted before Chapter 1.
const children = [
  ...part1,
  ...toc,
  ...part2,
  ...part3,
  ...part4,
  ...part5
];

console.log(`Total merged children: ${children.length}`);

// ===== Build the document =====
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: SIZE } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: SIZE, bold: true, font: FONT },
        paragraph: { spacing: { ...LINE, before: 240, after: 240 }, alignment: AlignmentType.CENTER, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: SIZE, bold: true, font: FONT },
        paragraph: { spacing: { ...LINE, before: 240, after: 120 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE_SM })]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("D:/apps/dyploma/thesis/thesis_FINAL.docx", buf);
  const stats = fs.statSync("D:/apps/dyploma/thesis/thesis_FINAL.docx");
  console.log(`Done: thesis_FINAL.docx (${(stats.size/1024).toFixed(1)} KB)`);
}).catch(e => { console.error(e); process.exit(1); });
