const chatContent = document.getElementById('chat-content');
const optionsUi = document.getElementById('options-ui');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let userData = {
    selectedMaang: []
};

// --- CHAT UTILS ---
function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = "flex flex-col items-start animate-fade-in";
    div.innerHTML = `
        <div class="flex items-center space-x-2 mb-1">
            <div class="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">AI</div>
            <span class="text-[10px] font-bold text-gray-400 uppercase">Assistant</span>
        </div>
        <div class="bg-gray-50 border border-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed">
            ${text}
        </div>
    `;
    chatContent.appendChild(div);
    scrollToBottom();
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = "flex flex-col items-end";
    div.innerHTML = `
        <div class="bg-black text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-sm">
            ${text}
        </div>
    `;
    chatContent.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// --- LOGIC ENGINE ---
function showButtons(options, callback) {
    optionsUi.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-black transition-all";
        btn.innerText = opt;
        btn.onclick = () => {
            addUserMessage(opt);
            optionsUi.innerHTML = '';
            callback(opt);
        };
        optionsUi.appendChild(btn);
    });
}

// Special Multi-Select for MAANG
function showMultiSelect(options, callback) {
    optionsUi.innerHTML = '';
    userData.selectedMaang = [];
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 border border-gray-200 rounded-full text-sm font-medium transition-all";
        btn.innerText = opt;
        btn.onclick = () => {
            if (userData.selectedMaang.includes(opt)) {
                userData.selectedMaang = userData.selectedMaang.filter(i => i !== opt);
                btn.classList.remove('bg-black', 'text-white');
            } else {
                userData.selectedMaang.push(opt);
                btn.classList.add('bg-black', 'text-white');
            }
        };
        optionsUi.appendChild(btn);
    });

    const doneBtn = document.createElement('button');
    doneBtn.className = "px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg";
    doneBtn.innerText = "Confirm Selection →";
    doneBtn.onclick = () => {
        if(userData.selectedMaang.length === 0) return alert("Select at least one!");
        addUserMessage("Selected: " + userData.selectedMaang.join(", "));
        optionsUi.innerHTML = '';
        callback();
    };
    optionsUi.appendChild(doneBtn);
}

// --- STEPS ---
function init() {
    addBotMessage("Welcome. To personalize your interview experience, please select your student profile.");
    showButtons(["Engineering Student", "BCC Student"], (choice) => {
        userData.studentType = choice;
        askYear();
    });
}

function askYear() {
    addBotMessage("Understood. Which year of study are you currently in?");
    showButtons(["1st Year", "2nd Year", "3rd Year", "4th Year"], (choice) => {
        userData.year = choice;
        askMode();
    });
}

function askMode() {
    addBotMessage("Would you like this to be a **Serious** simulated interview or a **Mock** session?");
    showButtons(["Serious Mode", "Mock Practice"], (choice) => {
        userData.mode = choice;
        askCompanyType();
    });
}

function askCompanyType() {
    addBotMessage("Which types of companies are you targeting? Popular options include:");
    showButtons(["MAANG", "Private Consultancy", "Product Based Startup", "FinTech"], (choice) => {
        userData.companyType = choice;
        if(choice === "MAANG") {
            addBotMessage("Select the MAANG companies you are interested in (Multiple allowed):");
            showMultiSelect(["Google", "Amazon", "Apple", "Meta", "Netflix", "Microsoft"], askRound);
        } else if(choice === "Private Consultancy") {
            showButtons(["TCS", "Infosys", "Wipro", "Accenture", "Deloitte"], (c) => { userData.target = c; askRound(); });
        } else {
            showButtons(["Unicorn Startup", "Early Stage", "Web3/Crypto"], (c) => { userData.target = c; askRound(); });
        }
    });
}

function askRound() {
    addBotMessage("Lastly, which round are we focusing on today?");
    showButtons(["Coding Round", "HR Round"], (choice) => {
        userData.round = choice;
        showInstructions();
    });
}

function showInstructions() {
    addBotMessage("**INTERVIEW PROTOCOL:**\n1. Duration: 45 Minutes\n2. Anti-Cheating: Tab switching will flag your session.\n3. Environment: Keep your camera on if in Serious Mode.");
    showButtons(["I Accept - Start Interview"], startInterview);
}

function startInterview() {
    // Anti-Cheating
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && userData.mode.includes("Serious")) {
            alert("TAB SWITCH DETECTED. This event has been recorded for the final report.");
        }
    });

    addBotMessage(`The ${userData.round} is now live. Please provide detailed answers.`);
    
    if(userData.round === "Coding Round") {
        addBotMessage("Q1: Explain the concept of 'Time Complexity' and calculate the Big O for a nested loop iterating over an array of size N.");
    } else {
        addBotMessage("Q1: Tell me about a significant technical challenge you faced during a project and how you overcame it.");
    }
}

// --- INPUT HANDLER ---
sendBtn.onclick = () => {
    const text = userInput.value.trim();
    if(text) {
        addUserMessage(text);
        userInput.value = '';
        // Simulate bot thinking
        setTimeout(() => {
            addBotMessage("Thank you for your response. Evaluating your answer... (Next question coming soon)");
        }, 1000);
    }
};

// Allow Enter key to send
userInput.onkeydown = (e) => {
    if(e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
};

init();
