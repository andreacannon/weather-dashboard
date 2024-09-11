const historyList = document.getElementById('historyList');
const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// Event listener for search button
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#city-form');
  form.addEventListener('submit', handleSearchFormSubmit);
  renderSearchHistory();
});

function updateSearchHistory(city) {
  if (!searchHistory.includes(city)) {
      searchHistory.push(city);
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      renderSearchHistory();
  }
}

// Function to render search history
function renderSearchHistory() {
  historyList.innerHTML = '';
  searchHistory.forEach((city) => {
      const cityLi = document.createElement('li');
      cityLi.classList.add('list-group-item');
      cityLi.textContent = city;
      cityLi.addEventListener('click', () => handleSearchFormSubmit(null, city));
      historyList.appendChild(cityLi);
  });
}


async function handleSearchFormSubmit(event, cityName) {
  if (event) event.preventDefault();

  cityName = cityName || document.querySelector('#city').value;

  if (!cityName) {
    console.error('You need a search input value!');
    return;
  }

  const apiKey = "cd08fc14eead31774bcda98889f3d130";
  const units = 'imperial';

  try {
    // 1st API call gets latitude and longitude for the city
    const geocodeResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData || geocodeData.length === 0) {
      console.error('No data returned from geocode API.');
      return;
    }

    const { lat, lon } = geocodeData[0];

    // 2nd API call sees latitude and longitude to get weather forecast data
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    console.log(weatherResponse)
    const weatherData = await weatherResponse.json();
    console.log(weatherData)

    // 3rd API call gets current weather data
    const currentWeatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    const currentWeatherData = await currentWeatherResponse.json();

    // Uses the data to create HTML elements
    createWeatherElements(currentWeatherData, weatherData);

  } catch (error) {
    console.error('Error making API calls:', error);
  } finally {
    updateSearchHistory(cityName);
  }
}

// Function to create & display HTML elements
function createWeatherElements(currentWeatherData, weatherData) {
  const mainContent = document.querySelector('#main-content');

  // Clears previous content
  mainContent.innerHTML = '';

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  // Creates elements for current weather
  const currentWeatherDiv = document.createElement('div');
  const weatherIconUrl = `https://openweathermap.org/img/wn/${currentWeatherData.weather[0].icon}@2x.png`;
  const weatherIcon = document.createElement('img');
  weatherIcon.src = weatherIconUrl;

  currentWeatherDiv.classList.add('current-weather');
  currentWeatherDiv.innerHTML = `
    <h2>Current Weather in ${currentWeatherData.name} (${formattedDate})<img src=${weatherIcon.src} alt="Weather icon"></img></h2>
    <p>Temp: ${currentWeatherData.main.temp}°F</p>
    <p>Wind: ${currentWeatherData.wind.speed}mph</p>
    <p>Weather: ${currentWeatherData.weather[0].description}</p>
    <p>Humidity: ${currentWeatherData.main.humidity}%</p>
  `;
 
  mainContent.appendChild(currentWeatherDiv);

  // Creates elements for forecast data
  const forecastDiv = document.createElement('div');
  forecastDiv.classList.add('weather-forecast');
  forecastDiv.innerHTML = '<h3>5-Day Forecast:</h3>';

  // Creates a row for forecast items
  const forecastRow = document.createElement('div');
  forecastRow.classList.add('row');

  // Iterates over every 8th item
  for (let i = 7; i < weatherData.list.length; i += 8) {
    const weatherDataItem = weatherData.list[i];
    if (!weatherDataItem || !weatherDataItem.main || !weatherDataItem.weather) {
      console.error('Invalid forecast weatherData data:', weatherDataItem);
      continue; 
    }

  const forecastCol = document.createElement('div');
  forecastCol.classList.add('col-sm-2', 'col');

  const forecastItem = document.createElement('div');
  forecastItem.classList.add('forecast-item', 'card', 'text-center', 'p-3');

  const forecastDate = new Date(weatherDataItem.dt * 1000).toLocaleDateString();
  const forecastTemp = weatherDataItem.main.temp;
  const forecastDesc = weatherDataItem.weather[0].description;
  const forecastWind = weatherDataItem.wind.speed;
  const forecastHumidity = weatherDataItem.main.humidity;

  forecastItem.innerHTML = `
    <h4>${forecastDate}</h4>
    <img src="https://openweathermap.org/img/wn/${weatherDataItem.weather[0].icon}@2x.png" alt="Weather icon">
    <p>Temp: ${forecastTemp}°F</p>
    <p>Weather: ${forecastDesc}</p>
    <p>Wind: ${forecastWind} mph</p>
    <p>Humidity: ${forecastHumidity}%</p>
  `;
  // forecastDiv.appendChild(forecastItem);
  forecastCol.appendChild(forecastItem);
  forecastRow.appendChild(forecastCol);
  }

  forecastDiv.appendChild(forecastRow);
  mainContent.appendChild(forecastDiv);
}
