var currentTab = 0; // Current tab is set to be the first tab (0)
var project_topics;
var project_locations;
var project_classes;
var project_response_types;
var project;
var project_id;
var prompt_id;
var avatar_link = "";


var user_id;


getData();

window.addEventListener('load', (event) => {
	user_id = document.getElementById('user_id').value;
	showTab(currentTab);
});

async function getData() {

	await get_topics(user_id).then(data => {project_topics = data;});
	if (project_topics) {
		add_project_checkboxes('proj_topics', 'topic', 'project_topics');
	}

	await get_locations(user_id).then(data => {project_locations = data;})
	if (project_locations){
		add_project_checkboxes('proj_locations', 'location', 'project_locations');
	}

	await get_response_types(user_id).then(data => {project_response_types = data;});
	if (project_response_types) {
		add_response_types_to_form();
	}


	await get_teacher_classes(user_id, user_id).then(data => {project_classes =data;});
	if (project_classes) {
		add_project_checkboxes('proj_classes', 'class', 'project_classes');
	}

}





function showTab(n) {
/*
	adopted from: https://www.w3schools.com/howto/howto_js_form_steps.asp
	display tab element specified by parameter n
	show completed step indicator
*/
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


async function nextPrev(n) {
/*
	adopted from: https://www.w3schools.com/howto/howto_js_form_steps.asp
	figure out which tab to display
	uses parameter n to determine how many tabs backward or forward to move
	allow for project submission when end of form reached
*/
	var x = document.getElementsByClassName("tab");
	// Exit the function if any field in the current tab is invalid:
	if (n == 1 && !validateForm()) return false;
	// Hide the current tab:
	x[currentTab].style.display = "none";
	// Increase or decrease the current tab by 1:
	currentTab = currentTab + n;
	// if you have reached the end of the form...
	// submit project and show completion tab
	if (currentTab >= x.length - 1) {
		await addProject();
		// var form = document.getElementById("regForm");
		window.location = "/viewProject?" + project_id;

		// form.submit();
		// showTab(currentTab);
		return false;
	}
	else {
	// Otherwise, display the correct tab:
		showTab(currentTab);
	}
}




function verifyTextData(element) {
/*
	verify min/max length requirements are met
*/
	var min_length = element.minLength;
	var max_length = element.maxLength;
	var element_length = element.value.trim().length;


	if (((element_length < min_length) && min_length >-1) || ((element_length > max_length) && max_length > -1)){
		element.parentElement.nextElementSibling.className = "error-message";
		element.parentElement.nextElementSibling.innerHTML = "Must have between " + element.minLength + " and " + element.maxLength + " characters";
	}
	else {
		element.parentElement.nextElementSibling.classList.remove("error-message");
		element.parentElement.nextElementSibling.innerHTML = "";
	}
}


function verifyData() {
/*
	loop through all user input fields and flag if incomplete
*/
	var x, y, z, i, valid = true;
	x = document.getElementsByClassName("tab");


	switch (x[currentTab].id) {
		case "basic_project_info":
			y = x[currentTab].querySelectorAll('input,textarea');
			// A loop that checks every input field in the current tab:
			for (i = 0; i < y.length; i++) {
			  // If a field is empty...
			  if (y[i].value == "" && y[i].required) {
				// add an "invalid" class to the field:
				y[i].className += " invalid";
				// and set the current valid status to false
				valid = false;
			  }
			  else {
				y[i].classList.remove("invalid");
			  }
			}
			break;
		case "proj_topics":
		case "proj_locations":
		case "proj_classes":
			y = x[currentTab].querySelectorAll('input[type="checkbox"]:checked');
			check_count = y.length;
			z = x[currentTab].querySelectorAll('label');
			if (check_count == 0) {
				z[0].className += " invalid";
				valid = false;

			}
			else{
				z[0].classList.remove("invalid");
			}
			break;
		case "proj_materials":
			y = x[currentTab].querySelectorAll('input[type="radio"]:checked');
			check_count = y.length;
			z = document.getElementById('usertype-radio-label');
			if (check_count == 0) {
				z.className += " invalid";
				valid = false;

			}
			else{
				z.classList.remove("invalid");
			}


			if (document.getElementById('materials_yes').checked) {
				y = x[currentTab].querySelectorAll('tbody tr');
				check_count = y.length;
				console.log(check_count);
				z = x[currentTab].querySelectorAll('input[type="text"]');
				if (check_count == 0) {
					document.getElementById("add-materials-label").className += " invalid";
					for (i = 0; i < z.length; i++) {
					  // If a field is empty...
					  if (z[i].value == "") {
						// add an "invalid" class to the field:
						z[i].className += " invalid";
						// and set the current valid status to false
					  }
					}
					valid = false;
				}
			}
			break;
		case "proj_prompts":
			check_count = x[currentTab].getElementsByClassName('collapsible').length + x[currentTab].getElementsByClassName('active-collapsible').length;
			z = x[currentTab].querySelectorAll('input[type="text"],textarea, select');
			if (check_count == 0) {
				for (i = 0; i < z.length; i++) {
				  // If a field is empty...
				  if (z[i].value == "" && z[i].required) {
					// add an "invalid" class to the field:
					z[i].className += " invalid";
					// and set the current valid status to false
				  }
				}
					valid = false;
			}
			break;
	}

	// If the valid status is true, mark the step as finished and valid:
	if (valid) {
		document.getElementsByClassName("step")[currentTab].className += " finish";
	}
	return valid; // return the valid status
}


function validateForm() {
/*
	loop through all user input fields and flag if incomplete
*/
	var x, y, z, i, valid = true;
	x = document.getElementsByClassName("tab");


	switch (x[currentTab].id) {
		case "basic_project_info":
			y = x[currentTab].querySelectorAll('input,textarea');
			// A loop that checks every input field in the current tab:
			for (i = 0; i < y.length; i++) {
			  // If a field is empty...
			  if (y[i].value == "" && y[i].required) {
				// add an "invalid" class to the field:
				y[i].className += " invalid";
				// and set the current valid status to false
				valid = false;
			  }
			  else {
				y[i].classList.remove("invalid");
			  }
			}
			break;
		case "proj_topics":
		case "proj_locations":
		case "proj_classes":
			y = x[currentTab].querySelectorAll('input[type="checkbox"]:checked');
			check_count = y.length;
			z = x[currentTab].querySelectorAll('label');
			if (check_count == 0) {
				z[0].className += " invalid";
				valid = false;

			}
			else{
				z[0].classList.remove("invalid");
			}
			break;
		case "proj_materials":
			y = x[currentTab].querySelectorAll('input[type="radio"]:checked');
			check_count = y.length;
			z = document.getElementById('usertype-radio-label');
			if (check_count == 0) {
				z.className += " invalid";
				valid = false;

			}
			else{
				z.classList.remove("invalid");
			}


			if (document.getElementById('materials_yes').checked) {
				y = x[currentTab].querySelectorAll('tbody tr');
				check_count = y.length;
				z = x[currentTab].querySelectorAll('input[type="text"]');
				if (check_count == 0) {
					document.getElementById("add-materials-label").className += " invalid";
					for (i = 0; i < z.length; i++) {
					  // If a field is empty...
					  if (z[i].value == "") {
						// add an "invalid" class to the field:
						z[i].className += " invalid";
						// and set the current valid status to false
					  }
					}
					valid = false;
				}
			}
			break;
		case "proj_prompts":
			check_count = x[currentTab].getElementsByClassName('collapsible').length + x[currentTab].getElementsByClassName('active-collapsible').length;
			z = x[currentTab].querySelectorAll('textarea, select');
			if (check_count == 0) {
				for (i = 0; i < z.length; i++) {
				  // If a field is empty...
				  if (z[i].value == "" && z[i].required) {
					// add an "invalid" class to the field:
					z[i].className += " invalid";
					// and set the current valid status to false
				  }
				}
					valid = false;
			}
		break;
	}

	// If the valid status is true, mark the step as finished and valid:
	if (valid) {
		document.getElementsByClassName("step")[currentTab].className += " finish";
	}
	return valid; // return the valid status
}



function fixStepIndicator(n) {
/*
	remove the active class of all steps except current tab
*/
	var i, x = document.getElementsByClassName("step");
	for (i = 0; i < x.length - 1; i++) {
		x[i].className = x[i].className.replace(" active", "");
	}
	x[n].className += " active";
}


async function addProject() {
	var project_name = document.getElementById("project_name").value;
	var project_short_desc = document.getElementById("project_short_desc").value;
	var project_long_desc = document.getElementById("project_long_desc").value;
	var body;

	await uploadProjectAvatar();
	if (avatar_link == "") {
		body = JSON.stringify({"creator_id": parseInt(user_id), "name": project_name, "short_description": project_short_desc, "long_description": project_long_desc})
	}
	else{
		body = JSON.stringify({"creator_id": parseInt(user_id), "name": project_name, "short_description": project_short_desc, "long_description": project_long_desc, "avatar": avatar_link["URL"]})
	}

	await postData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects', body, user_id).then(async data=>{
		project = data;
	project_id = project["id"];
		add_project_user(project_id, user_id, user_id);
	add_cb_selections_to_project('proj_topics', 'dbtopics');
	add_cb_selections_to_project('proj_locations', 'dblocations');
	add_cb_selections_to_project('proj_classes', 'dbclasses');

	addProjectMaterials();
		await addProjectPrompts();
	});
}


function add_cb_selections_to_project(element_id, table_name) {
	var x = document.getElementById(element_id);
	var cbs = x.getElementsByTagName("input");
	var rowCount = cbs.length;

	for(var i=1; i<rowCount; i++) {
		if(null != cbs[i] && true == cbs[i].checked) {
			var cb_id = cbs[i].value;
			putData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/' + table_name + '/' + cb_id, user_id);
		}
	}
}


async function addProjectMaterials() {
	try {
		var table = document.getElementById('materialsTable');
		var rowCount = table.rows.length;

		for(var i=1; i<rowCount; i++) {

			var material_name = table.rows[i].cells[1].childNodes[0].innerText;
			var material_quantity = table.rows[i].cells[2].childNodes[0].innerText;

			await postData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbmaterials', JSON.stringify({"name":material_name, "quantity":material_quantity}), user_id);
		}
	}
	catch(e) {
		console.log(e);
	}
}

async function addProjectPrompts (){
	var promptCount = document.getElementsByClassName("promptContent").length
	for(var i=1; i<=promptCount; i++) {

		var prompt = document.getElementById("promptContent" + i).childNodes;
		var prompt_options;
		var prompt_subheading = prompt[0].innerHTML.substring(10);
		var prompt_description = prompt[1].innerHTML.substring(13);
		var prompt_type = prompt[2].id.substring(6);
		var prompt_media_type = null;
		var prompt_reference = null;
 		if (prompt[3].innerHTML.substring(0,17) == "Response Options:"){
			prompt_options = prompt[3].innerHTML.substring(18).split("|");
			try {
				var prompt_media_type = prompt[4].innerHTML.substring(17);
				var prompt_reference = prompt[5].innerHTML.substring(12);
			}catch{

			}
 		}
 		else {
 			prompt_options = null;
 			try {
				var prompt_media_type = prompt[3].innerHTML.substring(17);
				var prompt_reference = prompt[4].innerHTML.substring(12);
			}
			catch{

			}
 		}

 		var body;
 		if(prompt_reference == null){
	 		 body = JSON.stringify({"subheading":prompt_subheading, "description":prompt_description, "response_type_id": prompt_type})
	 	}
	 	else{
	 		 body = JSON.stringify({"subheading":prompt_subheading, "description":prompt_description, "response_type_id": prompt_type, "media_type": prompt_media_type, "instructions_media": prompt_reference})
	 	}
		await postData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbprompts', body, user_id).then(async data=>{
			console.log("Added prompt " + i);
			prompt_id = data;
			await addPromptOptions(prompt_options);
		});
	}
}


async function addPromptOptions (options) {
	if (options!=null) {
		var optionCount = options.length;
		for(var i=0; i<optionCount; i++) {

			var entryText = options[i];

			await postData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id["id"] + '/dbmultientry_items', JSON.stringify({"entry_text":entryText}), user_id);
		}
	}
}


async function uploadProjectAvatar () {

	var avatar = document.getElementById('avatar').files[0];
	const formData = new FormData();
	formData.append('avatar', avatar);
	if (avatar != null) {
		await postData('https://wonderbar-cs467.ue.r.appspot.com/upload', formData, user_id).then(data=>{
			avatar_link = data;
		});
	}
}


function add_project_checkboxes(element_id, project_info_type, varname) {
	var x = document.getElementById(element_id);
	var projectContent = document.createElement("div");
	projectContent.className = "projectContent";
	var row = document.createElement("div");
	row.className = "row";
	var p = document.createElement("p");
	p.innerHTML = "All fields marked with * are required";
	projectContent.append(p);
	projectContent.append(row);
	x.appendChild(projectContent);

	p = document.createElement("p");
	var label = document.createElement("label");
	label.innerHTML = "Select at least one " + project_info_type + " *";
	p.appendChild(label);
	row.appendChild(p);


	var rowCount = window[varname]["count"]
	for (var i=0; i<rowCount;i++){
		p = document.createElement("p");
		label = document.createElement("label");
		var input = document.createElement("input");
		input.type = "checkbox";
		input.style.margin = "0 1%"
		input.id = project_info_type + (i+1);
		input.name = project_info_type + (i+1);
		input.value= window[varname]["results"][i]["id"];
		label.innerHTML= window[varname]["results"][i]["name"];
		label.htmlFor= project_info_type + (i+1);
		p.appendChild(input);
		p.appendChild(label);
		row.appendChild(p);
	}
}


function add_response_types_to_form() {

	var rowCount = project_response_types["count"]
	for (var i=0; i<rowCount;i++){
		var x = document.getElementById("prompt_response_type");
		var element1 = document.createElement("option");
		element1.value= project_response_types["results"][i]["id"];
		element1.innerHTML= project_response_types["results"][i]["name"];
		x.appendChild(element1);
	}
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
	document.getElementById('material_name').classList.remove("invalid");
	document.getElementById('material_quantity').classList.remove("invalid");
	document.getElementById('add-materials-label').classList.remove("invalid");
}


async function addPrompt() {
	var valid = true;
	var x = document.getElementsByClassName("tab");
	var z = x[currentTab].querySelectorAll('input[type="text"],textarea, select');
		for (i = 0; i < z.length; i++) {
		  // If a field is empty...
		  if (z[i].value == "" && z[i].required) {
			// add an "invalid" class to the field:
			z[i].className += " invalid";
			// and set the current valid status to false
			valid = false;
		  }
		  else {
		  	z[i].classList.remove("invalid");
		  }
		}

	var row = document.getElementById("prompt_responses");
	var row1 = document.getElementById("prompt_response_type");

	if (row1.options[row1.selectedIndex].text == 'checkbox' || row1.options[row1.selectedIndex].text == 'dropdown' || row1.options[row1.selectedIndex].text == 'radio'){
		if (row.value.trim() == ""){
			row.className += " invalid";
			valid = false;
		}
		else {
			row.classList.remove("invalid");
		}
	}


	if (valid) {
		var prompts_div = document.getElementById("addedPrompts");
		var promptCount = document.getElementsByClassName("collapsible").length + document.getElementsByClassName("active-collapsible").length;
		prompts_div.style.display = "block";

		if (promptCount >= 10) {
			alert('Only up to 10 prompts allowed.')
		}
		else {
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

			if (document.getElementById('prompt_media_type').value != ""){
				element2 = document.createElement("p");
				element2.innerHTML = "Media File Type: " + document.getElementById('prompt_media_type').options[document.getElementById('prompt_media_type').selectedIndex].text;
				element1.appendChild(element2);

				element2 = document.createElement("p");

				var avatar = document.getElementById('prompt_reference').files[0];
				console.log(avatar);
				const formData = new FormData();
				formData.append('avatar', avatar);
				var prompt_avatar_link;
				if (avatar != null) {
					await postData('https://wonderbar-cs467.ue.r.appspot.com/upload', formData, user_id).then(data=>{
						prompt_avatar_link = data;
					});
					if (prompt_avatar_link!=""){
						element2.innerHTML = "Media File: " + prompt_avatar_link["URL"];
						element1.appendChild(element2);
					}
				}
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
			console.log('prompt_avatar_' + document.getElementById('prompt_media_type').options[document.getElementById('prompt_media_type').selectedIndex].value);
			try{
			deleteFile('prompt_reference', 'prompt_avatar_' + document.getElementById('prompt_media_type').options[document.getElementById('prompt_media_type').selectedIndex].value, 'prompt_reference_label', 'delete_prompt_image');
			}
			catch {}
			document.getElementById('default_media_type').selected = true;
			document.getElementById('prompt_description').classList.remove("invalid");
			document.getElementById('prompt_response_type').classList.remove("invalid");
			document.getElementById('prompt_responses').classList.remove("invalid");

			document.getElementById('prompt_reference').style.display = "none";
		}
	}
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

	var content = prompt.nextElementSibling;
	if (content.style.display === "block") {
		content.style.display = "none";
		prompt.className = "collapsible";
	} else {
		content.style.display = "block";
		prompt.className = "active-collapsible";
	}
}


function deletePrompt(promptNum) {
	var prompt = document.getElementById("prompt" + promptNum);
	var promptContent = document.getElementById("promptContent" + promptNum);
	prompt.remove()
	promptContent.remove();
	var promptCount = document.getElementsByClassName("collapsible").length + document.getElementsByClassName("active-collapsible").length;

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






function yesnoCheck() {

	var i;
	var materials_fields = document.getElementsByClassName("add-materials");

	document.getElementById('usertype-radio-label').classList.remove("invalid");

	if (document.getElementById('materials_yes').checked) {
		for (i = 0; i < materials_fields.length; i++) {
		  materials_fields[i].style.display = "block";
		}

	}
	else {
		for (i = 0; i < materials_fields.length; i++) {
		  materials_fields[i].style.display = "none";
		}
	}
}


function updateImage(event, image_id, label_id, delete_id) {
	var reader = new FileReader();
	reader.onload = function() {
		var output = document.getElementById(image_id);
		if (reader.result !=null){
			var url = URL.createObjectURL(event.target.files[0]);
			output.src = url;
			// output.alt = "User upload project avatar";
			try{
				output.parentElement.load();
			}
			catch{

			}
	}

		var x = document.getElementById(label_id).parentElement.getElementsByClassName("active-media");
		for(var i = 0; i < x.length; i++) {
			x[i].style.display = "none";
			console.log(x[i]);
			x[i].classList.remove("active-media");
		}

		document.getElementById(image_id).parentElement.style.display="block";
		document.getElementById(label_id).className += "active-media";
		document.getElementById(label_id).style.display="block";
		document.getElementById(delete_id).style.display="block";
	}
	if (event.target.files[0]!=null){
		reader.readAsDataURL(event.target.files[0]);
	}
	// else {
	// 	document.getElementById(label_id).style.display="none";
	// 	document.getElementById(delete_id).style.display="none";
	// }
}

function deleteFile(element_id, image_id, label_id, delete_id) {
	var output = document.getElementById(image_id);
	console.log(image_id);
	output.src = "";
	var input = document.getElementById(element_id);
	input.value = "";

	var x = document.getElementById(image_id).parentElement.getElementsByClassName("active-media");
	console.log(x.length);
	for(var i = 0; i < x.length; i++) {
		x[i].style.display = "none;"
		x[i].classList.remove("active-media");
	}

	document.getElementById(image_id).parentElement.style.display="none";
	document.getElementById(label_id).style.display="none";
	document.getElementById(delete_id).style.display="none";
}



// https://www.geeksforgeeks.org/file-type-validation-while-uploading-it-using-javascript/
function fileValidation(event, element_id, image_id, label_id, delete_id) { 
	var fileInput =  
		document.getElementById(element_id); 
	  
	var file = fileInput.files[0]; 
	var file_type = fileInput.accept.split('/')[0];
  
	if (!isFileType(file, file_type)) { 
		fileInput.nextElementSibling.className = "error-message";
		fileInput.nextElementSibling.innerHTML = "Invalid file type";
		fileInput.value = '';
		deleteFile(element_id, image_id, label_id, delete_id);
		return false; 
	}  
	else  
	{ 
		fileInput.nextElementSibling.classList.remove("error-message");
		fileInput.nextElementSibling.innerHTML = "";
		// Image preview 
		updateImage(event, image_id, label_id, delete_id);

	} 
} 

function isFileType(file, file_type){
	try{
	    return (file['type'].split('/')[0]==file_type);//returns true or false
	}
	catch{
		return true;
	}
}


function setAccept(element, element_id, delete_element){
	var elementUpdate = document.getElementById(element_id);
	var deleteElement = document.getElementById(delete_element);
	elementUpdate.accept = element.options[element.selectedIndex].value + "/*";
	elementUpdate.style.display = "block";
	elementUpdate.setAttribute("onchange", "fileValidation(event, 'prompt_reference', 'prompt_avatar_" + element.options[element.selectedIndex].value + "', 'prompt_reference_label_" + element.options[element.selectedIndex].value + "', 'delete_prompt_image')")
	deleteElement.setAttribute("onclick", "deleteFile('prompt_reference', 'prompt_avatar_" + element.options[element.selectedIndex].value + "', 'prompt_reference_label_" + element.options[element.selectedIndex].value + "', 'delete_prompt_image')")
	console.log(element.options[element.selectedIndex].value);

}
