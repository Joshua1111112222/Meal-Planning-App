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
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["Breakfast", "Lunch", "Dinner"];
  
  let messageHistory = [];
  let isFirstMessage = true;
  let aiChatVisible = false;
  
  // Replace with your real API key here
const API_KEY = "AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE"; //API key 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateMessage?key=${API_KEY}`;
  
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
  
    document.getElementById("chat-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
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
  
    // After 3 seconds, switch to main app screen
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
      tr.innerHTML = `<td>${day}</td>` + meals.map(m => `
        <td>
          <input class="meal-input" type="text" id="${day}-${m}" placeholder="${m}" />
          <input class="health-slider" type="range" min="0" max="100" id="${day}-${m}-score" />
          <div class="slider-icons">
            <span>Unhealthy</span><span>Healthy</span>
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
    // color gradient handled by CSS background
    // no JS needed unless you want dynamic color changes
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
          document.getElementById(`${day}-${m}-score`).value = mealData[day][m].healthScore;
        }
      });
    });
  }
  
  // -----------------------
  // AI Chatbot functions
  // -----------------------
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    document.body.classList.toggle("show-chatbot", aiChatVisible);
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
  
    // Add user's message to history
    const userMessage = messageHistory[messageHistory.length - 1].content.text;
    
    // Prepare messages for Gemini API (user + assistant)
    // Include chat history, max last 6 messages for context
    const messagesForAPI = messageHistory.slice(-6);
  
    const body = {
      messages: messagesForAPI,
      temperature: 0.7,
      candidateCount: 1,
      maxOutputTokens: 256
    };
  
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
  
      if (!response.ok) throw new Error(data.error?.message || "API Error");
  
      const botReply = data.candidates?.[0]?.message?.content?.text || "No response";
  
      messageElement.textContent = botReply;
  
      // Add bot reply to message history
      messageHistory.push({
        author: "assistant",
        content: { text: botReply },
      });
  
    } catch (error) {
      messageElement.classList.add("error");
      messageElement.textContent = error.message;
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
  
    // Show user message
    const chatbox = document.getElementById("chat-messages");
    const userLi = createChatLi(text, "outgoing");
    chatbox.appendChild(userLi);
    chatbox.scrollTop = chatbox.scrollHeight;
  
    // Add user message to history
    messageHistory.push({
      author: "user",
      content: { text },
    });
  
    // Show "Thinking..."
    const thinkingLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(thinkingLi);
    chatbox.scrollTop = chatbox.scrollHeight;
  
    // Get bot response
    generateResponse(thinkingLi);
  }
  
  