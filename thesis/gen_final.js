// gen_final.js — merges parts 1-5 into a single thesis_FINAL.docx
// Each gen_partN.js exports its `children` array via module.exports when required.

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, PageBreak, LineRuleType,
  Header, Footer, PageNumber
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
const part1Module = require('./gen_part1.js');
const part1Pre = part1Module.children.slice(0, part1Module.tocInsertIndex);
const part1Post = part1Module.children.slice(part1Module.tocInsertIndex);
const part2 = require('./gen_part2.js').children;
const part3 = require('./gen_part3.js').children;
const part4 = require('./gen_part4.js').children;
const part5 = require('./gen_part5.js').children;

console.log(`Loaded children: p1Pre=${part1Pre.length}, p1Post=${part1Post.length}, p2=${part2.length}, p3=${part3.length}, p4=${part4.length}, p5=${part5.length}`);

// ===== Build TOC block =====
const toc = [];
toc.push(tocHeading());
toc.push(emptyPara());
toc.push(tocLine("АНОТАЦІЯ", "2"));
toc.push(tocLine("ANNOTATION", "3"));
toc.push(tocLine("ПЕРЕЛІК УМОВНИХ ПОЗНАЧЕНЬ", "5"));
toc.push(tocLine("ВСТУП", "6"));
toc.push(tocLine("РОЗДІЛ 1  АНАЛІЗ ПРЕДМЕТНОЇ ОБЛАСТІ", "8"));
toc.push(tocLine("    1.1 Огляд ринку EdTech-платформ", "8"));
toc.push(tocLine("    1.2 Концепція адаптивного навчання", "10"));
toc.push(tocLine("    1.3 Гейміфікація в освіті", "11"));
toc.push(tocLine("    1.4 Застосування LLM для генерації контенту", "12"));
toc.push(tocLine("    1.5 Функціональні вимоги до платформи Stride", "13"));
toc.push(tocLine("    1.6 Нефункціональні вимоги", "14"));
toc.push(tocLine("    Висновки до розділу 1", "15"));
toc.push(tocLine("РОЗДІЛ 2  ПРОЄКТУВАННЯ СИСТЕМИ", "16"));
toc.push(tocLine("    2.1 Загальна архітектура платформи", "16"));
toc.push(tocLine("    2.2 Модель даних", "17"));
toc.push(tocLine("    2.3 Алгоритм адаптивного навчання", "19"));
toc.push(tocLine("    2.4 Пайплайн генерації завдань через ШІ", "20"));
toc.push(tocLine("    2.5 Система гейміфікації", "21"));
toc.push(tocLine("    2.6 Архітектура Angular-фронтенду", "22"));
toc.push(tocLine("    2.7 Безпека та автентифікація", "23"));
toc.push(tocLine("    Висновки до розділу 2", "23"));
toc.push(tocLine("РОЗДІЛ 3  РЕАЛІЗАЦІЯ ТА ТЕСТУВАННЯ", "24"));
toc.push(tocLine("    3.1 Опис інтерфейсу платформи", "24"));
toc.push(tocLine("    3.2 Інсталяція та налаштування", "26"));
toc.push(tocLine("    3.3 Керівництво користувача", "27"));
toc.push(tocLine("    3.4 Тестовий приклад", "28"));
toc.push(tocLine("    3.5 Аналіз результатів", "29"));
toc.push(tocLine("    Висновки до розділу 3", "30"));
toc.push(tocLine("ЗАГАЛЬНІ ВИСНОВКИ", "31"));
toc.push(tocLine("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ", "33"));
toc.push(tocLine("ДОДАТКИ", "37"));
toc.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));

// ===== Merge all children =====
// Order per ДСТУ 3008:2015: Title + Annotations → ЗМІСТ → Перелік → Вступ → Chapters → Conclusions + References + Appendices
const children = [
  ...part1Pre,
  ...toc,
  ...part1Post,
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
      },
      titlePage: true
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0 },
          children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE })]
        })]
      }),
      first: new Header({
        children: [new Paragraph({ children: [] })]
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
