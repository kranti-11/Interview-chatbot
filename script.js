const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

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

// --- STRICT LOCAL EVALUATION (NO API KEY NEEDED) ---
function evaluateAnswerLocally(answerText, roundType) {
    const words = answerText.trim().split(/\s+/).length;
    const isNonsense = /^[a-zA-Z0-9]$|^[xXyYzZ123]+$/.test(answerText);
    
    let score, verdict, mistakes, better, tip;

    if (isNonsense || words < 5) {
        score = Math.floor(Math.random() * 3); // Score 0-2
        verdict = "Very Poor";
        mistakes = "Answer is irrelevant, extremely short, or nonsense.";
        better = "Provide a structured, multi-sentence professional answer.";
        tip = "Never give one-word or nonsense answers in an interview.";
    } else if (words < 15) {
        score = 3 + Math.floor(Math.random() * 3); // Score 3-5
        verdict = "Poor";
        mistakes = "Answer is too brief and lacks deep logical explanation.";
        better = "Expand on your reasoning. Include 'why' and 'how', not just 'what'.";
        tip = "Aim for at least 3-4 detailed sentences.";
    } else if (words < 30) {
        score = 6 + Math.floor(Math.random() * 2); // Score 6-7
        verdict = "Average";
        mistakes = "Good start, but missing edge cases, time complexity, or specific examples.";
        better = "Include specific technical terms or STAR method metrics.";
        tip = "Structure your answer cleanly with a clear beginning, middle, and end.";
    } else {
        score = 8 + Math.floor(Math.random() * 3); // Score 8-10
        verdict = score >= 9 ? "Excellent" : "Good";
        mistakes = "Minor lack of advanced optimization details.";
        better = "Perfect answer. Keep this level of detail consistently.";
        tip = "Great job! You communicated your logic very clearly.";
    }

    return { score, verdict, mistakes, better, tip };
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
    addBotMsg(`**INSTRUCTIONS:**\n1. Round: ${session.data.round}\n2. Questions: ${session.questions.length}\n3. Time: 45 Minutes\n4. Strict Evaluation provided INSTANTLY after every answer.\n5. Click 'End Interview' anytime to stop.`);
    showBtns(["Start Interview"], () => {
        timerBox.classList.remove('hidden');
        
        // 🔴 ADD 'END INTERVIEW' BUTTON NEXT TO TIMER 🔴
        if(!document.getElementById('end-btn')) {
            const endBtn = document.createElement('button');
            endBtn.id = "end-btn";
            endBtn.className = "ml-4 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[11px] font-bold shadow transition-all cursor-pointer";
            endBtn.innerText = "End Interview";
            endBtn.onclick = finish; // Ends the interview instantly when clicked
            
            // Append it securely to the header next to the timer
            timerBox.parentElement.appendChild(endBtn);
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

// 🔴 SUBMIT ANSWER & GIVE IMMEDIATE FEEDBACK 🔴
sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);
        userInput.value = '';
        
        // Block UI briefly to simulate reading the answer
        sendBtn.disabled = true;
        userInput.disabled = true;

        const currentQ = session.questions[session.currentIndex];
        
        // Get Strict Local Evaluation immediately
        const evaluation = evaluateAnswerLocally(val, session.data.round);
        session.answers.push({ q: currentQ, a: val, eval: evaluation });
        
        // Render the Immediate Feedback Card
        setTimeout(() => {
            let color = evaluation.score >= 8 ? 'text-green-600' : evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600';
            let borderColor = evaluation.score >= 8 ? 'border-green-500' : evaluation.score >= 5 ? 'border-yellow-500' : 'border-red-500';
            
            let feedbackHtml = `
                <div class="border-l-4 ${borderColor} bg-white p-4 shadow-sm rounded-r-xl space-y-2 mt-2 w-[90%]">
                    <p class="font-bold text-[10px] text-gray-500 uppercase tracking-wider">⚡ Immediate Strict Feedback</p>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm font-black ${color}">Score: ${evaluation.score}/10</span>
                        <span class="px-2 py-0.5 bg-gray-200 text-black rounded text-[9px] font-bold uppercase">${evaluation.verdict}</span>
                    </div>
                    <p class="text-[12px] text-red-700"><strong>Critique:</strong> ${evaluation.mistakes}</p>
                    <p class="text-[12px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p>
                </div>`;

            addBotMsg(feedbackHtml, true);
            
            // Move to next question automatically
            session.currentIndex++;
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
            
            // Drop the next question 2.5 seconds after showing feedback
            setTimeout(nextQ, 2500); 

        }, 800); // 0.8 second delay to feel like the AI is "thinking"
    }
};

function finish() {
    clearInterval(timerInterval); 
    session.active = false;
    
    // Hide the end button
    const endBtn = document.getElementById('end-btn');
    if(endBtn) endBtn.remove();

    addBotMsg("🔍 **Interview Ended. Compiling final summary...**");
    setTimeout(renderResult, 2000);
}

function renderResult() {
    let finalHtml = `<div class="space-y-6"><h2 class="text-xl font-black">FINAL EVALUATION REPORT</h2>`;
    
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
                    </div>
                    <p class="text-[12px] text-green-800 bg-green-50 p-3 rounded-lg"><strong>Ideal Structure:</strong><br>${ev.better}</p>
                </div>`;
        });
    }

    finalHtml += `<button onclick="location.reload()" class="mt-6 w-full p-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all cursor-pointer">RETAKE NEW INTERVIEW</button></div>`;
    addBotMsg(finalHtml, true);
}

// Allow pressing "Enter" to send message
userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
