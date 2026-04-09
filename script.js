const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerContainer = document.getElementById('timer-container');

let userProfile = { selectedMAANG: [] };
let interviewQuestions = [];
let currentQIndex = 0;
let userAnswers = [];
let timeLeft = 45 * 60; 
let timerInterval;

const questionsData = {
    HR: [
        "Tell me about a time you handled a difficult situation with a colleague.",
        "Why should we hire you specifically for this role over other candidates?",
        "What is your greatest professional achievement so far?",
        "How do you prioritize your work when you have multiple tight deadlines?",
        "Where do you see your career path leading in the next 5 years?"
    ],
    Coding: {
        Easy: ["Explain the difference between a List and a Set.", "How do you find a duplicate in an array?", "What is the time complexity of a Linear Search?", "What is a constructor in OOPS?"],
        Moderate: [
            "Easy: Reverse a string without using built-in functions.",
            "Moderate: Explain the working of a Hash Map and its collisions.",
            "Hard: Implement a custom LRU Cache.",
            "Hard: Explain the concepts of ACID properties in Databases."
        ],
        Hard: [
            "Explain the difference between Process and Thread in OS.",
            "Solve the 'Trapping Rain Water' problem logic (Hard).",
            "Design a Rate Limiter system for a MAANG-scale application."
        ]
    }
};

// --- CORE FUNCTIONS ---
function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2";
    div.innerHTML = `
        <div class="flex items-center space-x-2"><div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold tracking-tighter">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
        <div class="bg-gray-50 border border-gray-100 text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[92%] text-sm leading-relaxed">${text.replace(/\n/g, '<br>')}</div>
    `;
    chatContent.appendChild(div);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-end w-full";
    div.innerHTML = `<div class="bg-black text-white p-4 px-6 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-xl font-medium">${text}</div>`;
    chatContent.appendChild(div);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function showButtons(options, callback) {
    optionsArea.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold text-gray-700 hover:bg-black hover:text-white transition-all shadow-sm";
        btn.innerText = opt;
        btn.onclick = () => { addUserMsg(opt); optionsArea.innerHTML = ''; callback(opt); };
        optionsArea.appendChild(btn);
    });
}

// --- FLOW CONTROL ---
function init() {
    addBotMsg("Welcome to the Professional Interview AI. To begin, are you an **Engineering** or **BCC** student?");
    showButtons(["Engineering Student", "BCC Student"], (v) => { userProfile.type = v; askYear(); });
}

function askYear() {
    addBotMsg("Which year are you currently in?");
    showButtons(["1st Year", "2nd Year", "3rd Year", "4th Year"], (v) => { userProfile.year = v; askMode(); });
}

function askMode() {
    addBotMsg("Select your interview mode:");
    showButtons(["Serious Mode", "Mock Practice"], (v) => { userProfile.mode = v; askCompany(); });
}

function askCompany() {
    addBotMsg("Target Company Category:");
    showButtons(["MAANG", "Private Consultancy", "Startup"], (v) => {
        userProfile.category = v;
        if(v === "MAANG") {
            addBotMsg("Select multiple targets:");
            showMAANGSelect();
        } else {
            askRound();
        }
    });
}

function showMAANGSelect() {
    const list = ["Google", "Amazon", "Meta", "Netflix", "Apple"];
    userProfile.selectedMAANG = [];
    list.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 border border-gray-200 rounded-full text-xs font-medium";
        btn.innerText = opt;
        btn.onclick = () => {
            btn.classList.toggle('bg-black'); btn.classList.toggle('text-white');
            if(userProfile.selectedMAANG.includes(opt)) userProfile.selectedMAANG = userProfile.selectedMAANG.filter(x => x !== opt);
            else userProfile.selectedMAANG.push(opt);
        };
        optionsArea.appendChild(btn);
    });
    const done = document.createElement('button');
    done.className = "px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold ml-4";
    done.innerText = "Confirm";
    done.onclick = () => { addUserMsg("Targets: " + userProfile.selectedMAANG.join(", ")); askRound(); };
    optionsArea.appendChild(done);
}

function askRound() {
    addBotMsg("Select Interview Round:");
    showButtons(["HR Round", "Coding Round"], (v) => { 
        userProfile.round = v; 
        askDifficulty();
    });
}

function askDifficulty() {
    addBotMsg("Select Difficulty Level:");
    showButtons(["Easy", "Moderate", "Hard"], (v) => { 
        userProfile.difficulty = v; 
        prepareQuestions();
    });
}

function prepareQuestions() {
    if(userProfile.round === "HR Round") {
        interviewQuestions = questionsData.HR;
    } else {
        interviewQuestions = questionsData.Coding[userProfile.difficulty];
    }
    showInstructions();
}

function showInstructions() {
    addBotMsg(`**INDUSTRY PROTOCOL:**\n1. **Duration:** 45 Minutes fixed.\n2. **Cheating:** Tab switching in Serious Mode will terminate the session.\n3. **Flow:** Questions are served sequentially. Final results provided at the end.\n4. **Status:** All inputs are being logged for professional evaluation.`);
    showButtons(["I Agree - Proceed"], () => {
        addBotMsg("Configuration complete. Click the button below to start the timer and begin your interview.");
        showButtons(["START INTERVIEW"], startInterview);
    });
}

function startInterview() {
    timerContainer.classList.remove('hidden');
    startTimer();
    
    document.addEventListener("visibilitychange", () => {
        if(document.hidden && userProfile.mode === "Serious Mode") {
            alert("SESSION TERMINATED: Tab switching detected.");
            location.reload();
        }
    });

    nextQuestion();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if(timeLeft <= 0) { clearInterval(timerInterval); finishInterview(); }
    }, 1000);
}

function nextQuestion() {
    if(currentQIndex < interviewQuestions.length) {
        addBotMsg(`**Question ${currentQIndex + 1}:**\n${interviewQuestions[currentQIndex]}`);
    } else {
        finishInterview();
    }
}

sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if(val && interviewQuestions.length > 0) {
        addUserMsg(val);
        userAnswers.push(val);
        userInput.value = '';
        currentQIndex++;
        setTimeout(nextQuestion, 800);
    }
};

function finishInterview() {
    clearInterval(timerInterval);
    addBotMsg("Interview Analysis in Progress... Generating your professional report.");
    
    setTimeout(() => {
        const finalScore = Math.floor(Math.random() * 3) + 7;
        let report = `
            <div class="space-y-4">
                <div class="text-xl font-black text-black">FINAL INDUSTRY REPORT</div>
                <div class="p-4 bg-gray-900 text-white rounded-xl">
                    <p class="text-xs opacity-60">OVERALL RATING</p>
                    <p class="text-3xl font-bold">${finalScore}.2 / 10</p>
                </div>
                <div class="space-y-2 text-xs">
                    <p><strong>Total Questions:</strong> ${interviewQuestions.length}</p>
                    <p><strong>Round Type:</strong> ${userProfile.round}</p>
                    <p><strong>Strengths:</strong> Concise logic, structured thought process, good company knowledge.</p>
                    <p><strong>Mistakes:</strong> Some technical gaps in advanced optimization questions. Communication in HR could be more descriptive.</p>
                </div>
                <div class="p-3 border-l-4 border-indigo-600 bg-indigo-50 text-[11px] text-indigo-900">
                    <strong>Model Advice:</strong> Use the STAR method for behavioral questions. In coding, always state the Time Complexity before writing the solution.
                </div>
            </div>
        `;
        addBotMsg(report);
        showButtons(["Retake Interview"], () => location.reload());
    }, 2000);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
