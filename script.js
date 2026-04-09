const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

// 🔴 === PUT YOUR OPENAI API KEY HERE FOR REAL AI === 🔴
const OPENAI_API_KEY = "AIzaSyBnUTN-qvgBt_TQZHojBVziubIeKPy7Bws"; 

// --- YOUR CODING DATABASE ---
const codingDB = {
    basics: ["What is an array and how is it stored in memory?", "Difference between stack and queue?", "What is string immutability?", "Explain loops with an example"],
    logic: ["How would you find duplicate elements in an array?", "Explain binary search step by step", "How does recursion work?", "How would you reverse an array logically?"],
    coding: ["Write code to reverse a string", "Find the largest element in an array", "Check if a string is palindrome", "Find factorial using recursion"],
    advanced: ["Explain Dijkstra’s Algorithm", "What is Dynamic Programming?", "Difference between BFS and DFS", "Solve longest increasing subsequence problem"]
};

const hrPool = ["Tell me about a time you handled a crisis.", "Why should we hire you for this specific role?", "Describe a conflict with a teammate and how you resolved it.", "What is your greatest professional achievement?", "Where do you see yourself in 5 years?"];

// --- SESSION STATE ---
let usedQuestions = new Set();
let timerInterval; 
let session = { data: {}, questions: [], answers: [], currentIndex: 0, active: false, timeLeft: 45 * 60 };

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

// --- AI EVALUATION LOGIC ---
async function evaluateAnswer(question, answer, roundType) {
    const isCoding = roundType === "Coding Round";
    const wordCount = answer.split(' ').length;

    // FALLBACK: If no API key is provided, use a built-in strict Mock Grader so the UI still works
    if(OPENAI_API_KEY === "YOUR_API_KEY_HERE" || !OPENAI_API_KEY) {
        let score = wordCount < 10 ? Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 3);
        return { 
            score: score, 
            verdict: score < 5 ? "Poor" : "Average", 
            mistakes: wordCount < 10 ? "Answer is far too short to evaluate. Lacks any professional detail." : "Answer lacks specific metrics, deeper technical logic, or a structured approach.", 
            missing_points: "Detailed context, edge cases, and proper professional framing.",
            logic_feedback: "Logic is vague or incomplete.",
            code_feedback: "No structured code provided.",
            time_complexity: "N/A",
            better_solution: "Provide a multi-step logical breakdown using industry standard practices.",
            improved_answer: "Provide a multi-step logical breakdown using industry standard practices.",
            tip: "Speak in complete sentences and explain the 'WHY', not just the 'WHAT'." 
        };
    }

    // REAL AI CALL
    const systemPrompt = isCoding ? 
        `You are a STRICT coding interviewer. Evaluate Logic, Correctness, Clarity, and Time Complexity. Rules: 1. Wrong logic -> score < 5. 2. No code/explanation -> max 4. 3. Nonsense -> 0-2. Return strictly JSON: {"score": 0, "verdict": "Poor/Average/Good", "logic_feedback": "...", "code_feedback": "...", "time_complexity": "...", "better_solution": "...", "tip": "..."}` : 
        `You are a STRICT professional HR interviewer. Evaluate critically. Rules: 1. Short/vague/nonsense -> score 0-3. 2. Good structure/examples -> 8+. Return strictly JSON: {"score": 0, "verdict": "Poor/Average/Good", "mistakes": "...", "missing_points": "...", "improved_answer": "...", "tip": "..."}`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [ { role: "system", content: systemPrompt }, { role: "user", content: `Question: ${question}\nAnswer: ${answer}` } ],
                temperature: 0.2
            })
        });
        const data = await response.json();
        const cleanJson = data.choices[0].message.content.trim().replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        return { score: 0, verdict: "Error", mistakes: "AI Connection Failed", tip: "Check your internet or API key.", logic_feedback: "AI Connection Failed" };
    }
}

// --- UI HELPERS ---
function addBotMsg(text, isHtml = false) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2 mt-4";
    div.innerHTML = `<div class="flex items-center space-x-2"><div class="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
                     <div class="bg-gray-50 border border-gray-100 text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[95%] text-sm leading-relaxed">${isHtml ? text : text.replace(/\n/g, '<br>')}</div>`;
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
    addBotMsg(`**INSTRUCTIONS:**\n1. Round: ${session.data.round}\n2. Questions: ${session.questions.length}\n3. Time: 45 Minutes\n4. Strict AI Evaluation provided instantly after every answer.\n5. Use 'End Interview' anytime to stop early.`);
    showBtns(["I Agree - Start Interview"], () => {
        timerBox.classList.remove('hidden');
        
        // --- ADD END BUTTON TO HEADER ---
        if(!document.getElementById('end-btn')) {
            const endBtn = document.createElement('button');
            endBtn.id = "end-btn";
            endBtn.className = "ml-4 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[11px] font-bold shadow transition-all";
            endBtn.innerText = "End Interview";
            endBtn.onclick = finish;
            timerBox.appendChild(endBtn); // Puts it right next to the timer
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

// --- SUBMIT ANSWER & INSTANT FEEDBACK ---
sendBtn.onclick = async () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);
        userInput.value = '';
        
        // Block UI while evaluating
        sendBtn.disabled = true;
        userInput.disabled = true;
        const loadingMsg = document.createElement('div');
        loadingMsg.className = "text-[11px] text-gray-500 italic mt-2 ml-10";
        loadingMsg.innerText = "Evaluating critically... (Please wait)";
        chatContent.appendChild(loadingMsg);
        chatContent.scrollIntoView({ behavior: 'smooth' });

        const currentQ = session.questions[session.currentIndex];
        
        // Fetch AI Eval
        const evaluation = await evaluateAnswer(currentQ, val, session.data.round);
        
        loadingMsg.remove(); // Remove loading text
        session.answers.push({ q: currentQ, a: val, eval: evaluation });
        
        // Format Instant Feedback Card
        let color = evaluation.score >= 8 ? 'text-green-600' : evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600';
        let feedbackHtml = `
            <div class="border-l-4 ${evaluation.score >= 8 ? 'border-green-500' : 'border-red-500'} pl-4 space-y-2 py-1">
                <p class="font-bold text-[10px] text-gray-500 uppercase tracking-wider">⚡ Immediate Feedback</p>
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-black ${color}">Score: ${evaluation.score}/10</span>
                    <span class="px-2 py-0.5 bg-gray-200 text-black rounded text-[9px] font-bold uppercase">${evaluation.verdict}</span>
                </div>`;

        if (session.data.round === "HR Round") {
            feedbackHtml += `<p class="text-[12px] text-red-700"><strong>Mistakes:</strong> ${evaluation.mistakes}</p>
                             <p class="text-[12px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p></div>`;
        } else {
            feedbackHtml += `<p class="text-[12px] text-red-700"><strong>Logic:</strong> ${evaluation.logic_feedback}</p>
                             <p class="text-[12px] text-purple-700"><strong>Time Complexity:</strong> ${evaluation.time_complexity}</p>
                             <p class="text-[12px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p></div>`;
        }

        addBotMsg(feedbackHtml, true);
        
        session.currentIndex++;
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
        
        // Move to next question after 3.5 seconds
        setTimeout(nextQ, 3500); 
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
            
            if (session.data.round === "HR Round") {
                finalHtml += `<p class="text-[12px] text-green-800 bg-green-50 p-3 rounded-lg"><strong>Ideal Answer:</strong><br>${ev.improved_answer}</p></div>`;
            } else {
                finalHtml += `<p class="text-[12px] text-green-800 bg-green-50 p-3 rounded-lg"><strong>Optimal Code/Solution:</strong><br>${ev.better_solution}</p></div>`;
            }
        });
    }

    finalHtml += `<button onclick="location.reload()" class="mt-6 w-full p-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all">RETAKE NEW INTERVIEW</button></div>`;
    addBotMsg(finalHtml, true);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
