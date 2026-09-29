// SMS sayfaları eski sitede olduğu gibi bu uygulamanın /api/* vekil (proxy) rotalarını kullanır.

export type SmsTemplate = { template_id: number; name: string; content: string; created_at?: string };
export type SmsPatient = { patient_id: number; first_name: string; last_name: string; phone: string; tc_number: string };

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export async function fetchSmsTemplates(): Promise<SmsTemplate[] | null> {
  const res = await fetch("/api/sms/templates", { headers: authHeader() });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

export async function fetchSmsPatients(search = ""): Promise<SmsPatient[] | null> {
  let url = "/api/patient";
  if (search && search.trim().length > 0) url += `?search=${encodeURIComponent(search.trim())}`;
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) return null;
  const data = await res.json();
  const list = data.data || data;
  return Array.isArray(list) ? list : [];
}

export { authHeader as smsAuthHeader };
