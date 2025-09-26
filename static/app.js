// Initialize map variable
let map = null;
let userMarker = null;
let hospitalMarkers = [];

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    
    // Smooth scroll for navigation links
    // Basic i18n map for EN/HI/OR
    const translations = {
        en: {
            app_name: 'Healthcare AI Bot',
            nav_features: 'Features',
            nav_test_bot: 'Test Bot',
            nav_alerts: 'Alerts',
            nav_hospitals: 'Nearby Hospitals',
            hero_title: 'AI-Powered Healthcare Assistant',
            hero_desc: 'Accessible healthcare information in your local language. Get instant guidance on symptoms, prevention, and vaccination schedules.',
            test_bot_title: 'Test the Chatbot',
            welcome_msg: "Hello! I'm your healthcare assistant. I can help you with symptoms, prevention tips, and vaccination schedules. What would you like to know?",
            chat_placeholder: 'Type your health question...',
            btn_send: 'Send',
            nearby_hospitals_title: 'Nearby Hospitals',
            btn_location: 'Get My Location',
            features_title: 'Features',
            feat_multi_title: 'Multi-Language Support',
            feat_multi_desc: 'Get healthcare information in your preferred language',
            feat_symptom_title: 'Symptom Analysis',
            feat_symptom_desc: 'Quick assessment of your symptoms with AI-powered insights',
            feat_prev_title: 'Prevention Tips',
            feat_prev_desc: 'Stay healthy with personalized prevention recommendations',
            feat_vax_title: 'Vaccination Schedule',
            feat_vax_desc: 'Keep track of important vaccinations and immunizations',
            feat_hosp_title: 'Hospital Locator',
            feat_hosp_desc: 'Find nearby hospitals and healthcare facilities instantly',
            feat_247_title: '24/7 Availability',
            feat_247_desc: 'Get healthcare guidance anytime, anywhere',
            footer_copy: '© 2024 Healthcare AI Bot. All rights reserved.',
            footer_privacy: 'Privacy Policy',
            footer_terms: 'Terms of Service',
            footer_contact: 'Contact'
        },
        hi: {
            app_name: 'हेल्थकेयर एआई बॉट',
            nav_features: 'विशेषताएँ',
            nav_test_bot: 'बॉट आज़माएँ',
            nav_alerts: 'चेतावनियाँ',
            nav_hospitals: 'नज़दीकी अस्पताल',
            hero_title: 'एआई-संचालित स्वास्थ्य सहायक',
            hero_desc: 'अपनी स्थानीय भाषा में स्वास्थ्य जानकारी प्राप्त करें। लक्षण, रोकथाम और टीकाकरण पर त्वरित मार्गदर्शन।',
            test_bot_title: 'चैटबॉट आज़माएँ',
            welcome_msg: 'नमस्ते! मैं आपका स्वास्थ्य सहायक हूँ। मैं लक्षण, रोकथाम टिप्स और टीकाकरण शेड्यूल में आपकी मदद कर सकता हूँ। आप क्या जानना चाहते हैं?',
            chat_placeholder: 'अपना स्वास्थ्य प्रश्न लिखें...',
            btn_send: 'भेजें',
            nearby_hospitals_title: 'नज़दीकी अस्पताल',
            btn_location: 'मेरी लोकेशन प्राप्त करें',
            features_title: 'विशेषताएँ',
            feat_multi_title: 'बहुभाषी समर्थन',
            feat_multi_desc: 'अपनी पसंदीदा भाषा में स्वास्थ्य जानकारी प्राप्त करें',
            feat_symptom_title: 'लक्षण विश्लेषण',
            feat_symptom_desc: 'एआई-समर्थित अंतर्दृष्टि के साथ तेज़ आकलन',
            feat_prev_title: 'रोकथाम सुझाव',
            feat_prev_desc: 'व्यक्तिगत सिफारिशों के साथ स्वस्थ रहें',
            feat_vax_title: 'टीकाकरण कार्यक्रम',
            feat_vax_desc: 'महत्वपूर्ण टीकाकरण का ध्यान रखें',
            feat_hosp_title: 'अस्पताल लोकेटर',
            feat_hosp_desc: 'नज़दीकी अस्पताल और सुविधाएँ तुरंत खोजें',
            feat_247_title: '24/7 उपलब्ध',
            feat_247_desc: 'कभी भी, कहीं भी स्वास्थ्य मार्गदर्शन',
            footer_copy: '© 2024 हेल्थकेयर एआई बॉट. सर्वाधिकार सुरक्षित.',
            footer_privacy: 'गोपनीयता नीति',
            footer_terms: 'सेवा की शर्तें',
            footer_contact: 'संपर्क'
        },
        or: {
            app_name: 'ହେଲ୍ଥକେୟାର୍ ଏଆଇ ବଟ୍',
            nav_features: 'ବିଶେଷତା',
            nav_test_bot: 'ବଟ୍ ପରୀକ୍ଷାନ୍ତୁ',
            nav_alerts: 'ସତର୍କତା',
            nav_hospitals: 'ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍',
            hero_title: 'ଏଆଇ ଆଧାରିତ ହେଲ୍ଥ ସହାୟକ',
            hero_desc: 'ଆପଣଙ୍କ ଭାଷାରେ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା। ଲକ୍ଷଣ, ପ୍ରତିରୋଧ ଏବଂ ଟୀକାକରଣରେ ତତ୍କ୍ଷଣାତ୍ ମଦଦ।',
            test_bot_title: 'ଚାଟବଟ୍ ପରୀକ୍ଷାନ୍ତୁ',
            welcome_msg: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ହେଲ୍ଥ ସହାୟକ। ଲକ୍ଷଣ, ପ୍ରତିରୋଧ ଟିପ୍ସ ଏବଂ ଟୀକାକରଣ ସମ୍ବନ୍ଧୀୟ ସହଯୋଗ କରିପାରିବି। କଣ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି?',
            chat_placeholder: 'ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ...',
            btn_send: 'ପଠାନ୍ତୁ',
            nearby_hospitals_title: 'ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍',
            btn_location: 'ମୋ ଲୋକେସନ୍ ନିଅନ୍ତୁ',
            features_title: 'ବିଶେଷତା',
            feat_multi_title: 'ବହୁଭାଷୀ ସମର୍ଥନ',
            feat_multi_desc: 'ଆପଣଙ୍କ ପସନ୍ଦର ଭାଷାରେ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା',
            feat_symptom_title: 'ଲକ୍ଷଣ ବିଶ୍ଳେଷଣ',
            feat_symptom_desc: 'ଏଆଇ ଆଧାରିତ ତଥ୍ୟ ସହ ତ୍ୱରିତ ମୂଲ୍ୟାୟନ',
            feat_prev_title: 'ପ୍ରତିରୋଧ ସୁପାରିଶ',
            feat_prev_desc: 'ବ୍ୟକ୍ତିଗତ ପରାମର୍ଶ ସହିତ ସ୍ୱାସ୍ଥ୍ୟ ରୁହନ୍ତୁ',
            feat_vax_title: 'ଟୀକାକରଣ ସୂଚୀ',
            feat_vax_desc: 'ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଟୀକାକରଣ ଠାରୁ ଅବଗତ ରୁହନ୍ତୁ',
            feat_hosp_title: 'ହସ୍ପିଟାଲ୍ ଲୋକେଟର୍',
            feat_hosp_desc: 'ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍ ଏବଂ ସୁବିଧା ତୁରନ୍ତ ଖୋଜନ୍ତୁ',
            feat_247_title: '24/7 ଉପଲବ୍ଧ',
            feat_247_desc: 'କେବେ, କୋଥାଉ ମଧ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ସହାୟତା',
            footer_copy: '© 2024 ହେଲ୍ଥକେୟାର୍ ଏଆଇ ବଟ୍. ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।',
            footer_privacy: 'ଗୋପନୀୟତା ନୀତି',
            footer_terms: 'ସେବା ସର୍ତ୍ତ',
            footer_contact: 'ସପର୍କ'
        }
    };

    function applyI18n(lang) {
        const dict = translations[lang] || translations.en;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });
    }

    const langSel = document.getElementById('language');
    if (langSel) {
        applyI18n(langSel.value);
        langSel.addEventListener('change', () => applyI18n(langSel.value));
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Initialize Leaflet Map
function initializeMap() {
    // Initialize map centered on Mumbai (default location)
    map = L.map('map').setView([19.0760, 72.8777], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Chat functionality
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    const langSel = document.getElementById('language');
    const lang = langSel ? langSel.value : 'en';
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Add loading message
    const loadingId = addLoadingMessage();
    
    try {
        // Try to get user geolocation for hospital suggestions in chat
        const coords = await (async () => {
            if (!navigator.geolocation) return null;
            try {
                return await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        _err => resolve(null),
                        { enableHighAccuracy: false, timeout: 5000 }
                    );
                });
            } catch (_) {
                return null;
            }
        })();

        // Send message to backend
        // Disable send button briefly to avoid spamming backend
        const sendBtn = document.querySelector('.send-button');
        if (sendBtn) {
            sendBtn.disabled = true;
            setTimeout(() => { sendBtn.disabled = false; }, 1500);
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, language: lang, lat: coords?.lat, lng: coords?.lng })
        });
        
        const data = await response.json();
        
        // Remove loading message
        removeLoadingMessage(loadingId);
        
        if (response.ok) {
            // Add bot response (may include nearby hospitals section)
            addMessage(data.response, 'bot');
        } else {
            const errText = data && data.error ? `Error: ${data.error}` : 'Sorry, I encountered an error. Please try again.';
            addMessage(errText, 'bot');
        }
    } catch (error) {
        console.error('Error:', error);
        removeLoadingMessage(loadingId);
        addMessage('Sorry, I couldn\'t connect to the server. Please try again.', 'bot');
    }
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addLoadingMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    const loadingId = 'loading-' + Date.now();
    messageDiv.id = loadingId;
    messageDiv.className = 'message bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<span class="loading"></span> Thinking...';
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return loadingId;
}

function removeLoadingMessage(loadingId) {
    const loadingMessage = document.getElementById(loadingId);
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Hospital location functionality
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update map center
                map.setView([lat, lng], 14);
                
                // Add user marker
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                userMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map);
                
                userMarker.bindPopup('Your Location').openPopup();
                
                // Find nearby hospitals
                findNearbyHospitals(lat, lng);
            },
            error => {
                alert('Unable to retrieve your location. Please enable location services.');
                console.error('Geolocation error:', error);
                // Use default location (Mumbai)
                findNearbyHospitals(19.0760, 72.8777);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
        // Use default location (Mumbai)
        findNearbyHospitals(19.0760, 72.8777);
    }
}

async function findNearbyHospitals(lat, lng) {
    // Clear existing hospital markers
    hospitalMarkers.forEach(marker => map.removeLayer(marker));
    hospitalMarkers = [];

    try {
        const langSel = document.getElementById('language');
        const lang = langSel ? langSel.value : 'en';
        const res = await fetch('/api/nearby-hospitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, language: lang })
        });
        const data = await res.json();

        // Parse response text into a simple list if needed
        // Expecting bullet/numbered list lines with hospital names
        let hospitals = [];
        if (res.ok && data.hospitals && Array.isArray(data.hospitals)) {
            hospitals = data.hospitals.map(h => ({
                name: h.name || 'Hospital',
                distance: h.distance_km ? `${h.distance_km} km` : '',
                lat: typeof h.lat === 'number' ? h.lat : lat,
                lng: typeof h.lng === 'number' ? h.lng : lng,
                map_url: h.map_url
            })).slice(0, 10);
        } else if (res.ok && data.response) {
            // fallback parsing if structured list missing
            const lines = data.response.split('\n').map(l => l.trim()).filter(Boolean);
            hospitals = lines.map((line) => ({
                name: line.replace(/^[-*\d\.\)\s]+/, ''),
                distance: '',
                lat: lat + (Math.random() - 0.5) * 0.02,
                lng: lng + (Math.random() - 0.5) * 0.02,
            })).slice(0, 10);
        }

        if (hospitals.length === 0) {
            // Fallback: just show the user's location marker
            displayHospitalCards([]);
            return;
        }

        hospitals.forEach(hospital => {
            const marker = L.marker([hospital.lat, hospital.lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);
            marker.bindPopup(`<b>${hospital.name}</b>${hospital.distance ? '<br>' + hospital.distance : ''}`);
            hospitalMarkers.push(marker);
        });

        displayHospitalCards(hospitals);
    } catch (err) {
        console.error('Failed to fetch nearby hospitals', err);
        displayHospitalCards([]);
    }
}

function displayHospitalCards(hospitals) {
    const container = document.getElementById('hospitalsList');
    container.innerHTML = '';
    
    hospitals.forEach((hospital, index) => {
        const card = document.createElement('div');
        card.className = 'hospital-card';
        card.innerHTML = `
            <div class="hospital-name">${index + 1}. ${hospital.name}</div>
            <div class="hospital-distance">${hospital.distance}</div>
            <a href="${hospital.map_url || ('https://maps.google.com/?q=' + encodeURIComponent(hospital.name))}" target="_blank" class="hospital-link">
                Open in Google Maps →
            </a>
        `;
        container.appendChild(card);
    });
}