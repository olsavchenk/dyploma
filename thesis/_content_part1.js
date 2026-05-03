const children = [];

// ===== ТИТУЛЬНИЙ АРКУШ =====
children.push(pc("МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ", { bold: true }));
children.push(pc("ПОЛІСЬКИЙ НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ", { bold: true }));
children.push(empty());
children.push(pc("Факультет інформаційних технологій та комп'ютерної інженерії", {}));
children.push(pc("Кафедра комп'ютерних наук та інформаційних технологій", {}));
children.push(empty());
children.push(empty());

children.push(new Paragraph({
  alignment: AlignmentType.RIGHT,
  indent: { firstLine: 0 },
  spacing: { line: 360, lineRule: LineRuleType.AUTO },
  children: [
    new TextRun({ text: "До захисту допускається", font: FONT, size: SIZE }),
  ]
}));
children.push(new Paragraph({
  alignment: AlignmentType.RIGHT,
  indent: { firstLine: 0 },
  spacing: { line: 360, lineRule: LineRuleType.AUTO },
  children: [
    new TextRun({ text: "Завідувач кафедри __________ ___________", font: FONT, size: SIZE }),
  ]
}));
children.push(new Paragraph({
  alignment: AlignmentType.RIGHT,
  indent: { firstLine: 0 },
  spacing: { line: 360, lineRule: LineRuleType.AUTO },
  children: [
    new TextRun({ text: "«___» ________________ 2026 р.", font: FONT, size: SIZE }),
  ]
}));
children.push(empty());
children.push(empty());

children.push(pc("КВАЛІФІКАЦІЙНА РОБОТА", { bold: true }));
children.push(pc("на здобуття освітнього ступеня «Бакалавр»", {}));
children.push(pc("за спеціальністю 122 «Комп'ютерні науки»", {}));
children.push(empty());
children.push(pc("на тему:", { bold: true }));
children.push(pc("«РОЗРОБКА ГЕЙМІФІКОВАНОЇ ОСВІТНЬОЇ ПЛАТФОРМИ", { bold: true }));
children.push(pc("З АДАПТИВНИМ НАВЧАННЯМ НА ОСНОВІ ШТУЧНОГО ІНТЕЛЕКТУ»", { bold: true }));
children.push(empty());
children.push(empty());

// Author and supervisor block
const infoBlock = [
  { label: "Виконав:", value: "студент IV курсу, групи КН-41", extra: "" },
  { label: "", value: "Савченко Олександр Романович", extra: "" },
  { label: "Науковий керівник:", value: "к.т.н., доцент", extra: "" },
  { label: "", value: "Ковальчук Майя Олегівна", extra: "" },
];

for (const row of infoBlock) {
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { firstLine: 0, left: 5000 },
    spacing: { line: 360, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({ text: row.label ? row.label + " " : "   ", font: FONT, size: SIZE, bold: !!row.label }),
      new TextRun({ text: row.value, font: FONT, size: SIZE }),
    ]
  }));
}

children.push(empty());
children.push(empty());
children.push(pc("Житомир — 2026", { bold: true }));

// Page break after title
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== АНОТАЦІЯ (UKRAINIAN) =====
children.push(heading1("АНОТАЦІЯ"));
children.push(empty());

children.push(p(
  "Савченко О. Р. Розробка гейміфікованої освітньої платформи з адаптивним навчанням на основі штучного інтелекту. — Кваліфікаційна робота бакалавра за спеціальністю 122 «Комп'ютерні науки». Поліський національний університет, Житомир, 2026.",
  { italic: true }
));
children.push(empty());

children.push(p(
  "Кваліфікаційна робота присвячена розробці та реалізації гейміфікованої освітньої платформи Stride, яка використовує методи штучного інтелекту для адаптивного навчання та динамічної генерації навчальних завдань."
));
children.push(empty());

children.push(p(
  "Метою роботи є проєктування і реалізація веб-платформи, що динамічно генерує навчальні завдання за допомогою великих мовних моделей (Google Gemini API) та калібрує їх складність відповідно до індивідуального прогресу кожного студента на базі ML.NET. Платформа орієнтована на україномовну аудиторію та охоплює предмети: математика, українська мова, історія України, англійська мова."
));
children.push(empty());

children.push(p(
  "У роботі проведено порівняльний аналіз існуючих EdTech-платформ (Duolingo, Khan Academy, Moodle, Coursera), обґрунтовано потребу в комплексному україномовному рішенні. Спроєктовано шарову архітектуру на базі ASP.NET Core 10 з двома API-сервісами (основний на порту 5000 та адаптивний на порту 5010), Angular 20 фронтендом, PostgreSQL та MongoDB як сховищами даних. Реалізовано рушій адаптації складності, систему гейміфікації (XP, стріки, досягнення, таблиця лідерів у реальному часі через SignalR) та прогресивний веб-додаток із підтримкою офлайн-режиму."
));
children.push(empty());

children.push(p(
  "Практична цінність роботи полягає в готовому MVP-рішенні, придатному для розгортання у закладах освіти, з відкритою архітектурою для подальшого масштабування та інтеграції додаткових предметів і провайдерів ШІ."
));
children.push(empty());

children.push(p(
  "Обсяг роботи: основний текст — 22 сторінки, 7 рисунків, 8 таблиць, список джерел — 42 позиції, 7 додатків."
));
children.push(empty());

children.push(p(
  "Ключові слова: адаптивне навчання, гейміфікація, штучний інтелект, освітня платформа, Angular, ASP.NET Core, генерація завдань, PostgreSQL, MongoDB, EdTech, ML.NET, Gemini API.",
  { bold: false, italic: true }
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== АНОТАЦІЯ (ENGLISH) =====
children.push(heading1("ABSTRACT"));
children.push(empty());

children.push(p(
  "Savchenko O. R. Development of a Gamified Educational Platform with Adaptive Learning Based on Artificial Intelligence. — Bachelor's qualification thesis, specialty 122 «Computer Science». Polissia National University, Zhytomyr, 2026.",
  { italic: true }
));
children.push(empty());

children.push(p(
  "The qualification thesis is devoted to the design and implementation of the gamified educational platform Stride, which employs artificial intelligence methods for adaptive learning and dynamic generation of educational tasks."
));
children.push(empty());

children.push(p(
  "The objective of the thesis is to design and implement a web platform that dynamically generates learning tasks using large language models (Google Gemini API) and calibrates task difficulty according to each student's individual progress using ML.NET. The platform targets a Ukrainian-speaking audience and covers the following subjects: Mathematics, Ukrainian Language, History of Ukraine, and English."
));
children.push(empty());

children.push(p(
  "The thesis includes a comparative analysis of existing EdTech platforms (Duolingo, Khan Academy, Moodle, Coursera) and substantiates the need for a comprehensive Ukrainian-language solution. A layered architecture is designed using ASP.NET Core 10 with two API services (main on port 5000 and adaptive on port 5010), an Angular 20 frontend, PostgreSQL and MongoDB as data stores. The adaptive difficulty engine, gamification system (XP, streaks, achievements, real-time leaderboard via SignalR), and a progressive web application with offline support are implemented."
));
children.push(empty());

children.push(p(
  "The practical value of the work lies in a ready-to-deploy MVP solution suitable for educational institutions, with an open architecture for further scaling and integration of additional subjects and AI providers."
));
children.push(empty());

children.push(p(
  "Thesis scope: main text — 22 pages, 7 figures, 8 tables, reference list — 42 entries, 7 appendices."
));
children.push(empty());

children.push(p(
  "Keywords: adaptive learning, gamification, artificial intelligence, educational platform, Angular, ASP.NET Core, task generation, PostgreSQL, MongoDB, EdTech, ML.NET, Gemini API.",
  { italic: true }
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== ВСТУП =====
children.push(heading1("ВСТУП"));
children.push(empty());

children.push(heading2("Актуальність теми"));

children.push(p(
  "Сучасний освітній простір зазнає кардинальних трансформацій під впливом цифровізації та стрімкого розвитку технологій штучного інтелекту. Пандемія COVID-19 прискорила перехід до дистанційного навчання і виявила суттєві недоліки традиційних освітніх платформ: відсутність персоналізованого підходу, статичний зміст, низьку мотивацію учасників та неможливість автоматичної адаптації складності матеріалу до рівня конкретного студента."
));
children.push(empty());

children.push(p(
  "Аналіз ринку EdTech-платформ свідчить про те, що більшість широко відомих рішень — Duolingo, Khan Academy, Moodle, Coursera — мають вузьку предметну спеціалізацію або пропонують лише статичний каталог завдань без динамічної адаптації. Жодне з наявних рішень не поєднує в собі: україномовний інтерфейс, динамічну генерацію завдань засобами великих мовних моделей, адаптацію складності на базі машинного навчання та комплексну систему гейміфікації для підтримки мотивації."
));
children.push(empty());

children.push(p(
  "Особливої актуальності набуває потреба у власній українській освітній платформі в умовах воєнного часу, коли мільйони школярів і студентів навчаються у дистанційному або змішаному форматі. Відсутність якісного україномовного адаптивного інструменту — це прогалина, яку і покликана заповнити платформа Stride."
));
children.push(empty());

children.push(p(
  "Поєднання трьох ключових технологічних тенденцій — великих мовних моделей (LLM), адаптивного навчання на основі теорії відповіді на завдання (Item Response Theory) та гейміфікації — дає змогу створити принципово новий тип освітнього інструменту. Саме таке поєднання і реалізовано в платформі Stride."
));
children.push(empty());

children.push(heading2("Мета і завдання роботи"));

children.push(p(
  "Метою кваліфікаційної роботи є розробка та реалізація гейміфікованої освітньої платформи Stride з адаптивною системою навчання, що динамічно генерує завдання за допомогою штучного інтелекту та калібрує їх складність відповідно до індивідуального прогресу студента."
));
children.push(empty());

children.push(p("Для досягнення поставленої мети визначено такі завдання:"));

const tasks = [
  "проаналізувати існуючі EdTech-рішення та виявити їх переваги й недоліки;",
  "дослідити теоретичні засади адаптивного навчання та методи гейміфікації в освіті;",
  "спроєктувати архітектуру платформи з виокремленим адаптивним модулем;",
  "реалізувати систему генерації навчальних завдань через Google Gemini API;",
  "розробити рушій адаптації складності на базі ML.NET із щотижневим перенавчанням моделі;",
  "реалізувати систему гейміфікації: XP, стріки, досягнення, таблицю лідерів у реальному часі;",
  "розробити Angular 20 інтерфейс для ролей студента, викладача та адміністратора;",
  "провести тестування основних функціональних сценаріїв платформи."
];

for (let i = 0; i < tasks.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708, left: 0 },
    spacing: { line: 360, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({ text: `${i + 1}) ${tasks[i]}`, font: FONT, size: SIZE })
    ]
  }));
}

children.push(empty());

children.push(heading2("Об'єкт та предмет дослідження"));

children.push(p(
  "Об'єктом дослідження є веб-платформа для дистанційного навчання з елементами гейміфікації та адаптивним управлінням складністю навчального контенту."
));
children.push(empty());

children.push(p(
  "Предметом дослідження є методи адаптивного навчання, алгоритми генерації навчальних завдань на основі великих мовних моделей та механізми гейміфікації для підвищення мотивації в освітніх системах."
));
children.push(empty());

children.push(heading2("Методи дослідження"));

children.push(p(
  "У процесі виконання кваліфікаційної роботи використано такі методи дослідження:"
));
children.push(empty());

const methods = [
  "порівняльний аналіз — для дослідження та оцінювання існуючих EdTech-платформ;",
  "методи машинного навчання (ML.NET) — для побудови моделі передбачення складності завдань;",
  "генерація природною мовою (LLM, Google Gemini API) — для автоматичної генерації навчального контенту;",
  "об'єктно-орієнтоване та компонентне проєктування — для розробки архітектури системи;",
  "метод прототипування (MVP-підхід) — для ітеративної розробки та валідації рішень;",
  "інтеграційне тестування та E2E-тестування через Playwright — для перевірки коректності роботи платформи."
];

for (let i = 0; i < methods.length; i++) {
  children.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 708 },
    spacing: { line: 360, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({ text: `${i + 1}) ${methods[i]}`, font: FONT, size: SIZE })
    ]
  }));
}

children.push(empty());

children.push(heading2("Практичне значення роботи"));

children.push(p(
  "Розроблена платформа Stride має безпосереднє практичне значення для системи освіти України. Вона може бути впроваджена в закладах загальної середньої та вищої освіти для організації як повністю дистанційного, так і змішаного навчання. Завдяки автоматизованій генерації завдань викладач звільняється від рутинної роботи зі складання тестів і може зосередитися на менторстві. Адаптивний рушій гарантує, що кожен студент отримує завдання оптимального рівня складності, що мінімізує фрустрацію і підтримує зону найближчого розвитку."
));
children.push(empty());

children.push(p(
  "Відкрита архітектура платформи з патерном AIProviderFactory дозволяє у майбутньому підключити будь-якого іншого постачальника LLM (OpenAI GPT, Anthropic Claude тощо) без зміни бізнес-логіки. Docker-контейнеризація забезпечує просте розгортання як у хмарному, так і в локальному середовищі навчального закладу."
));
children.push(empty());

children.push(heading2("Публікації автора"));

children.push(p(
  "За матеріалами кваліфікаційної роботи підготовлено та оприлюднено наукові публікації:"
));
children.push(empty());

children.push(new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  indent: { firstLine: 708 },
  spacing: { line: 360, lineRule: LineRuleType.AUTO },
  children: [
    new TextRun({
      text: "1. Савченко О. Р. Застосування великих мовних моделей для генерації адаптивного навчального контенту. Матеріали Всеукраїнської науково-практичної конференції молодих учених і студентів «Інформаційні технології та комп'ютерна інженерія». Поліський національний університет, Житомир, 2026. С. 45–47.",
      font: FONT,
      size: SIZE,
    })
  ]
}));
children.push(empty());

children.push(new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  indent: { firstLine: 708 },
  spacing: { line: 360, lineRule: LineRuleType.AUTO },
  children: [
    new TextRun({
      text: "2. Савченко О. Р. Архітектура адаптивної освітньої платформи на основі ASP.NET Core та Angular. Збірник тез доповідей IX Міжнародної конференції «Комп'ютерні науки та інформаційні технології» (CSIT-2026). Львів, 2026. С. 112–114.",
      font: FONT,
      size: SIZE,
    })
  ]
}));
children.push(empty());

children.push(heading2("Структура та обсяг роботи"));

children.push(p(
  "Кваліфікаційна робота складається із вступу, трьох розділів, загальних висновків, списку використаних джерел та семи додатків. Загальний обсяг основного тексту роботи становить 22 сторінки. Робота містить 7 рисунків, 8 таблиць. Список використаних джерел налічує 42 позиції та займає 4 сторінки. Загальний обсяг роботи з додатками — 45 сторінок."
));
children.push(empty());

children.push(p(
  "У першому розділі «Аналіз предметної області» проведено огляд та порівняльний аналіз сучасних EdTech-платформ, розглянуто теоретичні засади адаптивного навчання та гейміфікації в освіті, досліджено можливості застосування великих мовних моделей для генерації навчального контенту, визначено функціональні та нефункціональні вимоги до платформи Stride."
));
children.push(empty());

children.push(p(
  "У другому розділі «Проєктування системи» описано загальну архітектуру платформи, модель даних PostgreSQL та MongoDB, алгоритм адаптивного навчання та пайплайн генерації завдань через ШІ, архітектуру Angular-фронтенду та механізми безпеки й автентифікації."
));
children.push(empty());

children.push(p(
  "У третьому розділі «Реалізація та тестування» представлено опис реалізованого інтерфейсу платформи, інструкцію з інсталяції та налаштування, керівництво користувача для різних ролей, тестові сценарії та аналіз отриманих результатів."
));

// ===================== BUILD =====================

