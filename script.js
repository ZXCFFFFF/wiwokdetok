// Menunggu seluruh struktur HTML dimuat sebelum menjalankan skrip
document.addEventListener('DOMContentLoaded', () => {
    
    // --- KONFIGURASI & STATE GLOBAL ---
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=AIzaSyAhb1z0QHm553qmWFVNfBATod8bmqJW9x8`;
    
    let state = {
        currentTopic: "",
        isLoading: false,
        currentLanguage: 'id',
        savedArticles: [],
        speech: { utterance: null, isPlaying: false }
    };
    
    const i18n = {
        id: { name: "Indonesia", nativeName: "Indonesia", topics: ["Berita Utama", "Teknologi", "Ekonomi", "Sains", "Otomotif", "Gaya Hidup", "Hiburan", "Olahraga", "Politik", "Dunia"], langCode: "id-ID", history: "Riwayat Baca", clear_history: "Hapus Riwayat", save_article: "Simpan Artikel", saved_article: "Artikel Tersimpan", support: "Dukungan", source: "Sumber", reading_time: "Waktu Baca", by: "Oleh", listen_to_article: "Dengarkan", pause: "Jeda", continue: "Lanjutkan", voice_unsupported: "Fitur suara tidak didukung browser ini.", search_placeholder: "Cari berita atau gunakan suara...", searching: "Mencari...", history_tooltip: "Riwayat Baca", language_tooltip: "Ganti Bahasa", theme_tooltip: "Ganti Tema", trending_topics: "Topik Trending" },
        en: { name: "English", nativeName: "English", topics: ["Top Stories", "Technology", "Economy", "Science", "Automotive", "Lifestyle", "Entertainment", "Sports", "Politics", "World"], langCode: "en-US", history: "Reading History", clear_history: "Clear History", save_article: "Save Article", saved_article: "Article Saved", support: "Support", source: "Source", reading_time: "Reading Time", by: "By", listen_to_article: "Listen", pause: "Pause", continue: "Continue", voice_unsupported: "Voice feature not supported by this browser.", search_placeholder: "Search news or use voice...", searching: "Searching...", history_tooltip: "Reading History", language_tooltip: "Change Language", theme_tooltip: "Change Theme", trending_topics: "Trending Topics" },
        ja: { name: "Japanese", nativeName: "日本語", topics: ["トップニュース", "テクノロジー", "経済", "科学", "自動車", "ライフスタイル", "エンタメ", "スポーツ", "政治", "世界"], langCode: "ja-JP", history: "閲覧履歴", clear_history: "履歴を消去", save_article: "記事を保存", saved_article: "記事を保存しました", support: "サポート", source: "ソース", reading_time: "読書時間", by: "著", listen_to_article: "聞く", pause: "一時停止", continue: "続く", voice_unsupported: "このブラウザは音声機能に対応していません。", search_placeholder: "ニュースを検索または音声を使用...", searching: "検索中...", history_tooltip: "閲覧履歴", language_tooltip: "言語を変更", theme_tooltip: "テーマを変更", trending_topics: "人気のトピック" },
        jv: { name: "Javanese", nativeName: "Basa Jawa", topics: ["Pawartos Utami", "Tèknologi", "Ékonomi", "Sains", "Otomotif", "Gaya Urip", "Hiburan", "Olahraga", "Pulitik", "Donya"], langCode: "jv-ID", history: "Riwayat Waosan", clear_history: "Busak Riwayat", save_article: "Simpen Artikel", saved_article: "Artikel Kasimpen", support: "Pitulungan", source: "Sumber", reading_time: "Wekdal Maos", by: "Dening", listen_to_article: "Mirengaken", pause: "Ngaso", continue: "Lajengaken", voice_unsupported: "Fitur swanten boten kasamekaken ing browser menika.", search_placeholder: "Golet pawartos utawi ngangge swanten...", searching: "Nggoleti...", history_tooltip: "Riwayat Waosan", language_tooltip: "Gantos Basa", theme_tooltip: "Gantos Tema", trending_topics: "Topik Populer" }
    };
    
    // --- PEMILIHAN ELEMEN DOM ---
    const elements = {
        html: document.documentElement,
        body: document.body,
        themeToggle: document.getElementById('theme-toggle'),
        themeToggleDarkIcon: document.getElementById('theme-toggle-dark-icon'),
        themeToggleLightIcon: document.getElementById('theme-toggle-light-icon'),
        topicContainer: document.getElementById('topicContainer'),
        trendingTopicsContainer: document.getElementById('trending-topics-container'),
        newsGrid: document.getElementById('newsGrid'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        messageContainer: document.getElementById('messageContainer'),
        currentTopicTitle: document.getElementById('currentTopicTitle'),
        historyContainer: document.getElementById('history-container'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        langMenu: document.getElementById('lang-menu'),
        langToggleButton: document.getElementById('lang-toggle-button'),
        langDropdown: document.getElementById('lang-dropdown'),
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        voiceSearchBtn: document.getElementById('voiceSearchBtn'),
        articleModal: document.getElementById('articleModal'),
        closeModalButton: document.getElementById('closeModalButton'),
        modalTitle: document.getElementById('modalTitle'),
        modalImageContainer: document.getElementById('modalImageContainer'),
        modalByline: document.getElementById('modalByline'),
        modalAudioPlayer: document.getElementById('modalAudioPlayer'),
        modalContent: document.getElementById('modalContent'),
        modalSource: document.getElementById('modalSource'),
        saveArticleBtn: document.getElementById('saveArticleBtn'),
    };
    
    // --- FUNGSI UTAMA ---
    function init() {
        initTheme();
        initLanguage();
        initHistory();
        initEventListeners();
        initSpeechRecognition();
    }
    
    function initEventListeners() {
        elements.langToggleButton.addEventListener('click', () => elements.langDropdown.style.display = elements.langDropdown.style.display === 'block' ? 'none' : 'block');
        document.addEventListener('click', (e) => {
            if (!elements.langMenu.contains(e.target)) {
                elements.langDropdown.style.display = 'none';
            }
        });
        elements.closeModalButton.addEventListener('click', closeModal);
        elements.articleModal.addEventListener('click', (e) => {
            if (e.target === elements.articleModal) closeModal();
        });
        elements.searchBtn.addEventListener('click', performSearch);
        elements.searchInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') performSearch();
        });
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
        window.addEventListener('scroll', () => {
            if (state.isLoading || elements.searchInput.value.trim() !== "") return;
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                fetchAndDisplayNews(false);
            }
        });
    }

    // --- TEMA (GELAP/TERANG) ---
    function initTheme() {
        const isDark = localStorage.getItem('theme') === 'dark';
        elements.body.classList.toggle('dark', isDark);
        elements.themeToggleLightIcon.style.display = isDark ? 'block' : 'none';
        elements.themeToggleDarkIcon.style.display = isDark ? 'none' : 'block';
        
        elements.themeToggle.onclick = () => {
            const darkEnabled = elements.body.classList.toggle('dark');
            localStorage.setItem('theme', darkEnabled ? 'dark' : 'light');
            initTheme();
        };
    }

    // --- BAHASA (INTERNASIONALISASI) ---
    function initLanguage() {
        const savedLang = localStorage.getItem('language') || 'id';
        populateLangDropdown();
        setLanguage(savedLang);
    }

    function populateLangDropdown() {
        elements.langDropdown.innerHTML = '';
        Object.entries(i18n).forEach(([code, lang]) => {
            const item = document.createElement('a');
            item.href = '#';
            item.textContent = lang.nativeName;
            item.onclick = (e) => {
                e.preventDefault();
                setLanguage(code);
                elements.langDropdown.style.display = 'none';
            };
            elements.langDropdown.appendChild(item);
        });
    }

    function setLanguage(langCode) {
        state.currentLanguage = langCode;
        localStorage.setItem('language', langCode);
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if(i18n[langCode][key]) el.textContent = i18n[langCode][key];
        });
        elements.searchInput.placeholder = i18n[langCode].search_placeholder;
        initTopics();
        changeTopic(i18n[langCode].topics[0]);
        fetchAndDisplayTrendingTopics();
    }
    
    // --- RIWAYAT (SIMPAN BERITA) ---
    function initHistory() {
        state.savedArticles = JSON.parse(localStorage.getItem('savedArticles')) || [];
        renderHistory();
    }

    function renderHistory() {
        elements.historyContainer.innerHTML = '';
        if (state.savedArticles.length === 0) {
            elements.historyContainer.innerHTML = `<p class="italic-text">No saved articles.</p>`;
            elements.clearHistoryBtn.style.display = 'none';
            return;
        }
        elements.clearHistoryBtn.style.display = 'block';
        state.savedArticles.forEach(article => {
            const item = document.createElement('a');
            item.href = '#';
            item.textContent = article.title;
            item.onclick = (e) => { e.preventDefault(); openArticleModal(article.title); };
            elements.historyContainer.prepend(item);
        });
    }

    function saveArticle(title) {
        if (!state.savedArticles.some(a => a.title === title)) {
            state.savedArticles.push({ title });
            localStorage.setItem('savedArticles', JSON.stringify(state.savedArticles));
            renderHistory();
        }
    }
    
    function clearHistory() {
        state.savedArticles = [];
        localStorage.removeItem('savedArticles');
        renderHistory();
    }

    // --- TOPIK & NAVIGASI ---
    function initTopics() {
        const topics = i18n[state.currentLanguage].topics;
        elements.topicContainer.innerHTML = '';
        topics.forEach(topic => {
            const button = document.createElement('button');
            button.className = 'topic-button';
            button.textContent = topic;
            button.dataset.topic = topic;
            button.onclick = () => changeTopic(topic);
            elements.topicContainer.appendChild(button);
        });
    }

    function changeTopic(topic) {
        if (state.isLoading) return;
        state.currentTopic = topic;
        elements.currentTopicTitle.textContent = topic;
        elements.searchInput.value = '';
        document.querySelectorAll('.topic-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.topic === topic);
        });
        fetchAndDisplayNews(true);
    }
    
    // --- PENCARIAN & SUARA ---
    function performSearch() {
        const query = elements.searchInput.value.trim();
        if (query) {
            state.currentTopic = query;
            elements.currentTopicTitle.textContent = `${i18n[state.currentLanguage].searching} "${query}"`;
            fetchAndDisplayNews(true);
        }
    }
    
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            elements.voiceSearchBtn.disabled = true;
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = i18n[state.currentLanguage].langCode;
        recognition.onresult = (event) => {
            elements.searchInput.value = event.results[0][0].transcript;
            performSearch();
        };
        elements.voiceSearchBtn.onclick = () => recognition.start();
    }

    // --- API & TAMPILAN BERITA ---
    async function fetchApi(payload) {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error ${response.status}`);
        return response.json();
    }

    async function fetchAndDisplayNews(isNewTopic) {
        if (state.isLoading) return;
        state.isLoading = true;
        if (isNewTopic) elements.newsGrid.innerHTML = '';
        elements.loadingIndicator.textContent = 'Loading...';

        const prompt = `Anda adalah editor agregator berita netral. Buat daftar 6 judul berita unik tentang "${state.currentTopic}". PENTING: Semua berita harus dari tahun 2025. Berita harus mencerminkan tren dari sumber seperti Kompas, Tempo, BBC, CNN, X, dan YouTube untuk wilayah berbahasa ${i18n[state.currentLanguage].name}. Respons HANYA sebagai array JSON dengan properti: "judul", "kategori", "tanggal" (format: "22 Juni 2025"), "waktu_baca" (format: "5 Menit").`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
        try {
            const result = await fetchApi(payload);
            const articles = JSON.parse(result.candidates[0].content.parts[0].text);
            displayHeadlineCards(articles);
        } catch (error) {
            elements.messageContainer.textContent = 'Gagal memuat berita.';
        } finally {
            state.isLoading = false;
            elements.loadingIndicator.textContent = '';
        }
    }
    
    async function fetchAndDisplayTrendingTopics() {
        const prompt = `Identifikasi 5 topik berita paling trending HARI INI (22 Juni 2025) di wilayah berbahasa ${i18n[state.currentLanguage].name}, berdasarkan agregasi dari X, YouTube, dan portal berita utama. Berikan respons HANYA sebagai array JSON berisi string topik.`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
        try {
            const result = await fetchApi(payload);
            const topics = JSON.parse(result.candidates[0].content.parts[0].text);
            elements.trendingTopicsContainer.innerHTML = '';
            topics.forEach(topic => {
                 const item = document.createElement('a');
                 item.href = '#';
                 item.textContent = topic;
                 item.onclick = (e) => { e.preventDefault(); changeTopic(topic); window.scrollTo({ top: 0, behavior: 'smooth' }); };
                 elements.trendingTopicsContainer.appendChild(item);
            });
        } catch (error) {
            elements.trendingTopicsContainer.innerHTML = `<p>Gagal memuat tren.</p>`;
        }
    }
    
    function displayHeadlineCards(articles) {
        if (!articles || !Array.isArray(articles)) return;
        articles.forEach(article => {
            const card = document.createElement('article');
            card.className = 'news-card';
            const imageSeed = article.judul.replace(/[^a-zA-Z0-9]/g, '');
            card.innerHTML = `<div class="news-card-image-wrapper"><img src="https://picsum.photos/seed/${imageSeed}/400/300" alt="" class="news-card-image" loading="lazy"></div><div class="news-card-content"><span class="news-card-category">${article.kategori}</span><h3 class="news-card-title">${article.judul}</h3><div class="news-card-footer"><span>${article.tanggal}</span><span>${article.waktu_baca}</span></div></div>`;
            card.onclick = () => openArticleModal(article.judul);
            elements.newsGrid.appendChild(card);
        });
    }

    // --- MODAL & KONTEN LENGKAP ---
    function openArticleModal(title) {
        elements.articleModal.style.display = 'flex';
        elements.modalTitle.textContent = title;
        const imageSeed = title.replace(/[^a-zA-Z0-9]/g, '');
        elements.modalImageContainer.innerHTML = `<img src="https://picsum.photos/seed/${imageSeed}/800/400" alt="" loading="lazy">`;
        elements.modalContent.innerHTML = `<p>Loading article...</p>`;
        elements.modalByline.innerHTML = '';
        elements.saveArticleBtn.onclick = () => saveArticle(title);
        fetchFullArticleContent(title);
    }
    
    async function fetchFullArticleContent(title) {
        const lang = i18n[state.currentLanguage];
        const prompt = `Anda adalah jurnalis AI netral. Tulis artikel berita lengkap (min 5 paragraf) dalam bahasa ${lang.name} untuk judul: "${title}", pastikan isinya dari peristiwa tahun 2025. Format HANYA sebagai JSON dengan kunci: "konten_lengkap", "sumber_berita" (e.g., "Agregasi dari Kompas & Reuters"), "penulis" (e.g., "Tim Redaksi AI"), "tanggal_publikasi", dan "estimasi_baca".`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
        try {
            const result = await fetchApi(payload);
            const article = JSON.parse(result.candidates[0].content.parts[0].text);
            elements.modalContent.innerHTML = article.konten_lengkap.split('\\n\\n').map(p => `<p>${p}</p>`).join('');
            elements.modalSource.innerHTML = `<strong>${lang.source}:</strong> ${article.sumber_berita}`;
            elements.modalByline.innerHTML = `<div><strong>${lang.by}:</strong> ${article.penulis}</div><span>&bull;</span><div>${article.tanggal_publikasi}</div><span>&bull;</span><div>${article.estimasi_baca}</div>`;
            setupAudioPlayer(article.konten_lengkap);
        } catch (error) {
            elements.modalContent.innerHTML = `<p>Gagal memuat konten.</p>`;
        }
    }

    function closeModal() {
        stopSpeech();
        elements.articleModal.style.display = 'none';
    }

    // --- TEXT-TO-SPEECH (TTS) ---
    function setupAudioPlayer(text) {
        if (!('speechSynthesis' in window)) return;
        stopSpeech();
        
        const langCode = i18n[state.currentLanguage].langCode;
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
        
        state.speech.utterance = new SpeechSynthesisUtterance(text);
        if (voice) state.speech.utterance.voice = voice;
        state.speech.utterance.lang = langCode;
        state.speech.utterance.onend = () => {
            state.speech.isPlaying = false;
            updateAudioButton();
        };

        elements.modalAudioPlayer.innerHTML = `<button id="audioControlBtn"><span id="audioControlText"></span></button>`;
        updateAudioButton();
        document.getElementById('audioControlBtn').onclick = toggleSpeech;
    }
    
    function toggleSpeech() {
        if (state.speech.isPlaying) window.speechSynthesis.pause();
        else {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            else window.speechSynthesis.speak(state.speech.utterance);
        }
        state.speech.isPlaying = !state.speech.isPlaying;
        updateAudioButton();
    }
    
    function stopSpeech() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        state.speech.isPlaying = false;
    }

    function updateAudioButton() {
        const btnText = document.getElementById('audioControlText');
        if(!btnText) return;
        const lang = i18n[state.currentLanguage];
        if(state.speech.isPlaying) btnText.textContent = lang.pause;
        else if(window.speechSynthesis.paused) btnText.textContent = lang.continue;
        else btnText.textContent = lang.listen_to_article;
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {};
    }
    
    // Jalankan inisialisasi
    init();

});
