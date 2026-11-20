export const testCatalog = [
  {
    id: "economy-cycles",
    title: "Цикличность развития национального хозяйства",
    description:
      "Экономические циклы, макроэкономические показатели и меры экономической политики.",
    category: "Национальное хозяйство",
    folder: "10",
  },
  {
    id: "production-organization",
    title: "Общие типы организации производства",
    description:
      "Типы производства, специализация, поточная организация и кооперация.",
    category: "Производство",
    folder: "6 лекция  (2)",
  },
  {
    id: "ownership-and-economy",
    title: "Собственность и экономика",
    description:
      "Формы собственности, экономические системы и их особенности.",
    category: "Собственность",
    folder: "6 лекция  (3)",
  },
  {
    id: "market-economy",
    title: "Экономическая викторина: рыночная экономика",
    description:
      "Спрос, предложение, цены, конкуренция, предпринимательство и роль государства.",
    category: "Рыночная экономика",
    folder: "6 лекция  (4)",
  },
  {
    id: "property-and-society",
    title: "Собственность и социально-экономический строй",
    description:
      "Права собственности, формы владения и связь собственности с устройством общества.",
    category: "Собственность",
    folder: "6 лекция  (5)",
  },
  {
    id: "competition-and-monopolies",
    title: "Рынок знаний: конкуренция и монополии",
    description:
      "Рыночные структуры, рыночная власть, картели и антимонопольное регулирование.",
    category: "Конкуренция и монополия",
    folder: "6 сайть",
  },
  {
    id: "economics-basics",
    title: "Экономическая викторина",
    description:
      "Основы экономики, ограниченность ресурсов, производство и экономические системы.",
    category: "Основы экономики",
    folder: "сайт 1",
  },
  {
    id: "salary-basics",
    title: "Зарплата без секретов",
    description:
      "Начисления, выплаты, налоги и документы по оплате труда.",
    category: "Заработная плата",
    folder: "сайть 8",
  },
  {
    id: "income-and-profit",
    title: "Финансовый радар: доход и прибыль",
    description:
      "Доходы, выручка, расходы, прибыль и точка безубыточности.",
    category: "Доходы и прибыль",
    folder: "сайть 9",
  },
  {
    id: "advertising-basics",
    title: "Реклама вокруг нас",
    description:
      "Виды рекламы, её цели, аудитория и влияние на выбор покупателей.",
    category: "Реклама и маркетинг",
    folder: "сйть 7",
  },
].map((test) => {
  const folderPath = encodeURIComponent(test.folder).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const basePath = import.meta.env.BASE_URL || "/";
  const path = `${basePath}tests/${folderPath}`;
  return {
    ...test,
    url: `${path}/index.html`,
    scriptUrl: `${path}/script.js`,
  };
});
