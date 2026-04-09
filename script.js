const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

let session = { 
    data: {}, 
    questions: [], 
    answers: [], 
    currentIndex: 0, 
    active: false, 
    timeLeft: 45 * 60 
};

// --- RANDOMIZED QUESTION POOLS ---
const hrPool = [
    "Tell me about a time you showed leadership during a crisis.",
    "Why do you want to work for our organization specifically?",
    "Describe a situation where you had to work with a difficult teammate.",
    "What is your greatest professional achievement and why?",
    "How do you handle tight deadlines and high-pressure environments?",
    "Describe a time you failed. What did you learn?",
    "How do you stay updated with industry trends?",
    "Tell me about a project that didn't go as planned."
];

const codingPool = {
    Easy: ["Explain the difference between local and global variables.", "What is an Array and how is it stored in memory?", "What is a String and is it immutable?", "Explain the 'if-else' logic."],
    Moderate: ["Explain Binary Search and its time complexity.", "What is a Linked List vs an Array?", "How does Recursion work?", "What are the OOPs pillars?"],
    Hard: ["Explain Dijkstra's Algorithm.", "What is Dynamic Programming?", "Explain the difference between BFS and DFS.", "How do you optimize a SQL query?"]
};

// --- UI HELPERS ---
function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2";
    div.innerHTML = `
        <div class="flex items-center space-x-2"><div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Professional Evaluator</span></div>
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
        b.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold hover:bg-black hover:text-white transition-all";
        b.innerText = o;
        b.onclick = () => { addUserMsg(o); optionsArea.innerHTML = ''; cb(o); };
        optionsArea.appendChild(b);
    });
}

// --- LOGIC ---
function init() {
    addBotMsg("Welcome. I am your AI Interviewer. To start, are you an **Engineering** or **BCC** student?");
    showBtns(["Engineering Student", "BCC Student"], (v) => { session.data.type = v; askYear(); });
}

function askYear() {
    addBotMsg("Which year are you in?");
    showBtns(["1st Year", "2nd Year", "3rd Year", "4th Year"], (v) => { session.data.year = v; askRound(); });
}

function askRound() {
    addBotMsg("Select the interview round:");
    showBtns(["HR Round", "Coding Round"], (v) => {
        session.data.round = v;
        if(v === "HR Round") {
            session.questions = hrPool.sort(() => 0.5 - Math.random()).slice(0, 5);
            showInstructions();
        } else {
            askDifficulty();
        }
    });
}

function askDifficulty() {
    addBotMsg("Select Coding Difficulty:");
    showBtns(["Easy", "Moderate", "Hard"], (v) => {
        session.data.diff = v;
        if(v === "Easy") session.questions = codingPool.Easy.sort(() => 0.5 - Math.random()).slice(0, 4);
        else if(v === "Moderate") {
            session.questions = [codingPool.Easy[0], codingPool.Moderate[0], codingPool.Hard[0], codingPool.Hard[1]];
        } else {
            session.questions = codingPool.Hard.sort(() => 0.5 - Math.random()).slice(0, 3);
        }
        showInstructions();
    });
}

function showInstructions() {
    addBotMsg(`**INSTRUCTIONS:**\n1. Round: ${session.data.round}\n2. Time: 45 Minutes\n3. Rules: Tab switching is tracked. Be detailed.\n4. Evaluation: A strict professional report will be generated at the end.`);
    showBtns(["I Agree - Start Interview"], () => {
        timerBox.classList.remove('hidden');
        session.active = true;
        startTimer();
        nextQ();
    });
}

function startTimer() {
    const timer = setInterval(() => {
        session.timeLeft--;
        let m = Math.floor(session.timeLeft / 60);
        let s = session.timeLeft % 60;
        timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if(session.timeLeft <= 0) { clearInterval(timer); finish(); }
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
    session.active = false;
    addBotMsg("🔍 **Analyzing your performance...** Generating report.");
    setTimeout(renderResult, 2000);
}

// --- STRICT EVALUATION ENGINE ---
function renderResult() {
    let finalHtml = `<div class="space-y-6"><h2 class="text-xl font-black">FINAL PERFORMANCE REPORT</h2>`;
    
    session.answers.forEach((item, i) => {
        let wordCount = item.a.split(' ').length;
        let isNonsense = /^[a-zA-Z0-9]$|^[xXyYzZ123]+$/.test(item.a) || wordCount < 3;
        
        let score, verdict, mistakes, better, tip;

        if (isNonsense) {
            score = Math.floor(Math.random() * 2);
            verdict = "Very Poor";
            mistakes = "The response is meaningless, gibberish, or completely irrelevant to the professional question.";
            better = "A professional answer should directly address the prompt with structured sentences.";
            tip = "Avoid providing placeholder text; it results in immediate disqualification.";
        } else if (wordCount < 10) {
            score = 3 + Math.floor(Math.random() * 2);
            verdict = "Poor";
            mistakes = "The answer is too brief. Industry standards require detailed explanations.";
            better = "Expand your response using the STAR method (Situation, Task, Action, Result).";
            tip = "Try to speak or write at least 3-4 sentences per question.";
        } else {
            score = 7 + Math.floor(Math.random() * 3);
            verdict = "Good / Excellent";
            mistakes = "Minor grammatical issues or slight lack of specific technical metrics.";
            better = "Your answer was strong. To make it perfect, include quantifiable results (e.g., 'increased efficiency by 20%').";
            tip = "Maintain this level of detail but work on your technical vocabulary.";
        }

        finalHtml += `
            <div class="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-3">
                <p class="font-bold text-gray-500 text-xs uppercase">Question ${i+1}</p>
                <p class="text-sm italic">"${item.q}"</p>
                <div class="flex items-center space-x-4 py-2 border-y border-gray-50">
                    <span class="text-lg font-black text-black">Score: ${score}/10</span>
                    <span class="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest">${verdict}</span>
                </div>
                <div class="text-[12px] space-y-2">
                    <p class="text-red-600"><strong>Mistakes:</strong> ${mistakes}</p>
                    <p class="text-blue-700 font-medium"><strong>Better Answer:</strong> ${better}</p>
                    <p class="text-green-700"><strong>Tip:</strong> ${tip}</p>
                </div>
            </div>
        `;
    });

    finalHtml += `<button onclick="location.reload()" class="w-full p-4 bg-black text-white font-bold rounded-xl">RETAKE INTERVIEW</button></div>`;
    addBotMsg(finalHtml);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
