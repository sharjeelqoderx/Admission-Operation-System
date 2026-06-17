import {
  buildDbBedingteZuLetterFooterHtml,
  buildDbBedingteZuLetterHeaderHtml,
} from "@/components/shared/db-bedingte-zu/letter-header-footer"

export type LetterType =
  | "business_administration"
  | "international_business"
  | "digital_business"
  | "media_management"
  | "tourism_management"
  | "sport_management"
  | "event_management"
  | "health_management"
  | "psychology"

export const LETTER_CONFIGS: Record<
  LetterType,
  {
    courseNameEN: string
    courseNameDE: string
  }
> = {
  business_administration: {
    courseNameEN: "Business Administration",
    courseNameDE: "Betriebswirtschaftslehre",
  },
  international_business: {
    courseNameEN: "International Business",
    courseNameDE: "Internationales Wirtschaften",
  },
  digital_business: {
    courseNameEN: "Digital Business",
    courseNameDE: "Digitale Wirtschaft",
  },
  media_management: {
    courseNameEN: "Media Management",
    courseNameDE: "Medienmanagement",
  },
  tourism_management: {
    courseNameEN: "Tourism Management",
    courseNameDE: "Tourismusmanagement",
  },
  sport_management: {
    courseNameEN: "Sport Management",
    courseNameDE: "Sportmanagement",
  },
  event_management: {
    courseNameEN: "Event Management",
    courseNameDE: "Eventmanagement",
  },
  health_management: {
    courseNameEN: "Health Management",
    courseNameDE: "Gesundheitsmanagement",
  },
  psychology: {
    courseNameEN: "Psychology",
    courseNameDE: "Psychologie",
  },
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function buildA4PageHtml(bodyHtml: string, footerHtml: string) {
  return `
      <section class="a4-page">
        <div class="page-inner">
          <div class="page-body">${bodyHtml}</div>
          <div class="page-footer">${footerHtml}</div>
        </div>
      </section>
    `
}

export function buildDbBedingteZuLetterHtml(params: {
  origin: string
  issueCityAndDate: string
  studentName: string
  courseTitle: string
  programWindow: string
  registrationWindow: string
  universityName?: string
  letterType: LetterType
}) {
  const {
    origin,
    issueCityAndDate,
    studentName,
    courseTitle,
    programWindow,
    registrationWindow,
    universityName = "Fachhochschule des Mittelstands (FHM)",
  } = params

  const header = buildDbBedingteZuLetterHeaderHtml({ origin })

  const footer = buildDbBedingteZuLetterFooterHtml({
    universityName: "FHM",
    phone: "+49 000 000000",
    website: "https://www.fh-mittelstand.de",
    email: "info@fh-mittelstand.de",
  })

  const page1Body = `
      ${header}
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div style="flex:1 1 auto;"></div>
        <div style="flex:0 0 auto;text-align:right;font-size:11px;color:#111827;">
          ${escapeHtml(issueCityAndDate)}
        </div>
      </div>

      <div style="height:22px;"></div>

      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:900;letter-spacing:0.02em;">ZULASSUNGSBESCHEID</div>
        <div style="font-size:10px;color:#6b7280;margin-top:6px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          VORLÄUFIG (NICHT GÜLTIG FÜR VISA-ZWECKE)
        </div>
      </div>

      <div style="height:18px;"></div>

      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;width:25%;color:#6b7280;font-weight:700;">Name</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">${escapeHtml(
              studentName
            )}</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;width:22%;color:#6b7280;font-weight:700;">Vorname</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
          </tr>
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;color:#6b7280;font-weight:700;">Geburtsdatum</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;color:#6b7280;font-weight:700;">Bewerbernummer</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
          </tr>
        </tbody>
      </table>

      <div style="height:16px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.75;">
        Sehr geehrter Herr / Sehr geehrte Frau <strong>${escapeHtml(
          studentName
        )}</strong>,<br/>
        hiermit teilen wir Ihnen mit, Ihnen vorläufig und bedingt einen Studienplatz im Studiengang<br/>
        <strong>${escapeHtml(courseTitle)}</strong><br/>
        zu gewähren.
      </div>

      <div style="height:16px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.75;">
        <strong>Programmdauer:</strong> ${escapeHtml(programWindow)}<br/>
        <strong>Einschreibung:</strong> ${escapeHtml(registrationWindow)}
      </div>

      <div style="height:18px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.7;">
        Mit freundlichen Grüßen<br/>
        <span style="font-weight:800;">${escapeHtml(universityName)}</span>
      </div>

      <div style="display:flex;align-items:flex-end;gap:24px;margin-top:18px;">
        <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
          <img src="${origin}/assets/signature.jpg" alt="Signature" style="height:60px;width:auto;object-fit:contain;" />
          <div style="font-size:10px;color:#6b7280;">
            Prof. Dr. Volker Wittberg<br/>
            Prorektor Internationales
          </div>
        </div>
        <img src="${origin}/assets/conditional-letter-stamp.png" alt="Stamp" style="height:140px;width:auto;object-fit:contain;" />
      </div>
    `

  const page2Body = `
      ${header}
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div style="flex:1 1 auto;"></div>
        <div style="text-align:right;font-size:11px;color:#111827;">
          ${escapeHtml(issueCityAndDate)}
        </div>
      </div>

      <div style="height:20px;"></div>

      <div style="text-align:center;">
        <div style="font-size:16px;font-weight:900;letter-spacing:0.02em;">ADMISSION</div>
        <div style="font-size:10px;color:#6b7280;margin-top:6px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          PROVISIONAL (NOT VALID FOR VISA PURPOSES)
        </div>
      </div>

      <div style="height:16px;"></div>

      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;width:28%;color:#6b7280;font-weight:700;">Surname</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">${escapeHtml(
              studentName
            )}</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;width:22%;color:#6b7280;font-weight:700;">Given name</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
          </tr>
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;color:#6b7280;font-weight:700;">Date of birth</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;color:#6b7280;font-weight:700;">Application no.</td>
            <td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:700;">—</td>
          </tr>
        </tbody>
      </table>

      <div style="height:16px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.75;">
        Dear Mr./Ms. <strong>${escapeHtml(studentName)}</strong>,<br/>
        hereby you are granted provisional admission for the study program<br/>
        <strong>${escapeHtml(courseTitle)}</strong><br/>
        for the winter semester.
      </div>

      <div style="height:16px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.75;">
        <strong>Duration of the program:</strong> ${escapeHtml(programWindow)}<br/>
        <strong>Registration:</strong> ${escapeHtml(registrationWindow)}
      </div>

      <div style="height:20px;"></div>

      <div style="display:flex;align-items:flex-end;gap:24px;">
        <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
          <img src="${origin}/assets/signature.jpg" alt="Signature" style="height:60px;width:auto;object-fit:contain;" />
          <div style="font-size:11px;color:#111827;line-height:1.7;">
            With kind regards,<br/>
            <span style="font-weight:800;">${escapeHtml(universityName)}</span>
          </div>
        </div>
        <img src="${origin}/assets/conditional-letter-stamp.png" alt="Stamp" style="height:140px;width:auto;object-fit:contain;" />
      </div>
    `

  const page3Body = `
      ${header}
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div style="font-size:12px;font-weight:900;letter-spacing:0.02em;">
          ${escapeHtml(universityName)}
        </div>
        <div style="text-align:right;font-size:11px;color:#111827;">
          ${escapeHtml(issueCityAndDate)}
        </div>
      </div>

      <div style="height:14px;"></div>

      <div style="text-align:center;font-size:12px;font-weight:900;">
        Refund Policy: Tuition Fee (2019-06-20)
      </div>

      <div style="height:12px;"></div>

      <div style="font-size:11px;color:#111827;line-height:1.7;">
        Before starting a study program, the international participant of any study program is requested to pay the tuition fee.
        An invoice is submitted.
      </div>

      <div style="height:10px;"></div>

      <ol style="margin:0;padding-left:18px;font-size:11px;color:#111827;line-height:1.7;">
        <li>The FHM refunds 100% of the fees charged if the visa of the participant has been rejected.</li>
        <li>The FHM refunds administrative fee of 150 € will be charged.</li>
        <li>The FHM refunds 70% of the fees charged if the applicant does not attend the interview at the embassy.</li>
        <li>The FHM refunds 50% of the fees charged if the visa has been issued and the applicant cancels participation.</li>
        <li>The FHM refunds 70% of the fees charged if the visa has been issued and the applicant cancels on health grounds.</li>
        <li>The FHM does not refund if termination is 14 days before the start of the program.</li>
        <li>The international participant ensures the bank details he/she provides are correct.</li>
        <li>Additional agreements are not accepted. Legal venue is Bielefeld.</li>
      </ol>
    `

  const page1 = buildA4PageHtml(page1Body, footer)
  const page2 = buildA4PageHtml(page2Body, footer)
  const page3 = buildA4PageHtml(page3Body, footer)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DB-bedingte-zu letter</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px 12px;
        background: #f3f4f6;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
      }
      .letter-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
      }
      .a4-page {
        width: 794px;
        height: 1123px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 36px rgba(0,0,0,0.10);
        overflow: hidden;
      }
      .page-inner {
        width: 100%;
        height: 100%;
        min-height: 1123px;
        padding: 44px 44px 20px;
        display: flex;
        flex-direction: column;
      }
      .page-body {
        flex: 1 1 auto;
        min-height: 0;
      }
      .page-footer {
        flex-shrink: 0;
        margin-top: 0;
        padding-top: 8px;
      }
      @media print {
        body { background: white; padding: 0; }
        .a4-page { box-shadow: none; border-radius: 0; }
        .letter-shell { gap: 0; }
      }
    </style>
  </head>
  <body>
    <div class="letter-shell">
      ${page1}
      ${page2}
      ${page3}
    </div>
  </body>
</html>`
}

export function resolveLetterTypeFromCourse(
  courseName?: string | null,
  degreeName?: string | null
): LetterType {
  const haystack = `${courseName ?? ""} ${degreeName ?? ""}`.toLowerCase()

  for (const [key, config] of Object.entries(LETTER_CONFIGS)) {
    const english = config.courseNameEN.toLowerCase()
    const german = config.courseNameDE.toLowerCase()
    if (haystack.includes(english) || haystack.includes(german)) {
      return key as LetterType
    }
  }

  return "business_administration"
}

export function buildDbBedingteZuLetterParamsFromOffer(
  offer: {
    created_at?: string | null
    application?: {
      student?: { name?: string | null } | null
      course?: {
        name?: string | null
        degree?: { name?: string | null } | null
      } | null
    } | null
  },
  origin: string
) {
  const app = offer.application
  const student = app?.student
  const course = app?.course
  const degree = course?.degree

  const issuedAt = offer.created_at
    ? new Date(offer.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—"

  return {
    origin,
    issueCityAndDate: `Bielefeld, ${issuedAt}`,
    studentName: student?.name ?? "Applicant",
    courseTitle: [course?.name, degree?.name].filter(Boolean).join(" ") || "Course",
    programWindow: "01.10.2026 – 30.09.2029",
    registrationWindow: "01.10.2026 – 14.10.2026",
  }
}

/** Same flow as offer letter view: blank tab + document.write */
export function openDbBedingteZuLetterPreview(html: string): boolean {
  if (typeof window === "undefined") return false

  const win = window.open("", "_blank")
  if (!win) return false

  win.document.write(html)
  win.document.close()
  return true
}
