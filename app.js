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
  
  let generator; // AI pipeline
  let aiChatVisible = false;
  
  // Login logic
  function login() {
    const name = document.getElementById("username").value.trim();
    if (!name) return;
    localStorage.setItem("username", name);
    showWelcome();
  }
  
  function showWelcome() {
    document.getElementById("login-screen").style.display = "none";
    const name = localStorage.getItem("username");
    const greet = greetings[Math.floor(Math.random() * greetings.length)].replace("NAME", name);
    const welcomeScreen = document.getElementById("welcome-screen");
    document.getElementById("greeting").textContent = greet;
    welcomeScreen.style.display = "flex";
    welcomeScreen.style.opacity = "1";
  
    setTimeout(() => {
      // fade out welcome screen
      welcomeScreen.style.opacity = "0";
      setTimeout(() => {
        welcomeScreen.style.display = "none";
        showAppScreen();
      }, 500);
    }, 3000);
  }
  
  function showAppScreen() {
    document.getElementById("app-screen").style.display = "block";
    buildTable();
    loadMealsFromStorage();
  }
  
  // Build meal input table
  function buildTable() {
    const tbody = document.querySelector("#meal-table tbody");
    tbody.innerHTML = "";
    days.forEach(day => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${day}</td>
        <td><input type="text" id="${day}-breakfast" placeholder="Breakfast" autocomplete="off"/></td>
        <td><input type="text" id="${day}-lunch" placeholder="Lunch" autocomplete="off"/></td>
        <td><input type="text" id="${day}-dinner" placeholder="Dinner" autocomplete="off"/></td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Save/load meals to localStorage
  function getMeals() {
    let data = {};
    days.forEach(day => {
      data[day] = {
        breakfast: document.getElementById(`${day}-breakfast`).value,
        lunch: document.getElementById(`${day}-lunch`).value,
        dinner: document.getElementById(`${day}-dinner`).value
      };
    });
    return data;
  }
  
  function saveMealsToStorage() {
    const meals = getMeals();
    localStorage.setItem("meals", JSON.stringify(meals));
    const saveMsg = document.getElementById("save-message");
    saveMsg.textContent = "Meal plan saved!";
    setTimeout(() => saveMsg.textContent = "", 2500);
  }
  
  function loadMealsFromStorage() {
    const saved = localStorage.getItem("meals");
    if (!saved) return;
    const meals = JSON.parse(saved);
    days.forEach(day => {
      document.getElementById(`${day}-breakfast`).value = meals[day]?.breakfast || "";
      document.getElementById(`${day}-lunch`).value = meals[day]?.lunch || "";
      document.getElementById(`${day}-dinner`).value = meals[day]?.dinner || "";
    });
  }
  
  // AI Chat setup
  
  async function loadModel() {
    if (!generator) {
      generator = await window.transformers.pipeline("text-generation", "Xenova/gpt2");
    }
  }
  
  function appendMessage(text, sender = "ai") {
    const chatMessages = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.classList.add("message", sender === "user" ? "user-message" : "ai-message");
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  async function chatWithAI(message) {
    appendMessage(message, "user");
    if (!generator) {
      appendMessage("Loading AI model, please wait...", "ai");
      await loadModel();
    }
  
    const prompt = `User: ${message}\nAI:`;
  
    const output = await generator(prompt, { max_length: 100 });
    let response = output[0].generated_text.replace(prompt, "").trim();
  
    if (!response) response = "Sorry, I couldn't understand that.";
  
    appendMessage(response, "ai");
  }
  
  // Toggle chat window
  function toggleChat() {
    const chat = document.getElementById("ai-chat");
    aiChatVisible = !aiChatVisible;
    chat.style.display = aiChatVisible ? "flex" : "none";
  }
  
  // Event listeners
  
  window.onload = () => {
    const name = localStorage.getItem("username");
    if (name) {
      showWelcome();
    }
  };
  
  document.getElementById("login-btn").addEventListener("click", login);
  
  document.getElementById("save-meals").addEventListener("click", saveMealsToStorage);
  
  document.getElementById("chat-toggle").addEventListener("click", toggleChat);
  
  document.getElementById("chat-form").addEventListener("submit", async e => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    await chatWithAI(message);
  });
  