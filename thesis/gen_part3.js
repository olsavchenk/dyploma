const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageBreak, BorderStyle, WidthType, ShadingType,
  Footer, PageNumber, LineRuleType
} = require('docx');
const fs = require('fs');

const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN_TOP = 1134, MARGIN_BOTTOM = 1134, MARGIN_LEFT = 1701, MARGIN_RIGHT = 851;

const FONT = "Times New Roman";
const SIZE = 28;
const SIZE_SM = 24;
const LINE = { line: 360, lineRule: LineRuleType.AUTO };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 708 },
    spacing: { ...LINE, before: 0, after: 0 },
    children: [new TextRun({ text, font: FONT, size: opts.size || SIZE, bold: opts.bold||false, italics: opts.italic||false })]
  });
}
function pc(text, opts={}) { return p(text, { ...opts, align: AlignmentType.CENTER, noIndent: true }); }
function pl(text, opts={}) { return p(text, { ...opts, align: AlignmentType.LEFT, noIndent: true }); }
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

const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, w, opts={}) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: opts.header ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      spacing: LINE,
      children: [new TextRun({ text, font: FONT, size: SIZE_SM, bold: opts.bold||false })]
    })]
  });
}

function makeTable(headers, rows, colW) {
  return new Table({
    width: { size: colW.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h,i) => cell(h, colW[i], { header:true, bold:true, center:true })) }),
      ...rows.map(r => new TableRow({ children: r.map((c,i) => cell(c, colW[i])) }))
    ]
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: LINE,
    indent: { firstLine: 0 },
    children: [new TextRun({ text, font: FONT, size: SIZE_SM, bold: true })]
  });
}

// Code-style paragraph (monospace)
function code(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, lineRule: LineRuleType.AUTO },
    indent: { firstLine: 0, left: 720 },
    children: [new TextRun({ text, font: "Courier New", size: SIZE_SM })]
  });
}

// ===================== РОЗДІЛ 2 =====================
const children = [];

children.push(h1("РОЗДІЛ 2"));
children.push(h1("ПРОЄКТУВАННЯ СИСТЕМИ"));
children.push(empty());

// 2.1
children.push(h2("2.1 Загальна архітектура платформи"));
children.push(p(
  "Архітектура платформи Stride побудована за шаровим монолітним принципом з чітким розділенням відповідальностей між рівнями: рівень представлення (Angular SPA), рівень бізнес-логіки (ASP.NET Core API) та рівень доступу до даних (EF Core + MongoDB Driver). При цьому адаптивний модуль виокремлено в окремий сервіс (Stride.Adaptive.Api), що спрощує незалежне масштабування ресурсомістких операцій генерації завдань."
));
children.push(empty());
children.push(p(
  "Платформа складається з таких основних компонентів (рис. 2.1):"
));

const archItems = [
  "Angular 20 SPA (порт 4200) — прогресивний веб-додаток з підтримкою офлайн-режиму через Service Worker;",
  "Stride.Api (порт 5000) — основний REST API на ASP.NET Core 10, обслуговує всі запити фронтенду;",
  "Stride.Adaptive.Api (порт 5010) — окремий мікросервіс для генерації завдань і адаптивної логіки;",
  "PostgreSQL 17 — реляційна СУБД для зберігання структурованих даних (користувачі, спроби, гейміфікація);",
  "MongoDB 7 — документна СУБД для шаблонів завдань, екземплярів завдань та журналів генерації ШІ;",
  "Valkey (Redis-сумісний) — кешування та зберігання стану гейміфікації;",
  "MinIO — S3-сумісне об'єктне сховище для аватарів та медіафайлів;",
  "Meilisearch — повнотекстовий пошук по предметах і темах;",
  "NGINX — зворотний проксі для маршрутизації трафіку."
];
for (let i=0; i<archItems.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i+1}) ${archItems[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "Взаємодія між компонентами відбувається таким чином: Angular-клієнт надсилає HTTP-запити до Stride.Api через NGINX. Основний API звертається до PostgreSQL через EF Core та до MongoDB через офіційний драйвер MongoDB.Driver 3.6. Для завдань, що вимагають генерації або адаптивної логіки, Stride.Api проксіює запити до Stride.Adaptive.Api, який у свою чергу звертається до Google Gemini API. Реальний час забезпечується SignalR-хабами безпосередньо у Stride.Api (/hubs/notifications та /hubs/leaderboard)."
));
children.push(empty());

children.push(caption("Таблиця 2.1 — Проєкти рішення та їх відповідальність"));
children.push(makeTable(
  ["Проєкт", "Тип", "Відповідальність"],
  [
    ["Stride.Api",          "Web API",  "Контролери, Middleware, SignalR хаби, точка входу"],
    ["Stride.Services",     "Library",  "Бізнес-логіка: AuthService, LearningService, GamificationService"],
    ["Stride.Adaptive",     "Library",  "AI-логіка: AdaptiveAIService, DifficultyEngine, ModelTrainer"],
    ["Stride.Adaptive.Api", "Web API",  "HTTP-фасад над Stride.Adaptive, порт 5010"],
    ["Stride.Core",         "Library",  "Доменні сутності PostgreSQL та MongoDB-документи"],
    ["Stride.DataAccess",   "Library",  "EF Core DbContext, MongoDB контекст, репозиторії"],
  ],
  [2800, 1600, 4954]
));
children.push(empty());

// 2.2
children.push(h2("2.2 Модель даних"));
children.push(p(
  "Для зберігання різнорідних даних платформи Stride використовується полігльотне сховище: PostgreSQL для реляційних структурованих даних та MongoDB для документів зі змінною схемою. Такий підхід дозволяє оптимально використати переваги кожного типу СУБД."
));
children.push(empty());

children.push(p("PostgreSQL (EF Core 10) містить такі основні сутності:", { noIndent: true }));
children.push(empty());

children.push(caption("Таблиця 2.2 — Основні сутності PostgreSQL"));
children.push(makeTable(
  ["Сутність", "Ключові поля", "Призначення"],
  [
    ["User",             "Id, Email, PasswordHash, Role, CreatedAt",                       "Автентифікація та базовий профіль"],
    ["StudentProfile",   "UserId, XP, Level, Streak, LastActiveDate",                      "Гейміфікаційний профіль студента"],
    ["TeacherProfile",   "UserId, Department, Bio",                                        "Профіль викладача"],
    ["Subject",          "Id, Name, Description, IsActive",                                "Навчальні предмети (математика тощо)"],
    ["Topic",            "Id, SubjectId, Name, DifficultyLevel, Order",                    "Теми в межах предмету"],
    ["TaskAttempt",      "Id, StudentId, TopicId, IsCorrect, TimeTaken, DifficultyLevel",  "Спроби виконання завдань"],
    ["StudentPerformance","StudentId, TopicId, SuccessRate, AttemptsCount, AvgTime",       "Агрегована успішність"],
    ["Achievement",      "Id, Name, Condition, XPReward, BadgeImageUrl",                  "Визначення досягнень"],
    ["StudentAchievement","StudentId, AchievementId, EarnedAt",                           "Отримані досягнення"],
    ["LeaderboardEntry", "Id, StudentId, SubjectId, Score, Rank, UpdatedAt",               "Рядок таблиці лідерів"],
    ["Class",            "Id, TeacherId, Name, JoinCode",                                  "Клас викладача"],
    ["LearningPath",     "Id, StudentId, SubjectId, CurrentStepIndex",                     "Персональний навчальний шлях"],
  ],
  [2600, 3600, 3154]
));
children.push(empty());

children.push(p(
  "MongoDB зберігає документи з динамічною структурою, що не придатні для реляційного представлення:"
));
children.push(empty());

children.push(caption("Таблиця 2.3 — Документи MongoDB"));
children.push(makeTable(
  ["Колекція", "Ключові поля", "Призначення"],
  [
    ["task_templates",  "TopicId, DifficultyLevel, QuestionText, Options, CorrectAnswer, Explanation, UseCount", "Шаблони завдань від ШІ, повторно використовуються"],
    ["task_instances",  "TemplateId, StudentId, PersonalizedText, GeneratedAt",                                   "Конкретні екземпляри завдань із можливою персоналізацією"],
    ["ai_generation_logs","ProviderId, Prompt, Response, LatencyMs, TokensUsed, Success, Timestamp",              "Журнал всіх звернень до LLM"],
  ],
  [2400, 4000, 2954]
));
children.push(empty());

children.push(p(
  "Зв'язок між реляційними та документними даними здійснюється через ідентифікатори: поле TopicId у TaskTemplateDocument відповідає первинному ключу сутності Topic у PostgreSQL. Такий підхід забезпечує цілісність даних без застосування складних cross-database транзакцій."
));
children.push(empty());

// 2.3
children.push(h2("2.3 Алгоритм адаптивного навчання"));
children.push(p(
  "Центральним компонентом адаптивної підсистеми є DifficultyEngine — рушій, що на основі агрегованої статистики студента обчислює оптимальний рівень складності наступного завдання. Алгоритм реалізовано у вигляді детермінованої логіки з можливістю заміни на ML-модель після накопичення достатньої кількості даних."
));
children.push(empty());

children.push(p("Алгоритм роботи DifficultyEngine (рис. 2.2) складається з таких кроків:"));
const algoSteps = [
  "Отримання StudentPerformance для поточної теми (SuccessRate, AttemptsCount, AvgTimeSec).",
  "Якщо AttemptsCount < 3 — повернути базовий рівень складності теми (Topic.DifficultyLevel).",
  "Якщо SuccessRate > 0.8 та AvgTimeSec < порогу — підвищити рівень (min(currentLevel + 1, 5)).",
  "Якщо SuccessRate < 0.5 — знизити рівень (max(currentLevel − 1, 1)).",
  "В іншому випадку — зберегти поточний рівень.",
  "Повернути цільовий рівень складності TaskPoolService для вибору або генерації завдання."
];
for (let i=0; i<algoSteps.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i+1}. ${algoSteps[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "ML.NET-модель слугує альтернативою детермінованій логіці для студентів, що мають достатньо даних в системі. Модель навчається на парах (StudentPerformance → оптимальна складність) і використовує алгоритм бінарної класифікації FastTree. Компонент ModelTrainer запускається щотижня через механізм IHostedService і зберігає нову модель у файлову систему для безшовного завантаження без перезапуску сервісу."
));
children.push(empty());

children.push(p(
  "Навчальний шлях (LearningPath) формується автоматично при першій активації студентом певного предмету. Алгоритм будує послідовність тем відповідно до поля Order сутності Topic та початково встановленого рівня складності. Після кожного виконаного завдання CurrentStepIndex оновлюється залежно від успішності — студент просувається вперед або повторює поточну тему."
));
children.push(empty());

// 2.4
children.push(h2("2.4 Пайплайн генерації завдань через штучний інтелект"));
children.push(p(
  "Генерація навчальних завдань є ключовою функціональністю платформи Stride. Пайплайн спроєктовано з урахуванням двох пріоритетів: мінімізація кількості дорогих API-запитів до LLM та забезпечення варіативності завдань для уникнення повторень."
));
children.push(empty());

children.push(p("Пайплайн генерації завдання (рис. 2.3) включає такі етапи:"));
const pipeSteps = [
  "LearningController отримує запит GET /api/learning/task?topicId={id}.",
  "DifficultyEngine обчислює цільовий рівень складності для студента.",
  "TaskPoolService перевіряє MongoDB: чи є невикористаний шаблон потрібного рівня для даної теми.",
  "Якщо шаблон знайдено — повертається TaskInstanceDocument на основі шаблону (cache hit).",
  "Якщо шаблону немає — AdaptiveAIService формує промпт і звертається до GeminiProvider.",
  "GeminiProvider надсилає запит до Google Gemini API та отримує JSON-відповідь.",
  "Відповідь парситься та валідується; результат зберігається як TaskTemplateDocument у MongoDB.",
  "Подія генерації логується в AIGenerationLogDocument.",
  "LearningController повертає TaskInstanceDocument клієнту."
];
for (let i=0; i<pipeSteps.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i+1}. ${pipeSteps[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "Промпт для генерації формується динамічно і містить: назву теми, цільовий рівень складності (1–5), тип завдання (multiple_choice / open_answer / fill_in_the_blank), мову генерації (українська) та вимогу до формату відповіді (JSON зі полями question, options, correctAnswer, explanation). Таке структуроване завдання моделі суттєво знижує ймовірність помилок парсингу."
));
children.push(empty());

children.push(p(
  "Патерн AIProviderFactory реалізовано через інтерфейс IAIProvider з єдиним методом GenerateTaskAsync(prompt). Поточна реалізація — GeminiProvider, що використовує HTTP-клієнт для звернення до REST API Gemini. Для підключення нового постачальника достатньо реалізувати інтерфейс і зареєструвати новий провайдер у DI-контейнері, не змінюючи жодного іншого класу."
));
children.push(empty());

// 2.5
children.push(h2("2.5 Система гейміфікації"));
children.push(p(
  "GamificationService є центральним компонентом підсистеми гейміфікації. Він викликається автоматично після кожної зафіксованої спроби StudentAttempt і виконує такі операції:"
));
const gamOps = [
  "Нарахування XP: базова кількість XP обчислюється за формулою XP = DifficultyLevel × 10 × (1 + speedBonus), де speedBonus = max(0, 1 − TimeTaken / MaxTime);",
  "Оновлення стріку: якщо поточна дата відрізняється від LastActiveDate на 1 день — Streak інкрементується; якщо більше — скидається до 1; якщо той самий день — стрік не змінюється;",
  "Перевірка тригерів досягнень: після кожного оновлення профілю перевіряються умови всіх незаробленних Achievement; при виконанні умови — запис StudentAchievement та нарахування XPReward;",
  "Оновлення LeaderboardEntry: агрегований Score (сума XP) студента оновлюється в таблиці лідерів;",
  "Публікація SignalR-події через LeaderboardHub: всі підключені клієнти отримують оновлений рядок таблиці лідерів у реальному часі."
];
for (let i=0; i<gamOps.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i+1}) ${gamOps[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "Таблиця лідерів підтримує два режими: глобальний (всі студенти платформи) та класовий (лише члени одного класу). Valkey (Redis-сумісний кеш) використовується для зберігання топ-100 записів таблиці лідерів, що забезпечує відповідь на запит рейтингу за O(log n) без звернення до PostgreSQL."
));
children.push(empty());

// 2.6
children.push(h2("2.6 Архітектура Angular-фронтенду"));
children.push(p(
  "Фронтенд платформи Stride реалізовано як прогресивний веб-додаток (PWA) на Angular 20 із застосуванням концепції zoneless-архітектури та standalone-компонентів. Відмова від Zone.js на користь Angular Signals суттєво покращує продуктивність рендерингу та спрощує відладку."
));
children.push(empty());

children.push(p("Структура Angular-застосунку організована за feature-модульним підходом:"));
children.push(empty());

children.push(caption("Таблиця 2.4 — Структура Angular feature-модулів"));
children.push(makeTable(
  ["Модуль / Шлях", "Роль", "Основні компоненти"],
  [
    ["auth (/auth)",             "Публічний",    "LoginComponent, RegisterComponent"],
    ["dashboard (/dashboard)",   "Student",      "XP-бар, стрік, останні результати, рекомендовані теми"],
    ["learn (/learn)",           "Student",      "SubjectListComponent, TopicDetailComponent, TaskCardComponent, AnswerFormComponent"],
    ["leaderboard (/leaderboard)","Student",     "LeaderboardTableComponent (SignalR-підписка)"],
    ["profile (/profile)",       "Student",      "ProfileEditComponent, AchievementBadgesComponent"],
    ["teacher (/teacher)",       "Teacher",      "ClassManagementComponent, StudentAnalyticsComponent"],
    ["admin (/admin)",           "Admin",        "SubjectCrudComponent, TopicCrudComponent, AchievementCrudComponent"],
  ],
  [2600, 1600, 5154]
));
children.push(empty());

children.push(p(
  "Маршрутизація реалізована через lazy loading: кожен feature-модуль завантажується лише при першому переході на відповідний маршрут. Це суттєво скорочує Initial Bundle Size та прискорює початкове завантаження."
));
children.push(empty());

children.push(p(
  "Стан автентифікації управляється через Angular Signals у сервісі AuthService без застосування NgRx Store. Сигнал currentUser$ є джерелом правди для всіх компонентів, що залежать від стану авторизації. Гарди authGuard, roleGuard та publicOnlyGuard захищають маршрути на основі поточного значення сигналу."
));
children.push(empty());

children.push(p(
  "HTTP-інтерцептор AuthInterceptor автоматично додає заголовок Authorization: Bearer {accessToken} до кожного запиту, а також обробляє відповідь 401 Unauthorized — автоматично оновлює access token через refresh-ендпоінт і повторює початковий запит. ErrorInterceptor перехоплює всі мережеві помилки та відображає зрозумілі повідомлення через Angular Material Snackbar."
));
children.push(empty());

children.push(p(
  "Інтернаціоналізація реалізована за допомогою @ngx-translate: українська мова є мовою за замовчуванням, а перемикання на англійську відбувається динамічно без перезавантаження сторінки. Переклади зберігаються у JSON-файлах у папці assets/i18n/."
));
children.push(empty());

// 2.7
children.push(h2("2.7 Безпека та автентифікація"));
children.push(p(
  "Система безпеки платформи Stride побудована на основі JWT (JSON Web Tokens) із поділом на короткотривалий access token та довготривалий refresh token. Такий підхід забезпечує баланс між безпекою та зручністю використання."
));
children.push(empty());

children.push(p("Схема автентифікації реалізована таким чином:"));
const authSteps = [
  "Клієнт надсилає POST /api/auth/login з credentials (email + password).",
  "AuthService перевіряє credentials, генерує access token (термін дії: 15 хвилин) та refresh token (7 днів).",
  "Access token повертається у тілі JSON-відповіді та зберігається у пам'яті браузера (JavaScript variable).",
  "Refresh token встановлюється у HttpOnly cookie (недоступний для JavaScript — захист від XSS).",
  "При закінченні терміну дії access token — AuthInterceptor автоматично викликає POST /api/auth/refresh.",
  "При виході — POST /api/auth/logout анулює refresh token у базі даних."
];
for (let i=0; i<authSteps.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: LINE,
    children: [new TextRun({ text: `${i+1}. ${authSteps[i]}`, font: FONT, size: SIZE })]
  }));
}
children.push(empty());

children.push(p(
  "Рольова модель доступу (RBAC) реалізована через атрибут [Authorize(Roles = \"...\")] на рівні контролерів ASP.NET Core. Роль включається у JWT-клейм і перевіряється на кожному захищеному ендпоінті. Валідація вхідних даних здійснюється через FluentValidation: кожен DTO має відповідний валідатор, який перевіряється автоматично через ActionFilter до виконання дії контролера."
));
children.push(empty());

children.push(p(
  "Захист від CSRF-атак забезпечується тим, що HttpOnly cookie з refresh token не передається автоматично при cross-origin запитах завдяки атрибуту SameSite=Strict. CORS налаштований на дозвіл лише з довіреного домену Angular-клієнта. Усі паролі зберігаються у вигляді хешів BCrypt (work factor 12) без можливості відновлення."
));
children.push(empty());

// Висновки
children.push(h2("Висновки до розділу 2"));
children.push(p(
  "У другому розділі спроєктовано комплексну архітектуру платформи Stride. Визначено та обґрунтовано шарову монолітну архітектуру з виокремленим адаптивним мікросервісом (Stride.Adaptive.Api), що забезпечує незалежне масштабування ресурсомістких операцій генерації завдань."
));
children.push(empty());
children.push(p(
  "Розроблено модель даних полігльотного сховища: PostgreSQL з 12 основними сутностями для реляційних даних та MongoDB з трьома колекціями для документів зі змінною схемою. Спроєктовано алгоритм DifficultyEngine з детермінованою логікою адаптації та ML.NET-моделлю для студентів зі значним обсягом накопичених даних."
));
children.push(empty());
children.push(p(
  "Описано дев'ятиетапний пайплайн генерації завдань через Gemini API з механізмом кешування у TaskPoolService та патерном AIProviderFactory для незалежної заміни LLM-постачальника. Спроєктовано систему гейміфікації з реальним часом через SignalR, Angular 20 frontend з lazy-loaded модулями та сигнал-базованим станом, а також систему безпеки на основі JWT + HttpOnly cookie та RBAC."
));

// BUILD
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
    fs.writeFileSync("D:/apps/dyploma/thesis/thesis_part3.docx", buf);
    console.log("Done: thesis_part3.docx");
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { children };
