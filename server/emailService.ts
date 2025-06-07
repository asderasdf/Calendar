import 'dotenv/config';
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// إعداد ناقل البريد الإلكتروني
const transporter = nodemailer.createTransport({
  host: 'mail.t.twseil.com', 
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@t.twseil.com',
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// معلومات المرسل
const senderInfo = {
  name: 'تقويم أم القرى',
  email: 'noreply@twseil.com',
};

// إنشاء رمز إعادة تعيين كلمة المرور
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
export async function sendPasswordResetEmail(
  userEmail: string,
  resetToken: string
): Promise<boolean> {
  try {
    // رابط لإعادة تعيين كلمة المرور (سيتم استبداله برابط فعلي في الإنتاج)
    const resetUrl = `${
      process.env.APP_URL || 'http://localhost:5000'
    }/auth?reset=${resetToken}`;

    // محتوى البريد الإلكتروني
    const mailOptions = {
      from: `"${senderInfo.name}" <${senderInfo.email}>`,
      to: userEmail,
      subject: 'إعادة تعيين كلمة المرور - تقويم أم القرى',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>مرحبًا،</p>
          <p>لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك. انقر على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
          <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a></p>
          <p>أو انسخ والصق الرابط التالي في متصفحك:</p>
          <p>${resetUrl}</p>
          <p>سينتهي هذا الرابط خلال ساعة واحدة.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
          <p>مع التحية،<br>فريق تقويم أم القرى</p>
        </div>
      `,
    };

    // إرسال البريد الإلكتروني
    const info = await transporter.sendMail(mailOptions);

    console.log(`تم إرسال بريد إعادة تعيين كلمة المرور إلى: ${userEmail}`);
    console.log(`معرف الرسالة: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error('خطأ في إرسال بريد إعادة تعيين كلمة المرور:', error);
    return false;
  }
}

// إرسال بريد إلكتروني للترحيب
export async function sendWelcomeEmail(userEmail: string): Promise<boolean> {
  try {
    // محتوى البريد الإلكتروني
    const mailOptions = {
      from: `"${senderInfo.name}" <${senderInfo.email}>`,
      to: userEmail,
      subject: 'مرحبًا بك في تقويم أم القرى',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>مرحبًا بك في تقويم أم القرى</h2>
          <p>مرحبًا،</p>
          <p>شكرًا لتسجيلك في تطبيق تقويم أم القرى. نحن سعداء بانضمامك إلينا!</p>
          <p>يوفر التطبيق معلومات دقيقة عن التقويم الهجري والميلادي، ويساعدك على تنظيم مواعيدك وفعالياتك بكفاءة.</p>
          <p>إذا كنت بحاجة إلى أي مساعدة، لا تتردد في التواصل معنا.</p>
          <p>مع التحية،<br>فريق تقويم أم القرى</p>
        </div>
      `,
    };

    // إرسال البريد الإلكتروني
    const info = await transporter.sendMail(mailOptions);

    console.log(`تم إرسال بريد الترحيب إلى: ${userEmail}`);
    console.log(`معرف الرسالة: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error('خطأ في إرسال بريد الترحيب:', error);
    return false;
  }
}

// التحقق من اتصال البريد الإلكتروني
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('خادم البريد الإلكتروني جاهز لاستقبال الرسائل');
    return true;
  } catch (error) {
    console.error('خطأ في اتصال البريد الإلكتروني:', error);
    return false;
  }
}

// إرسال بريد تحقق الإيميل برمز 6 أرقام
export async function sendVerificationEmail(
  userEmail: string,
  verificationToken: string
): Promise<boolean> {
  try {
    // محتوى البريد الإلكتروني
    const mailOptions = {
      from: `"${senderInfo.name}" <${senderInfo.email}>`,
      to: userEmail,
      subject: 'رمز التحقق - تقويم أم القرى',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C3E50; border-bottom: 2px solid #3498DB; padding-bottom: 10px;">رمز التحقق من تقويم أم القرى</h2>
          <p style="font-size: 16px;">مرحبًا،</p>
          <p style="font-size: 16px;">شكرًا لتسجيلك في تطبيق تقويم أم القرى. للتحقق من بريدك الإلكتروني، يرجى استخدام رمز التحقق التالي:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; border: 1px dashed #ccc;">
            <h1 style="color: #3498DB; letter-spacing: 5px; font-size: 32px; margin: 0; font-family: monospace;">${verificationToken}</h1>
          </div>
          
          <p style="font-size: 16px;">يرجى إدخال هذا الرمز في تطبيق تقويم أم القرى لإكمال عملية التحقق.</p>
          <p style="font-size: 14px; color: #7F8C8D;">ملاحظة: هذا الرمز صالح لمدة 24 ساعة فقط.</p>
          <p style="font-size: 16px;">إذا لم تكن أنت من قام بالتسجيل، يرجى تجاهل هذا البريد الإلكتروني.</p>
          <p style="font-size: 16px; margin-top: 20px;">مع التحية،<br>فريق تقويم أم القرى</p>
        </div>
      `,
    };

    // إرسال البريد الإلكتروني
    const info = await transporter.sendMail(mailOptions);

    console.log(`تم إرسال بريد التحقق إلى: ${userEmail}`);
    console.log(`معرف الرسالة: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error('خطأ في إرسال بريد التحقق:', error);
    return false;
  }
}

// إنشاء رمز تحقق (6 أرقام)
export function generateVerificationToken(): string {
  // إنشاء رمز مكون من 6 أرقام
  return Math.floor(100000 + Math.random() * 900000).toString();
}
