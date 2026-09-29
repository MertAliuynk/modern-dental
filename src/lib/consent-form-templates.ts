// Onam Formu (informed consent) template library — original wording written
// to reflect the standard structure and content used across real Turkish
// dental informed-consent forms (Türk Dişhekimleri Birliği's Genel Onam
// Formu, university dental faculty forms — Marmara, Erciyes, SDÜ, RTE, DEÜ,
// Kırıkkale — and dişhekimleri odası publications). These are NOT verbatim
// copies of any single source; the section structure and risk content are
// synthesized from that research into this app's own text, rendered with
// the clinic's own branding (see ConsentFormPrintView) rather than any
// particular source institution's letterhead.
//
// Placeholders are NOT used in the body text — the print view fills in
// patient/clinic identity in a dedicated header/footer instead, keeping the
// legal text itself stable and independently readable.

export type ConsentSection = {
  heading: string;
  paragraphs: string[];
};

export type ConsentTemplate = {
  key: string;
  title: string;
  category: string;
  /** Shown under the title as a one-line explainer in the picker UI. */
  summary: string;
  sections: ConsentSection[];
};

const RADIOGRAPHY_SECTION: ConsentSection = {
  heading: "Radyografik Görüntüleme Hakkında Bilgi",
  paragraphs: [
    "Teşhis ve tedavi planlaması amacıyla düşük dozda iyonize radyasyon içeren röntgen (radyografik) görüntüleme yapılabilir. Bu görüntülemenin, gerekli görüldüğü ölçüde ve uluslararası kabul görmüş güvenlik sınırları içinde uygulandığı; gebelik veya gebelik şüphesi durumunda mutlaka önceden hekime bilgi verilmesi gerektiği tarafıma açıklanmıştır.",
  ],
};

const LOCAL_ANESTHESIA_SECTION: ConsentSection = {
  heading: "Lokal Anestezi Hakkında Bilgi",
  paragraphs: [
    "İşlem sırasında ağrı kontrolü amacıyla lokal anestezi uygulanabilir. Enjeksiyon bölgesinde geçici ağrı, şişlik veya morarma; dudak, dil, yanak ve çene bölgesinde birkaç saat sürebilen uyuşukluk; anesteziğin etkisi geçene kadar bu bölgelerin istemsizce ısırılması riski; çok nadiren alerjik reaksiyon veya uzun süreli/kalıcı sinir hasarı gelişebileceği konusunda bilgilendirildim.",
  ],
};

const DECLARATION_SECTION: ConsentSection = {
  heading: "Hasta Beyanı ve Onay",
  paragraphs: [
    "Yukarıdaki bilgilendirmeyi okudum ve hekimim tarafından sözlü olarak da bilgilendirildim. Planlanan tedavinin amacını, uygulanış şeklini, olası risklerini, komplikasyonlarını ve varsa alternatiflerini anladığımı; sorularımı sorma ve karar vermem için yeterli süreyi kullanma fırsatı bulduğumu beyan ederim.",
    "Tıbbi/dişhekimliği işlemlerinde sonucun garanti edilemeyeceğini biliyor; bu bilgiler ışığında, hiçbir baskı altında kalmadan ve kendi özgür irademle, yukarıda açıklanan tedavinin tarafıma uygulanmasını onaylıyorum.",
    "Genel sağlık durumum, sürekli kullandığım ilaçlar, geçirdiğim/mevcut hastalıklarım, alerjilerim ve (varsa) gebelik durumum hakkında hekimime doğru ve eksiksiz bilgi verdiğimi; bu konuda beyan etmediğim bir durumdan doğabilecek sonuçların sorumluluğunun tarafıma ait olduğunu kabul ederim.",
    "Tedaviyi reddetme veya başlamış bir tedaviyi herhangi bir aşamada durdurma hakkımın bulunduğunu biliyorum.",
  ],
};

const DECLARATION_SECTION_GUARDIAN: ConsentSection = {
  heading: "Veli / Yasal Temsilci Beyanı ve Onayı",
  paragraphs: [
    "Yukarıdaki bilgilendirmeyi velisi/yasal temsilcisi olduğum çocuk hastamla ilgili olarak okudum ve hekim tarafından sözlü olarak da bilgilendirildim. Planlanan tedavinin amacını, uygulanış şeklini, olası risklerini, komplikasyonlarını ve varsa alternatiflerini anladığımı; sorularımı sorma ve karar vermem için yeterli süreyi kullanma fırsatı bulduğumu beyan ederim.",
    "Çocuğumun genel sağlık durumu, kullandığı ilaçlar, geçirdiği/mevcut hastalıkları ve alerjileri hakkında hekime doğru ve eksiksiz bilgi verdiğimi; bu konuda beyan etmediğim bir durumdan doğabilecek sonuçların sorumluluğunun tarafıma ait olduğunu kabul ederim.",
    "Çocuğumun tedaviye işbirliği göstermemesi halinde, hekimin gerekli davranış yönlendirme yöntemlerini uygulayabileceği konusunda bilgilendirildim. Tedaviyi reddetme veya başlamış bir tedaviyi herhangi bir aşamada durdurma hakkımın bulunduğunu; ancak tedavi edilmeyen süt dişi enfeksiyonlarının altındaki daimi diş germine zarar verebileceğini biliyorum.",
    "Yukarıda açıklanan tedavinin çocuğuma uygulanmasını, veli/yasal temsilcisi sıfatıyla onaylıyorum.",
  ],
};

function template(
  key: string,
  title: string,
  category: string,
  summary: string,
  sections: ConsentSection[],
): ConsentTemplate {
  return { key, title, category, summary, sections };
}

export const CONSENT_FORM_TEMPLATES: ConsentTemplate[] = [
  template("genel", "Genel Diş Hekimliği Tedavileri Onam Formu", "Genel", "Her tedaviye başlarken kullanılabilecek genel bilgilendirme ve onay formu.", [
    {
      heading: "Genel Bilgilendirme",
      paragraphs: [
        "Ağız ve diş sağlığınızla ilgili yapılan muayene, gerekli görülen tetkikler ve varsa geçmiş tedavi kayıtlarınız değerlendirilerek tarafınıza bir tedavi planı önerilmiştir. Bu formun amacı, önerilen tedavi(ler) hakkında sizi bilgilendirmek ve tedaviye başlamadan önce onayınızı almaktır.",
      ],
    },
    {
      heading: "Tedavi Planı Hakkında",
      paragraphs: [
        "Tedavi süreci içinde yeni klinik bulgular ortaya çıkması veya mevcut planın revize edilmesi gerekmesi halinde, her değişiklik öncesinde ayrıca bilgilendirilip onayınız alınacaktır.",
      ],
    },
    {
      heading: "Genel Riskler ve Komplikasyonlar",
      paragraphs: [
        "Diş eti ve ağız içi yumuşak dokularda geçici tahriş; tedavi bölgesinde geçici hassasiyet veya ağrı; işlem sırasında/sonrasında sınırlı kanama; enfeksiyon riski; nadiren kullanılan materyal veya ilaçlara bağlı alerjik reaksiyon; tedavinin öngörülenden daha uzun sürmesi veya ek seans gerektirmesi olasılıkları bulunmaktadır.",
      ],
    },
    {
      heading: "Tedaviyi Reddetme veya Yarım Bırakma",
      paragraphs: [
        "Önerilen tedaviyi kısmen veya tamamen reddetme hakkınız bulunmaktadır. Ancak tedavi edilmeyen çürük, enfeksiyon veya diş eti hastalıklarının zaman içinde ilerleyerek diş kaybına, komşu dişlerde hasara ve genel sağlığı etkileyen komplikasyonlara yol açabileceği konusunda bilgilendirildim.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template("cekim", "Diş Çekimi Onam Formu", "Cerrahi", "Basit (rutin) diş çekimi işlemi için bilgilendirme ve onay.", [
    {
      heading: "Durum Hakkında Bilgi",
      paragraphs: [
        "Yapılan muayene ve radyografik değerlendirme sonucunda; ileri derecede çürük, tedavi edilemeyecek kadar ilerlemiş periodontal (diş eti/kemik) hastalığı, kırık veya konumsal bir sorun nedeniyle ilgili dişin çekilmesi gerektiği tespit edilmiştir.",
      ],
    },
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "İşlem, lokal anestezi altında dişin çevresindeki dokulardan nazikçe ayrılarak soketinden çıkarılması şeklinde uygulanır.",
      ],
    },
    {
      heading: "Alternatif Tedavi Seçenekleri",
      paragraphs: [
        "Uygun vakalarda kanal tedavisi ile dişin korunması alternatif olarak değerlendirilebilir. Tedavisiz izlem önerilmemektedir; zira mevcut enfeksiyon/hasar ilerleyerek daha kapsamlı bir müdahale gerektirebilir.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "• Çekilen diş veya diş parçalarının yutulması ya da nadiren solunum yoluna kaçması\n• Komşu dişlerde, mevcut dolgu/kronlarda hasar\n• Kök ucunda küçük bir parçanın tam çıkarılamaması (bilinçli olarak izlemde bırakılabilir)\n• Üst çene arka diş çekimlerinde sinüs boşluğuna açılma\n• Kanama (birkaç saat sürebilen sızıntı şeklinde; nadiren daha belirgin)\n• Kuru soket (alveolit) gelişimi\n• Çene, dudak, dil veya çene ucunda geçici, nadiren kalıcı sinir hasarı/uyuşukluk\n• Ağız açmada geçici kısıtlılık (trismus)\n• Çok nadir vakalarda çene kemiğinde kırık\n• Keskin kemik kenarları nedeniyle ek küçük bir düzeltme işlemi ihtiyacı",
      ],
    },
    {
      heading: "Tedavi Sonrası Dikkat Edilmesi Gerekenler",
      paragraphs: [
        "İşlem sonrası birkaç saat tükürmekten, ağzı çalkalamaktan ve pipetle içmekten kaçınılmalı; verilen gazlı bezle bölgeye hafif baskı uygulanmalı; sigara içilmemeli; sıcak ve sert gıdalardan uzak durulmalı; hekimin önerdiği ağrı kesici/antibiyotik kullanılmalı ve kontrol randevusuna gelinmelidir.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template(
    "gomulu_cekim",
    "Gömülü Diş Çekimi (Cerrahi Çekim) Onam Formu",
    "Cerrahi",
    "20 yaş dişi gibi gömülü/yarı gömülü dişlerin cerrahi olarak çıkarılması için bilgilendirme ve onay.",
    [
      {
        heading: "Durum Hakkında Bilgi",
        paragraphs: [
          "Değerlendirme sonucunda ilgili dişin kısmen veya tamamen çene kemiği/diş eti içinde gömülü olduğu, normal yollarla çekilemeyeceği ve cerrahi bir müdahale ile çıkarılması gerektiği tespit edilmiştir.",
        ],
      },
      {
        heading: "İşlem Hakkında Bilgi",
        paragraphs: [
          "İşlem, lokal anestezi altında diş eti/yumuşak dokuya kesi yapılması, gerektiğinde kemiğin bir kısmının kaldırılması ve dişin -gerekirse parçalara ayrılarak- çıkarılmasını içerir. İşlem süresi vakanın zorluğuna göre değişmekle birlikte ortalama 30-60 dakika sürebilir. İşlem sonunda dikiş atılır ve genellikle 7-10 gün içinde alınır.",
        ],
      },
      {
        heading: "Alternatif Tedavi Seçenekleri",
        paragraphs: [
          "Şikayete yol açmayan, komşu dişlere zarar vermeyen bazı gömülü dişlerde periyodik radyografik takip alternatif olarak değerlendirilebilir; bu seçenek hekiminiz tarafından uygun görülürse ayrıca değerlendirilir.",
        ],
      },
      {
        heading: "Olası Riskler ve Komplikasyonlar",
        paragraphs: [
          "Basit diş çekimindeki risklere ek olarak: dişin parçalara ayrılarak çıkarılması ihtiyacı; kemik kaldırma nedeniyle daha belirgin şişlik, morarma ve ağrı; alt çene 20 yaş dişi çekimlerinde çene sinirine yakınlık nedeniyle geçici, nadiren kalıcı parestezi (his kaybı/azalması) riski -bu risk radyografik değerlendirmeyle önceden öngörülmeye çalışılsa da tam olarak kestirilemeyebilir-; nadir vakalarda çene kemiğinde kırık; intermaksiller fiksasyon (çenelerin geçici olarak sabitlenmesi) ihtiyacı doğabilecek istisnai durumlar bulunmaktadır.",
        ],
      },
      {
        heading: "Tedavi Sonrası Dikkat Edilmesi Gerekenler",
        paragraphs: [
          "Basit çekim sonrası önerilere ek olarak: reçete edilen antibiyotik tam süre kullanılmalı; ilk 24 saat soğuk kompres, sonraki günlerde ılık kompres uygulanabilir; dikişlerin alınması için önerilen tarihte kontrole gelinmelidir.",
        ],
      },
      RADIOGRAPHY_SECTION,
      LOCAL_ANESTHESIA_SECTION,
      DECLARATION_SECTION,
    ],
  ),

  template("kanal", "Kanal Tedavisi (Endodonti) Onam Formu", "Endodonti", "Diş özünün (pulpa) iltihaplanması/ölümü durumunda uygulanan kanal tedavisi için bilgilendirme ve onay.", [
    {
      heading: "Durum Hakkında Bilgi",
      paragraphs: [
        "Derin çürük, travma veya tekrarlayan tedaviler nedeniyle dişinizin içindeki sinir-damar dokusu (pulpa) iltihaplanmış veya canlılığını yitirmiştir. Bu durum tedavi edilmediğinde ağrı, apse ve diş kaybına yol açabilir.",
      ],
    },
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Kanal tedavisi; iltihaplı/ölü pulpa dokusunun çıkarılması, kök kanallarının özel aletlerle şekillendirilip dezenfekte edilmesi ve uygun bir materyalle sızdırmaz şekilde doldurulmasını kapsar. Tedavi, kanal sayısı ve anatomisine bağlı olarak tek veya birden fazla seansta tamamlanabilir.",
      ],
    },
    {
      heading: "Alternatif Tedavi Seçenekleri",
      paragraphs: [
        "Kanal tedavisinin alternatifi ilgili dişin çekilmesidir. Dişin çekilmesi durumunda o bölgedeki çiğneme, estetik ve konuşma fonksiyonlarının etkilenebileceği; eksikliğin protetik bir çözümle (implant, köprü, hareketli protez) telafi edilmesi gerekebileceği tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "Kullanılan kanal aletinin kök kanalı içinde kırılması; madde kaybı fazla dişlerde kırılma riskinin artması; yıkama solüsyonunun veya kanal dolgu materyalinin kök ucundan taşarak geçici ağrı/şişliğe yol açması; seanslar arasında ağrı veya şişlik gelişmesi durumunda ek antibiyotik/randevu ihtiyacı; tedaviye rağmen iltihabın gerilememesi halinde endodontik cerrahi (apikal rezeksiyon) veya çekim gerekebilmesi olasılıkları bulunmaktadır.",
      ],
    },
    {
      heading: "İşlemin Başarı Olasılığı Hakkında Bilgi",
      paragraphs: [
        "Kanal tedavisinin başarı oranı yüksek olmakla birlikte, diş anatomisi, enfeksiyonun yaygınlığı ve üst yapının (dolgu/kron) zamanında tamamlanması gibi etkenlere bağlı olarak sonucun tıbben garanti edilemeyeceği tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "Tedavi Sonrası Dikkat Edilmesi Gerekenler",
      paragraphs: [
        "Anestezi etkisi geçene kadar o taraf ile yemek yenmemeli; geçici dolgu düşerse en kısa sürede hekime başvurulmalı; üst yapı (kalıcı dolgu/kron) tamamlanana kadar dişe sert gıdalarla aşırı yük bindirilmemeli; tedavi sonrası 7-10 gün sürebilen basınçla hissedilen hafif ağrı normal kabul edilmekle birlikte şiddetlenmesi halinde hekime başvurulmalıdır.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template("dolgu", "Dolgu ve Diş Restorasyonu Onam Formu", "Restoratif", "Çürük temizliği sonrası dişin dolgu materyaliyle restore edilmesi için bilgilendirme ve onay.", [
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Çürük veya hasarlı diş dokusunun temizlenmesinin ardından, diş anatomik form ve fonksiyonuna uygun bir dolgu materyali (kompozit, cam iyonomer vb.) ile restore edilir.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar (İşlem Sırasında)",
      paragraphs: [
        "Yetersiz anesteziye bağlı hassasiyet; kullanılan küçük malzemelerin (kama, bant vb.) yutulma riski; istemsiz hareketlere bağlı yumuşak doku yaralanması; çürüğün öngörülenden derin çıkması halinde kanal tedavisi ihtiyacına dönüşmesi olasılığı bulunmaktadır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar (Tedavi Sonrasında)",
      paragraphs: [
        "Dolgu sonrası birkaç gün sürebilen hassasiyet; sıcak-soğuğa karşı birkaç hafta sürebilen duyarlılık; nadiren devam eden ağrı durumunda kanal tedavisi gerekebilmesi; madde kaybı fazla dişlerde dolgunun zamanla düşmesi/kırılması; estetik bölgede dolgunun renk tonunun zamanla doğal dişten farklılaşabilmesi ve yenileme gerektirebilmesi olasılıkları bulunmaktadır.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template("implant", "Diş İmplantı Cerrahisi Onam Formu", "Cerrahi", "Eksik diş(ler) yerine çene kemiğine implant yerleştirilmesi için bilgilendirme ve onay.", [
    {
      heading: "İmplant Nedir?",
      paragraphs: [
        "Diş implantı, eksik diş(ler)in yerini almak üzere çene kemiğine cerrahi olarak yerleştirilen, genellikle titanyumdan üretilen yapay diş köküdür. Kemikle kaynaşma (osseointegrasyon) süreci genellikle 2-4 ay sürer; bu sürenin ardından implant üzerine kron, köprü veya hareketli protez gibi bir üst yapı uygulanır.",
      ],
    },
    {
      heading: "Alternatif Tedavi Seçenekleri",
      paragraphs: [
        "Diş eksikliğinin telafisinde sabit köprü, hareketli protez veya tedavisiz bırakma (önerilmez) alternatif olarak değerlendirilebilir; her seçeneğin kendine özgü avantaj ve dezavantajları hekiminiz tarafından tarafımla paylaşılmıştır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "Operasyon sonrası şişlik, morarma, kanama ve enfeksiyon; çevre dokularda geçici, nadiren kalıcı his kaybı/karıncalanma; üst çene implantlarında sinüs zarının zedelenmesi; yetersiz veya düzensiz kemik nedeniyle kemik grefti ve ek cerrahi ihtiyacı; implantın kemikle yeterince kaynaşamaması (osseointegrasyon başarısızlığı) nedeniyle implantın çıkarılmasının gerekebilmesi; vida gevşemesi veya kırılması; tedavi süresinin öngörülenden uzayabilmesi olasılıkları bulunmaktadır. Diyabet, aşırı sigara/alkol kullanımı, bağışıklık sistemi bozuklukları, bazı ilaç tedavileri (örn. bifosfonat) ve diş sıkma/gıcırdatma (bruksizm) alışkanlığının implant başarısını olumsuz etkileyebileceği tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "İmplant Bakımı ve Takip",
      paragraphs: [
        "İmplantın uzun ömürlü olması için titiz bir ağız hijyeni, hekimin önerdiği bakım programına uyum ve düzenli kontrol randevularına gelinmesi gerekmektedir.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template("periodontal", "Periodontal Tedavi (Diş Eti Tedavisi) Onam Formu", "Periodontoloji", "Diş eti iltihabı/periodontal hastalık için detartraj, küretaj veya cerrahi tedavi bilgilendirmesi ve onayı.", [
    {
      heading: "Durum Hakkında Bilgi",
      paragraphs: [
        "Muayene sonucunda diş etlerinizde iltihap, cep derinleşmesi ve/veya diş etini destekleyen kemikte kayıp (periodontal hastalık) tespit edilmiştir.",
      ],
    },
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Tedavi, diş taşı ve plağın diş yüzeyi ile kök yüzeyinden temizlenmesini (detartraj/küretaj) kapsar; ileri vakalarda flep operasyonu, gingivektomi veya dişeti grefti gibi cerrahi bir yaklaşım gerekebilir.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "Detartraj/küretaj sonrası dişeti çekilmesi, sıcak-soğuğa hassasiyet artışı ve dişlerin görünüşte uzaması gözlenebilir. Cerrahi tedavi uygulandığında ilk günlerde ağrı, hafif şişlik, kanama veya morarma; dişlerde aralanma ve gıda sıkışmasında artış; istenen sonucun alınamaması halinde tekrarlayan seans ihtiyacı olasılıkları bulunmaktadır.",
      ],
    },
    {
      heading: "Tedavi Sonrası Dikkat Edilmesi Gerekenler",
      paragraphs: [
        "Doku iyileşmesi genellikle 3-4 hafta sürer; bu süre boyunca sigara kesinlikle içilmemeli, hekimin önerdiği ağız bakım talimatlarına titizlikle uyulmalı ve periyodik kontrollere gelinmelidir.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template("ortodonti", "Ortodontik Tedavi Onam Formu", "Ortodonti", "Braket/tel veya şeffaf plak ile diş ve çene hizalama tedavisi için bilgilendirme ve onay.", [
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Ortodontik tedavi; diş ve/veya çene kapanış bozukluklarının braket-tel sistemi, şeffaf plaklar, genişletme apareyleri veya gerekli görülen diğer ortodontik yöntemlerle düzeltilmesini kapsar. Tedavi aktif (apareyin etkin olduğu) ve pekiştirme (retainer kullanılan) dönemlerinden oluşur. Bazı vakalarda çene içinde yeterli yer açmak amacıyla belirli diş(ler)in çekilmesi tedavi planına dahil edilebilir; bu durumda ayrıca bilgilendirilip onayınız alınır.",
      ],
    },
    {
      heading: "Hasta İşbirliğinin Önemi",
      paragraphs: [
        "Tedavi sonucunun; randevulara düzenli gelinmesine, apareyin/plakların önerilen süre ve şekilde kullanılmasına ve ağız hijyenine gösterilecek özene doğrudan bağlı olduğu tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "Tedavi süresince yeme, konuşma ve yutkunmada geçici güçlük; dudak, yanak ve dilde tahriş/yara; braket kopması veya tel kırılması; yetersiz fırçalama sonucu çürük, kalıcı beyaz leke oluşumu (white spot) ve diş eti iltihabı; nadiren kök ucunda kısalma (rezorpsiyon) gelişebileceği konusunda bilgilendirildim.",
      ],
    },
    {
      heading: "Tedavi Süresince Dikkat Edilmesi Gerekenler",
      paragraphs: [
        "Her öğün ve atıştırmalık sonrasında ağız temizliğine özen gösterilmeli, sert/yapışkan gıdalardan kaçınılmalı ve önerilen kontrol randevularına düzenli gelinmelidir.",
      ],
    },
    RADIOGRAPHY_SECTION,
    DECLARATION_SECTION,
  ]),

  template("beyazlatma", "Diş Beyazlatma Onam Formu", "Estetik", "Ofis tipi veya ev tipi diş beyazlatma uygulaması için bilgilendirme ve onay.", [
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Diş beyazlatma; ölçü alınarak hazırlanan kişiye özel plaklarla ev tipi uygulama veya klinikte tek seansta yapılan ofis tipi uygulama şeklinde gerçekleştirilebilir. Ev tipi uygulamada, hekimin belirlediği konsantrasyondaki jel plağa uygulanarak önerilen süre boyunca (konsantrasyona göre günde 4-10 saat) kullanılır.",
      ],
    },
    {
      heading: "Alternatif Tedavi Seçenekleri",
      paragraphs: [
        "Renk değişikliğinin derecesine göre lamina/kaplama gibi alternatif estetik çözümler değerlendirilebilir; bu seçeneklerin diş kesimi gerektirdiği tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "Tedaviyi Reddetme Durumunda",
      paragraphs: [
        "Diş beyazlatma tamamen estetik amaçlı bir işlemdir; bu tedaviyi uygulatmama kararının ağız-diş sağlığı açısından herhangi bir olumsuz sonucu bulunmamaktadır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar",
      paragraphs: [
        "Dişlerde az veya çok hassasiyet; dişeti, dudak, boğaz veya dilde geçici tahriş; jelin önerilenden fazla veya yanlış kullanımında dişetinde yanma/beyazlama; mevcut dolgu ve kronların renk değiştirmemesi nedeniyle renk uyumsuzluğu oluşabileceği konusunda bilgilendirildim.",
      ],
    },
    {
      heading: "Kullanım Talimatları",
      paragraphs: [
        "Jel yutulmamalı, plak takılıyken ağız çalkalanmamalı; hekime danışılmadan tedavi süresi/sıklığı değiştirilmemeli; tedavi süresince ve sonrasında yaklaşık 1 hafta boyunca çay, kahve, kırmızı şarap, koyu renkli meyve suları ve sigara gibi renklendirici madde içeren ürünlerden kaçınılmalı; jel serin bir ortamda saklanmalı ve çocukların ulaşamayacağı bir yerde tutulmalıdır.",
      ],
    },
    DECLARATION_SECTION,
  ]),

  template("protez", "Sabit ve Hareketli Protez Onam Formu", "Protez", "Kron, köprü veya hareketli protezle eksik/hasarlı dişlerin telafi edilmesi için bilgilendirme ve onay.", [
    {
      heading: "İşlem Hakkında Bilgi",
      paragraphs: [
        "Eksik veya aşırı madde kaybı olan diş(ler); sabit protez (kron, köprü, implant üstü sabit protez) veya hareketli protez (bölümlü/tam damak protezi) ile fonksiyonel ve estetik olarak telafi edilir. Tedavi; ölçü alma, geçici restorasyon kullanımı ve kalıcı protezin yerleştirilmesi aşamalarından oluşur.",
      ],
    },
    {
      heading: "Alternatif Tedavi Seçenekleri",
      paragraphs: [
        "Vaka uygunluğuna göre implant destekli protetik çözümler alternatif olarak değerlendirilebilir; ayrıca tedavisiz bırakma seçeneğinin çiğneme fonksiyonu, komşu/karşıt dişlerin konumu ve estetik açıdan olumsuz sonuçlara yol açabileceği tarafıma açıklanmıştır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar (Sabit Protez)",
      paragraphs: [
        "Renk/estetik açıdan tam istenen sonuca ulaşılamaması; implant üstü sabit protezlerde vida gevşemesi veya kırılması; porselen kısımda çatlak/kırılma; zamanla değiştirme veya onarım ihtiyacı doğabilmesi olasılıkları bulunmaktadır.",
      ],
    },
    {
      heading: "Olası Riskler ve Komplikasyonlar (Hareketli Protez)",
      paragraphs: [
        "Protez altında gıda birikmesi; kullanım başlangıcında yara oluşması ve adaptasyon süreci; konuşmada geçici zorluk; tutucu parçalarda zamanla aşınma; protez tutuculuğunun ağız dokularındaki değişime bağlı olarak azalabilmesi (besleme/yenileme ihtiyacı) olasılıkları bulunmaktadır.",
      ],
    },
    RADIOGRAPHY_SECTION,
    LOCAL_ANESTHESIA_SECTION,
    DECLARATION_SECTION,
  ]),

  template(
    "pedodonti",
    "Pedodonti (Çocuk Hasta) Diş Tedavisi Onam Formu",
    "Pedodonti",
    "Çocuk hastalarda koruyucu/tedavi edici diş hekimliği işlemleri için veli/vasi bilgilendirmesi ve onayı.",
    [
      {
        heading: "İşlem Hakkında Bilgi",
        paragraphs: [
          "Çocuğunuzun muayenesi sonucunda; koruyucu uygulamalar (florür uygulaması, fissür örtücü), dolgu, gerekli görülmesi halinde pulpa tedavisi/kanal tedavisi, diş çekimi veya erken kayıp durumunda yer tutucu uygulamalarından biri veya birkaçı önerilmiştir.",
        ],
      },
      {
        heading: "Olası Riskler ve Komplikasyonlar",
        paragraphs: [
          "Fissür örtücülerin zamanla kırılıp aşınabilmesi (bu durumda gıda birikimi ve yeniden çürük riski oluşabilir); florür uygulaması sırasında maddenin yutulmaması gerektiği; çocuğun tedaviye yeterli işbirliği göstermemesi halinde hekimin uygun davranış yönlendirme yöntemlerini kullanabileceği; tedavi edilmeyen süt dişi çürük/enfeksiyonlarının altındaki daimi diş germine zarar verebileceği konusunda bilgilendirildim.",
        ],
      },
      {
        heading: "Tedavi Sonrası Dikkat Edilmesi Gerekenler",
        paragraphs: [
          "Florür uygulaması sonrası 30 dakika yeme-içme yapılmamalı; fissür örtücü/dolgu yapılan dişler düzenli kontrol edilmeli; ağız hijyeni ve beslenme alışkanlıkları konusunda hekimin önerilerine uyulmalıdır.",
        ],
      },
      RADIOGRAPHY_SECTION,
      LOCAL_ANESTHESIA_SECTION,
      DECLARATION_SECTION_GUARDIAN,
    ],
  ),

  template(
    "sedasyon",
    "Genel Anestezi / Sedasyon Altında Diş Tedavisi Onam Formu",
    "Anestezi",
    "İşbirliği kurulamayan hastalarda genel anestezi veya sedasyon altında diş tedavisi için bilgilendirme ve onay.",
    [
      {
        heading: "İşlem Öncesi Bilgilendirme",
        paragraphs: [
          "İşlem öncesinde en az 8 saat (tercihen gece yarısından itibaren) katı ve sıvı gıda alınmaması, belirlenen saatte ve refakatçiyle birlikte klinikte hazır bulunulması, kullanılan ilaçlar ve varsa tetkik sonuçlarının hekimle önceden paylaşılması gerekmektedir.",
        ],
      },
      {
        heading: "İşlem Sırasında",
        paragraphs: [
          "Anestezi/sedasyon, bu konuda uzman bir hekim gözetiminde uygulanır. İşlem süresi, tedavinin kapsamına ve karşılaşılan zorluğa göre değişebilir; hasta yakınlarının işlem alanına giremeyeceği ve işlem süresince iletişim kurulamayacağı tarafıma açıklanmıştır.",
        ],
      },
      {
        heading: "Olası Riskler ve Komplikasyonlar",
        paragraphs: [
          "Kullanılan ilaçlara bağlı alerjik reaksiyon; bulantı, kusma; nadiren solunum veya dolaşım sistemini ilgilendiren ciddi komplikasyonlar; işlem sonrası geçici konfüzyon, ses kısıklığı veya baş dönmesi gelişebileceği konusunda bilgilendirildim.",
        ],
      },
      {
        heading: "İşlem Sonrası Dikkat Edilmesi Gerekenler",
        paragraphs: [
          "Hasta, anestezinin etkisi tamamen geçene ve sağlık ekibi onayı verilene kadar gözlem altında tutulur. Eve gidildikten sonra ilk saatlerde uyuşuk bölgelerin (dudak, dil, yanak) istemsizce ısırılmaması, hekimin belirttiği süre boyunca beslenme ve aktivite kısıtlamalarına uyulması, olağan dışı bir belirti (aşırı kanama, yüksek ateş, nefes darlığı vb.) durumunda derhal klinikle iletişime geçilmesi gerekmektedir.",
        ],
      },
      DECLARATION_SECTION,
    ],
  ),
];

export function findConsentTemplate(key: string): ConsentTemplate | undefined {
  return CONSENT_FORM_TEMPLATES.find((t) => t.key === key);
}

export const CONSENT_FORM_CATEGORIES: string[] = Array.from(
  new Set(CONSENT_FORM_TEMPLATES.map((t) => t.category)),
);
