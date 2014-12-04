Rule = function(rulebreak, sublist, flavortext, gracePeriod) {
	this.rulebreak = rulebreak;
	this.sublist = sublist;
	this.flavortext = flavortext;
	this.gracePeriod = gracePeriod;
}
rulesList = [
	new Rule(function(event, player) { return true; }, ['jump'], "Don't Jump!"),
]
getRule = function() {
	return rulesList[Math.floor(Math.random()*(rulesList.length))];
}

