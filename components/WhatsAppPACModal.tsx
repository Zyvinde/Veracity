'use client';

import React, { useState, useMemo } from 'react';
import { PatientCase, AttestationRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  MessageSquare,
  X,
  Send,
  Check,
  CheckCheck,
  Phone,
  Globe2,
  FileText,
  Lock,
  Sparkles,
  ExternalLink,
  Copy,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Smartphone,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WhatsAppPACModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientCase;
  attestationRecord: AttestationRecord | null;
  onLogAudit?: (action: string, details: string) => void;
}

export const WhatsAppPACModal: React.FC<WhatsAppPACModalProps> = ({
  isOpen,
  onClose,
  patient,
  attestationRecord,
  onLogAudit,
}) => {
  const { t } = useI18n();
  const [phoneNumber, setPhoneNumber] = useState<string>(
    patient.phoneNumber || (patient.mrn.includes('DHA') ? '+971 50 892 1440' : '+91 98450 44019')
  );
  const [language, setLanguage] = useState<'en' | 'ar' | 'hi' | 'ur' | 'ml'>(
    patient.preferredLanguage || (patient.mrn.includes('DHA') ? 'ar' : 'en')
  );
  const [isSending, setIsSending] = useState(false);
  const [sendStep, setSendStep] = useState<number>(0);
  const [isDelivered, setIsDelivered] = useState(false);
  const [copied, setCopied] = useState(false);
  // SeamlessMD-lite: Day 0-7 post-op follow-up template reusing the same send flow
  const [template, setTemplate] = useState<'PREOP' | 'POSTOP'>('PREOP');

  if (!isOpen) return null;

  const scheduledDate = new Date(patient.scheduledTimeIso);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCleared = patient.overallStatus === 'GREEN_CLEARED';
  const isAmber = patient.overallStatus === 'AMBER_CONDITIONAL';
  const anesthesiologistLine = attestationRecord?.anesthesiologistName || patient.anesthesiologist;

  // Generate localized text
  const getMessageContent = () => {
    const certNumber = patient.id;
    const isUAE = patient.mrn.includes('DHA') || patient.facility.includes('Dubai');

    if (language === 'ar') {
      return {
        greeting: `مرحباً ${patient.name}،`,
        title: `*تصريح التقييم قبل التخدير والجراحة (PAC) - House Health*`,
        status: isCleared
          ? '🟢 *الحالة: مصرح للجراحة (CLEARED)*'
          : isAmber
          ? '🟡 *الحالة: تصريح مشروط (CONDITIONAL)*'
          : '🔴 *الحالة: تأجيل مؤقت للمراجعة (HARD STOP)*',
        details: [
          `🏥 *المستشفى:* ${patient.facility.split(',')[0]}`,
          `🩺 *العملية:* ${patient.procedureName} (${patient.cptCode})`,
          `📅 *الموعد:* ${formattedDate} الساعة ${formattedTime}`,
          `👨‍⚕️ *طبيب التخدير:* ${anesthesiologistLine}`,
        ],
        fastingTitle: `🕒 *تعليمات الصيام قبل العملية (NPO):*`,
        fastingText: `• الامتناع عن الأطعمة الصلبة لمدة 8 ساعات قبل الجراحة.\n• يُسمح بالسوائل الشفافة (الماء أو العصير الشفاف حتى 200 مل) حتى 3 ساعات قبل الجراحة.\n• لا تأخذ دواء السكري يوم الجراحة.\n• خذ دواء الغدة الدرقية يوم الجراحة مع رشفة ماء.`,
        medsTitle: `💊 *تعليمات الأدوية:*`,
        medsText: patient.medications
          .map((m) => `• ${m.drugName}: ${m.clinicalAction}`)
          .join('\n'),
        directiveTitle: `⚠️ *توجيهات الفريق الطبي:*`,
        directiveText: patient.primaryActionDirective,
        verifyLink: `🔗 رابط التحقق من التصريح الرقمي: https://pac.house.health/v/${patient.mrn}`,
        footer: `تم إصدار هذا التصريح الرقمي المعتمد برقم شهادة: ${certNumber}\n🔒 مدعوم بنظام الذكاء الاصطناعي السيادي House Health`,
      };
    }

    if (language === 'hi') {
      return {
        greeting: `नमस्ते ${patient.name},`,
        title: `*प्री-ऑपरेटिव एनेस्थीसिया क्लीयरेंस (PAC) - House Health*`,
        status: isCleared
          ? '🟢 *स्थिति: सर्जरी के लिए स्वीकृत (CLEARED)*'
          : isAmber
          ? '🟡 *स्थिति: सशर्त स्वीकृति (CONDITIONAL)*'
          : '🔴 *स्थिति: समीक्षा हेतु स्थगित (HARD STOP)*',
        details: [
          `🏥 *अस्पताल:* ${patient.facility.split(',')[0]}`,
          `🩺 *प्रक्रिया:* ${patient.procedureName} (${patient.cptCode})`,
          `📅 *समय:* ${formattedDate} समय ${formattedTime}`,
          `👨‍⚕️ *एनेस्थेसियोलॉजिस्ट:* ${anesthesiologistLine}`,
        ],
        fastingTitle: `🕒 *फास्टिंग (उपवास) निर्देश:*`,
        fastingText: `• सर्जरी से 8 घंटे पहले से कोई भी ठोस भोजन न लें।\n• सर्जरी से 3 घंटे पहले तक केवल 200ml साफ पानी या सेब का जूस ले सकते हैं।\n• सर्जरी वाले दिन शुगर (डायबिटीज) की दवा न लें।\n• थायरॉइड की दवा एक घूंट पानी के साथ जरूर लें।`,
        medsTitle: `💊 *दवाओं के निर्देश:*`,
        medsText: patient.medications
          .map((m) => `• ${m.drugName}: ${m.clinicalAction}`)
          .join('\n'),
        directiveTitle: `⚠️ *मुख्य निर्देश:*`,
        directiveText: patient.primaryActionDirective,
        verifyLink: `🔗 डिजिटल प्रमाणपत्र सत्यापन: https://pac.house.health/v/${patient.mrn}`,
        footer: `प्रमाणपत्र संख्या: ${certNumber}\n🔒 प्रमाणित डिजिटल मेडिकल रिकॉर्ड House Health`,
      };
    }

    if (language === 'ur') {
      return {
        greeting: `السلام علیکم ${patient.name}،`,
        title: `*پری آپریٹو اینستھیزیا کلیئرنس (PAC) - House Health*`,
        status: isCleared
          ? '🟢 *حیثیت: سرجری کے لیے منظور شدہ (CLEARED)*'
          : isAmber
          ? '🟡 *حیثیت: مشروط منظوری (CONDITIONAL)*'
          : '🔴 *حیثیت: نظرثانی کے لیے ملتوی (HARD STOP)*',
        details: [
          `🏥 *ہسپتال:* ${patient.facility.split(',')[0]}`,
          `🩺 *آپریشن:* ${patient.procedureName} (${patient.cptCode})`,
          `📅 *وقت:* ${formattedDate} وقت ${formattedTime}`,
          `👨‍⚕️ *اینستھیزیولوجسٹ:* ${anesthesiologistLine}`,
        ],
        fastingTitle: `🕒 *آپریشن سے پہلے روزے کی ہدایات (NPO):*`,
        fastingText: `• سرجری سے 8 گھنٹے پہلے ٹھوس غذا نہ لیں۔\n• سرجری سے 3 گھنٹے پہلے تک 200ml صاف پانی لے سکتے ہیں۔\n• سرجری والے دن ذیابیطس کی دوا نہ لیں۔\n• تھائرائیڈ کی دوا ایک گھونٹ پانی کے ساتھ ضرور لیں۔`,
        medsTitle: `💊 *ادویات کی ہدایات:*`,
        medsText: patient.medications
          .map((m) => `• ${m.drugName}: ${m.clinicalAction}`)
          .join('\n'),
        directiveTitle: `⚠️ *اہم ہدایات:*`,
        directiveText: patient.primaryActionDirective,
        verifyLink: `🔗 ڈیجیٹل سرٹیفکیٹ کی تصدیق: https://pac.house.health/v/${patient.mrn}`,
        footer: `سرٹیفکیٹ نمبر: ${certNumber}\n🔒 House Health مصدقہ ڈیجیٹل میڈیکل ریکارڈ`,
      };
    }

    if (language === 'ml') {
      return {
        greeting: `നമസ്കാരം ${patient.name},`,
        title: `*പ്രീ-ഓപ്പറേറ്റീവ് അനസ്തേഷ്യ ക്ലിയറൻസ് (PAC) - House Health*`,
        status: isCleared
          ? '🟢 *സ്ഥിതി: ശസ്ത്രക്രിയയ്ക്ക് അംഗീകരിച്ചു (CLEARED)*'
          : isAmber
          ? '🟡 *സ്ഥിതി: നിബന്ധനകളോടെയുള്ള അനുമതി (CONDITIONAL)*'
          : '🔴 *സ്ഥിതി: അവലോകനത്തിനായി മാറ്റിവച്ചു (HARD STOP)*',
        details: [
          `🏥 *ആശുപത്രി:* ${patient.facility.split(',')[0]}`,
          `🩺 *ശസ്ത്രക്രിയ:* ${patient.procedureName} (${patient.cptCode})`,
          `📅 *സമയം:* ${formattedDate} സമയം ${formattedTime}`,
          `👨‍⚕️ *അനസ്തേഷ്യോളജിസ്റ്റ്:* ${anesthesiologistLine}`,
        ],
        fastingTitle: `🕒 *ഉപവാസ നിർദ്ദേശങ്ങൾ (NPO):*`,
        fastingText: `• ശസ്ത്രക്രിയയ്ക്ക് 8 മണിക്കൂർ മുമ്പ് ഖരഭക്ഷണം കഴിക്കരുത്.\n• ശസ്ത്രക്രിയയ്ക്ക് 3 മണിക്കൂർ മുമ്പുവരെ 200ml തെളിനീർ കുടിക്കാം.\n• ശസ്ത്രക്രിയാ ദിവസം പ്രമേഹ മരുന്ന് കഴിക്കരുത്.\n• തൈറോയ്ഡ് മരുന്ന് ഒരു കവിൾ വെള്ളത്തോടെ കഴിക്കുക.`,
        medsTitle: `💊 *മരുന്ന് നിർദ്ദേശങ്ങൾ:*`,
        medsText: patient.medications
          .map((m) => `• ${m.drugName}: ${m.clinicalAction}`)
          .join('\n'),
        directiveTitle: `⚠️ *പ്രധാന നിർദ്ദേശങ്ങൾ:*`,
        directiveText: patient.primaryActionDirective,
        verifyLink: `🔗 ഡിജിറ്റൽ സർട്ടിഫിക്കറ്റ് പരിശോധന: https://pac.house.health/v/${patient.mrn}`,
        footer: `സർട്ടിഫിക്കറ്റ് നമ്പർ: ${certNumber}\n🔒 House Health സാക്ഷ്യപ്പെടുത്തിയ ഡിജിറ്റൽ മെഡിക്കൽ റെക്കോർഡ്`,
      };
    }

    // Default English
    return {
      greeting: `Dear ${patient.name},`,
      title: `*Official Digital Pre-Operative Assessment (PAC) Clearance*`,
      status: isCleared
        ? '🟢 *Status: CLEARED FOR SURGERY*'
        : isAmber
        ? '🟡 *Status: CONDITIONAL CLEARANCE*'
        : '🔴 *Status: HARD STOP • CASE DELAY RECOMMENDED*',
      details: [
        `🏥 *Facility:* ${patient.facility.split(',')[0]}`,
        `🩺 *Procedure:* ${patient.procedureName} (${patient.cptCode})`,
        `📅 *Scheduled:* ${formattedDate} at ${formattedTime}`,
        `👨‍⚕️ *Anesthesiologist:* ${anesthesiologistLine}`,
      ],
      fastingTitle: `🕒 *Preoperative Fasting (NPO) Rules:*`,
      fastingText: `• 8h solids / 2h minimum clears (3h preferred).\n• No solid food, milk, or heavy meals for 8 hours before surgery.\n• Clear liquids (water/apple juice up to 200ml): 2h minimum, 3h preferred.\n• Do NOT take diabetes medicine on day of surgery.\n• TAKE thyroid medicine on day of surgery with a sip of water.`,
      medsTitle: `💊 *Medication Hold Instructions:*`,
      medsText: patient.medications
        .map((m) => `• *${m.drugName}*: ${m.clinicalAction}`)
        .join('\n'),
      directiveTitle: `📋 *Primary Anesthesia Directive:*`,
      directiveText: patient.primaryActionDirective,
      fitnessTitle: `🏥 *Doctor Fitness (Major Illness):*`,
      fitnessText: (patient.fitnessReferrals || []).length > 0
        ? (patient.fitnessReferrals || []).map((r) => `• ${r.specialty}: ${r.status.replace('_', ' ')} — ${r.reason}`).join('\n')
        : `• No outside specialist fitness required.`,
      verifyLink: `🔗 *View Cryptographic Digital PAC Slip:* https://pac.house.health/v/${patient.mrn}`,
      pacInterviewLink: `📝 *Complete your 3-min Quick PAC (meds, 8h fasting, allergies, escort):* ${typeof window !== 'undefined' ? window.location.origin : ''}/pac?mrn=${encodeURIComponent(patient.mrn)}&mode=self`,
      footer: `Certificate No: ${certNumber} | Hash: ${attestationRecord?.signatureHash?.substring(0, 18) || '0x7f83b165...'}...\n🔒 House Health Sovereign Healthcare Gateway`,
    };
  };

  const msg = getMessageContent();
  const pacLinkBlock =
    (msg as { pacInterviewLink?: string }).pacInterviewLink ||
    `📝 Quick PAC (3 min): ${typeof window !== 'undefined' ? window.location.origin : ''}/pac?mrn=${encodeURIComponent(patient.mrn)}&mode=self`;
  const fitnessBlock = (() => {
    const m = msg as { fitnessTitle?: string; fitnessText?: string };
    if (!m.fitnessText || !m.fitnessText.trim()) return '';
    return `\n${m.fitnessTitle || `🏥 *Doctor Fitness (Major Illness):*`}\n${m.fitnessText}\n`;
  })();

  const fullTextMessage = template === 'POSTOP'
    ? `*HOUSE HEALTH — DAY 0-7 POST-OP CHECK-IN*
============================================

${msg.greeting}

*Post-op follow-up (Day 0-7): ${patient.procedureName}*
${isCleared ? '🟢 *Recovery on track* — keep ERAS plan.' : isAmber ? '🟡 *Recovery watch* — reply with scores below.' : '🔴 *Surgeon review advised* — reply TODAY.'}

🏥 *Facility:* ${patient.facility.split(',')[0]}
👨‍⚕️ *Surgeon:* ${patient.surgeon}

📋 *Reply with these 5 (takes 1 min):*
1) Pain 0-10 right now?
2) Fever? (temp °C if taken)
3) Wound: redness spreading? any discharge/pus?
4) Nausea/vomiting? opioid tablets in last 24h?
5) Walked/mobilised today? (yes/no)

🚦 *Traffic-light guide:*
• GREEN: pain ≤4, no fever, wound settled → continue plan
• AMBER: pain 5-7, temp 37.8-38.4, redness only, nausea, or not mobilised → nurse callback 24h
• RED: pain ≥8, temp ≥38.5, redness WITH discharge, or heavy opioid use → contact team TODAY / ED if rigors, chest pain, breathlessness

${msg.verifyLink}

------------------------------------------
${msg.footer}`
    : `*HOUSE HEALTH — DIGITAL PAC CLEARANCE PASSPORT*
============================================

${msg.greeting}

${msg.title}
${msg.status}

${msg.details.join('\n')}

${msg.fastingTitle}
${msg.fastingText}

${msg.medsTitle}
${msg.medsText}

${msg.directiveTitle}
${msg.directiveText}
${fitnessBlock}${pacLinkBlock}
${msg.verifyLink}

------------------------------------------
${msg.footer}`;

  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  const encodedUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(
    cleanPhone
  )}&text=${encodeURIComponent(fullTextMessage)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullTextMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateSend = () => {
    setIsSending(true);
    setSendStep(1);

    setTimeout(() => {
      setSendStep(2);
    }, 700);

    setTimeout(() => {
      setSendStep(3);
    }, 1400);

    setTimeout(() => {
      setSendStep(4);
      setIsSending(false);
      setIsDelivered(true);
      onLogAudit?.(
        'PAC_WHATSAPP_SENT',
        template === 'POSTOP'
          ? `Dispatched Day 0-7 post-op follow-up (pain/fever/wound) via WhatsApp to ${phoneNumber} in language [${language.toUpperCase()}]`
          : `Dispatched digital PAC clearance slip via WhatsApp to ${phoneNumber} in language [${language.toUpperCase()}]`
      );

      try {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      } catch {}
    }, 2100);
  };

  const isRTL = language === 'ar' || language === 'ur';

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-0 sm:p-4 animate-fade-in overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-full sm:max-w-4xl overflow-hidden glass-panel rounded-none sm:rounded-2xl shadow-2xl my-0 sm:my-6 min-h-screen sm:min-h-0 animate-scale-in text-white/90">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-white/10 px-4 sm:px-6 py-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-sky-200">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif italic text-lg tracking-wide text-white font-bold">
                  {t('whatsapp.title')}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[9.5px] font-mono font-bold text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-200" />
                  End-to-End Encrypted
                </span>
              </div>
              <p className="text-xs text-white/70 font-mono">
                {t('whatsapp.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="veracity-press rounded-xl p-2 text-white/60 hover:bg-white/15 hover:text-white/85 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Grid: Left Controls (5 cols) & Right WhatsApp UI Canvas (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/15 space-y-4 bg-white/10 font-sans text-xs min-w-0 break-words">
            {/* Patient Header Summary */}
            <div className="rounded-xl border border-white/25 bg-white/15 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-white/85 font-mono text-xs">
                <span className="text-white/60">Recipient Patient</span>
                <span className="font-bold text-white">{patient.name}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-white/70 font-mono text-[11px]">
                <span>{t('whatsapp.mrnFileNo')}</span>
                <span className="text-white/90 font-semibold">{patient.mrn}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-white/70 font-mono text-[11px]">
                <span>{t('whatsapp.clearanceStatus')}</span>
                <span className={`font-bold ${isCleared ? 'text-emerald-200' : isAmber ? 'text-amber-200' : 'text-rose-200'}`}>
                  {patient.overallStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-[10.5px] font-mono font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-sky-200" />
                {t('whatsapp.whatsappNumber')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-xl glass-input border px-3.5 py-2 font-mono text-xs font-medium text-white focus:border-white/60 focus:ring-1 focus:ring-white/60 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-white/30">
                  Verified
                </span>
              </div>
              <p className="mt-1 text-[10px] text-white/60 font-mono">
                {t('whatsapp.intlFormats')}
              </p>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-[10.5px] font-mono font-semibold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-sky-200" />
                {t('whatsapp.languageSelect')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs min-w-0">
                {(
                  [
                    { code: 'en', label: 'EN · English' },
                    { code: 'ar', label: 'AR · عربي' },
                    { code: 'hi', label: 'HI · हिन्दी' },
                    { code: 'ur', label: 'UR · اردو' },
                    { code: 'ml', label: 'ML · മലയാളം' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setLanguage(opt.code)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 transition cursor-pointer min-h-[44px] ${
                      language === opt.code
                        ? 'border-sky-300 bg-white/15 font-bold text-sky-800 shadow-2xs'
                        : 'border-white/25 bg-white/15 text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector: Pre-op clearance vs Day 0-7 follow-up */}
            <div>
              <label className="block text-[10.5px] font-mono font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Message template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs min-w-0">
                <button
                  type="button"
                  onClick={() => setTemplate('PREOP')}
                  className={`rounded-xl border py-2 px-3 transition cursor-pointer min-h-[44px] ${
                    template === 'PREOP'
                      ? 'border-sky-300 bg-white/15 font-bold text-sky-800 shadow-2xs'
                      : 'border-white/25 bg-white/15 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>Pre-op clearance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('POSTOP')}
                  className={`rounded-xl border py-2 px-3 transition cursor-pointer min-h-[44px] ${
                    template === 'POSTOP'
                      ? 'border-sky-300 bg-white/15 font-bold text-sky-800 shadow-2xs'
                      : 'border-white/25 bg-white/15 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>Day 0–7 follow-up</span>
                </button>
              </div>
              <p className="mt-1 text-[10px] text-white/60 font-mono">
                Follow-up asks pain / fever / wound + reuses the same send flow.
              </p>
            </div>

            {/* Included Attachments Info */}
            <div className="rounded-xl border border-white/25 bg-white/15 p-3.5 space-y-2 text-[10.5px] text-white/75 shadow-2xs">
              <span className="font-bold text-white font-mono uppercase tracking-wider block text-[10px]">
                {t('whatsapp.packageIncludes')}
              </span>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-sky-200 shrink-0" />
                <span>{t('whatsapp.pdfSlip')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-200 shrink-0" />
                <span>{t('whatsapp.fastingDirectives')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-sky-200 shrink-0" />
                <span>{t('whatsapp.sha256Link')}</span>
              </div>
            </div>

            {/* Telemetry Progress Bar during send */}
            {sendStep > 0 && (
              <div className="rounded-xl border border-white/30 bg-white/15 p-3.5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Gateway Dispatch: Step {sendStep} / 4
                  </span>
                  <span className="text-white font-bold">
                    {sendStep === 4 ? 'Delivered ✓✓' : 'Sending...'}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-[width] duration-300 ease-out"
                    style={{ width: `${(sendStep / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-white/75">
                  {sendStep === 1 && '1/4: Connecting to Azure UAE North Healthcare WhatsApp Cloud Gateway...'}
                  {sendStep === 2 && '2/4: Assembling localized PAC directives & cryptographic payload...'}
                  {sendStep === 3 && '3/4: Generating secure one-time patient verification link...'}
                  {sendStep === 4 && '4/4: Successfully Delivered and Read by Patient Device!'}
                </p>
              </div>
            )}
          </div>

          {/* Right WhatsApp Simulator Canvas (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-[#F0F4F8] flex flex-col justify-between border-l border-white/15">
            <div>
              {/* WhatsApp Chat Header */}
              <div className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 border border-white/25 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 font-bold text-white shadow">
                      HH
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-sm font-bold text-white">
                        {t('whatsapp.antHealthBot')}
                      </span>
                      <span className="rounded-full bg-white/15 text-white px-2 py-0.5 font-mono text-[9px] font-bold border border-white/30">
                        {t('whatsapp.official')}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-white/70 font-mono">
                      {t('whatsapp.verifiedBot')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/70 font-mono text-xs">
                  <span className="text-emerald-200 font-bold">{t('whatsapp.online')}</span>
                </div>
              </div>

              {/* WhatsApp Message Bubble Canvas */}
              <div className="mt-4">
                <div
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="relative rounded-2xl bg-white/15 p-5 text-white/90 border border-white/25 text-xs font-sans space-y-3 max-w-xl leading-relaxed shadow-xs"
                >
                  {/* Message Title */}
                  <div className="border-b border-white/15 pb-2.5 flex items-center justify-between">
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-sky-200" />
                      <span>{msg.title.replace(/\*/g, '')}</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/60">
                      PAC #{patient.id}
                    </span>
                  </div>

                  <p className="font-semibold text-white">{msg.greeting}</p>

                  {/* Clearance Badge Card */}
                  <div className={`p-3 rounded-xl border text-xs font-mono font-bold ${
                    isCleared
                      ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100'
                      : isAmber
                      ? 'bg-amber-500/20 border-amber-300/40 text-amber-800'
                      : 'bg-rose-500/20 border-rose-300/40 text-rose-800'
                  }`}>
                    {msg.status.replace(/\*/g, '')}
                  </div>

                  {/* Surgery Details */}
                  <div className="bg-white/10 p-3.5 rounded-xl space-y-1 font-mono text-[11px] text-white/85 border border-white/20">
                    {msg.details.map((d, idx) => (
                      <div key={idx}>{d.replace(/\*/g, '')}</div>
                    ))}
                  </div>

                  {/* Fasting NPO */}
                  <div className="bg-amber-50/70 p-3.5 rounded-xl space-y-1 text-[11px] text-amber-900 border border-amber-300/40">
                    <strong className="text-amber-800 block font-mono text-xs">
                      {msg.fastingTitle.replace(/\*/g, '')}
                    </strong>
                    <div className="whitespace-pre-line text-[11px] font-sans text-amber-950">{msg.fastingText}</div>
                  </div>

                  {/* Medications */}
                  <div className="bg-white/10 p-3.5 rounded-xl space-y-1 text-[11px] text-white/85 border border-white/20">
                    <strong className="text-white block font-mono text-xs">
                      {msg.medsTitle.replace(/\*/g, '')}
                    </strong>
                    <div className="whitespace-pre-line text-[11px] font-sans">{msg.medsText.replace(/\*/g, '')}</div>
                  </div>

                  {/* PDF Attachment Simulator */}
                  <div className="rounded-xl border border-white/25 bg-white/10 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs">
                        PDF
                      </div>
                      <div>
                        <div className="font-bold text-white text-[11.5px]">
                          Digital_PAC_Clearance_{patient.mrn}.pdf
                        </div>
                        <div className="text-[10px] text-white/70 font-mono">
                          1 Page • 248 KB • Cryptographically Signed
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-200 font-bold border border-emerald-300/40">
                      ATTACHED
                    </span>
                  </div>

                  {/* Verification Link */}
                  <div className="text-[10.5px] font-mono text-white break-all bg-sky-50/80 p-2.5 rounded-xl border border-white/30">
                    {msg.verifyLink.replace(/\*/g, '')}
                  </div>

                  {/* WhatsApp Time & Delivery Tick */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-white/60 font-mono">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className={`h-4 w-4 ${isDelivered ? 'text-sky-200 font-bold' : 'text-white/80'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-4 pt-3.5 border-t border-white/25 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 rounded-xl glass-input border px-3.5 py-2 text-xs font-mono text-white/85 hover:bg-white/10 transition cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5 text-white/70" />}
                <span>{copied ? t('whatsapp.copiedMsg') : t('whatsapp.copyText')}</span>
              </button>

              <a
                href={encodedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onLogAudit?.(
                    'PAC_WHATSAPP_SENT',
                    `Opened direct WhatsApp Web/App dispatcher for ${phoneNumber}`
                  );
                }}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-mono text-white font-bold transition shadow-md cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-white" />
                <span>{t('whatsapp.openWhatsApp')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-white/10 px-4 sm:px-6 py-4 min-w-0">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-white/70">
            <Lock className="h-3.5 w-3.5 text-sky-200" />
            <span>{t('whatsapp.azureGateway')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl glass-input border px-4 py-2 text-xs font-semibold text-white/85 hover:text-white hover:bg-white/15 transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleSimulateSend}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-white/85 px-6 py-2 text-xs font-bold text-slate-900 transition cursor-pointer disabled:opacity-50 shadow-md shadow-black/40 active:scale-95"
            >
              {isSending ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-white" />
                  <span>{t('whatsapp.dispatching')}</span>
                </>
              ) : isDelivered ? (
                <>
                  <CheckCheck className="h-4 w-4 text-white" />
                  <span>{t('whatsapp.resend')}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-white" />
                  <span>{t('whatsapp.sendNow')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPACModal;
