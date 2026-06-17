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
