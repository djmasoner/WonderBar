	var currentTab = 0; // Current tab is set to be the first tab (0)

	window.onload = getProjectTopicsandLocations;
	function getProjectTopicsandLocations(){
		getProjectTopics();
		getProjectLocations();
		getResponseTypes();
		showTab(currentTab); // Display the current tab
	}

	const statusCheck = response => {
		if (response.status >= 200 && response.status < 300) {
			return Promise.resolve(response)
		}
		return Promise.reject(new Error(response.statusText))
	}

	const json = response => response.json()



	function showTab(n) {
		// This function will display the specified tab of the form...
		var x = document.getElementsByClassName("tab");
		x[n].style.display = "block";
		//... and fix the Previous/Next buttons:
		if (n == 0) {
			document.getElementById("prevBtn").style.display = "none";
		} else {
			document.getElementById("prevBtn").style.display = "inline";
		}
		if (n == (x.length - 2)) {
			document.getElementById("nextBtn").innerHTML = "Submit";
		} else {
			document.getElementById("nextBtn").innerHTML = "Next";
		}
		//... and run a function that will display the correct step indicator:
		fixStepIndicator(n)
	}


	function nextPrev(n) {
		// This function will figure out which tab to display
		var x = document.getElementsByClassName("tab");
		// Exit the function if any field in the current tab is invalid:
		if (n == 1 && !validateForm()) return false;
		// Hide the current tab:
		x[currentTab].style.display = "none";
		// Increase or decrease the current tab by 1:
		currentTab = currentTab + n;
		// if you have reached the end of the form...
		if (currentTab >= x.length - 1) {
			// currentTab = currentTab - n;

			// ... the form gets submitted:
			if (document.getElementById('avatar').files[0] == null) {
				addProject();
			}
			else {
				uploadAvatar();
			}

			// document.getElementById("regForm").submit();
			return false;
		}
		else {
		// Otherwise, display the correct tab:
			showTab(currentTab);
		}
	}
	



	function validateForm() {
		// This function deals with validation of the form fields
		var x, y, i, valid = true;
		x = document.getElementsByClassName("tab");
		y = x[currentTab].getElementsByTagName("input");
		// A loop that checks every input field in the current tab:
		// for (i = 0; i < y.length; i++) {
		//   // If a field is empty...
		//   if (y[i].value == "") {
		//     // add an "invalid" class to the field:
		//     y[i].className += " invalid";
		//     // and set the current valid status to false
		//     valid = false;
		//   }
		// }
		// If the valid status is true, mark the step as finished and valid:
		if (valid) {
			document.getElementsByClassName("step")[currentTab].className += " finish";
		}
		return valid; // return the valid status
	}
	
	function fixStepIndicator(n) {
		// This function removes the "active" class of all steps...
		var i, x = document.getElementsByClassName("step");
		for (i = 0; i < x.length - 1; i++) {
			x[i].className = x[i].className.replace(" active", "");
		}
		//... and adds the "active" class on the current step:
		x[n].className += " active";
	}


	function addProject(url="") {
		var project_name = document.getElementById("project_name").value;
		var project_short_desc = document.getElementById("project_short_desc").value;
		var project_long_desc = document.getElementById("project_long_desc").value;
		var user_id = document.getElementById('user_id').value

		var body;
		if (url == "") {
			body = JSON.stringify({"creator_id": parseInt(user_id), "name": project_name, "short_description": project_short_desc, "long_description": project_long_desc})
		}
		else{
			body = JSON.stringify({"creator_id": parseInt(user_id), "name": project_name, "short_description": project_short_desc, "long_description": project_long_desc, "avatar": url})
		}


		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
			method: 'POST', headers: reqHeader, body: body
		};

		var userRequest = new Request('https://wonderbar-cs467.ue.r.appspot.com/dbprojects', initObject);

		fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(data => {
				var proj_id = data["id"];
				addProjectTopics(proj_id);
				addProjectLocations(proj_id);
				addMaterialToProject(proj_id);
				addPromptToProject(proj_id);
				showTab(currentTab);
				// document.getElementById("regForm").submit();
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});

	}


	function addProjectTopics(proj_id) {
		try {
			var x = document.getElementById("proj_topics");
			var cbs = x.getElementsByTagName("input");
			var rowCount = cbs.length;

			for(var i=1; i<rowCount; i++) {
				if(null != cbs[i] && true == cbs[i].checked) {
					var topic_id = cbs[i].value;

					let reqHeader = new Headers();
					reqHeader.append('Content-Type', 'application/json');
					reqHeader.append('Authorization', 'Bearer ' + user_id);

					let initObject = {
						method: 'PUT', headers: reqHeader
					};

					var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbprojects/" + proj_id + "/dbtopics/" + topic_id, initObject);

					fetch(userRequest)
					.then(statusCheck)
					.catch(function (err) {
						console.log("Something went wrong!", err);
					});

				}
			}
		}
		catch(e) {
			console.log(e);
		}
	}

	function addProjectLocations(proj_id) {
		try {
			var x = document.getElementById("proj_locations");
			var cbs = x.getElementsByTagName("input");

			var rowCount = cbs.length;

			for(var i=1; i<rowCount; i++) {
				if(null != cbs[i] && true == cbs[i].checked) {
					var location_id = cbs[i].value;

					let reqHeader = new Headers();
					reqHeader.append('Content-Type', 'application/json');
					reqHeader.append('Authorization', 'Bearer ' + user_id);

					let initObject = {
						method: 'PUT', headers: reqHeader
					};

					var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbprojects/" + proj_id + "/dblocations/" + location_id, initObject);

					fetch(userRequest)
					.then(statusCheck)
					.catch(function (err) {
						console.log("Something went wrong!", err);
					});
				}
			}
		}
		catch(e) {
			console.log(e);
		}
	}



	function addMaterialToProject(proj_id) {
		try {
			var table = document.getElementById('materialsTable');
			var rowCount = table.rows.length;

			for(var i=1; i<rowCount; i++) {

				var material_name = table.rows[i].cells[1].childNodes[0].innerText;
				var material_quantity = table.rows[i].cells[2].childNodes[0].innerText;

				let reqHeader = new Headers();
				reqHeader.append('Content-Type', 'application/json');
				reqHeader.append('Authorization', 'Bearer ' + user_id);

				let initObject = {
					method: 'POST', headers: reqHeader, body: JSON.stringify({"name":material_name, "quantity":material_quantity})
				};

				var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbprojects/" + proj_id + "/dbmaterials", initObject);

				fetch(userRequest)
				.then(statusCheck)
				.catch(function (err) {
					console.log("Something went wrong!", err);
				});
			}
		}
		catch(e) {
			console.log(e);
		}
	}

	function addPromptToProject (proj_id){
		var promptCount = document.getElementsByClassName("promptContent").length
		for(var i=1; i<=promptCount; i++) {

			var prompt = document.getElementById("promptContent" + i).childNodes;

			var prompt_subheading = prompt[0].innerHTML.substring(10);
			var prompt_description = prompt[1].innerHTML.substring(13);
			var prompt_type = prompt[2].id.substring(6);
			var prompt_options = prompt[3].innerHTML.substring(18).split("|");

			let reqHeader = new Headers();
			reqHeader.append('Content-Type', 'application/json');
			reqHeader.append('Authorization', 'Bearer ' + user_id);

			let initObject = {
				method: 'POST', headers: reqHeader, body: JSON.stringify({"subheading":prompt_subheading, "description":prompt_description, "response_type_id": prompt_type})
			};

			var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbprojects/" + proj_id + "/dbprompts", initObject);

			fetch(userRequest)
			.then(statusCheck)
			.then(json)
			.then(data => {
				var prompt_id = data["id"];
				addOptionsToPrompt(prompt_id, prompt_options);
			})
			.catch(function (err) {
				console.log("Something went wrong!", err);
			});
		}
	}


	function addOptionsToPrompt (prompt_id, options) {
		var optionCount = options.length;
		for(var i=0; i<optionCount; i++) {

			var entryText = options[i];

			let reqHeader = new Headers();
			reqHeader.append('Content-Type', 'application/json');
			reqHeader.append('Authorization', 'Bearer ' + user_id);

			let initObject = {
					method: 'POST', headers: reqHeader, body: JSON.stringify({"entry_text":entryText})
			};

			var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbprompts/" + prompt_id + "/dbmultientry_items", initObject);

			fetch(userRequest)
			.then(statusCheck)
			.catch(function (err) {
				console.log("Something went wrong!", err);
			});
		}
	}


	function uploadAvatar() {
		var avatar = document.getElementById('avatar').files[0];
		const formData = new FormData();
		formData.append('avatar', avatar);
		if (avatar != null) {
			let reqHeader = new Headers();
			reqHeader.append('Authorization', 'Bearer ' + user_id);

			let initObject = {
					method: 'POST', headers: reqHeader, body:formData
			};

			var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/upload", initObject);

			fetch(userRequest)
			.then(statusCheck)
			.then(json)
			.then(data => {
				var url = data["URL"];
				addProject(url);
			})
			.catch(function (err) {
				console.log("Something went wrong!", err);
			});
		}
	}


	function getProjectTopics() {
		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
				method: 'GET', headers: reqHeader
		};

		var userRequest = new Request('https://wonderbar-cs467.ue.r.appspot.com/dbtopics', initObject);

		fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(topics => {

			var x = document.getElementById("proj_topics");
			var projectContent = document.createElement("div");
			projectContent.className = "projectContent";
			var row = document.createElement("div");
			row.className = "row";
			projectContent.append(row);
			x.appendChild(projectContent);

			var rowCount = topics["count"]
			for (var i=0; i<rowCount;i++){
				var element2 = document.createElement("p");
				var element = document.createElement("label");
				var element1 = document.createElement("input");
				element1.type = "checkbox";
				element1.style.margin = "0 1%"
				element1.id = "topic" + (i+1);
				element1.name="topic" + (i+1);
				element1.value= topics["results"][i]["id"];
				element.innerHTML= topics["results"][i]["name"];
				element.htmlFor= "topic" + (i+1);
				element2.appendChild(element1);
				element2.appendChild(element);
				row.appendChild(element2);
			}
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	}


	function getProjectLocations() {
		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
				method: 'GET', headers: reqHeader
		};

		var userRequest = new Request('https://wonderbar-cs467.ue.r.appspot.com/dblocations', initObject);

		fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(locations => {
			var x = document.getElementById("proj_locations");
			var projectContent = document.createElement("div");
			projectContent.className = "projectContent";
			var row = document.createElement("div");
			row.className = "row";
			projectContent.append(row);
			x.appendChild(projectContent);

			var rowCount = locations["count"]
			for (var i=0; i<rowCount;i++){
				var element2 = document.createElement("p");
				var element = document.createElement("label");
				var element1 = document.createElement("input");
				element1.type = "checkbox";
				element1.style.margin = "0 1%"

				element1.id = "location" + (i+1);
				element1.name="location" + (i+1);
				element1.value= locations["results"][i]["id"];
				element.innerHTML= locations["results"][i]["name"];
				element.htmlFor= "location" + (i+1);
				element2.appendChild(element1);
				element2.appendChild(element);
				row.appendChild(element2);
			}
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	
	}


	function deleteRow(tableID, rowID) {
		var row = document.getElementById(rowID);
		row.remove();
		var table = document.getElementById(tableID);
		var rowCount = table.rows.length;
		if (rowCount == 1) {
			var div = document.getElementById("added-materials-div");

			div.style.display = "none";
		}
	}

	function addMaterial(tableID) {

		var div = document.getElementById("added-materials-div");
		var table = document.getElementById(tableID);
		var rowCount = table.rows.length;
		div.style.display = "inline-block";


		if (rowCount == 11) {
			alert('No more than 10 classes');
		}
		else {
			var row = table.getElementsByTagName('tbody')[0].insertRow(rowCount-1);
			row.id = "material" + rowCount;
			var cell1 = row.insertCell(0);
			var element1 = document.createElement("input");
			element1.type = "button";
			element1.name="chkbox" + rowCount;
			element1.value="Del";
			element1.style.width = "100%";
			element1.style.margin = "0";
			element1.setAttribute("onClick", "javascript: deleteRow(\"" + tableID +"\",\"material" + rowCount + "\") ;")
			cell1.appendChild(element1);

			var cell2 = row.insertCell(1);
			var element2 = document.createElement("p");
			element2.id = rowCount
			element2.name = "classcode" + rowCount;
			element2.innerText = document.getElementById('material_name').value
			cell2.appendChild(element2);

			var cell3 = row.insertCell(2);
			var element3 = document.createElement("p");
			element3.name = "classname" + rowCount;
			element3.innerText = document.getElementById('material_quantity').value
			cell3.appendChild(element3);
		}
		document.getElementById('material_name').value = "";
		document.getElementById('material_quantity').value = "";
	}


	function addPrompt() {
		var prompts_div = document.getElementById("addedPrompts");
		var promptCount = document.getElementsByClassName("collapsible").length;
		prompts_div.style.display = "block";

		var element1 = document.createElement("button");
		element1.type = "button";
		element1.className = "collapsible";
		element1.innerHTML="View Prompt " + (promptCount + 1);
		element1.id= "prompt" + (promptCount + 1);
		element1.setAttribute( "onClick", "javascript: showCollapsible(" + (promptCount +1) + ");" );
		prompts_div.appendChild(element1);


		element1 = document.createElement("div");
		element1.className = "promptContent";
		element1.id = "promptContent" + (promptCount + 1);
		prompts_div.appendChild(element1);

		var element2 = document.createElement("p");
		element2.innerHTML = "Category: " + document.getElementById('prompt_subheading').value;
		element1.appendChild(element2);

		element2 = document.createElement("p");
		element2.innerHTML = "Description: " + document.getElementById('prompt_description').value;
		element1.appendChild(element2);

		element2 = document.createElement("p");
		element2.innerHTML = "Response Type: " + document.getElementById('prompt_response_type').options[document.getElementById('prompt_response_type').selectedIndex].text;
		element2.id = "option" + document.getElementById('prompt_response_type').options[document.getElementById('prompt_response_type').selectedIndex].value;
		element1.appendChild(element2);

		if (document.getElementById('prompt_responses').value != ""){
			element2 = document.createElement("p");
			element2.innerHTML = "Response Options: " + document.getElementById('prompt_responses').value;
			element1.appendChild(element2);
		}

		element2 = document.createElement("button");
		element2.type = "button";
		element2.className = "deletePrompt";
		element2.innerHTML="Delete";
		element2.id= "delprompt" + (promptCount + 1);
		element2.setAttribute( "onClick", "javascript: deletePrompt(" + (promptCount +1) + ");" );
		element1.appendChild(element2);

		document.getElementById('prompt_subheading').value = "";
		document.getElementById('prompt_description').value = "";
		document.getElementById('prompt_responses').value = "";
		document.getElementById('default_type').selected = true;
		document.getElementById('response_options').style.display='none';
	}

	function getResponseTypes() {

		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
			method: 'GET', headers: reqHeader
		};

		var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbresponse_types", initObject);

		fetch(userRequest)
		.then(statusCheck)
		.then(json)
		.then(response_types => {
			var rowCount = response_types["count"]
			for (var i=0; i<rowCount;i++){
				var x = document.getElementById("prompt_response_type");
				var element1 = document.createElement("option");
				element1.value= response_types["results"][i]["id"];
				element1.innerHTML= response_types["results"][i]["name"];
				x.appendChild(element1);
			}
		})

		.catch(function (err) {
			console.log("Something went wrong!", err);

		});
	}


	function getOptions() {
		var row = document.getElementById("add-options");
		var row1 = document.getElementById("prompt_response_type");

		if (row1.options[row1.selectedIndex].text == 'checkbox' || row1.options[row1.selectedIndex].text == 'dropdown' || row1.options[row1.selectedIndex].text == 'radio'){
			document.getElementById('response_options').style.display='block';
		}
		else {
			document.getElementById('response_options').style.display='none';
		}
		
	}


	function showCollapsible(promptNum) {
		var prompt = document.getElementById("prompt" + promptNum);
		prompt.active = true;

		var content = prompt.nextElementSibling;
		if (content.style.display === "block") {
			content.style.display = "none";
		} else {
			content.style.display = "block";
		}
	}


	function deletePrompt(promptNum) {
		var prompt = document.getElementById("prompt" + promptNum);
		var promptContent = document.getElementById("promptContent" + promptNum);
		prompt.remove()
		promptContent.remove();
		var promptCount = document.getElementsByClassName("collapsible").length;

		if (promptCount == 0){
			var prompts_div = document.getElementById("addedPrompts");
			prompts_div.style.display = "none";
		}

		for(var i=0; i< promptCount; i++){
			if (i+1<promptNum){
				var prompt = document.getElementById("prompt" + (i+1));
				var promptContent = document.getElementById("promptContent" + (i+1));
				var deletePrompt = document.getElementById("delprompt" + (i+1));

				prompt.innerHTML="View Prompt " + (i + 1);
				prompt.id= "prompt" + (i + 1);
				prompt.setAttribute( "onClick", "javascript: showCollapsible(" + (i +1) + ");" );
				deletePrompt.innerHTML="Delete";
				deletePrompt.id= "delprompt" + (i + 1);
				deletePrompt.setAttribute( "onClick", "javascript: deletePrompt(" + (i +1) + ");" );
				promptContent.id = "promptContent" + (i + 1);
			}
			else {
				var prompt = document.getElementById("prompt" + (i+2));
				var promptContent = document.getElementById("promptContent" + (i+2));
				var deletePrompt = document.getElementById("delprompt" + (i+2));
				prompt.innerHTML="View Prompt " + (i+1);
				prompt.id= "prompt" + (i+1);
				prompt.setAttribute( "onClick", "javascript: showCollapsible(" + (i+1) + ");" );
				deletePrompt.innerHTML="Delete";
				deletePrompt.id= "delprompt" + (i + 1);
				deletePrompt.setAttribute( "onClick", "javascript: deletePrompt(" + (i +1) + ");" );
				promptContent.id = "promptContent" + (i+1);
			}
		}
	}


	function confirmUnique(elementName, elementDescription, tableName, tableKey) {
		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
				method: 'GET', headers: reqHeader
		};

		var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/db" + tableName + "/" + document.getElementById(elementName).value + "?key=" + tableKey, initObject);

		fetch(userRequest)
		.then(statusCheck)
		.then(function(){
			document.getElementById('project_name').style.border = '2px solid red';
			document.getElementById('project_name').title = 'Project name already exists';
			})

		.catch(function (err) {
			console.log("Something went wrong!", err);
			document.getElementById('project_name').style.border = '2px solid green';
			document.getElementById('project_name').title = 'Project name is valid';
		});
	}


	function updateImage(event) {
		var reader = new FileReader();
		reader.onload = function() {
			var output = document.getElementById('avatarImage');
			if (reader.result !=null){
			output.src = reader.result;
			output.alt = "User upload project avatar"
		}
			// output.style.display = "block";
			document.getElementById('avatar_label').style.display="block";
			document.getElementById('deleteImage').style.display="block";
		}
		if (event.target.files[0]!=null){
			reader.readAsDataURL(event.target.files[0]);
		}
	}


	function deleteFile() {
		var output = document.getElementById('avatarImage');
		output.src = "";
		var input = document.getElementById('avatar');
		input.value = "";
		document.getElementById('avatar_label').style.display="none";
		document.getElementById('deleteImage').style.display="none";
	}
