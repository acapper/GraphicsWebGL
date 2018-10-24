var loadTextResource = function(url) {
	return new Promise(function(resolve) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.onload = function() {
			if (request.readyState === 4) {
				if (request.status < 200 || request.status > 299) {
					throw 'Error: HTTP Status ' +
						request.status +
						' on resource ' +
						url;
				} else {
					resolve(request.responseText);
				}
			}
		};
		request.send();
	});
};

var loadImage = function(url) {
	return new Promise(function(resolve) {
		var image = new Image();
		image.onload = function() {
			resolve(image);
		};
		image.src = url;
	});
};

var loadJSONResource = function(url) {
	return new Promise(function(resolve) {
		var json = loadTextResource(url);
		return Promise.all([json]).then(([jsonR]) => {
			try {
				resolve(JSON.parse(jsonR));
			} catch (e) {
				console.log(e);
			}
		});
	});
};
