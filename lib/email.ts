import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Your FHM Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Verify your account</h2>
        <p>Your OTP:</p>
        <h1>${otp}</h1>
      </div>
    `,
  })
}