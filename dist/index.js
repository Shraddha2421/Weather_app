const apiKey = '354e692684400e7a2fbf7f068d4b9f87'; 

// HTML Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const weatherIcon = document.getElementById('weatherIcon');
const currentWeather = document.getElementById('currentWeather');
const forecast = document.getElementById('forecast');
const forecastCards = document.getElementById('forecastCards');
const errorMessage = document.getElementById('errorMessage');
const recentCitiesContainer = document.getElementById('recentCities');

// Event listener for Search button
searchBtn.addEventListener('click', async () => {
  const city = cityInput.value;
  if (city) {
    await getWeatherByCity(city);
  } else {
    showError("Please enter a valid city name.");
  }
});

// Fetching weather for current location


const currentLocationBtn = document.getElementById('current-location-btn');
const statusMessage = document.getElementById('status-message');

// Function to get the current location weather
async function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    // Show a status message to inform the user that we're fetching their location
    statusMessage.textContent = 'Fetching your location...';
    expandUI();
    // Fetch the user's current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Latitude: ", latitude, "Longitude: ", longitude); // Debugging coordinates

      // Construct the API URL
      const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      console.log("API Request URL: ", weatherApiUrl);  // Log the URL being requested

      try {
        // Fetch weather data using latitude and longitude
        const response = await fetch(weatherApiUrl);

        console.log("Response Status: ", response.status);  // Log the response status

        // Handle response
        if (!response.ok) {
          throw new Error(`Error fetching weather data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Data: ", data);  // Log the fetched data

        // Display weather data
        displayCurrentWeather(data);

        // Fetch extended forecast using the city's name
        await getExtendedForecast(data.name);
        // Update the input field with the city name from the current location
        cityInput.value = data.name;
        // Save city name and update recent cities list
        saveRecentCity(data.name);
        updateRecentCities();

        // Clear status message
        statusMessage.textContent = '';
        

      } catch (error) {
        // Handle errors in fetching weather data
        console.error('Error fetching weather data:', error);
        statusMessage.textContent = 'Unable to fetch weather data for your location. Please try again.';
      }
    }, (error) => {
      // Handle geolocation errors
      console.error('Geolocation error:', error);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          statusMessage.textContent = 'Permission denied. Please allow location access and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          statusMessage.textContent = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          statusMessage.textContent = 'The request to get your location timed out. Please try again.';
          break;
        default:
          statusMessage.textContent = 'An unknown error occurred while fetching your location.';
          break;
      }
    });
  } else {
    statusMessage.textContent = 'Geolocation is not supported by this browser.';
  }
}


// Event listener for the button
currentLocationBtn.addEventListener('click', getCurrentLocationWeather);

// Fetch Weather Data by City
async function getWeatherByCity(city) {
  expandUI();
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    if (response.ok) {
      const data = await response.json();
      displayCurrentWeather(data);
      await getExtendedForecast(city);
      saveRecentCity(city);
      updateRecentCities();  // Update the dropdown every time after a search
      
      
    } else {
      showError("City not found. Please try again.");
    }
  } catch (error) {
    showError("Unable to fetch data. Check your connection.");
  }
}

// Display Current Weather
function displayCurrentWeather(data) {
  const currentDate = new Date().toLocaleDateString(); // Get the current date
  cityName.innerText = `${data.name} (${currentDate})`;
  temperature.innerText = data.main.temp;
  humidity.innerText = data.main.humidity;
  windSpeed.innerText = data.wind.speed;
  weatherIcon.src = `https://openweathermap.org/img/w/${data.weather[0].icon}.png`;
  const weatherDescription = data.weather[0].description;  // Get the description from API

  // Set the weather description below the icon
  document.getElementById('weatherDescription').innerText = weatherDescription;
  currentWeather.classList.remove('hidden');
  errorMessage.classList.add('hidden');
}

// Fetch Extended Forecast (5-day forecast)
async function getExtendedForecast(city) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
  const data = await response.json();
  
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  forecastCards.innerHTML = ''; // Clear previous forecast
  
  data.list.forEach((item, index) => {
    const forecastDate = item.dt_txt.split(' ')[0]; // Extract date from 'dt_txt' (YYYY-MM-DD format)

    // Skip the current day's forecast
    if (forecastDate !== today && index % 8 === 0) { // Take one forecast per day, excluding today
      const forecastCard = `
        <div class="bg-gray-600 p-3 rounded shadow-md text-white hover:scale-[105%] transition-all 0.5 ease">
          <h3>${new Date(item.dt_txt).toLocaleDateString()}</h3>
          <img src="https://openweathermap.org/img/w/${item.weather[0].icon}.png" alt="Weather Icon">
          <p>Temp: ${item.main.temp}°C</p>
          <p>Wind: ${item.wind.speed} km/h</p>
          <p>Humidity: ${item.main.humidity}%</p>
        </div>
      `;
      forecastCards.innerHTML += forecastCard;
    }
  });

  forecast.classList.remove('hidden');
}
// Save Recent City to Local Storage
function saveRecentCity(city) {
  let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  // Remove city if it already exists in the array
  recentCities = recentCities.filter((c) => c.toLowerCase() !== city.toLowerCase());

  // Add the city to the beginning of the array
  recentCities.unshift(city.charAt(0).toUpperCase() + city.slice(1));

  if(recentCities.length>10) recentCities.pop(); // Limit to the last 10 searches
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  updateRecentCities();
  
}

// Display Recent Cities
function updateRecentCities() {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (recentCities.length > 0) {
    recentCitiesContainer.innerHTML = `
      <select id="cityDropdown" class="p-2 border rounded w-full bg-gray-600 text-white">
        <option value="">Select Recently Searched City</option>
        ${recentCities.map(city => `<option value="${city}">${city}</option>`).join('')}
      </select>
    `;
  } else {
    recentCitiesContainer.innerHTML = '';  // Empty when no recent cities exist
  }
  const cityDropdown = document.getElementById('cityDropdown');
  cityDropdown.addEventListener('change', async (e) => {
    const selectedCity = e.target.value;
    if (selectedCity) {
      cityInput.value = selectedCity;  // Update the input field with the selected city
      await getWeatherByCity(selectedCity);
    }
  });
}

// Show Error Message
function showError(message) {
  errorMessage.innerText = message;
  errorMessage.classList.remove('hidden');
}

// Helper function to expand the UI
function expandUI() {
 // Show the right section and expand the container
 const weatherContainer = document.getElementById('weatherContainer');
 document.getElementById('rightSection').classList.remove('hidden');
 weatherContainer.classList.remove('max-w-sm', 'p-2'); // Remove small width and padding
 weatherContainer.classList.add('md:flex-row', 'justify-between', 'p-6'); // Expand to row layout and add padding
}