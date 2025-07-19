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
  
  window.onload = () => {
    if (localStorage.getItem("username")) showWelcome();
    document.getElementById("login-btn").onclick = login;
    document.getElementById("save-meals").onclick = saveMealsToStorage;
    document.querySelector(".chatbot-toggler").onclick = toggleChat;
    document.querySelector(".close-btn").onclick = closeChat;
    document.getElementById("chat-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });
    document.querySelector(".chat-input span[role='button']").onclick = handleChat;
    buildTable();
    loadMealsFromStorage();
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
        document.getElementById("app-screen").style.display = "flex";
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
    const sm = document.getElementById("save-message");
    sm.textContent = "Meal plan saved!";
    setTimeout(() => sm.textContent = "", 2000);
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
  
  // === AI Chatbot with Google Gemini API ===
  
  const API_KEY = "AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  let isFirstMessage = true;
  let messageHistory = [];
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    if (aiChatVisible) document.body.classList.add("show-chatbot");
    else document.body.classList.remove("show-chatbot");
  }
  
  function closeChat() {
    aiChatVisible = false;
    document.body.classList.remove("show-chatbot");
  }
  
  function createChatLi(message, className) {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    if (className === "outgoing") {
      chatLi.innerHTML = `<p></p>`;
      chatLi.querySelector("p").textContent = message;
    } else {
      chatLi.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
      chatLi.querySelector("p").textContent = message;
    }
    return chatLi;
  }
  
  async function generateResponse(chatElement) {
    const messageElement = chatElement.querySelector("p");
    const userMessage = messageHistory[messageHistory.length -1].text.toLowerCase();
  
    if (userMessage.includes("who created you") || userMessage.includes("who made you")) {
      messageElement.textContent = "I am ChefBot, created by Joshua The.";
      scrollChat();
      return;
    }
    if (isFirstMessage) {
      messageElement.textContent = "Hi! I’m ChefBot, created by Joshua The. How can I assist you today?";
      isFirstMessage = false;
      scrollChat();
      return;
    }
  
    // Build the API request body using messageHistory
    const body = {
      temperature: 0.7,
      candidateCount: 1,
      maxOutputTokens: 512,
      prompt: {
        messages: messageHistory.map(msg => ({
          author: msg.role === "user" ? "user" : "assistant",
          content: { text: msg.text }
        })),
        context: "You are ChefBot, a friendly meal planning assistant."
      }
    };
  
    // IMPORTANT: Remove unsupported fields or change body to match Gemini API v1beta specs!
    // The error you had is because `prompt` and `temperature` are not top-level accepted keys.
    // Gemini expects something like:
    // {
    //   "model": "gemini-1.5-flash",
    //   "prompt": {
    //     "messages": [...]
    //   },
    //   "temperature": 0.7,
    //   ...
    // }
    // But your endpoint already includes the model in the URL, so just send "prompt" as top-level.
    // So we must send "prompt" only, no temperature or candidateCount in body.
    // We'll fix by sending only "prompt" with messages and context.
  
    const fixedBody = {
      prompt: {
        messages: messageHistory.map(msg => ({
          author: msg.role === "user" ? "user" : "assistant",
          content: { text: msg.text }
        })),
        context: "You are ChefBot, a friendly meal planning assistant."
      }
    };
  
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixedBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error.message || "API error");
  
      const responseText = data.candidates?.[0]?.content?.text || "Sorry, I didn’t understand that.";
      messageElement.textContent = responseText;
      messageHistory.push({ role: "assistant", text: responseText });
    } catch (err) {
      messageElement.classList.add("error");
      messageElement.textContent = err.message;
    } finally {
      scrollChat();
    }
  }
  
  function scrollChat() {
    const chatbox = document.getElementById("chat-messages");
    chatbox.scrollTop = chatbox.scrollHeight;
  }
  
  function handleChat() {
    const input = document.getElementById("chat-input");
    const userMessage = input.value.trim();
    if (!userMessage) return;
    input.value = "";
    messageHistory.push({ role: "user", text: userMessage });
  
    const chatbox = document.getElementById("chat-messages");
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    scrollChat();
  
    const thinkingLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(thinkingLi);
    scrollChat();
  
    generateResponse(thinkingLi);
  }
  