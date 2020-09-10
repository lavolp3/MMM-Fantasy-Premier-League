/* Magic Mirror
 * Node Helper: MMM-Fantasy-Premier-League
 *
 * By Wuz0ink
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const fetch = require("node-fetch");
const axios = require('axios');


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
			this.login();
			
			//this.getData();
		}
	},


	login: function(){
		var self = this;

		console.log('Fetching accesstoken!');

		var url = 'https://users.premierleague.com/accounts/login/';
		var params = "password=" + this.password + "&login=" + this.username + "&redirect_uri=https://fantasy.premierleague.com/a/login&app=plfpl-web"

		fetch(url, {
			method: 'post',
			credentials:'include',
			body: params,
		    headers: {
		        "Content-Type": "application/x-www-form-urlencoded",
		    },
		}).then(function(response){
			return response.headers.raw()['Set-Cookie'];
		}).then(function(response){
			self.getleagueData();
		}).catch(function(err){
			console.log(self.name + " : login : " + err);
			self.scheduleUpdate();
		});


	},

	logout: function(){

		console.log('Logout');
		var self = this;


		var url = 'https://users.premierleague.com/accounts/logout/?app=plfpl-web&redirect_uri=https://fantasy.premierleague.com/';

		fetch(url)
			.then(function(response){
				console.log('Logout response code: ' + response.status);
				return response;
			}).then(function(response){
				self.login();
			}).catch(function(err){
				console.log(self.name + " : logout : " + err);
				self.scheduleUpdate();
			});
	},

	getleagueData: function() {
		var self = this;

		console.log('Fetching league data for module: ' + this.name);
		//Clearing league list
		this.leagues = [];

		for(l in this.config.leagueIds){
			// url used to get league and team details
			//var url = "https://fantasy.premierleague.com/drf/leagues-classic-standings/" + this.config.leagueIds[l].id;
			var url = 'https://fantasy.premierleague.com/api/leagues-classic/' + this.config.leagueIds[l].id + '/standings';


			axios.get(url)
				.then(function(response){
					console.log('getleagueData response code: ' + response.status);
					if(response.status == 200){
						self.processLeague(response.data);
					    	self.getEventData();
					}else if(response.status == 403){
						self.logout();
						throw new Error;
                    			}
				}).catch(function(err){
					console.log(self.name + " : getleagueData : " + err);
					self.logout();
					self.scheduleUpdate();
				});
		}

	},

	getEventData: function(){
		// url used to get Gameweek details
		//url = "https://fantasy.premierleague.com/drf/events";
		var self = this;

		url = 'https://fantasy.premierleague.com/api/bootstrap-static/';
		console.log('Fetching events for module: ' + this.name);

		axios.get(url)
			.then(function(response){
				self.processGameweek(response.data);
			}).catch(function(err){
				console.log(self.name + " : getEventData : " + err);
				self.scheduleUpdate();
			});

	},


	processGameweek: function(data){
		var gameWeek = [];

		for(gw in data.events){
			if(data.events[gw].is_current){
				var name = data.events[gw].id;
				var finished = data.events[gw].finished;
				gameWeek.push({
					name: name,
					finished: finished
				});
			}
		}
		this.displayAndSchedule("gameweek", gameWeek);
	},


	processLeague: function(data) {

		console.log("Processing league data...");
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
			console.log("Sending league data to Client: " + JSON.stringify(payload));
			this.sendSocketNotification("MMM-Fantasy-Premier-League-LEAGUE", payload);
		}

		if(notification == "gameweek" && payload.length > 0){
			console.log("Sending gameweek data to Client: " + JSON.stringify(payload));
			this.sendSocketNotification("MMM-Fantasy-Premier-League-GAMEWEEK", payload);
		}
		this.scheduleUpdate();
	},

	scheduleUpdate: function() {
		var self = this;
		var nextLoad = this.config.updateInterval;

		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.login();
		}, nextLoad);
	}
});
