const API_KEY = "b32d2bbdfda51235e7e823deed2b63c2";

const DAYS_OF_THE_WEEK = ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"];

/*fetch the API data*/
const getCurrentWeatherData = async () => {
  const city = "delhi";
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  return response.json();
};

const getHourlyForecast = async ({ name: city }) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
  );
  const data = await response.json();
  return data.list.map((forecast) => {
    const {
      main: { temp, temp_max, temp_min },
      dt,
      dt_txt,
      weather: [{ description, icon }],
    } = forecast;
    return { temp, temp_max, temp_min, dt, dt_txt, description, icon };
  });
};

/*Add degree to the temperatures*/
const formatTemperature = (temp) => `${temp?.toFixed(1)}°`;

const createIconURL = (icon) =>
  `http://openweathermap.org/img/wn/${icon}@2x.png`;

/*Load the basic data*/
const loadCurrentForecast = ({
  main: { temp, temp_max, temp_min },
  name,
  weather: [{ description }],
}) => {
  const currentForecastElement = document.querySelector("#current-forecast");

  currentForecastElement.querySelector(".temp").textContent =
    formatTemperature(temp);
  currentForecastElement.querySelector(".city").textContent = name;
  currentForecastElement.querySelector(".description").textContent =
    description;
  currentForecastElement.querySelector(
    ".min-max-temp"
  ).textContent = `H: ${formatTemperature(temp_max)} L:${formatTemperature(
    temp_min
  )}`;
};

const loadHourlyForecast = (hourlyForecast) => {
  const timeFormatter = Intl.DateTimeFormat("en", {
    hour12: true,
    hour: "numeric",
  });
  let datafor12Hours = hourlyForecast.slice(1, 13);
  const hourlyContainer = document.querySelector(".hourly-container");
  let innerHTMLString = ``;
  for (let { temp, icon, dt_txt } of datafor12Hours) {
    innerHTMLString += `<article>
    <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
    <img class="icon" src="${createIconURL(icon)}" />
    <p class="hourly-temp">${formatTemperature(temp)}</p>
  </article>`;
  }
  hourlyContainer.innerHTML = innerHTMLString;
};

const loadFeelsLike = ({ main: { feels_like } }) => {
  let container = document.querySelector("#feels-like");
  container.querySelector(".feels-like-temp").textContent =
    formatTemperature(feels_like);
};

const loadHumidity = ({ main: { humidity } }) => {
  let container = document.querySelector("#humidity");
  container.querySelector(".humiva").textContent = `${humidity} %`;
};
const calculateDayWiseForecast = (hourlyForecast) => {
  let dayWiseForecast = new Map();
  for (let forecast of hourlyForecast) {
    const [date] = forecast.dt_txt.split(" ");
    const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
    if (dayWiseForecast.has(dayOfTheWeek)) {
      let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
      forecastForTheDay.push(forecast);
      dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
    } else {
      dayWiseForecast.set(dayOfTheWeek, [forecast]);
    }
  }
  for (let [key, value] of dayWiseForecast) {
    let temp_min = Math.min(...Array.from(value, (val) => val.temp_min));
    let temp_max = Math.max(...Array.from(value, (val) => val.temp_max));
    dayWiseForecast.set(key, {
      temp_min,
      temp_max,
      icon: value.find((v) => v.icon).icon,
    });
  }
  return dayWiseForecast;
};
const loadFiveDayForecast = (hourlyForecast) => {
  const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
  const container = document.querySelector(".five-day-forecast-container");
  let dayWiseInfo = "";
  Array.from(dayWiseForecast).map(
    ([day, { temp_max, temp_min, icon }], index) => {
      dayWiseInfo += `<article class="day-wise-forecast">
            <h3 class="day">${index == 0 ? "Today" : day}</h3>
            <img class="icon" src="${createIconURL(
              icon
            )}" alt="icon for the forecast" />
            <p class="min-temp">${formatTemperature(temp_min)}</p>
            <p class="max-temp">${formatTemperature(temp_max)}</p>
          </article>`;
    }
  );
  container.innerHTML = dayWiseInfo;
};

document.addEventListener("DOMContentLoaded", async () => {
  const currentWeather = await getCurrentWeatherData();
  loadCurrentForecast(currentWeather);
  const hourlyForecast = await getHourlyForecast(currentWeather);
  loadHourlyForecast(hourlyForecast);
  loadFiveDayForecast(hourlyForecast);
  loadFeelsLike(currentWeather);
  loadHumidity(currentWeather);
});
