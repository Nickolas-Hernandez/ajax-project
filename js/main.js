// Global variables
var $searchInput = document.querySelector('#search-input');
var $suggestionBox = document.querySelector('.auto-list');
var $searchIcon = document.querySelector('.fa-search');
var $topNewsList = document.querySelector('.top-news-list');
var $stockNewsList = document.querySelector('.stock-news-list');
var $watchlistPage = document.querySelector('.watchlist-page');
var $stockPage = document.querySelector('.stock-page');
var dailyStatsRequest = 'TIME_SERIES_DAILY';
var overviewStatsRequest = 'OVERVIEW';
var trendingStoriesRequest = 'TRENDING';
var companyNewsRequest = 'SYMBOL_NEWS';
var autoCompleteRequest = 'AUTO';
var issueIdRequest = 'ISSUE_ID';

// Functions
function autoCompleteSuggest(event) {
  removeSuggestionList();
  if (event.target.value.length >= 3) {
    sendRequestCNBC(autoCompleteRequest, null, event.target.value);
    $suggestionBox.classList.add('active');
  }
}

function removeSuggestionList() {
  $suggestionBox.classList.remove('active');
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
  data.currentStock = [];
  clearRelatedNews();
  sendRequestAlphaVantage(overviewStatsRequest, $searchInput.value);
  sendRequestAlphaVantage(dailyStatsRequest, $searchInput.value);
  // sendRequestCNBC(companyNewsRequest, $searchInput.value, null);
  $searchInput.value = '';
  removeSuggestionList();
  switchPage(event.target);
}

function createAutoSuggestItem(response) {
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
      headlineText.textContent = dataArray[i].title.slice(0, 50) + ' . . .';
      headlineImage.setAttribute('src', dataArray[i]['metadata:image']['metadata:imagepath']);
      headlineAnchor.setAttribute('href', dataArray[i].link);
    } else {
      headlineText.textContent = dataArray[i].headline.slice(0, 50) + ' . . .';
      headlineImage.setAttribute('src', dataArray[i].promoImage.url);
      headlineAnchor.setAttribute('href', dataArray[i].url);
    }
    headlineAnchor.setAttribute('target', '_blank');
    listItem.className = 'top-news-item row';
    headlineContainer.className = 'headline-container';
    imageContainer.className = 'news-image-container';
    headlineAnchor.appendChild(headlineText);
    headlineContainer.appendChild(headlineAnchor);
    imageContainer.appendChild(headlineImage);
    listItem.appendChild(headlineContainer);
    listItem.appendChild(imageContainer);
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
  if (eventItem === $searchIcon) {
    $watchlistPage.classList.add('hidden');
    $stockPage.classList.remove('hidden');
  } else if (eventItem.className === 'fas fa-times' || eventItem.className === 'fas fa-plus') {
    $watchlistPage.classList.remove('hidden');
    $stockPage.classList.add('hidden');
  }
}

function clearRelatedNews() {
  var $newList = document.querySelectorAll('.stock-news-list > li');
  for (var i = 0; i < $newList.length; i++) {
    $newList[i].remove();
  }
}

function saveToWatchlist(symbol, id){
  var watchlistObject = {}
  watchlistObject.ticker = symbol;
  watchlistObject.issueId = id;
  data.wachlist.push(watchlistObject);
  //create list item with current data, future log-on will create items from local storage
}

// Request Functions
function sendRequestAlphaVantage(functionType, ticker) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `https://www.alphavantage.co/query?function=${functionType}&symbol=${ticker}&apikey=CPOI5XYGUXDVNA28`);
  xhr.responseType = 'json';
  xhr.addEventListener('load', function () {
    data.currentStock.push(xhr.response);
    loadStats(data.currentStock);
  });
  xhr.send();
}

function sendRequestCNBC(requestType, ticker, input) {
  if (ticker !== null) ticker = ticker.toUpperCase();
  var xhr = new XMLHttpRequest();
  var responseObject;
  xhr.readyState = 'json';
  if (requestType === autoCompleteRequest) {
    xhr.open('GET', `https://cnbc.p.rapidapi.com/auto-complete?prefix=${input}`);
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      data.suggestionData = responseObject;
      createAutoSuggestItem(responseObject);
    });
  } else if (requestType === trendingStoriesRequest) {
    xhr.open('GET', 'https://cnbc.p.rapidapi.com/news/list-trending');
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      responseObject = responseObject.data.mostPopular.assets;
      createNewsItems(responseObject);
    });
  } else if (requestType === companyNewsRequest) {
    xhr.open('GET', `https://cnbc.p.rapidapi.com/news/list-by-symbol?tickersymbol=${ticker}&page=1&pagesize=10`);
    xhr.addEventListener('load', function () {
      responseObject = JSON.parse(xhr.response);
      responseObject = responseObject.rss.channel.item;
      createNewsItems(responseObject);
    });
  }else if(requestType === issueIdRequest){
    xhr.open("GET", `https://cnbc.p.rapidapi.com/symbols/translate?symbol=${ticker}`);
    xhr.addEventListener('load', function(){
      console.log('status', xhr.status);
      responseObject = JSON.parse(xhr.response);
      responseObject = responseObject.issueId;
      saveToWatchlist(ticker, xhr.response);
    });
  }
  xhr.setRequestHeader('x-rapidapi-key', 'afbc32455amsh2b70f92ea852178p1d2d81jsn1c3b08275a2e');
  xhr.setRequestHeader('x-rapidapi-host', 'cnbc.p.rapidapi.com');
  xhr.send();
}

// Event Listeners
$searchInput.addEventListener('input', autoCompleteSuggest);
$suggestionBox.addEventListener('click', loadSuggestion);
$searchIcon.addEventListener('click', submitSearch);
$stockPage.addEventListener('click', function () {
  if (event.target.className === 'fas fa-times') {
    switchPage(event.target);
  }else if(event.target.className === 'fas fa-plus'){
    switchPage(event.target);
    sendRequestCNBC(issueIdRequest, dataCurrentStock[0].Symbol, null);
  }
});
// window.addEventListener('load', getTrendingStories);
