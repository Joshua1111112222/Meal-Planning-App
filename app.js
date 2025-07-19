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
  
  function login() {
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
  
  const BACKEND_URL = "https://smart-meal-ai.onrender.com"; // ← your real backend

async function analyze() {
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(getMeals())
  });
  const result = await response.json();
  document.getElementById("output").textContent = result.analysis;
}

async function editMeals() {
  const response = await fetch(`${BACKEND_URL}/edit`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(getMeals())
  });
  const result = await response.json();
  document.getElementById("output").textContent = result.edited;
}

  