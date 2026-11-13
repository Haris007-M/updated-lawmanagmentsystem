// Terms of Service and Privacy Policy, written for use in Pakistan, in plain English and Urdu.
// Each section: heading, paragraphs, optional bullet list. The Urdu text follows the English.
// Have a Pakistani lawyer read them once before you take your first payment.
import type { Locale } from '@/lib/format'

export interface LegalVars { brand: string; company: string; email: string; whatsapp: string }
export interface LegalSection { id: string; h: string; p?: string[]; ul?: string[]; after?: string[] }
export interface LegalDoc { title: string; summary: string[]; intro: string[]; sections: LegalSection[]; contact: string }

type Builder = (v: LegalVars) => Omit<LegalDoc, 'contact'>

// "support@x.com or WhatsApp +92..." built only from what is actually set.
function contactLine({ email, whatsapp }: LegalVars, ur: boolean): string {
  const parts = [email, whatsapp && `${ur ? 'واٹس ایپ' : 'WhatsApp'} +${whatsapp}`].filter(Boolean)
  if (!parts.length) return ur ? 'ہمارے رابطہ صفحے پر دی گئی تفصیلات' : 'the details on our Contact page'
  return parts.join(ur ? ' یا ' : ' or ')
}

/* ------------------------------------------------------------------ Terms: English */

const termsEn: Builder = (v) => {
  const { brand, company } = v
  return {
    title: 'Terms of Service',
    summary: [
      'You keep ownership of your cases, clients and documents. We use them only to run the Service for you.',
      'We are a software company, not a law firm. We do not give legal advice.',
      'The first 14 days are free, and we enter your first 20 cases for you. After that you pay by bank transfer to continue.',
      'You stay responsible for your own hearing dates and professional duties. Our reminders are a help, not a replacement for your diary.',
      'These terms follow the laws of Pakistan.',
    ],
    intro: [
      `These terms are an agreement between you and ${company} ("we", "us") for your use of ${brand} (the "Service"). By signing in or using the Service you accept them. If you use the Service for a law firm, you confirm that you can accept these terms for that firm. Under the Electronic Transactions Ordinance, 2002, accepting these terms online is as valid as signing on paper.`,
    ],
    sections: [
      { id: 'service', h: '1. What the Service is', p: [
        `${brand} is practice-management software: case records, cause list, client portal, document storage, messages, calendar, tasks, time records and invoices. We are a software company. We are not a law firm, we do not give legal advice, and using the Service does not make us your lawyer.`] },
      { id: 'accounts', h: '2. Accounts', ul: [
        'You must be at least 18 years old.',
        'Accounts are created by invitation. Each subscribing lawyer (the "Account Owner") gets a firm workspace and can invite junior staff and clients.',
        'Keep your password and phone safe, and tell us at once if someone else may have used your account. We recommend that you switch on the extra login code (two-factor authentication).',
        'The Account Owner is responsible for the people they invite, for deciding what each person can see, and for removing access when someone leaves.',
        'You are responsible for everything done under your account.'] },
      { id: 'trial', h: '3. Free trial and setup help', ul: [
        'New firms get a free trial of 14 days with all features. No card is needed.',
        'During the trial, if you ask, we will enter your first 20 cases for you from the details you send us (by WhatsApp, email or paper copies). This help is free.',
        'We enter only what you send us. Please check the entries. You remain responsible for their accuracy.',
        'We keep everything you send us confidential and use it only for this setup.',
        'When the trial ends you need to subscribe to keep using the Service. Your data is not deleted when the trial ends (see section 8).'] },
      { id: 'content', h: '4. Your information and confidentiality', p: [
        'The firm owns the information it puts into the Service ("Your Content"). We do not claim ownership of it. We use it only to provide the Service to you, as explained in our Privacy Policy.',
        'The Service is built so that other firms cannot see your data, and platform administrators who manage accounts and subscriptions cannot read your case contents, messages or documents. We open Your Content only when strictly necessary: to give support that you ask for, to keep the Service secure, or when a lawful order requires it. If we receive a lawful order asking for your data, we will tell you first where the law allows, and we will share only what the order requires.'] },
      { id: 'duties', h: '5. Your professional duties', p: [
        'You remain fully responsible for your own professional duties as a lawyer. This includes client confidentiality and privilege (for example under the Qanun-e-Shahadat Order, 1984), keeping records, checking conflicts of interest, and following the Legal Practitioners and Bar Councils Act, 1973 and the rules of the Pakistan Bar Council and your Bar Council.',
        'If your professional rules or your agreement with a client require it, tell your clients that their records are kept in an online system. The conflict check, reminders and other tools are only an aid. They do not replace your own judgement or your own diary.'] },
      { id: 'use', h: '6. Acceptable use', p: ['You agree not to:'], ul: [
        'break the law of Pakistan, including the Prevention of Electronic Crimes Act, 2016 (for example, by getting into another person\'s account or data without permission);',
        'upload unlawful, harmful or infringing content;',
        'try to bypass security, limits or subscription controls;',
        'share your account with people outside your firm, or resell the Service;',
        'send spam or harass anyone through the Service;',
        'copy the Service or try to take it apart to learn how it works.'],
        after: ['If you break these rules we may suspend your access. We will tell you first where practical.'] },
      { id: 'payment', h: '7. Price and payment', ul: [
        'After the trial you pay monthly, or for a longer period you choose, at the price on our pricing page when you pay. Longer periods may cost less per month.',
        'Payment is by bank transfer in Pakistani rupees. You transfer the amount shown to our bank account and upload the transfer slip in the Service. We extend your period once we confirm the payment.',
        'Prices do not include taxes. If sales tax on services or any other tax applies (for example under the law of your province or of the Islamabad Capital Territory), we will show it clearly and you pay it together with the price.',
        'If the law requires you to deduct withholding tax from our payment, tell us before you pay and send us the deduction certificate. Otherwise the full amount is due.',
        'Payments are not refundable, except where the law of Pakistan requires it or we agree in writing.',
        'We may change prices for future periods after giving you reasonable notice. Each plan has limits on juniors, clients and storage. If you pass them, we may ask you to upgrade.'] },
      { id: 'suspension', h: '8. Late payment and suspension', p: [
        'If your period ends without payment, you get a short grace period, shown in the app. After that the workspace is paused. Nothing is deleted, and your juniors and clients see that the firm\'s plan is not active. Once you pay, everything comes back as you left it.',
        'If an account stays unpaid for a long time or is cancelled, we may delete it, but only after telling you and giving you the chance to download your data (see section 11).'] },
      { id: 'availability', h: '9. Availability and changes', p: [
        'We work to keep the Service running and secure, but we cannot promise that it will never be interrupted or free of errors. We may improve, change or remove features, and we will try to tell you about changes that matter to you. Please download a copy of your data from time to time using the export function.'] },
      { id: 'ip', h: '10. Our rights', p: [
        `The Service, its design, software and name belong to ${company} or its licensors. While your subscription is active you may use the Service for your firm. You may not pass this right on to anyone else.`] },
      { id: 'exit', h: '11. Your data when you leave', p: [
        'You can download your data from the Service at any time. After your account ends we will give you a full export on request for a reasonable period, and then we may delete your data. Some records, such as security logs and payment records, may be kept longer when needed for security, accounting or legal reasons.'] },
      { id: 'liability', h: '12. Our responsibility', p: [
        'The Service is provided "as is" and "as available". As far as the law of Pakistan allows, we are not responsible for indirect loss, loss of profit, loss of data, or for missed hearings, deadlines or limitation periods. Please keep your own diary and check important dates yourself.',
        'Our total responsibility for any claim about the Service is limited to the fees you paid us in the three months before the event that caused the claim. Nothing in these terms limits any responsibility that the law does not allow us to limit.'] },
      { id: 'ending', h: '13. Ending the agreement', p: [
        'You may stop using the Service at any time. We may suspend or end the Service for a firm that seriously or repeatedly breaks these terms. The parts of these terms that should continue after the agreement ends (such as ownership, our responsibility and governing law) will continue.'] },
      { id: 'law', h: '14. Law, disputes and contact', p: [
        'These terms are governed by the laws of the Islamic Republic of Pakistan, including the Contract Act, 1872. If we have a disagreement, please contact us first so that we can try to solve it in good faith. If it is not solved within 30 days, the competent courts in Pakistan will decide it.',
        `We may update these terms and will show the date of the latest update. If you keep using the Service after a change takes effect, you accept the change. Contact: ${contactLine(v, false)}.`] },
    ],
  }
}

/* ------------------------------------------------------------------ Terms: Urdu */

const termsUr: Builder = (v) => {
  const { brand, company } = v
  return {
    title: 'شرائطِ استعمال',
    summary: [
      'آپ کے کیسز، موکلوں اور دستاویزات کے مالک آپ ہی رہتے ہیں۔ ہم انہیں صرف آپ کے لیے سروس چلانے میں استعمال کرتے ہیں۔',
      'ہم سافٹ ویئر کمپنی ہیں، قانونی فرم نہیں۔ ہم قانونی مشورہ نہیں دیتے۔',
      'پہلے 14 دن مفت ہیں، اور آپ کے پہلے 20 کیسز ہم درج کر دیتے ہیں۔ اس کے بعد جاری رکھنے کے لیے بینک ٹرانسفر سے ادائیگی کریں۔',
      'پیشیوں کی تاریخوں اور پیشہ ورانہ فرائض کے ذمہ دار آپ خود رہتے ہیں۔ ہماری یاد دہانیاں مدد ہیں، آپ کی ڈائری کا متبادل نہیں۔',
      'یہ شرائط پاکستان کے قوانین کے مطابق ہیں۔',
    ],
    intro: [
      `یہ شرائط آپ اور ${company} ("ہم") کے درمیان ${brand} ("سروس") کے استعمال کا معاہدہ ہیں۔ لاگ اِن کرنے یا سروس استعمال کرنے سے آپ انہیں قبول کرتے ہیں۔ اگر آپ کسی قانونی فرم کے لیے سروس استعمال کرتے ہیں تو آپ تصدیق کرتے ہیں کہ آپ اس فرم کی جانب سے یہ شرائط قبول کر سکتے ہیں۔ الیکٹرانک ٹرانزیکشنز آرڈیننس، 2002 کے تحت ان شرائط کو آن لائن قبول کرنا کاغذ پر دستخط کرنے جتنا ہی معتبر ہے۔`,
    ],
    sections: [
      { id: 'service', h: '1۔ سروس کیا ہے', p: [
        `${brand} پریکٹس مینجمنٹ سافٹ ویئر ہے: کیس ریکارڈ، کاز لسٹ، کلائنٹ پورٹل، دستاویزات کا ذخیرہ، پیغامات، کیلنڈر، ٹاسکس، وقت کا ریکارڈ اور انوائسز۔ ہم سافٹ ویئر کمپنی ہیں۔ ہم قانونی فرم نہیں ہیں، ہم قانونی مشورہ نہیں دیتے، اور سروس استعمال کرنے سے ہم آپ کے وکیل نہیں بن جاتے۔`] },
      { id: 'accounts', h: '2۔ اکاؤنٹس', ul: [
        'آپ کی عمر کم از کم 18 سال ہونی چاہیے۔',
        'اکاؤنٹس دعوت کے ذریعے بنتے ہیں۔ ہر سبسکرائب کرنے والے وکیل ("اکاؤنٹ کے مالک") کو فرم ورک اسپیس ملتا ہے اور وہ جونیئر عملے اور موکلوں کو مدعو کر سکتا ہے۔',
        'اپنا پاس ورڈ اور فون محفوظ رکھیں، اور اگر کسی اور نے آپ کا اکاؤنٹ استعمال کیا ہو سکتا ہے تو ہمیں فوراً بتائیں۔ ہم مشورہ دیتے ہیں کہ لاگ اِن کا اضافی کوڈ (ٹو فیکٹر تصدیق) آن کر لیں۔',
        'اکاؤنٹ کا مالک اپنے مدعو کیے ہوئے لوگوں، ہر شخص کی رسائی کے فیصلے، اور کسی کے جانے پر رسائی ختم کرنے کا ذمہ دار ہے۔',
        'آپ کے اکاؤنٹ سے ہونے والی ہر کارروائی کے آپ ذمہ دار ہیں۔'] },
      { id: 'trial', h: '3۔ مفت آزمائش اور سیٹ اپ میں مدد', ul: [
        'نئی فرموں کو تمام خصوصیات کے ساتھ 14 دن کی مفت آزمائش ملتی ہے۔ کارڈ کی ضرورت نہیں۔',
        'آزمائش کے دوران، آپ کہیں تو ہم آپ کی بھیجی ہوئی تفصیلات (واٹس ایپ، ای میل یا کاغذی نقول) سے آپ کے پہلے 20 کیسز درج کر دیں گے۔ یہ مدد مفت ہے۔',
        'ہم صرف وہی درج کرتے ہیں جو آپ ہمیں بھیجیں۔ براہِ کرم اندراجات جانچ لیں۔ ان کی درستی کے ذمہ دار آپ ہی رہتے ہیں۔',
        'آپ جو کچھ ہمیں بھیجتے ہیں ہم اسے رازدارانہ رکھتے ہیں اور صرف اسی سیٹ اپ کے لیے استعمال کرتے ہیں۔',
        'آزمائش ختم ہونے پر سروس جاری رکھنے کے لیے سبسکرائب کرنا ہوگا۔ آزمائش ختم ہونے پر آپ کا ڈیٹا حذف نہیں ہوتا (دفعہ 8 دیکھیں)۔'] },
      { id: 'content', h: '4۔ آپ کی معلومات اور رازداری', p: [
        'فرم جو معلومات سروس میں ڈالتی ہے ("آپ کا مواد") اس کی مالک ہے۔ ہم اس کی ملکیت کا دعویٰ نہیں کرتے۔ ہم اسے صرف آپ کو سروس دینے کے لیے استعمال کرتے ہیں، جیسا کہ ہماری پرائیویسی پالیسی میں بیان ہے۔',
        'سروس اس طرح بنائی گئی ہے کہ دوسری فرمیں آپ کا ڈیٹا نہیں دیکھ سکتیں، اور اکاؤنٹس اور سبسکرپشنز سنبھالنے والے پلیٹ فارم ایڈمنسٹریٹرز آپ کے کیس کا مواد، پیغامات یا دستاویزات نہیں پڑھ سکتے۔ ہم آپ کے مواد تک صرف سخت ضرورت پر رسائی لیتے ہیں: آپ کی مانگی ہوئی معاونت دینے کے لیے، سروس کو محفوظ رکھنے کے لیے، یا جب کوئی قانونی حکم تقاضا کرے۔ اگر ہمیں آپ کا ڈیٹا مانگنے والا کوئی قانونی حکم ملے تو جہاں قانون اجازت دے ہم پہلے آپ کو بتائیں گے، اور صرف وہی دیں گے جو حکم میں مطلوب ہو۔'] },
      { id: 'duties', h: '5۔ آپ کے پیشہ ورانہ فرائض', p: [
        'ایک وکیل کے طور پر اپنے پیشہ ورانہ فرائض کے مکمل ذمہ دار آپ ہی رہتے ہیں۔ اس میں موکل کی رازداری اور استحقاق (مثلاً قانونِ شہادت آرڈر، 1984 کے تحت)، ریکارڈ رکھنا، مفادات کے ٹکراؤ کی جانچ، اور لیگل پریکٹیشنرز اینڈ بار کونسلز ایکٹ، 1973 اور پاکستان بار کونسل اور آپ کی بار کونسل کے قواعد کی پابندی شامل ہے۔',
        'اگر آپ کے پیشہ ورانہ قواعد یا موکل کے ساتھ آپ کے معاہدے کا تقاضا ہو تو اپنے موکلوں کو بتائیں کہ ان کا ریکارڈ آن لائن نظام میں رکھا جاتا ہے۔ مفادات کے ٹکراؤ کی جانچ، یاد دہانیاں اور دیگر ٹولز صرف مددگار ہیں۔ یہ آپ کے اپنے فیصلے یا اپنی ڈائری کا متبادل نہیں۔'] },
      { id: 'use', h: '6۔ قابلِ قبول استعمال', p: ['آپ اتفاق کرتے ہیں کہ آپ:'], ul: [
        'پاکستان کا قانون نہیں توڑیں گے، بشمول پریوینشن آف الیکٹرانک کرائمز ایکٹ، 2016 (مثلاً کسی دوسرے کے اکاؤنٹ یا ڈیٹا میں اجازت کے بغیر داخل ہونا)؛',
        'غیر قانونی، نقصان دہ یا حقوق کی خلاف ورزی کرنے والا مواد اپ لوڈ نہیں کریں گے؛',
        'سکیورٹی، حدود یا سبسکرپشن کے کنٹرولز کو توڑنے کی کوشش نہیں کریں گے؛',
        'اپنا اکاؤنٹ اپنی فرم سے باہر کے لوگوں سے شیئر نہیں کریں گے اور سروس آگے فروخت نہیں کریں گے؛',
        'سروس کے ذریعے اسپیم نہیں بھیجیں گے اور کسی کو ہراساں نہیں کریں گے؛',
        'سروس کی نقل نہیں کریں گے اور اسے کھول کر اس کا طریقہ سمجھنے کی کوشش نہیں کریں گے۔'],
        after: ['اگر آپ ان اصولوں کی خلاف ورزی کریں تو ہم آپ کی رسائی معطل کر سکتے ہیں۔ جہاں عملی ہو ہم پہلے آپ کو بتائیں گے۔'] },
      { id: 'payment', h: '7۔ قیمت اور ادائیگی', ul: [
        'آزمائش کے بعد آپ ماہانہ، یا اپنی منتخب طویل مدت کے لیے، ادائیگی کے وقت ہمارے قیمتوں کے صفحے پر درج قیمت کے مطابق ادا کرتے ہیں۔ طویل مدت پر ماہانہ قیمت کم ہو سکتی ہے۔',
        'ادائیگی پاکستانی روپوں میں بینک ٹرانسفر سے ہوتی ہے۔ آپ درج شدہ رقم ہمارے بینک اکاؤنٹ میں منتقل کرتے ہیں اور سروس میں ٹرانسفر کی رسید اپ لوڈ کرتے ہیں۔ ادائیگی کی تصدیق کے بعد ہم آپ کی مدت بڑھا دیتے ہیں۔',
        'قیمتوں میں ٹیکس شامل نہیں۔ اگر خدمات پر سیلز ٹیکس یا کوئی اور ٹیکس لاگو ہو (مثلاً آپ کے صوبے یا وفاقی دارالحکومت اسلام آباد کے قانون کے تحت) تو ہم اسے واضح دکھائیں گے اور آپ قیمت کے ساتھ ادا کریں گے۔',
        'اگر قانون آپ پر ہماری ادائیگی سے ود ہولڈنگ ٹیکس کاٹنا لازم کرے تو ادائیگی سے پہلے ہمیں بتائیں اور کٹوتی کا سرٹیفکیٹ بھیجیں۔ ورنہ پوری رقم واجب ہے۔',
        'ادائیگیاں واپس نہیں ہوتیں، سوائے اس کے کہ پاکستان کا قانون تقاضا کرے یا ہم تحریری طور پر اتفاق کریں۔',
        'ہم مناسب نوٹس دے کر آئندہ مدتوں کی قیمتیں بدل سکتے ہیں۔ ہر پلان میں جونیئرز، موکلوں اور اسٹوریج کی حد ہے۔ حد سے بڑھنے پر ہم اپ گریڈ کا کہہ سکتے ہیں۔'] },
      { id: 'suspension', h: '8۔ تاخیر سے ادائیگی اور معطلی', p: [
        'اگر آپ کی مدت بغیر ادائیگی ختم ہو جائے تو آپ کو ایک مختصر رعایتی مدت ملتی ہے جو ایپ میں نظر آتی ہے۔ اس کے بعد ورک اسپیس روک دیا جاتا ہے۔ کچھ حذف نہیں ہوتا، اور آپ کے جونیئرز اور موکلوں کو نظر آتا ہے کہ فرم کا پلان فعال نہیں۔ ادائیگی کرتے ہی سب کچھ ویسا ہی بحال ہو جاتا ہے جیسا آپ نے چھوڑا تھا۔',
        'اگر اکاؤنٹ طویل عرصے تک غیر ادا شدہ رہے یا منسوخ ہو جائے تو ہم اسے حذف کر سکتے ہیں، مگر صرف آپ کو بتانے اور ڈیٹا ڈاؤن لوڈ کرنے کا موقع دینے کے بعد (دفعہ 11 دیکھیں)۔'] },
      { id: 'availability', h: '9۔ دستیابی اور تبدیلیاں', p: [
        'ہم سروس کو چالو اور محفوظ رکھنے کی کوشش کرتے ہیں، لیکن یہ وعدہ نہیں کر سکتے کہ یہ کبھی رکے گی نہیں یا اس میں غلطی نہیں ہوگی۔ ہم خصوصیات کو بہتر، تبدیل یا ختم کر سکتے ہیں، اور آپ کے لیے اہم تبدیلیوں کی اطلاع دینے کی کوشش کریں گے۔ براہِ کرم ایکسپورٹ کی سہولت سے وقتاً فوقتاً اپنے ڈیٹا کی کاپی ڈاؤن لوڈ کرتے رہیں۔'] },
      { id: 'ip', h: '10۔ ہمارے حقوق', p: [
        `سروس، اس کا ڈیزائن، سافٹ ویئر اور نام ${company} یا اس کے لائسنس دہندگان کی ملکیت ہیں۔ آپ کی سبسکرپشن فعال رہنے تک آپ سروس کو اپنی فرم کے لیے استعمال کر سکتے ہیں۔ یہ حق آپ کسی اور کو منتقل نہیں کر سکتے۔`] },
      { id: 'exit', h: '11۔ جانے کے بعد آپ کا ڈیٹا', p: [
        'آپ کسی بھی وقت سروس سے اپنا ڈیٹا ڈاؤن لوڈ کر سکتے ہیں۔ آپ کا اکاؤنٹ ختم ہونے کے بعد ہم ایک مناسب مدت تک درخواست پر مکمل ایکسپورٹ دیں گے، اور پھر آپ کا ڈیٹا حذف کر سکتے ہیں۔ کچھ ریکارڈ، جیسے سکیورٹی لاگ اور ادائیگی کے ریکارڈ، سکیورٹی، اکاؤنٹنگ یا قانونی وجوہات کی بنا پر زیادہ دیر رکھے جا سکتے ہیں۔'] },
      { id: 'liability', h: '12۔ ہماری ذمہ داری', p: [
        'سروس "جیسی ہے" اور "جیسی دستیاب ہے" کی بنیاد پر فراہم کی جاتی ہے۔ پاکستان کا قانون جس حد تک اجازت دے، ہم بالواسطہ نقصان، منافع کے نقصان، ڈیٹا کے نقصان، یا چھوٹی ہوئی پیشیوں، آخری تاریخوں یا میعادِ حد بندی کے ذمہ دار نہیں۔ براہِ کرم اپنی ڈائری خود رکھیں اور اہم تاریخیں خود جانچیں۔',
        'سروس سے متعلق کسی بھی دعوے پر ہماری کل ذمہ داری اس واقعے سے پہلے تین ماہ میں آپ کی ادا کردہ فیس تک محدود ہے جس سے دعویٰ پیدا ہوا۔ جس ذمہ داری کو قانون محدود کرنے کی اجازت نہیں دیتا، اسے ان شرائط کی کوئی بات محدود نہیں کرتی۔'] },
      { id: 'ending', h: '13۔ معاہدے کا اختتام', p: [
        'آپ کسی بھی وقت سروس کا استعمال بند کر سکتے ہیں۔ جو فرم ان شرائط کی سنگین یا بار بار خلاف ورزی کرے، اس کے لیے ہم سروس معطل یا ختم کر سکتے ہیں۔ ان شرائط کے وہ حصے جنہیں معاہدہ ختم ہونے کے بعد بھی جاری رہنا چاہیے (جیسے ملکیت، ہماری ذمہ داری اور قابلِ اطلاق قانون) جاری رہیں گے۔'] },
      { id: 'law', h: '14۔ قانون، تنازعات اور رابطہ', p: [
        'یہ شرائط اسلامی جمہوریہ پاکستان کے قوانین، بشمول کنٹریکٹ ایکٹ، 1872، کے تابع ہیں۔ اگر ہمارے درمیان اختلاف ہو تو پہلے ہم سے رابطہ کریں تاکہ ہم نیک نیتی سے اسے حل کرنے کی کوشش کریں۔ اگر 30 دن میں حل نہ ہو تو پاکستان کی مجاز عدالتیں اس کا فیصلہ کریں گی۔',
        `ہم ان شرائط کو اپ ڈیٹ کر سکتے ہیں اور تازہ ترین اپ ڈیٹ کی تاریخ دکھائیں گے۔ تبدیلی نافذ ہونے کے بعد سروس کا استعمال جاری رکھنے کا مطلب اسے قبول کرنا ہے۔ رابطہ: ${contactLine(v, true)}۔`] },
    ],
  }
}

/* ------------------------------------------------------------------ Privacy: English */

const privacyEn: Builder = (v) => {
  const { brand, company } = v
  return {
    title: 'Privacy Policy',
    summary: [
      'We collect only what we need to run your account and the Service.',
      'We never sell your data, and we never use client information for advertising.',
      'Each firm\'s data is kept separate. A client sees only what their lawyer shares.',
      'You can download your data and ask us to correct or delete it.',
      'Our servers may be outside Pakistan.',
    ],
    intro: [
      `This policy explains what personal information ${company} ("we", "us") handles through ${brand} (the "Service"), why we handle it, and what choices you have. We respect the right to dignity and privacy protected by Article 14 of the Constitution of Pakistan, and we follow the principles found in Pakistan's data-protection proposals: collect only what is needed, use it only for the stated purpose, and keep it secure. We will follow any data-protection law that applies to us once it is in force.`,
    ],
    sections: [
      { id: 'roles', h: '1. Who decides what', p: [
        'For the client, case and document information that a law firm puts into the Service, the firm decides why and how it is used. We only handle it on the firm\'s behalf and on its instructions. For account, billing and website information, we decide how it is used.'] },
      { id: 'collect', h: '2. Information we handle', ul: [
        'Account details: name, email address, phone number, role, firm name, and sign-in and two-factor information.',
        'Firm content: clients, cases, hearing dates, notes, messages, documents, tasks, time entries and invoices that firms and their clients add.',
        'Setup help: the case details you send us (by WhatsApp, email or paper) when you ask us to enter your first cases.',
        'Billing details: subscription plan, payment amounts and the transfer slip you upload as proof of payment.',
        'Website requests: what you tell us when you ask for a trial or demo, and your number and messages if you contact us on WhatsApp.',
        'Technical data: IP address, device and browser type, and security records of who did what and when.'] },
      { id: 'use', h: '3. Why we use it', ul: [
        'To provide and protect the Service, including sign-in, access control, backups and support.',
        'To enter your first cases when you ask us to.',
        'To manage subscriptions and confirm payments.',
        'To send service emails: invitations, password resets, hearing reminders and subscription notices. These are not advertisements.',
        'To answer your trial or demo request.',
        'To prevent abuse and to meet our legal duties.'],
        after: ['We do not sell personal information, and we do not use client content for advertising.'] },
      { id: 'confidentiality', h: '4. Confidential legal information', p: [
        'Firms are kept separate from each other. A client can see only what their lawyer chooses to share. Platform administrators manage accounts and subscriptions, but the Service does not give them access to case contents, messages or documents. Documents are kept in private storage and opened with short-lived links.'] },
      { id: 'sharing', h: '5. Who we share it with', p: [
        'We use trusted companies to run the Service, such as cloud hosting, database storage and email delivery. They may use the data only to provide their service to us. We do not share personal information with anyone else.',
        'If a Pakistani court or authority lawfully orders us to give information (for example under the Prevention of Electronic Crimes Act, 2016), we will share only what the order requires. Because lawyer-client information is confidential and may be privileged, we will tell the firm first where the law allows, and we will object where there are proper grounds.'] },
      { id: 'transfers', h: '6. Where the data is kept', p: [
        'Our providers may keep data on servers outside Pakistan. By using the Service you understand and accept this. We choose providers with proper security practices.'] },
      { id: 'security', h: '7. Security', ul: [
        'Rules in the database make sure each firm sees only its own data.',
        'Files are kept in private storage and opened with short-lived links.',
        'Limits on sign-in attempts, an optional extra login code on your phone, and a record of who did what.',
        'Encrypted connections.'],
        after: ['No system is perfectly secure. Please use a strong password that you use nowhere else, and switch on the extra login code.'] },
      { id: 'breach', h: '8. If something goes wrong', p: [
        'If we learn that confidential information has been accessed without permission, we will tell the affected firm without unnecessary delay, explain what happened and help to limit the harm.'] },
      { id: 'retention', h: '9. How long we keep it', p: [
        'We keep firm content while the account is active. When an account ends we keep the data for a reasonable period so that you can download it, and then delete it. The exceptions are records we must keep for security, accounting or legal reasons, such as security and payment records. Website requests are kept only as long as needed to follow up.'] },
      { id: 'rights', h: '10. Your choices and rights', ul: [
        'See and correct your profile in Settings.',
        'Turn email notifications on or off in Settings.',
        'Download your firm\'s data, or ask us for a full export.',
        'Ask us to delete your account or data, or to answer questions about how it is handled. Where we hold client data for a firm, we may pass your request to that firm.'],
        after: [`Contact us at ${contactLine(v, false)}.`] },
      { id: 'cookies', h: '11. WhatsApp, email and cookies', p: [
        'The WhatsApp and SMS buttons in the Service only open your own WhatsApp or SMS app with a message already written. You press send. We do not read your WhatsApp chats.',
        'We use only the cookies needed to keep you signed in and to remember your language. We do not use advertising cookies.'] },
      { id: 'children', h: '12. Children', p: ['The Service is for professionals and their clients. It is not meant for children.'] },
      { id: 'changes', h: '13. Changes and complaints', p: [
        `We may update this policy and will show the date of the latest update. Questions or complaints: ${contactLine(v, false)}. This policy is governed by the laws of Pakistan.`] },
    ],
  }
}

/* ------------------------------------------------------------------ Privacy: Urdu */

const privacyUr: Builder = (v) => {
  const { brand, company } = v
  return {
    title: 'پرائیویسی پالیسی',
    summary: [
      'ہم صرف وہی معلومات لیتے ہیں جو آپ کا اکاؤنٹ اور سروس چلانے کے لیے ضروری ہوں۔',
      'ہم آپ کا ڈیٹا کبھی فروخت نہیں کرتے، اور موکلوں کی معلومات اشتہارات کے لیے کبھی استعمال نہیں کرتے۔',
      'ہر فرم کا ڈیٹا الگ رکھا جاتا ہے۔ موکل صرف وہی دیکھتا ہے جو اس کا وکیل شیئر کرے۔',
      'آپ اپنا ڈیٹا ڈاؤن لوڈ کر سکتے ہیں اور ہم سے اسے درست یا حذف کروا سکتے ہیں۔',
      'ہمارے سرور پاکستان سے باہر بھی ہو سکتے ہیں۔',
    ],
    intro: [
      `یہ پالیسی بتاتی ہے کہ ${company} ("ہم") ${brand} ("سروس") کے ذریعے کون سی ذاتی معلومات سنبھالتی ہے، کیوں سنبھالتی ہے، اور آپ کے پاس کیا اختیارات ہیں۔ ہم آئینِ پاکستان کے آرٹیکل 14 میں محفوظ وقار اور پرائیویسی کے حق کا احترام کرتے ہیں، اور ان اصولوں پر چلتے ہیں جو پاکستان کی ڈیٹا پروٹیکشن تجاویز میں ملتے ہیں: صرف ضروری معلومات لینا، انہیں صرف بتائے گئے مقصد کے لیے استعمال کرنا، اور محفوظ رکھنا۔ جب کوئی ڈیٹا پروٹیکشن قانون نافذ ہوگا جو ہم پر لاگو ہو، ہم اس کی پابندی کریں گے۔`,
    ],
    sections: [
      { id: 'roles', h: '1۔ کون کیا طے کرتا ہے', p: [
        'جو موکل، کیس اور دستاویزی معلومات کوئی قانونی فرم سروس میں ڈالتی ہے، اس کے استعمال کا مقصد اور طریقہ فرم طے کرتی ہے۔ ہم اسے صرف فرم کی طرف سے اور اس کی ہدایت پر سنبھالتے ہیں۔ اکاؤنٹ، بلنگ اور ویب سائٹ کی معلومات کے استعمال کا فیصلہ ہم کرتے ہیں۔'] },
      { id: 'collect', h: '2۔ ہم کون سی معلومات سنبھالتے ہیں', ul: [
        'اکاؤنٹ کی تفصیلات: نام، ای میل، فون نمبر، کردار، فرم کا نام، اور لاگ اِن اور ٹو فیکٹر کی معلومات۔',
        'فرم کا مواد: موکل، کیسز، پیشیوں کی تاریخیں، نوٹس، پیغامات، دستاویزات، ٹاسکس، وقت کے اندراجات اور انوائسز جو فرمیں اور ان کے موکل شامل کرتے ہیں۔',
        'سیٹ اپ میں مدد: جب آپ ہم سے پہلے کیسز درج کرواتے ہیں تو آپ کی بھیجی ہوئی کیس کی تفصیلات (واٹس ایپ، ای میل یا کاغذ پر)۔',
        'بلنگ کی تفصیلات: سبسکرپشن پلان، ادائیگی کی رقم اور ادائیگی کے ثبوت کے طور پر آپ کی اپ لوڈ کردہ ٹرانسفر رسید۔',
        'ویب سائٹ کی درخواستیں: ٹرائل یا ڈیمو مانگتے وقت آپ کی بتائی ہوئی باتیں، اور واٹس ایپ پر رابطہ کرنے کی صورت میں آپ کا نمبر اور پیغامات۔',
        'تکنیکی ڈیٹا: آئی پی ایڈریس، ڈیوائس اور براؤزر کی قسم، اور سکیورٹی ریکارڈ کہ کس نے کب کیا کیا۔'] },
      { id: 'use', h: '3۔ ہم اسے کیوں استعمال کرتے ہیں', ul: [
        'سروس فراہم کرنے اور محفوظ رکھنے کے لیے، بشمول لاگ اِن، رسائی کا کنٹرول، بیک اپ اور معاونت۔',
        'جب آپ کہیں تو آپ کے پہلے کیسز درج کرنے کے لیے۔',
        'سبسکرپشنز کے انتظام اور ادائیگیوں کی تصدیق کے لیے۔',
        'سروس کی ای میلز بھیجنے کے لیے: دعوت نامے، پاس ورڈ ری سیٹ، پیشی کی یاد دہانیاں اور سبسکرپشن کے نوٹس۔ یہ اشتہارات نہیں ہیں۔',
        'آپ کی ٹرائل یا ڈیمو کی درخواست کا جواب دینے کے لیے۔',
        'غلط استعمال روکنے اور اپنی قانونی ذمہ داریاں پوری کرنے کے لیے۔'],
        after: ['ہم ذاتی معلومات فروخت نہیں کرتے، اور موکلوں کا مواد اشتہارات کے لیے استعمال نہیں کرتے۔'] },
      { id: 'confidentiality', h: '4۔ رازدارانہ قانونی معلومات', p: [
        'فرمیں ایک دوسرے سے الگ رکھی جاتی ہیں۔ موکل صرف وہی دیکھ سکتا ہے جو اس کا وکیل شیئر کرنا چاہے۔ پلیٹ فارم ایڈمنسٹریٹرز اکاؤنٹس اور سبسکرپشنز سنبھالتے ہیں، لیکن سروس انہیں کیس کے مواد، پیغامات یا دستاویزات تک رسائی نہیں دیتی۔ دستاویزات نجی اسٹوریج میں رکھی جاتی ہیں اور مختصر مدت کے لنکس سے کھلتی ہیں۔'] },
      { id: 'sharing', h: '5۔ ہم کس کے ساتھ شیئر کرتے ہیں', p: [
        'سروس چلانے کے لیے ہم قابلِ اعتماد کمپنیاں استعمال کرتے ہیں، جیسے کلاؤڈ ہوسٹنگ، ڈیٹا بیس اسٹوریج اور ای میل ڈیلیوری۔ وہ ڈیٹا صرف ہمیں اپنی سروس دینے کے لیے استعمال کر سکتی ہیں۔ ہم ذاتی معلومات کسی اور کے ساتھ شیئر نہیں کرتے۔',
        'اگر پاکستان کی کوئی عدالت یا اتھارٹی قانونی طور پر ہمیں معلومات دینے کا حکم دے (مثلاً پریوینشن آف الیکٹرانک کرائمز ایکٹ، 2016 کے تحت) تو ہم صرف وہی دیں گے جو حکم میں مطلوب ہو۔ چونکہ وکیل اور موکل کی معلومات رازدارانہ ہیں اور استحقاق کے تحت آ سکتی ہیں، جہاں قانون اجازت دے ہم پہلے فرم کو بتائیں گے، اور جہاں مناسب بنیاد ہو وہاں اعتراض اٹھائیں گے۔'] },
      { id: 'transfers', h: '6۔ ڈیٹا کہاں رکھا جاتا ہے', p: [
        'ہمارے فراہم کنندگان ڈیٹا کو پاکستان سے باہر سرورز پر رکھ سکتے ہیں۔ سروس استعمال کر کے آپ اسے سمجھتے اور قبول کرتے ہیں۔ ہم مناسب سکیورٹی طریقوں والے فراہم کنندگان منتخب کرتے ہیں۔'] },
      { id: 'security', h: '7۔ سکیورٹی', ul: [
        'ڈیٹا بیس کے اصول یقینی بناتے ہیں کہ ہر فرم صرف اپنا ڈیٹا دیکھے۔',
        'فائلیں نجی اسٹوریج میں رکھی جاتی ہیں اور مختصر مدت کے لنکس سے کھلتی ہیں۔',
        'لاگ اِن کی کوششوں پر حد، فون پر اختیاری اضافی کوڈ، اور ریکارڈ کہ کس نے کیا کیا۔',
        'خفیہ کردہ کنکشنز۔'],
        after: ['کوئی نظام مکمل طور پر محفوظ نہیں ہوتا۔ براہِ کرم مضبوط پاس ورڈ رکھیں جو کہیں اور استعمال نہ ہو، اور لاگ اِن کا اضافی کوڈ آن کریں۔'] },
      { id: 'breach', h: '8۔ اگر کچھ غلط ہو جائے', p: [
        'اگر ہمیں معلوم ہو کہ رازدارانہ معلومات تک اجازت کے بغیر رسائی ہوئی ہے تو ہم متاثرہ فرم کو بلا غیر ضروری تاخیر بتائیں گے، بتائیں گے کہ کیا ہوا، اور نقصان کم کرنے میں مدد کریں گے۔'] },
      { id: 'retention', h: '9۔ ہم اسے کتنی دیر رکھتے ہیں', p: [
        'اکاؤنٹ فعال رہنے تک ہم فرم کا مواد رکھتے ہیں۔ اکاؤنٹ ختم ہونے پر ہم ڈیٹا ایک مناسب مدت رکھتے ہیں تاکہ آپ اسے ڈاؤن لوڈ کر لیں، پھر حذف کر دیتے ہیں۔ استثنا وہ ریکارڈ ہیں جو سکیورٹی، اکاؤنٹنگ یا قانونی وجوہات سے رکھنے لازمی ہوں، جیسے سکیورٹی اور ادائیگی کے ریکارڈ۔ ویب سائٹ کی درخواستیں صرف اتنی دیر رکھی جاتی ہیں جتنی رابطے کے لیے ضروری ہو۔'] },
      { id: 'rights', h: '10۔ آپ کے اختیارات اور حقوق', ul: [
        'سیٹنگز میں اپنی پروفائل دیکھیں اور درست کریں۔',
        'سیٹنگز میں ای میل نوٹیفکیشنز آن یا آف کریں۔',
        'اپنی فرم کا ڈیٹا ڈاؤن لوڈ کریں، یا ہم سے مکمل ایکسپورٹ مانگیں۔',
        'ہم سے اپنا اکاؤنٹ یا ڈیٹا حذف کرنے، یا اس کے سنبھالے جانے کے بارے میں سوالات کے جواب دینے کا کہیں۔ جہاں ہم کسی فرم کے لیے موکلوں کا ڈیٹا رکھتے ہیں، ہم آپ کی درخواست اسی فرم کو بھیج سکتے ہیں۔'],
        after: [`ہم سے رابطہ کریں: ${contactLine(v, true)}۔`] },
      { id: 'cookies', h: '11۔ واٹس ایپ، ای میل اور کوکیز', p: [
        'سروس میں واٹس ایپ اور ایس ایم ایس کے بٹن صرف آپ کی اپنی واٹس ایپ یا ایس ایم ایس ایپ کھولتے ہیں جس میں پیغام پہلے سے لکھا ہوتا ہے۔ بھیجنے کا بٹن آپ دباتے ہیں۔ ہم آپ کی واٹس ایپ چیٹس نہیں پڑھتے۔',
        'ہم صرف وہ کوکیز استعمال کرتے ہیں جو آپ کو لاگ اِن رکھنے اور آپ کی زبان یاد رکھنے کے لیے ضروری ہیں۔ ہم اشتہاری کوکیز استعمال نہیں کرتے۔'] },
      { id: 'children', h: '12۔ بچے', p: ['سروس پیشہ ور افراد اور ان کے موکلوں کے لیے ہے۔ یہ بچوں کے لیے نہیں ہے۔'] },
      { id: 'changes', h: '13۔ تبدیلیاں اور شکایات', p: [
        `ہم اس پالیسی کو اپ ڈیٹ کر سکتے ہیں اور تازہ ترین اپ ڈیٹ کی تاریخ دکھائیں گے۔ سوالات یا شکایات: ${contactLine(v, true)}۔ یہ پالیسی پاکستان کے قوانین کے تابع ہے۔`] },
    ],
  }
}

const DOCS: Record<'terms' | 'privacy', Record<Locale, Builder>> = {
  terms: { en: termsEn, ur: termsUr },
  privacy: { en: privacyEn, ur: privacyUr },
}

export function getLegalDoc(kind: 'terms' | 'privacy', locale: Locale, vars: LegalVars): LegalDoc {
  return { ...DOCS[kind][locale](vars), contact: contactLine(vars, locale === 'ur') }
}
