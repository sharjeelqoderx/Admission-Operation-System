export function buildSignatureBlockHtml(options: {
    status: string
    fileUrl?: string | null
    studentName?: string | null
    acceptedAt?: string | null
}): string {
    if (options.status === "ACCEPTED" && options.fileUrl) {
        return `<div style="margin-top:32px;border-top:1px dashed #e5e7eb;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
            <img src="${options.fileUrl}" alt="Signature" style="width:140px;height:48px;object-fit:contain;background:transparent;mix-blend-mode:multiply;" />
            <div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">
                <div style="font-weight:700;color:#374151;">${options.studentName || ""}</div>
                <div>Accepted &amp; Signed on ${options.acceptedAt || new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
            </div>
        </div>`
    }

    return `<div style="margin-top:32px;border-top:1px dashed #f3f4f6;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
        <div style="font-size:10px;color:#d1d5db;font-style:italic;">Signature Required</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Pending Student Signature</div>
    </div>`
}

export function buildLegacyLetterHeadHtml(options: {
    studentName?: string | null
    universityName?: string | null
    courseName?: string | null
    degreeName?: string | null
    issuedAt: string
    applicationRef: string
    admissionDetailRows: [string, string][]
    signatureHtml: string
    variant?: "preview" | "pdf"
}): string {
    const {
        studentName,
        universityName,
        courseName,
        degreeName,
        issuedAt,
        applicationRef,
        admissionDetailRows,
        signatureHtml,
        variant = "preview",
    } = options

    const admissionTableRows = admissionDetailRows
        .map(
            ([label, value]) =>
                `<tr><td style="padding:9px 14px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td><td style="padding:9px 14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${value}</td></tr>`
        )
        .join("")

    const headerBlock = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
            <div>
              <div style="font-size:22px;font-weight:900;color:#1a1a2e;letter-spacing:-0.5px;">${universityName || "University"}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Official Offer of Admission</div>
            </div>
            <div style="text-align:right;font-size:11px;color:#9ca3af;">
              <div>Date Issued</div>
              <div style="font-weight:700;color:#374151;">${issuedAt}</div>
              <div style="margin-top:4px;">Ref: ${applicationRef}</div>
            </div>
          </div>
          <hr style="border:none;border-top:2px solid #f3f4f6;width:100%;"/>
          <div style="font-size:15px;color:#374151;width:100%;">Dear <strong>${studentName || "Applicant"}</strong>,</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.8;width:100%;">
            We are pleased to offer you admission to the <strong>${courseName || "course"}</strong>${degreeName ? ` (${degreeName})` : ""} at <strong>${universityName || "our university"}</strong>.
          </div>
          <div style="font-size:14px;color:#4b5563;line-height:1.8;width:100%;">
            Your academic achievement and potential make you an excellent candidate for our program. This offer is subject to the terms and conditions outlined in the full admission package.
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
            <thead><tr style="background:#f9fafb;"><th colspan="2" style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Admission Details</th></tr></thead>
            <tbody>${admissionTableRows}</tbody>
          </table>`

    if (variant === "pdf") {
        return `<!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body {
                  margin: 0; padding: 0; width: 794px; height: 1123px;
                  overflow: hidden; font-family: Georgia, serif; background-color: #ffffff;
                }
              </style>
            </head>
            <body>
              <div style="width:100%;height:100%;padding:60px;display:flex;flex-direction:column;gap:32px;position:relative;box-sizing:border-box;background:#ffffff;justify-content:space-between;">
                <div style="display:flex;flex-direction:column;gap:32px;width:100%;">
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.03;pointer-events:none;transform:rotate(-35deg);"><span style="font-size:120px;font-weight:900;letter-spacing:8px;color:black;user-select:none;">OFFICIAL</span></div>
                  ${headerBlock}
                </div>
                <div style="width:100%;display:flex;flex-direction:column;gap:16px;">
                  ${signatureHtml}
                  <div style="font-size:10px;color:#d1d5db;text-align:center;width:100%;">This is an official offer letter generated by the Admission Operation System.</div>
                </div>
              </div>
            </body>
            </html>`
    }

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Letter Head – ${studentName || "Applicant"}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f3f4f6;display:flex;justify-content:center;padding:40px 16px;font-family:Georgia,serif;}@media print{body{background:white;padding:0;}.page{box-shadow:none!important;}}</style>
        </head><body>
        <div class="page" style="background:white;max-width:720px;width:100%;min-height:1000px;padding:60px;box-shadow:0 4px 32px rgba(0,0,0,0.12);border-radius:8px;display:flex;flex-direction:column;gap:32px;position:relative;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.03;pointer-events:none;transform:rotate(-35deg);"><span style="font-size:120px;font-weight:900;letter-spacing:8px;color:black;">OFFICIAL</span></div>
          ${headerBlock}
          ${signatureHtml}
          <div style="font-size:10px;color:#d1d5db;text-align:center;margin-top:16px;">This is an official offer letter generated by the Admission Operation System.</div>
        </div>
        </body></html>`
}

export function buildTemplateOfferLetterHtml(
    bodyHtml: string,
    options?: {
        title?: string
        signatureHtml?: string
    }
): string {
    const title = options?.title ?? "Offer Letter"
    const signatureHtml = options?.signatureHtml ?? ""

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f3f4f6; display: flex; justify-content: center; padding: 40px 16px; font-family: Georgia, serif; }
        @media print { body { background: white; padding: 0; } .page { box-shadow: none !important; } }
        .page { background: white; max-width: 210mm; width: 100%; min-height: 297mm; padding: 20mm 15mm; box-shadow: 0 4px 32px rgba(0,0,0,0.12); border-radius: 8px; }
        img { max-width: 100%; height: auto; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #e5e7eb; padding: 8px; }
    </style>
    </head><body>
    <div class="page">
        ${bodyHtml}
        ${signatureHtml}
    </div>
    </body></html>`
}
