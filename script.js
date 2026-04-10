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

// --- STRICT LOCAL EVALUATION (SKILL BASED, NO MARKS) ---
function evaluateAnswerLocally(answerText, roundType) {
    const words = answerText.trim().split(/\s+/).length;
    const isNonsense = /^[a-zA-Z0-9]$|^[xXyYzZ123]+$/.test(answerText);
    
    let comm, tech, logic, clarity, verdict, feedback, tip;

    if (isNonsense || words < 5) {
        comm = 15; tech = 10; logic = 10; clarity = 20;
        verdict = "Needs Major Work";
        feedback = "Answer is irrelevant, too short, or lacks professional structure.";
        tip = "Never give one-word or overly brief answers in a real interview.";
    } else if (words < 15) {
        comm = 40; tech = 35; logic = 30; clarity = 50;
        verdict = "Below Average";
        feedback = "Answer is too brief. Missing deeper reasoning and context.";
        tip = "Expand your reasoning. Explain the 'why' and 'how'.";
    } else if (words < 30) {
        comm = 75; tech = 65; logic = 70; clarity = 80;
        verdict = "Solid Answer";
        feedback = "Good fundamental explanation, but missing specific edge cases or metrics.";
        tip = "Use the STAR method for HR, or mention Big-O complexity for coding.";
    } else {
        comm = 95; tech = 85; logic = 90; clarity = 95;
        verdict = "Excellent";
        feedback = "Very detailed and well-structured response. Demonstrates clear understanding.";
        tip = "Maintain this level of depth consistently.";
    }

    // Add slight random variance for realism
    tech += Math.floor(Math.random() * 10);
    logic += Math.floor(Math.random() * 10);

    return { 
        metrics: { comm: Math.min(comm, 100), tech: Math.min(tech, 100), logic: Math.min(logic, 100), clarity: Math.min(clarity, 100) }, 
        verdict, feedback, tip 
    };
}

// --- UI HELPERS ---
function addBotMsg(text, isHtml = false) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2 mt-4";
    div.innerHTML = `<div class="flex items-center space-x-2"><div class="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
                     <div class="bg-white border border-gray-100 shadow-sm text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[95%] text-sm leading-relaxed">${isHtml ? text : text.replace(/\n/g, '<br>')}</div>`;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-end w-full mt-4";
    div.innerHTML = `<div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 px-6 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-xl">${text}</div>`;
    chatContent.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function showBtns(opts, cb) {
    optionsArea.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = "flex flex-wrap gap-2 pb-2 w-full justify-start";
    opts.forEach(o => {
        const b = document.createElement('button');
        b.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm";
        b.innerText = o;
        b.onclick = () => { addUserMsg(o); optionsArea.innerHTML = ''; cb(o); };
        wrapper.appendChild(b);
    });
    optionsArea.appendChild(wrapper);
}

// MULTI-SELECT UI FUNCTION
function showMultiSelectBtns(opts, cb) {
    optionsArea.innerHTML = '';
    let selected = new Set();
    
    const wrapper = document.createElement('div');
    wrapper.className = "flex flex-col gap-3 w-full bg-white p-4 border border-gray-100 rounded-2xl shadow-lg mb-2";

    const btnContainer = document.createElement('div');
    btnContainer.className = "flex flex-wrap gap-2";
    
    opts.forEach(o => {
        const b = document.createElement('button');
        b.className = "px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-600 hover:border-indigo-400 transition-all";
        b.innerText = o;
        b.onclick = () => {
            if(selected.has(o)) {
                selected.delete(o);
                b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
                b.classList.add('bg-gray-50', 'text-gray-600', 'border-gray-200');
            } else {
                selected.add(o);
                b.classList.remove('bg-gray-50', 'text-gray-600', 'border-gray-200');
                b.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
            }
        };
        btnContainer.appendChild(b);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = "w-full py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs shadow-md transition-all mt-2";
    confirmBtn.innerText = "Confirm Selection";
    confirmBtn.onclick = () => {
        if(selected.size === 0) return; 
        const arr = Array.from(selected);
        addUserMsg(arr.join(', '));
        optionsArea.innerHTML = '';
        cb(arr);
    };

    wrapper.appendChild(btnContainer);
    wrapper.appendChild(confirmBtn);
    optionsArea.appendChild(wrapper);
}

// --- APP FLOW ---
function init() {
    addBotMsg("Welcome. This is a simulated interview environment designed to help you prepare for real placements.");
    setTimeout(() => {
        addBotMsg("Let's configure your session. Are you an Engineering or BCC student?");
        showBtns(["Engineering Student", "BCC Student"], (v) => { session.data.type = v; askYear(); });
    }, 1500);
}

function askYear() {
    addBotMsg("Which year are you in?");
    showBtns(["1st Year", "2nd Year", "3rd Year", "4th Year"], (v) => { session.data.year = v; askSector(); });
}

function askSector() {
    addBotMsg("Which types of companies are you targeting? (Select all that apply)");
    showMultiSelectBtns(["MAANG", "Private Sector", "Consultancy", "Startups", "FinTech"], (arr) => {
        session.data.sectors = arr;
        if(arr.includes("MAANG")) askMaangCompanies();
        else askRound();
    });
}

function askMaangCompanies() {
    addBotMsg("You selected MAANG. Which specific companies are you aiming for?");
    showMultiSelectBtns(["Microsoft", "Amazon", "Apple", "Meta", "Google", "Netflix"], (arr) => {
        session.data.maangFocus = arr;
        askRound();
    });
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
    addBotMsg(`Instructions:\n1. Round: ${session.data.round}\n2. Questions: ${session.questions.length}\n3. Time: 45 Minutes\n4. Analytics provided instantly after every answer.\n5. Click 'End Interview' anytime to stop and see your Chart Analysis.`);
    showBtns(["Start Interview"], () => {
        timerBox.classList.remove('hidden');
        
        if(!document.getElementById('end-btn')) {
            const endBtn = document.createElement('button');
            endBtn.id = "end-btn";
            endBtn.className = "ml-4 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[11px] font-bold shadow transition-all cursor-pointer";
            endBtn.innerText = "End Interview";
            endBtn.onclick = finish; 
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
        addBotMsg(`Question ${session.currentIndex + 1}:\n${session.questions[session.currentIndex]}`);
    } else {
        finish();
    }
}

// --- SUBMIT ANSWER & INSTANT ANALYTICS ---
sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);
        userInput.value = '';
        
        sendBtn.disabled = true;
        userInput.disabled = true;

        const currentQ = session.questions[session.currentIndex];
        const evaluation = evaluateAnswerLocally(val, session.data.round);
        session.answers.push({ q: currentQ, a: val, eval: evaluation });
        
        setTimeout(() => {
            const m = evaluation.metrics;
            let feedbackHtml = `
                <div class="bg-gray-50 p-4 rounded-xl space-y-3 mt-2 w-full border border-gray-200">
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-[10px] text-gray-500 uppercase">⚡ Skill Analysis</p>
                        <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase">${evaluation.verdict}</span>
                    </div>
                    
                    <div class="space-y-1.5">
                        <div class="text-[10px] font-bold text-gray-600 flex justify-between"><span>Technical Depth</span><span>${m.tech}%</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width: ${m.tech}%"></div></div>
                        
                        <div class="text-[10px] font-bold text-gray-600 flex justify-between"><span>Communication</span><span>${m.comm}%</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5"><div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${m.comm}%"></div></div>
                    </div>

                    <p class="text-[11px] text-gray-700 mt-2"><strong>Analysis:</strong> ${evaluation.feedback}</p>
                    <p class="text-[11px] text-blue-700"><strong>Tip:</strong> ${evaluation.tip}</p>
                </div>`;

            addBotMsg(feedbackHtml, true);
            
            session.currentIndex++;
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
            
            setTimeout(nextQ, 3500); 

        }, 800); 
    }
};

function finish() {
    clearInterval(timerInterval); 
    session.active = false;
    const endBtn = document.getElementById('end-btn');
    if(endBtn) endBtn.remove();
    addBotMsg("Interview Ended. Generating your performance dashboard...");
    setTimeout(renderResult, 2000);
}

// --- FINAL DASHBOARD (CHARTS / NO MARKS) ---
function renderResult() {
    if (session.answers.length === 0) {
        addBotMsg("You ended the interview before answering any questions. Reload to try again.");
        return;
    }

    // Calculate Averages
    let totals = { comm: 0, tech: 0, logic: 0, clarity: 0 };
    session.answers.forEach(ans => {
        totals.comm += ans.eval.metrics.comm;
        totals.tech += ans.eval.metrics.tech;
        totals.logic += ans.eval.metrics.logic;
        totals.clarity += ans.eval.metrics.clarity;
    });

    const count = session.answers.length;
    const avg = {
        comm: Math.round(totals.comm / count),
        tech: Math.round(totals.tech / count),
        logic: Math.round(totals.logic / count),
        clarity: Math.round(totals.clarity / count)
    };

    let overallRating = (avg.comm + avg.tech + avg.logic) / 3;
    let readiness = overallRating > 80 ? "Interview Ready" : overallRating > 50 ? "Needs Practice" : "Requires Major Prep";
    let readinessColor = overallRating > 80 ? "text-green-600 bg-green-100" : overallRating > 50 ? "text-yellow-600 bg-yellow-100" : "text-red-600 bg-red-100";

    let finalHtml = `
    <div class="space-y-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl">
        <div class="text-center pb-4 border-b border-gray-100">
            <h2 class="text-lg font-black text-gray-800 uppercase tracking-wide">Performance Dashboard</h2>
            <p class="text-[12px] text-gray-500 mt-1">Based on ${count} answered question(s)</p>
            <div class="mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-bold ${readinessColor}">${readiness}</div>
        </div>

        <div class="space-y-4 pt-2">
            <div>
                <div class="flex justify-between text-[11px] font-bold text-gray-600 mb-1"><span>Technical / Core Knowledge</span><span>${avg.tech}%</span></div>
                <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000" style="width: ${avg.tech}%"></div></div>
            </div>
            <div>
                <div class="flex justify-between text-[11px] font-bold text-gray-600 mb-1"><span>Communication & Formatting</span><span>${avg.comm}%</span></div>
                <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-1000" style="width: ${avg.comm}%"></div></div>
            </div>
            <div>
                <div class="flex justify-between text-[11px] font-bold text-gray-600 mb-1"><span>Logical Structuring</span><span>${avg.logic}%</span></div>
                <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000" style="width: ${avg.logic}%"></div></div>
            </div>
            <div>
                <div class="flex justify-between text-[11px] font-bold text-gray-600 mb-1"><span>Clarity & Confidence</span><span>${avg.clarity}%</span></div>
                <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000" style="width: ${avg.clarity}%"></div></div>
            </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-xl mt-4">
            <h3 class="text-[11px] font-bold text-gray-500 uppercase mb-2">Final Assessor Summary</h3>
            <p class="text-xs text-gray-700 leading-relaxed">
                ${overallRating > 80 ? "Outstanding performance. Your structuring and details align well with top-tier company expectations." : 
                  overallRating > 50 ? "You have a solid foundation, but you need to expand your answers with deeper metrics, edge cases, and clearer methodologies." : 
                  "Your responses were too brief to evaluate properly. Focus on the STAR method for behavioral questions and step-by-step logic for technical ones."}
            </p>
        </div>

        <button onclick="location.reload()" class="w-full py-4 bg-black text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition-all text-sm mt-2">START NEW SESSION</button>
    </div>`;
    
    addBotMsg(finalHtml, true);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
