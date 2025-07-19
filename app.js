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
  
  let currentView = 'table';
  let messageHistory = [];
  let aiChatVisible = false;
  
  window.onload = () => {
    const username = localStorage.getItem("username");
    if (username) {
      showWelcome();
    } else {
      showScreen("login-screen");
    }
  
    document.getElementById("login-btn").onclick = login;
    document.getElementById("save-meals").onclick = saveMealsToStorage;
    document.getElementById("tableViewBtn").onclick = () => switchView('table');
    document.getElementById("cardViewBtn").onclick = () => switchView('card');
  
    document.querySelector(".chatbot-toggler").onclick = toggleChat;
    document.querySelector(".close-btn").onclick = closeChat;
    document.getElementById("chat-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });
    document.querySelector(".chat-input span[role='button']").onclick = handleChat;
  
    buildTableView();
    buildCardView();
    loadMealsFromStorage();
  };
  
  function login() {
    const name = document.getElementById("username").value.trim();
    if (!name) return alert("Please enter your name.");
    localStorage.setItem("username", name);
    showWelcome();
  }
  
  function showWelcome() {
    showScreen("welcome-screen");
    const name = localStorage.getItem("username");
    const greeting = greetings[Math.floor(Math.random() * greetings.length)].replace("NAME", name);
    document.getElementById("greeting").textContent = greeting;
    
    setTimeout(() => {
      showScreen("app-screen");
      updateHealthColors();
    }, 2000);
  }
  
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.style.display = "none";
    });
    document.getElementById(screenId).style.display = "flex";
  }
  
  function switchView(view) {
    currentView = view;
    document.getElementById("table-view").style.display = view === 'table' ? 'block' : 'none';
    document.getElementById("card-view").style.display = view === 'card' ? 'block' : 'none';
    document.getElementById("tableViewBtn").classList.toggle('active', view === 'table');
    document.getElementById("cardViewBtn").classList.toggle('active', view === 'card');
    updateHealthColors();
  }
  
  function buildTableView() {
    const tbody = document.querySelector("#meal-table tbody");
    tbody.innerHTML = "";
    
    days.forEach(day => {
      const tr = document.createElement("tr");
      
      const dayCell = document.createElement("td");
      dayCell.textContent = day;
      tr.appendChild(dayCell);
      
      meals.forEach(meal => {
        const cell = document.createElement("td");
        cell.className = "meal-cell";
        cell.innerHTML = `
          <input class="meal-input" type="text" id="${day}-${meal}" placeholder="${meal}" />
          <input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${meal}-score" />
          <div class="slider-value" id="${day}-${meal}-value">50%</div>
        `;
        tr.appendChild(cell);
        
        const slider = cell.querySelector(".health-slider");
        const valueDisplay = cell.querySelector(".slider-value");
        slider.oninput = () => {
          const value = slider.value;
          valueDisplay.textContent = `${value}%`;
          updateHealthColors();
          syncInputs(day, meal, value);
        };
      });
      
      tbody.appendChild(tr);
    });
  }
  
  function buildCardView() {
    const container = document.querySelector(".days-container");
    container.innerHTML = "";
    
    days.forEach(day => {
      const dayCard = document.createElement("div");
      dayCard.className = "day-card";
      dayCard.innerHTML = `
        <div class="day-header">${day}</div>
        <div class="meals-container" id="${day}-meals"></div>
      `;
      container.appendChild(dayCard);
      
      const mealsContainer = dayCard.querySelector(".meals-container");
      
      meals.forEach(meal => {
        const mealCard = document.createElement("div");
        mealCard.className = "meal-card";
        mealCard.id = `${day}-${meal}-card`;
        mealCard.innerHTML = `
          <div><strong>${meal}:</strong></div>
          <input class="meal-input" type="text" id="${day}-${meal}-card-input" />
          <input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${meal}-card-score" />
          <div class="slider-value" id="${day}-${meal}-card-value">50%</div>
        `;
        mealsContainer.appendChild(mealCard);
        
        const slider = mealCard.querySelector(".health-slider");
        const valueDisplay = mealCard.querySelector(".slider-value");
        slider.oninput = () => {
          const value = slider.value;
          valueDisplay.textContent = `${value}%`;
          updateHealthColors();
          syncInputs(day, meal, value);
        };
      });
    });
  }
  
  function syncInputs(day, meal, value) {
    if (currentView === 'table') {
      document.getElementById(`${day}-${meal}-card-score`).value = value;
      document.getElementById(`${day}-${meal}-card-value`).textContent = `${value}%`;
      document.getElementById(`${day}-${meal}-card-input`).value = document.getElementById(`${day}-${meal}`).value;
    } else {
      document.getElementById(`${day}-${meal}-score`).value = value;
      document.getElementById(`${day}-${meal}-value`).textContent = `${value}%`;
      document.getElementById(`${day}-${meal}`).value = document.getElementById(`${day}-${meal}-card-input`).value;
    }
  }
  
  function updateHealthColors() {
    days.forEach(day => {
      meals.forEach(meal => {
        const score = parseInt(document.getElementById(`${day}-${meal}-score`).value);
        const healthLevel = Math.min(Math.floor(score / 10), 10);
        
        // Update table view
        const tableCell = document.querySelector(`#${day}-${meal}`).parentElement;
        tableCell.className = `meal-cell health-${healthLevel}`;
        
        // Update card view
        const mealCard = document.getElementById(`${day}-${meal}-card`);
        if (mealCard) {
          mealCard.className = `meal-card health-${healthLevel}`;
        }
      });
    });
  }
  
  function saveMealsToStorage() {
    const mealData = {};
    days.forEach(day => {
      mealData[day] = {};
      meals.forEach(meal => {
        const mealText = document.getElementById(`${day}-${meal}`).value;
        const score = document.getElementById(`${day}-${meal}-score`).value;
        mealData[day][meal] = { meal: mealText, healthScore: score };
      });
    });
    localStorage.setItem("mealData", JSON.stringify(mealData));
    
    const saveMsg = document.getElementById("save-message");
    saveMsg.textContent = "Meal plan saved!";
    setTimeout(() => saveMsg.textContent = "", 2000);
  }
  
  function loadMealsFromStorage() {
    const saved = localStorage.getItem("mealData");
    if (!saved) return;
    
    const mealData = JSON.parse(saved);
    days.forEach(day => {
      meals.forEach(meal => {
        if (mealData[day] && mealData[day][meal]) {
          document.getElementById(`${day}-${meal}`).value = mealData[day][meal].meal;
          document.getElementById(`${day}-${meal}-score`).value = mealData[day][meal].healthScore;
          document.getElementById(`${day}-${meal}-value`).textContent = `${mealData[day][meal].healthScore}%`;
          
          if (document.getElementById(`${day}-${meal}-card-input`)) {
            document.getElementById(`${day}-${meal}-card-input`).value = mealData[day][meal].meal;
            document.getElementById(`${day}-${meal}-card-score`).value = mealData[day][meal].healthScore;
            document.getElementById(`${day}-${meal}-card-value`).textContent = `${mealData[day][meal].healthScore}%`;
          }
        }
      });
    });
    updateHealthColors();
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are ChefBot, a helpful cooking assistant. Be concise. ${userMessage}` }]
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