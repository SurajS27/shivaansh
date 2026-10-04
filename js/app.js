// --- CORE LOGIC & STATE ---
const appContainer = document.getElementById('app-container');
const homeBtn = document.getElementById('homeBtn');
let isAudioUnlocked = false;

function speak(text, rate = 0.85, pitch = 1.5) {
    if (!isAudioUnlocked) return;
    
    window.speechSynthesis.cancel(); // Cancel queued speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Slow the reading down slightly and raise the pitch to mimic a child's voice
    utterance.rate = 0.85; 
    utterance.pitch = 1.5; 
    
    const voices = window.speechSynthesis.getVoices();
    
    // 1. Try to find an Indian English voice first (en-IN)
    let preferredVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
    
    // 2. If no Indian accent is found, try to find a child/friendly voice
    if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.toLowerCase().includes('child') || v.name.toLowerCase().includes('kid')));
    }
    
    // 3. Fallback to Google's standard English or any available English Female voice
    if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.toLowerCase().includes('female')));
    }

    if(preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
}

function createConfetti(x, y) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#9D4EDD'];
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 50; 
        
        particle.style.transform = `translate(${tx}px, ${ty}px)`;
        particle.style.animationDuration = (0.5 + Math.random() * 1) + 's';
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

function handleCardClick(event, textToSpeak, element) {
    speak(textToSpeak);
    element.classList.add('animate-wobble');
    setTimeout(() => element.classList.remove('animate-wobble'), 500);
    
    const rect = element.getBoundingClientRect();
    createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    const unlock = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(unlock);
    isAudioUnlocked = true;
    goHome();
    speak("Welcome! Let's play and learn!", 1.0, 1.1);
}

function goHome() {
    homeBtn.classList.add('hidden');
    let html = `<h2 class="text-3xl md:text-5xl font-bold text-center text-purple-600 mb-8 w-full heading-font tracking-wide">What shall we learn today?</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl">`;
    
    categories.forEach(cat => {
        // Direct Rhymes to the new menu function
        const clickAction = cat.id === 'rhymes' ? `renderRhymesMenu()` : `renderCategory('${cat.id}')`;
        html += `
            <button onclick="${clickAction}" 
                    class="${cat.color} text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-4 bubbly-button h-40 md:h-48 border-4 border-white/20"
                    onmouseenter="speak('${cat.title}')">
                <span class="text-6xl md:text-7xl drop-shadow-md">${cat.icon}</span>
                <span class="text-xl md:text-2xl font-bold tracking-wider">${cat.title}</span>
            </button>
        `;
    });
    html += `</div>`;
    appContainer.innerHTML = html;
}

function renderCategory(categoryId) {
    homeBtn.classList.remove('hidden');
    const data = syllabusData[categoryId];
    const categoryInfo = categories.find(c => c.id === categoryId);
    
    let html = `<h2 class="text-4xl md:text-6xl font-bold text-center mb-10 w-full heading-font text-gray-700">
                    ${categoryInfo.icon} ${categoryInfo.title}
                </h2>`;
    
    if (categoryId === 'numbers') {
        html += renderNumbersView(data);
    } else if (categoryId === 'magicWords') {
        html += renderMagicWordsView(data);
    } else {
        html += renderStandardGridView(data, categoryId === 'alphabets');
    }

    appContainer.innerHTML = html;
    speak(`Let's learn ${categoryInfo.title}`);
}

function renderStandardGridView(items, isAlphabet) {
    let html = `<div class="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl pb-10">`;
    items.forEach(item => {
        // Encode text for safe HTML attribute insertion
        const rawTextToSpeak = item.rhyme ? item.rhyme : (isAlphabet ? `${item.id} for ${item.word}` : item.word);
        const encodedSpeech = encodeURIComponent(rawTextToSpeak);
        
        const textColor = item.textClass || 'text-gray-800';
        
        // Smart Display Logic: Check if it's an image, an alphabet letter, or an emoji
        let mainDisplay = '';
        if (item.image) {
            mainDisplay = `<img src="${item.image}" alt="${item.word}" class="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />`;
        } else {
            const textContent = isAlphabet ? item.id : item.emoji;
            mainDisplay = `<span class="text-6xl md:text-8xl drop-shadow-sm font-bold heading-font ${textColor}">${textContent}</span>`;
        }

        const subDisplay = isAlphabet ? `${item.emoji} ${item.word}` : item.word;
        const rhymeDisplay = item.rhyme ? `<p class="mt-3 text-sm md:text-base font-bold text-gray-800 opacity-80 text-center leading-tight bg-white/40 p-2 rounded-xl w-full whitespace-pre-line">${item.rhyme}</p>` : '';

        html += `
            <div data-rhyme="${encodedSpeech}" onclick="handleCardClick(event, decodeURIComponent(this.dataset.rhyme), this)" 
                 class="flashcard ${item.color || 'bg-white'} rounded-[2rem] p-6 flex flex-col items-center justify-center border-4 border-white/40 min-h-[16rem] md:min-h-[18rem] select-none text-center">
                
                <div class="mb-4 flex items-center justify-center h-24 md:h-32">
                    ${mainDisplay}
                </div>
                
                <span class="text-2xl md:text-3xl font-extrabold ${textColor} bg-white/30 px-4 py-2 rounded-full inline-block mt-2 tracking-wide">${subDisplay}</span>
                ${rhymeDisplay}
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

function renderNumbersView(items) {
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pb-10">`;
    items.forEach(item => {
        const textToSpeak = item.rhyme ? item.rhyme : `Number ${item.id}, ${item.word}`;
        const encodedSpeech = encodeURIComponent(textToSpeak);
        html += `
            <div data-rhyme="${textToSpeak}" onclick="handleCardClick(event, this.dataset.rhyme, this)" 
                 class="flashcard bg-indigo-100 rounded-[2rem] p-6 flex flex-col justify-center border-4 border-indigo-200 select-none">
                <div class="flex items-center justify-between w-full mb-4">
                    <div class="flex items-center gap-6">
                        <span class="text-6xl md:text-8xl font-black text-indigo-500 heading-font w-20 text-center">${item.id}</span>
                        <span class="text-3xl md:text-4xl font-bold text-gray-700">${item.word}</span>
                    </div>
                    <div class="text-3xl md:text-4xl w-1/2 text-right tracking-tighter leading-tight max-w-[150px] flex flex-wrap justify-end">
                        ${item.items}
                    </div>
                </div>
                <div class="w-full bg-white/40 rounded-xl p-3 text-center">
                    <p class="text-lg md:text-xl font-bold text-indigo-800">${item.rhyme}</p>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

function renderMagicWordsView(items) {
     let html = `<div class="flex flex-col gap-6 w-full max-w-3xl pb-10 mx-auto">`;
     items.forEach(item => {
        const rawTextToSpeak = `${item.word}. ${item.desc}`;
        const encodedSpeech = encodeURIComponent(rawTextToSpeak);
        
        html += `
            <div data-rhyme="${encodedSpeech}" onclick="handleCardClick(event, decodeURIComponent(this.dataset.rhyme), this)" 
                 class="flashcard ${item.color} rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-4 border-white/50 select-none overflow-hidden">
                <span class="text-6xl md:text-8xl drop-shadow-md flex-shrink-0">${item.emoji}</span>
                <div class="flex flex-col w-full text-center md:text-left">
                    <span class="text-4xl md:text-5xl font-black heading-font text-gray-800 mb-3">${item.word}</span>
                    
                    <!-- Fixed: Removed w-max, added w-full, whitespace-pre-line, and break-words -->
                    <p class="text-lg md:text-xl text-gray-700 font-bold bg-white/40 p-4 rounded-2xl w-full whitespace-pre-line break-words leading-relaxed text-left">
                        ${item.desc}
                    </p>
                </div>
            </div>
        `;
     });
     html += `</div>`;
     return html;
}

// Sub-menu for Rhyme Library
function renderRhymesMenu() {
    homeBtn.classList.remove('hidden');
    appContainer.innerHTML = `
        <h2 class="text-4xl md:text-6xl font-bold text-center mb-10 w-full heading-font text-gray-700">🎵 Rhymes Library</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 w-full max-w-3xl">
            <div onclick="renderRhymeList('morningRhymes', 'Playgroup Morning Rhymes')" class="bg-yellow-300 rounded-2xl p-8 shadow-lg text-center cursor-pointer transform transition hover:scale-105 active:scale-95 border-4 border-white/50">
                <div class="text-6xl mb-4">☀️</div>
                <h3 class="text-3xl font-bold text-gray-800">Morning Rhymes</h3>
            </div>
            <div onclick="renderRhymeList('book1', 'Rhymes - Book 1')" class="bg-blue-300 rounded-2xl p-8 shadow-lg text-center cursor-pointer transform transition hover:scale-105 active:scale-95 border-4 border-white/50">
                <div class="text-6xl mb-4">📖</div>
                <h3 class="text-3xl font-bold text-gray-800">Book 1</h3>
            </div>
            <div onclick="renderRhymeList('book2', 'Rhymes - Book 2')" class="bg-pink-300 rounded-2xl p-8 shadow-lg text-center cursor-pointer transform transition hover:scale-105 active:scale-95 border-4 border-white/50">
                <div class="text-6xl mb-4">📚</div>
                <h3 class="text-2xl font-bold text-gray-800">Book 2</h3>
            </div>
            <div onclick="renderRhymeList('book3', 'Rhymes - Book 3')" class="bg-green-300 rounded-2xl p-6 shadow-lg text-center cursor-pointer transform transition hover:scale-105 active:scale-95 border-4 border-white/50">
                <div class="text-6xl mb-4">🐦</div>
                <h3 class="text-xl font-bold text-gray-800">Book 3</h3>
            </div>
        </div>
    `;
    speak("Choose a rhyme book");
}

function renderRhymeList(categoryKey, categoryName) {
    const rhymes = rhymesData[categoryKey];
    let html = `
        <h2 class="text-3xl md:text-5xl font-bold text-center mb-8 text-purple-600 heading-font">${categoryName}</h2>
        <div class="flex flex-col gap-6 w-full max-w-4xl pb-10 mx-auto">
    `;
    
    rhymes.forEach(item => {
        const safeText = item.rhyme.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const encodedSpeech = encodeURIComponent(item.rhyme);
        
        html += `
            <div data-rhyme="${safeText}" onclick="handleCardClick(event, this.dataset.rhyme, this)" 
                 class="flashcard ${item.color} rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 border-4 border-white/50 select-none">
                <div class="flex flex-col items-center justify-center min-w-[150px]">
                    <span class="text-6xl md:text-8xl drop-shadow-md mb-4">${item.emoji}</span>
                    <span class="text-2xl md:text-3xl font-black heading-font text-gray-800 text-center">${item.word}</span>
                </div>
                <div class="bg-white/40 p-4 md:p-6 rounded-2xl flex-grow w-full">
                    <p class="text-lg md:text-2xl text-gray-800 font-bold leading-relaxed italic whitespace-pre-line">${item.rhyme}</p>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="w-full flex justify-center mt-4">
            <button onclick="renderRhymesMenu()" class="mb-10 bg-gray-200 hover:bg-gray-300 px-8 py-4 rounded-full text-xl font-bold shadow-md bubbly-button text-gray-700">⬅️ Back to Books</button>
        </div>
    `;
    
    appContainer.innerHTML = html;
}

// Initialize voice cache on load
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};
