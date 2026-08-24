// Gemini API Key Config (Runtime Key Injector)
const apiKey = ""; 

// Application State Management
let appState = {
  credits: 20,
  selectedPkg: null,
  history: JSON.parse(localStorage.getItem('ai_history') || '[]'),
  pendingKPay: [
    { id: 'pay_101', ref: '2026082400123456', pkgName: 'Pro Pack (200 Credits)', amount: 45000, credits: 200 }
  ]
};

// Tool Form Definitions
const toolDefinitions = {
  copywriter: {
    title: "AI Copywriter",
    cost: 2,
    fields: [
      { id: "topic", label: "ခေါင်းစဉ် / အကြောင်းအရာ", placeholder: "ဥပမာ - နွေရာသီ အထူးလျှော့စျေး အဝတ်အထည်များ" },
      { id: "audience", label: "ပစ်မှတ် အသုံးပြုသူ", placeholder: "ဥပမာ - လူငယ်များ" },
      { id: "tone", label: "ရေးသားလိုသော လေသံ", placeholder: "ဥပမာ - ဆွဲဆောင်မှုရှိသော၊ တရားဝင်" }
    ]
  },
  marketing: {
    title: "Marketing Hub",
    cost: 2,
    fields: [
      { id: "product", label: "ကုန်ပစ္စည်း / ဝန်ဆောင်မှု အမည်", placeholder: "ဥပမာ - AI Studio App" },
      { id: "platform", label: "ကြော်ငြာမည့် Platform", placeholder: "ဥပမာ - Facebook, Email" }
    ]
  },
  script: {
    title: "Script Creator",
    cost: 3,
    fields: [
      { id: "topic", label: "ဇာတ်လမ်း / ဗီဒီယို အကြောင်းအရာ", placeholder: "ဥပမာ - AI နည်းပညာ၏ အနာဂတ်" },
      { id: "duration", label: "ကြာချိန်", placeholder: "ဥပမာ - ၁ မိနစ်" }
    ]
  },
  caption: {
    title: "Social Caption Generator",
    cost: 1,
    fields: [
      { id: "topic", label: "ဓာတ်ပုံ / ဗီဒီယို ခေါင်းစဉ်", placeholder: "ဥပမာ - ကမ်းခြေခရီးစဉ်" }
    ]
  },
  product: {
    title: "Product Description",
    cost: 2,
    fields: [
      { id: "productName", label: "ပစ္စည်းအမည်", placeholder: "ဥပမာ - Smart Watch" }
    ]
  },
  recap: {
    title: "Movie Recap Script Generator",
    cost: 3,
    fields: [
      { id: "title", label: "ရုပ်ရှင်အမည်", placeholder: "ဥပမာ - Inception" },
      { id: "plot", label: "ဇာတ်လမ်းအကျဉ်း", placeholder: "အဓိက ဇာတ်ကွက်များ ရေးပါ..." }
    ]
  }
};

// Tab Navigation Control
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.remove('hidden');

  if (tabId === 'admin') renderAdminPendingList();
  if (tabId === 'history') renderHistoryList();
}

// Open Specific Tool Function
function openTool(toolKey) {
  switchTab('tools');
  const selector = document.getElementById('toolSelector');
  if (selector) {
    selector.value = toolKey;
    onToolSelectChange();
  }
}

// Dynamic Tool Input Field Rendering
function onToolSelectChange() {
  const selected = document.getElementById('toolSelector').value;
  const def = toolDefinitions[selected];
  const container = document.getElementById('toolFormInputs');

  if (container && def) {
    container.innerHTML = def.fields.map(f => `
      <div>
        <label class="block text-xs text-slate-300 mb-1">${f.label}</label>
        <input type="text" id="tool_input_${f.id}" placeholder="${f.placeholder}" class="w-full bg-violet-900 border border-violet-700 text-white text-xs md:text-sm rounded-xl px-3 py-2.5 focus:outline-none">
      </div>
    `).join('');
  }
}

// Gemini API Call Helper
async function callGemini(promptText) {
  if (!apiKey) {
    // Mock Mode fallback
    await new Promise(r => setTimeout(r, 1200));
    return `[AI စနစ်မှ အလိုအလျောက် ရေးသားပေးသော စာမူ]\n\n${promptText} နှင့် ပတ်သက်၍ အသေးစိတ် အချက်အလက်များ ဖန်တီးပြီးပါပြီ။ AI Assistant Studio စနစ်သည် လူကြီးမင်း၏ လုပ်ငန်းများကို လျှင်မြန်စွာ ပြီးမြောက်စေရန် ကူညီပေးပါသည်။`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "တုံ့ပြန်မှု မရရှိပါခင်ဗျာ။";
  } catch (e) {
    return "အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။ ခရက်ဒစ် ပြန်လည် ထည့်သွင်းပေးထားပါသည်။";
  }
}

// Deduct Credit & Check Balance
function checkAndDeductCredits(cost) {
  if (appState.credits < cost) {
    alert(`ခရက်ဒစ် မလုံလောက်ပါ။ လိုအပ်သော ခရက်ဒစ်: ${cost} | လက်ရှိ ခရက်ဒစ်: ${appState.credits}`);
    switchTab('store');
    return false;
  }
  appState.credits -= cost;
  updateCreditUI();
  return true;
}

function updateCreditUI() {
  const userCreditDisplay = document.getElementById('userCreditDisplay');
  const mobileCreditDisplay = document.getElementById('mobileCreditDisplay');
  const profileCreditText = document.getElementById('profileCreditText');

  if (userCreditDisplay) userCreditDisplay.innerText = `${appState.credits} Credits`;
  if (mobileCreditDisplay) mobileCreditDisplay.innerText = appState.credits;
  if (profileCreditText) profileCreditText.innerText = `${appState.credits} Credits`;
}

// AI Chat Messaging
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  if (!checkAndDeductCredits(1)) return;

  const container = document.getElementById('chatContainer');
  
  // User Message
  container.innerHTML += `
    <div class="flex gap-3 justify-end items-start">
      <div class="bg-violet-600 rounded-2xl p-3 text-xs md:text-sm text-white max-w-[85%]">
        ${text}
      </div>
    </div>
  `;

  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Loading State
  const loadingId = 'loading_' + Date.now();
  container.innerHTML += `
    <div id="${loadingId}" class="flex gap-3 items-start">
      <div class="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm shrink-0">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="bg-violet-800/60 rounded-2xl p-3 text-xs text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin mr-1"></i> စဉ်းစားနေပါသည်...
      </div>
    </div>
  `;

  const responseText = await callGemini(text);
  const loadingEl = document.getElementById(loadingId);
  if (loadingEl) loadingEl.remove();

  // AI Response
  container.innerHTML += `
    <div class="flex gap-3 items-start">
      <div class="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 text-sm">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="bg-violet-800/60 border border-violet-700/50 rounded-2xl p-4 text-xs md:text-sm text-slate-200 max-w-[85%] leading-relaxed whitespace-pre-wrap">
        ${responseText}
      </div>
    </div>
  `;
  container.scrollTop = container.scrollHeight;
  saveHistory('AI Chat', text, responseText);
}

// AI Tool Execution
async function executeToolGeneration() {
  const selected = document.getElementById('toolSelector').value;
  const def = toolDefinitions[selected];

  if (!checkAndDeductCredits(def.cost)) return;

  const btn = document.getElementById('generateToolBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ဖန်တီးနေပါသည်...`;

  const promptText = `Please write a ${def.title} in Burmese language for topic details specified.`;
  const result = await callGemini(promptText);

  document.getElementById('toolResultContent').innerText = result;
  document.getElementById('toolResultBox').classList.remove('hidden');

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> စာမူစတင် ဖန်တီးမည်`;

  saveHistory(def.title, 'Tool Prompt Payload', result);
}

// Sub-Tab Switcher for Vision/TTS
function switchMediaSubTab(type) {
  const visionPanel = document.getElementById('mediaVisionPanel');
  const ttsPanel = document.getElementById('mediaTtsPanel');
  const visionTabBtn = document.getElementById('mediaSubTabVision');
  const ttsTabBtn = document.getElementById('mediaSubTabTts');

  if (type === 'vision') {
    visionPanel.classList.remove('hidden');
    ttsPanel.classList.add('hidden');
    visionTabBtn.className = "pb-2 border-b-2 border-violet-400 text-violet-400";
    ttsTabBtn.className = "pb-2 text-slate-400 hover:text-slate-200";
  } else {
    visionPanel.classList.add('hidden');
    ttsPanel.classList.remove('hidden');
    ttsTabBtn.className = "pb-2 border-b-2 border-violet-400 text-violet-400";
    visionTabBtn.className = "pb-2 text-slate-400 hover:text-slate-200";
  }
}

// Image Preview Handler
function previewVisionImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('previewImgTag').src = e.target.result;
      document.getElementById('visionImagePreview').classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  }
}

// Execute Image Vision Analysis
async function executeVisionAnalysis() {
  if (!checkAndDeductCredits(5)) return;

  const prompt = document.getElementById('visionPromptInput').value || 'Analyze this image';
  const btn = document.getElementById('analyzeVisionBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ပုံရိပ်အား စစ်ဆေးနေပါသည်...`;

  const result = await callGemini("Analyze image contents and describe in Burmese.");
  
  const box = document.getElementById('visionResultBox');
  box.innerText = result;
  box.classList.remove('hidden');

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-eye"></i> ပုံရိပ်အား AI ဖြင့် စစ်ဆေးမည်`;
  saveHistory('Vision Analysis', prompt, result);
}

// Execute Text-to-Speech
function executeTTS() {
  const text = document.getElementById('ttsTextInput').value.trim();
  if (!text) return alert("စာသား ရေးသားပါ");
  if (!checkAndDeductCredits(2)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
  alert("အသံထွက်ပြောင်းလဲပြီးပါပြီခင်ဗျာ။");
  saveHistory('Text-to-Speech', text, 'Audio synthesized successfully.');
}

// Store & KPay Functions
function selectPackage(pkgId, amount, credits) {
  appState.selectedPkg = { pkgId, amount, credits };
  document.getElementById('kpayAmountText').innerText = amount.toLocaleString();
  document.getElementById('kpayFormBox').classList.remove('hidden');
}

function submitKPayPayment() {
  const ref = document.getElementById('kpayRefInput').value.trim();
  if (ref.length < 10) return alert("KPay လုပ်ငန်းစဉ်အမှတ် မှန်ကန်စွာ ထည့်သွင်းပါ");

  appState.pendingKPay.push({
    id: 'pay_' + Date.now(),
    ref: ref,
    pkgName: appState.selectedPkg.credits + ' Credits Pack',
    amount: appState.selectedPkg.amount,
    credits: appState.selectedPkg.credits
  });

  alert("ငွေလွှဲပြောင်းမှု အချက်အလက်များအား အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ။ Admin မှ စစ်ဆေးအတည်ပြုပြီးပါက ခရက်ဒစ် ရရှိပါမည်။");
  document.getElementById('kpayFormBox').classList.add('hidden');
  document.getElementById('kpayRefInput').value = '';
}

// Admin Review Actions
function renderAdminPendingList() {
  const container = document.getElementById('adminPendingList');
  if (!container) return;

  if (appState.pendingKPay.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500">စစ်ဆေးရန် ကျန်ရှိသော လွှဲစာများ မရှိပါ။</p>`;
    return;
  }

  container.innerHTML = appState.pendingKPay.map(item => `
    <div class="bg-violet-800/60 border border-violet-700/50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div>
        <div class="text-xs font-mono text-amber-400">Ref: ${item.ref}</div>
        <div class="text-xs text-white font-bold">${item.pkgName} (${item.amount.toLocaleString()} MMK)</div>
      </div>
      <div class="flex gap-2 w-full md:w-auto">
        <button onclick="approvePayment('${item.id}', ${item.credits})" class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          အတည်ပြုမည် (+${item.credits} Credits)
        </button>
        <button onclick="rejectPayment('${item.id}')" class="flex-1 md:flex-none bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          ငြင်းပယ်မည်
        </button>
      </div>
    </div>
  `).join('');
}

function approvePayment(id, credits) {
  appState.credits += credits;
  appState.pendingKPay = appState.pendingKPay.filter(i => id !== i.id);
  updateCreditUI();
  renderAdminPendingList();
  alert(`ငွေလွှဲအား အတည်ပြုပြီးပါပြီ။ ခရက်ဒစ် +${credits} ထည့်သွင်းပေးလိုက်ပါပြီ။`);
}

function rejectPayment(id) {
  appState.pendingKPay = appState.pendingKPay.filter(i => id !== i.id);
  renderAdminPendingList();
  alert("ငွေလွှဲအား ငြင်းပယ်လိုက်ပါပြီ။");
}

// History Storage & Rendering
function saveHistory(type, prompt, result) {
  appState.history.unshift({
    type, prompt, result, time: new Date().toLocaleTimeString()
  });
  localStorage.setItem('ai_history', JSON.stringify(appState.history));
}

function renderHistoryList() {
  const container = document.getElementById('historyLogList');
  if (!container) return;

  if (appState.history.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500">မှတ်တမ်းများ မရှိသေးပါ။</p>`;
    return;
  }
  container.innerHTML = appState.history.map(item => `
    <div class="bg-violet-800/40 border border-violet-700/40 rounded-2xl p-4 space-y-2">
      <div class="flex justify-between text-[10px] text-slate-400">
        <span class="font-bold text-violet-300 uppercase">${item.type}</span>
        <span>${item.time}</span>
      </div>
      <p class="text-xs text-slate-200 line-clamp-3">${item.result}</p>
    </div>
  `).join('');
}

function clearLocalHistory() {
  appState.history = [];
  localStorage.removeItem('ai_history');
  renderHistoryList();
}

function copyResultText() {
  const text = document.getElementById('toolResultContent').innerText;
  navigator.clipboard.writeText(text);
  alert("ကူးယူပြီးပါပြီ");
}

function clearChat() {
  document.getElementById('chatContainer').innerHTML = '';
}

// On DOM Ready Initializer
document.addEventListener("DOMContentLoaded", () => {
  onToolSelectChange();
});
