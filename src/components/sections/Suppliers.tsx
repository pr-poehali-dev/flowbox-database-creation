import { useState } from "react";
import Icon from "@/components/ui/icon";

const SUPPLIERS = [
  { id: 1, name: "Ozon realFBS", type: "Маркетплейс", categories: ["Электроника", "Бытовая техника"], delivery: "1–3 дня", minOrder: "₽ 10 000", rating: 4.9, sku: 12480, integration: true },
  { id: 2, name: "Ozon FBO", type: "Маркетплейс", categories: ["Одежда", "Обувь", "Аксессуары"], delivery: "2–5 дней", minOrder: "₽ 5 000", rating: 4.7, sku: 8340, integration: true },
  { id: 3, name: "Склад №1 Москва", type: "Собственный", categories: ["Продукты", "Бытовая химия"], delivery: "1 день", minOrder: "₽ 50 000", rating: 5.0, sku: 3200, integration: false },
  { id: 4, name: "Склад №3 Екатеринбург", type: "Собственный", categories: ["Электроника", "Инструменты"], delivery: "3–5 дней", minOrder: "₽ 30 000", rating: 4.5, sku: 1800, integration: false },
  { id: 5, name: "ТД Профснаб", type: "Партнёр", categories: ["Стройматериалы", "Инструменты"], delivery: "5–10 дней", minOrder: "₽ 100 000", rating: 4.2, sku: 640, integration: false },
];

const TYPE_COLORS: Record<string, string> = {
  "Маркетплейс": "text-cyan-400 bg-cyan-400/10",
  "Собственный": "text-green-400 bg-green-400/10",
  "Партнёр": "text-violet-400 bg-violet-400/10",
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs text-foreground">{value.toFixed(1)}</span>
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Icon key={i} name="Star" size={10}
            style={{ color: i <= Math.round(value) ? "hsl(var(--amber))" : "hsl(var(--border))" }} />
        ))}
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Каталог поставщиков</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{SUPPLIERS.length} поставщиков · {SUPPLIERS.filter(s => s.integration).length} с API-интеграцией</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-border overflow-hidden">
            {(["table", "grid"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`p-1.5 ${view === v ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon name={v === "table" ? "List" : "LayoutGrid"} size={13} />
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--cyan))", color: "hsl(var(--primary-foreground))" }}>
            <Icon name="Plus" size={13} />
            Добавить
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Поставщик", "Тип", "Категории", "Срок доставки", "Мин. заказ", "Рейтинг", "SKU", "Интеграция"].map(h => (
                  <th key={h} className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{s.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type]}`}>{s.type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.categories.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{s.delivery}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{s.minOrder}</td>
                  <td className="px-5 py-3"><StarRating value={s.rating} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{s.sku.toLocaleString("ru")}</td>
                  <td className="px-5 py-3">
                    {s.integration ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Icon name="CheckCircle" size={12} /> API
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {SUPPLIERS.map(s => (
            <div key={s.id} className="rounded-lg border border-border p-5 hover:border-ring/50 transition-colors cursor-pointer"
              style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${TYPE_COLORS[s.type]}`}>{s.type}</span>
                </div>
                {s.integration && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <Icon name="Wifi" size={11} /> Live
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Доставка:</span>
                  <span className="text-foreground">{s.delivery}</span>
                </div>
                <div className="flex justify-between">
                  <span>Мин. заказ:</span>
                  <span className="font-mono text-foreground">{s.minOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="font-mono text-foreground">{s.sku.toLocaleString("ru")}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <StarRating value={s.rating} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
