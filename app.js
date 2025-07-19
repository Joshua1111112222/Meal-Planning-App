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
  
  async function loadModel() {
    generator = await window.transformers.pipeline("text-generation", "Xenova/gpt2");
  }
  
  async function login() {
    const name = document.getElementById("username").value.trim();
    if (name) {
      localStorage.setItem("username", name);
      showWelcome();
    }
  }
  
  function showWelcome() {
    document.getElementById("login-screen").style.display = "none";
    const name = localStorage.getItem("username");
    const greet = greetings[Math.floor(Math.random() * greetings.length)].replace("NAME", name);
    document.getElementById("greeting").textContent = greet;
    document.getElementById("welcome-screen").style.display = "block";
  
    setTimeout(() => {
      document.getElementById("welcome-screen").style.display = "none";
      document.getElementById("app-screen").style.display = "block";
      buildTable();
    }, 3000);
  }
  
  function buildTable() {
    const table = document.getElementById("meal-table");
    table.innerHTML = "";
    days.forEach(day => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${day}</td>
        <td><input type="text" id="${day}-breakfast" placeholder="Breakfast" /></td>
        <td><input type="text" id="${day}-lunch" placeholder="Lunch" /></td>
        <td><input type="text" id="${day}-dinner" placeholder="Dinner" /></td>
      `;
      table.appendChild(row);
    });
  }
  
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
  
  function formatMealsText(meals) {
    let text = "Here's my weekly meal plan:\n";
    for (const day of days) {
      text += `${day}:\n`;
      text += `Breakfast: ${meals[day].breakfast || "None"}\n`;
      text += `Lunch: ${meals[day].lunch || "None"}\n`;
      text += `Dinner: ${meals[day].dinner || "None"}\n\n`;
    }
    return text;
  }
  
  async function analyze() {
    if (!generator) {
      document.getElementById("output").textContent = "Loading AI model, please wait...";
      await loadModel();
    }
  
    toggleButtons(false);
    const meals = getMeals();
    const prompt = formatMealsText(meals) + "\nRate the healthiness of this meal plan in a friendly way:";
    const output = await generator(prompt, { max_length: 100 });
    document.getElementById("output").textContent = output[0].generated_text;
    toggleButtons(true);
  }
  
  async function editMeals() {
    if (!generator) {
      document.getElementById("output").textContent = "Loading AI model, please wait...";
      await loadModel();
    }
  
    toggleButtons(false);
    const meals = getMeals();
    const prompt = formatMealsText(meals) + "\nSuggest improvements to make this meal plan healthier and more balanced:";
    const output = await generator(prompt, { max_length: 150 });
    document.getElementById("output").textContent = output[0].generated_text;
    toggleButtons(true);
  }
  
  function toggleButtons(enabled) {
    document.querySelector('button[onclick="analyze()"]').disabled = !enabled;
    document.querySelector('button[onclick="editMeals()"]').disabled = !enabled;
  }
  
  window.onload = async () => {
    await loadModel();
    const name = localStorage.getItem("username");
    if (name) showWelcome();
  };
  