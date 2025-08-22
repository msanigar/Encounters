'use node'

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'



export const sendInviteEmail = action({
  args: {
    to: v.string(),
    providerName: v.string(),
    when: v.number(), // timestamp
    inviteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { to, providerName, when, inviteUrl } = args
    
    // Format the date/time
    const whenDate = new Date(when)
    const whenLocal = whenDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    const subject = 'Your telehealth encounter link'
    const textBody = `Hello,

You have a telehealth encounter scheduled with ${providerName} on ${whenLocal}.

To join, click this one-time link:
${inviteUrl}

If the link doesn't work, copy and paste it into your browser.
This link is tied to your upcoming encounter. If you need to move devices later, use "Take this call elsewhere" in the app.

Thank you.`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Telehealth Encounter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0;">Your Telehealth Encounter</h1>
    <p style="margin: 0; color: #6b7280;">Scheduled appointment details</p>
  </div>
  
  <p>Hello,</p>
  
  <p>You have a telehealth encounter scheduled with <strong>${providerName}</strong> on <strong>${whenLocal}</strong>.</p>
  
  <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 15px 0;"><strong>To join your encounter:</strong></p>
    <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Encounter</a>
  </div>
  
  <p><strong>Important:</strong></p>
  <ul>
    <li>This is a one-time link tied to your upcoming encounter</li>
    <li>If the button doesn't work, copy and paste this link into your browser: <br><code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${inviteUrl}</code></li>
    <li>If you need to move devices later, use "Take this call elsewhere" in the app</li>
  </ul>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #6b7280; font-size: 14px;">
    This email was sent regarding your scheduled telehealth encounter. If you have any questions, please contact your healthcare provider.
  </p>
</body>
</html>`

    try {
      // Try Resend first if API key is available
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        console.log('📧 Sending email via Resend...')
        const resend = new Resend(resendApiKey)
        
        const emailFrom = process.env.EMAIL_FROM || 'no-reply@example.com'
        
        const result = await resend.emails.send({
          from: emailFrom,
          to: [to],
          subject,
          text: textBody,
          html: htmlBody,
        })

        console.log('✅ Email sent via Resend:', result)
        return {
          success: true,
          provider: 'resend',
          messageId: result.data?.id,
          to,
          subject,
        }
      }

      // Try SMTP if configured
      const smtpHost = process.env.SMTP_HOST
      if (smtpHost) {
        console.log('📧 Sending email via SMTP...')
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        const emailFrom = process.env.EMAIL_FROM || 'no-reply@example.com'
        
        const result = await transporter.sendMail({
          from: emailFrom,
          to,
          subject,
          text: textBody,
          html: htmlBody,
        })

        console.log('✅ Email sent via SMTP:', result.messageId)
        return {
          success: true,
          provider: 'smtp',
          messageId: result.messageId,
          to,
          subject,
        }
      }

      // Fallback to Ethereal (dev account)
      console.log('📧 Creating Ethereal test account...')
      const testAccount = await nodemailer.createTestAccount()
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })

      const result = await transporter.sendMail({
        from: '"Telehealth Platform" <no-reply@telehealth.example>',
        to,
        subject,
        text: textBody,
        html: htmlBody,
      })

      const previewUrl = nodemailer.getTestMessageUrl(result)
      console.log('✅ Email sent via Ethereal (dev):', result.messageId)
      console.log('📧 Preview URL:', previewUrl)

      return {
        success: true,
        provider: 'ethereal',
        messageId: result.messageId,
        previewUrl,
        to,
        subject,
      }

    } catch (error) {
      console.error('❌ Failed to send email:', error)
      throw new Error(`Failed to send email: ${error}`)
    }
  },
})
