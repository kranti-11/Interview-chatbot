const chatBox = document.getElementById('chat-box');
const optionsDiv = document.getElementById('options');
const timerDisplay = document.getElementById('timer');

let userChoices = {};

function addMessage(text, isBot = true) {
    const div = document.createElement('div');
    div.className = isBot 
        ? "max-w-[80%] bg-indigo-100 text-indigo-900 p-3 rounded-2xl rounded-tl-none self-start shadow-sm"
        : "max-w-[80%] bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none self-end ml-auto shadow-sm";
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showButtons(options, callback) {
    optionsDiv.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "bg-white border-2 border-indigo-600 text-indigo-600 font-medium px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95";
        btn.innerText = opt;
        btn.onclick = () => {
            addMessage(opt, false);
            callback(opt);
        };
        optionsDiv.appendChild(btn);
    });
}

// Logic Flow
function init() {
    addMessage("Hello! Let's get started. Are you an Engineering or BCC student?");
    showButtons(["Engineering Student", "BCC Student"], (val) => {
        userChoices.studentType = val;
        askYear();
    });
}

function askYear() {
    addMessage("Which year are you in?");
    showButtons(["1st Year", "2nd Year", "3rd Year", "4th Year"], (val) => {
        userChoices.year = val;
        askMode();
    });
}

function askMode() {
    addMessage("Should this session be Serious or a Mock practice?");
    showButtons(["Serious", "Mock"], (val) => {
        userChoices.mode = val;
        askCompany();
    });
}

function askCompany() {
    addMessage("Which company type are you targeting?");
    showButtons(["MAANG", "Private Consultancy"], (val) => {
        userChoices.companyCategory = val;
        if(val === "MAANG") {
            showButtons(["Google", "Amazon", "Meta", "Netflix"], askRound);
        } else {
            showButtons(["TCS/Infosys", "Deloitte/EY", "Accenture"], askRound);
        }
    });
}

function askRound(specificCompany) {
    userChoices.company = specificCompany;
    addMessage(`Great! Now, choose the round for ${specificCompany}:`);
    showButtons(["Coding Round", "HR Round"], (val) => {
        userChoices.round = val;
        showInstructions();
    });
}

function showInstructions() {
    addMessage("⚠️ FINAL INSTRUCTIONS:");
    addMessage("1. Time: 45 Mins. 2. CHEATING: Tab switching is tracked. 3. Code/Answers must be original.");
    showButtons(["I AGREE - START"], startInterview);
}

function startInterview() {
    timerDisplay.classList.remove('hidden');
    
    // Anti-Cheating Feature
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && userChoices.mode === "Serious") {
            alert("CHEATING WARNING: Tab switching is monitored. This attempt has been logged.");
            addMessage("❌ Session flagged: User switched tabs.");
        }
    });

    addMessage(`Starting ${userChoices.round} for ${userChoices.company}. Good luck!`);
    
    // Simple Question Selector
    if(userChoices.round === "Coding Round") {
        addMessage("Q1: Write a function to check if a string is a palindrome.");
    } else {
        addMessage("Q1: Why should we hire you over other candidates?");
    }
    
    optionsDiv.innerHTML = `<input type="text" placeholder="Type your answer here..." class="w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-600">`;
}

init();
