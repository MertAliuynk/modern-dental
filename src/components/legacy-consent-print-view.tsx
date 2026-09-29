import { CLINIC_NAME, type ConsentPatient } from "@/components/consent-form-print-view";

export const LEGACY_CONSENT_KEY = "eski_genel";
export const LEGACY_CONSENT_TITLE = "Genel Bilgilendirme ve Onam Formu";

// Eski sitedeki onam formunun metni — birebir aynı.
export function LegacyConsentPrintView({ patient, doctorName }: { patient: ConsentPatient; doctorName: string }) {
  const patientName = `${patient.first_name} ${patient.last_name}`;
  return (
    <div className="legacy-consent mx-auto w-full max-w-3xl rounded-md border border-neutral-300 bg-white p-8 text-sm leading-relaxed text-neutral-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <p className="mb-6 border-b-2 border-neutral-900 pb-3 text-lg font-bold">{CLINIC_NAME}</p>
          <div className="page-break">
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>DİŞ HEKİMİNE BİLGİLENDİRME</div>
            <div style={{ marginBottom: 16 }}>
              Değerli Meslektaşım,
              <br />
              <br />
              Hastaya yapılacak her türlü müdahale için hastanın aydınlatılmış onamının alınmış olması zorunludur.
              <br />
              <br />
              Bu onam, ağız ve diş sağlığı için yapılabilecek tıbbi işlemler ile bunların beklenen etkilerine ilişkin olarak hastanın anlayıp değerlendirebileceği açıklıkta bilgi verildikten sonra hastanın kararının açıklanması şeklinde ortaya çıkar.
              <br />
              <br />
              Büyük cerrahi işlemlerle klinik olarak hastadan alınacak aydınlatılmış onamın yazılı olması şarttır. Diğer işlemlerde aydınlatılmış onamın yazılı olması şart değilse de yazılı olmasında gereklilik tıbbi etik açısından bakımından yarar vardır.
              <br />
              <br />
              Ekli sunulan aydınlatılmış onam örneği bütünlüğü örnek olması için hazırlanmıştır. Hastaya gerekli bilgilerin tarafınızdan verilmesinden sonra, bu örnekten aydınlatılmış onam/aydınlatılmış onam belgesi hazırlanabilir. Tıbbi tedavinin özellikli olması ve/veya hastanın kişisel durumu sebebiyle ek risklerin olduğu halinde bu durumun hasta ile paylaşılması ve onam formunda ayrıca belirtilmesi gereklidir.
              <br />
              <br />
              Son olarak vurgulamak gerekir ki, aydınlatma yapılmadan hastanın imzasının alınması gerçek bir onam olarak kabul edilemeyebilir. Onam, tedavi seçenekleri, yapılacak işlemler ve olası riskleri konusunda hastanın anlayabileceği açıklıkta bilimsel bilginin anlatılması ve rızanın bunun üzerine verilmesi halinde geçerlidir.
              <br />
              <br />
              Saygılarımızla.
            </div>
            <hr style={{ margin: "32px 0" }} />
          </div>
          <div className="page-break">
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>GENEL BİLGİLENDİRME</div>
            <div style={{ marginBottom: 16 }}>
              Sayın <b>{patientName}</b>,
              <br />
              <br />
              Ağız diş sağlığı sorununuzun giderilebilmesi için size önerilen tıbbi işlem ve bu işlemle ilgili sözlü anlatılan ve Yetişkin Hasta Bilgilendirme Broşürü/Çocuk Hasta Bilgilendirme Broşürü&apos;nde tarafınızdan okunarak bilgi edinilen hususların bir kısmı aşağıda yazılı olarak sunulmuştur.
              <br />
              <br />
              Size verilen bilgileri okuyunuz. Böylece size ya da vasisi olduğunuz kişiye uygulanacak tedaviler hakkında bilgi sahibi olacaksınız. Bu açıklamaların amacı ağız diş sağlığınızı iyileştirmek ve korumak için sizlerin bilgilendirilmeniz ve tedavi sürecine katılımınızı sağlamaktır.
              <br />
              <br />
              Mevcut sistemik hastalıklarınız, kullandığınız ilaçlar ve genel sağlık durumunuz ilgili olarak hekiminizi bilgilendirmeniz gerekmektedir. Herhangi bir konuyu saklamış olmanız veya beyan etmemenizden kaynaklanacak sorumluluk size aittir.
              <br />
              <br />
              Kliniğimize başvurunuz sırasında diş hekimliği tedavisi öncesinde yapılacak muayene ve değerlendirme, tetkikler, işlemler ve maliyetleri hakkında bilgi sahibi olmak sizin en doğal hakkınızdır.
              <br />
              <br />
              Tedavi ve işlemlerin yararlarını, olası risklerini ve maliyetlerini öğrendikten sonra yapılacak işleme onay vermek sizin kararınıza bağlıdır.
              <br />
              <br />
              Sağlık kuruluşumuzun düzenini ve tedavi programının aksamamasını için randevularınıza sadık olmaya ve zamanında gelmeye özen gösteriniz. Gelmeniz mümkün olmadığında, randevunuzu 24 saat öncesinden iptal ettiriniz.
              <br />
              <br />
              Sağlıklı ve mutlu bir yaşam dileriz.
              <br />
              <br />
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>GENEL ONAM FORMU</div>
            <div style={{ marginBottom: 16 }}>
              Aşağıda imzası olan ben/hastanın vasisi <b>{patientName}</b> ...
              <br />
              <br />
              Diş Hekimi <b>{doctorName}</b> tarafından konulan tanı ve tedavi ile ilgili planlama, alternatif tedaviler, sonuçlar, istenmeyen yan etkileri hakkında bilgilendirildim, anladım. Uygulanacak olan tedaviyi kabul ettim.
              <br />
              <br />
              Tedavi süresinde/sırasında ortaya çıkabilecek yeni durumlarla planlamanın değişebileceği anladım ve kabul ettim.
              <br />
              <br />
              Tedavi uygulandığı takdirde ortaya çıkabilecek olası riskler, tedavinin alternatif uygulamalarına göre maliyet hesapları, gerekli görüldüğü takdirde diğer hekimlerden konsültasyon istenebileceğini kabul ettim.
              <br />
              <br />
              Tedavim/vasisi olduğum kişinin tedavisi hakkında merak ettiğim tüm sorulara cevap verildi. Yapılacak tedavilerin başarısının bana da bağlı olduğu, evde üzerime düşenleri yerine getirmem ve önerilere uymam gerektiği, verilmeyen randevulara zamanında gelmediğimde işlemin diğer zamana erteleneceği ve uygulama bedelinin ilgili tarife uygun doz ve sürelerde kullanma gerekliliği anlatıldı, anladım ve kabul ettim.
              <br />
              <br />
            </div>
          </div>
          <div className="page-break">
            <div style={{ marginBottom: 16 }}>
              Uygulanacak tedavilerin ağız ve diş sağlığını korumayı amaçladığını, tıbbi hizmetlerin özenle yürütüleceği ancak tıbbi işlemlerde sonucun garanti edilemeyeceği tarafıma anlatıldı, anladım ve kabul ettim.
              <br />
              <br />
              Yukarıda belirtildiği gibi tedavi planlaması sırasında bana/vasisi olduğum kişiye anlatılan ve benim tarafımdan kabul edilen diş tedavilerini onayladım ve kabul ettim.
              <br />
              <br />
              Hasta hakları ve sorumlulukları, hekim hakları ve yükümlülükleri konularında detaylı olarak bilgilendirildim.
              <br />
              <br />
              Tedaviyi kabul ettikten sonra bana/vasisi olduğum kişiye ait radyografi, fotoğraf, video ve diğer dokümanların, eğitim ve/veya bilimsel amaçlı çalışmalarda anonimleştirilmiş veri olarak kullanılmasına izin veriyorum. Kişisel verilerimin Kamu kurum ve kuruluşları da dahil olmak üzere üçüncü kişi ve kurumlarla paylaşılmasına izin ................. (El yazınız ile “veriyorum” ya da “vermiyorum” yazınız.)
              <br />
              <br />
            </div>
            <div style={{ marginBottom: 24 }}>
              .................................................... El yazınız ile “okuduğumu anladım, kabul ediyorum” yazınız.
              <br />
              <br />
              Tarih: <span style={{ minWidth: 120, display: "inline-block", borderBottom: "1px solid #222" }}></span>
            </div>
            <div style={{ marginBottom: 16 }}>
              Hasta Adı-Soyadı: <b>{patientName}</b>
              <br />
              Hekimin Adı-Soyadı: <b>{doctorName}</b>
              <br />
              Telefon: <b>{patient.phone}</b>
              <br />
              Şube: <b>{patient.branch_name || ""}</b>
              <br />
              İmza: ....................................................
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>Hastanın Yasal Temsilcisi (Varsa):</b> ....................................................
              <br />
              <b>Adı-Soyadı:</b> ....................................................
              <br />
              <b>İmza:</b> ....................................................
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>TEDAVİ PLANINDAKİ DEĞİŞİKLİKLER</div>
            <div style={{ marginBottom: 12 }}>............... tarihinde yapılan tedavi planında aşağıda belirtilmiş olan değişiklikler yapılmıştır.</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }} border={1}>
              <thead>
                <tr>
                  <th style={{ padding: 6 }}>DİŞ</th>
                  <th style={{ padding: 6 }}>TEŞHİS</th>
                  <th style={{ padding: 6 }}>PLANLANAN TEDAVİ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ height: 32 }}></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td style={{ height: 32 }}></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginBottom: 16 }}>
              Diş hekimim tedavi değişikliğinin neden gerektiğini, içerdiği riskleri, oluşabilecek problemleri, alternatif yöntemleri, tedavi sırasında oluşabilecek değişiklikleri, başarı olasılığı ve iyileşme sürecinde yaşanabilecek olayları açıkladı.
              <br />
              <br />
              Yukarıda belirtilmiş olan tedavi planındaki değişikliği kabul ....................(El yazınız ile “ediyorum” ya da “etmiyorum” yazınız.)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }} border={1}>
              <thead>
                <tr>
                  <th>Adı-Soyadı</th>
                  <th>İmza</th>
                  <th>Tarih/Saat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ height: 32 }}></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 13, color: "#444" }}>
              <b>Hasta / Hastanın Yasal Temsilcisi (*) – yakınlık derecesi</b>
              <br />
              <b>Bilgilendirmeyi yapan Hekim</b>
              <br />
              <b>Tercüman (kullanılması halinde)</b>
              <br />
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
              * Yasal Temsilci: Vesayet altındakiler için vasi, reşit olmayanlar için anne-baba, bunların bulunmadığı durumlarda 1. derece kanuni mirasçılardır. (Hasta yakınının isminin yanında yakınlık derecesini belirtiniz)
            </div>
          </div>
    </div>
  );
}