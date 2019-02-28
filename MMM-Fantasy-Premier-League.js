/* global Module */

/* Magic Mirror
 * Module: MMM-Fantasy-Premier-League
 *
 * By Wuz0ink
 * MIT Licensed.
 */


Module.register("MMM-Fantasy-Premier-League", {
	defaults: {
		updateInterval: 21600000, // Every 6 hours
		leagueIds: [
			{id: 313}, // Overall
			{id: 226}  // Sweden
		],
		maxTeams: 10,
		showTeamName: true,
		showPlayerName: false,
		showPlayerRank: false,
		showTotalPoints: true,
		showGwPoints: true,
		gameWeekLabel: "Gameweek",
		showGameWeek: true,
		truncateAfter: 5
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		Log.info("Starting module: " + this.name);

		var self = this;
		this.leagues = [];
		this.gameWeek = [];

		this.startup = true;

		//Flag for check if module is loaded
		this.leaguesLoaded = false;
		this.gameWeekLoaded = false;

		this.sendSocketNotification("MMM-Fantasy-Premier-League-CONFIG", this.config);
	},

	getStyles: function () {
		return [
			"MMM-Fantasy-Premier-League.css",
		];
	},

	scheduleUpdate: function() {
		var self = this;
		var nextLoad = 3600000;  //Once every hour

		if(this.startup){
			console.log("Init FPL");
			nextLoad = 10000;
			this.startup = false;
		}
		
		setTimeout(function() {
			self.updateDom();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		var wrapper = document.createElement("div");
		
		if (this.config.leagueIds.length === 0) {
			wrapper.innerHTML = "Please set at least one leagueId to use: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.leaguesLoaded || !this.gameWeekLoaded) {
			wrapper.innerHTML = "Fetching league ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if(this.config.showGameWeek){
			//GameWeek
			var table = document.createElement("table");
			table.className = "small table";
			wrapper.appendChild(table);

			var row = document.createElement("tr");
			table.appendChild(row);

			var gameWeekText = document.createElement("td");
			gameWeekText.innerHTML = this.config.gameWeekLabel;
			gameWeekText.className = "FPL-td-th light gw";
			row.appendChild(gameWeekText);

			var gameWeekName = document.createElement("td");
			if(this.gameWeek[0].finished){
				gameWeekName.className = "GameWeek-done light";
			}else{
				gameWeekName.className = "GameWeek-not-done light";
			}
			
			gameWeekName.innerHTML = this.gameWeek[0].name;
			row.appendChild(gameWeekName);
		}

		var table = document.createElement("table");
			table.className = "small table";
			wrapper.appendChild(table);

		for(l in this.leagues){

			var row = document.createElement("tr");
			table.appendChild(row);

			var leagueName = document.createElement("th");
			leagueName.className = "FPL-td-th bold";
			leagueName.innerHTML = this.leagues[l].leagueName;
			row.appendChild(leagueName);

			var row = document.createElement("tr");
			table.appendChild(row);

			if(this.config.showPlayerRank){
				var headerRank = document.createElement("th");
				headerRank.className = "FPL-td-th light";
				headerRank.innerHTML = "Rank";
				row.appendChild(headerRank);
			}

			if(this.config.showPlayerName){
				var headerName = document.createElement("th");
				headerName.className = "FPL-td-th light";
				headerName.innerHTML = "Name";
				row.appendChild(headerName);
			}

			if(this.config.showTeamName){
				var headerTeam = document.createElement("th");
				headerTeam.className = "FPL-td-th light";
				headerTeam.innerHTML = "Team";
				row.appendChild(headerTeam);
			}

			if(this.config.showGwPoints){
				var headerGameweekPoints= document.createElement("th");
				headerGameweekPoints.className = "FPL-td-th light";
				headerGameweekPoints.innerHTML = "GW";
				row.appendChild(headerGameweekPoints);
			}

			if(this.config.showTotalPoints){
				var headerTotalPoints = document.createElement("th");
				headerTotalPoints.className = "FPL-td-th light";
				headerTotalPoints.innerHTML = "Total";
				row.appendChild(headerTotalPoints);
			}

			if(this.leagues[l].leagueTeams.length > this.config.maxTeams){

				for(let p = 0; p < this.config.maxTeams; p++){
					var row = document.createElement("tr");
					table.appendChild(row);

					if(this.config.showPlayerRank){
						var playerRank = document.createElement("td");
						playerRank.className = "FPL-left-boarder FPL";
						playerRank.innerHTML = this.leagues[l].leagueTeams[p].rank;
						row.appendChild(playerRank);
					}

					if(this.config.showPlayerName){
						var playerName = document.createElement("td");
						playerName.className = "FPL";
						if(!this.config.showPlayerRank){
							playerName.className = "FPL-left-boarder FPL bright";
						}
						playerName.innerHTML = this.leagues[l].leagueTeams[p].playerName;
						row.appendChild(playerName);
					}

					if(this.config.showTeamName){
						var teamName = document.createElement("td");
						teamName.className = "FPL linetype";
						if(!this.config.showPlayerName && !this.config.showPlayerRank){
							teamName.className = "FPL-left-boarder FPL bright";
						}
						teamName.innerHTML = this.leagues[l].leagueTeams[p].teamName;
						row.appendChild(teamName);
					}

					if(this.config.showGwPoints){
						var gwPoints = document.createElement("td");
						gwPoints.className = "FPL light";
						gwPoints.innerHTML = this.leagues[l].leagueTeams[p].gwPoints;
						row.appendChild(gwPoints);
					}

					if(this.config.showTotalPoints){
						var totalPoints = document.createElement("td");
						totalPoints.className = "FPL-points light";
						totalPoints.innerHTML = this.leagues[l].leagueTeams[p].totalPoints;
						row.appendChild(totalPoints);
					}

				}
			}else{

				for(p in this.leagues[l].leagueTeams){
					var row = document.createElement("tr");
					table.appendChild(row);

					if(this.config.showPlayerRank){
						var playerRank = document.createElement("td");
						playerRank.className = "FPL-left-boarder FPL";
						playerRank.innerHTML = this.leagues[l].leagueTeams[p].rank;
						row.appendChild(playerRank);
					}

					if(this.config.showPlayerName){
						var playerName = document.createElement("td");
						playerName.className = "FPL";
						if(!this.config.showPlayerRank){
							playerName.className = "FPL-left-boarder FPL bright";
						}
						playerName.innerHTML = this.leagues[l].leagueTeams[p].playerName;
						row.appendChild(playerName);
					}

					if(this.config.showTeamName){
						var teamName = document.createElement("td");
						teamName.className = "FPL linetype";
						if(!this.config.showPlayerName && !this.config.showPlayerRank){
							teamName.className = "FPL-left-boarder FPL bright";
						}
						teamName.innerHTML = this.leagues[l].leagueTeams[p].teamName;
						row.appendChild(teamName);
					}

					if(this.config.showGwPoints){
						var gwPoints = document.createElement("td");
						gwPoints.className = "FPL light";
						gwPoints.innerHTML = this.leagues[l].leagueTeams[p].gwPoints;
						row.appendChild(gwPoints);
					}

					if(this.config.showTotalPoints){
						var totalPoints = document.createElement("td");
						totalPoints.className = "FPL-points light";
						totalPoints.innerHTML = this.leagues[l].leagueTeams[p].totalPoints;
						row.appendChild(totalPoints);
					}
				}
			}

		}


		return wrapper;
	},

	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-Fantasy-Premier-League-LEAGUE") {
			this.leagues = payload;
			this.leaguesLoaded = true;
			if(this.gameWeekLoaded){
				this.scheduleUpdate();
			}
			
		}

		if(notification === "MMM-Fantasy-Premier-League-GAMEWEEK") {
			this.gameWeek = payload;
			this.gameWeekLoaded = true;
			if(this.leaguesLoaded){
				this.scheduleUpdate();
			}
		}
	},
});
