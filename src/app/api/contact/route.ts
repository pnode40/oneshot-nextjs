import { NextResponse } from 'next/server';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(1, 'Message is required'),
});

// Setup SendGrid API Key from env
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, message } = parsed.data;

    const msg = {
      to: process.env.CONTACT_RECEIVER_EMAIL!,
      from: process.env.SENDER_EMAIL_ADDRESS!,
      subject: `New Contact Form Submission from ${name}`,
      text: message,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to send email' },
      { status: 500 }
    );
  }
} 