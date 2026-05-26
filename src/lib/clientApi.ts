const BASE = "https://functions.poehali.dev/59f36c2a-64e7-4ed1-856e-6f13000107e8";
const CLAIMS_BASE = "https://functions.poehali.dev/41c8e826-0ec2-4029-a582-d1507758a0ef";

export async function clientFetch(section: string, companyId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ section, company_id: companyId, ...extra });
  const res = await fetch(`${BASE}?${params.toString()}`);
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(json.error || "Ошибка сервера");
  return json;
}

export async function claimsFetch(section: string, companyId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ section, company_id: companyId, ...extra });
  const res = await fetch(`${CLAIMS_BASE}?${params.toString()}`);
  const json = JSON.parse(await res.text());
  if (!res.ok) throw new Error(json.error || "Ошибка сервера");
  return json;
}

export async function claimsPost(section: string, body: Record<string, unknown>) {
  const res = await fetch(`${CLAIMS_BASE}?section=${section}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = JSON.parse(await res.text());
  if (!res.ok) throw new Error(json.error || "Ошибка сервера");
  return json;
}