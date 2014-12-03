getRule = function() {
	return rulesList[0];
}
Rule = function(rulebreak, sublist, flavortext) {
	this.rulebreak = rulebreak;
	this.sublist = sublist;
	this.flavortext = flavortext;
}
rulesList = [
	new Rule(function(event, player) { return true; }, ['jump'], "Don't Jump!"),
]