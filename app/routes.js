// app/routes.js
module.exports = function(app) {
	var url = __dirname + '/../public/views/';
	var path = require('path');

	app.get('/', function(req, res) {
		res.sendFile(path.resolve(url + 'index.html'));
	});

	app.listen(3000, function(){
		console.log('Server running at Port 3000');
	});
}