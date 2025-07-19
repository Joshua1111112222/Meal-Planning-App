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
  
  let aiChatVisible = false;
  let messageHistory = []; // for AI conversation context
  
  window.onload = () => {
    if (localStorage.getItem("username")) showWelcome();
    document.getElementById("login-btn").onclick = login;
    document.getElementById("save-meals").onclick = saveMealsToStorage;
    document.querySelector(".chatbot-toggler").onclick = toggleChat;
    document.querySelector(".chat-input span").onclick = handleChat;
    document.querySelector(".chat-input textarea").oninput = autoGrowTextarea;
    document.querySelector(".chat-input textarea").addEventListener("keydown", e => {
      if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();
        handleChat();
      }
    });
    document.querySelector(".close-btn").onclick = () => {
      aiChatVisible = false;
      document.body.classList.remove("show-chatbot");
    };
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
        buildTable();
        loadMealsFromStorage();
        document.getElementById("app-screen").focus();
        // Reset chat history for new session
        messageHistory = [];
        // Send welcome AI message to chatbox
        addBotMessage(`Hi! I'm ChefBot, created by Joshua The. How can I assist you today?`);
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
    const msgElem = document.getElementById("save-message");
    msgElem.textContent = "Meal plan saved!";
    setTimeout(() => msgElem.textContent = "", 2000);
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
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    document.body.classList.toggle("show-chatbot", aiChatVisible);
    if (aiChatVisible) {
      const textarea = document.querySelector(".chat-input textarea");
      textarea.focus();
    }
  }
  
  function appendMessage(text, cls) {
    const chatbox = document.querySelector(".chatbox");
    const li = document.createElement("li");
    li.classList.add("chat", cls);
    if (cls === "incoming") {
      li.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
      li.querySelector("p").textContent = text;
    } else {
      li.textContent = text;
    }
    chatbox.appendChild(li);
    chatbox.scrollTop = chatbox.scrollHeight;
  }
  
  function addBotMessage(text) {
    appendMessage(text, "incoming");
    messageHistory.push({ role: "assistant", text });
  }
  
  function addUserMessage(text) {
    appendMessage(text, "outgoing");
    messageHistory.push({ role: "user", text });
  }
  
  function autoGrowTextarea() {
    const textarea = this;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  
  async function handleChat() {
    const textarea = document.querySelector(".chat-input textarea");
    const msg = textarea.value.trim();
    if (!msg) return;
    textarea.value = "";
    autoGrowTextarea.call(textarea);
  
    addUserMessage(msg);
    addBotMessage("Thinking...");
  
    try {
      const responseText = await fetchGeminiResponse(msg);
      // Remove last "Thinking..." message
      const chatbox = document.querySelector(".chatbox");
      const chats = chatbox.querySelectorAll("li.incoming");
      if (chats.length) chats[chats.length - 1].remove();
  
      addBotMessage(responseText);
    } catch (error) {
      // Remove last "Thinking..." message
      const chatbox = document.querySelector(".chatbox");
      const chats = chatbox.querySelectorAll("li.incoming");
      if (chats.length) chats[chats.length - 1].remove();
  
      appendMessage(`Error: ${error.message}`, "incoming");
    }
  }
  
  async function fetchGeminiResponse(userMsg) {
    // Push the current user message into history first
    messageHistory.push({ role: "user", text: userMsg });
  
    // Build the full conversation context with system prompt
    const systemPrompt = {
      role: "system",
      text: "You are ChefBot, an AI created by Joshua The. Your purpose is to assist with meal planning and friendly chat."
    };
  
    const messages = [systemPrompt, ...messageHistory];
  
    const API_KEY = "AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE"; // For testing only, replace or use env var later
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
    const body = {
      prompt: {
        messages: messages.map(msg => ({
          author: { role: msg.role },
          content: { text: msg.text }
        }))
      },
      temperature: 0.7,
      candidate_count: 1,
      max_output_tokens: 150,
    };
  
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Unknown API error");
    }
  
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.text?.trim() || "Sorry, I can't answer that.";
  
    // Add assistant response to message history
    messageHistory.push({ role: "assistant", text });
  
    return text;
  }
  