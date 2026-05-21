import { useState } from "react";
import Icon from "@/components/ui/icon";

const ORDERS = [
  { id: "ORD-4821", date: "21.05.2026", company: "ООО Техмаркет", supplier: "Ozon realFBS", items: 8, amount: "₽ 284 000", status: "Доставлен", track: "OZ-88432109", eta: "19.05.2026" },
  { id: "ORD-4820", date: "21.05.2026", company: "ИП Соколов", supplier: "Склад №3", items: 3, amount: "₽ 47 500", status: "В пути", track: "RU-55671234", eta: "23.05.2026" },
  { id: "ORD-4819", date: "20.05.2026", company: "АО Промснаб", supplier: "Ozon FBO", items: 42, amount: "₽ 1 200 000", status: "Обработка", track: "—", eta: "26.05.2026" },
  { id: "ORD-4818", date: "20.05.2026", company: "ООО Ритейл Про", supplier: "Склад №1", items: 15, amount: "₽ 95 000", status: "Доставлен", track: "MX-33219876", eta: "20.05.2026" },
  { id: "ORD-4817", date: "19.05.2026", company: "ЗАО Медтех", supplier: "Ozon realFBS", items: 6, amount: "₽ 520 000", status: "Отменён", track: "—", eta: "—" },
  { id: "ORD-4816", date: "19.05.2026", company: "ООО Агростандарт", supplier: "ТД Профснаб", items: 1, amount: "₽ 240 000", status: "Ожидает оплаты", track: "—", eta: "29.05.2026" },
  { id: "ORD-4815", date: "18.05.2026", company: "АО Промснаб", supplier: "Склад №1", items: 28, amount: "₽ 870 000", status: "Доставлен", track: "MX-33001122", eta: "18.05.2026" },
];

const STATUS_MAP: Record<string, { color: string; icon: string }> = {
  "Доставлен": { color: "text-green-400 bg-green-400/10", icon: "CheckCircle" },
  "В пути": { color: "text-blue-400 bg-blue-400/10", icon: "Truck" },
  "Обработка": { color: "text-amber-400 bg-amber-400/10", icon: "Clock" },
  "Отменён": { color: "text-rose-400 bg-rose-400/10", icon: "XCircle" },
  "Ожидает оплаты": { color: "text-violet-400 bg-violet-400/10", icon: "CreditCard" },
};

const TABS = ["Все", "Обработка", "В пути", "Доставлен", "Отменён"];

export default function Orders() {
  const [tab, setTab] = useState("Все");
  const [search, setSearch] = useState("");

  const filtered = ORDERS.filter(o => {
    const matchTab = tab === "Все" || o.status === tab;
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.company.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    "Все": ORDERS.length,
    "Обработка": ORDERS.filter(o => o.status === "Обработка").length,
    "В пути": ORDERS.filter(o => o.status === "В пути").length,
    "Доставлен": ORDERS.filter(o => o.status === "Доставлен").length,
    "Отменён": ORDERS.filter(o => o.status === "Отменён").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Управление заказами</h1>
          <p className="text-xs text-muted-foreground mt-0.5">История и отслеживание · Синхронизировано с Ozon</p>
        </div>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium"
          style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
          <Icon name="Plus" size={13} />
          Создать заказ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${tab === t ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
              {counts[t as keyof typeof counts]}
            </span>
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: "hsl(var(--cyan))" }} />}
          </button>
        ))}
        <div className="ml-auto pb-1">
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-1.5 text-xs rounded border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none w-44" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["ID заказа", "Дата", "Компания", "Поставщик", "Позиций", "Сумма", "Статус", "Трек-номер", "Доставка"].map(h => (
                <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const s = STATUS_MAP[o.status] || { color: "text-muted-foreground bg-secondary", icon: "Circle" };
              return (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-mono text-xs font-medium" style={{ color: "hsl(var(--cyan))" }}>{o.id}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{o.date}</td>
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{o.company}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{o.supplier}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground text-center">{o.items}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{o.amount}</td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${s.color}`}>
                      <Icon name={s.icon} size={10} />
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.track}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{o.eta}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">Заказы не найдены</div>
        )}
      </div>
    </div>
  );
}
