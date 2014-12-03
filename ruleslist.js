getRule = function() {
	return rulesList[0];
}
Rule = function(rulebreak, sublist) {
	this.rulebreak = rulebreak;
	this.sublist = sublist;
}
rulesList = [
	new Rule(function(event, player) { return true; }, ['jump']),
]