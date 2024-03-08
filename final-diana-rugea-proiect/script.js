// API Keys - not for general public to see
let destinationApiKey = "dianarrugea";
// OLD
let weatherbitKey = "64cbc61ae27641fd84a99cb135dbc5b5";
// NEW - Back-Up Key
// let weatherbitKey = "b5642abde47f453f8460b2cdd28a9ea0";
let pixabayKey = "42065130-05791c39bfc24d87e892c0cf2";
let currencyApiKey = "fca_live_SwdsmJbDmZMkLJAHGJsy0kbf8cUnHteepLWjX3if";
// OLD
let geoapifyApiKey = "1842f2b52fdc40e6bacd9856c5708883";
// NEW - Back-Up Key
// let geoapifyApiKey = "24f742fffbe0440f9e0a3167dbd5eb4d"

// Get the modal
var modal = document.getElementById("#weatherModal");

// Setup empty JS object to act as endpoint for all routes
let trip = {};
let lastSearches = [];

// Async function to pull location details from Geonames API
const getDestination = async (city, country, apiKey) => {
  const res = await fetch(`http://api.geonames.org/searchJSON?maxRows=1&q=${city}+${country}&username=${apiKey}`);
  // console.log('This is the object in the Geonames API ' + res);
  try {
    const data = await res.json();

    trip.cityName = data.geonames[0].name;
    trip.country = data.geonames[0].countryName;
    trip.cityId = data.geonames[0].geonameId;
    trip.latitude = data.geonames[0].lat;
    trip.longitude = data.geonames[0].lng;
  } catch (error) {
    console.log("Problem with Geonames API connection", error);
    alert("Please check your spelling");
  }
}

// Function that calculates how many days until de departure
function getTripDate(date) {
  const dateNow = new Date();
  const departureDate = new Date(date);

  let day = departureDate.getDate();
  let month = departureDate.getMonth() + 1;
  let year = departureDate.getFullYear();
  departureDateFormated = day + "." + month + "." + year;
  // console.log("Depart Day: ", day, month, year);
  // console.log(departureDateFormated);

  const daysInMillis = departureDate.getTime() - dateNow.getTime();
  const daysToDeparture = Math.ceil(daysInMillis / (1000 * 3600 * 24));

  trip.daysToTrip = daysToDeparture;
  trip.departureDateFormated = departureDateFormated;
  console.log("Days to trip: ", trip.daysToTrip);
  return daysToDeparture;
}

// Async function to pull wheather details from Wheatherbit API.
const getWeatherDetails = async (latitude, longitude, tripDay, key) => {
  const res = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?&lat=${latitude}&lon=${longitude}&key=${key}`);
  console.log(`https:api.weatherbit.io/v2.0/forecast/daily?&lat=${latitude}&lon=${longitude}&key=${key}`);
  // console.log('This is the object in the Wheaterbit API ' + res);

  try {
    const data = await res.json();
    // console.log(data);
    console.log(tripDay);
    trip.currentTemp = data.data[tripDay].temp;
    trip.weatherDescription = data.data[tripDay].weather.description;
    trip.lowTemp = data.data[tripDay].low_temp;
    trip.maxTemp = data.data[tripDay].max_temp;
    trip.dateTime = data.data[tripDay].datetime;
    trip.iconCode = data.data[tripDay].weather.icon;

  } catch (error) {
    console.log("Accessing properties error", error);

  }
  // Get's the weather icon based on the API weather icon code response    
  trip.weatherIcon = "https://www.weatherbit.io/static/img/icons/" + trip.iconCode + ".png";

}

const getDestinationImage = async (cityName, country, key) => {
  const res = await fetch(`https://pixabay.com/api/?key=${key}&q=${cityName}+${country}&image_type=photo`)

  // console.log('This is the response from Pixabay API' + res);
  try {
    const data = await res.json();
    // console.log(data);
    numberOfResults = data.totalHits;
    if (numberOfResults > 0) {

      trip.image1 = data.hits[0].webformatURL;

    } else {
      // If there are no images with exact location try to get an image representing the country
      const res2 = await fetch(`https://pixabay.com/api/?key=${key}&q=${country}+travel&image_type=photo`)

      const data1 = await res2.json();

      trip.image1 = data1.hits[0].webformatURL;
    }
  } catch (error) {
    console.log("Error with pixabay parsing", error);
  }
}

// Async function that pulls the country flag from Restcountries API
const getCountryDetails = async (country) => {
  const res = await fetch(`https://restcountries.com/v3.1/name/${country}`)

  try {
    const data = await res.json();

    trip.countryFlag = data[0].flags.png;
    const localCurrencies = data[0].currencies;
    trip.currencyName = Object.keys(localCurrencies)[0];
  } catch (error) {
    console.log("Error with rest countries API", error)
  }
}

// Async function that pulls all the available currencies on freecurrencyapi.org
const currencyNames = [];
let selectedCurrency = "";

const getAllCurrenciesAvailable = async () => {
  const res = await fetch(`https://api.freecurrencyapi.com/v1/currencies?apikey=fca_live_SwdsmJbDmZMkLJAHGJsy0kbf8cUnHteepLWjX3if`)
  try {
    const data = await res.json();
    console.log(data);
    Object.keys(data.data).forEach((currencyCode) => {
      const currencyObject = data.data[currencyCode];
      const currencyName = currencyObject.code;
      currencyNames.push(currencyName);
    });
  } catch (error) {
    console.log("Error with pixabay parsing", error);
  }
  populateCurrencyDropDown();
}

// Async function that pulls the exchange rates for provided currencies from freecurrencyapi.org
const getCurrencyValuesForConversion = async () => {
  console.log("currency Accessed");
  const res = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${currencyApiKey}&currencies=${trip.currencyName}&base_currency=${trip.selectedCurrency}`)
  try {
    const data = await res.json();

    const currencyCode = Object.keys(data.data)[0];
    trip.exchangeRate = data.data[currencyCode];
    console.log("Exchange rate is: ", trip.exchangeRate);
  } catch (error) {
    console.log("Error with currency API", error)
  }
}

// Async function that pulls a list of atteactions at the destination using geoapify API
const getAttractionsAtDestinatnion = async () => {
  const res = await fetch(`https://api.geoapify.com/v2/places?filter=circle:${trip.longitude},${trip.latitude},10000&categories=tourism&apiKey=${geoapifyApiKey}`)
  try {
    const data = await res.json();
    let attractions = [];

    data.features.forEach((feature) => {

      const featureObject = {
        name: feature.properties.name,
        address: feature.properties.address_line2,
        website: feature.properties.website,
        workingHours: feature.properties.opening_hours
      };
      attractions.push(featureObject);
    })

    trip.attractionsAtDestination = attractions;
  } catch (error) {
    console.log("Error with Geoapify countries API", error)
  }
}

// An async function that will run all the neceseray functions to call the API's and get the date before opening the modal
async function runApis() {
  //Emptying the trip object so new data, for the new search to take it's place
  trip = {};
  getTripDate(departureDate);
  await getAllCurrenciesAvailable();
  await getDestination(destinationCity, destinationCountry, destinationApiKey);
  await getWeatherDetails(trip.latitude, trip.longitude, trip.daysToTrip, weatherbitKey);
  await getDestinationImage(destinationCity, destinationCountry, pixabayKey);
  await getCountryDetails(trip.country);
  await getAttractionsAtDestinatnion();
  updateModalAttractions(trip);

  console.log(trip);
}

window.onload = init;

function init() {
  setCopyrightYear();
  document.getElementById('submit-btn').addEventListener("click", function () {
    performAction();
    // console.log("Button is Working");
  });
  getAllCurrenciesAvailable();
  getLocalStorage();
}

// The function that gets the user input, checks for field completions and calls the rest of the functions
performAction = async (event) => {
  // Get the user's input
  destinationCity = document.getElementById('destination-input').value;
  destinationCountry = document.getElementById('country-input').value;
  departureDate = document.getElementById('travel-date-input').value;

  // Check if there is user input, set up the alerts if the required fields are empty.
  if (destinationCity == 0 || departureDate == 0) {
    if (destinationCity == 0 && departureDate == 0) {
      alert("Please provide your destination and departure date");
    } else if (destinationCity == 0) {
      alert("Please provide your destination");
    } else {
      alert("Please provide your departure date");
    }
    return false;
  } else {
    // Creates an onject that holds the user input
    const data = {
      destinationCity: destinationCity,
      destinationCountry: destinationCountry,
      date: departureDate,
    };

    // console.log(data);
    await runApis();
    updateModal(trip);
    document.getElementById("destination-modal").style.display = "block";

    // Transfer info from trip to last searches
    lastSearches.unshift(trip);
    updateLastSeachesDisplay();
    lastSearchesToCookies();
    console.log("Last searches", lastSearches);
  }
};



// Function that updates and displays the modal
function updateModal(trip) {

  //Calling the function to set up the tabs in the modal
  setupTabs();
  updateModalAttractions(trip);
  selectDefaultCurrency();
  //Autoselect the first tab in the modal
  document.querySelectorAll(".tabs").forEach(tabsContainer => {
    tabsContainer.querySelector(".tabs_bar .tabs_button").click();
  })

  let daysToTrip = trip.daysToTrip;
  // Get the elements and update them
  document.getElementById("modal_image").src = trip.image1;
  document.getElementById("modal_city").innerHTML = trip.cityName;
  document.getElementById("country_flag").src = trip.countryFlag;
  document.getElementById("modal_country").innerHTML = trip.country;
  document.getElementById("modal_date").innerHTML = trip.departureDateFormated;
  document.getElementById("modal_weather_icon").src = trip.weatherIcon;
  document.getElementById("modal_temperature").innerHTML = trip.currentTemp;
  document.getElementById("modal_weather_description").innerHTML = trip.weatherDescription;
  document.getElementById("modal_max_temp").innerHTML = trip.maxTemp;
  document.getElementById("modal_min_temp").innerHTML = trip.lowTemp;

  document.getElementById("currency_destination").innerHTML = trip.country;
  document.getElementById("local_currency").innerHTML = trip.currencyName;

  // If the trip is in more than 7 days hides the temperature displays and displays the no weahter forecast message
  if (daysToTrip > 7) {
    document.getElementById("tempAndIcon").style.display = "none";
    document.getElementById("minAndMax").style.display = "none";
    document.getElementById("noWeatherForecast").style.display = "block";
  } else {
    document.getElementById("tempAndIcon").style.display = "flex";
    document.getElementById("minAndMax").style.display = "flex";
    document.getElementById("noWeatherForecast").style.display = "none"
  }

  // Displays the modal
  document.getElementById("destination-modal").style.display = "block";
}


// Setup the TABS for modal
function setupTabs() {
  console.log("setupTabs function accessed!")
  document.querySelectorAll(".tabs_button").forEach(button => {
    button.addEventListener("click", () => {
      const bar = button.parentElement;
      const tabsContainer = bar.parentElement;
      const tabNumber = button.dataset.forTab;
      const tabToActivate = tabsContainer.querySelector(`.tabs_content[data-tab="${tabNumber}"]`);

      bar.querySelectorAll(".tabs_button").forEach(button => {
        button.classList.remove("tabs_button--active");
      });

      tabsContainer.querySelectorAll(".tabs_content").forEach(tab => {
        tab.classList.remove("tabs_content--active");
      });

      button.classList.add("tabs_button--active")
      tabToActivate.classList.add("tabs_content--active")
    })
  })
}

// Function that updates and displays the list of last searches
function updateLastSeachesDisplay() {
  $("#searches").empty();
  if (lastSearches.length > 0) {
    document.getElementById("last-searches").style.display = "block";

    lastSearches.forEach((currentTrip) => {
      const listItem = document.createElement("li");
      const individualTrip = document.createElement("div")
      const tripImage = document.createElement("img");
      const searchesText = document.createElement("div");
      const cityParagraph = document.createElement("p");
      const countryParagraph = document.createElement("p");
      const dateParaghraph = document.createElement("p");

      listItem.classList.add("searches-card");
      tripImage.classList.add("searches-image");
      searchesText.classList.add("searches-text");
      cityParagraph.classList.add("searches-paraghraps");
      countryParagraph.classList.add("searches-paraghraps");

      cityParagraph.textContent = currentTrip.cityName;
      countryParagraph.textContent = currentTrip.country;
      tripImage.src = currentTrip.image1;

      let list = document.getElementById("searches");
      list.appendChild(listItem);
      listItem.appendChild(individualTrip);
      individualTrip.appendChild(tripImage);
      individualTrip.appendChild(searchesText)
      searchesText.appendChild(cityParagraph);
      searchesText.appendChild(countryParagraph);

      listItem.addEventListener('click', () => {
        updateModal(currentTrip);
        trip = currentTrip;
      })

    });
  } else {
    document.getElementById("last-searches").style.display = "none";
  }
}

// Listener for when the user clicks the close button or the delete last searches button
document.addEventListener("DOMContentLoaded", () => {
  let closeButton = document.getElementById("closeButton");
  closeButton.onclick = function () {
    document.getElementById("destination-modal").style.display = "none";
    document.getElementById("converted_currency").innerHTML = " ";
    document.getElementById("input_currecy").value = 0;
  }

  let deleteAllButton = document.getElementById("delete_last_searches");
  deleteAllButton.onclick = function () {
    deleteLastSearches();
    lastSearchesToCookies();
  }
});

// Listener for when the user clicks anywhere outside of the modal to close it
window.onclick = function (event) {
  const modal = document.getElementById("destination-modal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Get and set year for copyright
function setCopyrightYear() {
  let currentYear = new Date().getFullYear();
  document.getElementById("year").innerHTML = currentYear;
}

// ATTRACTIONS

// Function that updates the attractions tab in the modal
function updateModalAttractions(trip) {
  clearAttractionsList();
  trip.attractionsAtDestination.forEach((attraction) => {
    const attractionItem = document.createElement("li");
    const attractionNameP = document.createElement("p");
    const attractionAdressP = document.createElement("p");
    const attractionWebsiteP = document.createElement("a");
    const attractionWorkingHoursP = document.createElement("p");

    attractionNameP.textContent = attraction.name;
    attractionAdressP.textContent = attraction.address;
    attractionWebsiteP.textContent = attraction.website;
    attractionWebsiteP.href = attraction.website;
    attractionWebsiteP.target = "_blank";
    attractionWorkingHoursP.textContent = attraction.workingHours;

    attractionItem.classList.add("attractions-card");
    attractionNameP.classList.add("attractions-name");
    attractionAdressP.classList.add("attractions-adress");
    attractionWebsiteP.classList.add("attractions-website");
    attractionWorkingHoursP.classList.add("attractions-operating-hours");

    let list = document.getElementById("attractions");
    list.appendChild(attractionItem);
    attractionItem.appendChild(attractionNameP);
    attractionItem.appendChild(attractionAdressP);
    attractionItem.appendChild(attractionWebsiteP);
    attractionItem.appendChild(attractionWorkingHoursP);
  })
}



// CURRENCIES

// A fucntion that populates the available currencies dropdown
function populateCurrencyDropDown() {
  const selectElement = document.getElementById("currencySelect");

  currencyNames.forEach((currency) => {
    const option = document.createElement("option");
    option.value = currency;
    option.textContent = currency;
    selectElement.appendChild(option);
  });

  // Select a default currency if the user doesn't choose one from the dropdown menu(EURO)
  selectDefaultCurrency();

  // Listener for when the user chooses a different currency
  selectElement.addEventListener("change", function () {
    trip.selectedCurrency = selectElement.value;
    // console.log(`Selected currency: ${selectedCurrency}`);
  });
}

// Preselect defaulCurrency to EUR
function selectDefaultCurrency() {
  const selectElement = document.getElementById("currencySelect");
  selectElement.options[0].selected = true;
  trip.selectedCurrency = selectElement[0].value;
  selectElement.selectedIndex = 0;
  selectElement.dispatchEvent(new Event('change'));
}

// Listener for the convert button
document.addEventListener("DOMContentLoaded", () => {
  let currencyButton = document.getElementById("currency_button");
  currencyButton.onclick = function () {
    convertCurrency(trip);
  }
});

// Function that converts to local currency and updates modal
async function convertCurrency(trip) {
  //Gets the updated exchange rate after user chooses his local curency
  await getCurrencyValuesForConversion();

  let userInputValue = document.getElementById("input_currecy").value;
  let exchangeRate = trip.exchangeRate;
  let convertedValueToCurrency = userInputValue * exchangeRate;
  let trimmedResult = convertedValueToCurrency.toFixed(2);
  let currencyAtDestination = trip.currencyName;

  console.log("Trip Object at currency conversion: ", trip);

  // Displays a message if the user tries to convert to the same currency otherwhise displays the conversion
  if (trip.currencyName == trip.selectedCurrency) {
    document.getElementById("converted_currency").innerHTML = "Your destination country uses the same currency as you, please select a different currency to convert";
  } else {
    document.getElementById("converted_currency").innerHTML = " Converted to local currency: " + userInputValue + " " + trip.selectedCurrency + " = " + trimmedResult + " " + currencyAtDestination;
  }
}

// Function that clears the attractions list before loading a new one
function clearAttractionsList() {
  $("#attractions").empty();
}

// Add lastSearches to cookies
function lastSearchesToCookies() {
  // Convert the array to a JSON string
  const lastSearchesJsonString = JSON.stringify(lastSearches);

  // Store the JSON string in localStorage
  localStorage.setItem("myArray", lastSearchesJsonString);
}

function getLocalStorage() {
  if (localStorage.getItem("myArray") !== null) {
    const storedJsonString = localStorage.getItem("myArray");

    // Parse the JSON string back to an array
    const storedArray = JSON.parse(storedJsonString);

    // Restore the values to lastSearches array
    lastSearches = storedArray;

    // Update the interface
    updateLastSeachesDisplay();
  } else {
    console.log("Local storage is empty");
  }
}

function deleteLastSearches() {
  lastSearches = []
  updateLastSeachesDisplay();
}
