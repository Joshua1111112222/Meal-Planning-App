const greetings = [
    "Welcome back, NAME!",
    "NAME returns!",
    "Ready when you are, NAME.",
    "Let's cook up something good, NAME!",
    "Good to see you, NAME!",
    "Let's get planning, NAME!",
    "Chef NAME is in the house!",
    "Meal time magic starts now, NAME!"
  ];
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["Breakfast", "Lunch", "Dinner"];
  
  let messageHistory = [];
  let isFirstMessage = true;
  let aiChatVisible = false;
  
  const API_KEY = "AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
  
  window.onload = () => {
    const username = localStorage.getItem("username");
    if (username) {
      showWelcome();
    } else {
      showScreen("login-screen");
    }
  
    document.getElementById("login-btn").onclick = login;
    document.getElementById("save-meals").onclick = saveMealsToStorage;
  
    document.querySelector(".chatbot-toggler").onclick = toggleChat;
    document.querySelector(".close-btn").onclick = closeChat;
  
    const chatInput = document.getElementById("chat-input");
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });
  
    // Handle virtual keyboard appearance
    chatInput.addEventListener('focus', () => {
      document.querySelector('.chatbot').classList.add('keyboard-visible');
    });
    
    chatInput.addEventListener('blur', () => {
      document.querySelector('.chatbot').classList.remove('keyboard-visible');
    });
  
    document.querySelector(".chat-input span[role='button']").onclick = handleChat;
  };
  
  function login() {
    const nameInput = document.getElementById("username");
    const name = nameInput.value.trim();
    if (!name) return alert("Please enter your name.");
    localStorage.setItem("username", name);
    showWelcome();
  }
  
  function showWelcome() {
    showScreen("welcome-screen");
    const name = localStorage.getItem("username");
    const greet = greetings[Math.floor(Math.random() * greetings.length)].replace(/NAME/g, name);
    const ws = document.getElementById("welcome-screen");
    const greetElem = document.getElementById("greeting");
    greetElem.textContent = greet;
    ws.style.opacity = "1";
  
    setTimeout(() => {
      showScreen("app-screen");
      buildTable();
      loadMealsFromStorage();
    }, 3000);
  }
  
  function showScreen(screenId) {
    ["login-screen", "welcome-screen", "app-screen"].forEach(id => {
      document.getElementById(id).style.display = (id === screenId) ? "flex" : "none";
    });
  }
  
  function buildTable() {
    const tbody = document.querySelector("#meal-table tbody");
    tbody.innerHTML = "";
    days.forEach(day => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${day}</td>
        ${meals.map(m => `
          <td class="meal-cell">
            <input class="meal-input" type="text" id="${day}-${m}" placeholder="${m}" />
            <div class="slider-container">
              <input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${m}-score" />
              <div class="slider-value" id="${day}-${m}-value">50%</div>
            </div>
          </td>
        `).join("")}
      `;
      tbody.appendChild(tr);
  
      meals.forEach(m => {
        const slider = document.getElementById(`${day}-${m}-score`);
        const valueDisplay = document.getElementById(`${day}-${m}-value`);
        slider.oninput = () => {
          valueDisplay.textContent = `${slider.value}%`;
          valueDisplay.style.color = getHealthColor(slider.value);
        };
      });
    });
  }
  
  function getHealthColor(value) {
    if (value < 30) return "#f44336";
    if (value < 70) return "#ffeb3b";
    return "#4caf50";
  }
  
  function saveMealsToStorage() {
    const mealData = {};
    days.forEach(day => {
      mealData[day] = {};
      meals.forEach(m => {
        const mealText = document.getElementById(`${day}-${m}`).value.trim();
        const score = Number(document.getElementById(`${day}-${m}-score`).value);
        mealData[day][m] = { meal: mealText, healthScore: score };
      });
    });
    localStorage.setItem("mealData", JSON.stringify(mealData));
    const saveMsg = document.getElementById("save-message");
    saveMsg.textContent = "Meal plan saved successfully!";
    setTimeout(() => (saveMsg.textContent = ""), 3000);
  }
  
  function loadMealsFromStorage() {
    const saved = localStorage.getItem("mealData");
    if (!saved) return;
    const mealData = JSON.parse(saved);
    days.forEach(day => {
      meals.forEach(m => {
        if (mealData[day] && mealData[day][m]) {
          document.getElementById(`${day}-${m}`).value = mealData[day][m].meal;
          const slider = document.getElementById(`${day}-${m}-score`);
          const valueDisplay = document.getElementById(`${day}-${m}-value`);
          slider.value = mealData[day][m].healthScore;
          valueDisplay.textContent = `${slider.value}%`;
          valueDisplay.style.color = getHealthColor(slider.value);
        }
      });
    });
  }
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    document.body.classList.toggle("show-chatbot", aiChatVisible);
    if (aiChatVisible) {
      document.getElementById("chat-input").focus();
    }
  }
  
  function closeChat() {
    aiChatVisible = false;
    document.body.classList.remove("show-chatbot");
  }
  
  function createChatLi(message, className) {
    const li = document.createElement("li");
    li.className = `chat ${className}`;
    if (className === "incoming") {
      li.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
      li.querySelector("p").textContent = message;
    } else {
      li.textContent = message;
    }
    return li;
  }
  
  async function generateResponse(chatElement) {
    const messageElement = chatElement.querySelector("p");
    const userMessage = messageHistory[messageHistory.length - 1].parts[0].text;
  
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are ChefBot, a helpful cooking assistant. Be concise. ${userMessage}`
            }]
          }]
        }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Error");
  
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      messageElement.textContent = botReply;
  
      messageHistory.push({
        role: "model",
        parts: [{ text: botReply }]
      });
  
    } catch (error) {
      messageElement.classList.add("error");
      messageElement.textContent = "Error: " + error.message;
    } finally {
      chatElement.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }
  
  function handleChat() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
  
    input.value = "";
    input.style.height = "auto";
  
    const chatbox = document.getElementById("chat-messages");
    const userLi = createChatLi(text, "outgoing");
    chatbox.appendChild(userLi);
    chatbox.scrollTop = chatbox.scrollHeight;
  
    messageHistory.push({
      role: "user",
      parts: [{ text }]
    });
  
    const thinkingLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(thinkingLi);
    chatbox.scrollTop = chatbox.scrollHeight;
  
    generateResponse(thinkingLi);
  }