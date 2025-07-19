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
  let aiChatVisible = false;
  
  // DOM Elements
  const loginScreen = document.getElementById("login-screen");
  const welcomeScreen = document.getElementById("welcome-screen");
  const appScreen = document.getElementById("app-screen");
  const usernameInput = document.getElementById("username");
  const loginBtn = document.getElementById("login-btn");
  const greetingElement = document.getElementById("greeting");
  const saveBtn = document.getElementById("save-meals");
  const saveMessage = document.getElementById("save-message");
  const mealTable = document.getElementById("meal-table");
  const chatToggler = document.querySelector(".chatbot-toggler");
  const chatbot = document.querySelector(".chatbot");
  const closeBtn = document.querySelector(".close-btn");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.querySelector(".chat-input span");
  const chatMessages = document.getElementById("chat-messages");
  
  // Initialize the app
  window.onload = () => {
    const username = localStorage.getItem("username");
    if (username) {
      showWelcome(username);
    } else {
      showScreen("login-screen");
    }
  
    // Event listeners
    loginBtn.addEventListener("click", login);
    saveBtn.addEventListener("click", saveMealsToStorage);
    chatToggler.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", closeChat);
    chatInput.addEventListener("keydown", handleChatInput);
    sendBtn.addEventListener("click", handleChat);
  
    // Build the meal table
    buildMealTable();
    loadMealsFromStorage();
  };
  
  function showScreen(screenId) {
    [loginScreen, welcomeScreen, appScreen].forEach(screen => {
      screen.style.display = screen === document.getElementById(screenId) ? "flex" : "none";
    });
  }
  
  function login() {
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter your name.");
      return;
    }
    localStorage.setItem("username", username);
    showWelcome(username);
  }
  
  function showWelcome(username) {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    greetingElement.textContent = randomGreeting.replace("NAME", username);
    showScreen("welcome-screen");
    
    setTimeout(() => {
      showScreen("app-screen");
      updateHealthColors();
    }, 2000);
  }
  
  function buildMealTable() {
    // Create cells for each meal row
    meals.forEach(meal => {
      const row = document.getElementById(`${meal.toLowerCase()}-row`);
      
      days.forEach(day => {
        const cell = document.createElement("td");
        cell.className = "meal-cell";
        cell.innerHTML = `
          <input class="meal-input" type="text" id="${day}-${meal}" placeholder="Enter ${meal}" />
          <input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${meal}-score" />
          <div class="slider-value" id="${day}-${meal}-value">50%</div>
        `;
        row.appendChild(cell);
        
        // Setup slider event
        const slider = cell.querySelector(".health-slider");
        const valueDisplay = cell.querySelector(".slider-value");
        slider.addEventListener("input", () => {
          const value = slider.value;
          valueDisplay.textContent = `${value}%`;
          updateHealthColors();
        });
      });
    });
  }
  
  function updateHealthColors() {
    days.forEach(day => {
      meals.forEach(meal => {
        const slider = document.getElementById(`${day}-${meal}-score`);
        if (!slider) return;
        
        const value = parseInt(slider.value);
        const healthLevel = Math.min(Math.floor(value / 10), 10);
        const cell = slider.closest("td");
        
        // Remove all health classes
        cell.classList.remove(...Array.from({ length: 11 }, (_, i) => `health-${i}`));
        // Add the appropriate health class
        cell.classList.add(`health-${healthLevel}`);
      });
    });
  }
  
  function saveMealsToStorage() {
    const mealData = {};
    
    days.forEach(day => {
      mealData[day] = {};
      meals.forEach(meal => {
        const mealInput = document.getElementById(`${day}-${meal}`);
        const healthInput = document.getElementById(`${day}-${meal}-score`);
        
        mealData[day][meal] = {
          meal: mealInput.value,
          healthScore: parseInt(healthInput.value)
        };
      });
    });
    
    localStorage.setItem("mealData", JSON.stringify(mealData));
    
    // Show save confirmation
    saveMessage.textContent = "Meal plan saved successfully!";
    setTimeout(() => {
      saveMessage.textContent = "";
    }, 2000);
  }
  
  function loadMealsFromStorage() {
    const savedData = localStorage.getItem("mealData");
    if (!savedData) return;
    
    const mealData = JSON.parse(savedData);
    
    days.forEach(day => {
      meals.forEach(meal => {
        const dayMeal = mealData[day]?.[meal];
        if (!dayMeal) return;
        
        const mealInput = document.getElementById(`${day}-${meal}`);
        const healthInput = document.getElementById(`${day}-${meal}-score`);
        const valueDisplay = document.getElementById(`${day}-${meal}-value`);
        
        if (mealInput && healthInput && valueDisplay) {
          mealInput.value = dayMeal.meal;
          healthInput.value = dayMeal.healthScore;
          valueDisplay.textContent = `${dayMeal.healthScore}%`;
        }
      });
    });
    
    updateHealthColors();
  }
  
  function toggleChat() {
    aiChatVisible = !aiChatVisible;
    document.body.classList.toggle("show-chatbot", aiChatVisible);
    if (aiChatVisible) {
      chatInput.focus();
    }
  }
  
  function closeChat() {
    aiChatVisible = false;
    document.body.classList.remove("show-chatbot");
  }
  
  function handleChatInput(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  }
  
  function handleChat() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, "outgoing");
    chatInput.value = "";
    
    // Show "Thinking..." message
    const thinkingMessage = addChatMessage("Thinking...", "incoming");
    
    // Generate AI response
    generateAIResponse(message, thinkingMessage);
  }
  
  function addChatMessage(message, type) {
    const li = document.createElement("li");
    li.className = `chat ${type}`;
    
    if (type === "incoming") {
      li.innerHTML = `
        <span class="material-symbols-outlined">smart_toy</span>
        <p>${message}</p>
      `;
    } else {
      li.textContent = message;
    }
    
    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return li.querySelector("p") || li;
  }
  
  async function generateAIResponse(userMessage, messageElement) {
    try {
      // Add user message to history
      messageHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
      
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are ChefBot, a helpful cooking assistant. Help the user with anything they ask and if you don't know take your best guess or say, "I apologize I am still currently testing please be patient with me and I will try again next time". ${userMessage}` }]
          }]
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to get response");
      
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      
      // Update the message element
      messageElement.textContent = botReply;
      
      // Add bot reply to history
      messageHistory.push({
        role: "model",
        parts: [{ text: botReply }]
      });
      
    } catch (error) {
      messageElement.classList.add("error");
      messageElement.textContent = `Error: ${error.message}`;
    }
  }