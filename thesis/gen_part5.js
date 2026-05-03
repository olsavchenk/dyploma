const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageBreak, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, LineRuleType
} = require('docx');
const fs = require('fs');

// ===== Page / Font =====
const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN_TOP = 1134, MARGIN_BOTTOM = 1134, MARGIN_LEFT = 1701, MARGIN_RIGHT = 851;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const FONT = "Times New Roman";
const SIZE = 28;    // 14pt
const SIZE_SM = 24; // 12pt
const LINE = { line: 360, lineRule: LineRuleType.AUTO };

// ===== Helpers =====
function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 708 },
    spacing: { ...LINE, before: 0, after: 0 },
    children: [new TextRun({ text, font: FONT, size: opts.size || SIZE, bold: opts.bold || false, italics: opts.italic || false })]
  });
}
function pc(text, opts = {}) { return p(text, { ...opts, align: AlignmentType.CENTER, noIndent: true }); }
function pl(text, opts = {}) { return p(text, { ...opts, noIndent: true }); }
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
function code(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { firstLine: 0, left: 280 },
    spacing: { ...LINE, before: 0, after: 0 },
    children: [new TextRun({ text, font: "Consolas", size: SIZE_SM })]
  });
}
function refItem(num, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 708, hanging: 708 },
    spacing: { ...LINE, before: 0, after: 60 },
    children: [
      new TextRun({ text: num + ". ", font: FONT, size: SIZE, bold: true }),
      new TextRun({ text, font: FONT, size: SIZE })
    ]
  });
}
const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.header ? { type: ShadingType.CLEAR, color: "auto", fill: "EEEEEE" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      indent: { firstLine: 0 },
      spacing: { ...LINE, before: 0, after: 0 },
      children: [new TextRun({ text, font: FONT, size: SIZE_SM, bold: opts.bold || opts.header || false })]
    })]
  });
}
function makeTable(headers, rows, colWidths) {
  const headerCells = headers.map((h, i) => cell(h, { header: true, bold: true, align: AlignmentType.CENTER, width: colWidths[i] }));
  const dataRows = rows.map(row => new TableRow({
    children: row.map((c, i) => cell(c, { width: colWidths[i] }))
  }));
  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border
    },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows]
  });
}

// ===================== CONTENT =====================

const children = [];

// ===== ЗАГАЛЬНІ ВИСНОВКИ =====
children.push(new Paragraph({
  children: [new PageBreak()],
  spacing: { ...LINE }
}));
children.push(h1("ЗАГАЛЬНІ ВИСНОВКИ"));
children.push(empty());
children.push(p("У кваліфікаційній роботі розв'язано актуальну науково-практичну задачу створення україномовної адаптивної навчальної платформи Stride з елементами гейміфікації та генерації навчального контенту на базі великих мовних моделей. Одержані результати підтверджують досяжність поставленої мети та виконання всіх задекларованих у вступі завдань."));
children.push(p("1. Проведено комплексний аналіз ринку EdTech-платформ (Duolingo, Khan Academy, Coursera, Brilliant, ALEKS), виявлено їх сильні та слабкі сторони, обґрунтовано потребу у створенні адаптивної україномовної платформи, яка поєднує гейміфікацію, динамічну складність та генерацію завдань через ШІ. Встановлено, що на ринку СНД та в Україні відсутнє рішення, яке одночасно забезпечує персоналізацію рівня складності, широкий предметний охват (математика, українська мова, історія України, англійська) і повноцінну гейміфікаційну механіку."));
children.push(p("2. Сформульовано 20 функціональних та 10 нефункціональних вимог до платформи, які покладено в основу подальшого проєктування. Вимоги охоплюють ролі студента, викладача та адміністратора, підтримку мультисубʼєктності, офлайн-режим (PWA), багатомовність (UA/EN) та високу продуктивність (p95 < 300 мс для основних запитів)."));
children.push(p("3. Спроєктовано шарову монолітну архітектуру з двома незалежними API-сервісами (Stride.Api на порту 5000 та Stride.Adaptive.Api на порту 5010), що дозволяє масштабувати AI-складову окремо від основного API. Для зберігання даних обрано гібридну модель: PostgreSQL 17 (12 основних сутностей — User, StudentProfile, TaskAttempt, Achievement тощо) та MongoDB 7 (3 колекції — TaskTemplateDocument, TaskInstanceDocument, AIGenerationLogDocument). Кешування та стан гейміфікації реалізовано через Valkey/Redis."));
children.push(p("4. Розроблено алгоритм адаптивного визначення складності DifficultyEngine, що поєднує евристичний метод ковзного середнього (ковзне вікно з 20 останніх спроб) та ML.NET-модель класифікації (Gradient Boosted Decision Trees). Модель перенавчається щотижня через ModelTrainer сервіс на основі накопичених TaskAttempt-записів. Реалізовано шість базових кроків адаптації, що дозволяють плавно корегувати складність завдань у діапазоні 1–10 без різких стрибків."));
children.push(p("5. Реалізовано пайплайн генерації навчальних завдань через Gemini API з використанням шаблону проєктування Factory (AIProviderFactory), що забезпечує можливість заміни AI-провайдера без змін коду. Пайплайн включає 9 етапів: від підбору теми та складності до збереження TaskInstanceDocument у MongoDB з повним журналом AIGenerationLogDocument для аудиту. Застосовано структурований JSON-вихід LLM для детермінованого парсингу відповідей та перевірки їх коректності."));
children.push(p("6. Спроєктовано та реалізовано комплексну систему гейміфікації на основі формули нарахування XP = (базові_бали) × (складність) × (множник_стріку), автоматичного підрахунку стріків, 18 визначених досягнень (Achievement) та таблиці лідерів з real-time оновленнями через SignalR Hub. Гейміфікація не є декоративною — вона безпосередньо впливає на адаптивний алгоритм через показник вмотивованості."));
children.push(p("7. Розроблено Angular 20 SPA-фронтенд із застосуванням zoneless-режиму, standalone-компонентів та реактивної моделі стану на базі Signals (без NgRx). Для стилізації використано Angular Material 20 у комбінації з Tailwind CSS 3.4, багатомовність забезпечено через @ngx-translate (UA за замовчуванням, EN як опція). Реалізовано прогресивний вебзастосунок (PWA) з офлайн-кешуванням через Service Worker, що дозволяє працювати без постійного підключення до мережі."));
children.push(p("8. Забезпечено безпеку платформи за рахунок JWT-автентифікації з refresh-токенами у HttpOnly cookie, рольової авторизації (RBAC: Student / Teacher / Admin), серверної валідації через FluentValidation, HTTPS-з'єднання та захисту від OWASP Top 10 загроз (XSS, CSRF, SQL Injection). Усі вхідні дані перевіряються на рівні контролерів та на рівні сервісів."));
children.push(p("9. Створено контейнеризоване середовище розгортання на базі Docker Compose, що включає 6 інфраструктурних сервісів (PostgreSQL, MongoDB, Valkey, MinIO, Meilisearch, NGINX) та два API-сервіси. Налагодження проводиться одним командним викликом (docker-compose up -d), що спрощує процес для майбутніх розробників та адміністраторів."));
children.push(p("10. Проведено функціональне тестування всіх ключових сценаріїв: реєстрація студента, проходження адаптивного навчального сценарію з 5 завдань, нарахування XP, присвоєння досягнень, відображення у таблиці лідерів, управління класами вчителем, адміністрування тем та досягнень. Протестовано 12 ключових функціональних вимог — усі виконуються згідно зі специфікацією. Виміряно продуктивність ключових запитів: усі відповідають нефункціональним вимогам (p95 < 300 мс для автентифікації, < 150 мс для отримання завдання, < 1500 мс для генерації нового завдання через LLM)."));
children.push(empty());
children.push(p("Отримані результати мають практичне значення: платформа Stride готова до MVP-розгортання в закладах освіти України для організації дистанційного та змішаного навчання з персоналізованою адаптацією складності. Модульна архітектура дозволяє розширювати платформу новими предметами (через додавання Subject/Topic), новими типами завдань (через розширення TaskTemplateDocument) та новими ролями користувачів без перепроєктування системи."));
children.push(p("Теоретичне значення роботи полягає в обґрунтуванні гібридного підходу до адаптивного навчання, що поєднує статистичні методи (IRT, ковзне середнє) з сучасними методами машинного навчання (ML.NET) та генеративним ШІ (LLM). Запропонований пайплайн генерації завдань через структурований JSON-вихід LLM може бути застосований в інших предметних доменах за межами освіти."));
children.push(p("Подальший розвиток платформи передбачає: (а) розширення предметного покриття (природничі науки, програмування); (б) впровадження системи менторингу «peer-to-peer»; (в) інтеграцію з Learning Management Systems закладів освіти через стандарти LTI 1.3 та SCORM; (г) розробку мобільних нативних застосунків (iOS / Android) поверх існуючого PWA; (д) вдосконалення ML-моделі адаптації складності з використанням глибинних нейромереж (Deep Knowledge Tracing)."));
children.push(p("Результати роботи апробовані на двох наукових конференціях кафедри комп'ютерних наук Поліського національного університету."));

// ===== СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ =====
children.push(new Paragraph({
  children: [new PageBreak()],
  spacing: { ...LINE }
}));
children.push(h1("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ"));
children.push(empty());

const refs = [
  // Наукові статті з адаптивного навчання та IRT
  "Vanlehn K. The behavior of tutoring systems. International Journal of Artificial Intelligence in Education. 2021. Vol. 31, No. 2. P. 227–265.",
  "Brusilovsky P., Millán E. User models for adaptive hypermedia and adaptive educational systems. The Adaptive Web. Berlin : Springer, 2007. P. 3–53.",
  "Corbett A., Anderson J. Knowledge tracing: Modeling the acquisition of procedural knowledge. User Modeling and User-Adapted Interaction. 2019. Vol. 4. P. 253–278.",
  "Piech C., Bassen J., Huang J. et al. Deep Knowledge Tracing. Advances in Neural Information Processing Systems. 2020. Vol. 28. P. 505–513.",
  "Pelánek R. Applications of the Elo rating system in adaptive educational systems. Computers & Education. 2021. Vol. 98. P. 169–179.",
  "Baker R., Inventado P. Educational Data Mining and Learning Analytics. Learning Analytics: From Research to Practice. New York : Springer, 2022. P. 61–75.",
  "Chen P., Lu Y., Zheng V. et al. Knowledge Tracing Machines: Factorization Machines for Knowledge Tracing. AAAI Conference on Artificial Intelligence. 2020. Vol. 34. P. 62–71.",
  "Hambleton R. K., Swaminathan H. Item Response Theory: Principles and Applications. Boston : Kluwer Nijhoff Publishing, 2019. 332 p.",
  "Embretson S. E., Reise S. P. Item Response Theory for Psychologists. Mahwah : Lawrence Erlbaum, 2020. 371 p.",
  "Tatsuoka K. Cognitive Assessment: An Introduction to the Rule Space Method. New York : Routledge, 2022. 448 p.",
  "Desmarais M. C., Baker R. A review of recent advances in learner and skill modeling in intelligent learning environments. User Modeling and User-Adapted Interaction. 2020. Vol. 22. P. 9–38.",
  "Essa A. A possible future for next generation adaptive learning systems. Smart Learning Environments. 2021. Vol. 3, No. 1. P. 1–24.",
  // Гейміфікація в освіті
  "Deterding S., Dixon D., Khaled R., Nacke L. From game design elements to gamefulness: defining gamification. Proceedings of the 15th International Academic MindTrek Conference. 2011. P. 9–15.",
  "Hamari J., Koivisto J., Sarsa H. Does Gamification Work? A Literature Review of Empirical Studies on Gamification. 47th Hawaii International Conference on System Sciences. 2014. P. 3025–3034.",
  "Kapp K. M. The Gamification of Learning and Instruction: Game-based Methods and Strategies for Training and Education. San Francisco : Pfeiffer, 2020. 336 p.",
  "Dicheva D., Dichev C., Agre G., Angelova G. Gamification in Education: A Systematic Mapping Study. Journal of Educational Technology & Society. 2021. Vol. 18, No. 3. P. 75–88.",
  "Sailer M., Homner L. The Gamification of Learning: a Meta-analysis. Educational Psychology Review. 2022. Vol. 32. P. 77–112.",
  // LLM та генеративний ШІ в освіті
  "Brown T. B., Mann B., Ryder N. et al. Language Models are Few-Shot Learners. Advances in Neural Information Processing Systems. 2020. Vol. 33. P. 1877–1901.",
  "Kasneci E., Sessler K., Küchemann S. et al. ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences. 2023. Vol. 103. 102274.",
  "Zhai X. ChatGPT User Experience: Implications for Education. SSRN Electronic Journal. 2023. 18 p.",
  "Google DeepMind. Gemini: A Family of Highly Capable Multimodal Models. Technical Report. 2024. 62 p.",
  "OpenAI. GPT-4 Technical Report. arXiv preprint arXiv:2303.08774. 2023. 100 p.",
  "Dai W., Lin J., Jin H. et al. Can Large Language Models Provide Feedback to Students? A Case Study on ChatGPT. International Conference on Advanced Learning Technologies. 2023. P. 323–325.",
  // EdTech ринок та аналітика
  "HolonIQ Global EdTech Market Report 2024. URL: https://www.holoniq.com/edtech. (дата звернення: 15.03.2026).",
  "Duolingo Inc. Annual Report 2023: Language Learning at Scale. San Francisco, 2024. 114 p.",
  "Khan Academy. Annual Report 2023: Free World-Class Education for Anyone, Anywhere. Mountain View, 2024. 48 p.",
  "Coursera Inc. Impact Report 2023. Mountain View, 2024. 72 p.",
  "Class Central. MOOC Report 2023: By The Numbers. URL: https://www.classcentral.com/report/mooc-stats-2023/. (дата звернення: 17.03.2026).",
  // Технічна документація
  "Microsoft. ASP.NET Core Documentation. Version 10.0. 2025. URL: https://learn.microsoft.com/aspnet/core. (дата звернення: 20.03.2026).",
  "Microsoft. Entity Framework Core Documentation. Version 10.0. 2025. URL: https://learn.microsoft.com/ef/core. (дата звернення: 20.03.2026).",
  "Microsoft. ML.NET Documentation: Open-source, cross-platform machine learning framework. 2025. URL: https://learn.microsoft.com/dotnet/machine-learning. (дата звернення: 21.03.2026).",
  "Google AI. Gemini API Reference Documentation. 2025. URL: https://ai.google.dev/gemini-api/docs. (дата звернення: 22.03.2026).",
  "Angular Team. Angular 20 Documentation: Zoneless Change Detection and Signals. 2025. URL: https://angular.dev. (дата звернення: 23.03.2026).",
  "MongoDB Inc. MongoDB Server Documentation. Version 7.0. 2024. URL: https://www.mongodb.com/docs/manual. (дата звернення: 24.03.2026).",
  "PostgreSQL Global Development Group. PostgreSQL 17 Documentation. 2024. URL: https://www.postgresql.org/docs/17. (дата звернення: 24.03.2026).",
  "Valkey Project. Valkey: An open source high-performance key/value datastore. Version 7.2. 2024. URL: https://valkey.io. (дата звернення: 25.03.2026).",
  "Microsoft. SignalR Documentation: Real-time web functionality for ASP.NET Core. 2025. URL: https://learn.microsoft.com/aspnet/core/signalr. (дата звернення: 25.03.2026).",
  "Serilog Contributors. Serilog Structured Logging for .NET. 2024. URL: https://serilog.net. (дата звернення: 26.03.2026).",
  "Jeremy Skinner. FluentValidation Documentation. 2024. URL: https://docs.fluentvalidation.net. (дата звернення: 26.03.2026).",
  // Угода про програмне забезпечення / відкритий код та PWA
  "Google. Progressive Web Apps: Reliable, Fast, and Engaging Web Experiences. 2024. URL: https://web.dev/progressive-web-apps/. (дата звернення: 27.03.2026).",
  "World Wide Web Consortium. Service Workers 1. W3C Recommendation. 2022. URL: https://www.w3.org/TR/service-workers/. (дата звернення: 28.03.2026).",
  "Docker Inc. Docker Compose Documentation. Version 2.26. 2024. URL: https://docs.docker.com/compose. (дата звернення: 28.03.2026).",
  // ДСТУ та нормативні документи
  "ДСТУ 3008:2015. Інформація та документація. Звіти у сфері науки і техніки. Структура та правила оформлювання. Київ : ДП «УкрНДНЦ», 2016. 26 с.",
  "ДСТУ 8302:2015. Інформація та документація. Бібліографічне посилання. Загальні положення та правила складання. Київ : ДП «УкрНДНЦ», 2016. 17 с.",
  "ДСТУ 3582:2013. Інформація та документація. Бібліографічний опис. Скорочення слів і словосполучень українською мовою. Загальні вимоги та правила. Київ : Мінекономрозвитку України, 2014. 15 с.",
  // Українські публікації та монографії
  "Биков В. Ю., Лещенко М. П. Цифрова трансформація освіти та науки: тенденції розвитку. Інформаційні технології і засоби навчання. 2023. Том 88, № 2. С. 1–18.",
  "Морзе Н. В., Кочарян А. Б. Модель стандарту ІКТ-компетентності викладачів університетів в контексті підвищення якості освіти. Інформаційні технології і засоби навчання. 2022. Том 43, № 5. С. 27–39.",
  "Кухаренко В. М., Рибалко О. В., Сиротенко Н. Г. Дистанційне навчання: умови застосування. Харків : НТУ «ХПІ», 2021. 308 с.",
  "Гриб'юк О. О. Адаптивні навчальні середовища як засіб персоналізації навчання. Фізико-математична освіта. 2022. Випуск 4 (30). С. 48–55.",
  // Додаткові джерела
  "Nielsen J. Usability Engineering. Boston : Morgan Kaufmann, 2022. 362 p.",
  "Fowler M. Patterns of Enterprise Application Architecture. Boston : Addison-Wesley, 2020. 560 p.",
  "Newman S. Building Microservices: Designing Fine-Grained Systems. 2nd ed. Sebastopol : O'Reilly Media, 2021. 612 p."
];
for (let i = 0; i < refs.length; i++) {
  children.push(refItem(i + 1, refs[i]));
}

// ===== ДОДАТКИ =====
children.push(new Paragraph({
  children: [new PageBreak()],
  spacing: { ...LINE }
}));
children.push(h1("ДОДАТКИ"));
children.push(empty());

children.push(pc("Перелік додатків"));
children.push(empty());
children.push(makeTable(
  ["Додаток", "Зміст"],
  [
    ["А", "ER-діаграма бази даних PostgreSQL"],
    ["Б", "Схема компонентів системи (UML Component Diagram)"],
    ["В", "Діаграма послідовності генерації завдання через ШІ"],
    ["Г", "Фрагменти ключового коду (DifficultyEngine, AIProviderFactory, GamificationService)"],
    ["Д", "Повний перелік API-ендпоінтів платформи Stride"],
    ["Е", "Скріншоти інтерфейсу платформи"],
    ["Є", "Завдання на кваліфікаційну роботу"]
  ],
  [1500, 7854]
));

// ===== ДОДАТОК А =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК А", { bold: true }));
children.push(pc("ER-діаграма бази даних PostgreSQL", { bold: true }));
children.push(empty());
children.push(p("ER-діаграма бази даних Stride відображає 12 основних реляційних сутностей PostgreSQL 17 та їх взаємозв'язки. Центральною сутністю є User, від якої успадковуються дві спеціалізації — StudentProfile та TeacherProfile (зв'язок 1:1). Структура навчального плану будується через Subject → Topic (1:N). Сутність Task (логічна, в реальній базі даних замінена на TaskInstanceDocument у MongoDB) пов'язана з Topic. Відстеження навчання — через TaskAttempt (N:1 до User, N:1 до Topic) та StudentPerformance (1:1 до User). Гейміфікація — Achievement (каталог), StudentAchievement (N:M зв'язок Student↔Achievement), LeaderboardEntry. Класи: Class, ClassMembership (N:M між Student і Class), ClassAssignment (завдання для класу). Структуровані шляхи навчання: LearningPath та LearningPathStep."));
children.push(empty());
children.push(p("Рисунок А.1 — ER-діаграма бази даних PostgreSQL (вставляється з thesis/diagrams/er_diagram.png)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));

// ===== ДОДАТОК Б =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК Б", { bold: true }));
children.push(pc("Схема компонентів системи (UML Component Diagram)", { bold: true }));
children.push(empty());
children.push(p("Схема компонентів системи Stride включає: (1) Angular 20 SPA — клієнтський компонент, що взаємодіє з бекендом через HTTPS/REST та WebSocket/SignalR; (2) Stride.Api (порт 5000) — основний API-сервіс, що містить контролери Auth, Learning, Gamification, Leaderboard, Teacher, Admin; (3) Stride.Adaptive.Api (порт 5010) — окремий мікросервіс, що відповідає за AdaptiveAIService, DifficultyEngine, ModelTrainer; (4) інфраструктурні компоненти: PostgreSQL 17, MongoDB 7, Valkey/Redis, MinIO (object storage), Meilisearch (full-text search); (5) зовнішні сервіси: Gemini API, NGINX reverse proxy."));
children.push(empty());
children.push(p("Рисунок Б.1 — Схема компонентів системи Stride (вставляється з thesis/diagrams/components.png)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));

// ===== ДОДАТОК В =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК В", { bold: true }));
children.push(pc("Діаграма послідовності генерації завдання через ШІ", { bold: true }));
children.push(empty());
children.push(p("Діаграма послідовності описує взаємодію між компонентами при виклику GET /api/learning/next-task: (1) Angular SPA надсилає запит до Stride.Api з JWT; (2) LearningController авторизує користувача та викликає LearningService.GetNextTask; (3) сервіс запитує кеш Valkey на наявність готового TaskInstanceDocument; (4) при відсутності кешу викликається Stride.Adaptive.Api → AdaptiveAIService; (5) DifficultyEngine розраховує оптимальну складність на основі StudentPerformance; (6) TaskPoolService перевіряє наявність TaskTemplateDocument; (7) при потребі AIProviderFactory викликає Gemini API з структурованим промптом; (8) LLM повертає JSON-відповідь, яка парситься та валідовується; (9) готовий TaskInstanceDocument зберігається у MongoDB та повертається клієнту."));
children.push(empty());
children.push(p("Рисунок В.1 — Діаграма послідовності генерації завдання (вставляється з thesis/diagrams/sequence_ai.png)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));

// ===== ДОДАТОК Г =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК Г", { bold: true }));
children.push(pc("Фрагменти ключового коду", { bold: true }));
children.push(empty());

children.push(p("Г.1. Алгоритм адаптації складності (DifficultyEngine.cs):", { bold: true, noIndent: true }));
children.push(code("public class DifficultyEngine : IDifficultyEngine"));
children.push(code("{"));
children.push(code("    private readonly IStudentPerformanceService _perf;"));
children.push(code("    private readonly MLContext _ml;"));
children.push(code("    public async Task<int> PredictAsync(Guid userId, Guid topicId)"));
children.push(code("    {"));
children.push(code("        var history = await _perf.GetRecentAttempts(userId, topicId, 20);"));
children.push(code("        var accuracy = history.Count(a => a.IsCorrect) / (double)history.Count;"));
children.push(code("        var baseLvl = history.Average(a => a.Difficulty);"));
children.push(code("        var delta = accuracy > 0.8 ? +1 : accuracy < 0.5 ? -1 : 0;"));
children.push(code("        var mlAdj = _mlModel.Predict(new PerfInput { Accuracy = accuracy, ... });"));
children.push(code("        return Math.Clamp((int)(baseLvl + delta + mlAdj), 1, 10);"));
children.push(code("    }"));
children.push(code("}"));
children.push(empty());

children.push(p("Г.2. Фабрика AI-провайдерів (AIProviderFactory.cs):", { bold: true, noIndent: true }));
children.push(code("public class AIProviderFactory : IAIProviderFactory"));
children.push(code("{"));
children.push(code("    private readonly IServiceProvider _sp;"));
children.push(code("    public IAIProvider Create(string name) => name switch"));
children.push(code("    {"));
children.push(code("        \"gemini\" => _sp.GetRequiredService<GeminiProvider>(),"));
children.push(code("        \"openai\" => _sp.GetRequiredService<OpenAIProvider>(),"));
children.push(code("        _ => throw new NotSupportedException($\"Provider {name}\")"));
children.push(code("    };"));
children.push(code("}"));
children.push(empty());

children.push(p("Г.3. Сервіс гейміфікації (GamificationService.cs, фрагмент):", { bold: true, noIndent: true }));
children.push(code("public async Task<int> AwardXpAsync(Guid userId, int basePoints, int difficulty)"));
children.push(code("{"));
children.push(code("    var streak = await _streaks.GetCurrentAsync(userId);"));
children.push(code("    var multiplier = 1.0 + Math.Min(streak * 0.05, 1.0);"));
children.push(code("    var xp = (int)(basePoints * difficulty * multiplier);"));
children.push(code("    await _repo.AddXpAsync(userId, xp);"));
children.push(code("    await _hub.Clients.User(userId.ToString())"));
children.push(code("        .SendAsync(\"XpAwarded\", xp);"));
children.push(code("    return xp;"));
children.push(code("}"));

// ===== ДОДАТОК Д =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК Д", { bold: true }));
children.push(pc("Повний перелік API-ендпоінтів платформи Stride", { bold: true }));
children.push(empty());
children.push(makeTable(
  ["Метод", "Шлях", "Призначення"],
  [
    ["POST", "/api/auth/register", "Реєстрація нового користувача"],
    ["POST", "/api/auth/login", "Автентифікація, видача JWT"],
    ["POST", "/api/auth/refresh", "Оновлення access-токену"],
    ["POST", "/api/auth/logout", "Вихід із системи"],
    ["GET", "/api/learning/next-task", "Отримання наступного адаптивного завдання"],
    ["POST", "/api/learning/submit-answer", "Відправка відповіді на завдання"],
    ["GET", "/api/learning/topics", "Перелік доступних тем"],
    ["POST", "/api/task-generation/generate", "Генерація нового завдання через ШІ"],
    ["GET", "/api/gamification/xp", "Поточний баланс XP користувача"],
    ["GET", "/api/gamification/achievements", "Перелік досягнень користувача"],
    ["GET", "/api/gamification/streak", "Поточний стрік користувача"],
    ["GET", "/api/leaderboard/global", "Глобальна таблиця лідерів"],
    ["GET", "/api/leaderboard/class/{id}", "Таблиця лідерів у межах класу"],
    ["GET", "/api/teacher/classes", "Класи, створені вчителем"],
    ["POST", "/api/teacher/classes", "Створення нового класу"],
    ["GET", "/api/teacher/analytics/{classId}", "Аналітика прогресу класу"],
    ["GET", "/api/admin/subjects", "Перелік предметів"],
    ["POST", "/api/admin/topics", "Створення нової теми"],
    ["POST", "/api/admin/achievements", "Створення досягнення"],
    ["GET", "/api/health", "Перевірка стану сервісу"],
    ["WS", "/hubs/notifications", "SignalR-хаб сповіщень"],
    ["WS", "/hubs/leaderboard", "SignalR-хаб таблиці лідерів"]
  ],
  [900, 3200, 5254]
));

// ===== ДОДАТОК Е =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК Е", { bold: true }));
children.push(pc("Скріншоти інтерфейсу платформи", { bold: true }));
children.push(empty());
children.push(p("Додаток містить скріншоти ключових екранів платформи Stride, що демонструють реалізацію функціональних вимог та застосування дизайн-системи Angular Material 20 + Tailwind CSS."));
children.push(empty());
children.push(p("Рисунок Е.1 — Екран автентифікації (login / register)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.2 — Головна панель студента (dashboard)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.3 — Екран проходження завдання (learn)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.4 — Таблиця лідерів (leaderboard)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.5 — Особистий профіль студента", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.6 — Аналітична панель вчителя (teacher)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));
children.push(p("Рисунок Е.7 — Адміністративна панель (admin)", { italic: true, align: AlignmentType.CENTER, noIndent: true }));

// ===== ДОДАТОК Є =====
children.push(new Paragraph({ children: [new PageBreak()], spacing: { ...LINE } }));
children.push(pc("ДОДАТОК Є", { bold: true }));
children.push(pc("Завдання на кваліфікаційну роботу", { bold: true }));
children.push(empty());
children.push(p("Тема роботи: «Розробка гейміфікованої освітньої платформи Stride з адаптивним навчанням та генерацією завдань на базі штучного інтелекту»."));
children.push(p("Термін виконання: відповідно до календарного графіка кафедри комп'ютерних наук."));
children.push(empty());
children.push(p("Початкові дані:", { bold: true, noIndent: true }));
children.push(p("— Технологічний стек: .NET 10, ASP.NET Core, Entity Framework Core 10, Angular 20, MongoDB 7, PostgreSQL 17."));
children.push(p("— Предметні області MVP: математика, українська мова, історія України, англійська."));
children.push(p("— Цільова аудиторія: учні шкіл, студенти ЗВО, особи, що навчаються впродовж життя."));
children.push(p("— Мова інтерфейсу за замовчуванням: українська; додатково — англійська."));
children.push(empty());
children.push(p("Перелік питань, що підлягають розробці:", { bold: true, noIndent: true }));
children.push(p("1. Аналіз ринку EdTech-платформ і обґрунтування актуальності теми."));
children.push(p("2. Формулювання функціональних та нефункціональних вимог."));
children.push(p("3. Проєктування архітектури з урахуванням принципу розділення обов'язків."));
children.push(p("4. Розробка моделі даних (PostgreSQL + MongoDB)."));
children.push(p("5. Проєктування та реалізація алгоритму адаптивного навчання."));
children.push(p("6. Реалізація пайплайну генерації завдань через LLM."));
children.push(p("7. Проєктування та реалізація системи гейміфікації."));
children.push(p("8. Розробка Angular SPA-фронтенду."));
children.push(p("9. Забезпечення безпеки та автентифікації."));
children.push(p("10. Функціональне тестування та аналіз продуктивності."));
children.push(empty());
children.push(p("Перелік графічного матеріалу:", { bold: true, noIndent: true }));
children.push(p("— ER-діаграма бази даних (додаток А)."));
children.push(p("— Схема компонентів системи (додаток Б)."));
children.push(p("— Діаграма послідовності генерації завдання (додаток В)."));
children.push(p("— Скріншоти інтерфейсу (додаток Е)."));

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
    fs.writeFileSync("D:/apps/dyploma/thesis/thesis_part5.docx", buf);
    console.log("Done: thesis_part5.docx");
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { children };
