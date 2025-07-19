// ===== CONSTANTS =====
const greetings = [
    "Welcome back, NAME! Let's plan some delicious meals!",
    "Great to see you again, NAME! Ready to map out your meals?",
    "NAME! Your meal planning journey continues!",
    "Hello NAME! Let's create some tasty meal plans!",
    "Hi NAME! Your personalized meal planner is ready!",
    "Welcome NAME! Let's make meal planning fun and easy!",
    "NAME! Time to organize your perfect week of meals!",
    "Hello there NAME! Your meal adventure awaits!"
  ];
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["Breakfast", "Lunch", "Dinner"];
  
  // Gemini API Configuration
  const API_KEY = "AIzaSyBmvvOHdCEkqg8UYVh2tVoe2EFEV5rLYvE";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  // ===== STATE VARIABLES =====
  let currentUser = null;
  let messageHistory = [];
  let aiChatVisible = false;
  
  // ===== DOM ELEMENTS =====
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
  const sendBtn = document.getElementById("send-btn");
  const chatMessages = document.getElementById("chat-messages");
  
  // ===== INITIALIZATION =====
  window.addEventListener("DOMContentLoaded", initializeApp);
  
  function initializeApp() {
    checkAuthState();
    setupEventListeners();
  }
  
  function checkAuthState() {
    const username = localStorage.getItem("username");
    if (username) {
      currentUser = username;
      showWelcomeScreen();
    } else {
      showLoginScreen();
    }
  }
  
  function setupEventListeners() {
    loginBtn.addEventListener("click", handleLogin);
    saveBtn.addEventListener("click", saveMealPlan);
    chatToggler.addEventListener("click", toggleChatbot);
    closeBtn.addEventListener("click", toggleChatbot);
    chatInput.addEventListener("keydown", handleChatInput);
    sendBtn.addEventListener("click", handleSendMessage);
  }
  
  // ===== SCREEN MANAGEMENT =====
  function showLoginScreen() {
    hideAllScreens();
    loginScreen.style.display = "flex";
    usernameInput.focus();
  }
  
  function showWelcomeScreen() {
    hideAllScreens();
    welcomeScreen.style.display = "flex";
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    greetingElement.textContent = randomGreeting.replace("NAME", currentUser);
    
    setTimeout(() => {
      showAppScreen();
    }, 2000);
  }
  
  function showAppScreen() {
    hideAllScreens();
    appScreen.style.display = "block";
    initializeMealTable();
    loadSavedMeals();
  }
  
  function hideAllScreens() {
    loginScreen.style.display = "none";
    welcomeScreen.style.display = "none";
    appScreen.style.display = "none";
  }
  
  // ===== AUTHENTICATION =====
  function handleLogin() {
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter your name to continue");
      return;
    }
    
    currentUser = username;
    localStorage.setItem("username", username);
    showWelcomeScreen();
  }
  
  // ===== MEAL TABLE FUNCTIONALITY =====
  function initializeMealTable() {
    meals.forEach((meal, mealIndex) => {
      const mealRow = document.querySelector(`.meal-header:nth-child(${mealIndex * 3 + 1})`);
      const healthRow = mealRow.nextElementSibling;
      const percentRow = healthRow.nextElementSibling;
      
      days.forEach(day => {
        // Meal input cell
        const mealCell = document.createElement("td");
        mealCell.className = "meal-cell";
        mealCell.innerHTML = `<input class="meal-input" type="text" id="${day}-${meal}"${meal}?" />`;
        mealRow.appendChild(mealCell);
        
        // Health slider cell
        const healthCell = document.createElement("td");
        healthCell.className = "meal-cell";
        healthCell.innerHTML = `<input class="health-slider" type="range" min="0" max="100" value="50" id="${day}-${meal}-health" />`;
        healthRow.appendChild(healthCell);
        
        // Percentage cell
        const percentCell = document.createElement("td");
        percentCell.className = "meal-cell";
        percentCell.innerHTML = `<span class="health-percent" id="${day}-${meal}-percent">50%</span>`;
        percentRow.appendChild(percentCell);
        
        // Setup slider interaction
        const slider = healthCell.querySelector(".health-slider");
        const percentDisplay = percentCell.querySelector(".health-percent");
        
        slider.addEventListener("input", () => {
          const value = slider.value;
          percentDisplay.textContent = `${value}%`;
          updateHealthStyles(mealCell, value);
          updateHealthStyles(healthCell, value);
          updateHealthStyles(percentCell, value);
        });
      });
    });
  }
  
  function updateHealthStyles(element, value) {
    const healthLevel = Math.min(Math.floor(value / 10), 10);
    
    // Remove all existing health classes
    element.classList.remove(...Array.from({ length: 11 }, (_, i) => `health-${i}`));
    
    // Add the appropriate health class
    element.classList.add(`health-${healthLevel}`);
  }
  
  function saveMealPlan() {
    if (!currentUser) return;
    
    const mealData = {};
    
    days.forEach(day => {
      mealData[day] = {};
      
      meals.forEach(meal => {
        const mealInput = document.getElementById(`${day}-${meal}`);
        const healthInput = document.getElementById(`${day}-${meal}-health`);
        
        mealData[day][meal] = {
          name: mealInput.value.trim(),
          healthScore: parseInt(healthInput.value)
        };
      });
    });
    
    localStorage.setItem(`mealData_${currentUser}`, JSON.stringify(mealData));
    showSaveMessage("Meal plan saved successfully!", "success");
  }
  
  function loadSavedMeals() {
    if (!currentUser) return;
    
    const savedData = localStorage.getItem(`mealData_${currentUser}`);
    if (!savedData) return;
    
    const mealData = JSON.parse(savedData);
    
    days.forEach(day => {
      meals.forEach(meal => {
        const dayMeal = mealData[day]?.[meal];
        if (!dayMeal) return;
        
        const mealInput = document.getElementById(`${day}-${meal}`);
        const healthInput = document.getElementById(`${day}-${meal}-health`);
        const percentDisplay = document.getElementById(`${day}-${meal}-percent`);
        const mealCell = mealInput.closest("td");
        const healthCell = healthInput.closest("td");
        const percentCell = percentDisplay.closest("td");
        
        if (mealInput && healthInput && percentDisplay) {
          mealInput.value = dayMeal.name;
          healthInput.value = dayMeal.healthScore;
          percentDisplay.textContent = `${dayMeal.healthScore}%`;
          
          updateHealthStyles(mealCell, dayMeal.healthScore);
          updateHealthStyles(healthCell, dayMeal.healthScore);
          updateHealthStyles(percentCell, dayMeal.healthScore);
        }
      });
    });
  }
  
  function showSaveMessage(message, type) {
    saveMessage.textContent = message;
    saveMessage.className = type;
    
    setTimeout(() => {
      saveMessage.textContent = "";
      saveMessage.className = "";
    }, 3000);
  }
  
  // ===== CHATBOT FUNCTIONALITY =====
  function toggleChatbot() {
    aiChatVisible = !aiChatVisible;
    document.body.classList.toggle("show-chatbot", aiChatVisible);
    
    if (aiChatVisible) {
      chatInput.focus();
    }
  }
  
  function handleChatInput(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }
  
  function handleSendMessage() {
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
  
  function addChatMessage(content, type) {
    const messageElement = document.createElement("li");
    messageElement.className = `chat ${type}`;
    
    if (type === "incoming") {
      messageElement.innerHTML = `
        <span class="material-symbols-outlined">nutrition</span>
        <p>${content}</p>
      `;
    } else {
      messageElement.textContent = content;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageElement.querySelector("p") || messageElement;
  }
  
  async function generateAIResponse(userMessage, messageElement) {
    try {
      // Add user message to history
      messageHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
      
      // Prepare the prompt
      const prompt = `You are ChefBot, a helpful cooking assistant integrated with MealMapper. 
      The user is planning their meals for the week. Be concise but helpful with your responses.
      Current user: ${currentUser}
      User message: ${userMessage}`;
      
      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256
        }
      };
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                         "I couldn't generate a response. Please try again.";
      
      // Update the message element
      messageElement.textContent = botResponse;
      
      // Add bot reply to history
      messageHistory.push({
        role: "model",
        parts: [{ text: botResponse }]
      });
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      messageElement.textContent = "Sorry, I'm having trouble responding right now. Please try again later.";
      messageElement.classList.add("error");
    }
  }