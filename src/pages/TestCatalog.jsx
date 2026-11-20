import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TestCard from "../components/TestCard.jsx";
import { testCatalog } from "../data/testCatalog.js";
import { getQuestionCount } from "../services/questionCount.js";

export default function TestCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "Все категории");
  const [sortOrder, setSortOrder] = useState("title-asc");
  const [counts, setCounts] = useState({});
  const categories = useMemo(
    () => ["Все категории", ...new Set(testCatalog.map((test) => test.category))],
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    testCatalog.forEach((test) => {
      getQuestionCount(test.scriptUrl, controller.signal)
        .then((count) => {
          setCounts((current) => ({ ...current, [test.id]: { status: "ready", count } }));
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setCounts((current) => ({
            ...current,
            [test.id]: { status: "error", message: error.message },
          }));
        });
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (category !== "Все категории") next.set("category", category);
    setSearchParams(next, { replace: true });
  }, [search, category, setSearchParams]);

  const filteredTests = testCatalog
    .filter((test) => {
      const searchText = `${test.title} ${test.description} ${test.category}`.toLocaleLowerCase("ru");
      const matchesSearch = searchText.includes(search.trim().toLocaleLowerCase("ru"));
      const matchesCategory = category === "Все категории" || test.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((first, second) =>
      sortOrder === "title-desc"
        ? second.title.localeCompare(first.title, "ru")
        : first.title.localeCompare(second.title, "ru"),
    );

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">БИБЛИОТЕКА ЗНАНИЙ</p>
        <div className="heading-row">
          <div><h1>Каталог тестов</h1><p>Выберите тему и начните проходить тест. Оригинальные викторины открываются отдельно.</p></div>
          <span className="catalog-count">{filteredTests.length}<small> из {testCatalog.length} тестов</small></span>
        </div>
      </section>

      <section aria-label="Поиск и фильтры" className="catalog-toolbar">
        <label className="catalog-search">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Поиск тестов"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти тест, тему или категорию"
            type="search"
            value={search}
          />
          {search && <button aria-label="Очистить поиск" onClick={() => setSearch("")} type="button">×</button>}
        </label>
        <label className="category-select">
          <SlidersHorizontal aria-hidden="true" size={17} />
          <span className="sr-only">Категория</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="category-select sort-select">
          <span className="sr-only">Сортировка</span>
          <select onChange={(event) => setSortOrder(event.target.value)} value={sortOrder}>
            <option value="title-asc">По названию: А—Я</option>
            <option value="title-desc">По названию: Я—А</option>
          </select>
        </label>
      </section>

      {filteredTests.length > 0 ? (
        <section aria-label="Тесты" className="test-grid">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              questionCount={counts[test.id] || { status: "loading" }}
              test={test}
            />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <Search size={22} />
          <h2>Ничего не найдено</h2>
          <p>Измените запрос или выберите другую категорию.</p>
        </div>
      )}
      <p className="catalog-footnote">Количество вопросов считывается из исходного JavaScript каждого теста при открытии каталога.</p>
    </div>
  );
}
