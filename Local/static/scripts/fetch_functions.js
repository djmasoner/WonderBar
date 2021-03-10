const statusCheck = response => {
	if (response.status >= 200 && response.status < 500) {
		return Promise.resolve(response)
	}
	return Promise.reject(new Error(response.statusText))
}

const json = response => response.json()


async function fetchData(url = '', user_id) {
/*
	get data from api specified by parameter url
*/
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	reqHeader.append('Authorization', 'Bearer ' + user_id);

	let initObject = {
		method: 'GET' /*, headers: reqHeader*/
	};

	var userRequest = new Request(url, initObject);

	var output;
	const final_response = await fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(data => {
			if ('Error' in data) {
				throw new Error(data["Error"]);
			}
			return data;
		})
		.catch(function (err) {
			return false;
		});
	return final_response;
}


async function deleteData(url = '', user_id) {
/*
	get data from api specified by parameter url
*/
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	reqHeader.append('Authorization', 'Bearer ' + user_id);

	let initObject = {
		method: 'DELETE' /*, headers: reqHeader*/
	};

	var userRequest = new Request(url, initObject);

	var output;
	const final_response = await fetch(userRequest)
		.then(statusCheck)
		.then(data => {
			if ('Error' in data) {
				throw new Error(data["Error"]);
			}
			return data;
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	return final_response;
}


async function putData(url = '', user_id) {
/*
	put data to api specified by parameter url
*/
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	reqHeader.append('Authorization', 'Bearer ' + user_id);

	let initObject = {
		method: 'PUT' /*, headers: reqHeader*/
	};

	var userRequest = new Request(url, initObject);

	var output;
	const final_response = await fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(data => {
			if ('Error' in data) {
				throw new Error(data["Error"]);
			}
			return data;
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	return final_response;
}


async function postData(url = '', data = {}, user_id) {
/*
	post data from parameter data to api specified by parameter url 
*/
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	reqHeader.append('Authorization', 'Bearer ' + user_id);

	let initObject = {
		method: 'POST', body: data /*, headers: reqHeader*/
	};


	var userRequest = new Request(url, initObject);

	var output;
	const final_response = await fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(data => {
			if ('Error' in data) {
				throw new Error(data["Error"]);
			}
			return data;
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	return final_response;
}


async function patchData(url = '', data = {}, user_id) {
/*
	update resource from api specified by parameter url with data from data parameter
*/
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	reqHeader.append('Authorization', 'Bearer ' + user_id);

	let initObject = {
		method: 'PATCH', body: data /*, headers: reqHeader*/
	};

	console.log(initObject.body);

	var userRequest = new Request(url, initObject);

	var output;
	const final_response = await fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(data => {
			if ('Error' in data) {
				throw new Error(data["Error"]);
			}
			return data;
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	return final_response;
}
