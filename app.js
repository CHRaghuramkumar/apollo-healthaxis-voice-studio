(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=(step,src,text)=>({t:'s',step,src,text}),A=(step,text)=>({t:'a',step,text}),P=(step,text,mood)=>({t:'p',step,text,mood}),H=(step,text)=>({t:'h',step,text});
const ICONS={
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9 15l2 2 4-4"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h5l2-3 3 6 2-3h5"/>',
refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
headset:'<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/><path d="M18 17v1a3 3 0 0 1-3 3h-3"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
scale:'<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
};
const svg=(k,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const SRC={'Telephony':'telephony','MedMantra HIS':'his','Lab system':'his','Waitlist':'his','Hospital CRM':'crm','Care Console':'console','Feedback':'console','SMS & WhatsApp':'messaging','Conversation intelligence':'agent'};

// Languages. English entries run the full scripted call; the others play a translated opening line in the preview.
const LANGS=[
 {id:'en-IN',name:'Indian English',sub:'Recommended for Indian patients',badge:'🇮🇳',loc:'en-IN',en:true,g:'en'},
 {id:'en-GB',name:'UK English',sub:'British accent',badge:'🇬🇧',loc:'en-GB',en:true,g:'en'},
 {id:'en-US',name:'US English',sub:'American accent',badge:'🇺🇸',loc:'en-US',en:true,g:'en'},
 {id:'hi',name:'Hindi',sub:'हिन्दी',badge:'अ',loc:'hi-IN',g:'in',
  in:'नमस्ते, अपोलो हॉस्पिटल्स में कॉल करने के लिए धन्यवाद। मैं आशा हूँ, आपकी वर्चुअल असिस्टेंट। आज मैं आपकी क्या मदद कर सकती हूँ?',
  out:'नमस्ते, मैं अपोलो हॉस्पिटल्स से अनिका बोल रही हूँ। क्या अभी बात करने का सही समय है?'},
 {id:'te',name:'Telugu',sub:'తెలుగు',badge:'అ',loc:'te-IN',g:'in',
  in:'నమస్కారం, అపోలో హాస్పిటల్స్‌కు కాల్ చేసినందుకు ధన్యవాదాలు. నేను ఆశా, మీ వర్చువల్ అసిస్టెంట్‌ని. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?',
  out:'నమస్కారం, నేను అపోలో హాస్పిటల్స్ నుండి అనిక మాట్లాడుతున్నాను. ఇప్పుడు మాట్లాడటానికి మీకు వీలుందా?'},
 {id:'ta',name:'Tamil',sub:'தமிழ்',badge:'அ',loc:'ta-IN',g:'in',
  in:'வணக்கம், அப்போலோ மருத்துவமனைக்கு அழைத்ததற்கு நன்றி. நான் ஆஷா, உங்கள் மெய்நிகர் உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  out:'வணக்கம், நான் அப்போலோ மருத்துவமனையிலிருந்து அனிகா பேசுகிறேன். இப்போது பேச உங்களுக்கு வசதியாக இருக்கிறதா?'},
 {id:'kn',name:'Kannada',sub:'ಕನ್ನಡ',badge:'ಅ',loc:'kn-IN',g:'in',
  in:'ನಮಸ್ಕಾರ, ಅಪೋಲೋ ಹಾಸ್ಪಿಟಲ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಾನು ಆಶಾ, ನಿಮ್ಮ ವರ್ಚುವಲ್ ಅಸಿಸ್ಟೆಂಟ್. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
  out:'ನಮಸ್ಕಾರ, ನಾನು ಅಪೋಲೋ ಹಾಸ್ಪಿಟಲ್ಸ್‌ನಿಂದ ಅನಿಕಾ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಈಗ ಮಾತನಾಡಲು ನಿಮಗೆ ಅನುಕೂಲವಿದೆಯೇ?'},
 {id:'ml',name:'Malayalam',sub:'മലയാളം',badge:'അ',loc:'ml-IN',g:'in',
  in:'നമസ്കാരം, അപ്പോളോ ഹോസ്പിറ്റൽസിലേക്ക് വിളിച്ചതിന് നന്ദി. ഞാൻ ആശ, നിങ്ങളുടെ വെർച്വൽ അസിസ്റ്റന്റ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?',
  out:'നമസ്കാരം, അപ്പോളോ ഹോസ്പിറ്റൽസിൽ നിന്ന് അനിക ആണ് വിളിക്കുന്നത്. ഇപ്പോൾ സംസാരിക്കാൻ സൗകര്യമുണ്ടോ?'},
 {id:'bn',name:'Bengali',sub:'বাংলা',badge:'অ',loc:'bn-IN',g:'in',
  in:'নমস্কার, অ্যাপোলো হাসপাতালে ফোন করার জন্য ধন্যবাদ। আমি আশা, আপনার ভার্চুয়াল সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  out:'নমস্কার, আমি অ্যাপোলো হাসপাতাল থেকে অনিকা বলছি। এখন কথা বলার সুবিধা হবে কি?'},
 {id:'mr',name:'Marathi',sub:'मराठी',badge:'म',loc:'mr-IN',g:'in',
  in:'नमस्कार, अपोलो हॉस्पिटल्सला कॉल केल्याबद्दल धन्यवाद. मी आशा, तुमची व्हर्च्युअल असिस्टंट. आज मी तुमची कशी मदत करू शकते?',
  out:'नमस्कार, मी अपोलो हॉस्पिटल्समधून अनिका बोलत आहे. आता बोलायला तुम्हाला वेळ आहे का?'},
 {id:'ar',name:'Arabic',sub:'العربية',badge:'🇦🇪',flag:true,loc:'ar-SA',g:'intl',
  in:'مرحباً، شكراً لاتصالك بمستشفيات أبولو. أنا آشا، مساعدتك الافتراضية. كيف يمكنني مساعدتك اليوم؟',
  out:'مرحباً، معك أنيكا من مستشفيات أبولو. هل هذا وقت مناسب للحديث؟'},
 {id:'es',name:'Spanish',sub:'Español',badge:'🇪🇸',flag:true,loc:'es-ES',g:'intl',
  in:'Hola, gracias por llamar a Apollo Hospitals. Soy Asha, su asistente virtual. ¿En qué puedo ayudarle hoy?',
  out:'Hola, le llama Anika de Apollo Hospitals. ¿Es un buen momento para hablar?'},
 {id:'it',name:'Italian',sub:'Italiano',badge:'🇮🇹',flag:true,loc:'it-IT',g:'intl',
  in:'Buongiorno, grazie per aver chiamato Apollo Hospitals. Sono Asha, la sua assistente virtuale. Come posso aiutarla oggi?',
  out:'Buongiorno, sono Anika di Apollo Hospitals. È un buon momento per parlare?'},
 {id:'ja',name:'Japanese',sub:'日本語',badge:'🇯🇵',flag:true,loc:'ja-JP',g:'intl',
  in:'お電話ありがとうございます。アポロ病院のバーチャルアシスタント、アシャです。本日はどのようなご用件でしょうか？',
  out:'こんにちは、アポロ病院のアニカです。今、少しお時間よろしいでしょうか？'},
 {id:'fr',name:'French',sub:'Français',badge:'🇫🇷',flag:true,loc:'fr-FR',g:'intl',
  in:"Bonjour, merci d'avoir appelé Apollo Hospitals. Je suis Asha, votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
  out:"Bonjour, ici Anika d'Apollo Hospitals. Est-ce un bon moment pour discuter ?"},
 {id:'de',name:'German',sub:'Deutsch',badge:'🇩🇪',flag:true,loc:'de-DE',g:'intl',
  in:'Guten Tag, vielen Dank für Ihren Anruf bei Apollo Hospitals. Ich bin Asha, Ihre virtuelle Assistentin. Wie kann ich Ihnen heute helfen?',
  out:'Guten Tag, hier ist Anika von Apollo Hospitals. Passt es Ihnen gerade, kurz zu sprechen?'},
 {id:'pt',name:'Portuguese',sub:'Português',badge:'🇧🇷',flag:true,loc:'pt-BR',g:'intl',
  in:'Olá, obrigada por ligar para o Apollo Hospitals. Sou a Asha, sua assistente virtual. Como posso ajudar você hoje?',
  out:'Olá, aqui é a Anika, do Apollo Hospitals. Este é um bom momento para conversarmos?'},
 {id:'zh',name:'Mandarin',sub:'中文',badge:'🇨🇳',flag:true,loc:'zh-CN',g:'intl',
  in:'您好，感谢您致电阿波罗医院。我是您的虚拟助手阿莎。请问今天有什么可以帮您？',
  out:'您好，我是阿波罗医院的阿妮卡。请问现在方便通话吗？'},
 {id:'ru',name:'Russian',sub:'Русский',badge:'🇷🇺',flag:true,loc:'ru-RU',g:'intl',
  in:'Здравствуйте, спасибо, что позвонили в Apollo Hospitals. Я Аша, ваш виртуальный помощник. Чем я могу вам помочь сегодня?',
  out:'Здравствуйте, это Аника из Apollo Hospitals. Вам сейчас удобно говорить?'}
];

const UC=[
{id:'booking',icon:'calendar',title:'Appointment Booking & Rescheduling',card:'Book, reschedule or cancel by voice, 24×7, with live slots from MedMantra.',dir:'Inbound',agent:'Asha',
 tagline:'A patient calls to move a cardiology consult. The agent verifies them, finds live slots, updates the HIS and confirms on WhatsApp — no queue, no manual entry.',
 chips:['Inbound helpline','MedMantra HIS','CRM disposition'],
 patient:{name:'Ravi Kumar Sharma',gender:'M',meta:'Male · 46 yrs',fields:[['UHID','AHX-DEMO-20417'],['Phone','+91 98xxx x4417'],['Booked with','Dr. Meera Iyer, Cardiology'],['Current slot','Thu 16 Oct, 10:30 AM'],['Location','Apollo Hospitals, Jubilee Hills'],['Call type','Inbound helpline']]},
 steps:['Caller identified from phone number','Intent detected: reschedule','Live slots fetched from MedMantra','Appointment updated in HIS','Confirmation sent on SMS & WhatsApp','Disposition logged in CRM'],
 turns:[
  S(0,'Telephony','Inbound call connected · +91 98xxx x4417'),
  S(0,'MedMantra HIS','Patient matched · Ravi Kumar Sharma · UHID AHX-DEMO-20417'),
  A(0,"Hello, thank you for calling Apollo Hospitals. I'm Asha, your virtual assistant. Am I speaking with Mr. Ravi Kumar Sharma?"),
  P(0,"Yes, that's me.",'neutral'),
  A(1,"Thank you, Mr. Sharma. I can see your cardiology appointment with Dr. Meera Iyer this Thursday at 10:30 AM. How can I help you today?"),
  P(1,"I have a work trip on Thursday. Can I move it to the weekend?"),
  S(2,'MedMantra HIS','Slot availability fetched · Dr. Meera Iyer · Sat 18 Oct'),
  A(2,"Of course. Dr. Iyer has two slots this Saturday, at 11 AM and 12:30 PM. Which would suit you better?"),
  P(2,"11 o'clock works.",'positive'),
  A(3,"Just to confirm, I'm moving your appointment to Saturday, 18th October, at 11 AM with Dr. Meera Iyer at Apollo Hospitals, Jubilee Hills. Shall I go ahead?"),
  P(3,"Yes, please."),
  S(3,'MedMantra HIS','Appointment rescheduled · Ref APT-DEMO-88213'),
  S(4,'SMS & WhatsApp','Confirmation sent with date, time, doctor and location'),
  A(4,"Done. Your appointment is confirmed and you'll receive the details on SMS and WhatsApp shortly. Please arrive fifteen minutes early. Is there anything else I can help with?"),
  P(4,"No, that's all. Thank you.",'positive'),
  A(5,"You're welcome, Mr. Sharma. Have a good day."),
  S(5,'Hospital CRM','Disposition: Rescheduled · call summary saved')],
 intel:{summary:'Patient asked to move Thursday cardiology consult because of travel. Rescheduled to Sat 18 Oct, 11:00 AM with Dr. Meera Iyer. Confirmation sent on SMS and WhatsApp.',intent:'Reschedule appointment',sentiment:'Positive',disposition:'Rescheduled',next:'Reminder call 24 hrs before',handoff:'Not required',duration:'1 min 48 sec'},
 kpis:[['24×7','Booking, rescheduling and cancellation without call-centre queues'],['< 2 min','Typical end-to-end rescheduling call'],['Zero','Manual data entry — HIS and CRM update automatically']]},
{id:'reminders',icon:'bell',title:'Appointment Reminders & Cancellations',card:'Day-before reminders that confirm, reschedule or cancel — and refill freed slots.',dir:'Outbound',agent:'Anika',
 tagline:'A day-before reminder turns into a cancellation. The agent offers to reschedule, releases the slot in the HIS and offers it to the next waitlisted patient.',
 chips:['Outbound reminder','Slot backfill','WhatsApp rebooking link'],
 patient:{name:'Mohammed Imran',gender:'M',meta:'Male · 58 yrs',fields:[['UHID','AHX-DEMO-72105'],['Phone','+91 99xxx x2105'],['Booked with','Dr. Sunita Rao, Endocrinology'],['Appointment','Thu 16 Oct, 9:00 AM'],['Location','Apollo Hospitals, Jubilee Hills'],['Trigger','24-hour reminder']]},
 steps:["Tomorrow's appointments pulled from HIS",'Reminder call placed','Cancellation request understood','Reschedule offered','Cancelled & slot released','Slot offered to waitlist'],
 turns:[
  S(0,'MedMantra HIS','Reminder list fetched · Endocrinology · Thu 16 Oct'),
  S(1,'Telephony','Outbound call · answered in 5 sec'),
  A(1,"Hello, this is Anika calling from Apollo Hospitals. Am I speaking with Mr. Mohammed Imran?"),
  P(1,"Yes, speaking.",'neutral'),
  A(1,"This is a reminder for your appointment with Dr. Sunita Rao in Endocrinology tomorrow, Thursday, at 9 AM. Will you be able to attend?"),
  P(2,"Actually, I need to cancel. We have a family function out of town."),
  A(3,"I understand. Would you like me to reschedule instead, so your follow-up isn't delayed? Dr. Rao has openings next Monday and Tuesday morning."),
  P(3,"Not right now. I'll book again once I'm back."),
  A(4,"No problem. I've cancelled tomorrow's appointment, and I'm sending you a booking link on WhatsApp so you can pick a new slot anytime."),
  S(4,'MedMantra HIS','Appointment cancelled · 9:00 AM slot released'),
  S(4,'SMS & WhatsApp','Rebooking link sent'),
  P(4,"That's helpful, thanks.",'positive'),
  A(4,"You're welcome, Mr. Imran. Have a safe trip."),
  S(5,'Waitlist','Freed slot offered to next waitlisted patient · accepted'),
  S(5,'Hospital CRM','Disposition: Cancelled · rebooking link sent · follow-up in 7 days')],
 intel:{summary:"Patient cancelled tomorrow's endocrinology appointment due to travel and declined an immediate reschedule. Rebooking link sent on WhatsApp. Freed slot filled from the waitlist.",intent:'Cancel appointment',sentiment:'Positive',disposition:'Cancelled · slot backfilled',next:'Follow-up call in 7 days if not rebooked',handoff:'Not required',duration:'1 min 22 sec'},
 kpis:[['A day early','Cancellations captured before the slot goes empty'],['Backfilled','Released slots offered instantly to waitlisted patients'],['Hours saved','Of front-desk reminder calling every day']]},
{id:'prohealth',icon:'heart',title:'ProHealth Check-up Reminders',card:'Confirms attendance and shares fasting and preparation instructions in advance.',dir:'Outbound',agent:'Anika',
 tagline:'Before a ProHealth check-up, the agent confirms attendance, gives fasting and document instructions, and routes medical questions to the ProHealth nurse.',
 chips:['Outbound batch','ProHealth','Nurse task on Care Console'],
 patient:{name:'Anitha Reddy',gender:'F',meta:'Female · 52 yrs',fields:[['UHID','AHX-DEMO-31852'],['Phone','+91 97xxx x1852'],['Package','ProHealth Advanced'],['Check-up','Sat 18 Oct, 7:30 AM'],['Location','Apollo Hospitals, Jubilee Hills'],['Trigger','48 hrs before check-up']]},
 steps:['Upcoming check-ups pulled from HIS','Outbound reminder call placed','Attendance confirmed','Preparation instructions shared','Medical query routed to nurse','Status updated for front desk'],
 turns:[
  S(0,'MedMantra HIS','ProHealth schedule fetched · 1 of 186 reminders for Sat 18 Oct'),
  S(1,'Telephony','Outbound call · answered in 6 sec'),
  A(1,"Good morning, this is Anika calling from Apollo ProHealth. Am I speaking with Mrs. Anitha Reddy?"),
  P(1,"Yes, speaking.",'neutral'),
  A(2,"Thank you, Mrs. Reddy. This is a reminder for your ProHealth Advanced health check-up this Saturday, 18th October, at 7:30 AM at Apollo Hospitals, Jubilee Hills. Will you be able to make it?"),
  P(2,"Yes, I'll be there.",'positive'),
  A(3,"Wonderful. A few quick instructions. Please fast for ten to twelve hours before the check-up — plain water is fine. And please bring a photo ID and any previous medical reports."),
  P(4,"Can I take my blood pressure tablet that morning?"),
  A(4,"That's a good question. I'll ask our ProHealth nurse to call you and confirm, so you have the right advice for your medicines."),
  S(4,'Care Console','Nurse callback created · medication before fasting tests'),
  P(4,"Okay, thank you.",'positive'),
  A(5,"You'll also receive these instructions on WhatsApp. The check-up takes about four to five hours, and breakfast is served after your fasting tests. We look forward to seeing you on Saturday."),
  S(5,'SMS & WhatsApp','Preparation checklist sent'),
  S(5,'MedMantra HIS','Attendance: Confirmed · front-desk list updated')],
 intel:{summary:'Patient confirmed attendance for ProHealth Advanced on Sat 18 Oct. Fasting and document instructions shared on call and WhatsApp. Medication question routed to the ProHealth nurse.',intent:'Confirm health check-up',sentiment:'Positive',disposition:'Confirmed',next:'Nurse callback on medication query',handoff:'Async nurse task',duration:'1 min 35 sec'},
 kpis:[['186','Reminder calls completed in one batch (sample day)'],['Fewer','Unprepared arrivals — fasting and document rules shared in advance'],['100%','Of reached patients get a logged outcome']]},
{id:'noshow',icon:'refresh',title:'No-Show Follow-up',card:'Calls patients who missed visits, captures the reason and rebooks on the spot.',dir:'Outbound',agent:'Anika',
 tagline:'A missed orthopaedic consult is flagged in the HIS. The agent calls, understands why, checks how the patient is doing and rebooks a convenient slot.',
 chips:['Outbound follow-up','Reason capture','Instant rebooking'],
 patient:{name:'Suresh Babu',gender:'M',meta:'Male · 38 yrs',fields:[['UHID','AHX-DEMO-47220'],['Phone','+91 90xxx x7220'],['Missed','Dr. Kiran Varma, Orthopaedics'],['Missed slot','Fri 10 Oct, 4:00 PM'],['Location','Apollo Hospitals, Jubilee Hills'],['Trigger','No-show flagged in HIS']]},
 steps:['No-show detected in HIS','Follow-up call placed','Reason for missing captured','Symptoms checked','New appointment booked','CRM updated for care team'],
 turns:[
  S(0,'MedMantra HIS','No-show flagged · Orthopaedics · Fri 10 Oct, 4:00 PM'),
  S(1,'Telephony','Outbound call · answered in 8 sec'),
  A(1,"Hello, this is Anika from Apollo Hospitals. Am I speaking with Mr. Suresh Babu?"),
  P(1,"Yes.",'neutral'),
  A(2,"We noticed you couldn't make it to your orthopaedic appointment with Dr. Kiran Varma last Friday. I just wanted to check in — is everything all right?"),
  P(2,"Sorry, I got stuck at work and forgot to call."),
  A(3,"No problem at all, thank you for letting me know. How is your knee now — better, about the same, or worse?"),
  P(3,"About the same. It still hurts when I climb stairs.",'concerned'),
  A(4,"I understand. It would be good for Dr. Varma to take a look. Shall I book a new appointment for you?"),
  P(4,"Yes, an evening slot if possible.",'neutral'),
  S(4,'MedMantra HIS','Evening slots fetched · Dr. Kiran Varma'),
  A(4,"Dr. Varma is available on Wednesday at 5:30 PM or Thursday at 6 PM. Which works better?"),
  P(4,"Wednesday is fine.",'positive'),
  S(4,'MedMantra HIS','Appointment booked · Wed 15 Oct, 5:30 PM'),
  A(5,"You're booked for Wednesday, 15th October, at 5:30 PM. If the pain suddenly gets worse or you notice swelling, please visit our emergency department. I'll send you a reminder the day before."),
  P(5,"Thank you.",'positive'),
  S(5,'Hospital CRM','Disposition: Rebooked · reason: work conflict')],
 intel:{summary:'Patient missed orthopaedic consult due to work. Knee pain on stairs is unchanged. Rebooked for Wed 15 Oct, 5:30 PM with Dr. Kiran Varma. Safety advice given.',intent:'Rebook missed appointment',sentiment:'Neutral → Positive',disposition:'Rebooked',next:'Reminder call Tue 14 Oct',handoff:'Not required',duration:'2 min 05 sec'},
 kpis:[['Next day','Follow-up on every missed appointment'],['Higher','Appointment adherence through instant rebooking'],['Structured','No-show reasons captured to fix root causes']]},
{id:'engagement',icon:'chat',title:'Post-Discharge Care & Feedback',card:'Day 1·3·7 care calls: medication check, red-flag screening and feedback.',dir:'Outbound',agent:'Anika',
 tagline:'Three days after knee replacement, the agent checks medicines and warning signs, routes a concern to a nurse and collects feedback — all logged on Care Console.',
 chips:['Post-discharge care call','Red-flag escalation','Feedback & rating'],
 patient:{name:'Lakshmi Devi',gender:'F',meta:'Female · 64 yrs',fields:[['UHID','AHX-DEMO-58631'],['Phone','+91 94xxx x8631'],['Discharged','Fri 10 Oct · Orthopaedics'],['Procedure','Total knee replacement'],['Call','Day-3 care check'],['Languages','English · Hindi · Telugu']]},
 steps:['Discharge list synced from HIS','Day-3 care call placed','Medication adherence checked','Symptoms & red flags screened','Feedback & rating collected','Summary sent to Care Console'],
 turns:[
  S(0,'MedMantra HIS','Discharge summary synced · total knee replacement · 10 Oct'),
  S(1,'Telephony','Outbound call · answered in 4 sec'),
  A(1,"Hello, this is Anika calling from Apollo Hospitals to check on you after your recent discharge. Am I speaking with Mrs. Lakshmi Devi?"),
  P(1,"Yes, this is Lakshmi.",'neutral'),
  A(2,"How are you feeling today, and are you able to take your medicines as prescribed?"),
  P(2,"I'm better. I take all the tablets, but sometimes I forget the evening one.",'neutral'),
  A(2,"Thank you for telling me. Keeping the tablets next to your dinner plate, or setting a phone alarm, can help. I'll also send you a medicine reminder on WhatsApp."),
  A(3,"Have you noticed any fever, increasing redness or swelling around the wound, or pain in your calf?"),
  P(3,"No fever. There is a little swelling in the evenings.",'concerned'),
  A(3,"Thank you. I'd like our care nurse to call you today to check on that swelling. Is that okay?"),
  P(3,"Yes, please."),
  S(3,'Care Console','Nurse callback created · priority: medium · evening swelling'),
  A(4,"Lastly, on a scale of one to five, how would you rate your overall experience at Apollo Hospitals?"),
  P(4,"Five. The nurses were very caring.",'positive'),
  S(4,'Feedback','Rating 5/5 · positive mention: nursing staff'),
  A(5,"Thank you so much, Mrs. Devi. I'll pass that on to the team. Our nurse will call you shortly. Take care."),
  S(5,'Care Console','Call summary & transcript saved · next check: Day 7')],
 intel:{summary:'Day-3 check after knee replacement. Patient recovering, occasionally misses evening dose — WhatsApp reminder set. Mild evening swelling reported; nurse callback created. Rated experience 5/5.',intent:'Post-discharge check & feedback',sentiment:'Positive',disposition:'Nurse follow-up required',next:'Nurse call today · Day-7 call scheduled',handoff:'Nurse callback (Care Console)',duration:'2 min 40 sec'},
 kpis:[['Day 1·3·7','Structured follow-up for every discharged patient'],['Early','Red flags routed to care nurses before they become readmissions'],['Every call','Feedback and ratings captured and analysed']]},
{id:'support',icon:'headset',title:'Patient Support & Human Handoff',card:'Answers routine queries instantly and warm-transfers complex ones with full context.',dir:'Inbound',agent:'Asha',
 tagline:'The agent answers a report-status query instantly, detects an insurance dispute it should not handle, and warm-transfers to billing with a context card — the patient never repeats themselves.',
 chips:['Inbound helpline','Conversation intelligence','Warm transfer'],
 patient:{name:'Priya Nair',gender:'F',meta:'Female · 34 yrs',fields:[['UHID','AHX-DEMO-60294'],['Phone','+91 96xxx x0294'],['Last visit','Fri 10 Oct · lab tests'],['Tests','CBC, thyroid profile'],['Open issue','Insurance claim query'],['Call type','Inbound helpline']]},
 steps:['Caller verified','Report status looked up','Routine query resolved','Handoff need detected','Warm transfer with context','Human agent continues in CRM'],
 turns:[
  S(0,'MedMantra HIS','Patient matched · Priya Nair · UHID AHX-DEMO-60294'),
  A(0,"Hello, thank you for calling Apollo Hospitals. I'm Asha. Am I speaking with Ms. Priya Nair?"),
  P(1,"Yes. I wanted to check whether my blood test reports are ready.",'neutral'),
  S(1,'Lab system','Report status: CBC ready · thyroid profile ready'),
  A(2,"Yes, Ms. Nair. Both your CBC and thyroid profile reports are ready. I've sent a secure download link to your registered mobile number."),
  S(2,'SMS & WhatsApp','Secure report link sent'),
  P(3,"Thanks. Also, my insurance claim for that visit was rejected and I don't understand why.",'concerned'),
  S(3,'Conversation intelligence','Intent: insurance dispute · sentiment: concerned · handoff recommended'),
  A(3,"I'm sorry to hear that. Your claim needs a closer look by our billing team, so I'll connect you now and share everything we've discussed, so you won't have to repeat yourself."),
  P(4,"Okay, thank you."),
  S(4,'Telephony','Warm transfer to billing desk · wait time 18 sec'),
  S(5,'Hospital CRM','Context card shown to agent: verified caller, reports sent, claim rejected'),
  H(5,"Hi Ms. Nair, this is Rahul from billing. I can already see your claim details — let me check what the insurer needs.")],
 intel:{summary:'Verified caller. Lab reports (CBC, thyroid) confirmed ready and secure link sent. Insurance claim rejection detected as a complex query and warm-transferred to billing with full context.',intent:'Report status · insurance claim query',sentiment:'Concerned → Reassured',disposition:'Partly resolved by AI · transferred',next:'Billing to resolve claim',handoff:'Warm transfer with context',duration:'1 min 30 sec'},
 kpis:[['Most','Routine queries — reports, timings, directions — resolved by AI'],['Zero repeats','Human agents receive full context on every transfer'],['100%','Calls transcribed, summarised and tagged by intent and sentiment']]}
];
const BENEFITS=[
 ['users','Reduced manual effort','Reminder, follow-up and feedback calls run automatically, freeing front-desk and call-centre staff for complex cases.'],
 ['heart','Better patient engagement','Every patient gets a timely, personal call — before visits, after missed appointments and after discharge.'],
 ['check','Higher appointment adherence','Reminders, instant rescheduling and next-day no-show follow-ups keep patients on their care plans and slots filled.'],
 ['gear','Operational efficiency','MedMantra HIS and CRM update in real time — no double entry, structured outcomes on every call.'],
 ['scale','Scales on demand','Hundreds of concurrent calls, 24×7, with consistent quality and a human handoff whenever needed.']
];
const RATE=.98;
const DEF={uc:0,accent:'en-IN',voice:'female'};
const st={...DEF};
const call={i:0,running:false,run:0,secs:0,timer:null,done:false};
let previewing=false;

function buildWave(el,n){for(let i=0;i<n;i++){const b=document.createElement('i');b.style.setProperty('--h',(5+Math.abs(Math.sin(i*.58)*19)+Math.abs(Math.cos(i*.19)*6))+'px');b.style.setProperty('--d',((i%9)*-.07)+'s');el.appendChild(b)}}
buildWave($('#wave'),76);buildWave($('#callWave'),40);
const setWave=on=>$$('.wave').forEach(w=>w.classList.toggle('playing',on));
const uc=()=>UC[st.uc];
const lang=()=>LANGS.find(l=>l.id===st.accent)||LANGS[0];
const opening=()=>{const L=lang();if(L.en)return uc().turns.find(t=>t.t==='a').text;return uc().dir==='Inbound'?L.in:L.out};

// client-facing polish
(()=>{
 const set=(sel,txt)=>{const e=document.querySelector(sel);if(e)e.textContent=txt};
 const tr=document.querySelector('.trust');if(tr)tr.innerHTML='<span>19 languages</span><span>HIS &amp; CRM integrated</span><span>Human handoff built in</span><span>Available 24×7</span>';
 set('.studio .foot','Best experienced in Chrome or Edge with sound on.');
 set('.note','Indicative outcomes. Actual results vary by hospital and deployment.');
 set('#presenterBtn','Focus mode');
 set('#resetBtn','↺ Restart demo');
 const ft=document.querySelector('footer');if(ft)ft.innerHTML='<span>© 2026 Apollo HealthAxis. All rights reserved.</span><span>Patient names, IDs and numbers shown are fictional.</span>';
 const css=document.createElement('style');
 css.textContent=`#ucGrid .usecase kbd{display:none}
#ucGrid .usecase .grip{opacity:0;transition:opacity .15s}
#ucGrid .usecase:hover .grip,#ucGrid .usecase:focus-visible .grip{opacity:1}
.navbtn#resetBtn{color:var(--muted,#5d6f78)}
footer{align-items:center}`;
 document.head.appendChild(css);
})();
// logo + question-first ask bar
(()=>{
 const brand=document.querySelector('.brand');
 if(brand)brand.innerHTML='<img class="brandlogo" src="logo.webp" alt="Apollo HealthAxis" width="129" height="72"><span class="brandsep"></span><span class="brandlbl">Voice AI Studio</span>';
 const ft=document.querySelector('footer');
 if(ft)ft.insertAdjacentHTML('afterbegin','<img class="footlogo" src="logo.webp" alt="Apollo HealthAxis" width="86" height="48">');
 const sub=document.querySelector('.hero .sub');
 if(sub)sub.insertAdjacentHTML('afterend',`<form class="ask" id="askForm" role="search" autocomplete="off"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="askInput" type="text" aria-label="Ask what the voice agent can do" placeholder="Ask what the agent can do — e.g. “follow up a missed appointment”"><button type="submit">Show me <span aria-hidden="true">→</span></button></form><div class="askchips" id="askChips"></div><div class="askans" id="askAns" aria-live="polite"></div>`);
 const css=document.createElement('style');
 css.textContent=`.brand{gap:14px}
.brandlogo{height:46px;width:auto;display:block}
.brandsep{width:1px;height:30px;background:var(--line,#e1e8f0)}
.brandlbl{font-size:12px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#5d6f78)}
.footlogo{height:34px;width:auto;margin-right:auto}
footer{gap:18px}
.ask{max-width:720px;margin:28px auto 0;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #d4e3ea;border-radius:999px;padding:7px 7px 7px 20px;box-shadow:0 14px 40px #02475b14;transition:border-color .15s,box-shadow .15s}
.ask:focus-within{border-color:var(--blue,#0087ba);box-shadow:0 0 0 4px #0087ba1f,0 14px 40px #02475b14}
.ask svg{width:20px;height:20px;color:var(--muted,#5d6f78);flex:0 0 20px}
.ask input{flex:1;min-width:0;border:0;outline:0;font:inherit;font-size:16px;color:var(--ink,#0b2530);background:transparent;padding:10px 0}
.ask button{border:0;border-radius:999px;background:var(--navy,#02475b);color:#fff;font-weight:700;font-size:14px;padding:12px 20px;cursor:pointer;white-space:nowrap}
.ask button:hover{background:#03617a}
.askchips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:820px;margin:14px auto 0}
.askchips button{border:1px solid var(--line,#e1e8f0);background:rgba(255,255,255,.85);border-radius:999px;padding:8px 14px;font-size:13px;color:#33505e;cursor:pointer}
.askchips button:hover{border-color:var(--blue,#0087ba);color:var(--blue,#0087ba)}
.askans{min-height:20px;margin-top:12px;font-size:13px;color:var(--muted,#5d6f78)}
.askans b{color:var(--navy,#02475b)}
@media(max-width:700px){.brandlogo{height:38px}.brandsep,.brandlbl{display:none}.ask{padding-left:14px}.ask button{padding:11px 14px}.ask input{font-size:15px}}`;
 document.head.appendChild(css);
})();
// build the scrollable language strip in place of the static accent row
(()=>{
 const css=document.createElement('style');
 css.textContent=`.accent-wrap{position:relative}
.accent-grid{display:flex!important;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:3px 3px 10px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.accent-grid::-webkit-scrollbar{height:6px}.accent-grid::-webkit-scrollbar-thumb{background:#cfdde6;border-radius:6px}
.accent-grid .accent{flex:0 0 206px;scroll-snap-align:start}
.accent-grid .accent[hidden]{display:none}
.lbadge{flex:0 0 32px;width:32px;height:32px;border-radius:9px;background:var(--sky,#e6f4f8);color:var(--blue,#0087ba);display:grid;place-items:center;font-size:17px;font-weight:700;line-height:1}
.lbadge.flag{background:transparent;font-size:22px}
.accent[aria-pressed="true"] .lbadge:not(.flag){background:var(--blue,#0087ba);color:#fff}
.scrollbtn{position:absolute;top:calc(50% - 5px);transform:translateY(-50%);z-index:2;width:34px;height:34px;border-radius:50%;border:1px solid var(--line,#e1e8f0);background:#fff;color:var(--navy,#02475b);font-size:20px;line-height:1;cursor:pointer;box-shadow:0 4px 14px #02475b22;display:grid;place-items:center}
.scrollbtn[hidden]{display:none}
.scrollbtn.prev{left:-12px}.scrollbtn.next{right:-12px}
.scrollbtn:hover{border-color:#8cc6db}
.lang-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.lang-tabs button{border:1px solid var(--line,#e1e8f0);background:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:650;color:#4a5a70;cursor:pointer}
.lang-tabs button:hover{border-color:#8cc6db}
.lang-tabs button[aria-pressed="true"]{background:var(--navy,#02475b);border-color:var(--navy,#02475b);color:#fff}
.lang-tabs b{font-weight:500;opacity:.7;margin-left:4px}
@media(max-width:700px){.accent-grid .accent{flex-basis:172px}.scrollbtn{display:none}}`;
 document.head.appendChild(css);
 const old=document.querySelector('.accent-grid');
 if(old&&!document.getElementById('langGrid')){
  const wrap=document.createElement('div');wrap.className='accent-wrap';
  wrap.innerHTML='<button class="scrollbtn prev" id="langPrev" aria-label="Scroll languages left">‹</button><div class="accent-grid" id="langGrid" role="group" aria-label="Choose language"></div><button class="scrollbtn next" id="langNext" aria-label="Scroll languages right">›</button>';
  old.replaceWith(wrap);
  const tabs=document.createElement('div');tabs.className='lang-tabs';tabs.id='langTabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Filter languages');
  wrap.parentElement.insertBefore(tabs,wrap);
  const head=wrap.parentElement.querySelector('.stephead');
  if(head){const h=head.querySelector('h2');if(h)h.lastChild.textContent="Choose the agent's language & voice";const hi=head.querySelector('.hint');if(hi)hi.textContent='Scroll for more languages →'}
 }
 const g=document.getElementById('guide');if(g)g.remove();
 document.querySelectorAll('a[href="#guide"]').forEach(a=>a.remove());
})();
// language strip
const langGrid=$('#langGrid');
let langFilter='all';
const GROUPS=[['all','All'],['en','English'],['in','Indian'],['intl','International']];
function renderTabs(){
 $('#langTabs').innerHTML=GROUPS.map(([g,n])=>`<button data-g="${g}" aria-pressed="${g===langFilter}">${n}<b>${g==='all'?LANGS.length:LANGS.filter(l=>l.g===g).length}</b></button>`).join('');
}
function applyFilter(){
 $$('#langGrid [data-accent]').forEach(b=>{const l=LANGS.find(x=>x.id===b.dataset.accent);b.hidden=!(langFilter==='all'||l.g===langFilter)});
 langGrid.scrollTo({left:0});setTimeout(updateArrows,50);
}
function renderLangs(){
 langGrid.innerHTML=LANGS.map(l=>`<button class="accent" data-accent="${l.id}" aria-pressed="${l.id===st.accent}"><span class="lbadge${l.en||l.flag?' flag':''}">${l.badge}</span><span><strong>${esc(l.name)}</strong><small${l.id==='ar'?' dir="rtl"':''}>${esc(l.sub)}</small></span></button>`).join('');
}
function updateArrows(){
 const max=langGrid.scrollWidth-langGrid.clientWidth-2;
 $('#langPrev').hidden=langGrid.scrollLeft<=2;
 $('#langNext').hidden=langGrid.scrollLeft>=max;
}
langGrid.addEventListener('click',e=>{
 const b=e.target.closest('[data-accent]');if(!b)return;
 st.accent=b.dataset.accent;
 $$('#langGrid [data-accent]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
 updateSub();
 const L=lang();
 $('#status').textContent=L.en?'':`${L.name} selected — play the preview to hear the opening line in ${L.name}. The full sample conversation plays in English.`;
});
$('#langTabs').addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;langFilter=b.dataset.g;renderTabs();applyFilter()});
langGrid.addEventListener('scroll',updateArrows,{passive:true});
window.addEventListener('resize',updateArrows);
$('#langPrev').addEventListener('click',()=>langGrid.scrollBy({left:-langGrid.clientWidth*.8,behavior:'smooth'}));
$('#langNext').addEventListener('click',()=>langGrid.scrollBy({left:langGrid.clientWidth*.8,behavior:'smooth'}));

function renderCards(){
 $('#ucGrid').innerHTML=UC.map((u,i)=>`<button class="usecase" data-i="${i}" aria-pressed="${i===st.uc}"><span class="uc-ico">${svg(u.icon)}</span><span class="uc-txt"><strong>${esc(u.title)}</strong><small>${esc(u.card)}</small></span><span class="tag">${u.dir}</span><kbd>${i+1}</kbd></button>`).join('');
 $$('#ucGrid .usecase').forEach(b=>b.addEventListener('click',()=>selectUC(+b.dataset.i)));
}
function updateSub(){$('#audioSub').textContent=`${lang().name} · ${st.voice==='female'?'Female':'Male'} voice · ${uc().agent} — ${uc().title}`}
function renderScenario(){
 const u=uc(),p=u.patient;
 $('#demoTitle').textContent=u.title;$('#demoTag').textContent=u.tagline;
 $('#demoChips').innerHTML=[`Agent: ${u.agent}`,...u.chips].map(c=>`<span class="chip">${esc(c)}</span>`).join('');
 $('#ptAvatar').textContent=p.name.split(' ').map(w=>w[0]).slice(0,2).join('');
 $('#ptName').textContent=p.name;$('#ptMeta').textContent=p.meta;
 $('#ptFields').innerHTML=p.fields.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
 $('#flow').innerHTML=u.steps.map((s,i)=>`<li><span class="dot">${i+1}</span>${esc(s)}</li>`).join('');
}
function renderValue(){
 $('#valueTitle').textContent=`What ${uc().title.toLowerCase()} delivers`;
 $('#kpis').innerHTML=uc().kpis.map(([v,l])=>`<div class="kpi"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
}
$('#benefits').innerHTML=BENEFITS.map(([ic,t,d])=>`<div class="benefit"><span class="bi">${svg(ic)}</span><b>${t}</b><p>${d}</p></div>`).join('');
function renderArch(){
 const used=new Set(['patient','telephony','agent']);uc().turns.forEach(t=>{if(t.t==='s'&&SRC[t.src])used.add(SRC[t.src])});
 $$('.node').forEach(n=>{const on=used.has(n.dataset.node);n.classList.toggle('on',on);n.classList.toggle('off',!on)});
 const names=[...used].map(k=>$(`.node[data-node="${k}"] b`).textContent);
 $('#archNote').textContent=`Systems in the "${uc().title}" demo: ${names.join(' · ')}`;
}
function ping(src){const k=SRC[src];if(!k)return;const n=$(`.node[data-node="${k}"]`);if(!n)return;n.classList.add('ping');setTimeout(()=>n.classList.remove('ping'),1100)}
function updateFlow(step){$$('#flow li').forEach((li,i)=>{li.classList.toggle('done',i<step);li.classList.toggle('active',i===step)})}
function setMood(m){const el=$('#mood');el.className='mood '+(m||'');el.textContent='Sentiment · '+(m?m[0].toUpperCase()+m.slice(1):'—')}
function setLive(on,txt){$('#live').classList.toggle('on',on);$('#liveTxt').textContent=txt}
function renderTimer(){const m=String(Math.floor(call.secs/60)).padStart(2,'0'),s=String(call.secs%60).padStart(2,'0');$('#timer').textContent=`${m}:${s}`}
function startTimer(){clearInterval(call.timer);call.timer=setInterval(()=>{call.secs++;renderTimer()},1000)}
function stopTimer(){clearInterval(call.timer)}
function emptyState(){$('#transcript').innerHTML=`<div class="empty"><b>Ready to start the call</b>Press <b style="display:inline">Play call</b> to run the full conversation with voice, or <b style="display:inline">Next line</b> to step through it while you narrate.</div>`}
function resetCall(){
 call.run++;call.running=false;call.i=0;call.secs=0;call.done=false;stopTimer();renderTimer();
 if('speechSynthesis'in window)speechSynthesis.cancel();setWave(false);
 emptyState();$('#intel').classList.remove('show');updateFlow(-1);setMood(null);setLive(false,'Ready');
 $('#playCall').textContent='▶ Play call';
}
function addTurn(t){
 const box=$('#transcript');const e=box.querySelector('.empty');if(e)e.remove();
 const d=document.createElement('div');
 if(t.t==='s'){d.className='event';d.innerHTML=`${svg('link',2)}<b>${esc(t.src)}</b><span>${esc(t.text)}</span>`;ping(t.src)}
 else{const who=t.t==='a'?`${uc().agent} · AI agent`:t.t==='h'?'Human agent · Billing':uc().patient.name;d.className='msg '+t.t;d.innerHTML=`<span class="who">${esc(who)}</span>${esc(t.text)}`}
 box.appendChild(d);box.scrollTop=box.scrollHeight;
}
function pickVoice(locale,gender){
 const voices=speechSynthesis.getVoices();
 const norm=v=>v.lang.replace('_','-').toLowerCase();
 const loc=locale.toLowerCase(),base=loc.split('-')[0];
 let c=voices.filter(v=>norm(v).startsWith(loc));
 if(!c.length)c=voices.filter(v=>norm(v).split('-')[0]===base);
 if(!c.length)return base==='en'?(voices.find(v=>norm(v).startsWith('en'))||null):null;
 const re=gender==='female'?/female|woman|samantha|zira|aria|jenny|heera|veena|neerja|kalpana|swara|libby|sonia|serena|shruti|pallavi|sobhna|aarohi|zariyah|monica|paulina|elvira|alice|elsa|isabella|kyoko|nanami|amelie|denise|anna|katja|luciana|francisca|tingting|xiaoxiao|milena|svetlana|salma/i:/\bmale\b|\bman\b|david|guy|mark|daniel|ravi|rishi|prabhat|hemant|ryan|thomas|arthur|madhur|mohan|valluvar|gagan|bashkar|manohar|hamed|jorge|alvaro|luca|diego|otoya|keita|thomas|henri|conrad|stefan|antonio|yunxi|kangkang|dmitry|pavel|maged/i;
 return c.find(v=>re.test(v.name))||c[0];
}
// loc: optional locale override (used for the translated preview)
function speak(text,role,loc){
 return new Promise(res=>{
  if(!('speechSynthesis'in window)){$('#status').textContent='Audio is not supported in this browser — the demo continues in text mode.';sleep(Math.min(4200,Math.max(1300,text.length*42))).then(res);return}
  const synth=speechSynthesis;synth.cancel();
  const u=new SpeechSynthesisUtterance(text);
  const L=lang();
  let locale=loc||(L.en?L.loc:'en-IN'),gender=st.voice,pitch=st.voice==='female'?1.06:.92;
  if(role==='p'){locale='en-IN';gender=uc().patient.gender==='F'?'female':'male';pitch=gender==='female'?1.18:.82}
  if(role==='h'){locale='en-IN';gender=st.voice==='female'?'male':'female';pitch=1}
  const v=pickVoice(locale,gender);
  if(v)u.voice=v;else if(loc)$('#status').textContent=`No ${L.name} voice is installed in this browser, so it may sound wrong. Microsoft Edge includes the widest set of voices.`;
  u.lang=locale;u.pitch=pitch;u.rate=RATE;
  let done=false,to=null;
  const end=()=>{if(done)return;done=true;clearTimeout(to);setWave(false);res()};
  to=setTimeout(end,text.length*110+4000);
  u.onstart=()=>setWave(true);u.onend=end;u.onerror=end;
  synth.speak(u);
 });
}
const spoken=t=>t.t!=='s'&&$('#audioOn').checked&&(t.t!=='p'||$('#patientAudio').checked);
function langNote(){const L=lang();if(!L.en)$('#status').textContent=`The full sample conversation plays in English. The preview plays the opening line in ${L.name}.`}
async function showTurn(t){
 updateFlow(t.step);addTurn(t);if(t.mood)setMood(t.mood);
 if(t.t==='s'){await sleep(850);return}
 if(spoken(t))await speak(t.text,t.t);else await sleep(Math.min(4200,Math.max(1300,t.text.length*42)));
 await sleep(250);
}
function pause(){
 call.running=false;call.run++;if('speechSynthesis'in window)speechSynthesis.cancel();setWave(false);stopTimer();
 setLive(false,'Paused');$('#playCall').textContent='▶ Resume call';
}
async function runCall(){
 if(call.running){pause();return}
 if(call.done)resetCall();
 if(previewing&&'speechSynthesis'in window)speechSynthesis.cancel();
 langNote();
 call.running=true;const my=++call.run;setLive(true,'Live call');$('#playCall').textContent='❚❚ Pause';startTimer();
 const turns=uc().turns;
 while(call.i<turns.length){if(my!==call.run||!call.running)return;await showTurn(turns[call.i++])}
 if(my===call.run&&call.running)finish();
}
function nextStep(){
 if(call.running)pause();
 if(call.done)resetCall();
 if(call.i===0)langNote();
 const turns=uc().turns;if(call.i>=turns.length){finish();return}
 const t=turns[call.i++];updateFlow(t.step);addTurn(t);if(t.mood)setMood(t.mood);
 call.secs+=t.t==='s'?1:Math.max(2,Math.round(t.text.length/15));renderTimer();
 setLive(false,'Step mode');
 if(spoken(t))speak(t.text,t.t);
 if(call.i>=turns.length)finish();
}
function finish(){
 call.done=true;call.running=false;stopTimer();updateFlow(uc().steps.length);setLive(false,'Call completed');
 $('#playCall').textContent='▶ Replay call';
 const x=uc().intel;$('#intelSummary').textContent=x.summary;
 $('#intelGrid').innerHTML=[['Intent',x.intent],['Sentiment',x.sentiment],['Disposition',x.disposition],['Next action',x.next],['Human handoff',x.handoff],['Call duration',x.duration]].map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join('');
 $('#intel').classList.add('show');$('#status').textContent='Call completed — post-call intelligence is ready.';
}
function selectUC(i){
 if(i<0||i>=UC.length)return;
 if(previewing&&'speechSynthesis'in window)speechSynthesis.cancel();
 st.uc=i;$$('#ucGrid .usecase').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.i===i)));
 renderScenario();resetCall();renderValue();renderArch();updateSub();$('#status').textContent='';
}
const PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
async function togglePreview(){
 const b=$('#playSample');
 if(previewing){speechSynthesis.cancel();return}
 if(call.running)pause();
 const L=lang();
 previewing=true;b.innerHTML=PAUSE;b.setAttribute('aria-label','Stop sample');$('#status').textContent=`Playing opening line in ${L.name}…`;
 await speak(opening(),'a',L.en?undefined:L.loc);
 previewing=false;b.innerHTML=PLAY;b.setAttribute('aria-label','Play opening line');
 if(!/No .* voice/.test($('#status').textContent))$('#status').textContent='Sample finished. Try another language or start the live demo.';
}
function resetDemo(){
 Object.assign(st,DEF);
 $$('#langGrid [data-accent]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.accent===st.accent)));
 langFilter='all';renderTabs();applyFilter();
 $('#voice').value=st.voice;$('#audioOn').checked=true;$('#patientAudio').checked=true;
 selectUC(0);window.scrollTo({top:0,behavior:'smooth'});
 $('#status').textContent='Demo reset — ready for the next audience.';
 $('#askInput').value='';$('#askAns').textContent='';
}
function togglePresenter(){
 const on=document.body.classList.toggle('presenter');$('#presenterBtn').setAttribute('aria-pressed',String(on));
 if(on)$('#demo').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#voice').addEventListener('change',e=>{st.voice=e.target.value;updateSub()});
$('#playSample').addEventListener('click',togglePreview);
$('#startDemo').addEventListener('click',()=>{$('#demo').scrollIntoView({behavior:'smooth',block:'start'});if(!call.running)setTimeout(()=>{if(call.done)resetCall();runCall()},450)});
$('#playCall').addEventListener('click',runCall);
$('#nextStep').addEventListener('click',nextStep);
$('#restartCall').addEventListener('click',resetCall);
$('#resetBtn').addEventListener('click',resetDemo);
$('#presenterBtn').addEventListener('click',togglePresenter);
document.addEventListener('keydown',e=>{
 if(e.target.closest('select,input,textarea')||e.metaKey||e.ctrlKey||e.altKey)return;
 const k=e.key.toLowerCase();
 if(k>='1'&&k<='6')selectUC(+k-1);
 else if(k===' '){if(e.target.tagName==='BUTTON')return;e.preventDefault();runCall()}
 else if(k==='n')nextStep();
 else if(k==='r')resetCall();
 else if(k==='p')togglePresenter();
});
// ask bar routing
const ASK_KEYS=[
 ['booking',/\b(book|booking|reschedul\w*|new appointment|move (my|the|an)? ?appointment|slot|consult)/i],
 ['reminders',/\b(remind\w*|cancel\w*|day before|waitlist|confirm attendance)/i],
 ['prohealth',/\b(prohealth|health ?check|check-?up|fasting|preventive)/i],
 ['noshow',/\b(no[- ]?show|missed|did ?n.?t (come|turn up|show)|skipped)/i],
 ['engagement',/\b(discharg\w*|after surgery|post[- ]?op|feedback|rating|nps|medication|recovery|follow[- ]?up after)/i],
 ['support',/\b(support|report|lab|bill\w*|insurance|claim|human|agent|transfer|handoff|hand off|query|complaint)/i]
];
const ASK_CHIPS=['Reschedule a cardiology appointment','Remind patients about tomorrow’s visits','Prepare a patient for a ProHealth check-up','Follow up a missed appointment','Check on a patient after discharge','Hand a billing query to a human','Greet a caller in Telugu'];
function routeAsk(q){
 q=(q||'').trim();if(!q)return;
 let best=null,score=0;
 ASK_KEYS.forEach(([id,re])=>{const m=q.match(new RegExp(re.source,'gi'));const n=m?m.length:0;if(n>score){score=n;best=id}});
 const L=LANGS.find(l=>!l.en&&new RegExp('\\b'+l.name+'\\b','i').test(q));
 if(L){st.accent=L.id;langFilter='all';renderTabs();applyFilter();$$('#langGrid [data-accent]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.accent===L.id)));updateSub()}
 if(!best&&L){$('#askAns').innerHTML=`Playing the opening line in <b>${esc(L.name)}</b>.`;$('#preview').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{if(!previewing)togglePreview()},500);return}
 const i=Math.max(0,UC.findIndex(u=>u.id===(best||'booking')));
 selectUC(i);
 $('#askAns').innerHTML=best?`Showing <b>${esc(UC[i].title)}</b> — starting the live call…`:`Here’s a good place to start: <b>${esc(UC[i].title)}</b>.`;
 $('#demo').scrollIntoView({behavior:'smooth',block:'start'});
 setTimeout(()=>{if(!call.running)runCall()},600);
}
$('#askChips').innerHTML=ASK_CHIPS.map(c=>`<button type="button">${esc(c)}</button>`).join('');
$('#askChips').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('#askInput').value=b.textContent;routeAsk(b.textContent)});
$('#askForm').addEventListener('submit',e=>{e.preventDefault();routeAsk($('#askInput').value)});
if('speechSynthesis'in window){speechSynthesis.getVoices()}
renderTabs();renderLangs();renderCards();selectUC(0);updateArrows();
})();
