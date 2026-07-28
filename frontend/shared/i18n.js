// ============================================================
// DYNAMIC TRANSLATION ENGINE v2
// Uses Google Translate unofficial endpoint (most accurate)
// Falls back to hardcoded verified translations
// Caches in localStorage for instant repeat switching
// ============================================================

const TranslationEngine = (() => {

  // ── Verified, accurate hardcoded translations ─────────────
  // These are manually verified correct translations
  // Used as primary source - no API needed for these
  const TRANSLATIONS = {
    ta: {
      // Login
      'Ration Shop Portal': 'ரேஷன் கடை போர்டல்',
      'Access your ration card details, monthly quota, stock status, and alerts from your assigned shop.': 'உங்கள் ரேஷன் அட்டை விவரங்கள், மாத ஒதுக்கீடு, இருப்பு நிலை மற்றும் அறிவிப்புகளை உங்கள் கடையிலிருந்து பார்க்கலாம்.',
      'Beneficiary Login': 'பயனாளர் உள்நுழைவு',
      'Enter your ration card details to receive OTP': 'OTP பெற உங்கள் ரேஷன் அட்டை விவரங்களை உள்ளிடவும்',
      'Ration Card Number': 'ரேஷன் அட்டை எண்',
      'Mobile Number': 'மொபைல் எண்',
      'Send OTP': 'OTP அனுப்பு',
      'Verify OTP': 'OTP சரிபார்க்கவும்',
      'Enter the 6-digit OTP sent to your mobile': 'உங்கள் மொபைலுக்கு அனுப்பப்பட்ட 6 இலக்க OTP ஐ உள்ளிடவும்',
      'Verify & Login': 'சரிபார்த்து உள்நுழைக',
      'Back': 'திரும்பு',
      'Staff / Admin Login': 'ஊழியர் / நிர்வாக உள்நுழைவு',
      // Navigation
      'Dashboard': 'முகப்பு',
      'Monthly Quota': 'மாத ஒதுக்கீடு',
      'Alerts': 'அறிவிப்புகள்',
      'Feedback': 'கருத்து',
      'Feedback & Support': 'கருத்து மற்றும் ஆதரவு',
      'Logout': 'வெளியேறு',
      // Shop
      'OPEN': 'திறந்துள்ளது',
      'CLOSED': 'மூடியுள்ளது',
      // Stock
      "Today's Ration Status": 'இன்றைய ரேஷன் நிலை',
      'Available': 'கிடைக்கும்',
      'Limited': 'குறைவாக உள்ளது',
      'Out of Stock': 'இல்லை',
      'Loading stock...': 'ஏற்றுகிறது...',
      'No stock updates available': 'இருப்பு தகவல் இல்லை',
      // Levels
      'High': 'அதிகமாக',
      'Medium': 'நடுத்தரமாக',
      'Low': 'குறைவாக',
      'Stock Level': 'இருப்பு அளவு',
      'Last Updated': 'கடைசியாக புதுப்பிக்கப்பட்டது',
      'Monthly quota': 'மாத ஒதுக்கீடு',
      // Monthly
      'Loading...': 'ஏற்றுகிறது...',
      'Distribution for this month has started. Visit your ration shop.': 'இந்த மாத விநியோகம் தொடங்கியது. உங்கள் ரேஷன் கடையை பார்வையிடவும்.',
      'Reminder: Collect your ration before end of month.': 'நினைவூட்டல்: மாத இறுதிக்கு முன் உங்கள் ரேஷனை பெற்றுக்கொள்ளவும்.',
      'No quota data available': 'ஒதுக்கீடு தகவல் இல்லை',
      // Alerts
      'No updates yet': 'புதுப்பிப்புகள் இல்லை',
      'Loading notifications...': 'அறிவிப்புகள் ஏற்றுகிறது...',
      // Feedback
      'Issue Type': 'பிரச்சனை வகை',
      'Select an issue': 'ஒரு பிரச்சனையை தேர்வு செய்யவும்',
      'Complaint': 'புகார்',
      'Suggestion': 'பரிந்துரை',
      'Appreciation': 'பாராட்டு',
      'Inquiry': 'விசாரணை',
      'Rate your Ration Shop': 'உங்கள் ரேஷன் கடையை மதிப்பிடுங்கள்',
      'Comments (optional)': 'கருத்துகள் (விரும்பினால்)',
      'Write your feedback here...': 'உங்கள் கருத்தை இங்கே எழுதுங்கள்...',
      'Submit Feedback': 'கருத்தை சமர்ப்பிக்கவும்',
      // Collection
      'Ration Collection Confirmation': 'ரேஷன் பெறல் உறுதிப்படுத்தல்',
      'Did you receive your ration today?': 'இன்று உங்கள் ரேஷன் கிடைத்ததா?',
      'Full Received': 'முழுமையாக பெற்றேன்',
      'Partial Received': 'பகுதியாக பெற்றேன்',
      'Not Received': 'கிடைக்கவில்லை',
      'Submit': 'சமர்ப்பி',
      // Stock detail
      'Newly Arrived — Visit your ration shop today!': 'புதிதாக வந்துள்ளது — இன்று உங்கள் ரேஷன் கடையை பார்வையிடவும்!',
      // Voice
      'Voice Assistant': 'குரல் உதவியாளர்',
      'What would you like to know?': 'நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?',
      'Stock Status': 'இருப்பு நிலை',
      'Shop Status': 'கடை நிலை',
      'Last Notification': 'கடைசி அறிவிப்பு',
      // Messages
      'Please fill all fields': 'அனைத்து புலங்களையும் நிரப்பவும்',
      'Enter valid 10-digit mobile number': 'சரியான 10 இலக்க மொபைல் எண் உள்ளிடவும்',
      'Enter all 6 digits': 'அனைத்து 6 இலக்கங்களையும் உள்ளிடவும்',
      'OTP sent successfully!': 'OTP வெற்றிகரமாக அனுப்பப்பட்டது!',
      'Login successful!': 'உள்நுழைவு வெற்றிகரமாக முடிந்தது!',
      'Verifying...': 'சரிபார்க்கிறது...',
      'Sending...': 'அனுப்புகிறது...',
      'Feedback submitted!': 'கருத்து சமர்ப்பிக்கப்பட்டது!',
      'Please write a message': 'ஒரு செய்தி எழுதவும்',
      'Collection status saved': 'பெறல் நிலை சேமிக்கப்பட்டது',
      'Voice not supported': 'குரல் ஆதரிக்கப்படவில்லை',
      // Stock items
      'Rice': 'அரிசி',
      'Wheat': 'கோதுமை',
      'Sugar': 'சர்க்கரை',
      'Kerosene': 'மண்ணெண்ணெய்',
      'Dal': 'பருப்பு',
      'Palm Oil': 'பாமாயில்',
      'Salt': 'உப்பு',
      'Oil': 'எண்ணெய்',
    },
    hi: {
      // Login
      'Ration Shop Portal': 'राशन दुकान पोर्टल',
      'Access your ration card details, monthly quota, stock status, and alerts from your assigned shop.': 'अपने राशन कार्ड विवरण, मासिक कोटा, स्टॉक स्थिति और अलर्ट अपनी दुकान से देखें।',
      'Beneficiary Login': 'लाभार्थी लॉगिन',
      'Enter your ration card details to receive OTP': 'OTP प्राप्त करने के लिए अपना राशन कार्ड विवरण दर्ज करें',
      'Ration Card Number': 'राशन कार्ड नंबर',
      'Mobile Number': 'मोबाइल नंबर',
      'Send OTP': 'OTP भेजें',
      'Verify OTP': 'OTP सत्यापित करें',
      'Enter the 6-digit OTP sent to your mobile': 'अपने मोबाइल पर भेजा गया 6 अंकों का OTP दर्ज करें',
      'Verify & Login': 'सत्यापित करें और लॉगिन करें',
      'Back': 'वापस',
      'Staff / Admin Login': 'कर्मचारी / व्यवस्थापक लॉगिन',
      // Navigation
      'Dashboard': 'डैशबोर्ड',
      'Monthly Quota': 'मासिक कोटा',
      'Alerts': 'सूचनाएं',
      'Feedback': 'प्रतिक्रिया',
      'Feedback & Support': 'प्रतिक्रिया और सहायता',
      'Logout': 'लॉग आउट',
      // Shop
      'OPEN': 'खुला है',
      'CLOSED': 'बंद है',
      // Stock
      "Today's Ration Status": 'आज की राशन स्थिति',
      'Available': 'उपलब्ध है',
      'Limited': 'सीमित है',
      'Out of Stock': 'स्टॉक नहीं है',
      'Loading stock...': 'लोड हो रहा है...',
      'No stock updates available': 'कोई स्टॉक जानकारी नहीं',
      // Levels
      'High': 'अधिक है',
      'Medium': 'मध्यम है',
      'Low': 'कम है',
      'Stock Level': 'स्टॉक स्तर',
      'Last Updated': 'अंतिम अपडेट',
      'Monthly quota': 'मासिक कोटा',
      // Monthly
      'Loading...': 'लोड हो रहा है...',
      'Distribution for this month has started. Visit your ration shop.': 'इस महीने का वितरण शुरू हो गया है। अपनी राशन दुकान पर जाएं।',
      'Reminder: Collect your ration before end of month.': 'याद दिलाना: महीने के अंत से पहले अपना राशन ले लें।',
      'No quota data available': 'कोई कोटा जानकारी नहीं',
      // Alerts
      'No updates yet': 'अभी तक कोई अपडेट नहीं',
      'Loading notifications...': 'सूचनाएं लोड हो रही हैं...',
      // Feedback
      'Issue Type': 'समस्या का प्रकार',
      'Select an issue': 'एक समस्या चुनें',
      'Complaint': 'शिकायत',
      'Suggestion': 'सुझाव',
      'Appreciation': 'प्रशंसा',
      'Inquiry': 'जांच',
      'Rate your Ration Shop': 'अपनी राशन दुकान को रेट करें',
      'Comments (optional)': 'टिप्पणियां (वैकल्पिक)',
      'Write your feedback here...': 'यहां अपनी प्रतिक्रिया लिखें...',
      'Submit Feedback': 'प्रतिक्रिया सबमिट करें',
      // Collection
      'Ration Collection Confirmation': 'राशन संग्रह की पुष्टि',
      'Did you receive your ration today?': 'क्या आपको आज राशन मिला?',
      'Full Received': 'पूरा मिल गया',
      'Partial Received': 'आंशिक मिला',
      'Not Received': 'नहीं मिला',
      'Submit': 'जमा करें',
      // Stock detail
      'Newly Arrived — Visit your ration shop today!': 'नया आया है — आज अपनी राशन दुकान पर जाएं!',
      // Voice
      'Voice Assistant': 'आवाज सहायक',
      'What would you like to know?': 'आप क्या जानना चाहते हैं?',
      'Stock Status': 'स्टॉक की स्थिति',
      'Shop Status': 'दुकान की स्थिति',
      'Last Notification': 'अंतिम सूचना',
      // Messages
      'Please fill all fields': 'सभी फ़ील्ड भरें',
      'Enter valid 10-digit mobile number': 'सही 10 अंकों का मोबाइल नंबर दर्ज करें',
      'Enter all 6 digits': 'सभी 6 अंक दर्ज करें',
      'OTP sent successfully!': 'OTP सफलतापूर्वक भेजा गया!',
      'Login successful!': 'लॉगिन सफल रहा!',
      'Verifying...': 'सत्यापित हो रहा है...',
      'Sending...': 'भेजा जा रहा है...',
      'Feedback submitted!': 'प्रतिक्रिया सबमिट हुई!',
      'Please write a message': 'कृपया एक संदेश लिखें',
      'Collection status saved': 'संग्रह स्थिति सहेजी गई',
      'Voice not supported': 'आवाज समर्थित नहीं है',
      // Stock items
      'Rice': 'चावल',
      'Wheat': 'गेहूं',
      'Sugar': 'चीनी',
      'Kerosene': 'मिट्टी का तेल',
      'Dal': 'दाल',
      'Palm Oil': 'पाम तेल',
      'Salt': 'नमक',
      'Oil': 'तेल',
    }
  };

  // ── TTS sentence builders per language ───────────────────
  const TTS_BUILDERS = {
    en: {
      stock: (data) => {
        if (!data.stockData.length) return 'No stock data available.';
        return 'Stock status: ' + data.stockData.map(s =>
          s.item_name + ' is ' + s.status.replace(/_/g,' ')
        ).join(', ') + '.';
      },
      shop: (data) => {
        if (!data.shopData) return 'Shop information not available.';
        return `${data.shopData.shop_name} is currently ${data.shopData.is_open ? 'open' : 'closed'}. Shop hours are ${formatTime(data.shopData.opening_time)} to ${formatTime(data.shopData.closing_time)}.`;
      },
      quota: (data) => {
        const qKey = ((data.user?.card_type)||'bpl').toLowerCase()+'_quota';
        if (!data.quotaData.length) return 'No quota data available.';
        return 'Your monthly quota is: ' + data.quotaData.map(q => q.item_name + ' ' + (q[qKey]||0) + ' ' + q.unit).join(', ') + '.';
      },
      updated: (data) => data.stockData[0] ? 'Stock was last updated ' + timeAgo(data.stockData[0].updated_at) + '.' : 'No update information.',
      notif: (data) => data.notifData[0] ? 'Latest notification: ' + data.notifData[0].title + '. ' + data.notifData[0].message : 'No recent notifications.',
    },
    ta: {
      stock: (data) => {
        if (!data.stockData.length) return 'இருப்பு தகவல் இல்லை.';
        const names = data.stockData.map(s => {
          const name = TRANSLATIONS.ta[s.item_name] || s.item_name;
          const status = s.status === 'available' ? 'கிடைக்கும்' : s.status === 'limited' ? 'குறைவாக உள்ளது' : 'இல்லை';
          return name + ' ' + status;
        });
        return 'இருப்பு நிலை: ' + names.join(', ') + '.';
      },
      shop: (data) => {
        if (!data.shopData) return 'கடை தகவல் இல்லை.';
        const status = data.shopData.is_open ? 'திறந்துள்ளது' : 'மூடியுள்ளது';
        return `${data.shopData.shop_name} தற்போது ${status}. கடை நேரம் ${formatTime(data.shopData.opening_time)} முதல் ${formatTime(data.shopData.closing_time)} வரை.`;
      },
      quota: (data) => {
        const qKey = ((data.user?.card_type)||'bpl').toLowerCase()+'_quota';
        if (!data.quotaData.length) return 'ஒதுக்கீடு தகவல் இல்லை.';
        const items = data.quotaData.map(q => (TRANSLATIONS.ta[q.item_name]||q.item_name) + ' ' + (q[qKey]||0) + ' ' + q.unit);
        return 'உங்கள் மாத ஒதுக்கீடு: ' + items.join(', ') + '.';
      },
      updated: (data) => data.stockData[0] ? 'கடைசியாக புதுப்பிக்கப்பட்டது ' + timeAgo(data.stockData[0].updated_at) + '.' : 'புதுப்பிப்பு தகவல் இல்லை.',
      notif: (data) => data.notifData[0] ? 'கடைசி அறிவிப்பு: ' + data.notifData[0].title + '. ' + data.notifData[0].message : 'சமீபத்திய அறிவிப்புகள் இல்லை.',
    },
    hi: {
      stock: (data) => {
        if (!data.stockData.length) return 'कोई स्टॉक जानकारी नहीं।';
        const names = data.stockData.map(s => {
          const name = TRANSLATIONS.hi[s.item_name] || s.item_name;
          const status = s.status === 'available' ? 'उपलब्ध है' : s.status === 'limited' ? 'सीमित है' : 'स्टॉक नहीं है';
          return name + ' ' + status;
        });
        return 'स्टॉक की स्थिति: ' + names.join(', ') + '.';
      },
      shop: (data) => {
        if (!data.shopData) return 'दुकान की जानकारी उपलब्ध नहीं।';
        const status = data.shopData.is_open ? 'खुली है' : 'बंद है';
        return `${data.shopData.shop_name} अभी ${status}। दुकान का समय ${formatTime(data.shopData.opening_time)} से ${formatTime(data.shopData.closing_time)} तक है।`;
      },
      quota: (data) => {
        const qKey = ((data.user?.card_type)||'bpl').toLowerCase()+'_quota';
        if (!data.quotaData.length) return 'कोई कोटा जानकारी नहीं।';
        const items = data.quotaData.map(q => (TRANSLATIONS.hi[q.item_name]||q.item_name) + ' ' + (q[qKey]||0) + ' ' + q.unit);
        return 'आपका मासिक कोटा: ' + items.join(', ') + '.';
      },
      updated: (data) => data.stockData[0] ? 'स्टॉक अंतिम बार ' + timeAgo(data.stockData[0].updated_at) + ' अपडेट हुआ।' : 'अपडेट जानकारी उपलब्ध नहीं।',
      notif: (data) => data.notifData[0] ? 'अंतिम सूचना: ' + data.notifData[0].title + '. ' + data.notifData[0].message : 'कोई हालिया सूचना नहीं।',
    }
  };

  // ── Also translate dynamic content via Google Translate ──
  // Uses Google's unofficial translate endpoint
  async function googleTranslate(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    // Check memory cache first
    const cacheKey = targetLang + ':' + text;
    if (dynamicCache[cacheKey]) return dynamicCache[cacheKey];
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      // Google returns nested array: [[["translated","original",...],...],...]
      const translated = data[0]?.map(x => x[0]).join('') || text;
      dynamicCache[cacheKey] = translated;
      return translated;
    } catch {
      return text; // fallback to original if API fails
    }
  }

  let dynamicCache = {};
  let currentLang = 'en';
  const LANG_KEY = 'ration_lang';

  // ── Main translate function (uses hardcoded first) ───────
  function t(key) {
    if (currentLang === 'en') return key;
    return TRANSLATIONS[currentLang]?.[key] || key;
  }

  // ── Apply to DOM ──────────────────────────────────────────
  function applyToDOM() {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      const translated = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    });
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-translate-placeholder'));
    });
    document.querySelectorAll('[data-translate-option]').forEach(el => {
      el.textContent = t(el.getAttribute('data-translate-option'));
    });
    // Update html lang attribute for correct font rendering
    document.documentElement.lang = currentLang === 'ta' ? 'ta' : currentLang === 'hi' ? 'hi' : 'en';
  }

  // ── Translate dynamic content (stock names etc.) ─────────
  async function translateDynamic(text) {
    if (currentLang === 'en') return text;
    // Check hardcoded translations first (most accurate)
    if (TRANSLATIONS[currentLang]?.[text]) {
      return TRANSLATIONS[currentLang][text];
    }
    // Fall back to Google Translate for unknown items
    return await googleTranslate(text, currentLang);
  }

  // ── Set language ─────────────────────────────────────────
  function setLanguage(lang, onComplete) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    dynamicCache = {}; // clear dynamic cache on lang change
    applyToDOM();
    if (onComplete) onComplete(lang);
  }

  // ── Build TTS text in correct language ───────────────────
  function buildTTSText(type, data) {
    const lang = currentLang;
    const builder = TTS_BUILDERS[lang]?.[type] || TTS_BUILDERS.en[type];
    const text = builder(data);
    const langCode = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    return { text, lang: langCode };
  }

  // ── Get current language ─────────────────────────────────
  function getLang() { return currentLang; }

  // ── Init ─────────────────────────────────────────────────
  function init(onReady) {
    const saved = localStorage.getItem(LANG_KEY) || 'en';
    setLanguage(saved, onReady);
  }

  return { setLanguage, t, translateDynamic, applyToDOM, buildTTSText, getLang, init };
})();

// ── Helper functions ──────────────────────────────────────
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h), ap = hr >= 12 ? 'PM' : 'AM';
  return `${hr % 12 || 12}:${m} ${ap}`;
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const days = Math.floor(h / 24);
  return days === 1 ? 'Yesterday' : days + 'd ago';
}
