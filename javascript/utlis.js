// Load text from url
var loadTextResource = function(url) {
	return new Promise(function(resolve) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.onload = function() {
			if (request.readyState === 4) {
				if (request.status < 200 || request.status > 299) {
					// If there was an error throw error
					throw 'Error: HTTP Status ' +
						request.status +
						' on resource ' +
						url;
				} else {
					// Resolve file text
					url = null;
					resolve(request.responseText);
				}
			}
		};
		request.send();
	});
};

// Load image from url
var loadImage = function(url) {
	return new Promise(function(resolve) {
		var image = new Image();
		image.onload = () => {
			// Resolve image
			url = null;
			resolve(image);
		};
		image.onerror = e => {
			// If there was an error print to console
			console.log(e);
		};
		image.src = url;
	});
};

// Load json from url
var loadJSONResource = function(url) {
	return new Promise(function(resolve) {
		var json = loadTextResource(url);
		return Promise.all([json]).then(([jsonR]) => {
			// Try to parse text as json
			try {
				// Return text in json format
				url = null;
				resolve(JSON.parse(jsonR));
			} catch (e) {
				// If there was an error print to console
				console.log(e);
			}
		});
	});
};

// Load all files from a list of names
var loadAll = function(names) {
	var re = /(?:\.([^.]+))?$/;
	var proms = [];
	names.forEach(element => {
		// Get ".txt" of a file name
		var ext = re.exec(element)[1];
		switch (ext) {
			// If txt, vert or frag load as text file
			case 'txt':
			case 'vert':
			case 'frag':
				proms.push(loadTextResource(element));
				break;
			// If image load as image
			case 'jpg':
			case 'png':
				proms.push(loadImage(element));
				break;
			// If json load as json
			case 'json':
				proms.push(loadJSONResource(element));
				break;
			// If non of the above log error
			default:
				console.log('Unexpected file type');
		}
	});
	re = null;
	// Return array of file content promises
	return proms;
};
