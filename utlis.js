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
					url = null;
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
		image.onload = () => {
			url = null;
			resolve(image);
		};
		image.onerror = e => {
			console.log(e);
		};
		image.src = url;
	});
};

var loadJSONResource = function(url) {
	return new Promise(function(resolve) {
		var json = loadTextResource(url);
		return Promise.all([json]).then(([jsonR]) => {
			try {
				url = null;
				resolve(JSON.parse(jsonR));
			} catch (e) {
				console.log(e);
			}
		});
	});
};

var loadAll = function(names) {
	var re = /(?:\.([^.]+))?$/;
	var proms = [];
	names.forEach(element => {
		var ext = re.exec(element)[1];
		switch (ext) {
			case 'txt':
			case 'vert':
			case 'frag':
				proms.push(loadTextResource(element));
				break;
			case 'jpg':
			case 'png':
				proms.push(loadImage(element));
				break;
			case 'json':
				proms.push(loadJSONResource(element));
				break;

			default:
				console.log('Unexpected file type');
		}
	});
	re = null;
	return proms;
};
