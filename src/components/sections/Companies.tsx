import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const COMPANIES = [
  { id: 1, name: "ООО Техмаркет", inn: "7712345678", status: "Активна", plan: "Премиум", balance: "₽ 2 400 000", limit: "₽ 5 000 000", orders: 142, manager: "Иванов А.В." },
  { id: 2, name: "ИП Соколов Д.А.", inn: "500112345678", status: "Активна", plan: "Базовый", balance: "₽ 180 000", limit: "₽ 500 000", orders: 28, manager: "Петрова М.С." },
  { id: 3, name: "АО Промснаб", inn: "5001234567", status: "Активна", plan: "Корпоратив", balance: "₽ 12 800 000", limit: "₽ 30 000 000", orders: 387, manager: "Кузнецов П.И." },
  { id: 4, name: "ООО Ритейл Про", inn: "7725678901", status: "Заморожена", plan: "Базовый", balance: "₽ 0", limit: "₽ 300 000", orders: 14, manager: "Иванов А.В." },
  { id: 5, name: "ЗАО Медтех", inn: "7734567890", status: "Активна", plan: "Премиум", balance: "₽ 3 100 000", limit: "₽ 8 000 000", orders: 205, manager: "Смирнова Е.К." },
  { id: 6, name: "ООО Агростандарт", inn: "3123456789", status: "Ожидает", plan: "Базовый", balance: "₽ 50 000", limit: "₽ 500 000", orders: 0, manager: "Петрова М.С." },
];

const STATUS_COLORS: Record<string, string> = {
  "Активна": "text-green-400 bg-green-400/10",
  "Заморожена": "text-amber-400 bg-amber-400/10",
  "Ожидает": "text-blue-400 bg-blue-400/10",
};

const PLAN_COLORS: Record<string, string> = {
  "Базовый": "text-muted-foreground",
  "Премиум": "text-amber-400",
  "Корпоратив": "text-cyan-400",
};

export default function Companies() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const filtered = COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.inn.includes(search));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Клиентские компании</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{COMPANIES.length} компаний · {COMPANIES.filter(c => c.status === "Активна").length} активных</p>
        </div>
        <button
          onClick={() => navigate("/onboarding")}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded text-foreground hover:opacity-90 transition-opacity font-medium"
          style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
          <Icon name="Plus" size={13} />
          Зарегистрировать клиента
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию или ИНН..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select className="text-xs px-3 py-2 rounded border border-border bg-secondary text-muted-foreground focus:outline-none">
          <option>Все статусы</option>
          <option>Активна</option>
          <option>Заморожена</option>
          <option>Ожидает</option>
        </select>
        <select className="text-xs px-3 py-2 rounded border border-border bg-secondary text-muted-foreground focus:outline-none">
          <option>Все тарифы</option>
          <option>Базовый</option>
          <option>Премиум</option>
          <option>Корпоратив</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Компания", "ИНН", "Статус", "Тариф", "Баланс / Лимит", "Заказов", "Менеджер", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const pct = Math.round((parseInt(c.balance.replace(/\D/g, "")) / parseInt(c.limit.replace(/\D/g, ""))) * 100) || 0;
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="text-xs font-medium text-foreground">{c.name}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.inn}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${PLAN_COLORS[c.plan]}`}>{c.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs text-foreground">{c.balance}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-20 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "hsl(var(--cyan))" }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground text-right">{c.orders}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{c.manager}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/client?company_id=${c.id}`)}
                        className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        title="Открыть кабинет клиента"
                      >
                        <Icon name="ExternalLink" size={11} className="inline mr-1" />
                        Кабинет
                      </button>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="MoreHorizontal" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}