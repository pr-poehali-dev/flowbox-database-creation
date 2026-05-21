import Icon from "@/components/ui/icon";

const TRANSACTIONS = [
  { date: "21.05.2026", company: "АО Промснаб", type: "Пополнение", amount: "+₽ 5 000 000", balance: "₽ 12 800 000", method: "Банковский перевод" },
  { date: "21.05.2026", company: "ООО Техмаркет", type: "Списание (заказ)", amount: "−₽ 284 000", balance: "₽ 2 400 000", method: "ORD-4821" },
  { date: "20.05.2026", company: "ЗАО Медтех", type: "Возврат", amount: "+₽ 520 000", balance: "₽ 3 100 000", method: "ORD-4817" },
  { date: "20.05.2026", company: "ИП Соколов", type: "Списание (заказ)", amount: "−₽ 47 500", balance: "₽ 180 000", method: "ORD-4820" },
  { date: "19.05.2026", company: "ООО Ритейл Про", type: "Пополнение", amount: "+₽ 200 000", balance: "₽ 95 000", method: "Банковский перевод" },
];

const LIMITS = [
  { company: "АО Промснаб", used: 18200000, total: 30000000 },
  { company: "ООО Техмаркет", used: 2600000, total: 5000000 },
  { company: "ЗАО Медтех", used: 3900000, total: 8000000 },
  { company: "ИП Соколов", used: 320000, total: 500000 },
];

function fmt(n: number) {
  return "₽ " + n.toLocaleString("ru");
}

export default function Finance() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Финансы и лимиты</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Балансы, счета и финансовые отчёты</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground">
            <Icon name="FileText" size={12} />
            Сформировать отчёт
          </button>
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium"
            style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
            <Icon name="Plus" size={13} />
            Пополнить баланс
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Общий оборот (май)", value: "₽ 14 820 000", sub: "+12.4%", icon: "TrendingUp", color: "var(--cyan)" },
          { label: "Сумма балансов", value: "₽ 18 575 000", sub: "84 компании", icon: "Wallet", color: "var(--green)" },
          { label: "Использовано лимитов", value: "68%", sub: "в среднем", icon: "BarChart2", color: "var(--amber)" },
          { label: "Просроченных счетов", value: "3", sub: "на ₽ 124 000", icon: "AlertTriangle", color: "var(--rose)" },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <div className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: `hsla(195, 90%, 48%, 0.1)` }}>
                <Icon name={card.icon} size={13} style={{ color: `hsl(${card.color})` }} />
              </div>
            </div>
            <div className="font-mono text-lg font-medium text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Limits */}
        <div className="col-span-2 rounded-lg border border-border p-5" style={{ background: "hsl(var(--card))" }}>
          <div className="text-sm font-medium text-foreground mb-4">Лимиты закупок</div>
          <div className="space-y-4">
            {LIMITS.map(l => {
              const pct = Math.round((l.used / l.total) * 100);
              const color = pct > 90 ? "hsl(var(--rose))" : pct > 70 ? "hsl(var(--amber))" : "hsl(var(--cyan))";
              return (
                <div key={l.company}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-foreground font-medium">{l.company}</span>
                    <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{fmt(l.used)}</span>
                    <span className="text-[10px] text-muted-foreground">из {fmt(l.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions */}
        <div className="col-span-3 rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Последние транзакции</span>
            <button className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--cyan))" }}>
              Все <Icon name="ArrowRight" size={11} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Дата", "Компания", "Тип", "Сумма", "Реквизит"].map(h => (
                  <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.date}</td>
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{t.company}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.type}</td>
                  <td className="px-5 py-3 font-mono text-xs font-medium"
                    style={{ color: t.amount.startsWith("+") ? "hsl(var(--green))" : "hsl(var(--rose))" }}>
                    {t.amount}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
