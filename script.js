

const TMDB_API_KEY = "4485af2481804a7fa13b1af2eeb1d485";
const IMG = "https://image.tmdb.org/t/p/w500";
const API = "http://localhost:5000";


let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;




// SIGNUP
async function signup() {
  const username = signupUsername.value.trim();
  const password = signupPassword.value.trim();

  if (!username || !password) return alert("Fill all fields");

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.success !== false) {
      alert("Account created successfully!");
      showLogin();
    } else {
      alert(data.message || "User already exists");
    }

  } catch (err) {
    alert("Server not running");
    console.error(err);
  }
}


// LOGIN
async function login() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.success !== false) {
      currentUser = data.user || data;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      showDashboard();
    } else {
      alert("Invalid credentials");
    }

  } catch (err) {
    alert("Server not running");
    console.error(err);
  }
}


// LOGOUT
function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  dashboard.style.display = "none";
  authContainer.style.display = "flex";
  showLogin();
}


function showDashboard() {
  authContainer.style.display = "none";
  dashboard.style.display = "block";
  currentUserSpan.innerText = currentUser.username;
  loadMovies();
}

function showSignup() {
  loginBox.style.display = "none";
  signupBox.style.display = "block";
}

function showLogin() {
  signupBox.style.display = "none";
  loginBox.style.display = "block";
}

if (currentUser) {
  document.addEventListener("DOMContentLoaded", showDashboard);
}




function loadMovies(query = "") {
  const url = query
    ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
    : `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`;

  fetch(url)
    .then(res => res.json())
    .then(data => renderMovies(data.results || []))
    .catch(err => console.error("Movie fetch error:", err));
}

function searchMovies() {
  loadMovies(searchInput.value);
}


async function renderMovies(movies) {
  moviesDiv.innerHTML = "";

  for (const m of movies) {
    if (!m || !m.poster_path) continue;

    const avg = await getAverageRating(m.id);

    moviesDiv.innerHTML += `
      <div class="movie-card" onclick="openMovie(${m.id})">
        <img src="${IMG + m.poster_path}">
        <h4>${m.title}</h4>
        <p>⭐ ${avg}</p>
      </div>
    `;
  }
}

function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}


/* REVIEWS */

// GET AVERAGE RATING
async function getAverageRating(movieId) {
  try {
    const res = await fetch(`${API}/reviews/${movieId}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return "No ratings";

    const sum = data.reduce((s, r) => s + Number(r.rating), 0);
    return (sum / data.length).toFixed(1);

  } catch {
    return "N/A";
  }
}


/* MOVIE PAGE */

let selectedRating = 0;
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

if (movieId) loadMovieDetails(movieId);


function loadMovieDetails(id) {
  fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`)
    .then(res => res.json())
    .then(movie => {

      fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(credits => {

          const cast = credits.cast.slice(0, 5).map(c => c.name).join(", ");
          const director = credits.crew.find(c => c.job === "Director")?.name || "N/A";

          movieDetails.innerHTML = `
            <img src="${IMG + movie.poster_path}">
            <div>
              <h2>${movie.title}</h2>
              <p>${movie.overview}</p>
              <p><b>Director:</b> ${director}</p>
              <p><b>Cast:</b> ${cast}</p>
            </div>
          `;

          renderAllReviews();
        });
    });
}

// STAR SELECTION
function selectStar(n) {
  selectedRating = n;
  document.querySelectorAll("#stars span").forEach((s, i) =>
    s.classList.toggle("selected", i < n)
  );
}


// SAVE REVIEW
async function submitReview() {
  if (!currentUser) return alert("Login required");
  if (!selectedRating) return alert("Select rating");

  const text = reviewText.value.trim();

  try {
    await fetch(`${API}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        movie_id: movieId,
        rating: selectedRating,
        review: text
      })
    });

    reviewText.value = "";
    selectedRating = 0;
    renderAllReviews();

  } catch (err) {
    alert("Failed to save review");
    console.error(err);
  }
}


// LOAD REVIEWS
async function renderAllReviews() {
  try {
    const res = await fetch(`${API}/reviews/${movieId}`);
    const data = await res.json();

    allReviews.innerHTML = "<h3>All Reviews</h3>";

    data.forEach(r => {
      allReviews.innerHTML += `
        <div class="review ${r.user_id === currentUser?.id ? "mine" : ""}">
          <b>${r.username || "User"}</b> ⭐ ${r.rating}
          <p>${r.review_text}</p>
        </div>
      `;
    });

  } catch {
    allReviews.innerHTML = "Failed to load reviews";
  }
}


function goBack() {
  history.back();
}


/* ELEMENTS */

const authContainer = document.getElementById("auth-container");
const loginBox = document.getElementById("login-box");
const signupBox = document.getElementById("signup-box");
const dashboard = document.getElementById("dashboard");
const moviesDiv = document.getElementById("movies");
const currentUserSpan = document.getElementById("current-user");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const signupUsername = document.getElementById("signup-username");
const signupPassword = document.getElementById("signup-password");
const searchInput = document.getElementById("search-input");
const movieDetails = document.getElementById("movie-details");
const reviewText = document.getElementById("review-text");
const allReviews = document.getElementById("all-reviews");