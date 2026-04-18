import { Camera, Leaf } from 'lucide-react';
import './HomeScreen.css';

function HomeScreen({ onUpload, language }) {
  const greetings = {
    en: 'Welcome Farmer',
    hi: 'स्वागत है किसान',
    kn: 'ಸ್ವಾಗತ ರೈತರೇ',
    ta: 'வரவேற்கிறோம் விவசாயி',
    te: 'స్వాగతం రైతు',
    mr: 'स्वागत शेतकरी',
    bn: 'স্বাগতম কৃষক',
    gu: 'સ્વાગત છે ખેડૂત',
    pa: 'ਸੁਆਗਤ ਹੈ ਕਿਸਾਨ',
    ml: 'സ്വാഗതം കർഷകൻ',
    or: 'ସ୍ୱାଗତ କୃଷକ',
    as: 'স্বাগতম কৃষক'
  };

  const subtitles = {
    en: 'Analyze your soil and get expert farming advice',
    hi: 'अपनी मिट्टी का विश्लेषण करें और सलाह प्राप्त करें',
    kn: 'ನಿಮ್ಮ ಮಣ್ಣನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ಸಲಹೆ ಪಡೆಯಿರಿ',
    ta: 'உங்கள் மண்ணை பகுப்பாய்வு செய்து ஆலோசனை பெறுங்கள்',
    te: 'మీ మట్టిని విశ్లేషించండి మరియు సలహా పొందండి',
    mr: 'आपल्या मातीचे विश्लेषण करा आणि सल्ला घ्या',
    bn: 'আপনার মাটি বিশ্লেষণ করুন এবং পরামর্শ পান',
    gu: 'તમારી માટીનું વિશ્લેષણ કરો અને સલાહ મેળવો',
    pa: 'ਆਪਣੀ ਮਿੱਟੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ ਅਤੇ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ',
    ml: 'നിങ്ങളുടെ മണ്ണ് വിശകലനം ചെയ്ത് ഉപദേശം നേടുക',
    or: 'ଆପଣଙ୍କ ମାଟିର ବିଶ୍ଳେଷଣ କରନ୍ତୁ ଏବଂ ପରାମର୍ଶ ପାଆନ୍ତୁ',
    as: 'আপোনাৰ মাটি বিশ্লেষণ কৰক আৰু পৰামৰ্শ লওক'
  };

  const buttonTexts = {
    en: 'Analyze Soil',
    hi: 'मिट्टी का विश्लेषण करें',
    kn: 'ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ',
    ta: 'மண் பகுப்பாய்வு',
    te: 'మట్టి విశ్లేషణ',
    mr: 'माती विश्लेषण',
    bn: 'মাটি বিশ্লেষণ',
    gu: 'માટી વિશ્લેષણ',
    pa: 'ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਣ',
    ml: 'മണ്ണ് വിശകലനം',
    or: 'ମାଟି ବିଶ୍ଳେଷଣ',
    as: 'মাটি বিশ্লেষণ'
  };

  return (
    <div className="screen home-screen animate-fade-in">
      <div className="hero-section text-center">
        <div className="hero-badge glass-panel">
          <Leaf className="hero-icon" size={24} />
          <span>{
            { en: 'SITA AI', hi: 'सीता AI', kn: 'ಸೀತಾ AI', ta: 'சீதா AI',
              te: 'సీత AI', mr: 'सीता AI', bn: 'সীতা AI', gu: 'સીતા AI',
              pa: 'ਸੀਤਾ AI', ml: 'സീത AI', or: 'ସୀତା AI', as: 'সীতা AI'
            }[language] || 'SITA AI'
          }</span>
        </div>
        <h1 className="hero-title text-gradient">{greetings[language]}</h1>
        <p className="hero-subtitle">{subtitles[language]}</p>
      </div>

      <div className="action-card-wrapper animate-float">
        <div className="glass-card main-action-card">
          <div className="action-icon-bg">
            <Camera size={48} strokeWidth={1.5} className="text-primary" />
          </div>
          <button className="btn btn-primary btn-large mt-6" onClick={onUpload}>
            <Camera size={20} />
            <span>{buttonTexts[language]}</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default HomeScreen;
