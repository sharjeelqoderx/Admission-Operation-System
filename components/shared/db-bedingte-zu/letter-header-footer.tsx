export const DB_BEDINGTE_ZU_HEADER_ADDRESS =
    "FHM // Internation office // Ravensberger Str. 10 G // 33602 Bielefeld"

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

export function buildDbBedingteZuLetterHeaderHtml(params: {
    origin: string
    addressLine?: string
}) {
    const { origin, addressLine = DB_BEDINGTE_ZU_HEADER_ADDRESS } = params

    const addressHtml = `<div style="font-size:10px;font-weight:700;line-height:1.35;color:#111827;">${escapeHtml(
        addressLine
    )}</div>`

    return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
        <div style="flex:0 0 auto;">
          <img
            src="${origin}/logo-blue.png"
            alt="Logo"
            style="height:44px;width:auto;object-fit:contain;"
          />
        </div>
        <div style="flex:1 1 auto;text-align:center;">
          ${addressHtml}
        </div>
      </div>
      <div style="height:14px;"></div>
      <hr style="border:none;border-top:1px solid #e5e7eb;"/>
    `
}

export function buildDbBedingteZuLetterFooterHtml(params: {
    universityName: string
    phone: string
    website: string
    email: string
}) {
    const { universityName, phone, website, email } = params

    const cellStyle =
        "padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;"

    const labelStyle =
        "font-size:10px;color:#6b7280;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;"

    const valueStyle = "font-size:11px;color:#111827;font-weight:600;word-break:break-word;"

    return `
      <hr style="border:none;border-top:1px solid #e5e7eb;"/>
      <div style="height:14px;"></div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;">
        <div style="${cellStyle}">
          <div style="${labelStyle}">University</div>
          <div style="${valueStyle}">${universityName}</div>
        </div>
        <div style="${cellStyle}">
          <div style="${labelStyle}">Phone</div>
          <div style="${valueStyle}">${phone}</div>
        </div>
        <div style="${cellStyle}">
          <div style="${labelStyle}">Website</div>
          <div style="${valueStyle}">${website}</div>
        </div>
        <div style="${cellStyle}">
          <div style="${labelStyle}">Email</div>
          <div style="${valueStyle}">${email}</div>
        </div>
      </div>
    `
}

