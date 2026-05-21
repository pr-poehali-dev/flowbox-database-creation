import { useEffect, useState, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import Icon from "@/components/ui/icon";
import { Loader, ErrorMsg, SectionHeader, fmt } from "../shared";

interface Product {
  id: string; trade_name: string; supplier_article: string;
  category_ozon: string; our_price: number;
  stock_free: number; photos: string[] | null; supplier_name: string;
}

interface Props { companyId: string; onCalculator: (product: Product) => void; }

export default function Catalog({ companyId, onCalculator }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  const load = useCallback(() => {
    setLoading(true);
    const extra: Record<string, string> = { limit: String(LIMIT), offset: String(offset) };
    if (search)   extra.search   = search;
    if (category) extra.category = category;
    if (inStock)  extra.in_stock = "true";
    clientFetch("catalog", companyId, extra)
      .then(d => { setProducts(d.products || []); setTotal(d.total || 0); setCategories(d.categories || []); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId, search, category, inStock, offset]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT);

  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHeader title="Каталог товаров" subtitle={`${total} товаров доступно`} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Поиск по названию или артикулу..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setOffset(0); }}
          className="text-xs px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground focus:outline-none min-w-36">
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <div onClick={() => { setInStock(v => !v); setOffset(0); }}
            className={`w-8 h-4 rounded-full transition-all relative cursor-pointer ${inStock ? "" : "bg-secondary border border-border"}`}
            style={inStock ? { background: "hsl(var(--cyan))" } : {}}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${inStock ? "left-4" : "left-0.5"}`} />
          </div>
          В наличии
        </label>
      </div>

      {error && <ErrorMsg message={error} />}

      {loading ? <Loader /> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {products.length === 0 && (
              <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">Товары не найдены</div>
            )}
            {products.map(p => {
              const photo = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : null;
              return (
                <div key={p.id} className="rounded-lg border border-border overflow-hidden hover:border-ring/40 transition-colors group"
                  style={{ background: "hsl(var(--card))" }}>
                  {/* Photo */}
                  <div className="h-36 flex items-center justify-center"
                    style={{ background: "hsl(var(--secondary))" }}>
                    {photo
                      ? <img src={photo} alt={p.trade_name} className="h-full w-full object-cover" />
                      : <Icon name="Package" size={32} className="text-muted-foreground opacity-30" />}
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-medium text-foreground leading-tight line-clamp-2 mb-1">{p.trade_name}</div>
                    {p.supplier_article && (
                      <div className="text-[10px] text-muted-foreground font-mono mb-2">арт. {p.supplier_article}</div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-sm font-semibold text-foreground">{fmt(p.our_price)}</div>
                      <div className={`text-xs font-medium ${p.stock_free > 0 ? "text-green-400" : "text-rose-400"}`}>
                        {p.stock_free > 0 ? `${p.stock_free} шт.` : "Нет"}
                      </div>
                    </div>
                    <button onClick={() => onCalculator(p)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-all hover:opacity-90"
                      style={{ background: "hsla(195,90%,48%,0.12)", color: "hsl(var(--cyan))", border: "1px solid hsla(195,90%,48%,0.25)" }}>
                      <Icon name="Calculator" size={12} />
                      Калькулятор
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
                ← Назад
              </button>
              <span className="text-xs text-muted-foreground">{page + 1} / {pages}</span>
              <button disabled={page >= pages - 1} onClick={() => setOffset(o => o + LIMIT)}
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
