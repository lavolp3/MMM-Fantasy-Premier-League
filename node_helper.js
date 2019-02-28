/* Magic Mirror
 * Node Helper: MMM-Fantasy-Premier-League
 *
 * By Wuz0ink
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({

	start: function() {
		console.log("Starting node_helper for module: " + this.name);
		
		this.started = false;
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "MMM-Fantasy-Premier-League-CONFIG" && this.started == false) {
			console.log("Working notification system. Notification:", notification, "payload: ", payload);
			this.config = payload;
			this.started = true;
			this.getData();
		}
	},

	getData: function() {
		var self = this;


		console.log('Fetching league data for module: ' + this.name);
		//Clearing league list
		this.leagues = [];

		for(l in this.config.leagueIds){
			// url used to get league and team details
			var url = "https://fantasy.premierleague.com/drf/leagues-classic-standings/" + this.config.leagueIds[l].id;

			fetch(url)
				.then(function(response){
					return response.json();
				}).then(function(json){
					self.processLeague(json);
				}).catch(function(err){
					console.log(self.name + " : " + err);
					self.scheduleUpdate();
				});
		}

		// url used to get Gameweek details
		url = "https://fantasy.premierleague.com/drf/events";

		fetch(url)
			.then(function(response){
				return response.json();
			}).then(function(json){
				self.processGameweek(json);
			}).catch(function(err){
				console.log(self.name + " : " + err);
				self.scheduleUpdate();
			});

	},

	processGameweek: function(data){
		var gameWeek = [];

		for(gw in data){
			if(data[gw].is_current){
				var name = data[gw].id;
				var finished = data[gw].finished;
				gameWeek.push({
					name: name,
					finished: finished
				});
			}
		}
		this.displayAndSchedule("gameweek", gameWeek);
	},

	processLeague: function(data) {

		var leagueTeams = [];
		var leagueName = data.league.name;
		leagueName = this.truncate(leagueName);

		var leagueId = data.league.id;
		
		for(team in data.standings.results){
			var playerId = data.standings.results[team].id;
			var teamName = data.standings.results[team].entry_name;
			teamName = this.truncate(teamName);

			var playerName = data.standings.results[team].player_name;
			playerName = this.truncate(playerName);
			
			var rank = data.standings.results[team].rank;
			var totalPoints = data.standings.results[team].total;
			var gwPoints = data.standings.results[team].event_total;

			leagueTeams.push({
				playerId: playerId,
				teamName: teamName,
				playerName: playerName,
				rank: rank,
				totalPoints: totalPoints,
				gwPoints: gwPoints,
			});
		}

		this.leagues.push({
			leagueId: leagueId,
			leagueName: leagueName,
			leagueTeams: leagueTeams
		});

		this.displayAndSchedule("league", this.leagues);
	},

	truncate: function(data){

		if (this.config.truncateAfter > 0) {
			if (data.indexOf(" ",this.config.truncateAfter) > 0)  {
					data = data.substring(0, data.indexOf(" ",this.config.truncateAfter));
			}
		}

		return data;
	},

	displayAndSchedule: function(notification, payload){

		if(notification == "league" && payload.length > 0){
			this.sendSocketNotification("MMM-Fantasy-Premier-League-LEAGUE", payload);
		}

		if(notification == "gameweek" && payload.length > 0){
			this.sendSocketNotification("MMM-Fantasy-Premier-League-GAMEWEEK", payload);
		}
		this.scheduleUpdate();
	},

	scheduleUpdate: function() {
		var self = this;
		var nextLoad = this.config.updateInterval;

		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.getData();
		}, nextLoad);
	}
});
