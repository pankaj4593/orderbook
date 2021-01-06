Exchange = function() {
	
	// #title
	
	this.title = {
		favicon: document.getElementById("favicon"),
		basePath: "CSS/img/favicon/",
		icons: ["candlesticks_up_green.ico", "candlesticks_down_red.ico", "candlesticks_up_blue.ico", "candlesticks_down_blue.ico", "alert1.ico", "alert2.ico"],
		prevPrice: 0,
		alerted: false,
		toggleAlert: function() {
			if (this.alerted === true) {
				clearInterval(this.intervalId);
				this.alerted = false;
				this.favicon.href = this.basePath + this.icons[2];
				return;
			}
			function changeIcons() {
				if (toggle === 0) {
					t.favicon.href = t.basePath + t.icons[5];
					toggle = 1;
				} else {
					t.favicon.href = t.basePath + t.icons[4];
					toggle = 0;
				}
			}
			var t = this;
			t.alerted = true;
			t.favicon.href = t.basePath + t.icons[4];
			var toggle = 0;
			this.intervalId = setInterval(changeIcons, 1000);
		},
		update: function() {
			if (this.alerted === true) {return;}
			var t = this;
			var coin1 = exchange.currentMarketPair.split("_")[0];
			var coin2 = exchange.currentMarketPair.split("_")[1];
			var pair = coin1 + "/" + coin2;
			var price = exchange.ajaxUtils.mainData.MainPair.Price;
			if (t.prevPrice < price) {
				t.favicon.href = t.basePath + t.icons[0];
			} else if (t.prevPrice > price) {
				t.favicon.href = t.basePath + t.icons[1];
			} else {
				if (t.favicon.href.indexOf("up") !== -1) {
					t.favicon.href = t.basePath + t.icons[2];
				} else {
					t.favicon.href = t.basePath + t.icons[3];
				}
			}
			t.prevPrice = price;
			document.title = pair + " " + price;
		}
	}
	
	// #currentMarketPair #currentPair #current
	
	this.currentMarketPair = (function() {//change this to exchange.marketPair.current
		var pair = window.location.hash.split("#")[1] || "LTC-BTC";
		window.location.hash = "#" + pair;
		pair = pair.split("-")[0] + "_" + pair.split("-")[1];
		return pair;
	})()
	
	// #loaded #done #finished
	
	this.loaded = false
	
	// #ajaxUtils #ajax
	
	this.ajaxUtils = {
		mainData: {},
		xhrArray: [],
		newXhr: function(xhrName) {
			this[xhrName] = new XMLHttpRequest();
			this.xhrArray.push(this[xhrName]);
			return xhrName;
		},
		getData: function(xhr, link, target, callback) {
			this[xhr].onreadystatechange = function() {
				try {
					exchange.ajaxUtils.redirectResponse(xhr, target, callback);
				} catch (e) {
					console.log(e);
					callback();
				}
			};
			this[xhr].open('GET', link, true);
			this[xhr].send(null);
		},
		redirectResponse: function(xhr, target, callback) {
			if (!(exchange.ajaxUtils[xhr].readyState === XMLHttpRequest.DONE)) {
				return;
			}
			switch (target) {
				case "marketData":
					exchange.ajaxUtils.processMarketData(this[xhr].responseText);
					break;
				case "marketPair":
					exchange.ajaxUtils.processMarketPairData(this[xhr].responseText);
					break;
				case "updateData":
					exchange.ajaxUtils.processUpdateData(this[xhr].responseText);
					break;
				case "personalData":
					exchange.ajaxUtils.processPersonalData(this[xhr].responseText);
					break;
			}
			if (callback) { callback(); }
		},
		processMarketData: function(data) {
			var d = JSON.parse(data);
			this.mainData = d;
			
			
			exchange.tradeOrders.buyOrders = d.Bids;
			exchange.tradeOrders.sellOrders = d.Asks;
			exchange.tradeHistory.historyData = d.History;
			exchange.marketList.BTC = d.BTC;
			exchange.marketList.LTC = d.LTC;
			exchange.marketList.USD = d.USD;
			exchange.chart.globalHistoryData = d.GlobalChart;
			exchange.chart.localHistoryData = d.LocalChart;
			exchange.chatbox.data = d.chat;
			exchange.marketPair.data = d.CoinInfo;
			
			if (typeof profile !== 'undefined' && d.PersonalData) {profile.data = d.PersonalData; profile.login("trader");}
			if (d.PersonalData) {
				exchange.support.render(d.PersonalData[0].SupportChat);
				exchange.my.orders.render(d.PersonalData[0].OpenTrades);
				exchange.my.tradeHistory.render(d.PersonalData[0].PersonalTradeHistory);
				exchange.notifications.update(d.PersonalData[0].Popup);
			}
			exchange.chart.renderChart();
			
			exchange.marketList.render();
			exchange.tradeOrders.render();
			exchange.tradeHistory.render();
			exchange.news.render(d.news);
			exchange.chatbox.render();
			exchange.chatbox.scrollDown();
			exchange.marketPair.update();
			exchange.title.update();
			
			exchange.headerMenu.checkSelectedPage();
			exchange.colorMood.update(d.MainPair.Percent);
			
			exchange.loaded = true;
			
			exchange.chartTimer = 0;
			exchange.updateTimer();
			
		},
		processMarketPairData: function(data) {	//DRY: Combine with processMarketData
			var d = JSON.parse(data);
			this.mainData = d;
			
			exchange.tradeOrders.buyOrders = d.Bids;
			exchange.tradeOrders.sellOrders = d.Asks;
			exchange.tradeHistory.historyData = d.History;
			exchange.chart.globalHistoryData = d.GlobalChart;
			exchange.chart.localHistoryData = d.LocalChart;
			exchange.marketPair.data = d.CoinInfo;
			
			exchange.chart.renderChart();
			exchange.tradeOrders.render();
			exchange.tradeHistory.render();
			exchange.marketPair.update();
			exchange.title.update();
			exchange.footer.updateInfo(d.ServerInfo);
			
			exchange.colorMood.update(d.MainPair.Percent);
			
			if (d.PersonalData) {
				exchange.my.orders.update(d.PersonalData[0].OpenTrades);
				exchange.my.tradeHistory.update(d.PersonalData[0].PersonalTradeHistory);
				profile.profilePage.portfolio.updateTradeMenu();
			}
			
			exchange.loaded = true;
		},
		processUpdateData: function(data) {	//DRY: Combine with processMarketData
			var d = JSON.parse(data);
			this.mainData = d;
			
			exchange.tradeOrders.update(d);
			exchange.chatbox.update(d.chat);
			exchange.marketList.update(d);
			exchange.tradeHistory.update(d.History);
			exchange.footer.updateInfo(d.ServerInfo);
			exchange.title.update();
			
			exchange.colorMood.update(d.MainPair.Percent);
			
			if (d.PersonalData && profile.status.loggedIn === false) {
				profile.data = d.PersonalData;
				profile.login();
			}
			if (d.PersonalData) {
				exchange.support.update(d.PersonalData[0].SupportChat);
				exchange.my.orders.update(d.PersonalData[0].OpenTrades);
				exchange.my.tradeHistory.update(d.PersonalData[0].PersonalTradeHistory);
				exchange.notifications.update(d.PersonalData[0].Popup);
				profile.update(d.PersonalData);
			} else if (profile.status.loggedIn === true) {
				profile.logout();
			}
			if (d.GlobalChart || d.LocalChart) {
				exchange.chart.update(d);
			}
			if (d.news) {exchange.news.update(d.news);}
			
		},
		processPersonalData: function(data) {
			var d = JSON.parse(data);
			if (typeof profile !== 'undefined' && d.PersonalData) {
				profile.data = d.PersonalData;
				profile.login();
			}
		},
		fetchMarketData: function(marketPair, marketsAllOrNone, chart01, chat01, support01, news01, personalData01, reDirTag) {//use exLib ajax utils for this
			this.loaded == false;
			var candleTime = exchange.chart.candleTime;
			if (candleTime === 5) {candleTime = "";}	//in the getData link, candleTime isn't stated when it is 5min
			this.getData(this.newXhr("marketDataXhr"),
				'https://alcurex.com/exchange/data?Pair=' + marketPair +
				'&Markets=' + marketsAllOrNone + '&Chart' + candleTime
				+ '=' + chart01 + '&Chat=' + chat01 + '&SupportChat=' + support01 + '&News=' + news01 + '&PersonalData=' + personalData01, reDirTag);
		},
		fetchUpdateData: function(marketPair, marketsAllOrNone, chart01, chat01, support01, news01, personalData01, reDirTag, callback) {//DRY:
			this.loaded == false;
			var candleTime = exchange.chart.candleTime;
			if (candleTime === 5) {candleTime = "";}
			this.getData(this.newXhr("updateDataXhr"),
				'https://alcurex.com/exchange/data?Pair=' + marketPair +
				'&Markets=' + marketsAllOrNone + '&Chart' + candleTime
				+ '=' + chart01 + '&Chat=' + chat01 + '&SupportChat=' + support01 + '&News=' + news01 + '&PersonalData=' + personalData01, reDirTag, callback);
		},
	}
	
	// #marketPair #pair #mainPair
	
	this.marketPair = {
		tradingFee: 0.002,
		popUpWindow: function() {
			var windowEl = document.getElementById("coin-info-popup-page-wrapper");
			var closeButton = document.getElementById("coin-info-popup-page-close-button");
			var bgOverlay = document.getElementById("gray-background-overlay");
			var win = exLib.popUp.newPopUpWindow(windowEl, closeButton, bgOverlay, "inline-flex");
			return win;
		},
		activatePopUpWindow: function() {
			this.popUpWindow = this.popUpWindow();
			this.popUpWindow.activate();
			var that = this;
			document.getElementById("header-menu-coin-info").addEventListener('click', function(e) {
				that.popUpWindow.open(e, that.popUpWindow);
			}, false);
		},
		update: function() {
			var d = this.data;
			var coin = d.Currency;
			var market = exchange.currentMarketPair.split("_")[1]
			function tradeMenuCurrencies() {
				function balances() {
					document.getElementById("buy-balance-currency").textContent = market;
					document.getElementById("sell-balance-currency").textContent = coin;
				}
				function buttons() {
					document.getElementById("buy-button").firstElementChild.textContent = "Buy " + coin;
					document.getElementById("sell-button").firstElementChild.textContent = "Sell " + coin;
				}
				function totalPlaceholders() {
					document.getElementById("buy-total-input").placeholder = "Total " + market;
					document.getElementById("sell-total-input").placeholder = "Total " + market;
				}
				function orders() {
					document.getElementsByClassName("amount-primary-index")[0].textContent = coin;
					document.getElementsByClassName("amount-primary-index")[1].textContent = coin;
					document.getElementsByClassName("amount-secondary-index")[0].textContent = market;
					document.getElementsByClassName("amount-secondary-index")[1].textContent = market;
				}
				balances();
				buttons();
				totalPlaceholders();
				orders();
			}
			function tradeHistoryCurrencies() {
				function update(id) {
					var coin2 = document.getElementById(id).lastElementChild;
					var coin1 = coin2.previousElementSibling;
					coin2.textContent = market;
					coin1.textContent = coin;
				}
				update("trade-history-orders-index");
				update("my-trade-history-orders-index");
			}
			function coinInfo() {
				document.getElementById("coin-info-name").textContent = d.CurrencyName;
				document.getElementById("coin-info-website").textContent = d.Homepage;
				document.getElementById("coin-info-bitcointalk").textContent = d.Bitcointalk;
			}
			function label() {
				var name = d.CurrencyName.toUpperCase();
				document.getElementById("price-chart-coin-label-name").textContent = name;
				document.getElementById("price-chart-coin-label-logo").src = "";
				
				document.getElementById("price-chart-coin-label-logo").src = "CSS/img/coins/" + coin + ".png";
			}
			tradeMenuCurrencies();
			tradeHistoryCurrencies();
			coinInfo();
			label();
		},
		changeTo: function(marketPair) {
			var p = exchange;
			p.currentMarketPair = marketPair;
			window.location.hash = marketPair.split("_")[0] + "-" + marketPair.split("_")[1];
			p.tradeOrders.clear();
			p.tradeHistory.clear();
			p.chart.clear();
			p.tradeOrders.loadAnimation.toggle(true);
			p.tradeHistory.loadAnimation.toggle(true);
			p.chart.loadAnimation.toggle(true);
			p.ajaxUtils.fetchMarketData(marketPair, "None", 1, 0, 0, 0, 1, "marketPair")
		}
	}
	
	// #color #headerColor #mood #moodChange #colorChange #colorMood #moodColor #changeColor
	
	var ColorMood = function() {
		
		var headerEl = document.getElementById("header-menu"),
			footerEl = document.getElementById("exchange-footer"),
			coinLabelEl = document.getElementById("price-chart-coin-label"),
			globalLabelEl = document.getElementById("price-chart-global-label"),
			chartLineEl = document.getElementById("chart-wrapper-left-line");
		
		
		var minRGB = [212, 14, 14], // tinted red
			defRGB = [180, 180, 14], // tinted yellow/green
			maxRGB = [14, 140, 90]; // tinted green
		
		var minChange = -10,
			maxChange = 10;
		
		var currentChange = null,
			currentPair = null;
		
		var calculateMood = function(change) { // calculations not absolutely correct
			if (change > maxChange) {
				change = maxChange;
			} else if (change < minChange) {
				change = minChange;
			}
			
			var green = maxRGB[1],
				red = minRGB[0];
			var rgb = 'rgb(71,132,108)';
/* 			if (change < 0)  rgb = 'rgb(160,72,72)';
			if (change > 0)  rgb = 'rgb(0,150,136)'; */
			return rgb;
			
/* 			if (change < 0) {
				var multiplier = change / minChange;
				var blue = minRGB[2];
				green = green - defRGB[2];
				green -= (multiplier * green);
				green += defRGB[2];
				red = defRGB[0] + (multiplier * (red - defRGB[0]));
			} else {
				var multiplier = change / maxChange;
				var blue = maxRGB[2];
				red = red - defRGB[2];
				red -= (multiplier * red);
				red += defRGB[2];
				green = defRGB[1] - (multiplier * (defRGB[1] - green));
				blue = defRGB[2] + (multiplier * (blue - defRGB[2]));
			} 	*/
			
			//return "rgb(" + parseInt(red) + ", " + parseInt(green) + ", " + parseInt(blue) + ")";
		}
		
		this.update = function(change) {
			change = parseFloat(change);
			if (change === currentChange && currentPair === exchange.currentMarketPair) { return; }
			
			var mood = calculateMood(change);
			
			var selectedMarketEl = document.getElementsByClassName("market-row-selected")[0];
			
			headerEl.style.backgroundColor = mood;
			footerEl.style.backgroundColor = mood;
			selectedMarketEl.style.borderBottomColor = mood;
			selectedMarketEl.firstElementChild.style.color = mood;
			coinLabelEl.style.borderLeftColor = mood;
			globalLabelEl.style.borderLeftColor = mood;
			chartLineEl.style.backgroundColor = mood;
			
			currentChange = change;
			currentPair = exchange.currentMarketPair;
		}
		
		this.clearSelectedMarketRow = function() {
			var selectedMarketEl = document.getElementsByClassName("market-row-selected")[0];
			selectedMarketEl.style.borderBottomColor = null;
			selectedMarketEl.firstElementChild.style.color = null;
		}
	}
	
	this.colorMood = new ColorMood();
	
	// #headerMenu #header
	
	var HeaderMenu = function() {
		
		this.pages = Array.prototype.slice.call(document.getElementsByClassName("header-menu-page-button"))
		
		this.pageFunctions = [
			function localExchange(t, preventMarketChange) {
				t.selectedPage = 0;
				var market = exchange.currentMarketPair.split("_")[1];
				
				var oldMarketList = document.getElementById("market-pairs-global-" + market),
					newMarketList = document.getElementById("market-pairs-local-BTC");
				oldMarketList.style.display = "none";
				newMarketList.style.display = "block";
				
				document.getElementsByClassName("right-bottom-module-toggle")[1].style.display = "none";
				
				t.pages[1].classList.remove("header-menu-page-button-selected");
				t.pages[0].classList.add("header-menu-page-button-selected");
				
				//change to BTC main markets before switching to BTC penny markets
				var buttons = document.getElementsByClassName("right-bottom-module-toggle");
				if (buttons[1].className.indexOf("toggle-buttons-toggled") !== -1) {
					exchange.moduleMenuUtils.bottomMenu.switchTo(0, exchange.moduleMenuUtils.bottomMenu);
				}
				
				if (!preventMarketChange) {
					var e = {};
					e.target = document.getElementById(exchange.marketList.highestLocalVolMarket);
					exchange.marketList.switchMarketPair(e);
				}
				
			},
			function globalExchange(t, preventMarketChange) {//DRY
				t.selectedPage = 1;
				var market = exchange.currentMarketPair.split("_")[1];
				
				var oldMarketList = document.getElementById("market-pairs-local-BTC"),
					newMarketList = document.getElementById("market-pairs-global-" + market);
				oldMarketList.style.display = "none";
				newMarketList.style.display = "block";
				
				document.getElementsByClassName("right-bottom-module-toggle")[1].style.display = "flex";
				
				t.pages[0].classList.remove("header-menu-page-button-selected");
				t.pages[1].classList.add("header-menu-page-button-selected");
				
				if (!preventMarketChange) {
					var e = {};
					e.target = document.getElementById("LTC_BTC");
					exchange.marketList.switchMarketPair(e);
				}
			}
		]
		
		this.selectedPage = null
		
		this.switchPage = function(e) {
			if (this.pages[this.selectedPage] === e.target || this.pages[this.selectedPage] === e.target.parentElement) { return; }
			if (e.target.className.indexOf("header-menu-page-button") !== -1) {
				var target = e.target;
			} else if (e.target.parentElement.className.indexOf("header-menu-page-button") !== -1) {
				var target = e.target.parentElement;
			} else {
				return;
			}
			this.pageFunctions[this.pages.indexOf(target)](this);
		}
		
		this.checkSelectedPage = function() {
			var m = exchange.marketList[exchange.currentMarketPair.split("_")[1]][exchange.currentMarketPair]
			if (m.GlobalBaseVol > 10 || m.LocalVolume > 10) {
				var selected = 1;
			} else {
				var selected = 0;
			}
			
			this.selectedPage = selected;
			this.pageFunctions[selected](this, "PREVENT MARKET FROM CHANGING");
		}
		
		this.activate = function() {
			var t = this;
			document.getElementById("header-menu").addEventListener('click', function(e) {t.switchPage(e)})
		}
	}
	
	this.headerMenu = new HeaderMenu();
	
	// #chart #exChart
	
	this.chart = exChart
	
	// #tradingArea #tradeMenu
	
	this.tradingArea = {
		switchMenu: function() {
				var moduleNodeList = document.getElementsByClassName("trading-area-toggle-module");
				var buttonsNodeList = document.getElementsByClassName("trading-area-toggle-button");
				var parentElement = document.getElementById("trading-area-wrapper");
				var selModuleNum = 0;
				var menu = exLib.menu.newSwitchMenu(buttonsNodeList, parentElement, moduleNodeList, selModuleNum, "block");
				menu.selectedButtonStyleClass = " toggle-buttons-toggled";
				return menu;
		},
		activateMenus: function() {
			this.switchMenu = this.switchMenu();
			this.switchMenu.activate();
		}
	}
	
	// #tradeOrders #orders
	
	this.tradeOrders = {
		ordersMax: 30,
		totalValue: 0,
		buyOrders: null,
		sellOrders: null,
		sellOrderNodeList: document.getElementsByClassName("sell-order-row"),
		buyOrderNodeList: document.getElementsByClassName("buy-order-row"),
		loadAnimation: exLib.animation.create(document.getElementById("trade-orders-load-overlay")),
		renderRowTemplates: function() {
			var renderTemplateRow = function(sellOrBuy, secondary) {
				var parentElement = document.getElementById(sellOrBuy + "-orders");
				var clone = exchange.tradeOrders[sellOrBuy + "OrderNodeList"][0].cloneNode(true);
				if (secondary) clone.className += " trade-order-row-secondary "
				parentElement.appendChild(clone);
			}
			var renderTemplateRows = function(sellOrBuy) {
				for (var k = 0; k < exchange.tradeOrders[sellOrBuy + "Orders"].length - 1; k++) {
					if (k % 2 == 0) {
						renderTemplateRow(sellOrBuy, true)
					} else {
						renderTemplateRow(sellOrBuy);
					}
				}
			}
			renderTemplateRows("sell");
			renderTemplateRows("buy");
		},
		renderOrders: function() {
			var totalValue;
			var renderRow = function(sellOrBuy, i) {
				var parentEl = document.getElementsByClassName(sellOrBuy + "-order-row");
				var priceEl = parentEl[i].firstElementChild;
				/*if (sellOrBuy == "sell") {
					var priceEl = parentEl[exchange.tradeOrders.ordersMax - 1 - i].firstElementChild;
				} else {
					var priceEl = parentEl[i].firstElementChild;
				}*/
				var amountPrimaryEl = priceEl.nextElementSibling;
				var amountSecondaryEl = amountPrimaryEl.nextElementSibling;
				var totalEl = amountSecondaryEl.nextElementSibling;
				
				if (sellOrBuy == "sell") {
					var dataArray = exchange.tradeOrders.sellOrders;
				} else if (sellOrBuy == "buy") {
					var dataArray = exchange.tradeOrders.buyOrders;
				}
				
				totalValue += parseFloat(dataArray[i].BaseAmount);
				
				priceEl.textContent = exLib.string.formatDecimalByLength(dataArray[i].Price, 10);
				amountPrimaryEl.textContent = exLib.string.formatDecimalByLength(dataArray[i].Amount, 10);
				amountSecondaryEl.textContent = exLib.string.formatDecimalByLength(dataArray[i].BaseAmount, 10);
				totalEl.textContent = exLib.string.formatDecimalByLength(totalValue, 5);
			}
			
			var renderRows = function(sellOrBuy) {
				totalValue = 0;
				for  (var i = 0; i < exchange.tradeOrders[sellOrBuy + "Orders"].length; i++) {
					renderRow(sellOrBuy, i);
				}
			}
			renderRows("sell");
			renderRows("buy");
		},
		render: function() {
			if (exchange.tradeOrders.sellOrderNodeList[0].firstElementChild.textContent 
			|| exchange.tradeOrders.buyOrderNodeList[0].firstElementChild.textContent) {
				exchange.tradeOrders.clear();
			}
			this.renderRowTemplates();
			this.renderOrders();
			this.loadAnimation.toggle(false);
		},
		update: function(d) {
			this.buyOrders = d.Bids;
			this.sellOrders = d.Asks;
			this.clear();
			this.render();
			/*
			var t = this;
			var buy = this.buyOrders;
			var sell = this.sellOrders;
			var buyRows = this.buyOrderNodeList;
			var sellRows = this.sellOrderNodeList;
			
			function contains(order, list) {
				for (var i = 0; i < list.length; i++) {
					if (order.Price !== list[i].Price) {
						
					} else if ()
				}
				if (list.indexOf(order) === -1) {
					return false;
				}
				return true;
			}
			function deleteOrder(i, nodeList) {
				// nodeList.parentElement.removeElementChild(nodeList[i]);
				nodeList[i].innerHTML = "";
			}
			function deleteEmpty(nodeList) {
				var i = 0;
				while (i < nodeList.length) {
					if (nodeList[i].firstElementChild.textContent.length <= 0) {
						nodeList.parentElement.removeChild(nodeList[i]);
						continue;
					}
					i++
				}
			}
			function createOrder(order, nodeList, data) {
				function init() {
					var node = nodeList[0].cloneNode(true);
					var price = node.firstElementChild;
					var prmAmnt = price.nextElementSibling;
					var scdAmnt = prmAmnt.nextElementSibling;
					price.textContent = data.Price;
					prmAmnt.textContent = data.Amount;
					scdAmnt.textContent = data.BaseAmount;
				}
				function checkFirstLast() {
					if (nodeList == buyRows) {//check if order should be first or last in buy/sell list
						if (order < nodeList[nodeList.length - 1].firstElementChild.textContent) {
							nodeList.parentElement.appendChild(node);
							return;
						} else if (order > nodeList[0].firstElementChild.textContent) {
							nodeList.parentElement.insertBefore(node, nodeList[0]);
							return;
						}
					} else {
						if (order.Price > nodeList[nodeList.length - 1].firstElementChild.textContent) {
							return;
						} else if (order.Price < nodeList[0].firstElementChild.textContent) {
							return;
						}
					}
				}
				function checkPos() {
					if (nodeList == buyRows) {
						for (var i = 1; i < nodeList.length - 1; i++) {//regular procedure (not last or first in buy/sell list)
							if (order.Price < nodeList[i].firstElementChild.textContent) {
								if (order.Price > nodeList[i + 1 ].firstElementChild.textContent) {
									nodeList.parentElement.insertBefore(node, nodeList[i + 1 ]);
								}
							}
						}
					} else {
						for (var i = 1; i < nodeList.length - 1; i++) {//same for sell rows
							if (order.Price > nodeList[i].firstElementChild.textContent) {
								if (order.Price < nodeList[i + 1 ].firstElementChild.textContent) {
									nodeList.parentElement.insertBefore(node, nodeList[i + 1 ]);
								}
							}
						}
					}
				}
				init();
				checkFirstLast();
				checkPos();
			}
			function check(list) {
				var type = list == d.Bids ? "Bids" : "Asks";
				var oldList = type == "Bids" ? buy : sell;
				var nodeList = type == "Bids" ? buyRows : sellRows;
				for (var i = 0; i < oldList.length; i++) {
					if (!contains(oldList[i], list)) {//check if order no longer exists
						deleteOrder(i, nodeList);
					}
				}
				deleteEmpty(nodeList);//delete all empty rows, deleteOrder() only clears the contents of a node
				for (var i = 0; i < list.length; i++) {
					if (!contains(list[i], oldList)) {//check if order is new
						createOrder(list[i], nodeList, list);
					}
				}
			}
			check(d.Bids);
			check(d.Asks);*/
		},
		clear: function() {
			var sellOrders = document.getElementById("sell-orders");									//unnecessary repetition
			var sellIndexRow = document.getElementById("sell-orders-index").cloneNode(true);
			var sellRow = document.getElementsByClassName("sell-order-row")[0].cloneNode(true);
			var priceEl = sellRow.firstElementChild;
			var amountPrimaryEl = priceEl.nextElementSibling;
			var amountSecondaryEl = amountPrimaryEl.nextElementSibling;
			var totalEl = amountSecondaryEl.nextElementSibling;
			
			priceEl.textContent = "";
			amountPrimaryEl.textContent = "";
			amountSecondaryEl.textContent = "";
			totalEl.textContent = "";
			
			var buyOrders = document.getElementById("buy-orders");
			var buyIndexRow = document.getElementById("buy-orders-index").cloneNode(true);				//unnecesary repetition
			var buyRow = document.getElementsByClassName("buy-order-row")[0].cloneNode(true);
			priceEl = buyRow.firstElementChild;
			amountPrimaryEl = priceEl.nextElementSibling;
			amountSecondaryEl = amountPrimaryEl.nextElementSibling;
			totalEl = amountSecondaryEl.nextElementSibling;
			
			priceEl.textContent = "";
			amountPrimaryEl.textContent = "";
			amountSecondaryEl.textContent = "";
			totalEl.textContent = "";
			
			sellOrders.innerHTML = "";
			buyOrders.innerHTML = "";
			
			sellOrders.appendChild(sellIndexRow);
			sellOrders.appendChild(sellRow);
			
			buyOrders.appendChild(buyIndexRow);
			buyOrders.appendChild(buyRow);
		}
	}
	
	// #tradingUtils #trading #tradeUtils #trade
	
	this.tradingUtils = {
		selectOrder: function(e) {
			var row;
			var rowClass;
			var nodeList;
			var inputAmount;
			var inputPrice;
			var otherInputPrice;
			var totalAmount;
			var feeAmount;
			var amount;
			var price;
			function init() {
				function initRow() {
					if (e.target.className.indexOf("trade-order-row") !== -1) {
						row = e.target;
					} else if (e.target.parentElement.className.indexOf("trade-order-row") !== -1) {
						row = e.target.parentElement;
					} else {
						return false;
					}
				}
				function initNodeList() {
					rowClass = row.className.indexOf("buy-order-row") !== -1 ? "buy-order-row" : "sell-order-row";
					nodeList = document.getElementsByClassName(rowClass);
				}
				function inputsFeeAndTotal() {
					if (rowClass === "buy-order-row") {
						inputAmount = document.getElementById("sell-amount-input");
						inputPrice = document.getElementById("sell-price-input");
						otherInputPrice = document.getElementById("buy-price-input");
					} else {
						inputAmount = document.getElementById("buy-amount-input");
						inputPrice = document.getElementById("buy-price-input");
						otherInputPrice = document.getElementById("sell-price-input");
					}
				}
				if (initRow() === false){return false}
				initNodeList();
				inputsFeeAndTotal();
			}
			function getValues() {
				price = row.firstElementChild.textContent;
				amount = 0.0;
				
				for (var i = 0; true; i++) {
					amount = exLib.string.formatDecimalByLength(
					parseFloat(amount) + parseFloat(nodeList[i].firstElementChild.nextElementSibling.textContent), 10);
					if (row.firstElementChild.textContent === nodeList[i].firstElementChild.textContent) {break;}
				}
			}
			function setValues() {
				inputPrice.value = price;
				otherInputPrice.value = price;
				inputAmount.value = amount;
				exchange.tradingUtils.calculateTotal("sell");
				exchange.tradingUtils.calculateTotal("buy");
			}
			if (init() === false) {return};
			getValues();
			setValues();
		},
		selectBalance: function(type) {
			if (type === "sell") {
				document.getElementById(type + "-amount-input").value
				= exLib.string.formatDecimalByLength(document.getElementById(type + "-balance-amount").textContent, 10);
			} else {
				if (parseFloat(document.getElementById(type + "-price-input").value) <= 0.0) {
					return;
				}
				document.getElementById(type + "-amount-input").value
				= exLib.string.formatDecimalByLength(parseFloat(document.getElementById(type + "-balance-amount").textContent)
				* (1 - exchange.marketPair.tradingFee) / parseFloat(document.getElementById(type + "-price-input").value), 10);
			}
			exchange.tradingUtils.calculateTotal(type);
		},
		calculateTotal: function(type) {
			var total = exLib.num.toFixedFloor((parseFloat(document.getElementById(type + "-amount-input").value)
				* parseFloat(document.getElementById(type + "-price-input").value)), 8);
			document.getElementById(type + "-total-input").value
				= exLib.string.formatDecimalByLength(total, 10);
		},
		calculateAmount: function(e) {
			if (e.target.id === "buy-total-input") {
				var type = "buy";
			} else {
				var type = "sell";
			}
			var amount = parseFloat(e.target.value) / 
				parseFloat(document.getElementById(type + "-price-input").value);
			document.getElementById(type + "-amount-input").value = amount.toFixed(8);
			
		},
		emptyFields: function(type) {
			document.getElementById(type + "-price-input").value
				= document.getElementById(type + "-amount-input").value
				= document.getElementById(type + "-total-input").value
				= "";
		},
		order: {
			loadAnimation: exLib.animation.create(document.getElementById("order-popup-page-load-overlay")),
			popUpWindow: function() {
				var windowEl = document.getElementById("order-popup-page-wrapper");
				var closeButton = document.getElementById("order-popup-page-OK-button");
				var bgOverlay = document.getElementById("gray-background-overlay");
				var win = exLib.popUp.newPopUpWindow(windowEl, closeButton, bgOverlay, "inline-flex");
				return win;
			},
			activatePopUpWindow: function() {
				this.popUpWindow = this.popUpWindow();
				this.popUpWindow.activate();
			},
			error: {
				message: document.getElementById("order-error-message"),
				funds: function() {
					document.getElementById("order-success-message").style.display = "none";
					this.message.textContent = "Insufficient funds";
				},
				minAmount: function() {
					document.getElementById("order-success-message").style.display = "none";
					this.message.textContent = "Order amount under minimum";
				},
				login: function() {
					document.getElementById("order-success-message").style.display = "none";
					this.message.textContent = "Not logged in";
				},
				handle: function(msg) {
					if (msg.indexOf("ACCOUNT_BALANCE_LESS_THAN_ORDER") !== -1 ) {
						this.funds();
					} else if (msg === "ORDER_UNDER_MIN") {
						this.minAmount();
					} else if(msg === "FAIL_USER") {
						this.login();
					} else {
						document.getElementById("order-success-message").style.display = "none";
						this.message.textContent = msg;
					}
				}
			},
			updateInfo: function(price, amount, type, pair) {
				var coin1 = pair.split("_")[0],
					coin2 = pair.split("_")[1],
					total = price * amount,
					fee = total * exchange.marketPair.tradingFee;
				
				document.getElementById("order-price").textContent = price + " " + coin2;
				document.getElementById("order-amount").textContent = amount + " " + coin1;
				document.getElementById("order-total").textContent = exLib.num.toFixedFloor(total, 8) + " " + coin2 ;
				if (type === "Buy") {
					document.getElementById("order-fee").textContent = fee.toFixed(8) + " " + coin2
						+ " (" + (exchange.marketPair.tradingFee * 100) + "%)";
				} else {
					document.getElementById("order-fee").textContent = (amount * exchange.marketPair.tradingFee)
					.toFixed(8) + " " + coin1 + " (" + (exchange.marketPair.tradingFee * 100) + "%)";
				}
				document.getElementById("order-type").textContent = type;
				document.getElementById("order-pair").textContent = coin1 + "/" + coin2;
			},
			clearInfo: function() {
				document.getElementById("order-price").textContent = "";
				document.getElementById("order-amount").textContent = "";
				document.getElementById("order-total").textContent = "";
				document.getElementById("order-fee").textContent = "";
				document.getElementById("order-type").textContent = "";
				document.getElementById("order-pair").textContent = "";
				document.getElementById("order-success-message").style.display = "none";
				document.getElementById("order-popup-page-confirm-button").style.display = "flex";
				document.getElementById("order-popup-page-cancel-button").style.display = "flex";
				document.getElementById("order-popup-page-OK-button").style.display = "none";
				this.error.message.textContent = "";
			},
			send: function(t, orderType) {
				t.clearInfo();
				t.popUpWindow.open("", t.popUpWindow);
				
				var pair = exchange.currentMarketPair;
				
				var priceInput = document.getElementById(orderType + "-price-input"),
					amountInput = document.getElementById(orderType + "-amount-input");
				
				// decimal place check on price for btce coins
				
				var btceDecimals = {
					BTC_USD: 3,
					ETH_BTC: 5,
					ETH_USD: 5,
					LTC_BTC: 5,
					LTC_USD: 6,
				}
				
				if (btceDecimals[pair]) {
					priceInput.value = exLib.num.toFixedFloor(priceInput.value, btceDecimals[pair]);
					amountInput.value = exLib.num.toFixedFloor(amountInput.value, 7);
				}
				
				amountInput.value = exLib.num.toFixedFloor(amountInput.value, 8);
				
				var price = priceInput.value;
				var amount = amountInput.value;
				var type = exLib.string.capitalizeFirstLetter(orderType);
				t.updateInfo(price, amount, type, pair);
				var data = "Price=" + price + "&Amount=" + amount + "&Type=" + type + "&Pair=" + pair;
				var xhr = exLib.ajax.newXhr("order");
				xhr.t = t;
				function sendOrder() {
					t.loadAnimation.toggle(true);
					exLib.ajax.postData(xhr, "https://alcurex.com/exchange/order", data, t.verify);
					document.getElementById("order-popup-page-confirm-button")
					.removeEventListener('click', sendOrder, false);
					document.getElementById("order-popup-page-cancel-button")
					.removeEventListener('click', cancelOrder, false);
					document.getElementById("order-popup-page-confirm-button").style.display = "none";
					document.getElementById("order-popup-page-cancel-button").style.display = "none";
					document.getElementById("order-popup-page-OK-button").style.display = "flex";
				}
				function cancelOrder() {
					document.getElementById("order-popup-page-confirm-button")
					.removeEventListener('click', sendOrder, false);
					document.getElementById("order-popup-page-cancel-button")
					.removeEventListener('click', cancelOrder, false);
					exchange.tradingUtils.order.popUpWindow.close("",
					exchange.tradingUtils.order.popUpWindow);
				}
				document.getElementById("order-popup-page-confirm-button")
				.addEventListener('click', sendOrder, false);
				document.getElementById("order-popup-page-cancel-button")
				.addEventListener('click', cancelOrder, false);
			},
			verify: function(xhr) {
				var data = JSON.parse(xhr.responseText);
				var t = xhr.t;
				if (data.Message === "BUY_TRADE_PLACED" || data.Message === "SELL_TRADE_PLACED") {
					t.success();
				} else {
					t.error.handle(data.Message);
				}
				t.loadAnimation.toggle(false);
			},
			success: function() {
				this.error.message.textContent = "";
				document.getElementById("order-success-message").style.display = "block";
			},
			activate: function() {
				var t = this;
				this.activatePopUpWindow();
				document.getElementById("sell-button")
				.addEventListener('click', function() {t.send(t, "sell")}, false);
				document.getElementById("buy-button")
				.addEventListener('click', function() {t.send(t, "buy")}, false);
			}
		},
		activate: function() {
			var t = this;
			t.order.activate();
			document.getElementById("trade-orders").addEventListener('click', function(e){t.selectOrder(e)}, false);
			document.getElementById("buy-balance").addEventListener('click', function(){t.selectBalance("buy")}, false);
			document.getElementById("sell-balance").addEventListener('click', function(){t.selectBalance("sell")}, false);
			function inputEvents(type) {
				document.getElementById(type + "-amount-input")
				.addEventListener('input', function() {t.calculateTotal(type)}, false);
				document.getElementById(type + "-price-input")
				.addEventListener('input', function() {t.calculateTotal(type)}, false);
				document.getElementById(type + "-total-input")
				.addEventListener('input', function(e) {t.calculateAmount(e)}, false);
			}
			inputEvents("sell");
			inputEvents("buy");
		}
	}
	
	// #moduleMenuUtils #menuUtils #moduleUtils #module #moduleMenu
	
	this.moduleMenuUtils = {
		bottomMenu: function() {
			var moduleNodeList = document.getElementsByClassName("right-bottom-module-switch-module");
			var buttonsNodeList = document.getElementsByClassName("right-bottom-module-toggle");
			var parentElement = document.getElementById("right-bottom-module-toggle-menu");
			var selModuleNum = exchange.marketList.markets.indexOf(exchange.currentMarketPair.split("_")[1]);
			var menu = exLib.menu.newSwitchMenu(buttonsNodeList, parentElement, moduleNodeList, selModuleNum, "block");
			menu.selectedButtonStyleClass = " toggle-buttons-toggled";
			return menu;
		},
		activateMenus: function() {
			this.bottomMenu = this.bottomMenu();
			this.bottomMenu.activate();
		}
	}
	
	// #news
	
	this.news = {
		data: [],
		typeClasses: ["chatbox-news-row-type-important", "chatbox-news-row-type-new-coin",
			"chatbox-news-row-type-maintenance", "chatbox-news-row-type-announcement"],
		typeNames: ["IMPORTANT", "NEW COIN", "MAINTENANCE", "ANNOUNCEMENT"],
		render: function(d) {
			function renderTemplates() {
				var template = nodeList[0];
				var parentEl = template.parentElement;
				for (var i = 0, l = d.length; i < l - 1; i++) {
					var clone = template.cloneNode(true);
					parentEl.appendChild(clone);
				}
			}
			function updateRowsInfo() {
				function updateRowInfo(i) {
					var di = d[i];
					var dateEl = nodeList[i].firstElementChild;
					var titleEl = dateEl.nextElementSibling;
					var msgEl = titleEl.nextElementSibling;
					var typeEl = msgEl.nextElementSibling;
					
					var dateObj = new Date(di.Unixtime * 1000);
					dateEl.textContent = dateObj.toUTCString();
					titleEl.textContent = di.Header;
					msgEl.textContent = di.Message;
					typeEl.textContent = t.typeNames[di.Type];
					typeEl.classList.add(t.typeClasses[di.Type]);
				}
				for (var i = 0, l = nodeList.length; i < l; i++) {
					updateRowInfo(i);
				}
			}
			var t = this;
			t.data = d;
			if (d.length <= 0) {return;}
			var nodeList = document.getElementsByClassName("chatbox-news-row");
			renderTemplates();
			updateRowsInfo();
		},
		clear: function() {
			var template = document.getElementsByClassName("chatbox-news-row")[0];
			var clone = template.cloneNode(true);
			var parentEl = template.parentElement;
			clone.lastElementChild.previousElementSibling
			.classList.remove(this.typeClasses[0], this.typeClasses[1],
			this.typeClasses[2], this.typeClasses[3]);
			parentEl.innerHTML = "";
			parentEl.appendChild(clone);
		},
		updateTimer: 0,
		update: function(d) {
			this.clear();
			this.render(d);
		}
	}
	
	// #chatbox #chat
	
	this.chatbox = {
		data: [],
		message: {
			input: document.getElementById("local-chat-textarea"),
			format: function(msg) {
				if (msg.length <= 0) {return false}
				msg = "Message=" + encodeURIComponent(msg);
				return msg;
			},
			send: function() {
				var t = exchange.chatbox.message;
				if (typeof profile === 'undefined' || profile.status.loggedIn === false) {return;}
				var msg = t.input.value;
				msg = t.format(msg);
				if (!msg) {return;}
				function log(xhr) {
				}
				exLib.ajax.postData(exLib.ajax.newXhr("chatMsg"),
				"https://alcurex.com/exchange/postchat", msg, log);
				t.input.value = "";
			},
			activate: function() {
				var t = this;
				exLib.input.activateEnter(t.input, t.send);
			}
		},
		selectName: function(e) {
			if (!e.target.classList.contains("username")) {return;}
			document.getElementById("local-chat-textarea").value += "@" + e.target.textContent + " ";
		},
		render: function() {
			var data = this.data;
			if (typeof data === 'undefined') {return;}
			var nodeList = document.getElementsByClassName("local-chat-message");
			function templates() {
				var parentEl = document.getElementById("local-chat-messages");
				var firstNode = nodeList[0];
				var cloneNode;
				cloneNode = firstNode.cloneNode(true);
				for (var i = 0; i < data.length - 1; i++) {
					cloneNode = firstNode.cloneNode(true);
					parentEl.appendChild(cloneNode);
				}
			}
			function message(i) {
				var node = nodeList[i];
				var un = node.firstElementChild;
				var msg = un.nextElementSibling;
				
				un.textContent = data[i].UserName;
				msg.textContent = data[i].Message;
			}
			function messages() {
				for (var i = 0; i < data.length; i++) {
					message(i);
				}
			}
			templates();
			messages();
			this.scrollDown();
		},
		clear: function() {
			var parentEl = document.getElementById("local-chat-messages");
			var clone = document.getElementsByClassName("local-chat-message")[0].cloneNode(true);
			parentEl.innerHTML = "";
			parentEl.appendChild(clone);
		},
		update: function(d) {
			if (this.data.length !== 0) {
				if (this.data[this.data.length - 1].Message === d[d.length - 1].Message) {
					return;
				}
			}
			this.data = d;
			this.clear();
			this.render();
		},
		toggleHide: function() {
			var toggle = document.getElementById("chatbox-hide-toggle");
			var chatbox = document.getElementById("chatbox-wrapper");
			var markets = document.getElementById("right-bottom-module-wrapper");
			
			if (!toggle.classList.contains("chatbox-hide-toggle-toggled")) {
				chatbox.classList.remove("chatbox-wrapper-reveal");
				markets.classList.remove("right-bottom-module-wrapper-shrink");
				toggle.classList.add("chatbox-hide-toggle-toggled");
				chatbox.classList.add("chatbox-wrapper-hidden");
				markets.classList.add("right-bottom-module-wrapper-expanded");
			} else {
				toggle.classList.remove("chatbox-hide-toggle-toggled");
				chatbox.classList.remove("chatbox-wrapper-hidden");
				markets.classList.remove("right-bottom-module-wrapper-expanded");
				chatbox.classList.add("chatbox-wrapper-reveal");
				markets.classList.add("right-bottom-module-wrapper-shrink");
			}
		},
		scrollDown: function() {
			if (this.scroll === false) {return;}
			var localChatMessages = document.getElementById("local-chat-messages");
			var localChat = document.getElementById("local-chat");
			if (!localChat.style.display) {
				var toggleDisplay = true; 
				localChat.style.display = "block";
			} else {var toggleDisplay = false;}
			exLib.scroll.downFully("local-chat-messages");
			if (toggleDisplay === true) {localChat.style.display = "none";}
		},
		toggleScrollDown: function(t) {
			var localChatMessages = document.getElementById("local-chat-messages");
			if (parseInt(localChatMessages.scrollTop) + parseInt(localChatMessages.offsetHeight) === parseInt(localChatMessages.scrollHeight)) {
				t.scroll = true;
			} else {
				t.scroll = false;
			}
		},
		toggleMenu: function() {
			var triggerElement = document.getElementById("chatbox-toggle");
			var buttonNodeList = document.getElementsByClassName("chatbox-toggle-buttons");
			var moduleNodeList = document.getElementsByClassName("chatbox-switch-module");
			var menu = exLib.menu.newSwitchMenu(buttonNodeList, triggerElement, moduleNodeList, 0, "block");
			menu.selectedButtonStyleClass = " toggle-buttons-toggled";
			return menu;
		},
		activateMenus: function() {
			this.toggleMenu = this.toggleMenu();
			this.toggleMenu.activate();
		},
		activate: function() {
			var t = this;
			t.activateMenus();
			t.message.activate();
			t.scroll = true;
			document.getElementById("local-chat-messages")
				.addEventListener('scroll', function() {t.toggleScrollDown(t)}, false);
			document.getElementById("local-chat-messages")
				.addEventListener('click', function(e) {t.selectName(e)}, false);
			document.getElementById("chatbox-hide-toggle")
				.addEventListener('click', t.toggleHide);
			document.getElementById("chatbox-toggle")
				.addEventListener('click', function(e) {
					if (document.getElementById("chatbox-hide-toggle")
						.classList.contains("chatbox-hide-toggle-toggled")) {
						t.toggleHide();
					}
			});
		}
	}
	
	// #support #supportChat #supportMessages #liveSupport
	
	this.support = {
		data: [],
		message: {
			input: document.getElementById("support-chat-textarea"),
			format: function(msg) {
				if (msg.length <= 0) {return false}
				msg = "Message=" + encodeURIComponent(msg);
				return msg;
			},
			send: function() {
				var t = exchange.support.message;
				if (typeof profile === 'undefined' || profile.status.loggedIn === false) {return;}
				var msg = t.input.value;
				msg = t.format(msg);
				if (!msg) {return;}
				function log(xhr) {
				}
				exLib.ajax.postData(exLib.ajax.newXhr("chatMsg"),
				"https://alcurex.com/exchange/postsupportchat", msg, log);
				t.input.value = "";
			},
			activate: function() {
				var t = this;
				exLib.input.activateEnter(t.input, t.send);
			}
		},
		selectName: function(e) {
			if (!e.target.classList.contains("username")) {return;}
			document.getElementById("support-chat-textarea").value += "@" + e.target.textContent + "^ ";
		},
		render: function(d) {
			var nodeList = document.getElementsByClassName("support-chat-message");
			function templates() {
				var parentEl = document.getElementById("support-chat-messages");
				var firstNode = nodeList[0];
				var cloneNode;
				cloneNode = firstNode.cloneNode(true);
				for (var i = 0; i < d.length - 1; i++) {
					cloneNode = firstNode.cloneNode(true);
					parentEl.appendChild(cloneNode);
				}
			}
			function message(i) {
				var node = nodeList[i];
				var un = node.firstElementChild;
				var msg = un.nextElementSibling;
				
				un.textContent = d[i].User;
				msg.textContent = d[i].Message;
			}
			function messages() {
				for (var i = 0; i < d.length; i++) {
					message(i);
				}
			}
			templates();
			messages();
			this.scrollDown();
		},
		clear: function() {
			var parentEl = document.getElementById("support-chat-messages");
			var clone = document.getElementsByClassName("support-chat-message")[0].cloneNode(true);
			parentEl.innerHTML = "";
			parentEl.appendChild(clone);
		},
		update: function(d) {
			if (this.data.length !== 0) {
				if (this.data[this.data.length - 1].Message === d[d.length - 1].Message) {
					return;
				}
			}
			this.data = d;
			this.clear();
			this.render(d);
		},
		scrollDown: function() {
			if (this.scroll === false) {return;}
			var supportChatMessages = document.getElementById("support-chat-messages");
			var supportChat = document.getElementById("support-chat");
			if (!supportChat.style.display) {
				var toggleDisplay = true;
				supportChat.style.display = "block";
			} else {var toggleDisplay = false;}
			exLib.scroll.downFully("support-chat-messages");
			if (toggleDisplay === true) {supportChat.style.display = "none";}
		},
		toggleScrollDown: function(t) {
			var supportChatMessages = document.getElementById("support-chat-messages");
			if (parseInt(supportChatMessages.scrollTop) + parseInt(supportChatMessages.offsetHeight) === parseInt(supportChatMessages.scrollHeight)) {
				t.scroll = true;
			} else {
				t.scroll = false;
			}
		},
		activate: function() {
			var t = this;
			t.message.activate();
			t.scroll = true;
			document.getElementById("support-chat-messages")
			.addEventListener('scroll', function() {t.toggleScrollDown(t)}, false);
			document.getElementById("support-chat-messages")
			.addEventListener('click', function(e) {t.selectName(e)}, false);
		}
	}
	
	// #marketList #markets
	
	this.marketList = {
		highestLocalVolMarket: null,
		markets: ["BTC", "USD"],
		sortBy: "Volume",
		sortButtons: [
			document.getElementById("market-coin-index"),
			document.getElementById("market-change-index"),
			document.getElementById("market-price-index"),
			document.getElementById("market-volume-index")
		],
		sortSelected: 3,
		sortList: function(attr, coinList, reverse, marketType) {
			
			coinList.sort(function(a, b) {
				
				if (attr === "Volume") {
					var vol1 = Math.max(a["GlobalBaseVol"], a["LocalVolume"]);
					var vol2 = Math.max(b["GlobalBaseVol"], b["LocalVolume"]);
					
					if (vol1 > vol2) {
						return reverse ? 1 : -1;
					}
					if (vol1 < vol2) {
						return reverse ? -1 : 1;
					}
					
					return 0;
					
				}
				
				if (attr !== "FirstCurrency") {
					a[attr] = parseFloat(a[attr]);
					b[attr] = parseFloat(b[attr]);
				}
				
				if (a[attr] > b[attr]) {
					return reverse ? 1 : -1;
				}
				if (a[attr] < b[attr]) {
					return reverse ? -1 : 1;
				}
				
				return 0;
			});
			return coinList;
		},
		switchSorting: function(e) {
			if (e.target.parentElement.className.indexOf("market-index-row") === -1) {
				return;
			}
			if (this.sortButtons[this.sortSelected] === e.target) {return;}
			
			if (e.target.id === "market-coin-index") {
				this.sortBy = "FirstCurrency";
			} else if (e.target.id === "market-change-index") {
				this.sortBy = "Percent";
			} else if (e.target.id === "market-price-index") {
				this.sortBy = "Price";
			} else if (e.target.id === "market-volume-index") {
				this.sortBy = "Volume";
			}
			
			this.sortButtons[this.sortSelected].classList.remove("market-index-selected");
			e.target.classList.add("market-index-selected");
			this.sortSelected = this.sortButtons.indexOf(e.target);
			
			this.updateMarketList(this.globalBTC, "BTC", "global", "sorting");
			this.updateMarketList(this.globalUSD, "USD", "global", "sorting");
			this.updateMarketList(this.localBTC, "BTC", "local", "sorting");
		},
		filterMarkets: function(obj, type) {
			var a = {};
			for (var o in obj) {
				var ob = obj[o];
				if (type === "global" && Math.max(ob.GlobalBaseVol, ob.LocalVolume) > 10) {
					a[o] = ob;
				} else if (type === "local" && Math.max(ob.GlobalBaseVol, ob.LocalVolume) < 10) {
					a[o] = ob;
				}
			}
			return a;
		},
		renderMarketList: function(dataObj, market, marketType) {
			
			var parentElement = document.getElementById("market-pairs-" + marketType + "-" + market);
			var marketRows = document.getElementsByClassName("market-row-" + marketType + "-" + market);
			
			dataObj = this.filterMarkets(dataObj, marketType);
			
			this[marketType + market] = dataObj;
			
			var cloneNode;
			for (var marketPair in dataObj) {
				cloneNode = marketRows[0].cloneNode(true);
				parentElement.appendChild(cloneNode);
			}
			// quick fix to make the amount of rows correct because of the template row
			parentElement.removeChild(marketRows[marketRows.length - 1]);
			
			this.updateMarketList(dataObj, market, marketType);
			
		},
		updateMarketList: function(dataObj, market, marketType, sorting) {
			
			//create a copy array
			var dataArray = exLib.array.convert("object", dataObj);
			//sort array
			dataArray = this.sortList(this.sortBy, dataArray, this.sortBy === "FirstCurrency" ? true : false, marketType);
			
			if (this.sortBy === "Volume" && marketType === "local") {
				this.highestLocalVolMarket = dataArray[0].Pair;
			}
			
			var marketRows = document.getElementsByClassName("market-row-" + marketType + "-" + market);
			var tickerEl;
			var changeEl;
			var priceEl;
			var gvEl;
			var lvEl;
			var pxOffset;
			var splitMarketPair;
			var firstCurrency;
			var that = this;
			
			var oldData = this["old" + marketType[0].toUpperCase() + marketType.substr(1, marketType.length) + market];
			
			var formatChangeString = function(change) {
				change = change.toFixed(2);
				if (change.length > 4) {
					if (change.length > 5) {
						change = change.substr(0, change.length - 3);
					} else {
						change = change.substr(0, change.length - 1);
					}
				}
				if (change.indexOf("-") === 0) {
					if (change.length >= 5) {return change;}
					if (change.indexOf(".") === -1 && change.length === 4) {
						return change;
					}
					if (change.indexOf(".") === -1) {
						change += ".";
					}
					for (var i = change.length; i < 5; i++) {
						change += "0";
					}
					return change;
				} else {
					return "+" + change;
				}
				return "+" + change;
			}
			var changeColor = function(change) {
				change = change.toString();
				if (change.indexOf("-") === 0) {
					return "market-change-red";
				}
			}
			var formatPriceString = function(price) {
				price = price.toFixed(8);
				if (price.length > 10) {
					price = price.substr(0, price.length - (price.length - 10));
				}
				return price;
			}
			var formatVolumeString = function(volume) {
				volume = volume.toFixed(8);
				if (volume.length > 8) {
					volume = volume.substr(0, volume.length - (volume.length - 8));
				}
				if (volume.indexOf(".") === volume.length - 1) {
					volume = volume.substr(0, volume.length - 1);
				}
				return volume;
			}
			var flash = function(row) {
				
				row.lastElementChild.style.display = "flex";
				setTimeout(function() {
					row.lastElementChild.style.display = "none";
				}, 1000);
				
/* 				row.style.animationName = "flash-market-row";
				row.style.animationDuration = "0.1s";
				row.className += " market-row-flashed ";
				function preflash() {
					row.style.animationName = "unflash-market-row";
					row.style.animationDuration = "0.5s";
					function reflash() {
						row.style.animationName = "flash-market-row";
						row.style.animationDuration = "0.1s";
					}
					setTimeout(reflash, 500);
				}
				function unflash() {
					row.style.animationName = "unflash-market-row";
					row.style.animationDuration = "0.5s";
					row.className = row.className.split(" market-row-flashed ")[0];
				}
				setTimeout(preflash, 200);
				setTimeout(unflash, 2000); */
			}
			var compareOldData = function(i, marketPair) {
				if (typeof oldData === "undefined") { return; }
				if (parseFloat(dataObj[marketPair].Price) !== parseFloat(oldData[marketPair].Price) ||
				parseFloat(dataObj[marketPair].LocalVolume) !== parseFloat(oldData[marketPair].LocalVolume) ||
				parseFloat(dataObj[marketPair].GlobalBaseVol) !== parseFloat(oldData[marketPair].GlobalBaseVol)) {
					return true;
				} else {
					return false;
				}
			}
			var renderRow = function(i, marketPair) {
				
				var changed = compareOldData(i, marketPair.Pair);
				
				if ((!changed && oldData) && !sorting)  { return; }
				
				tickerEl = marketRows[i].firstElementChild;
				changeEl = tickerEl.nextElementSibling;
				priceEl = changeEl.nextElementSibling;
				volumeEl = priceEl.nextElementSibling;
				
				splitMarketPair = marketPair.Pair.split("_");
				firstCurrency = splitMarketPair[0];
				var id = marketPair.Pair
				marketRows[i].id = id;
				if (id === exchange.currentMarketPair) {
					if (!that.selectedMarketEl) {
						that.selectedMarketEl = marketRows[i];
						that.selectedMarketEl.classList.add("market-row-selected");
					} else if (that.selectedMarketEl !== marketRows[i]){
						that.selectedMarketEl.classList.remove("market-row-selected");
						that.selectedMarketEl = marketRows[i];
						marketRows[i].classList.add("market-row-selected");
					}
				}
				marketRows[i].title = marketPair.FirstCurrencyname;
				tickerEl.textContent = firstCurrency;
				changeEl.textContent = formatChangeString(parseFloat(marketPair.Percent));
				changeEl.classList.remove("market-change-red");
				changeEl.classList.add(changeColor(marketPair.Percent));
				priceEl.textContent = formatPriceString(parseFloat(marketPair.Price));
				volumeEl.textContent = marketPair.GlobalBaseVol > 0 ? formatVolumeString(parseFloat(marketPair.GlobalBaseVol)) :
				formatVolumeString(parseFloat(marketPair.LocalVolume));
				
				if (!sorting && oldData) { flash(marketRows[i]); }
			}
			var renderRows = function() {
				for (var i = 0, l = dataArray.length; i < l; i++) {
					renderRow(i, dataArray[i]);
				}
			}
			var eventListeners = function() {
				marketRows[0].parentElement
					.addEventListener('click', function(e){that.switchMarketPair(e)}, false);
				document.getElementById("market-index-row-wrapper")
					.addEventListener('click', function(e){that.switchSorting(e)}, false);
			}
			
			renderRows();
			eventListeners();
		},
		switchMarketPair: function(e) {
			if (exchange.currentMarketPair === e.target.id || exchange.currentMarketPair === e.target.parentElement.id) return;
			if (e.target.id.split("_")[1]) {
				var target = e.target;
			} else if (e.target.parentElement.id.split("_")[1]) {
				var target = e.target.parentElement;
			} else {
				return;
			}
			var marketPair = target.id;
			
			exchange.colorMood.clearSelectedMarketRow();
			
			exchange.marketList.selectedMarketEl.classList.remove("market-row-selected");
			target.classList.add("market-row-selected");
			exchange.marketList.selectedMarketEl = target;
			exchange.tradingUtils.emptyFields("sell");
			exchange.tradingUtils.emptyFields("buy");
			exchange.marketPair.changeTo(marketPair);
		},
		render: function(data) {
			this.renderMarketList(this.BTC, "BTC", "global");
			this.renderMarketList(this.USD, "USD", "global");
			this.renderMarketList(this.BTC, "BTC", "local");
		},
		clear: function() {
			//clear marketList
		},
		update: function(d) {
			var t = this;
			/* function makeOld() {
				
			}
			function assignNew() {
				
			}
			function checkIfChanged() {
				if (t.oldBTC.length !== t.BTC.length) {
					t.clear();
				}
			}
			function updateMarketLists() {
				
			} */
			t.oldGlobalBTC = t.globalBTC;
			t.oldGlobalUSD = t.globalUSD;
			t.oldLocalBTC = t.localBTC;
			t.globalBTC = t.filterMarkets(d.BTC, "global");
			t.globalUSD = t.filterMarkets(d.USD, "global");
			t.localBTC = t.filterMarkets(d.BTC, "local");
			t.updateMarketList(t.globalBTC, "BTC", "global");
			t.updateMarketList(t.globalUSD, "USD", "global");
			t.updateMarketList(t.localBTC, "BTC", "local");
		}
	}
	
	// #tradeHistory #trades
	
	this.tradeHistory = {
		historyData: null,
		historyRowNodeList: document.getElementsByClassName("trade-history-row"),
		loadAnimation: exLib.animation.create(document.getElementById("trade-history-load-overlay")),
		renderHistory: function() {
			var historyData = this.historyData;
			var nodeList = this.historyRowNodeList;
			var createRowElement = function(parentEl){
				var clone = nodeList[0].cloneNode(true);
				parentEl.appendChild(clone);
			}
			var createRowElements = function() {
				var parentEl = document.getElementById("trade-history-orders");
				for (var i = 0; i < historyData.length; i++) {
					createRowElement(parentEl);
				}
			}
			var updateRowContent = function(i) {
				var parentEl = nodeList[i];
				var time = parentEl.firstElementChild;
				var price = time.nextElementSibling;
				var amountPrimary = price.nextElementSibling;
				var amountSecondary = amountPrimary.nextElementSibling;
				
				var date = new Date(historyData[i].OrderTime);
				
				var month = date.getMonth() + 1;
				month = month.toString().length === 2 ? month : "0" + month;
				
				var day = date.getDate() ;
				day = day.toString().length === 2 ? day : "0" + day;
				
				var hour = date.getHours();
				hour = hour.toString().length === 2 ? hour : "0" + hour;
				
				var minute = date.getMinutes();
				minute = minute.toString().length === 2 ? minute : "0" + minute;
				
				time.textContent = date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute;
				price.textContent = parseFloat(historyData[i].Price).toFixed(8);
				price.className += " trade-history-" + redOrGreen(historyData[i]) + "-text ";
				amountPrimary.textContent = parseFloat(historyData[i].Amount).toFixed(8);
				amountSecondary.textContent = parseFloat(historyData[i].BaseAmount).toFixed(8);
			}
			var formatDate = function(string) {
				string = string.substr(2, string.length - 5);// why does 5 work? shouldn't it be 2 or 3?
				return string;
			}
			var redOrGreen = function(row) {
				if (row.Type === "Sell") {
					var color = "red";
				} else {
					var color = "green";
				}
				return color;
			}
			var updateRowContents = function() {
				for (var i = 0; i < historyData.length; i++) {
					updateRowContent(i);
				}
			}
			createRowElements();
			updateRowContents();
		},
		clear: function() {
			var tradeHistoryEl = document.getElementById("trade-history-orders");
			var tradeRowIndex = document.getElementById("trade-history-orders-index").cloneNode(true);
			var tradeRow = document.getElementsByClassName("trade-history-row")[0].cloneNode(true);
			var dateEl = tradeRow.firstElementChild;
			var priceEl = dateEl.nextElementSibling;
			var amountPrimaryEl = priceEl.nextElementSibling;
			var amountSecondaryEl = amountPrimaryEl.nextElementSibling;
			
			dateEl.textContent = "";
			priceEl.textContent = "";
			priceEl.className = priceEl.className.split(" trade-history-red-text ", 1)[0];
			priceEl.className = priceEl.className.split(" trade-history-green-text ", 1)[0];
			amountPrimaryEl.textContent = "";
			amountSecondaryEl.textContent = "";
			
			tradeHistoryEl.innerHTML = "";
			tradeHistoryEl.appendChild(tradeRowIndex);
			tradeHistoryEl.appendChild(tradeRow);
		},
		render: function() {
			if (exchange.tradeHistory.historyRowNodeList[0].firstElementChild.textContent) {
				exchange.tradeHistory.clear();
			}
			this.renderHistory();
			this.loadAnimation.toggle(false);
		},
		update: function(d) {
			this.historyData = d;
			this.render();
		}
	}
	
	// #my #personal
	
	this.my = {
		tradeHistory: {
			historyRowNodeList: document.getElementsByClassName("my-trade-history-row"),
			loadAnimation: exLib.animation.create(document.getElementById("trade-history-load-overlay")),
			render: function(d) {
				this.historyData = d;
				if (d.length === 0) {return;}
				var historyData = d;
				var nodeList = this.historyRowNodeList;
				nodeList[0].style.display = "flex";
				var createRowElement = function(parentEl){
					var clone = nodeList[0].cloneNode(true);
					parentEl.appendChild(clone);
				}
				var createRowElements = function() {
					var parentEl = document.getElementById("my-trade-history-orders");
					for (var i = 0; i < historyData.length - 1; i++) {
						createRowElement(parentEl);
					}
				}
				var updateRowContent = function(i) {
					var parentEl = nodeList[i];
					var time = parentEl.firstElementChild;
					var price = time.nextElementSibling;
					var amountPrimary = price.nextElementSibling;
					var amountSecondary = amountPrimary.nextElementSibling;
					
					time.textContent = formatDate(historyData[i].Time);
					price.textContent = historyData[i].Price;
					price.className += " trade-history-" + redOrGreen(historyData[i]) + "-text ";
					amountPrimary.textContent = parseFloat(historyData[i].Amount).toFixed(8);
					amountSecondary.textContent = parseFloat(historyData[i].TradeTotal).toFixed(8);
				}
				var formatDate = function(unixTime) {
					var string = exLib.string.formatUnixDate(unixTime * 1000, false, false);
					return string;
				}
				var redOrGreen = function(row) {
					if (row.Type === "Sell") {
						var color = "red";
					} else {
						var color = "green";
					}
					return color;
				}
				var updateRowContents = function() {
					for (var i = 0; i < historyData.length; i++) {
						updateRowContent(i);
					}
				}
				createRowElements();
				updateRowContents();
			},
			clear: function() {
				var tradeHistoryEl = document.getElementById("my-trade-history-orders");
				var tradeRowIndex = document.getElementById("my-trade-history-orders-index").cloneNode(true);
				var tradeRow = document.getElementsByClassName("my-trade-history-row")[0].cloneNode(true);
				var priceEl = tradeRow.firstElementChild.nextElementSibling;
				tradeRow.style.display = "none";
				
				priceEl.className = priceEl.className.split(" trade-history-red-text ", 1)[0];
				priceEl.className = priceEl.className.split(" trade-history-green-text ", 1)[0];
				tradeHistoryEl.innerHTML = "";
				tradeHistoryEl.appendChild(tradeRowIndex);
				tradeHistoryEl.appendChild(tradeRow);
			},
			update: function(d) {
				this.clear();
				this.render(d);
			}
		},
		orders: {
			render: function(d) {
				this.data = d;
				var t = this;
				var nodeList = document.getElementsByClassName("trade-my-open-orders-row");
				function templates() {
					var parentEl = document.getElementById("trade-my-open-orders");
					var template = nodeList[0];
					var clone;
					for (var i = 0; i < d.length - 1; i++) {
						if (d[i].Pair !== exchange.currentMarketPair) {continue;}
						clone = template.cloneNode(true);
						parentEl.appendChild(clone);
					}
				}
				function row(i, k) {
					nodeList[k].style.display = "flex";
					var cancel = nodeList[k].firstElementChild.firstElementChild
					var type = cancel.nextElementSibling;
					var price = type.nextElementSibling;
					var amount = price.nextElementSibling;
					var total = amount.nextElementSibling;
					var time = total.nextElementSibling;
					
					var coin1 = d[i].Pair.split("_")[0];
					var coin2 = d[i].Pair.split("_")[1];
					
					type.classList.remove("trade-my-open-orders-type-buy");
					type.classList.remove("trade-my-open-orders-type-sell");
					type.classList.add("trade-my-open-orders-type-" + d[i].Type.toLowerCase())
					type.textContent = d[i].Type;
					price.textContent = d[i].Price + " " + coin2;
					amount.textContent = d[i].Amount + " " + coin1;
					cancel.id = d[i].TradeId;
					time.textContent = exLib.string.shortDate(d[i].Time);
					total.textContent = parseFloat(d[i].Price * d[i].Amount).toFixed(8) + " " + coin2;
				}
				function rows() {
					for (var i = 0, k = 0; i < d.length; i++, k++) {
						if (d[i].Pair !== exchange.currentMarketPair) {k--; continue;}
						document.getElementById("trade-my-open-orders-no-orders-message").style.display = "none";
						row(i, k);
					}
				}
				templates();
				rows();
			},
			cancel: function(e, t) {
				if (e.target.className.indexOf("trade-my-open-orders-cancel") === -1) {return;}
				exchange.tradeOrders.loadAnimation.toggle(true);
				var data = "OrderId=" + e.target.id;
				var xhr = exLib.ajax.newXhr("cancelOrder");
				exLib.ajax.postData(xhr, "https://alcurex.com/exchange/ordercancel", data, t.verifyCancel);
			},
			verifyCancel: function(xhr) {
				function cancelSuccessful() {
				}
				var d = JSON.parse(xhr.responseText);
				if (d.Status === "SUCCESS") {
					cancelSuccessful();
				}
				exchange.tradeOrders.loadAnimation.toggle(false);
			},
			activate: function() {
				var t = this;
				document.getElementById("trade-my-open-orders")
				.addEventListener('click', function(e){t.cancel(e, t)}, false);
			},
			clear: function() {
				var template = document.getElementsByClassName("trade-my-open-orders-row")[0].cloneNode(true);
				var message = document.getElementById("trade-my-open-orders-no-orders-message").cloneNode(true);
				var parentEl = document.getElementById("trade-my-open-orders");
				template.style.display = "none";
				message.style.display = "block";
				parentEl.innerHTML = "";
				parentEl.appendChild(template);
				parentEl.appendChild(message);
			},
			update: function(d) {
				if (typeof profile !== "undefined") {
					if (profile.status.loggedIn === false) {return;}
				}
				this.clear();
				this.render(d);
			}
		}
	}
	
	// #notifications #notifs #notification #popups #popup
	
	this.notifications = {
		notifId: 0,
		removeNotif: function(e) {
			function check(el) {
				if (el.className.indexOf("notification-window") === -1) {
					return false;
				} else {
					return true;
				}
			}
			function target() {
				if (check(e.target)) {
					target = e.target;
				} else if (check(e.target.parentElement)) {
					target = e.target.parentElement;
				} else if (check(e.target.parentElement.parentElement)) {
					target = e.target.parentElement.parentElement;
				} else if (check(e.target.parentElement.parentElement.parentElement)) {
					target = e.target.parentElement.parentElement.parentElement;
				} else {
					return false;
				}
				return true;
			}
			if (!target()) {return;}
			document.getElementById("notification-messages-wrapper").removeChild(target);
			if (exchange.title.alerted === true) {
				exchange.title.toggleAlert();
			}
		},
		add: function(data) {
			function createNotif(d) {
				function defineMessage(market, messageType) {
					var msg;
					switch (messageType) {
						case "BuyOpen":
							msg = market + " Buy order opened.";
							break;
						case "SellOpen":
							msg = market + " Sell order opened.";
							break;
						case "BuyTrade":
							msg = market + " Buy trade processed.";
							break;
						case "SellTrade":
							msg = market + " Sell trade processed.";
							break;
						case "BuyCancel":
							msg = market + " Buy order canceled.";
							break;
						case "SellCancel":
							msg = market + " Sell order canceled.";
							break;
						case "Deposit":
							msg = market + " Deposit processed.";
							break;
						case "WithdrawCancel":
							msg = market + " Withdraw cancelled.";
							break;
						case "WithdrawProcessed":
							msg = market + " Withdraw processed.";
							break;
						case "SupportChat":
							msg = "New reply to your live support messages.";
							break;
						default:
							msg = messageType;
					}
					return msg;
				}
				function defineCoin() {
					if (d.Type === "BuyCancel") {
						return d.Market.split("_")[1];
					} else {
						return d.Market.split("_")[0];
					}
				}
				function addValues() {
					function handlePrice() {
						if (notifType === "tx") {
							notifWindow.lastElementChild.removeChild(price.parentElement);
						} else if (notifType === "order") {
							price.textContent = d.Price + " " + d.Market.split("_")[0];
						} else if (notifType === "msg") {
							notifWindow.lastElementChild.removeChild(price.parentElement);
							notifWindow.lastElementChild.removeChild(amount.parentElement);
						}
					}
					var msg = notifWindow.firstElementChild;
					var price = msg.nextElementSibling.firstElementChild.lastElementChild;
					var amount = msg.nextElementSibling.lastElementChild.lastElementChild;
					
					msg.textContent = defineMessage(d.Market, d.Type);
					handlePrice();
					amount.textContent = d.Amount + " " + defineCoin();
				}
				function cloneTemplate(template, parentEl) {
					var clone = template.cloneNode(true);
					parentEl.appendChild(clone);
					return clone;
				}
				function createNotifElement() {
					var parentEl = document.getElementById("notification-messages-wrapper");
					var template = document.getElementsByClassName("notification-window")[0];
					notifWindow = cloneTemplate(template, parentEl);
					notifWindow.style.display = "block";
					notifWindow.id = "notif" + t.notifId;
					t.notifId++;
				}
				function defineNotifType() {
					if (d.Type.indexOf("Sell") !== -1 && d.Type.indexOf("Buy") !== -1) {
						notifType = "order";
					} else if (d.Type.indexOf("Support") !== -1) {
						notifType = "msg";
					} else {
						notifType = "tx";
					}
				}
				var notifType;
				var notifWindow;
				defineNotifType();
				createNotifElement();
				addValues();
			}
			function createNotifs() {
				for (var i = 0; i < data.length; i++) {
					createNotif(data[i]);
				}
			}
			var t = this;
			createNotifs();
		},
		update: function(d) {
			if (d.length > 0) {
				if (exchange.title.alerted === false) {
					exchange.title.toggleAlert();
				}
				this.add(d);
			}
		},
		activate: function() {
			var t = this;
			document.getElementById("notification-messages-wrapper")
			.addEventListener('click', function(e){t.removeNotif(e)}, false);
		}
	}
	
	// #infoPopUpPage #infoPopUp #infoPage #info
	
	this.infoPopUpPage = {
		switchMenu: function() {
		var triggerElement = document.getElementById("alcurex-info-popup-page-menu");
		var buttonNodeList = document.getElementsByClassName("alcurex-info-popup-page-menu-button");
		var moduleNodeList = document.getElementsByClassName("alcurex-info-popup-page-switch-module");
		var menu = exLib.menu.newSwitchMenu(buttonNodeList, triggerElement, moduleNodeList, 0, "flex");
		menu.selectedButtonStyleClass = " alcurex-info-popup-page-menu-button-toggled ";
		return menu;
		},
		popUpWindow: function() {
			var windowEl = document.getElementById("alcurex-info-popup-page-wrapper");
			var closeButton = document.getElementById("alcurex-info-popup-page-close-button");
			var bgOverlay = document.getElementById("gray-background-overlay");
			var win = exLib.popUp.newPopUpWindow(windowEl, closeButton, bgOverlay, "inline-flex");
			return win;
		},
		openOnTab: function(num) {
			var t = this;
			t.switchMenu.switchTo(num, t.switchMenu);
			t.popUpWindow.open("", t.popUpWindow);
		},
		activate: function() {
			function switchMenus() {
				t.switchMenu = t.switchMenu();
				t.switchMenu.activate();
			}
			function popUpWindow() {
				t.popUpWindow = t.popUpWindow();
				t.popUpWindow.activate();
			}
			function events() {
				document.getElementById("alcurex-btc-market-link")
				.addEventListener('click', function() {
					var e = {};
					e.target = document.getElementById("ALCUREX_BTC");
					exchange.marketList.switchMarketPair(e);
				});
				document.getElementById("header-menu-alcurex-info")
				.addEventListener('click', function() {t.openOnTab(0)});
				document.getElementById("price-chart-global-label")
				.addEventListener('click', function() {t.openOnTab(2)});
			}
			var t = this;
			switchMenus();
			popUpWindow();
			events();
		}
	}
	
	// #footer #footerMenu
	
	this.footer = {
		timerEl: document.getElementById("exchange-footer-counter-number"),
		dotsEl: document.getElementById("exchange-footer-counter-dots"),
		timerPaused: false,
		timer: function() {
			if (exchange.footer.timerPaused) { setTimeout(exchange.footer.timer, 1000); return; }
			var num = parseInt(exchange.footer.timerEl.textContent) + 1;
			exchange.footer.timerEl.textContent = num;
			exchange.footer.dotsEl.textContent += ".";
			setTimeout(exchange.footer.timer, 1000);
		},
		updateInfo: function(d) {
			this.data = d;
			function weeklyVolumes() {
				document.getElementById("exchange-footer-weekly-volume-btc")
				.textContent = parseFloat(d.WBTC).toFixed(3);
				document.getElementById("exchange-footer-weekly-volume-usd")
				.textContent = parseFloat(d.WUSD).toFixed(2);
				/* document.getElementById("exchange-footer-weekly-volume-ltc")
				.textContent = parseFloat(d.WLTC).toFixed(2);
				document.getElementById("exchange-footer-weekly-volume-mrc")
				.textContent = Math.round(parseFloat(d.WMRC)); */
			}
			function userCount() {
				document.getElementById("exchange-footer-users-number")
				.textContent = d.Users;
			}
			function serverTime() {
				document.getElementById("exchange-footer-users-server-time-number")
				.textContent = d.ServerTime;
			}
			weeklyVolumes();
			userCount();
			serverTime();
		}
	}
	
	// #resolutionUtils #resolution
	
	this.resolutionUtils = {
		rightPadding: (function() {
			var px = Math.max(380, window.innerWidth * 0.25 * 0.99);
			return px;
		}()),
		screenWidthLimit: 1720,
		screenHeightLimit: 790
	}
	
	// #removeEventListeners #removeEvents #removeListeners #clearEvents #clearEventListeners #clearListeners
	
	this.removeEventListeners = function() {	// optimize this, create list of current events so that they can be toggled on and off
		var eraseWrapperEventListeners = function() {
			var body = document.getElementById("body");
			var clone = jMood.htmlWrapper.cloneNode(true);
			body.removeChild(jMood.htmlWrapper);
			body.appendChild(clone);
		}
		this.resolutionUtils.disableEventListeners();
		eraseWrapperEventListeners();
	}
	
	// #renderMarketPair #renderPair
	
	this.renderMarketPair = function() {//move to exchange.marketPair.render
		this.ajaxUtils.fetchMarketData(exchange.currentMarketPair, "All", 1, 1, 1, 1, 1, "marketData");
	}
	
	// #update
	
	this.update = function(marketsAllOrNone, chart01, chat01, support01, news01, personalData01, reDirTag, callback) {
		this.ajaxUtils.fetchUpdateData(this.currentMarketPair, marketsAllOrNone, chart01, chat01, support01, news01, personalData01, reDirTag, callback);
	}
	
	// #updateTimer #timer
	
	this.updateTimer = function() {
		var t = exchange;
		
		t.footer.timerEl.textContent = 0;
		t.footer.dotsEl.textContent = "";
		t.footer.timerPaused = true;
		
		var interval = 3;
		var chart01 = 0;
		var news01 = 0;
		
		if (t.chartTimer >= exchange.chart.candleTime / 5 * 60 / interval) {//update on every fifth of candleTime length: 5 times per candle;
			chart01 = 1;
			t.chartTimer = 0;
		} else {
			t.chartTimer++;
		}
		if (t.news.updateTimer >= 15 * 60 / interval) {//update every 15 minutes
			news01 = 1;
			t.news.updateTimer = 0;
		} else {
			t.news.updateTimer++;
		}
		
		t.update("All", chart01, 1, 1, news01, 1, "updateData", function() {
			setTimeout(t.updateTimer, interval * 1000);
			t.footer.timerPaused = false;
		});
	}
	
	// #main #index
	
	this.main = function() {
		this.renderMarketPair();
		this.footer.timer();
		
		this.moduleMenuUtils.activateMenus();
		this.tradingArea.activateMenus();
		this.chatbox.activate();
		this.support.activate();
		this.marketPair.activatePopUpWindow();
		this.tradingUtils.activate();
		this.notifications.activate();
		this.infoPopUpPage.activate();
		this.my.orders.activate();
		this.headerMenu.activate();
	}
}

exchange = new Exchange();