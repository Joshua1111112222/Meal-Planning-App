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
  
  // Initialize the app
  window.onload = () => {
    const username = localStorage.getItem("username");
    if (username) {
      showWelcome(username);
    } else {
      showScreen("login-screen");
    }
  
    // Setup event listeners
    document.getElementById("login-btn").addEventListener("click", login);
    document.getElementById("save-meals").addEventListener("click", saveMealsToStorage);
    document.querySelector(".chatbot-toggler").addEventListener("click", toggleChat);
    document.querySelector(".close-btn").addEventListener("click", closeChat);
    document.getElementById("chat-input").addEventListener("keydown", handleChatInput);
    document.querySelector(".chat-input span").addEventListener("click", handleChat);
  
    // Build the meal table
    buildMealTable();
    loadMealsFromStorage();
  };
  
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.style.display = screen.id === screenId ? "flex" : "none";
    });
  }
  
  function login() {
    const username = document.getElementById("username").value.trim();
    if (!username) {
      alert("Please enter your name.");
      return;
    }
    localStorage.setItem("username", username);
    showWelcome(username);
  }
  
  function showWelcome(username) {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    document.getElementById("greeting").textContent = randomGreeting.replace("NAME", username);
    showScreen("welcome-screen");
    
    setTimeout(() => {
      showScreen("app-screen");
      updateHealthColors();
    }, 2000);
  }
  
  function buildMealTable() {
    // Create cells for each meal section
    meals.forEach(meal => {
      const mealRow = document.querySelector(`.meal-header:nth-child(${meals.indexOf(meal) * 3 + 1}`);
      const healthRow = mealRow.nextElementSibling;
      const percentRow = healthRow.nextElementSibling;
      
      days.forEach(day => {
        // Meal input cell
        const mealCell = document.createElement("td");
        mealCell.innerHTML = `<input class="meal-input" type="text" id="${day}-${meal}" placeholder="Enter ${meal}" />`;
        mealRow.appendChild(mealCell);
        
        // Health bar cell
        const healthCell = document.createElement("td");
        healthCell.innerHTML = `<input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${meal}-health" />`;
        healthRow.appendChild(healthCell);
        
        // Percentage cell
        const percentCell = document.createElement("td");
        percentCell.innerHTML = `<span class="slider-value" id="${day}-${meal}-percent">50%</span>`;
        percentRow.appendChild(percentCell);
        
        // Add event listener to health slider
        const slider = healthCell.querySelector(".health-slider");
        const percent = percentCell.querySelector(".slider-value");
        
        slider.addEventListener("input", () => {
          const value = slider.value;
          percent.textContent = `${value}%`;
          updateHealthColors();
        });
      });
    });
  }
  
  function updateHealthColors() {
    days.forEach(day => {
      meals.forEach(meal => {
        const slider = document.getElementById(`${day}-${meal}-health`);
        if (!slider) return;
        
        const value = parseInt(slider.value);
        const healthLevel = Math.min(Math.floor(value / 10), 10);
        const percentElement = document.getElementById(`${day}-${meal}-percent`);
        
        // Remove all health classes
        percentElement.classList.remove(...Array.from({ length: 11 }, (_, i) => `health-${i}`));
        // Add the appropriate health class
        percentElement.classList.add(`health-${healthLevel}`);
      });
    });
  }
  
  function saveMealsToStorage() {
    const mealData = {};
    
    days.forEach(day => {
      mealData[day] = {};
      meals.forEach(meal => {
        const mealInput = document.getElementById(`${day}-${meal}`);
        const healthInput = document.getElementById(`${day}-${meal}-health`);
        
        mealData[day][meal] = {
          meal: mealInput.value,
          healthScore: parseInt(healthInput.value)
        };
      });
    });
    
    localStorage.setItem("mealData", JSON.stringify(mealData));
    
    // Show save confirmation
    document.getElementById("save-message").textContent = "Meal plan saved successfully!";
    setTimeout(() => {
      document.getElementById("save-message").textContent = "";
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
        const healthInput = document.getElementById(`${day}-${meal}-health`);
        const percentElement = document.getElementById(`${day}-${meal}-percent`);
        
        if (mealInput && healthInput && percentElement) {
          mealInput.value = dayMeal.meal;
          healthInput.value = dayMeal.healthScore;
          percentElement.textContent = `${dayMeal.healthScore}%`;
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
  
  function handleChatInput(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  }
  
  function handleChat() {
    const message = document.getElementById("chat-input").value.trim();
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, "outgoing");
    document.getElementById("chat-input").value = "";
    
    // Show "Thinking..." message
    const thinkingMessage = addChatMessage("Thinking...", "incoming");
    
    // Generate AI response
    generateAIResponse(message, thinkingMessage);
  }
  
  function addChatMessage(message, type) {
    const chatbox = document.getElementById("chat-messages");
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
    
    chatbox.appendChild(li);
    chatbox.scrollTop = chatbox.scrollHeight;
    
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
            parts: [{ text: `You are ChefBot, a helpful cooking assistant. Be concise. ${userMessage}` }]
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