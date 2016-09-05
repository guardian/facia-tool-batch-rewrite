var FaciaTool = require('aws-s3-facia-tool');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

var tool = new FaciaTool({
    'bucket': 'aws-frontend-store',
    'env': 'DEV',
    'configKey': 'frontsapi/config/config.json'
});

var collectionIds = [
	'a',
	'b',
	'c'
];

var collectionsThatChanged = [];
var frontsThatChanged = [];

tool.fetchConfig()
.then(writeToDisk('original/config.json'))
.then(brandCollections)
.then(writeToDisk('transformed/config.json'))
.then(summary)
.catch(console.error);

function writeToDisk (destination) {
	return function (config) {
		var fullDestination = path.join(__dirname, 'tmp', destination);
		mkdirp.sync(path.dirname(fullDestination));
		fs.writeFileSync(fullDestination, JSON.stringify(config.json, null, '\t'), 'utf-8');

		return config;
	};
}

function brandCollections (config) {
	return {
		json: Object.assign({}, config.json, rewrite(config.json.collections))
	};
}

function rewrite (collections) {
	var rewritten = {};
	for (var id in collections) {
		rewritten[id] = Object.assign({}, collections[id]);
		if (convertFromTo[rewritten[id].type]) {
			rewritten[id].type = convertFromTo[rewritten[id].type];
			collectionsThatChanged.push(id);
		}
	}
	return {
		collections: rewritten
	};
}

function summary (config) {
	for (var frontId in config.json.fronts) {
		var front = config.json.fronts[frontId];
		if (_.intersection(front.collections, collectionsThatChanged).length > 0) {
			frontsThatChanged.push(frontId);
		}
	}

	console.log('I\'ve rewritten ' + collectionsThatChanged.length + ' in the following ' +
		frontsThatChanged.length + ' fronts:\n' + frontsThatChanged.join('\n'));
}
