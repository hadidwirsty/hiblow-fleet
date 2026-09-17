# hiblow-fleet

Aplikasi manajemen operasional armada truk tronton tangki semen curah (*HI-Blow Truck*) dan pencatatan keuangan bulanan Hadya Wiran Trans (HW Trans), menggantikan pencatatan manual spreadsheet Excel.

---

## 📁 Struktur Direktori & Dokumentasi

Dokumen perencanaan dan data acuan tersimpan rapi di dalam direktori `docs/`:

```text
hiblow-fleet/
├── .agents/
│   └── rules/
│       └── project-context.md          # Dokumen memory arsitektur untuk Antigravity AI
├── docs/
│   ├── 01-scope-dan-non-goals.md       # Batasan versi 1 (yang dibuat vs yang ditunda)
│   ├── 02-feature-list-prioritas.md    # Matriks prioritas MoSCoW & kolom review
│   ├── 03-pertanyaan-validasi-data.md  # 4 pertanyaan konfirmasi aturan bisnis
│   ├── hiblow-project-summary.md       # Ringkasan menyeluruh blueprint sistem & formula
│   └── references/
│       └── PERHITUNGAN HIBLOW HW Trans.xlsx # Spreadsheet acuan rumus & histori
└── README.md
```

### Dokumen Pre-Development (Untuk Review & WhatsApp)
Tersedia dalam format `.md` (kode sumber) dan `.pdf` (siap dibagikan via WhatsApp):
1. **Scope & Batasan:** [01-scope-dan-non-goals.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/01-scope-dan-non-goals.md) | [01-scope-dan-non-goals.pdf](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/pdf/01-scope-dan-non-goals.pdf)
2. **Prioritas Fitur (MoSCoW):** [02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md) | [02-feature-list-prioritas.pdf](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/pdf/02-feature-list-prioritas.pdf)
3. **Pertanyaan Validasi Bisnis:** [03-pertanyaan-validasi-data.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/03-pertanyaan-validasi-data.md) | [03-pertanyaan-validasi-data.pdf](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/pdf/03-pertanyaan-validasi-data.pdf)
4. **Project Blueprint & Formula:** [hiblow-project-summary.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/hiblow-project-summary.md) | [hiblow-project-summary.pdf](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/pdf/hiblow-project-summary.pdf)
5. **Technical Design Doc:** [specs/2026-09-03-hiblow-fleet-design.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-03-hiblow-fleet-design.md)

---

## 🛠️ Rencana Tech Stack (Opsi 1: Feature-Driven Monolith)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Database & ORM:** PostgreSQL 17 + Drizzle ORM
- **Styling:** Tailwind CSS v4 + shadcn/ui + Lucide Icons
- **Autentikasi:** Better Auth (Role: Admin / Pengelola & Investor / Partner)
- **Logika Bisnis:** *Pure Domain Engine* terisolasi untuk pengujian 100% unit test rumus finansial.
