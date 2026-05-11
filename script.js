const chatContent = document.getElementById('chat-content');
const optionsArea = document.getElementById('options-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const timerDisplay = document.getElementById('timer');
const timerBox = document.getElementById('timer-box');

// --- PHASE 2: RUBRIC-BASED QUESTION DATABASE ---
// Replaced simple strings with structured Rubrics and Follow-ups
const questionBank = [
    {
        q: "Explain the difference between stack and queue.",
        type: "Coding Round",
        rubric: [
            { name: "LIFO / Stack Concept", score: 3.5, keys: ["lifo", "last in", "newest", "pop", "push", "top"] },
            { name: "FIFO / Queue Concept", score: 3.5, keys: ["fifo", "first in", "oldest", "enqueue", "dequeue", "front", "rear"] },
            { name: "Use Cases / Examples", score: 3.0, keys: ["example", "browser", "undo", "printer", "ticket", "line", "waiting"] }
        ],
        followUp: "You missed mentioning real-world applications. Can you give an example of where a Stack and a Queue are used?"
    },
    {
        q: "How would you find duplicate elements in an array?",
        type: "Coding Round",
        rubric: [
            { name: "Hashing / Set (O(n))", score: 4, keys: ["hash", "set", "map", "unordered", "dictionary"] },
            { name: "Sorting (O(n log n))", score: 3, keys: ["sort", "n log n", "adjacent"] },
            { name: "Time Complexity Mention", score: 3, keys: ["time complexity", "o(n)", "space complexity"] }
        ],
        followUp: "Can you specify the exact Time and Space complexity for your approach?"
    },
    {
        q: "Tell me about a time you handled a crisis.",
        type: "HR Round",
        rubric: [
            { name: "Situation/Task Setup", score: 3, keys: ["situation", "task", "problem", "issue", "suddenly", "project"] },
            { name: "Action Taken", score: 4, keys: ["action", "i decided", "implemented", "communicated", "resolved", "team"] },
            { name: "Result/Impact", score: 3, keys: ["result", "outcome", "successfully", "learned", "improved", "saved"] }
        ],
        followUp: "What was the specific outcome or metric that proved your solution worked?"
    }
];

// Fallback rubric for generic questions generated dynamically
const fallbackRubric = [
    { name: "Detailed Explanation", score: 4, keys: ["because", "how", "means", "is a"] },
    { name: "Technical Terms", score: 3, keys: ["memory", "algorithm", "data", "function", "system", "process"] },
    { name: "Examples/Context", score: 3, keys: ["for example", "instance", "use case", "scenario"] }
];

// --- SESSION STATE ---
let timerInterval; 
let session = { 
    data: {}, 
    questions: [], 
    answers: [], 
    currentIndex: 0, 
    active: false, 
    timeLeft: 45 * 60,
    inFollowUp: false,    // Tracks if we are currently asking a follow-up
    currentQObj: null     // Stores the structured rubric object
};

// --- STRICT GARBAGE DETECTOR ---
function isGarbage(answer) {
    const text = answer.trim();
    return (
        text.length < 10 ||
        /^[a-z]{1,6}$/i.test(text) ||
        !/[a-zA-Z]/.test(text) ||
        text.split(" ").length < 3
    );
}

// --- INTELLIGENT RUBRIC EVALUATOR (Simulated Semantic Understanding) ---
function evaluateWithRubric(answerText, qObj) {
    let text = answerText.toLowerCase();
    let score = 0;
    let strengths = [];
    let missing = [];

    const rubricToUse = qObj.rubric || fallbackRubric;

    // Check each concept in the rubric using synonyms/keywords
    rubricToUse.forEach(item => {
        let found = item.keys.some(k => text.includes(k));
        if (found) {
            score += item.score;
            strengths.push(item.name);
        } else {
            missing.push(item.name);
        }
    });

    let totalPoints = score; // Out of 10
    let percentage = (totalPoints / 10) * 100;
    
    // Map to UI Metrics
    let tech = Math.round(percentage);
    let logic = Math.round(percentage > 0 ? percentage + (Math.random() * 10 - 5) : 0);
    let comm = Math.min(100, answerText.split(" ").length * 3); // Word count baseline for communication
    let clarity = Math.round((tech + comm) / 2);

    let verdict = tech >= 80 ? "Excellent" : tech >= 50 ? "Solid Answer" : "Needs Work";
    
    let feedback = strengths.length > 0 
        ? `You successfully covered: ${strengths.join(", ")}.` 
        : "Your answer missed the core concepts.";
        
    let tip = missing.length > 0 
        ? `Missing concepts: ${missing.join(", ")}. Try to include these next time.` 
        : "Perfect answer! You hit all the rubric points.";

    return {
        metrics: { comm, tech, logic, clarity },
        verdict, feedback, tip, missing, totalPoints
    };
}

// --- UI HELPERS & DYNAMIC SCROLL ---
function scrollToBottom() {
    setTimeout(() => {
        const optionsHeight = optionsArea.offsetHeight || 0;
        chatContent.style.paddingBottom = (optionsHeight + 120) + 'px'; 
        chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });
    }, 50);
}

function addBotMsg(text, isHtml = false) {
    const div = document.createElement('div');
    div.className = "message-fade flex flex-col items-start space-y-2 mt-4";
    div.innerHTML = `<div class="flex items-center space-x-2"><div class="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md">AI</div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evaluator</span></div>
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

// --- APP FLOW ---
function init() {
    addBotMsg("Welcome to the Adaptive AI Interview Platform. We use rubric-based evaluation.");
    setTimeout(() => {
        addBotMsg("Select your round:");
        showBtns(["HR Round", "Coding Round"], (v) => { 
            session.data.round = v; 
            session.questions = questionBank.filter(q => q.type === v);
            showInstructions(); 
        });
    }, 1500);
}

function showInstructions() {
    addBotMsg(`Instructions:\n1. Round: ${session.data.round}\n2. You will be graded on specific rubrics.\n3. Be prepared for adaptive follow-up questions!`);
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
    if (session.currentIndex < session.questions.length) {
        session.currentQObj = session.questions[session.currentIndex];
        addBotMsg(`**Question ${session.currentIndex + 1}:**\n${session.currentQObj.q}`);
    } else {
        finish();
    }
}

// 🔥 ADAPTIVE EVALUATION FLOW 🔥
sendBtn.onclick = () => {
    const val = userInput.value.trim();
    if(val && session.active) {
        addUserMsg(val);

        // 1. GARBAGE CHECK
        if (isGarbage(val)) {
            let rejectionHtml = `
                <div class="bg-red-50 p-4 rounded-xl space-y-2 mt-2 w-full border border-red-300 shadow-sm">
                    <p class="font-bold text-[11px] text-red-600 uppercase">❌ Evaluation Result: 0/10</p>
                    <p class="text-[12px] text-red-800"><strong>Verdict:</strong> Needs Major Work</p>
                    <p class="text-[11px] text-red-700"><strong>Reason:</strong> Answer is too short or irrelevant.</p>
                </div>`;
            addBotMsg(rejectionHtml, true);
            userInput.value = '';
            return; // Reject and stay on same question
        }

        userInput.value = '';
        sendBtn.disabled = true;
        userInput.disabled = true;

        // 2. RUBRIC EVALUATION
        const evaluation = evaluateWithRubric(val, session.currentQObj);
        session.answers.push({ q: session.currentQObj.q, a: val, eval: evaluation });
        
        setTimeout(() => {
            const m = evaluation.metrics;
            let feedbackHtml = `
                <div class="bg-gray-50 p-4 rounded-xl space-y-3 mt-2 w-full border border-gray-200">
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-[10px] text-gray-500 uppercase">📊 Rubric Score: ${evaluation.totalPoints}/10</p>
                        <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase">${evaluation.verdict}</span>
                    </div>
                    
                    <div class="space-y-1.5">
                        <div class="text-[10px] font-bold text-gray-600 flex justify-between"><span>Technical Match</span><span>${m.tech}%</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width: ${m.tech}%"></div></div>
                    </div>

                    <p class="text-[11px] text-gray-700 mt-2"><strong>Feedback:</strong> ${evaluation.feedback}</p>
                    <p class="text-[11px] text-blue-700"><strong>Improvement:</strong> ${evaluation.tip}</p>
                </div>`;

            addBotMsg(feedbackHtml, true);
            
            // 3. ADAPTIVE FOLLOW-UP LOGIC
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();

            if (!session.inFollowUp && evaluation.missing.length > 0 && session.currentQObj.followUp) {
                // Trigger Follow-Up
                session.inFollowUp = true;
                setTimeout(() => {
                    addBotMsg(`*Follow-up:* ${session.currentQObj.followUp}`);
                }, 1500);
            } else {
                // Move to Next Question
                session.inFollowUp = false;
                session.currentIndex++;
                setTimeout(nextQ, 3000); 
            }

        }, 800); 
    }
};

function finish() {
    clearInterval(timerInterval); 
    session.active = false;
    const endBtn = document.getElementById('end-btn');
    if(endBtn) endBtn.remove();
    addBotMsg("Interview Ended. Compiling Rubric Dashboard...");
    setTimeout(renderResult, 2000);
}

// --- FINAL DASHBOARD ---
function renderResult() {
    if (session.answers.length === 0) {
        addBotMsg("You ended the interview early.");
        return;
    }

    let tech = 0;
    session.answers.forEach(ans => { tech += ans.eval.metrics.tech; });
    const avgTech = Math.round(tech / session.answers.length);

    let finalHtml = `
    <div class="space-y-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl">
        <div class="text-center pb-4 border-b border-gray-100">
            <h2 class="text-lg font-black text-gray-800 uppercase tracking-wide">Final Rubric Analysis</h2>
            <p class="text-[12px] text-gray-500 mt-1">Rubric Match: ${avgTech}%</p>
        </div>
        <p class="text-xs text-gray-700 leading-relaxed text-center">
            ${avgTech >= 80 ? "Great job hitting the key rubric concepts!" : "You need to include more technical terminology and examples to hit full rubric marks."}
        </p>
        <button onclick="location.reload()" class="w-full py-4 bg-black text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition-all text-sm mt-2">START NEW SESSION</button>
    </div>`;
    
    addBotMsg(finalHtml, true);
}

userInput.onkeydown = (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } };

init();
