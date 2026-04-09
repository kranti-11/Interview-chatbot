const chatContent = document.getElementById('chat-content');
const optionsUi = document.getElementById('options-ui');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const difficultyBadge = document.getElementById('difficulty-badge');

let state = "SETUP"; // SETUP -> INTERVIEW -> END
let currentStep = 0;
let userData = { score: 0, qCount: 0, answers: [] };

// Questions Bank
const questions = {
    HR: {
        Beginner: ["Tell me about yourself.", "What are your strengths and weaknesses?", "Why do you want this job?"],
        Moderate: ["Describe a time you worked in a team.", "How do you handle stress?", "Give an example of a goal you reached."],
        Hard: ["Tell me about a time you had a conflict with a manager.", "Describe a complex ethical dilemma you faced.", "Where do you see yourself in 5 years?"]
    },
    Coding: {
        Beginner: ["Explain the difference between an Array and a Linked List.", "How does a 'for' loop work?", "What is a variable?"],
        Moderate: ["How does Binary Search work? What is its complexity?", "Explain the concept of Recursion with an example.", "What is the difference between a Hash Map and an Array?"],
        Hard: ["Explain how Dijkstra's algorithm works.", "What is Dynamic Programming? Provide a use case.", "Explain memory management in your chosen language."]
    }
};

// --- UI UTILS ---
function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = "message-appear flex flex-col items-start w-full";
    div.innerHTML = `
        <div class="flex items-center space-x-2 mb-2">
            <div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">AI</div>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span>
        </div>
        <div class="bg-white border border-gray-100 text-gray-800 p-5 rounded-2xl shadow-sm max-w-[90%] text-sm leading-relaxed">
            ${text.replace(/\n/g, '<br>')}
        </div>
    `;
    chatContent.appendChild(div);
    scrollToBottom();
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = "message-appear flex flex-col items-end w-full";
    div.innerHTML = `<div class="bg-gray-900 text-white p-4 rounded-2xl max-w-[85%] text-sm shadow-md">${text}</div>`;
    chatContent.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function showButtons(options, callback) {
    optionsUi.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold hover:bg-black hover:text-white transition-all shadow-sm";
        btn.innerText = opt;
        btn.onclick = () => {
            addUserMessage(opt);
            optionsUi.innerHTML = '';
            callback(opt);
        };
        optionsUi.appendChild(btn);
    });
}

// --- INTERVIEW ENGINE ---
function init() {
    addBotMessage("Welcome to the Professional AI Interviewer. Please select the **Round Type** to begin.");
    showButtons(["HR Round", "Coding Round"], (val) => {
        userData.round = val;
        askDifficulty();
    });
}

function askDifficulty() {
    addBotMessage("Select your **Difficulty Level**:");
    showButtons(["Beginner", "Moderate", "Hard"], (val) => {
        userData.difficulty = val;
        difficultyBadge.innerText = val;
        difficultyBadge.classList.remove('hidden');
        if (userData.round === "Coding Round") {
            askLanguage();
        } else {
            startInterview();
        }
    });
}

function askLanguage() {
    addBotMessage("Select your preferred **Programming Language**:");
    showButtons(["Java", "Python", "C++", "JavaScript"], (val) => {
        userData.language = val;
        startInterview();
    });
}

function startInterview() {
    state = "INTERVIEW";
    addBotMessage(`Perfect. We are starting the ${userData.round} (${userData.difficulty}). I will ask 3 questions. Please be descriptive.`);
    nextQuestion();
}

function nextQuestion() {
    if (currentStep < 3) {
        const qList = questions[userData.round.split(' ')[0]][userData.difficulty];
        userData.currentQuestion = qList[currentStep];
        setTimeout(() => addBotMessage(`**Question ${currentStep + 1}:** ${userData.currentQuestion}`), 800);
    } else {
        finishInterview();
    }
}

function evaluateAnswer(userAns) {
    addBotMessage("🔍 *Analyzing your response...*");
    
    // Simulated AI Evaluation Logic
    const score = Math.floor(Math.random() * 4) + 6; // Random score 6-10 for simulation
    userData.score += score;

    setTimeout(() => {
        let feedback = `
            <div class="space-y-3">
                <div class="flex items-center space-x-2">
                    <span class="text-lg font-bold text-indigo-600">Score: ${score}/10</span>
                </div>
                <p><strong>Mistakes:</strong> ${userAns.length < 20 ? "Answer was too short and lacked detail." : "Minor clarity issues."}</p>
                <p><strong>Better Answer:</strong> A more structured response would include specific examples (STAR method) and technical keywords.</p>
                <div class="p-3 bg-green-50 rounded-lg text-xs text-green-800">
                    <strong>Tip:</strong> Maintain eye contact and stay calm while explaining logic.
                </div>
            </div>
        `;
        addBotMessage(feedback);
        currentStep++;
        setTimeout(nextQuestion, 1500);
    }, 1200);
}

function finishInterview() {
    state = "END";
    const finalScore = (userData.score / 3).toFixed(1);
    addBotMessage(`**Interview Complete!**\n\n**Overall Score:** ${finalScore}/10\n\n**Weak Areas:** Communication depth and technical jargon usage.\n\n**Improvement Tips:** Practice mock coding daily and read more behavioral interview frameworks.`);
    showButtons(["Restart Interview"], () => location.reload());
}

// --- HANDLERS ---
sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if (val && state === "INTERVIEW") {
        addUserMessage(val);
        userInput.value = '';
        evaluateAnswer(val);
    }
};

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

init();
