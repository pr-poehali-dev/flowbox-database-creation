import Icon from "@/components/ui/icon";

const ZONES = [
  { zone: "Москва и МО", regions: 1, tariff: "₽ 350", express: "₽ 800", days: "1 день", active: true },
  { zone: "Санкт-Петербург", regions: 1, tariff: "₽ 450", express: "₽ 1 100", days: "2 дня", active: true },
  { zone: "ЦФО (без МО)", regions: 17, tariff: "₽ 550", express: "—", days: "3–5 дней", active: true },
  { zone: "ПФО", regions: 14, tariff: "₽ 650", express: "—", days: "4–6 дней", active: true },
  { zone: "УФО", regions: 6, tariff: "₽ 700", express: "—", days: "5–7 дней", active: true },
  { zone: "СФО", regions: 12, tariff: "₽ 900", express: "—", days: "7–10 дней", active: false },
  { zone: "ДВФО", regions: 9, tariff: "₽ 1 400", express: "—", days: "10–14 дней", active: false },
];

const CARRIERS = [
  { name: "СДЭК", code: "CDEK", status: "Активен", deliveries: 842, rating: 4.8 },
  { name: "Boxberry", code: "BOX", status: "Активен", deliveries: 314, rating: 4.5 },
  { name: "Почта России", code: "POST", status: "Активен", deliveries: 128, rating: 3.9 },
  { name: "Ozon Логистика", code: "OZON", status: "Активен", deliveries: 1240, rating: 4.9 },
  { name: "DHL", code: "DHL", status: "Приостановлен", deliveries: 42, rating: 4.7 },
];

export default function Delivery() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Зоны и тарифы доставки</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Настройка региональных тарифов и сроков</p>
        </div>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium"
          style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
          <Icon name="Plus" size={13} />
          Добавить зону
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
          <div className="text-xs text-muted-foreground mb-1">Активных зон</div>
          <div className="font-mono text-2xl font-medium text-foreground">{ZONES.filter(z => z.active).length}</div>
          <div className="text-xs text-muted-foreground mt-1">из {ZONES.length} настроенных</div>
        </div>
        <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
          <div className="text-xs text-muted-foreground mb-1">Среднее время</div>
          <div className="font-mono text-2xl font-medium text-foreground">2.4</div>
          <div className="text-xs text-muted-foreground mt-1">дня по России</div>
        </div>
        <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
          <div className="text-xs text-muted-foreground mb-1">Доставок в месяц</div>
          <div className="font-mono text-2xl font-medium text-foreground">2 566</div>
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <Icon name="ArrowUpRight" size={11} /> +14% к прошлому
          </div>
        </div>
      </div>

      {/* Zones table */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Зоны доставки</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Зона", "Регионов", "Базовый тариф", "Экспресс", "Сроки", "Статус", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ZONES.map((z) => (
              <tr key={z.zone} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 text-xs font-medium text-foreground">{z.zone}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{z.regions}</td>
                <td className="px-5 py-3 font-mono text-xs text-foreground">{z.tariff}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{z.express}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{z.days}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${z.active ? "text-green-400" : "text-muted-foreground"}`}>
                    {z.active ? "Активна" : "Отключена"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Изменить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Carriers */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <div className="px-5 py-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">Перевозчики</span>
        </div>
        <div className="grid grid-cols-5 divide-x divide-border">
          {CARRIERS.map(c => (
            <div key={c.code} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <span className={`text-[10px] ${c.status === "Активен" ? "text-green-400" : "text-amber-400"}`}>●</span>
              </div>
              <div className="font-mono text-lg font-medium text-foreground">{c.deliveries.toLocaleString("ru")}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">доставок · ★ {c.rating}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
