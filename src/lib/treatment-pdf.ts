import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { teethOf, type Treatment } from "@/lib/treatments";

// Eski sitedeki "Yazdır" PDF'i ile birebir aynı çıktı.

// Standart PDF fontu Türkçe karakter desteklemediği için Latin harfe çevrilir.
const sanitizeText = (text: string) =>
  text
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");

function splitText(text: string, maxLen: number) {
  if (!text) return ["-"];
  text = sanitizeText(text);
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    if ((current + word).length > maxLen) {
      if (current) lines.push(current.trim());
      current = word + " ";
    } else {
      current += word + " ";
    }
  }
  if (current.trim().length > 0) lines.push(current.trim());
  return lines;
}

function pdfDate(tr: Treatment) {
  if (tr.completed_at) return new Date(tr.completed_at).toLocaleDateString("tr-TR");
  if (tr.approved_at) return new Date(tr.approved_at).toLocaleDateString("tr-TR");
  if (tr.suggested_at) return new Date(tr.suggested_at).toLocaleDateString("tr-TR");
  if (tr.created_at) return new Date(tr.created_at).toLocaleDateString("tr-TR");
  return "-";
}

export async function downloadTreatmentPdf(opts: {
  patientName: string;
  doctorNames: string[];
  suggested: Treatment[];
  approved: Treatment[];
  completed: Treatment[];
}) {
  const { patientName, doctorNames } = opts;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4
  page.drawCircle({ x: 60, y: 820, size: 18, color: rgb(0.1, 0.3, 0.6) });
  page.drawText(sanitizeText("Karadeniz Dis Agiz ve Dis Sagligi Poliklinigi"), { x: 90, y: 820, size: 13, font, color: rgb(0.1, 0.3, 0.6) });
  page.drawText(sanitizeText("Tedavi Raporu"), { x: 90, y: 800, size: 13, font, color: rgb(0.05, 0.15, 0.45) });
  page.drawText(sanitizeText(`Tarih: ${new Date().toLocaleDateString()}`), { x: 420, y: 820, size: 10, font, color: rgb(0.1, 0.3, 0.6) });
  page.drawText(sanitizeText(`Hasta: ${patientName}`), { x: 420, y: 800, size: 12, font, color: rgb(0.05, 0.15, 0.45) });
  page.drawLine({ start: { x: 40, y: 790 }, end: { x: 555, y: 790 }, color: rgb(0.7, 0.8, 0.9), thickness: 2 });

  let y = 770;
  page.drawRectangle({ x: 50, y: y - 2, width: 490, height: 20, color: rgb(0.93, 0.96, 0.99), borderColor: rgb(0.1, 0.3, 0.6), borderWidth: 1 });
  page.drawText(sanitizeText("Tedaviye Katkı Sağlayan Doktorlar"), { x: 55, y: y + 2, size: 13, font, color: rgb(0.1, 0.3, 0.6) });
  y -= 18;
  doctorNames.forEach((name) => {
    page.drawRectangle({ x: 50, y: y - 2, width: 490, height: 14, color: rgb(0.98, 0.98, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    page.drawText(sanitizeText(name), { x: 60, y: y + 2, size: 11, font, color: rgb(0, 0, 0) });
    y -= 14;
  });
  y -= 10;

  const colLines = (yy: number, h: number) => {
    for (const x of [130, 210, 280, 350, 430]) {
      page.drawLine({ start: { x, y: yy - 2 }, end: { x, y: yy + h }, color: rgb(0.7, 0.8, 0.9), thickness: 1 });
    }
  };

  const drawTable = (title: string, items: Treatment[]) => {
    page.drawRectangle({ x: 50, y: y - 2, width: 490, height: 22, color: rgb(0.1, 0.3, 0.6), borderColor: rgb(0.1, 0.3, 0.6), borderWidth: 1 });
    page.drawText(sanitizeText(title), { x: 55, y: y + 2, size: 14, font, color: rgb(1, 1, 1) });
    y -= 24;
    page.drawRectangle({ x: 50, y: y - 2, width: 490, height: 18, color: rgb(0.93, 0.96, 0.99), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    colLines(y, 16);
    const headers: [string, number][] = [["Tedavi Adi", 60], ["Dis No", 140], ["Doktor", 220], ["Durum", 290], ["Tarih", 360], ["Not", 440]];
    for (const [h, x] of headers) page.drawText(sanitizeText(h), { x, y: y + 2, size: 11, font, color: rgb(0.1, 0.3, 0.6) });
    y -= 18;

    items.forEach((tr, idx) => {
      const teeth = teethOf(tr);
      let doctorName = "-";
      if (tr.doctor_id && doctorNames.length > 0) {
        doctorName = doctorNames.find((name) => name.includes(tr.doctor_name || "")) || tr.doctor_name || "-";
      } else if (tr.doctor_name) {
        doctorName = tr.doctor_name;
      }
      const columns = [
        splitText(tr.treatment_type_name || tr.name || "Tedavi", 18),
        splitText(teeth.length > 0 ? teeth.join(", ") : "-", 14),
        splitText(doctorName, 14),
        splitText(tr.status, 12),
        splitText(pdfDate(tr), 14),
        splitText(tr.notes || tr.note || "-", 20),
      ];
      const maxRows = Math.max(...columns.map((c) => c.length));
      for (let row = 0; row < maxRows; row++) {
        page.drawRectangle({ x: 50, y: y - 2, width: 490, height: 16, color: idx % 2 === 0 ? rgb(0.98, 0.98, 1) : rgb(0.93, 0.96, 0.99), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
        colLines(y, 14);
        page.drawLine({ start: { x: 50, y: y - 2 }, end: { x: 540, y: y - 2 }, color: rgb(0.7, 0.8, 0.9), thickness: 1 });
        const xs = [60, 140, 220, 290, 360, 440];
        columns.forEach((col, i) => page.drawText(col[row] || "", { x: xs[i], y: y + 2, size: 9, font, color: rgb(0, 0, 0) }));
        y -= 16;
      }
      y -= 2;
    });
    y -= 10;
  };

  drawTable("Önerilen Tedaviler", opts.suggested);
  drawTable("Onaylanan Tedaviler", opts.approved);
  drawTable("Tamamlanan Tedaviler", opts.completed);

  page.drawLine({ start: { x: 40, y: 120 }, end: { x: 555, y: 120 }, color: rgb(0.1, 0.3, 0.6), thickness: 2 });
  page.drawText(sanitizeText("Bu belge Karadeniz Diş Kliniği tarafından resmi olarak düzenlenmiştir."), { x: 55, y: 100, size: 12, font, color: rgb(0.1, 0.3, 0.6) });
  page.drawText(sanitizeText("İmza: .................................................."), { x: 55, y: 70, size: 13, font, color: rgb(0, 0, 0) });

  const pdfBytes = await doc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hasta-tedavi-listesi.pdf";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}
