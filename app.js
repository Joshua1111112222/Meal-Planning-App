const greetings = [
    "Welcome back, NAME!",
    "NAME returns!",
    "Ready when you are, NAME.",
    "Let’s cook up something good, NAME!",
    "Good to see you, NAME!",
    "Let’s get planning, NAME!",
    "Chef NAME is in the house!",
    "Meal time magic starts now, NAME!"
  ];
  
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const meals = ["Breakfast","Lunch","Dinner"];
  
  let generator, aiChatVisible = false;
  
  const AI_NAME = "ChefBot";  // AI assistant name
  const CREATOR_NAME = "Joshua The";  // Your name
  const SYSTEM_PROMPT = `You are ${AI_NAME}, an AI assistant created by ${CREATOR_NAME}. Your purpose is to help users plan meals, answer questions about meal planning, and be friendly and helpful.`;
  
  // Called once per page load
  window.onload = () => {
    if (localStorage.getItem("username")) showWelcome();
  
    document.getElementById("login-btn").onclick = login;
    document.getElementById("save-meals").onclick = saveMealsToStorage;
    document.getElementById("chat-toggle").onclick = () => {
      toggleChat();
      if (aiChatVisible) sendAIWelcome();
    };
  
    document.getElementById("chat-form").onsubmit = async e => {
      e.preventDefault();
      const msg = document.getElementById("chat-input").value.trim();
      if (!msg) return;
      document.getElementById("chat-input").value = "";
      await chatWithAI(msg);
    };
  
    // Add close X button to AI chat panel
    const aiChat = document.getElementById("ai-chat");
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.id = "chat-close-btn";
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px; right: 8px;
      font-size: 24px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #888;
    `;
    closeBtn.title = "Close AI Chat";
    closeBtn.onclick = () => {
      aiChat.style.display = "none";
      aiChatVisible = false;
    };
    aiChat.style.position = "relative";
    aiChat.appendChild(closeBtn);
  
    // If chat is visible on load, send welcome message
    if (aiChatVisible) sendAIWelcome();
  };
  
  function login() {
    const name = document.getElementById("username").value.trim();
    if (!name) return alert("Please enter your name.");
    localStorage.setItem("username", name);
    showWelcome();
  }
  
  function showWelcome() {
    document.getElementById("login-screen").style.display = "none";
    const name = localStorage.getItem("username");
    const greet = greetings[Math.floor(Math.random()*greetings.length)].replace("NAME", name);
    const ws = document.getElementById("welcome-screen");
    document.getElementById("greeting").textContent = greet;
    ws.style.display = "flex";
    setTimeout(() => {
      ws.style.opacity = 0;
      setTimeout(() => {
        ws.style.display = "none";
        document.getElementById("app-screen").style.display = "block";
        buildTable();
        loadMealsFromStorage();
      }, 500);
    }, 2500);
  }
  
  function buildTable() {
    const tbody = document.querySelector("#meal-table tbody");
    tbody.innerHTML = "";
    days.forEach(day => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${day}</td>` + meals.map(m => `
        <td>
          <input class="meal-input" type="text" id="${day}-${m}" placeholder="${m}" />
          <input class="health-slider" type="range" min="0" max="100" id="${day}-${m}-score" />
          <div class="slider-icons">
            <span>🥗</span><span>🍜</span><span>🍩</span>
          </div>
        </td>
      `).join("");
      tbody.appendChild(tr);
  
      meals.forEach(m => {
        const slider = document.getElementById(`${day}-${m}-score`);
        slider.oninput = () => updateSlider(slider);
      });
    });
  }
  
  function updateSlider(slider) {
    const val = slider.value;
    if (val < 40) slider.style.background = "linear-gradient(to right, #f44336, #ffeb3b)";
    else if (val < 70) slider.style.background = "linear-gradient(to right, #ffeb3b, #4caf50)";
    else slider.style.background = "#4caf50";
    saveMealsToStorage();
  }
  
  function saveMealsToStorage() {
    const data = {};
    days.forEach(day => {
      data[day] = {};
      meals.forEach(m => {
        const text = document.getElementById(`${day}-${m}`).value || "";
        const score = document.getElementById(`${day}-${m}-score`).value || 50;
        data[day][m] = { text, score: +score };
      });
    });
    localStorage.setItem("meals", JSON.stringify(data));
    document.getElementById("save-message").textContent = "Meal plan saved!";
    setTimeout(() => document.getElementById("save-message").textContent = "", 2000);
  }
  
  function loadMealsFromStorage() {
    const saved = JSON.parse(localStorage.getItem("meals") || "{}");
    days.forEach(day => meals.forEach(m => {
      document.getElementById(`${day}-${m}`).value = saved[day]?.[m]?.text || "";
      const s = saved[day]?.[m]?.score;
      if (s != null) {
        const slider = document.getElementById(`${day}-${m}-score`);
        slider.value = s;
        updateSlider(slider);
      }
    }));
  }
  
  async function loadModel() {
    if (!generator && window.transformers?.pipeline) {
      generator = await window.transformers.pipeline("text-generation", "Xenova/gpt2");
    }
  }
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    document.getElementById("ai-chat").style.display = aiChatVisible ? "flex" : "none";
    if (aiChatVisible) document.getElementById("chat-input").focus();
  }
  
  function appendMessage(text, cls) {
    const div = document.createElement("div");
    div.textContent = text;
    div.classList.add("message", cls);
    document.getElementById("chat-messages").appendChild(div);
    document.getElementById("chat-messages").scrollTop = 
      document.getElementById("chat-messages").scrollHeight;
  }
  
  let firstWelcomeSent = false;
  function sendAIWelcome() {
    if (firstWelcomeSent) return;
    firstWelcomeSent = true;
    appendMessage(`${AI_NAME} here, created by ${CREATOR_NAME}. How can I assist you today?`, "ai-message");
  }
  
  async function chatWithAI(msg) {
    appendMessage(msg, "user-message");
    appendMessage("AI is thinking…", "ai-message");
    await loadModel();
    if (!generator) {
      document.querySelector("#chat-messages .ai-message:last-child").remove();
      return appendMessage("AI unavailable.", "ai-message");
    }
  
    const mealsJson = localStorage.getItem("meals") || "{}";
  
    const prompt = `${SYSTEM_PROMPT}\nUser meals data: ${mealsJson}\nUser says: ${msg}\nAI:`;
  
    try {
      const out = await generator(prompt, { max_length: 100 });
      let resp = out[0].generated_text.replace(prompt, "").trim();
      document.querySelector("#chat-messages .ai-message:last-child").remove();
      resp = resp || "Sorry, I can't answer that right now.";
      appendMessage(resp, "ai-message");
    } catch (e) {
      document.querySelector("#chat-messages .ai-message:last-child").remove();
      appendMessage("Error generating AI response.", "ai-message");
    }
  }
  