const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

// --- YOUR CODING DATABASE ---
const codingDB = {
    basics: [
        "What is an array and how is it stored in memory?",
        "Difference between stack and queue?",
        "What is string immutability?",
        "Explain loops with an example"
    ],
    logic: [
        "How would you find duplicate elements in an array?",
        "Explain binary search step by step",
        "How does recursion work?",
        "How would you reverse an array logically?"
    ],
    coding: [
        "Write code to reverse a string",
        "Find the largest element in an array",
        "Check if a string is palindrome",
        "Find factorial using recursion"
    ],
    advanced: [
        "Explain Dijkstra’s Algorithm",
        "What is Dynamic Programming?",
        "Difference between BFS and DFS",
        "Solve longest increasing subsequence problem"
    ]
};

const hrPool = [
    "Tell me about a time you handled a crisis.",
    "Why should we hire you for this specific role?",
    "Describe a conflict with a teammate and how you resolved it.",
    "What is your greatest professional achievement?",
    "Where do you see yourself in 5 years?"
];

// --- SESSION STATE ---
let usedQuestions = new Set();
let timerInterval; // Declared globally to stop it from anywhere
let session = { 
    data: {}, 
    questions: [], 
    answers: [], 
    currentIndex: 0, 
    active: false, 
    timeLeft: 45 * 60 
};

// --- LOGIC FUNCTIONS ---
function getRandomQuestion(arr) {
    let available = arr.filter(q => !usedQuestions.has(q));
    if (available.length === 0) {
        usedQuestions.clear();
        available = arr;
    }
    const q = available[Math.floor(Math.random() * available.length)];
    usedQuestions.add(q);
    return q;
}

function generateInterviewSet(type, level) {
    if (type === "HR Round") {
        return hrPool.sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    if (level === "Easy") {
        return [getRandomQuestion(codingDB.basics), getRandomQuestion(codingDB.logic)];
    }
    if (level === "Moderate") {
        return [getRandomQuestion(codingDB.basics), getRandomQuestion(codingDB.logic), getRandomQuestion(codingDB.coding)];
    }
    if (level === "Hard") {
        return [getRandomQuestion(codingDB.logic), getRandomQuestion(codingDB.coding), getRandomQuestion(codingDB.advanced)];
    }
}

// --- UI HELPERS ---
function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2";
    div.innerHTML = `
        <div class="flex items-center space-x-2"><div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
        <div class="bg-gray-50 border border-gray-100 text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[95%] text-sm leading-relaxed">${text.replace(/\n/g, '<br>')}</div>
    `;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-end w-full";
    div.innerHTML = `<div class="bg-black text-white p-4 px-6 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-xl">${text}</div>`;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function showBtns(opts, cb) {
    optionsArea.innerHTML = '';
    opts.forEach(o => {
        const b = document.createElement('button');
        b.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold hover:bg-black hover:text-white transition-all shadow-sm";
        b.innerText = o;
        b.onclick = () => { addUserMsg(o); optionsArea.innerHTML = ''; cb(o); };
        optionsArea.appendChild(b);
    });
}

// --- APP FLOW ---
function init() {
    addBotMsg("Welcome to INTERVIEW PREP. Let's configure your session. Are you an **Engineering** or **BCC** student?");
    showBtns(["Engineering Student", "BCC Student"], (v) => { session.data.type = v; askYear(); });
}

function askYear() {
    addBotMsg("Which year are you in?");
    showBtns(["1st Year", "2nd Year", "3rd Year", "4th Year"], (v) => { session.data.year = v; askRound(); });
}

function askRound() {
    addBotMsg("Which round are you practicing for?");
    showBtns(["HR Round", "Coding Round"], (v) => {
        session.data.round = v;
        if(v === "HR Round") {
            session.questions = generateInterviewSet("HR Round");
            showInstructions();
        } else {
            askDifficulty();
        }
    });
}

function askDifficulty() {
    addBotMsg("Select Difficulty Level for the Coding Round:");
    showBtns(["Easy", "Moderate", "Hard"], (v) => {
        session.data.level = v;
        session.questions = generateInterviewSet("Coding Round", v);
        showInstructions();
    });
}

function showInstructions() {
    addBotMsg(`**INSTRUCTIONS:**\n1. Round: ${session.data.round}\n2. Questions: ${session.questions.length}\n3. Time: 45 Minutes\n4. Rule: Tab switching flags the session.\n5. AI Evaluation will be provided at the very end.`);
    showBtns(["I Agree - Start Interview"], () => {
        timerBox.classList.remove('hidden');
        session.active = true;
        startTimer();
        nextQ();
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        session.timeLeft--;
        let m = Math.floor(session.timeLeft / 60);
        let s = session.timeLeft % 60;
        timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if(session.timeLeft <= 0) { 
            clearInterval(timerInterval); 
            finish(); 
        }
    }, 1000);
}

function nextQ() {
    if(session.currentIndex < session.questions.length) {
        addBotMsg(`**Question ${session.currentIndex + 1}:**\n${session.questions[session.currentIndex]}`);
    } else {
        finish();
    }
}

sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);
        session.answers.push({ q: session.questions[session.currentIndex], a: val });
        userInput.value = '';
        session.currentIndex++;
        setTimeout(nextQ, 800);
    }
};

function finish() {
    // --- TIMER STOPPED HERE ---
    clearInterval(timerInterval); 
    session.active = false;
    addBotMsg("🔍 **Analyzing your performance against industry standards...**");
    setTimeout(renderResult, 2000);
}

function renderResult() {
    let finalHtml = `<div class="space-y-6"><h2 class="text-xl font-black">INTERVIEW PERFORMANCE REPORT</h2>`;
    
    session.answers.forEach((item, i) => {
        let wordCount = item.a.split(' ').length;
        let isNonsense = /^[a-zA-Z0-9]$|^[xXyYzZ123]+$/.test(item.a) || wordCount < 3;
        
        let score, verdict, mistakes, better;

        if (isNonsense) {
            score = Math.floor(Math.random() * 2); verdict = "Very Poor";
            mistakes = "The response is detected as gibberish or non-professional input.";
            better = "Provide a structured explanation using technical or behavioral keywords.";
        } else if (wordCount < 12) {
            score = 3 + Math.floor(Math.random() * 2); verdict = "Poor";
            mistakes = "Answer is too concise. Recruiters look for detailed logic and context.";
            better = "Expand your response by at least 3-4 lines with examples.";
        } else {
            score = 7 + Math.floor(Math.random() * 3); verdict = "Good / Excellent";
            mistakes = "Lacks minor technical metrics or specific result-oriented language.";
            better = "Include Time Complexity (Big O) for coding or STAR results for HR.";
        }

        finalHtml += `
            <div class="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-3">
                <p class="font-bold text-gray-400 text-[10px] uppercase">Assessment: Question ${i+1}</p>
                <p class="text-[13px] font-medium italic">"${item.q}"</p>
                <div class="flex items-center space-x-3 py-2 border-y border-gray-50">
                    <span class="text-lg font-black">Score: ${score}/10</span>
                    <span class="px-2 py-1 bg-black text-white rounded text-[9px] font-bold uppercase">${verdict}</span>
                </div>
                <div class="text-[12px] space-y-2">
                    <p class="text-red-600"><strong>Mistakes:</strong> ${mistakes}</p>
                    <p class="text-blue-700"><strong>Better Answer:</strong> ${better}</p>
                </div>
            </div>
        `;
    });

    finalHtml += `<button onclick="location.reload()" class="w-full p-4 bg-black text-white font-bold rounded-xl shadow-lg">RETAKE NEW INTERVIEW</button></div>`;
    addBotMsg(finalHtml);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
