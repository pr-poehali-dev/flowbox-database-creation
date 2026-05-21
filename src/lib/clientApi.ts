const BASE = "https://functions.poehali.dev/59f36c2a-64e7-4ed1-856e-6f13000107e8";

export async function clientFetch(section: string, companyId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ section, company_id: companyId, ...extra });
  const res = await fetch(`${BASE}?${params.toString()}`);
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(json.error || "Ошибка сервера");
  return json;
}
