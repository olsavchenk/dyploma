const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageBreak, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, LineRuleType
} = require('docx');
const fs = require('fs');

const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN_TOP = 1134, MARGIN_BOTTOM = 1134, MARGIN_LEFT = 1701, MARGIN_RIGHT = 851;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT; // ~9354 DXA

const FONT = "Times New Roman";
const SIZE = 28;   // 14pt
const SIZE_SM = 24; // 12pt

const LINE = { line: 360, lineRule: LineRuleType.AUTO };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 708 },
    spacing: { ...LINE, before: 0, after: 0 },
    children: [new TextRun({ text, font: FONT, size: opts.size || SIZE, bold: opts.bold || false, italics: opts.italic || false })]
  });
}
function pc(text, opts = {}) { return p(text, { ...opts, align: AlignmentType.CENTER, noIndent: true }); }
function empty() {
  return new Paragraph({ spacing: LINE, children: [new TextRun({ text: "", font: FONT, size: SIZE })] });
}
function h1(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { ...LINE, before: 240, after: 240 },
    indent: { firstLine: 0 },
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: SIZE, bold: true })]
  });
}
function h2(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { ...LINE, before: 240, after: 120 },
    indent: { firstLine: 0 },
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })]
  });
}

// Table border helper
const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: LINE,
            children: [new TextRun({ text: h, font: FONT, size: SIZE_SM, bold: true })]
          })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: LINE,
            children: [new TextRun({ text: cell, font: FONT, size: SIZE_SM })]
          })]
        }))
      }))
    ]
  });
}

// ===================== РОЗДІЛ 1 =====================
const children = [];

children.push(h1("РОЗДІЛ 1"));
children.push(h1("АНАЛІЗ ПРЕДМЕТНОЇ ОБЛАСТІ"));
children.push(empty());

// 1.1
children.push(h2("1.1 Огляд ринку EdTech-платформ"));
children.push(p(
  "Ринок освітніх технологій (EdTech) є одним з найбільш динамічно зростаючих сегментів глобальної цифрової економіки. За даними аналітичних агентств, обсяг світового ринку EdTech у 2024 році перевищив 280 млрд дол. США, а прогнозований щорічний темп зростання до 2030 року складає понад 13%. Пандемія COVID-19 стала потужним каталізатором, що прискорив перехід освітніх процесів у цифровий простір і сформував стійкий попит на якісні дистанційні платформи навчання."
));
children.push(empty());
children.push(p(
  "Для виявлення нішевих можливостей та обґрунтування потреби у розробці платформи Stride було проведено порівняльний аналіз п'яти провідних EdTech-рішень: Duolingo, Khan Academy, Moodle, Coursera та Udemy. Результати порівняння наведено в таблиці 1.1."
));
children.push(empty());

// Підпис таблиці
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: LINE,
  indent: { firstLine: 0 },
  children: [new TextRun({ text: "Таблиця 1.1 — Порівняльний аналіз EdTech-платформ", font: FONT, size: SIZE_SM, bold: true })]
}));

children.push(makeTable(
  ["Платформа", "Гейміфікація", "Адаптивність", "Генерація ШІ", "Мова UI", "Відкритість"],
  [
    ["Duolingo",    "Висока",    "Часткова",  "Ні",   "Багатомовна", "Закрита"],
    ["Khan Academy","Базова",    "Часткова",  "Так*", "Ан./обмежено","Відкрита"],
    ["Moodle",      "Плагіни",   "Відсутня",  "Ні",   "Багатомовна", "Open-source"],
    ["Coursera",    "Відсутня",  "Мінімальна","Ні",   "Ан./обмежено","Закрита"],
    ["Udemy",       "Відсутня",  "Відсутня",  "Ні",   "Обмежена",    "Закрита"],
    ["Stride (MVP)","Висока",    "Повна",     "Так",  "Українська",  "Відкрита*"],
  ],
  [2200, 1400, 1400, 1400, 1600, 1354]
));

children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: LINE,
  indent: { firstLine: 0 },
  children: [new TextRun({ text: "* Khan Academy має обмежений AI Tutor; Stride планується до відкриття коду після MVP.", font: FONT, size: SIZE_SM, italics: true })]
}));
children.push(empty());

children.push(p(
  "Duolingo є лідером у сфері гейміфікованого мобільного навчання мов, однак обмежений вузькою предметною областю (переважно вивчення іноземних мов) і не підтримує повноцінну адаптацію складності за всіма параметрами успішності студента."
));
children.push(empty());
children.push(p(
  "Khan Academy пропонує широкий безкоштовний навчальний контент та елементи адаптивності, проте система є переважно статичною — завдання наперед складено людьми, а AI Tutor (Khanmigo) доступний лише платним підписникам і не генерує нових завдань динамічно."
));
children.push(empty());
children.push(p(
  "Moodle є потужним open-source LMS, але орієнтований переважно на управління навчальним процесом, а не на адаптивне навчання. Система гейміфікації реалізується лише через сторонні плагіни і не є вбудованою. Відсутність сучасного UI/UX знижує залученість учасників, особливо молодших вікових груп."
));
children.push(empty());
children.push(p(
  "Coursera та Udemy є платформами масових відкритих онлайн-курсів (MOOC). Вони пропонують відеолекції та тести, але контент є повністю статичним, без будь-якої адаптації до рівня студента. Ці платформи більше нагадують відеотеку, ніж систему активного навчання."
));
children.push(empty());
children.push(p(
  "Аналіз показав, що жодна з розглянутих платформ не поєднує в собі: україномовний інтерфейс, динамічну генерацію завдань засобами LLM, повноцінне адаптивне навчання на основі машинного навчання та комплексну вбудовану систему гейміфікації. Саме це поєднання є ключовою конкурентною перевагою платформи Stride."
));
children.push(empty());

// 1.2
children.push(h2("1.2 Концепція адаптивного навчання"));
children.push(p(
  "Адаптивне навчання — це педагогічний підхід, що передбачає автоматичне налаштування темпу, складності та типу навчальних матеріалів відповідно до індивідуальних характеристик кожного студента. Концепція бере початок з досліджень Б. Блума, який у 1984 році показав, що індивідуалізоване навчання підвищує успішність в середньому на два стандартних відхилення порівняно зі стандартним груповим навчанням — ефект, відомий як «проблема двох сигм»."
));
children.push(empty());
children.push(p(
  "Сучасні системи адаптивного навчання спираються на декілька математичних моделей. Найпоширенішою є Item Response Theory (IRT) — теорія відповіді на завдання, яка описує ймовірність правильної відповіді студента з певним рівнем здібностей (θ) на завдання з певним рівнем складності (b), дискримінаційним параметром (a) та псевдовипадковістю (c):"
));
children.push(empty());
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: LINE,
  indent: { firstLine: 0 },
  children: [new TextRun({ text: "P(θ) = c + (1 − c) / (1 + e^(−a(θ − b)))", font: FONT, size: SIZE, italics: true })]
}));
children.push(empty());
children.push(p(
  "У платформі Stride реалізовано спрощену, але практично ефективну версію адаптивного рушія. Компонент DifficultyEngine аналізує показник успішності студента (SuccessRate) за останні N спроб і приймає рішення щодо зміни рівня складності за такою логікою: якщо SuccessRate перевищує 80% — складність підвищується; якщо менше 50% — знижується; в іншому діапазоні — залишається незмінною. Додатково враховується час виконання завдання та кількість спроб."
));
children.push(empty());
children.push(p(
  "Для навчання моделі передбачення складності використовується фреймворк ML.NET, що дозволяє будувати та перенавчати моделі машинного навчання на даних, накопичених у платформі (TaskAttempt). Компонент ModelTrainer запускається щотижня і переналаштовує модель на актуальних даних, забезпечуючи постійне поліпшення якості адаптації."
));
children.push(empty());
children.push(p(
  "Персоналізований навчальний шлях (Learning Path) формується на основі виявлених прогалин у знаннях студента. Алгоритм аналізує результати спроб за різними темами і рекомендує наступну тему таким чином, щоб закривати слабкі місця, не порушуючи загальну логічну послідовність навчальної програми."
));
children.push(empty());

// 1.3
children.push(h2("1.3 Гейміфікація в освіті"));
children.push(p(
  "Гейміфікація (gamification) — це застосування ігрових елементів та механік у неігровому контексті з метою підвищення мотивації та залученості учасників. Термін набув широкого поширення після 2010 року завдяки роботам Дж. МакГонігал та К. Вербаха, які обґрунтували позитивний вплив ігрових механік на продуктивність і мотивацію у різних сферах."
));
children.push(empty());
children.push(p(
  "Теоретичним підґрунтям застосування гейміфікації в освіті слугує теорія самовизначення (Self-Determination Theory, Deci & Ryan, 1985), яка виокремлює три базові психологічні потреби: компетентність, автономність та приналежність. Добре спроєктована гейміфікація задовольняє всі три: очки досвіду та рівні підкреслюють зростання компетентності; вибір теми і темпу навчання забезпечує автономність; таблиця лідерів і командні досягнення формують почуття приналежності до спільноти."
));
children.push(empty());
children.push(p(
  "У платформі Stride реалізовано такі гейміфікаційні механіки:"
));

const gamItems = [
  "очки досвіду (XP) — нараховуються після кожної успішної спроби, кількість залежить від складності завдання та швидкості виконання;",
  "рівні — визначаються сумою накопичених XP, кожен новий рівень відкриває нові теми та досягнення;",
  "стріки (streak) — підраховують кількість послідовних днів активності; втрата стріку є потужним мотиватором для регулярних занять;",
  "досягнення (badges) — видаються за виконання визначених умов (наприклад, «100 правильних відповідей», «Тиждень без пропусків»);",
  "таблиця лідерів (leaderboard) — відображає рейтинг студентів у реальному часі через SignalR, стимулює здорову конкуренцію."
];
for (let i = 0; i < gamItems.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i + 1}) ${gamItems[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "Дослідження J. Hamari et al. (2014) показало, що гейміфікація демонструє статистично значимий позитивний ефект на залученість, мотивацію та навчальні результати, особливо у поєднанні з соціальними механіками (таблиця лідерів, командні виклики). Водночас автори застерігають від «надмірної гейміфікації» — надто складних систем балів, які відволікають від навчального контенту. Платформа Stride дотримується принципу мінімальної достатності: ігрові механіки підсилюють мотивацію, але не домінують над змістом."
));
children.push(empty());

// 1.4
children.push(h2("1.4 Застосування великих мовних моделей для генерації навчального контенту"));
children.push(p(
  "Великі мовні моделі (Large Language Models, LLM) — це нейронні мережі, навчені на масивах текстових даних, здатні генерувати зв'язний і контекстуально релевантний текст. Революційний прорив у цій галузі було здійснено з виходом GPT-3 (OpenAI, 2020) та його наступників. Сьогодні провідними комерційними LLM є GPT-4 (OpenAI), Gemini (Google DeepMind) та Claude (Anthropic)."
));
children.push(empty());
children.push(p(
  "Застосування LLM для генерації навчальних завдань має кілька ключових переваг порівняно з традиційним ручним складанням: необмежений масштаб генерації (модель може створювати мільйони унікальних завдань), миттєва адаптація до вказаного рівня складності та теми, можливість генерації різноманітних типів завдань (вибір відповіді, відкрите питання, задача з рішенням) та природна мовна варіативність, що унеможливлює заучування шаблонних формулювань."
));
children.push(empty());
children.push(p(
  "У платформі Stride як основний LLM-провайдер використовується Google Gemini API. Вибір обумовлений такими факторами: якість генерації україномовного контенту, конкурентна вартість API-викликів, підтримка структурованих відповідей у форматі JSON для надійного парсингу, а також відсутність обмежень на комерційне використання у освітніх проєктах."
));
children.push(empty());
children.push(p(
  "Ключовим архітектурним рішенням є патерн AIProviderFactory — фабрика постачальників ШІ, що абстрагує конкретний LLM-провайдер від бізнес-логіки. Завдяки цьому платформа може перейти з Gemini на будь-який інший провайдер (OpenAI, Anthropic тощо) без зміни основного коду, лише додавши новий клас-адаптер. Усі запити до LLM та їх результати логуються у MongoDB у вигляді AIGenerationLogDocument, що забезпечує аудит, моніторинг якості генерації та базу даних для перенавчання ML-моделі."
));
children.push(empty());
children.push(p(
  "Згенеровані завдання проходять кількаетапну обробку: розбір JSON-відповіді моделі, валідація структури (наявність умови, варіантів відповіді, правильної відповіді, пояснення), збереження у MongoDB як TaskTemplateDocument. При повторному запиті на завдання схожого типу та рівня система спочатку перевіряє пул наявних шаблонів (TaskPoolService) і лише за відсутності підходящого генерує новий — це знижує витрати на API та час відповіді."
));
children.push(empty());

// 1.5
children.push(h2("1.5 Функціональні вимоги до платформи Stride"));
children.push(p(
  "На основі проведеного аналізу EdTech-ринку та потреб цільової аудиторії визначено функціональні вимоги до платформи, систематизовані за ролями користувачів (таблиця 1.2)."
));
children.push(empty());

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: LINE,
  indent: { firstLine: 0 },
  children: [new TextRun({ text: "Таблиця 1.2 — Функціональні вимоги до платформи Stride", font: FONT, size: SIZE_SM, bold: true })]
}));

children.push(makeTable(
  ["Роль", "Функціональні вимоги"],
  [
    ["Студент",
     "Реєстрація та авторизація; вибір предметів; перегляд навчального шляху; отримання адаптивних завдань; здача відповідей та миттєвий зворотний зв'язок; перегляд накопиченого XP, стріків та досягнень; участь у таблиці лідерів; редагування профілю."],
    ["Викладач",
     "Створення та управління класами; запрошення студентів; призначення тем і завдань для класу; перегляд аналітики успішності кожного студента та класу в цілому; відстеження прогресу навчального шляху."],
    ["Адміністратор",
     "CRUD-операції з предметами та темами; управління переліком досягнень і умовами їх отримання; перегляд системних метрик і журналів генерації ШІ; управління користувачами та ролями."],
  ],
  [2200, 7154]
));
children.push(empty());

// 1.6
children.push(h2("1.6 Нефункціональні вимоги"));
children.push(p(
  "Нефункціональні вимоги визначають якісні характеристики системи, що впливають на її надійність, продуктивність і зручність використання (таблиця 1.3)."
));
children.push(empty());

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: LINE,
  indent: { firstLine: 0 },
  children: [new TextRun({ text: "Таблиця 1.3 — Нефункціональні вимоги до платформи Stride", font: FONT, size: SIZE_SM, bold: true })]
}));

children.push(makeTable(
  ["Категорія", "Вимога", "Спосіб реалізації"],
  [
    ["Продуктивність", "Час відповіді API < 500 мс (без генерації ШІ)", "Valkey/Redis кешування, оптимізовані SQL-запити"],
    ["Продуктивність", "Кешування шаблонів завдань", "TaskPoolService + MongoDB"],
    ["Масштабованість", "Горизонтальне масштабування сервісів", "Docker Compose, stateless API"],
    ["Доступність", "PWA із офлайн-підтримкою", "Angular Service Worker (ngsw-config.json)"],
    ["Безпека", "JWT + HttpOnly refresh token, RBAC", "ASP.NET Core Identity, рольова авторизація"],
    ["Безпека", "Валідація вхідних даних", "FluentValidation на рівні API"],
    ["Пошук", "Повнотекстовий пошук предметів і тем", "Meilisearch"],
    ["Зберігання", "Аватари та медіафайли", "MinIO (S3-сумісне сховище)"],
  ],
  [2600, 3200, 3554]
));
children.push(empty());

// Висновки розділу 1
children.push(h2("Висновки до розділу 1"));
children.push(p(
  "У першому розділі проведено комплексний аналіз предметної області розробки гейміфікованої освітньої платформи з адаптивним навчанням. За результатами порівняльного аналізу п'яти провідних EdTech-платформ встановлено, що жодна з них не поєднує в собі україномовний інтерфейс, динамічну генерацію завдань засобами великих мовних моделей та повноцінне адаптивне навчання на основі машинного навчання."
));
children.push(empty());
children.push(p(
  "Розглянуто теоретичні засади адаптивного навчання, зокрема теорію відповіді на завдання (IRT), яка є математичним підґрунтям для рушія складності платформи Stride. Обґрунтовано доцільність застосування Google Gemini API для генерації навчальних завдань та ML.NET для побудови прогностичної моделі складності. Досліджено психологічні механізми гейміфікації з точки зору теорії самовизначення."
));
children.push(empty());
children.push(p(
  "Визначено та систематизовано функціональні вимоги до платформи за ролями (студент, викладач, адміністратор) та нефункціональні вимоги щодо продуктивності, масштабованості, доступності та безпеки. Отримані результати є основою для проєктування архітектури системи, описаної в наступному розділі."
));

// ===================== BUILD =====================
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

if (require.main === module) {
  Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync("D:/apps/dyploma/thesis/thesis_part2.docx", buf);
    console.log("Done: thesis_part2.docx");
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { children };
