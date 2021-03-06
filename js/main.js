// Global variables
var $searchBar = document.querySelector('.search-bar');
var $searchInput = document.querySelector('#search-input');
var $suggestionBox = document.querySelector('.auto-list');
var $topNewsList = document.querySelector('.top-news-list');
var $stockNewsList = document.querySelector('.stock-news-list');
var $watchlistList = document.querySelector('.watchlist');
var $watchlistPage = document.querySelector('.watchlist-page');
var $stockPage = document.querySelector('.stock-page');
var $addToWatchlist = document.querySelector('.add-to-watchlist-wrapper');
var $spinnerContainer = document.querySelector('.loading-icon-container');
var $searchbarLoadingIcon = document.querySelector('.searchbar-loading-icon');
var $watchlistPlaceholder = document.querySelector('.watchlist-placeholder');
var $errorMessage = document.querySelector('.error-container');
var dailyStatsRequest = 'TIME_SERIES_DAILY';
var overviewStatsRequest = 'OVERVIEW';
var trendingStoriesRequest = 'TRENDING';
var companyNewsRequest = 'SYMBOL_NEWS';
var autoCompleteRequest = 'AUTO';

// Functions
function autoCompleteSuggest(event) {
  removeSuggestionList();
  if (event.target.value.length < 3) $searchbarLoadingIcon.classList.add('hidden');
  if (event.target.value.length >= 3) {
    sendRequestCNBC(autoCompleteRequest, null, event.target.value);
    $suggestionBox.classList.add('active');
  }
}

function removeSuggestionList() {
  var currentItems = document.querySelectorAll('.auto-suggest-item');
  for (var i = 0; i < currentItems.length; i++) {
    currentItems[i].remove();
  }
}

function loadSuggestion(event) {
  $searchInput.value = event.target.textContent;
  removeSuggestionList();
}

function submitSearch(event) {
  $errorMessage.classList.add('hidden');
  data.currentStock = [];
  clearRelatedNews();
  sendRequestAlphaVantage(overviewStatsRequest, $searchInput.value, false);
  sendRequestAlphaVantage(dailyStatsRequest, $searchInput.value, false);
  sendRequestCNBC(companyNewsRequest, $searchInput.value.toUpperCase(), null);
  $searchInput.value = '';
  removeSuggestionList();
  switchPage(event.target);
}

function createAutoSuggestItem(response) {
  var currentItems = document.querySelectorAll('.auto-suggest-item');
  if (currentItems !== 0) removeSuggestionList();
  for (var i = 1; i < response.length; i++) {
    var suggestionItem = document.createElement('li');
    suggestionItem.className = 'auto-suggest-item';
    suggestionItem.textContent = response[i].symbolName;
    $suggestionBox.appendChild(suggestionItem);
  }
}

function getTrendingStories(event) {
  sendRequestCNBC(trendingStoriesRequest, null, null);
}

function createNewsItems(dataArray) {
  for (var i = 0; i < 5; i++) {
    var listItem = document.createElement('li');
    var headlineContainer = document.createElement('div');
    var imageContainer = document.createElement('div');
    var headlineText = document.createElement('h3');
    var headlineImage = document.createElement('img');
    var headlineAnchor = document.createElement('a');
    if (dataArray[i]['metadata:id']) {
      headlineText.textContent = dataArray[i].title;
      headlineImage.setAttribute('src', dataArray[i]['metadata:image']['metadata:imagepath']);
      headlineAnchor.setAttribute('href', dataArray[i].link);
    } else {
      headlineText.textContent = dataArray[i].headline;
      headlineImage.setAttribute('src', dataArray[i].promoImage.url);
      headlineAnchor.setAttribute('href', dataArray[i].url);
    }
    headlineAnchor.setAttribute('target', '_blank');
    headlineAnchor.className = 'headline-anchor-tag row';
    listItem.className = 'top-news-item';
    headlineContainer.className = 'headline-container';
    imageContainer.className = 'news-image-container';
    headlineAnchor.appendChild(headlineText);
    headlineContainer.appendChild(headlineText);
    imageContainer.appendChild(headlineImage);
    headlineAnchor.appendChild(headlineContainer);
    headlineAnchor.appendChild(imageContainer);
    listItem.appendChild(headlineAnchor);
    if (dataArray[i]['metadata:id']) {
      $stockNewsList.appendChild(listItem);
    } else $topNewsList.appendChild(listItem);
  }
}

function loadStats(dataArray) {
  if (dataArray.length !== 2) return;
  var $ticker = document.querySelector('.stats-ticker');
  var $price = document.querySelector('.stats-price');
  var $companyName = document.querySelector('.company-name');
  var $date = document.querySelector('.stats-date');
  var $open = document.querySelector('.open-price');
  var $close = document.querySelector('.close-price');
  var $high = document.querySelector('.high-price');
  var $low = document.querySelector('.low-price');
  var $high52 = document.querySelector('.high-52wk');
  var $low52 = document.querySelector('.low-52wk');
  for (var i = 0; i < dataArray.length; i++) {
    if (dataArray[i]['Time Series (Daily)']) {
      $date.textContent = dataArray[i]['Meta Data']['3. Last Refreshed'].slice(0, 10);
      $price.textContent = '$' + cutPrice(dataArray[i]['Time Series (Daily)'][$date.textContent]['4. close']);
      $open.textContent = cutPrice(dataArray[i]['Time Series (Daily)'][$date.textContent]['1. open']);
      $close.textContent = cutPrice(dataArray[i]['Time Series (Daily)'][$date.textContent]['4. close']);
      $high.textContent = cutPrice(dataArray[i]['Time Series (Daily)'][$date.textContent]['2. high']);
      $low.textContent = cutPrice(dataArray[i]['Time Series (Daily)'][$date.textContent]['3. low']);
    } else {
      $ticker.textContent = dataArray[i].Symbol;
      $companyName.textContent = dataArray[i].Name;
      $high52.textContent = cutPrice(dataArray[i]['52WeekHigh']);
      $low52.textContent = cutPrice(dataArray[i]['52WeekLow']);
    }
  }
}

function cutPrice(string) {
  for (var i = 0; i < string.length; i++) {
    if (string[i] === '.') {
      string = string.slice(0, (i + 3));
      return string;
    }
  }
}

function switchPage(eventItem) {
  if (eventItem === null) {
    $watchlistPage.classList.remove('hidden');
    $stockPage.classList.add('hidden');
    return;
  }
  if (eventItem.classList.contains('close-icon') || eventItem.closest('.add-to-watchlist-wrapper')) {
    $watchlistPage.classList.remove('hidden');
    $stockPage.classList.add('hidden');
  } else {
    $watchlistPage.classList.add('hidden');
    $stockPage.classList.remove('hidden');
  }
  if (data.plusIcon === 'hide') {
    $addToWatchlist.classList.add('hidden');
  } else $addToWatchlist.className = 'row add-to-watchlist-wrapper';
}

function clearRelatedNews() {
  var $newList = document.querySelectorAll('.stock-news-list > li');
  for (var i = 0; i < $newList.length; i++) {
    $newList[i].remove();
  }
}

function saveStockToLocalStorage() {
  var $ticker = document.querySelector('.stats-ticker');
  data.watchlist.push($ticker.textContent);
  sendRequestAlphaVantage(dailyStatsRequest, $ticker.textContent, true);
}

function generateWatchlistItem(dataObject) {
  clearRelatedNews();
  var lastTradingDate = dataObject['Meta Data']['3. Last Refreshed'].slice(0, 10);
  var listItem = document.createElement('li');
  var ticker = document.createElement('p');
  var column = document.createElement('div');
  var price = document.createElement('p');
  var deleteButton = document.createElement('i');
  listItem.className = 'watchlist-item row column-full';
  ticker.className = 'ticker';
  column.className = 'price-column';
  price.className = 'price';
  deleteButton.className = 'fas fa-minus-circle delete-button hidden';
  price.classList.add(getPosOrNegClass(dataObject));
  ticker.textContent = dataObject['Meta Data']['2. Symbol'];
  price.textContent = '$' + cutPrice(dataObject['Time Series (Daily)'][lastTradingDate]['4. close']);
  column.appendChild(price);
  column.appendChild(deleteButton);
  listItem.appendChild(ticker);
  listItem.appendChild(column);
  $watchlistList.appendChild(listItem);
}

function getPosOrNegClass(dataObject) {
  var date = dataObject['Meta Data']['3. Last Refreshed'].slice(0, 10);
  var open = cutPrice(dataObject['Time Series (Daily)'][date]['1. open']);
  var close = cutPrice(dataObject['Time Series (Daily)'][date]['4. close']);
  open = parseInt(open);
  close = parseInt(close);
  if (close >= open) {
    return 'profit-text';
  } else return 'loss-text';
}

function getWatchlistFromDataModel() {
  for (var i = 0; i < data.watchlist.length; i++) {
    sendRequestAlphaVantage(dailyStatsRequest, data.watchlist[i], true);
  }
}

function handleDeleteButtons(event) {
  var $priceColumns = $watchlistList.querySelectorAll('.price-column');
  for (var i = 0; i < $priceColumns.length; i++) {
    $priceColumns[i].firstChild.classList.toggle('hidden');
    $priceColumns[i].lastChild.classList.toggle('hidden');
  }
}

function deleteWatchlistItem(event) {
  var listItem = event.target.closest('.watchlist-item');
  listItem.remove();
  for (var i = 0; i < data.watchlist.length; i++) {
    if (data.watchlist[i] === listItem.firstChild.textContent) {
      data.watchlist.splice(i, 1);
    }
  }
}

function handleSpinner(response) {
  $spinnerContainer.classList.toggle('hidden');
}

function removePlaceholder() {
  if (data.watchlist.length > 0) {
    $watchlistPlaceholder.classList.add('hidden');
  } else $watchlistPlaceholder.className = 'watchlist-placeholder';
}

// Request Functions
function sendRequestAlphaVantage(functionType, ticker, isWatchlist) {
  handleSpinner();
  if (ticker !== null) ticker = ticker.toUpperCase();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `https://www.alphavantage.co/query?function=${functionType}&symbol=${ticker}&apikey=CPOI5XYGUXDVNA28`);
  xhr.responseType = 'json';
  xhr.addEventListener('load', function () {
    if (xhr.response['Error Message'] || xhr.response === {} || xhr.response.Note) {
      switchPage(null);
      $errorMessage.classList.remove('hidden');
      $suggestionBox.classList.remove('active');
      $spinnerContainer.classList.add('hidden');
      return;
    }
    if (isWatchlist === true) {
      generateWatchlistItem(xhr.response);
    } else {
      data.currentStock.push(xhr.response);
      loadStats(data.currentStock);
    }
    handleSpinner();
  });
  xhr.send();
}

function sendRequestCNBC(requestType, ticker, input) {
  if (requestType !== autoCompleteRequest) handleSpinner();
  if (ticker !== null) ticker = ticker.toUpperCase();
  var xhr = new XMLHttpRequest();
  var responseObject;
  xhr.readyState = 'json';
  if (requestType === autoCompleteRequest) {
    xhr.open('GET', `https://cnbc.p.rapidapi.com/auto-complete?prefix=${input}`);
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      data.suggestionData = responseObject;
      $searchbarLoadingIcon.classList.add('hidden');
      createAutoSuggestItem(responseObject);
    });
  } else if (requestType === trendingStoriesRequest) {
    xhr.open('GET', 'https://cnbc.p.rapidapi.com/news/list-trending');
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      responseObject = responseObject.data.mostPopular.assets;
      createNewsItems(responseObject);
      handleSpinner();
    });
  } else if (requestType === companyNewsRequest) {
    xhr.open('GET', `https://cnbc.p.rapidapi.com/news/list-by-symbol?tickersymbol=${ticker}&page=1&pagesize=10`);
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      responseObject = responseObject.rss.channel.item;
      if (responseObject === undefined) return;
      createNewsItems(responseObject);
      handleSpinner();
    });
  }
  xhr.setRequestHeader('x-rapidapi-key', 'afbc32455amsh2b70f92ea852178p1d2d81jsn1c3b08275a2e');
  xhr.setRequestHeader('x-rapidapi-host', 'cnbc.p.rapidapi.com');
  xhr.send();
}

// Event Listeners
$searchInput.addEventListener('input', function () {
  if (event.target.value.length > 2)$searchbarLoadingIcon.classList.remove('hidden');
  autoCompleteSuggest(event);
});
$suggestionBox.addEventListener('click', function () {
  loadSuggestion(event);
  submitSearch(event);
});
$searchBar.addEventListener('submit', function () {
  event.preventDefault();
  submitSearch(event);
});
$stockPage.addEventListener('click', function () {
  if (event.target.classList.contains('close-icon')) {
    data.plusIcon = 'show';
    switchPage(event.target);
    clearRelatedNews();
  } else if (event.target.closest('.add-to-watchlist-wrapper')) {
    switchPage(event.target);
    saveStockToLocalStorage();
    removePlaceholder();
  }
});
$watchlistList.addEventListener('click', function () {
  if (event.target.closest('.watchlist-item') && event.target.tagName !== 'I') {
    var item = event.target.closest('.watchlist-item');
    var tickerElement = item.querySelector('.ticker');
    var ticker = tickerElement.textContent;
    data.currentStock = [];
    sendRequestAlphaVantage(overviewStatsRequest, ticker, false);
    sendRequestAlphaVantage(dailyStatsRequest, ticker, false);
    sendRequestCNBC(companyNewsRequest, ticker, null);
    data.plusIcon = 'hide';
    switchPage(event.target);
  }
});
$watchlistPage.addEventListener('click', function () {
  if (event.target.classList.contains('edit-icon')) {
    handleDeleteButtons();
  } else if (event.target.classList.contains('delete-button')) {
    deleteWatchlistItem(event);
  }
});
window.addEventListener('load', function () {
  getTrendingStories();
  getWatchlistFromDataModel();
  removePlaceholder();
});
