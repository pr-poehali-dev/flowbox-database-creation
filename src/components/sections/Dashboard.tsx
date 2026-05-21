import Icon from "@/components/ui/icon";

const METRICS = [
  { label: "Выручка за месяц", value: "₽ 14 820 000", delta: "+12.4%", up: true, icon: "TrendingUp", color: "var(--cyan)" },
  { label: "Заказов за месяц", value: "1 247", delta: "+8.1%", up: true, icon: "ShoppingCart", color: "var(--green)" },
  { label: "Активных компаний", value: "84", delta: "+3", up: true, icon: "Building2", color: "var(--violet)" },
  { label: "Среднее время доставки", value: "2.4 дня", delta: "-0.3 дня", up: true, icon: "Clock", color: "var(--amber)" },
];

const SALES_DATA = [
  { month: "Янв", value: 65 },
  { month: "Фев", value: 72 },
  { month: "Мар", value: 58 },
  { month: "Апр", value: 88 },
  { month: "Май", value: 76 },
  { month: "Июн", value: 92 },
  { month: "Июл", value: 84 },
  { month: "Авг", value: 95 },
  { month: "Сен", value: 110 },
  { month: "Окт", value: 102 },
  { month: "Ноя", value: 118 },
  { month: "Дек", value: 134 },
];

const RECENT_ORDERS = [
  { id: "ORD-4821", company: "ООО Техмаркет", supplier: "Ozon realFBS", amount: "₽ 284 000", status: "Доставлен", statusColor: "text-green-400" },
  { id: "ORD-4820", company: "ИП Соколов", supplier: "Склад №3", amount: "₽ 47 500", status: "В пути", statusColor: "text-amber-400" },
  { id: "ORD-4819", company: "АО Промснаб", supplier: "Ozon FBO", amount: "₽ 1 200 000", status: "Обработка", statusColor: "text-blue-400" },
  { id: "ORD-4818", company: "ООО Ритейл Про", supplier: "Склад №1", amount: "₽ 95 000", status: "Доставлен", statusColor: "text-green-400" },
  { id: "ORD-4817", company: "ЗАО Медтех", supplier: "Ozon realFBS", amount: "₽ 520 000", status: "Отменён", statusColor: "text-rose-400" },
];

const CATEGORY_DATA = [
  { label: "Электроника", value: 38, color: "hsl(var(--cyan))" },
  { label: "Бытовая химия", value: 24, color: "hsl(var(--green))" },
  { label: "Одежда", value: 18, color: "hsl(var(--violet))" },
  { label: "Продукты", value: 12, color: "hsl(var(--amber))" },
  { label: "Прочее", value: 8, color: "hsl(var(--rose))" },
];

const maxVal = Math.max(...SALES_DATA.map(d => d.value));

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Обзор платформы</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Данные обновлены: сегодня в 09:41 · Синхронизировано с Ozon</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Icon name="Calendar" size={12} />
            Май 2026
          </button>
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border bg-secondary text-foreground hover:bg-muted transition-colors">
            <Icon name="Download" size={12} />
            Экспорт
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {METRICS.map((m, i) => (
          <div
            key={m.label}
            className={`rounded-lg border border-border p-4 animate-fade-in delay-${(i + 1) * 100}`}
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted-foreground leading-tight">{m.label}</span>
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: `hsla(${m.color.replace("var(--", "").replace(")", "")}, 0.12)` }}>
                <Icon name={m.icon} size={13} style={{ color: `hsl(${m.color})` }} />
              </div>
            </div>
            <div className="font-mono font-medium text-lg text-foreground leading-tight">{m.value}</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${m.up ? "text-green-400" : "text-rose-400"}`}>
              <Icon name={m.up ? "ArrowUpRight" : "ArrowDownRight"} size={11} />
              {m.delta} за месяц
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sales chart */}
        <div className="col-span-2 rounded-lg border border-border p-5 animate-fade-in delay-300"
          style={{ background: "hsl(var(--card))" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-medium text-foreground">Продажи по месяцам</div>
              <div className="text-xs text-muted-foreground">млн ₽, 2026</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(var(--cyan))" }} />
              Выручка
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-32">
            {SALES_DATA.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full rounded-t relative overflow-hidden"
                  style={{ height: `${(d.value / maxVal) * 100}%`, background: "hsl(var(--border))" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t bar-grow"
                    style={{
                      background: `hsl(var(--cyan))`,
                      height: "100%",
                      animationDelay: `${i * 50}ms`,
                      opacity: 0.8
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-lg border border-border p-5 animate-fade-in delay-400"
          style={{ background: "hsl(var(--card))" }}>
          <div className="text-sm font-medium text-foreground mb-1">По категориям</div>
          <div className="text-xs text-muted-foreground mb-5">Доля в продажах</div>
          <div className="space-y-3">
            {CATEGORY_DATA.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <span className="text-xs font-mono font-medium text-foreground">{c.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${c.value}%`, background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-border animate-fade-in delay-500"
        style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="text-sm font-medium text-foreground">Последние заказы</div>
          <button className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--cyan))" }}>
            Все заказы <Icon name="ArrowRight" size={11} />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["ID", "Компания", "Поставщик", "Сумма", "Статус"].map(h => (
                <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_ORDERS.map((o, i) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                <td className="px-5 py-3 text-xs text-foreground font-medium">{o.company}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{o.supplier}</td>
                <td className="px-5 py-3 font-mono text-xs text-foreground">{o.amount}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${o.statusColor}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
