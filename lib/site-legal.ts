// Template legal text. NOT legal advice: a qualified lawyer must review and adapt it before launch.
// Each section: heading, paragraphs, optional bullet list. Urdu is a faithful translation of the English.
import type { Locale } from '@/lib/format'

export interface LegalVars { brand: string; company: string; email: string; jurisdiction: string }
export interface LegalSection { id: string; h: string; p?: string[]; ul?: string[]; after?: string[] }
export interface LegalDoc { title: string; intro: string[]; sections: LegalSection[] }

type Builder = (v: LegalVars) => LegalDoc

const termsEn: Builder = ({ brand, company, email, jurisdiction }) => ({
  title: 'Terms of Service',
  intro: [
    `These terms govern your use of ${brand} (the "Service"), provided by ${company} ("we", "us"). By signing in or using the Service you agree to them. If you use the Service for a law firm, you confirm you are authorised to accept these terms for that firm.`,
  ],
  sections: [
    { id: 'service', h: '1. The Service', p: [
      `${brand} is practice-management software: case records, a cause list, a client portal, document storage, messaging, a calendar, tasks, time tracking and invoicing. We are a software provider. We are not a law firm, we do not give legal advice, and nothing in the Service creates a lawyer-client relationship with us.`] },
    { id: 'accounts', h: '2. Accounts and roles', ul: [
      'Accounts are by invitation. We create a firm workspace for each subscribing lawyer (the "Firm Owner"). The Firm Owner may invite junior staff and clients.',
      'You must keep your sign-in details and authenticator device secure and tell us promptly about any unauthorised use. We recommend switching on two-factor authentication.',
      'The Firm Owner is responsible for the accounts they create, for what each person may see, and for removing access when someone leaves.',
      'You are responsible for everything done under your account.'] },
    { id: 'content', h: '3. Your content and confidentiality', p: [
      `The firm owns the information it puts into the Service ("Your Content"). We process it only to provide the Service, as described in our Privacy Policy. We claim no ownership of it.`,
      'Lawyers remain solely responsible for their own professional duties, including confidentiality, privilege, record-keeping, conflict-of-interest checks and compliance with the rules of their bar council or regulator, and for deciding what to share with each client. The conflict check and other tools are aids, not a substitute for professional judgement.',
      'Platform administrators can manage firm accounts and subscriptions but the application is designed so that they cannot read case contents, messages or documents. We may access Your Content only where strictly necessary to provide support you request, to keep the Service secure, or where the law requires.'] },
    { id: 'use', h: '4. Acceptable use', p: ['You agree not to:'], ul: [
      'break the law, or upload unlawful, infringing or malicious content;',
      'try to access data or accounts that are not yours, or bypass security, rate limits or subscription controls;',
      'resell or share your account with people outside your firm, or exceed the limits of your plan by other means;',
      'use the Service to send spam or harass anyone;',
      'reverse engineer, copy or interfere with the Service.'],
      after: ['We may suspend access that breaks these rules, with notice where practical.'] },
    { id: 'plans', h: '5. Plans, trial and payment', ul: [
      'New firms receive a free trial. At its end you must subscribe to keep using the Service.',
      'Subscriptions are monthly or for a longer period you choose, at the price shown on our pricing page when you pay. Longer periods may carry a discount.',
      'We accept payment by local bank transfer. You transfer the amount shown to our bank account and upload proof of transfer in the Service. Your period is extended once we confirm the payment. Payments are non-refundable except where the law requires or we agree otherwise in writing.',
      'Prices are stated before any applicable taxes. We may change prices for future periods with reasonable notice.',
      'Each plan limits the number of junior accounts, clients and storage. We may ask you to upgrade if you exceed them.'] },
    { id: 'suspension', h: '6. Late payment and suspension', p: [
      'If a subscription period ends without payment, we allow a short grace period, shown in the app. After it, access to the firm workspace is suspended: nothing is deleted, and the firm\'s juniors and clients will see that the firm\'s plan is inactive. Payment restores access.',
      'If an account stays unpaid for an extended period, or is cancelled, we may delete it after giving you notice and a chance to export your data (see section 9).'] },
    { id: 'availability', h: '7. Availability and changes', p: [
      'We work to keep the Service available and secure, but we do not guarantee uninterrupted or error-free operation. We may update, improve or remove features, and will try to give notice of changes that significantly affect you. Back up anything you cannot afford to lose by using the export function.'] },
    { id: 'ip', h: '8. Our rights', p: [
      `The Service, its design, software and brand belong to ${company} or its licensors. We grant you a limited, non-exclusive, non-transferable right to use it for your firm while your subscription is active.`] },
    { id: 'export', h: '9. Data export and deletion', p: [
      'You may export your data from the Service at any time, and we will provide a full export on request while your account is active and for a reasonable period after it ends. After that we may delete the data. Some records (such as audit logs and payment records) may be kept longer where needed for security, accounting or legal reasons.'] },
    { id: 'liability', h: '10. Disclaimers and limitation of liability', p: [
      'The Service is provided "as is" and "as available". To the fullest extent the law allows, we exclude implied warranties, and we are not liable for indirect or consequential loss, loss of profit, loss of data, or missed hearings, deadlines or limitation periods. You must keep your own reminders and check important dates independently.',
      'Our total liability for any claim relating to the Service is limited to the fees you paid us in the three months before the event giving rise to the claim. Nothing limits liability that cannot be limited by law.'] },
    { id: 'term', h: '11. Ending the agreement', p: [
      'You may stop using the Service at any time. We may suspend or end the Service for a firm that seriously or repeatedly breaches these terms. Sections that by nature should survive (including ownership, liability and governing law) will continue after the agreement ends.'] },
    { id: 'law', h: '12. Governing law and contact', p: [
      `These terms are governed by the laws of ${jurisdiction}, and the courts of ${jurisdiction} have jurisdiction, subject to any mandatory rules. We may update these terms; continuing to use the Service after a change takes effect means you accept it. Contact: ${email}.`] },
  ],
})

const termsUr: Builder = ({ brand, company, email, jurisdiction }) => ({
  title: 'شرائطِ استعمال',
  intro: [
    `یہ شرائط ${brand} ("سروس") کے آپ کے استعمال پر لاگو ہوتی ہیں، جو ${company} ("ہم") فراہم کرتی ہے۔ لاگ اِن کرنے یا سروس استعمال کرنے سے آپ ان سے اتفاق کرتے ہیں۔ اگر آپ کسی قانونی فرم کے لیے سروس استعمال کرتے ہیں تو آپ تصدیق کرتے ہیں کہ آپ اس فرم کی جانب سے یہ شرائط قبول کرنے کے مجاز ہیں۔`,
  ],
  sections: [
    { id: 'service', h: '1۔ سروس', p: [
      `${brand} پریکٹس مینجمنٹ سافٹ ویئر ہے: کیس ریکارڈ، کاز لسٹ، کلائنٹ پورٹل، دستاویزات کا ذخیرہ، پیغام رسانی، کیلنڈر، ٹاسکس، وقت کا ریکارڈ اور انوائسنگ۔ ہم سافٹ ویئر فراہم کنندہ ہیں۔ ہم قانونی فرم نہیں، ہم قانونی مشورہ نہیں دیتے، اور سروس میں کوئی بات ہمارے ساتھ وکیل اور موکل کا تعلق قائم نہیں کرتی۔`] },
    { id: 'accounts', h: '2۔ اکاؤنٹس اور کردار', ul: [
      'اکاؤنٹس دعوت کے ذریعے بنتے ہیں۔ ہم ہر سبسکرائب کرنے والے وکیل ("فرم کا مالک") کے لیے فرم ورک اسپیس بناتے ہیں۔ فرم کا مالک جونیئر عملے اور موکلوں کو مدعو کر سکتا ہے۔',
      'آپ کو اپنے لاگ اِن کی تفصیلات اور آتھنٹیکیٹر ڈیوائس محفوظ رکھنی ہے اور کسی غیر مجاز استعمال کی ہمیں فوراً اطلاع دینی ہے۔ ہم ٹو فیکٹر تصدیق آن کرنے کی سفارش کرتے ہیں۔',
      'فرم کا مالک اپنے بنائے ہوئے اکاؤنٹس، ہر شخص کی رسائی، اور کسی کے جانے پر رسائی ختم کرنے کا ذمہ دار ہے۔',
      'آپ کے اکاؤنٹ سے ہونے والی ہر کارروائی کے آپ ذمہ دار ہیں۔'] },
    { id: 'content', h: '3۔ آپ کا مواد اور رازداری', p: [
      'فرم جو معلومات سروس میں ڈالتی ہے ("آپ کا مواد") اس کی مالک ہے۔ ہم اسے صرف سروس فراہم کرنے کے لیے پروسیس کرتے ہیں، جیسا کہ ہماری پرائیویسی پالیسی میں بیان ہے۔ ہم اس کی ملکیت کا دعویٰ نہیں کرتے۔',
      'وکلاء اپنے پیشہ ورانہ فرائض کے خود ذمہ دار رہتے ہیں، جن میں رازداری، استحقاق، ریکارڈ رکھنا، مفادات کے ٹکراؤ کی جانچ اور اپنی بار کونسل یا ریگولیٹر کے قواعد کی پابندی شامل ہے، اور یہ فیصلہ بھی کہ ہر موکل کے ساتھ کیا شیئر کرنا ہے۔ تنازعِ مفاد کی جانچ اور دیگر ٹولز مددگار ہیں، پیشہ ورانہ فیصلے کا متبادل نہیں۔',
      'پلیٹ فارم ایڈمنسٹریٹرز فرم اکاؤنٹس اور سبسکرپشنز کا انتظام کر سکتے ہیں، لیکن ایپلی کیشن اس طرح بنائی گئی ہے کہ وہ کیس کا مواد، پیغامات یا دستاویزات نہیں پڑھ سکتے۔ ہم آپ کے مواد تک صرف اس صورت میں رسائی لے سکتے ہیں جب آپ کی درخواست پر معاونت دینے، سروس کو محفوظ رکھنے یا قانون کے تقاضے کے لیے سختی سے ضروری ہو۔'] },
    { id: 'use', h: '4۔ قابلِ قبول استعمال', p: ['آپ اتفاق کرتے ہیں کہ آپ:'], ul: [
      'قانون نہیں توڑیں گے، اور غیر قانونی، حقوق کی خلاف ورزی کرنے والا یا نقصان دہ مواد اپ لوڈ نہیں کریں گے؛',
      'ان ڈیٹا یا اکاؤنٹس تک رسائی کی کوشش نہیں کریں گے جو آپ کے نہیں، اور سکیورٹی، ریٹ لمٹس یا سبسکرپشن کنٹرولز کو نہیں توڑیں گے؛',
      'اپنا اکاؤنٹ اپنی فرم سے باہر کے لوگوں کو فروخت یا شیئر نہیں کریں گے، اور کسی اور طریقے سے پلان کی حدود سے تجاوز نہیں کریں گے؛',
      'سروس کے ذریعے اسپیم نہیں بھیجیں گے اور کسی کو ہراساں نہیں کریں گے؛',
      'سروس کا ریورس انجینئرنگ، نقل یا اس میں مداخلت نہیں کریں گے۔'],
      after: ['جو رسائی ان اصولوں کی خلاف ورزی کرے، ہم اسے معطل کر سکتے ہیں، جہاں عملی ہو وہاں اطلاع کے ساتھ۔'] },
    { id: 'plans', h: '5۔ پلان، آزمائش اور ادائیگی', ul: [
      'نئی فرموں کو مفت آزمائش ملتی ہے۔ اس کے اختتام پر سروس جاری رکھنے کے لیے سبسکرائب کرنا لازمی ہے۔',
      'سبسکرپشن ماہانہ ہے یا آپ کی منتخب طویل مدت کے لیے، اس قیمت پر جو ادائیگی کے وقت ہمارے قیمتوں کے صفحے پر درج ہو۔ طویل مدت پر رعایت ہو سکتی ہے۔',
      'ہم مقامی بینک ٹرانسفر سے ادائیگی قبول کرتے ہیں۔ آپ درج شدہ رقم ہمارے بینک اکاؤنٹ میں منتقل کرتے ہیں اور سروس میں ٹرانسفر کا ثبوت اپ لوڈ کرتے ہیں۔ ہماری تصدیق کے بعد آپ کی مدت بڑھا دی جاتی ہے۔ ادائیگیاں واپس نہیں ہوتیں، سوائے اس کے کہ قانون تقاضا کرے یا ہم تحریری طور پر اتفاق کریں۔',
      'قیمتیں کسی بھی قابلِ اطلاق ٹیکس سے پہلے کی ہیں۔ ہم مناسب نوٹس کے ساتھ آئندہ مدتوں کی قیمتیں بدل سکتے ہیں۔',
      'ہر پلان جونیئر اکاؤنٹس، موکلوں اور اسٹوریج کی تعداد محدود کرتا ہے۔ حد سے بڑھنے پر ہم آپ سے اپ گریڈ کا کہہ سکتے ہیں۔'] },
    { id: 'suspension', h: '6۔ تاخیر سے ادائیگی اور معطلی', p: [
      'اگر سبسکرپشن کی مدت بغیر ادائیگی ختم ہو جائے تو ہم ایک مختصر رعایتی مدت دیتے ہیں، جو ایپ میں نظر آتی ہے۔ اس کے بعد فرم ورک اسپیس تک رسائی معطل ہو جاتی ہے: کچھ حذف نہیں ہوتا، اور فرم کے جونیئرز اور موکلوں کو نظر آتا ہے کہ فرم کا پلان فعال نہیں۔ ادائیگی پر رسائی بحال ہو جاتی ہے۔',
      'اگر اکاؤنٹ طویل عرصے تک غیر ادا شدہ رہے یا منسوخ ہو جائے تو ہم نوٹس اور ڈیٹا ایکسپورٹ کرنے کا موقع دینے کے بعد اسے حذف کر سکتے ہیں (دفعہ 9 دیکھیں)۔'] },
    { id: 'availability', h: '7۔ دستیابی اور تبدیلیاں', p: [
      'ہم سروس کو دستیاب اور محفوظ رکھنے کی کوشش کرتے ہیں، لیکن بلا تعطل یا بے عیب کام کی ضمانت نہیں دیتے۔ ہم خصوصیات کو اپ ڈیٹ، بہتر یا ختم کر سکتے ہیں، اور آپ پر نمایاں اثر ڈالنے والی تبدیلیوں کی اطلاع دینے کی کوشش کریں گے۔ جو کچھ آپ کھو نہیں سکتے اس کا ایکسپورٹ فنکشن سے بیک اپ رکھیں۔'] },
    { id: 'ip', h: '8۔ ہمارے حقوق', p: [
      `سروس، اس کا ڈیزائن، سافٹ ویئر اور برانڈ ${company} یا اس کے لائسنس دہندگان کی ملکیت ہیں۔ آپ کی سبسکرپشن فعال رہنے تک ہم آپ کو اپنی فرم کے لیے اسے استعمال کرنے کا محدود، غیر خصوصی، ناقابلِ منتقلی حق دیتے ہیں۔`] },
    { id: 'export', h: '9۔ ڈیٹا ایکسپورٹ اور حذف', p: [
      'آپ کسی بھی وقت سروس سے اپنا ڈیٹا ایکسپورٹ کر سکتے ہیں، اور اکاؤنٹ فعال رہنے کے دوران اور ختم ہونے کے بعد مناسب مدت تک ہم درخواست پر مکمل ایکسپورٹ فراہم کریں گے۔ اس کے بعد ہم ڈیٹا حذف کر سکتے ہیں۔ کچھ ریکارڈ (جیسے آڈٹ لاگ اور ادائیگی کے ریکارڈ) سکیورٹی، اکاؤنٹنگ یا قانونی وجوہات کی بنا پر زیادہ دیر رکھے جا سکتے ہیں۔'] },
    { id: 'liability', h: '10۔ دستبرداری اور ذمہ داری کی حد', p: [
      'سروس "جیسی ہے" اور "جیسی دستیاب ہے" کی بنیاد پر فراہم کی جاتی ہے۔ قانون جس حد تک اجازت دے، ہم ضمنی ضمانتوں کو خارج کرتے ہیں، اور بالواسطہ یا نتیجی نقصان، منافع کے نقصان، ڈیٹا کے نقصان، یا چھوٹی ہوئی پیشیوں، آخری تاریخوں یا میعادِ حد بندی کے ذمہ دار نہیں۔ آپ کو اپنی یاد دہانیاں خود رکھنی ہیں اور اہم تاریخیں آزادانہ جانچنی ہیں۔',
      'سروس سے متعلق کسی بھی دعوے پر ہماری کل ذمہ داری اس واقعے سے پہلے تین ماہ میں آپ کی ادا کردہ فیس تک محدود ہے جس سے دعویٰ پیدا ہوا۔ جس ذمہ داری کو قانون محدود کرنے کی اجازت نہیں دیتا، اسے کوئی شق محدود نہیں کرتی۔'] },
    { id: 'term', h: '11۔ معاہدے کا اختتام', p: [
      'آپ کسی بھی وقت سروس کا استعمال بند کر سکتے ہیں۔ جو فرم ان شرائط کی سنگین یا بار بار خلاف ورزی کرے، اس کے لیے ہم سروس معطل یا ختم کر سکتے ہیں۔ جو شقیں اپنی نوعیت سے باقی رہنی چاہئیں (بشمول ملکیت، ذمہ داری اور قابلِ اطلاق قانون) معاہدہ ختم ہونے کے بعد بھی جاری رہیں گی۔'] },
    { id: 'law', h: '12۔ قابلِ اطلاق قانون اور رابطہ', p: [
      `یہ شرائط ${jurisdiction} کے قوانین کے تابع ہیں، اور لازمی قواعد کے تابع ${jurisdiction} کی عدالتوں کو اختیارِ سماعت حاصل ہے۔ ہم ان شرائط کو اپ ڈیٹ کر سکتے ہیں؛ تبدیلی نافذ ہونے کے بعد سروس کا استعمال جاری رکھنے کا مطلب اسے قبول کرنا ہے۔ رابطہ: ${email}۔`] },
  ],
})

const privacyEn: Builder = ({ brand, company, email, jurisdiction }) => ({
  title: 'Privacy Policy',
  intro: [
    `This policy explains what personal information ${company} ("we", "us") handles through ${brand} (the "Service"), why, and the choices you have. It is written with Pakistani law practices in mind and reflects the principles of data protection (collect only what is needed, use it only for stated purposes, keep it secure). We do not claim compliance with any specific statute; please have this policy reviewed against the laws that apply to you.`,
  ],
  sections: [
    { id: 'roles', h: '1. Who is responsible for what', p: [
      `For the case, client and document information a law firm puts into the Service, the firm is the one deciding why and how it is used (the "controller"), and we act on the firm's behalf (the "processor"). For account, billing and website information, we decide how it is used.`] },
    { id: 'collect', h: '2. Information we handle', ul: [
      'Account details: name, email address, phone number, role, firm name, sign-in and two-factor information.',
      'Firm content: clients, cases, hearing dates, notes, messages, documents, tasks, time entries and invoices that firms and their clients add.',
      'Billing details: subscription plan, payment amounts and the transfer slip you upload as proof of payment.',
      'Website requests: the details you give when you ask for a trial or demo.',
      'Technical data: IP address, device and browser type, and security and audit logs (who did what and when).'] },
    { id: 'use', h: '3. How we use it', ul: [
      'To provide and secure the Service, including sign-in, access control, backups and support.',
      'To manage subscriptions and confirm payments.',
      'To send service messages, such as invitations, password resets, hearing reminders and subscription notices. These are not marketing emails.',
      'To respond to your trial or demo request.',
      'To prevent abuse and meet legal obligations.'],
      after: ['We do not sell personal information and we do not use client content for advertising.'] },
    { id: 'confidentiality', h: '4. Confidential legal information', p: [
      'Firms are isolated from each other. A client can see only what their lawyer chooses to share. Platform administrators manage accounts and subscriptions but the application does not give them access to case contents, messages or documents. Documents are held in private storage and opened with short-lived links.'] },
    { id: 'sharing', h: '5. Who we share it with', p: [
      'We use trusted service providers to run the Service, such as cloud hosting and database storage, and an email delivery provider. They may process data only to provide their service to us. We may disclose information where the law requires or to protect rights and safety. We do not otherwise share personal information.'] },
    { id: 'transfers', h: '6. Where data is kept', p: [
      'Our providers may store data in data centres outside Pakistan. By using the Service you understand this. We choose providers with appropriate security practices.'] },
    { id: 'security', h: '7. Security', ul: [
      'Access rules enforced in the database, so each firm sees only its own data.',
      'Private file storage and short-lived download links.',
      'Rate-limited sign-in, optional two-factor authentication and an audit log.',
      'Encrypted connections.'],
      after: ['No system is perfectly secure. Please use strong, unique passwords and switch on two-factor authentication. Tell us at once if you suspect a problem.'] },
    { id: 'retention', h: '8. How long we keep it', p: [
      'We keep firm content while the account is active. When an account ends we keep data for a limited period so you can export it, then delete it, except for records we must keep for security, accounting or legal reasons (for example audit and payment records). Website requests are kept only as long as needed to follow up.'] },
    { id: 'rights', h: '9. Your choices and rights', ul: [
      'Access and correct your profile in Settings.',
      'Turn email notifications on or off in Settings.',
      'Export your firm\'s data, or ask us for a full export.',
      'Ask us to delete your account or data, or to answer questions about how it is handled. Where we hold client data for a firm, we may refer your request to that firm.'],
      after: [`Contact us at ${email}.`] },
    { id: 'cookies', h: '10. Cookies', p: [
      'We use only the cookies needed to keep you signed in and to remember your language. Your theme preference is stored in your browser. We do not use advertising cookies.'] },
    { id: 'children', h: '11. Children', p: ['The Service is for professionals and their clients and is not directed at children.'] },
    { id: 'changes', h: '12. Changes and contact', p: [
      `We may update this policy and will show the date of the latest update. Questions or complaints: ${email}. This policy is governed by the laws of ${jurisdiction}.`] },
  ],
})

const privacyUr: Builder = ({ brand, company, email, jurisdiction }) => ({
  title: 'پرائیویسی پالیسی',
  intro: [
    `یہ پالیسی بتاتی ہے کہ ${company} ("ہم") ${brand} ("سروس") کے ذریعے کون سی ذاتی معلومات سنبھالتی ہے، کیوں، اور آپ کے پاس کیا اختیارات ہیں۔ یہ پاکستانی وکالتی دفاتر کو مدنظر رکھ کر لکھی گئی ہے اور ڈیٹا کے تحفظ کے اصولوں کی عکاسی کرتی ہے (صرف ضروری معلومات جمع کرنا، صرف بیان کردہ مقاصد کے لیے استعمال کرنا، اور محفوظ رکھنا)۔ ہم کسی مخصوص قانون کی تعمیل کا دعویٰ نہیں کرتے؛ براہِ کرم اس پالیسی کو اپنے قابلِ اطلاق قوانین کے مطابق جانچ لیں۔`,
  ],
  sections: [
    { id: 'roles', h: '1۔ کون کس چیز کا ذمہ دار ہے', p: [
      'جو کیس، موکل اور دستاویزی معلومات کوئی قانونی فرم سروس میں ڈالتی ہے، ان کے استعمال کا مقصد اور طریقہ فرم طے کرتی ہے ("کنٹرولر")، اور ہم فرم کی جانب سے کام کرتے ہیں ("پروسیسر")۔ اکاؤنٹ، بلنگ اور ویب سائٹ کی معلومات کے استعمال کا فیصلہ ہم کرتے ہیں۔'] },
    { id: 'collect', h: '2۔ ہم کون سی معلومات سنبھالتے ہیں', ul: [
      'اکاؤنٹ کی تفصیلات: نام، ای میل، فون نمبر، کردار، فرم کا نام، لاگ اِن اور ٹو فیکٹر کی معلومات۔',
      'فرم کا مواد: موکل، کیسز، پیشیوں کی تاریخیں، نوٹس، پیغامات، دستاویزات، ٹاسکس، وقت کے اندراجات اور انوائسز جو فرمیں اور ان کے موکل شامل کرتے ہیں۔',
      'بلنگ کی تفصیلات: سبسکرپشن پلان، ادائیگی کی رقم اور ادائیگی کے ثبوت کے طور پر آپ کی اپ لوڈ کردہ ٹرانسفر رسید۔',
      'ویب سائٹ کی درخواستیں: ٹرائل یا ڈیمو مانگتے وقت آپ کی دی گئی تفصیلات۔',
      'تکنیکی ڈیٹا: آئی پی ایڈریس، ڈیوائس اور براؤزر کی قسم، اور سکیورٹی و آڈٹ لاگ (کس نے کب کیا کیا)۔'] },
    { id: 'use', h: '3۔ ہم اسے کیسے استعمال کرتے ہیں', ul: [
      'سروس فراہم کرنے اور محفوظ رکھنے کے لیے، بشمول لاگ اِن، رسائی کا کنٹرول، بیک اپ اور معاونت۔',
      'سبسکرپشنز کے انتظام اور ادائیگیوں کی تصدیق کے لیے۔',
      'سروس کے پیغامات بھیجنے کے لیے، جیسے دعوت نامے، پاس ورڈ ری سیٹ، پیشی کی یاد دہانیاں اور سبسکرپشن کے نوٹس۔ یہ مارکیٹنگ ای میلز نہیں ہیں۔',
      'آپ کی ٹرائل یا ڈیمو کی درخواست کا جواب دینے کے لیے۔',
      'غلط استعمال روکنے اور قانونی ذمہ داریاں پوری کرنے کے لیے۔'],
      after: ['ہم ذاتی معلومات فروخت نہیں کرتے اور موکلوں کا مواد اشتہارات کے لیے استعمال نہیں کرتے۔'] },
    { id: 'confidentiality', h: '4۔ رازدارانہ قانونی معلومات', p: [
      'فرمیں ایک دوسرے سے الگ ہیں۔ موکل صرف وہی دیکھ سکتا ہے جو اس کا وکیل شیئر کرنا چاہے۔ پلیٹ فارم ایڈمنسٹریٹرز اکاؤنٹس اور سبسکرپشنز کا انتظام کرتے ہیں لیکن ایپلی کیشن انہیں کیس کے مواد، پیغامات یا دستاویزات تک رسائی نہیں دیتی۔ دستاویزات نجی اسٹوریج میں رکھی جاتی ہیں اور مختصر مدت کے لنکس سے کھلتی ہیں۔'] },
    { id: 'sharing', h: '5۔ ہم کس کے ساتھ شیئر کرتے ہیں', p: [
      'سروس چلانے کے لیے ہم قابلِ اعتماد فراہم کنندگان استعمال کرتے ہیں، جیسے کلاؤڈ ہوسٹنگ، ڈیٹا بیس اسٹوریج اور ای میل ڈیلیوری فراہم کنندہ۔ وہ ڈیٹا صرف ہمیں اپنی سروس دینے کے لیے پروسیس کر سکتے ہیں۔ جہاں قانون تقاضا کرے یا حقوق اور حفاظت کے تحفظ کے لیے ہم معلومات ظاہر کر سکتے ہیں۔ اس کے علاوہ ہم ذاتی معلومات شیئر نہیں کرتے۔'] },
    { id: 'transfers', h: '6۔ ڈیٹا کہاں رکھا جاتا ہے', p: [
      'ہمارے فراہم کنندگان ڈیٹا کو پاکستان سے باہر ڈیٹا سینٹرز میں رکھ سکتے ہیں۔ سروس استعمال کر کے آپ اسے سمجھتے ہیں۔ ہم مناسب سکیورٹی طریقوں والے فراہم کنندگان منتخب کرتے ہیں۔'] },
    { id: 'security', h: '7۔ سکیورٹی', ul: [
      'ڈیٹا بیس میں نافذ رسائی کے اصول، تاکہ ہر فرم صرف اپنا ڈیٹا دیکھے۔',
      'نجی فائل اسٹوریج اور مختصر مدت کے ڈاؤن لوڈ لنکس۔',
      'حد بند لاگ اِن، اختیاری ٹو فیکٹر تصدیق اور آڈٹ لاگ۔',
      'خفیہ کردہ کنکشنز۔'],
      after: ['کوئی نظام مکمل طور پر محفوظ نہیں ہوتا۔ براہِ کرم مضبوط اور منفرد پاس ورڈ استعمال کریں اور ٹو فیکٹر تصدیق آن کریں۔ کسی مسئلے کا شبہ ہو تو فوراً ہمیں بتائیں۔'] },
    { id: 'retention', h: '8۔ ہم اسے کتنی دیر رکھتے ہیں', p: [
      'اکاؤنٹ فعال رہنے تک ہم فرم کا مواد رکھتے ہیں۔ اکاؤنٹ ختم ہونے پر ہم ڈیٹا ایک محدود مدت رکھتے ہیں تاکہ آپ اسے ایکسپورٹ کر سکیں، پھر حذف کر دیتے ہیں، سوائے ان ریکارڈ کے جو سکیورٹی، اکاؤنٹنگ یا قانونی وجوہات سے رکھنے لازمی ہوں (مثلاً آڈٹ اور ادائیگی کے ریکارڈ)۔ ویب سائٹ کی درخواستیں صرف اتنی دیر رکھی جاتی ہیں جتنی رابطے کے لیے ضروری ہو۔'] },
    { id: 'rights', h: '9۔ آپ کے اختیارات اور حقوق', ul: [
      'سیٹنگز میں اپنی پروفائل دیکھیں اور درست کریں۔',
      'سیٹنگز میں ای میل نوٹیفکیشنز آن یا آف کریں۔',
      'اپنی فرم کا ڈیٹا ایکسپورٹ کریں، یا ہم سے مکمل ایکسپورٹ مانگیں۔',
      'ہم سے اپنا اکاؤنٹ یا ڈیٹا حذف کرنے، یا اس کے سنبھالے جانے کے بارے میں سوالات کے جواب دینے کا کہیں۔ جہاں ہم کسی فرم کے لیے موکلوں کا ڈیٹا رکھتے ہیں، ہم آپ کی درخواست اسی فرم کو بھیج سکتے ہیں۔'],
      after: [`ہم سے ${email} پر رابطہ کریں۔`] },
    { id: 'cookies', h: '10۔ کوکیز', p: [
      'ہم صرف وہ کوکیز استعمال کرتے ہیں جو آپ کو لاگ اِن رکھنے اور آپ کی زبان یاد رکھنے کے لیے ضروری ہیں۔ آپ کی تھیم کی ترجیح آپ کے براؤزر میں محفوظ ہوتی ہے۔ ہم اشتہاری کوکیز استعمال نہیں کرتے۔'] },
    { id: 'children', h: '11۔ بچے', p: ['سروس پیشہ ور افراد اور ان کے موکلوں کے لیے ہے اور بچوں کے لیے نہیں۔'] },
    { id: 'changes', h: '12۔ تبدیلیاں اور رابطہ', p: [
      `ہم اس پالیسی کو اپ ڈیٹ کر سکتے ہیں اور تازہ ترین اپ ڈیٹ کی تاریخ دکھائیں گے۔ سوالات یا شکایات: ${email}۔ یہ پالیسی ${jurisdiction} کے قوانین کے تابع ہے۔`] },
  ],
})

const DOCS: Record<'terms' | 'privacy', Record<Locale, Builder>> = {
  terms: { en: termsEn, ur: termsUr },
  privacy: { en: privacyEn, ur: privacyUr },
}

export function getLegalDoc(kind: 'terms' | 'privacy', locale: Locale, vars: LegalVars): LegalDoc {
  return DOCS[kind][locale](vars)
}
