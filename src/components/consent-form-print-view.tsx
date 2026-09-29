import type { ConsentTemplate } from "@/lib/consent-form-templates";

export const CLINIC_NAME = "Karadeniz Diş Ağız ve Diş Sağlığı Polikliniği";

export type ConsentPatient = {
  first_name: string;
  last_name: string;
  tc_number?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  branch_name?: string | null;
};

export type ConsentBranch = { name: string; address?: string | null } | null | undefined;

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

// Kâğıt formu temsil ettiği için temadan bağımsız, sabit açık renklerle çizilir.
export function ConsentFormPrintView({
  branch,
  patient,
  doctorName,
  template,
}: {
  branch: ConsentBranch;
  patient: ConsentPatient;
  doctorName: string;
  template: ConsentTemplate;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-md border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="mb-6 flex items-start justify-between border-b-2 border-neutral-900 pb-3">
        <div>
          <p className="text-lg font-bold">{CLINIC_NAME}</p>
          {branch && (
            <p className="text-xs text-neutral-600">
              {branch.name}
              {branch.address && ` · ${branch.address}`}
            </p>
          )}
        </div>
        <p className="text-right text-[10px] text-neutral-500">
          Form Tarihi
          <br />
          {formatDate(new Date())}
        </p>
      </header>

      <h1 className="mb-4 text-center text-base font-bold uppercase tracking-wide">{template.title}</h1>

      <section className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 rounded border border-neutral-300 p-3 text-xs">
        <p>
          <span className="font-medium">Hasta Adı Soyadı:</span> {patient.first_name} {patient.last_name}
        </p>
        <p>
          <span className="font-medium">T.C. Kimlik No:</span> {patient.tc_number || "—"}
        </p>
        <p>
          <span className="font-medium">Doğum Tarihi:</span> {patient.birth_date ? formatDate(patient.birth_date) : "—"}
        </p>
        <p>
          <span className="font-medium">Telefon:</span> {patient.phone || "—"}
        </p>
        <p className="col-span-2">
          <span className="font-medium">Tedaviyi Uygulayacak Hekim:</span> {doctorName || "—"}
        </p>
      </section>

      <div className="space-y-3.5">
        {template.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-800">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line text-xs leading-relaxed text-neutral-800">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-10 text-xs">
        <div>
          <p className="mb-10 font-medium">Hasta / Veli-Vasi Adı Soyadı, İmza, Tarih</p>
          <div className="border-t border-neutral-400" />
        </div>
        <div>
          <p className="mb-10 font-medium">Hekim Adı Soyadı, İmza, Tarih</p>
          <div className="border-t border-neutral-400" />
        </div>
      </div>
    </div>
  );
}
