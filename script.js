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

// 🔥 STRICT GARBAGE DETECTOR 🔥
function isGarbage(answer) {
    const text = answer.trim();
    return (
        text.length < 10 ||
        /^[a-z]{1,6}$/i.test(text) ||
        !/[a-zA-Z]/.test(text) ||
        text.split(" ").length < 3
    );
}

// --- INTELLIGENT SCORING ENGINE ---
function evaluateAnswerLocally(answerText, questionText) {
    const text = answerText.trim().toLowerCase();
    const words = text.split(/\s+/).length;
    let comm, tech, logic, clarity, verdict, feedback, tip;

    // 🌟 CUSTOM EVALUATION FOR: "Find duplicate elements in an array" 🌟
    if (questionText === "How would you find duplicate elements in an array?") {
        const hasHashing = text.includes("hash") || text.includes("set") || text.includes("map") || text.includes("o(n)");
        const hasSorting = text.includes("sort") || text.includes("n log n");
        const hasBruteForce = text.includes("loop") || text.includes("nested") || text.includes("n^2") || text.includes("n2");
        const mentionsComplexity = text.includes("time complexity") || text.includes("space complexity") || text.includes("o(");
        const isBubbleSort = text.includes("bubble sort");

        if (isBubbleSort && !hasHashing) {
            comm = 70; tech = 50; logic = 60; clarity = 70;
            verdict = "Average";
            feedback = "You mentioned Bubble Sort, which groups duplicates together but is slow (O(n²)).";
            tip = "Bubble Sort works for sorting, but can you think of a more optimized approach with better time complexity like Hashing?";
        } else if (hasHashing) {
            comm = 90; tech = 95; logic = 95; clarity = 90;
            verdict = "Excellent";
            feedback = "Great optimization! Using a Hash Set or Map is the preferred O(n) approach.";
            tip = mentionsComplexity ? "Good job mentioning complexity trade-offs!" : "Always explicitly state the Space Complexity (O(n)) when using extra memory.";
        } else if (hasSorting) {
            comm = 80; tech = 75; logic = 80; clarity = 80;
            verdict = "Solid Answer";
            feedback = "Sorting the array and comparing adjacent elements is a solid O(n log n) approach.";
            tip = "To score higher, mention how you can optimize this to O(n) using extra space (like a Set).";
        } else if (hasBruteForce) {
            comm = 60; tech = 40; logic = 50; clarity = 60;
            verdict = "Below Average";
            feedback = "Nested loops will work but result in a brute-force O(n²) time complexity.";
            tip = "Try to avoid nested loops. Think about how sorting or hashing can speed this up.";
        } else {
            // If they answered without keywords, fall back to basic grading
            comm = 50; tech = 30; logic = 40; clarity = 50;
            verdict = "Needs Major Work";
            feedback = "Your answer lacks technical depth and algorithms.";
            tip = "Discuss Hash Sets, Sorting, or Nested Loops along with their Big-O Time Complexities.";
        }
        
        return { metrics: { comm, tech, logic, clarity }, verdict, feedback, tip };
    }

    // 🌟 STANDARD EVALUATION FOR ALL OTHER QUESTIONS 🌟
    if (words < 15) {
        comm = 25; tech = 20; logic = 20; clarity = 30;
        verdict = "Below Average";
        feedback = "Answer is valid but too brief. Missing deeper reasoning and professional context.";
        tip = "Expand your reasoning. Explain the 'why' and 'how'.";
    } else if (words < 30) {
        comm = 70; tech = 60; logic = 65; clarity = 75;
        verdict = "Solid Answer";
        feedback = "Good fundamental explanation, but missing specific edge cases or metrics.";
        tip = "Use the STAR method for HR, or mention Big-O complexity for coding.";
    } else {
        comm = 95; tech = 85; logic = 90; clarity = 95;
        verdict = "Excellent";
        feedback = "Very detailed and well-structured response. Demonstrates clear understanding.";
        tip = "Maintain this level of depth consistently.";
    }

    tech += Math.floor(Math.random() * 10);
    logic += Math.floor(Math.random() * 10);

    return { 
        metrics: { comm: Math.min(comm, 100), tech: Math.min(tech, 100), logic: Math.min(logic, 100), clarity: Math.min(clarity, 100) }, 
        verdict, feedback, tip 
    };
}

// --- DYNAMIC SCROLL HELPER ---
function scrollToBottom() {
    setTimeout(() => {
        const optionsHeight = optionsArea.offsetHeight || 0;
        chatContent.style.paddingBottom = (optionsHeight + 120) + 'px'; 
        chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });
    }, 50);
}

// --- UI HELPERS ---
function addBotMsg(text, isHtml = false) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2 mt-4";
    div.innerHTML = `<div class="flex items-center space-x-2"><div class="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interviewer</span></div>
                     <div class="bg-white border border-gray-100 shadow-sm text-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[95%] text-sm leading-relaxed">${isHtml ? text : text.replace(/\n/g, '<br>')}</div>`;
    chatContent.appendChild(div);
    scrollToBottom();
}

function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-end w-full mt-4";
    div.innerHTML = `<div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 px-6 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-xl">${text}</div>`;
    chatContent.appendChild(div);
    scrollToBottom();
}

function showBtns(opts, cb) {
    optionsArea.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = "flex flex-wrap gap-2 pb-2 w-full justify-start";
    opts.forEach(o => {
        const b = document.createElement('button');
        b.className = "px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[12px] font-bold text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm";
        b.innerText = o;
        b.onclick = () => { addUserMsg(o); optionsArea.innerHTML = ''; scrollToBottom(); cb(o); };
        wrapper.appendChild(b);
    });
    optionsArea.appendChild(wrapper);
    scrollToBottom();
}

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
        scrollToBottom();
        cb(arr);
    };

    wrapper.appendChild(btnContainer);
    wrapper.appendChild(confirmBtn);
    optionsArea.appendChild(wrapper);
    scrollToBottom();
}

// --- APP FLOW ---
function init() {
    addBotMsg("Welcome. This is a simulated interview environment designed to help you prepare for real placements.");
    setTimeout(() => {
        addBotMsg("Let's configure your session. Are you an Engineering or BSC student?");
        showBtns(["Engineering Student", "BSC Student"], (v) => { session.data.type = v; askYear(); });
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

// 🔥 MAIN SUBMIT LOGIC 🔥
sendBtn.onclick = () => {
    const val = userInput.value.trim();
    
    if(val && session.active) {
        addUserMsg(val);

        // 1. REJECTION CHECK
        if (isGarbage(val)) {
            let rejectionHtml = `
                <div class="bg-red-50 p-4 rounded-xl space-y-2 mt-2 w-full border border-red-300 shadow-sm">
                    <p class="font-bold text-[11px] text-red-600 uppercase">❌ Evaluation Result: 0%</p>
                    <p class="text-[12px] text-red-800"><strong>Verdict:</strong> Needs Major Work</p>
                    <p class="text-[11px] text-red-700"><strong>Reason:</strong> Answer is too short or irrelevant.</p>
                    <p class="text-[10px] font-bold text-red-500 pt-1">Please type a proper response to move forward.</p>
                </div>
            `;
            addBotMsg(rejectionHtml, true);
            userInput.value = '';
            return; // Stops logic, user stays on the same question
        }

        // 2. PASS TO INTELLIGENT SCORING ENGINE
        userInput.value = '';
        sendBtn.disabled = true;
        userInput.disabled = true;

        const currentQ = session.questions[session.currentIndex];
        
        // Pass BOTH the user's answer AND the current question to check for specific logic
        const evaluation = evaluateAnswerLocally(val, currentQ);
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

// --- FINAL DASHBOARD (CHARTS) ---
function renderResult() {
    if (session.answers.length === 0) {
        addBotMsg("You ended the interview before answering any questions. Reload to try again.");
        return;
    }

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
    let readiness = overallRating >= 80 ? "Interview Ready" : overallRating >= 50 ? "Needs Practice" : "Requires Major Prep";
    let readinessColor = overallRating >= 80 ? "text-green-600 bg-green-100" : overallRating >= 50 ? "text-yellow-600 bg-yellow-100" : "text-red-600 bg-red-100";

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

        <button onclick="location.reload()" class="w-full py-4 bg-black text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition-all text-sm mt-2">START NEW SESSION</button>
    </div>`;
    
    addBotMsg(finalHtml, true);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
