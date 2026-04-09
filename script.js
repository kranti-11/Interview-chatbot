const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

// 🔴 === PUT YOUR OPENAI API KEY HERE === 🔴
const OPENAI_API_KEY = "AIzaSyBnUTN-qvgBt_TQZHojBVziubIeKPy7Bws"; 

// --- YOUR CODING DATABASE ---
const codingDB = {
    basics: ["What is an array and how is it stored in memory?", "Difference between stack and queue?", "What is string immutability?", "Explain loops with an example"],
    logic: ["How would you find duplicate elements in an array?", "Explain binary search step by step", "How does recursion work?", "How would you reverse an array logically?"],
    coding: ["Write code to reverse a string", "Find the largest element in an array", "Check if a string is palindrome", "Find factorial using recursion"],
    advanced: ["Explain Dijkstra’s Algorithm", "What is Dynamic Programming?", "Difference between BFS and DFS", "Solve longest increasing subsequence problem"]
};

const hrPool = [
    "Tell me about a time you handled a crisis.", "Why should we hire you for this specific role?", "Describe a conflict with a teammate and how you resolved it.", "What is your greatest professional achievement?", "Where do you see yourself in 5 years?"
];

// --- SESSION STATE ---
let usedQuestions = new Set();
let timerInterval; 
let session = { data: {}, questions: [], answers: [], currentIndex: 0, active: false, timeLeft: 45 * 60 };

// --- PROMPTS ---
const hrPrompt = `You are a STRICT professional interviewer from a top tech company.
Your job is to evaluate answers critically, not politely.
RULES:
1. Be strict and realistic.
2. Do NOT give high scores for weak answers.
3. If answer is irrelevant, too short, vague, or nonsense -> Score MUST be between 0-3 ONLY.
4. Only give score 8+ if answer is detailed, well structured, professional, and includes examples/logic.
5. If answer length < 10 meaningful words -> treat as POOR.
Evaluate and return STRICTLY in this JSON format ONLY (No markdown formatting, no extra text):
{
  "score": 0,
  "verdict": "Very Poor / Poor / Average / Good / Excellent",
  "mistakes": "What is wrong in the answer",
  "missing_points": "What important things are missing",
  "improved_answer": "Write a strong professional answer",
  "tip": "Actionable improvement advice"
}`;

const codingPrompt = `You are a STRICT coding interviewer.
Evaluate the candidate's answer based on Logic, Correctness, Clarity, and Time Complexity.
RULES:
1. Wrong logic -> score below 5
2. No code or no explanation -> max 4
3. Nonsense answer -> 0-2
4. Only excellent structured answers -> 8+
Evaluate and return STRICTLY in this JSON format ONLY (No markdown formatting, no extra text):
{
  "score": 0,
  "verdict": "Very Poor / Poor / Average / Good / Excellent",
  "logic_feedback": "Critique of the logic used",
  "code_feedback": "Critique of the code/syntax (if any)",
  "time_complexity": "Expected time complexity vs provided",
  "better_solution": "Write the optimal solution",
  "tip": "Actionable improvement advice"
}`;

// --- LOGIC FUNCTIONS ---
function getRandomQuestion(arr) {
    let available = arr.filter(q => !usedQuestions.has(q));
    if (available.length === 0) { usedQuestions.clear(); available = arr; }
    const q = available[Math.floor(Math.random() * available.length)];
    usedQuestions.add(q);
    return q;
}

function generateInterviewSet(type, level) {
    if (type === "HR Round") return hrPool.sort(() => 0.5 - Math.random()).slice(0, 5);
    if (level === "Easy") return [getRandomQuestion(codingDB.basics), getRandomQuestion(codingDB.logic)];
    if (level === "Moderate") return [getRandomQuestion(codingDB.basics), getRandomQuestion(codingDB.logic), getRandomQuestion(codingDB.coding)];
    if (level === "Hard") return [getRandomQuestion(codingDB.logic), getRandomQuestion(codingDB.coding), getRandomQuestion(codingDB.advanced)];
}

// --- REAL AI EVALUATION LOGIC ---
async function evaluateAnswerWithAI(question, answer, roundType) {
    const isCoding = roundType === "Coding Round";
    const systemPrompt = isCoding ? codingPrompt : hrPrompt;
    
    // Safety check if key is missing
    if(OPENAI_API_KEY === "YOUR_API_KEY_HERE" || !OPENAI_API_KEY) {
        return { score: 0, verdict: "API Error", mistakes: "API KEY MISSING", tip: "Developer needs to add OpenAI API Key to script.js", logic_feedback: "API KEY MISSING" };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();
        const aiText = data.choices[0].message.content.trim();
        
        // Remove Markdown codeblock formatting if AI accidentally adds it
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Eval Error:", error);
        return { score: 0, verdict: "Error", mistakes: "Failed to connect to AI Server.", tip: "Try again later.", logic_feedback: "Failed to connect." };
    }
}

// --- UI HELPERS ---
function addBotMsg(text, isHtml = false) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2 mt-4";
    const content = isHtml ? text : text.replace(/\n/g, '<br>');
    div.innerHTML = `
        <div class="flex items-center space-x-2"><div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
        <div class="bg-gray-50 border border-gray-100 text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[95%] text-sm leading-relaxed">${content}</div>
    `;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-end w-full mt-4";
    div.innerHTML = `<div class="bg-black text-white p-4 px-6 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-xl">${text}</div>`;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function showBtns(opts, cb) {
    optionsArea.innerHTML = '';
    opts.forEach(o => {
        const b = document.createElement('button');
        b.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold hover:bg-black hover:text-white transition-all shadow-sm m-1";
        b.innerText = o;
        b.onclick = () => { addUserMsg(o); optionsArea.innerHTML = ''; cb(o); };
        optionsArea.appendChild(b);
    });
}

// --- APP FLOW ---
function init() {
    addBotMsg("Welcome to INTERVIEW PREP. Are you an **Engineering** or **BCC** student?");
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
        if(v === "HR Round") { session.questions = generateInterviewSet("HR Round"); showInstructions(); } 
        else { askDifficulty(); }
    });
}

function askDifficulty() {
    addBotMsg("Select Difficulty Level for the Coding Round:");
    showBtns(["Easy", "Moderate", "Hard"], (v) => { session.data.level = v; session.questions = generateInterviewSet("Coding Round", v); showInstructions(); });
}

function showInstructions() {
    addBotMsg(`**INSTRUCTIONS:**\n1. Round: ${session.data.round}\n2. Questions: ${session.questions.length}\n3. Time: 45 Minutes\n4. Rule: AI Evaluation will be provided after every answer.\n5. Click 'End Interview' anytime to stop early.`);
    showBtns(["I Agree - Start Interview"], () => {
        timerBox.classList.remove('hidden');
        if(!document.getElementById('end-btn')) {
            const header = timerBox.parentElement;
            const rightControls = document.createElement('div');
            rightControls.className = "flex items-center space-x-3";
            rightControls.id = "header-controls";
            header.replaceChild(rightControls, timerBox);
            rightControls.appendChild(timerBox);
            const endBtn = document.createElement('button');
            endBtn.id = "end-btn";
            endBtn.className = "px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[11px] font-bold shadow-md transition-all";
            endBtn.innerText = "End Interview";
            endBtn.onclick = () => finish();
            rightControls.appendChild(endBtn);
        }
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
        if(session.timeLeft <= 0) { clearInterval(timerInterval); finish(); }
    }, 1000);
}

function nextQ() {
    if(session.currentIndex < session.questions.length) {
        addBotMsg(`**Question ${session.currentIndex + 1}:**\n${session.questions[session.currentIndex]}`);
    } else {
        finish();
    }
}

// --- SUBMIT ANSWER (ASYNC AI CALL) ---
sendBtn.onclick = async () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);
        userInput.value = '';
        
        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = "text-[11px] text-gray-500 italic mt-2 ml-2";
        loadingDiv.innerText = "Evaluating critically... (This may take a few seconds)";
        chatContent.appendChild(loadingDiv);
        chatContent.scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        // Disable input while AI is thinking
        sendBtn.disabled = true;
        userInput.disabled = true;

        const currentQ = session.questions[session.currentIndex];
        
        // Fetch AI Evaluation
        const evaluation = await evaluateAnswerWithAI(currentQ, val, session.data.round);
        
        loadingDiv.remove(); // Remove loading state
        
        session.answers.push({ q: currentQ, a: val, eval: evaluation });
        
        // Build Instant Feedback HTML dynamically based on round type
        let feedbackHtml = `<div class="space-y-2">
            <p class="font-bold text-[11px] text-gray-500 uppercase">⚡ Strict AI Feedback</p>
            <div class="flex items-center space-x-3 py-1">
                <span class="text-sm font-black ${evaluation.score >= 8 ? 'text-green-600' : evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600'}">Score: ${evaluation.score}/10</span>
                <span class="px-2 py-0.5 bg-black text-white rounded text-[9px] font-bold uppercase">${evaluation.verdict}</span>
            </div>`;

        if (session.data.round === "HR Round") {
            feedbackHtml += `
                <p class="text-[12px] text-red-600"><strong>Critique:</strong> ${evaluation.mistakes}</p>
                <p class="text-[12px] text-yellow-700"><strong>Missing Points:</strong> ${evaluation.missing_points}</p>
                <p class="text-[12px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p>
            </div>`;
        } else {
            feedbackHtml += `
                <p class="text-[12px] text-red-600"><strong>Logic:</strong> ${evaluation.logic_feedback}</p>
                <p class="text-[12px] text-red-500"><strong>Code:</strong> ${evaluation.code_feedback}</p>
                <p class="text-[12px] text-purple-700"><strong>Time Complexity:</strong> ${evaluation.time_complexity}</p>
                <p class="text-[12px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p>
            </div>`;
        }

        addBotMsg(feedbackHtml, true);
        
        session.currentIndex++;
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
        
        setTimeout(nextQ, 3000); 
    }
};

function finish() {
    clearInterval(timerInterval); 
    session.active = false;
    const endBtn = document.getElementById('end-btn');
    if(endBtn) endBtn.remove();
    addBotMsg("🔍 **Interview Ended. Compiling final summary...**");
    setTimeout(renderResult, 2000);
}

function renderResult() {
    let finalHtml = `<div class="space-y-6"><h2 class="text-xl font-black">FINAL AI EVALUATION REPORT</h2>`;
    
    if (session.answers.length === 0) {
        finalHtml += `<p class="text-sm text-gray-500">You ended the interview before answering.</p>`;
    } else {
        session.answers.forEach((item, i) => {
            const ev = item.eval;
            finalHtml += `
                <div class="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-3 mt-4">
                    <p class="font-bold text-gray-400 text-[10px] uppercase">Question ${i+1}</p>
                    <p class="text-[13px] font-medium italic">"${item.q}"</p>
                    <div class="flex items-center space-x-3 py-2 border-y border-gray-50">
                        <span class="text-lg font-black">Score: ${ev.score}/10</span>
                        <span class="px-2 py-1 bg-black text-white rounded text-[9px] font-bold uppercase">${ev.verdict}</span>
                    </div>`;
            
            // Render Perfect Solution based on round
            if (session.data.round === "HR Round") {
                finalHtml += `<p class="text-[12px] text-green-700 bg-green-50 p-3 rounded-lg border border-green-100"><strong>Ideal Answer:</strong><br>${ev.improved_answer}</p></div>`;
            } else {
                finalHtml += `<p class="text-[12px] text-green-700 bg-green-50 p-3 rounded-lg border border-green-100"><strong>Optimal Code/Solution:</strong><br>${ev.better_solution}</p></div>`;
            }
        });
    }

    finalHtml += `<button onclick="location.reload()" class="mt-6 w-full p-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all">RETAKE NEW INTERVIEW</button></div>`;
    addBotMsg(finalHtml, true);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
