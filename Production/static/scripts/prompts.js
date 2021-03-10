var user_id;
var project_prompts;
var currentTab = 0;
var loader;
var project_id = window.location.search.split("?")[1];
var overflow;
console.log(project_id);

async function getPromptData() {
	const response = await get_project_prompts(project_id, user_id).then(async data=>{
		project_prompts = data;
		for (var i=0; i < project_prompts["count"]; i++) {
			await create_new_tab(project_prompts["results"][i]);
		}
		return true;
	});
	return response;
}

async function init_page (){

	document.getElementById('map').style.display = "none";
	overflow.style.display = "none";
	getPromptData().then(data => {
		// loader.style.display = "none";
		showTab(currentTab)
		overflow.style.display = "block";

	});
		
		// showTab(currentTab)
	}


window.addEventListener('load', (event) => {
	user_id = document.getElementById('user_id').value;
	loader = document.getElementById("loader");
	overflow = document.getElementById("overflow");
	init_page();
});


// window.addEventListener('load', (event) => {
// 	showTab(currentTab);
// });


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
	if (n == (x.length - 1)) {
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
	var y = document.getElementsByClassName("media-file")
	for (var i=0; i<y.length; i++) {
		y[i].pause();
	}

	if (n == 1 && !validateForm()) return false;

	var x = document.getElementsByClassName("tab");
	// Hide the current tab:
	x[currentTab].style.display = "none";
	// Increase or decrease the current tab by 1:
	currentTab = currentTab + n;
	// Exit the function if any field in the current tab is invalid:
	// if (n == 1 /*&& !validateForm()*/) return false;
	// if you have reached the end of the form...
	// submit project and show completion tab
	if (currentTab > x.length -1 ) {
		await submitObservation().then(data=>{
			addProjectUser(project_id, user_id);
			window.location = "/viewObservations?" + project_id;

			// showTab(currentTab);
			return false;
		});
	}
	else {
	// Otherwise, display the correct tab:
		showTab(currentTab);
	}
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

async function create_new_tab(prompt) {
	var tab = document.createElement("div");
	tab.className = "tab";
	tab.id = "prompt_tab" + prompt["id"];
	var projectTitle = document.createElement("div");
	projectTitle.className = "projectTitle";
	var title_row = document.createElement("div");
	title_row.className = "row";
	// var title_left_column = document.createElement("div");
	// var title_right_column = document.createElement("div");
	// title_left_column.className = "left-column";
	// title_right_column.className = "right-column";
	var h1 = document.createElement("h1");
	h1.innerHTML = prompt["subheading"];
	title_row.appendChild(h1);

	await get_project(prompt["project_id"], user_id)
	.then(project=>{
		var h2 = document.createElement("h2");
		h2.innerHTML = "Project: " + project["name"];
		title_row.appendChild(h2);
	});



	// var h2 = document.createElement(p);
	// h2.innerHTML = prompt["description"];
	// title_right_column.appendChild(h2);

	var projectContent = document.createElement("div");
	projectContent.className = "projectContent";

	var content_row0 = document.createElement("div");
	content_row0.className = "row";
	var content_left_column0 = document.createElement("div");
	var content_right_column0 = document.createElement("div");
	content_left_column0.className = "left-column";
	content_right_column0.className = "right-column";

	var content_row1 = document.createElement("div");
	content_row1.className = "row";
	var content_left_column1 = document.createElement("div");
	var content_right_column1 = document.createElement("div");
	content_left_column1.className = "left-column";
	content_right_column1.className = "right-column";

	var content_row2 = document.createElement("div");
	content_row2.className = "row";
	var content_left_column2 = document.createElement("div");
	var content_right_column2 = document.createElement("div");
	content_left_column2.className = "left-column";
	content_right_column2.className = "right-column";

	var div = document.createElement("div");
	div.className = "media-files";

	var label = document.createElement("label");
	label.innerHTML = "Prompt";

	var p = document.createElement("p");
	p.innerHTML = prompt["description"];
	// projectContent.appendChild(p);

	content_left_column0.appendChild(label);
	content_right_column0.appendChild(p);

	switch (prompt["media_type"]) {
		case "audio":
			var p2 = document.createElement("p");
			p2.innerHTML = "Listen to the clip below before adding your observation."
			var audio = document.createElement("audio");
			var source = document.createElement("source");
			source.src = prompt["instructions_media"];
			audio.controls = true;
			audio.className = "media-file";
			audio.appendChild(source);
			div.appendChild(audio);
			// projectContent.insertBefore(p2, p);
			// projectContent.insertBefore(div, p);
			projectContent.appendChild(p2);
			projectContent.appendChild(div);
			break;
		case "video":
			var p2 = document.createElement("p");
			p2.innerHTML = "Watch the video below before adding your observation."
			var source = document.createElement("source");
			source.src = prompt["instructions_media"];
			var video = document.createElement("video");
			video.controls = true;
			video.className = "media-file";
			video.appendChild(source);
			div.appendChild(video);
			// projectContent.insertBefore(p2, p);
			// projectContent.insertBefore(div, p);
			projectContent.appendChild(p2);
			projectContent.appendChild(div);
			break;
		case "image":
			var p2 = document.createElement("p");
			p2.innerHTML = "Look at the image below before adding your observation."
			var picture = document.createElement("picture");
			var img = document.createElement("img");
			img.src = prompt["instructions_media"];
			img.className = "media-file";
			picture.appendChild(img);
			div.appendChild(picture);
			// projectContent.insertBefore(p2, p);
			// projectContent.insertBefore(div, p);
			projectContent.appendChild(p2);
			projectContent.appendChild(div);
			break;
		}


		await get_response_type(prompt["response_type_id"], user_id).then(async data => {
			switch (data["name"]) {
				case "checkbox":
					var label = document.createElement("label");
					// label.htmlFor = "response_image";
					label.innerHTML = "Response *";
					label.className = "prompt_response";
					content_left_column1.appendChild(label);
					await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt["id"] + '/dbmultientry_items', user_id).then(options=>{
						for(var i=0; i< options["count"];i++){
							var p = document.createElement("p");
							var input = document.createElement("input");
							input.type = "checkbox";
							input.required = true;
							input.value = options["results"][i]["entry_text"];
							input.id = "option" + options["results"][i]["id"];
							input.name = "option" + options["results"][i]["id"];
							var label = document.createElement("label");
							label.htmlFor = "option" + options["results"][i]["id"];
							label.innerHTML = options["results"][i]["entry_text"];
							p.appendChild(input);
							p.appendChild(label);
							content_right_column1.appendChild(p);
						}
					});
					p = document.createElement("p");
					input = document.createElement("textarea");
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.maxLength = 255;
					input.name = "response_comment";
					input.setAttribute("onfocusout", "verifyTextData(this)");
					input.rows = "2";
					label = document.createElement("label");
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment"
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					p.appendChild(input);
					break;
				case "dropdown":
					var p = document.createElement("p");
					var input = document.createElement("select");
					input.required = true;
					input.id="options-dropdown";
					p.appendChild(input);
					projectContent.appendChild(p);

					var label = document.createElement("label");
					// label.htmlFor = "response_image";
					label.innerHTML = "Response *";
					label.className = "prompt_response";
					content_left_column1.appendChild(label);
					content_right_column1.appendChild(p);
					p.appendChild(input);

					var input_option = document.createElement("option");
					input_option.value = "";
					input_option.id = "default_option";
					input_option.innerHTML = "Select one...";
					input_option.disabled = true;
					input_option.selected = true;
					input.appendChild(input_option);

					await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt["id"] + '/dbmultientry_items', user_id).then(options=>{
						for(var i=0; i< options["count"];i++){
							input_option = document.createElement("option");
							input_option.value = options["results"][i]["entry_text"];
							input_option.id = "option" + options["results"][i]["id"];
							input_option.innerHTML = options["results"][i]["entry_text"];
							input.appendChild(input_option);
						}
					});
					p = document.createElement("p");
					input = document.createElement("textarea");
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.name = "response_comment";
					input.rows = "2";
					input.setAttribute("onfocusout", "verifyTextData(this)");
					input.maxLength = 255;
					label = document.createElement("label");
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment"
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					p.appendChild(input);
					break;
				case "radio":
					await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt["id"] + '/dbmultientry_items', user_id).then(options=>{
						var label = document.createElement("label");
						// label.htmlFor = "response_image";
						label.innerHTML = "Response *";
						label.className = "prompt_response";
						content_left_column1.appendChild(label);
						for(var i=0; i< options["count"];i++){
							var p = document.createElement("p");
							var input = document.createElement("input");
							input.type = "radio";
							input.required = true;
							input.value = options["results"][i]["entry_text"];
							input.id = "option" + options["results"][i]["id"];
							input.name = "option_radio";
							var label = document.createElement("label");
							label.htmlFor = "option" + options["results"][i]["id"];
							label.innerHTML = options["results"][i]["entry_text"];
							content_right_column1.appendChild(p);
							p.appendChild(input);
							p.appendChild(label);
						}
					});
					p = document.createElement("p");
					input = document.createElement("textarea");
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.name = "response_comment";
					input.maxLength = 255;
					input.setAttribute("onfocusout", "verifyTextData(this)");
					input.rows = "2";
					label = document.createElement("label");
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment"
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					p.appendChild(input);
					break;
				case "numeric_entry":
					var p = document.createElement("p");
					var input = document.createElement("input");
					input.id = "response_number";
					input.name = "response_number";
					input.required = true;
					input.type = "number";
					input.step = ".01";
					var label = document.createElement("label");
					label.htmlFor = "response_number";
					label.innerHTML = "Response *";
					label.className = "prompt_response";
					content_left_column1.appendChild(label);
					content_right_column1.appendChild(p);
					p.appendChild(input);

					p = document.createElement("p");
					input = document.createElement("textarea");
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.name = "response_comment";
					input.maxLength = 255;
					input.setAttribute("onfocusout", "verifyTextData(this)");
					input.rows = "2";
					label = document.createElement("label");
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment"
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					p.appendChild(input);
					break;
				case "text_entry":
					var p = document.createElement("p");
					var input = document.createElement("textarea");
					input.id = "response_text";
					input.name = "response_text";
					input.rows = "2";
					input.required = true;
					input.maxLength = 255;
					input.setAttribute("onfocusout", "verifyTextData(this)");
					var label = document.createElement("label");
					label.htmlFor = "response_text";
					label.className = "prompt_response";
					label.innerHTML = "Response *";
					content_left_column1.appendChild(label);
					content_right_column1.appendChild(p);
					p.appendChild(input);

					p = document.createElement("p");
					input = document.createElement("textarea");
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.name = "response_comment";
					input.maxLength = 255;
					input.rows = "2";
					input.setAttribute("onfocusout", "verifyTextData(this)");
					label = document.createElement("label");
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment"
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					p.appendChild(input);

					break;
				case "image":
					var p = document.createElement("p");
					var input = document.createElement("input");
					input.id = "response_image";
					input.name = "response_image";
					input.required = true;
					input.maxLength = 255;
					input.type = "file";
					input.accept = "image/*";
					input.setAttribute("onchange", "fileValidation(event, 'response_image', 'prompt_image" + prompt["id"] + "', '" + "prompt_image_label" + prompt["id"] + "', '" + "prompt_image_delete" + prompt["id"] + "')")
					var label = document.createElement("label");
					label.htmlFor = "response_image";
					label.innerHTML = "Response *";
					label.className = "prompt_response";
					content_left_column1.appendChild(label);
					content_right_column1.appendChild(p);
					p.appendChild(input);

					var new_span = document.createElement("span");
					p.appendChild(new_span);

					p = document.createElement("p");
					input = document.createElement("textarea");
					input.required = true;
					input.maxLength = 255;
					input.id = "response_comment" + data["id"];
					input.className = "response_comment";
					input.name = "response_comment";
					input.setAttribute("onfocusout", "verifyTextData(this)");
					input.rows = "2";
					label = document.createElement("label");
					label.className = "prompt_response";
					label.htmlFor = "response_comment";
					label.innerHTML = "Comment *"
					var new_right = document.createElement("div");
					var new_left = document.createElement("div");
					new_right.className = "right-column";
					new_left.className = "left-column";
					var new_label = document.createElement("label");
					new_label.id = "prompt_image_label" + prompt["id"];
					new_label.style.display = "none";
					var new_image = document.createElement("img");
					new_image.id = "prompt_image" + prompt["id"];
					new_image.className += "prompt_image";
					new_label.appendChild(new_image);
					new_right.appendChild(new_label);

					var new_button = document.createElement("input");
					new_button.type = "button";
					new_button.value = "Remove";
					new_button.style.display = "none";
					new_button.id = "prompt_image_delete" + prompt["id"];
					new_button.className += "delete_image";
					new_button.setAttribute("onclick", "deleteFile('response_image', 'prompt_image" + prompt["id"] + "', '" + "prompt_image_label" + prompt["id"] + "', '" + "prompt_image_delete" + prompt["id"] + "')")
					new_left.appendChild(new_button);
					content_left_column2.appendChild(label);
					content_right_column2.appendChild(p);
					content_right_column1.appendChild(new_right);
					content_right_column1.appendChild(new_left);
					p.appendChild(input);
					break;
			}

		});


	content_right_column1.appendChild(document.createElement("span"));
	content_right_column2.appendChild(document.createElement("span"));

	tab.appendChild(projectTitle);
	tab.appendChild(projectContent);

	projectTitle.appendChild(title_row);
	// title_row.appendChild(title_left_column);
	// title_row.appendChild(title_right_column);

	projectContent.appendChild(content_row0);
	content_row0.appendChild(content_left_column0);
	content_row0.appendChild(content_right_column0);

	projectContent.appendChild(content_row1);
	content_row1.appendChild(content_left_column1);
	content_row1.appendChild(content_right_column1);

	projectContent.appendChild(content_row2);
	content_row2.appendChild(content_left_column2);
	content_row2.appendChild(content_right_column2);

	var project = document.getElementById("project");
	var step_div = document.getElementById("steps");
	var new_span = document.createElement("span");
	new_span.className = "step";
	step_div.appendChild(new_span);

	overflow.parentElement.insertBefore(tab, overflow);

}

        var map;
        var marker = null;
        var pos;



        function getLocation() {
           if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(position => {
                   pos = {
                       lat: position.coords.latitude,
                       lng: position.coords.longitude
                   }
          			console.log(pos);
                   initialize();
               })
           return pos;
           }
           else {
           	alert("Geolocation not supported by browser");
           	return false;
           }
         }


         function initialize() {
          console.log("init");
             var mapOptions = {
                 zoom: 15,
                 disableDefaultUI: true,
                 center: new google.maps.LatLng(pos), //center on sherbrooke
                 mapTypeId: google.maps.MapTypeId.ROADMAP
             };

             $("#coordinate").val(pos.lat + ", " + pos.lng);

             map = new google.maps.Map(document.getElementById('map'), mapOptions);
             marker = new google.maps.Marker({ position: pos, map: map, title: "Your location"})

             google.maps.event.addListener(map, 'click', function(event) {
               //call function to create marker
               $("#coordinate").val(event.latLng.lat() + ", " + event.latLng.lng());
               $("#coordinate").select();

               //delete the old marker
               if (marker) { marker.setMap(null); }

               //creer à la nouvelle emplacement
                marker = new google.maps.Marker({ position: event.latLng, map: map, title: "Your location"});
             });
		loader.style.display = "none";
		document.getElementById('map').style.display = "block";

         }

function yesnoCheck() {

	var i;
	var materials_fields = document.getElementsByClassName("add-location");

	document.getElementById('location-radio-label').classList.remove("invalid");

	if (document.getElementById('location_yes').checked) {
		loader.style.display = "block";
		getLocation();
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

async function submitObservation() {
	var x = document.getElementsByClassName("tab");
	for(var i = 1; i < x.length; i++) {
		var body={};
		var location = "";
		// console.log(x[i].id);
		var prompt_id = x[i].id.split("prompt_tab")[1];
		if (document.getElementById('location_yes').checked) {
			var location = document.getElementById("coordinate").value;
		}
		var y = x[i].getElementsByClassName("prompt_response");
		var an = x[i].getElementsByClassName("response_comment");
		// console.log( y[0].parentElement.nextElementSibling.childNodes[0]);
		var z = y[0].parentElement.nextElementSibling.childNodes;
		console.log(z.length);
		// for(var j = 0; j < z.length; j++) {
			// console.log(prompt_id);
			// console.log(z[j].childNodes[0].value);
			if (z[0].childNodes[0].type == "file"){
				// if (j==0){
					var avatar = z[0].childNodes[0].files[0];
					var avatar_link;
					const formData = new FormData();
					formData.append('avatar', avatar);
					if (avatar != null) {
						await postData('https://wonderbar-cs467.ue.r.appspot.com/upload', formData, user_id).then(data=>{
							avatar_link = data;
							if (location == ""){
								body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": avatar_link["URL"], "additional_notes": an[0].value})

							}
							else {
								body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": avatar_link["URL"], "location": location, "additional_notes": an[0].value})
							}
							postData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations', body, user_id)
						});
					}
				// }
			}
			else if (z[0].childNodes[0].type == "checkbox"){
				for(var j = 0; j < z.length - 1; j++) {

					if (location == ""){
						body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": z[j].childNodes[0].value, "additional_notes": an[0].value})

					}
					else {
						body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": z[j].childNodes[0].value, "location": location, "additional_notes": an[0].value})
					}
					// console.log(body);
					await postData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations', body, user_id);

				}
			}
			else {
				if (location == ""){
					body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": z[0].childNodes[0].value, "additional_notes": an[0].value})

				}
				else {
					body = JSON.stringify({"user_id": parseInt(user_id), "prompt_id": prompt_id, "response": z[0].childNodes[0].value, "location": location, "additional_notes": an[0].value})
				}
				// console.log(body);
				await postData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations', body, user_id);
			}
		// }


	}

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

	function verifyTextData(element, return_val = false) {
	/*
		verify min/max length requirements are met
	*/
		var min_length = element.minLength;
		var max_length = element.maxLength;
		var element_length = element.value.trim().length;
		var valid = true;
		if (currentTab > 0 ){

			if (((element_length < min_length) && min_length >-1) || ((element_length > max_length) && max_length > -1)){
				element.parentElement.nextElementSibling.className = "error-message";
				element.parentElement.nextElementSibling.innerHTML = "Must have between " + element.minLength + " and " + element.maxLength + " characters";
				valid = false;
			}
			else {
				element.parentElement.nextElementSibling.classList.remove("error-message");
				element.parentElement.nextElementSibling.innerHTML = "";
			}
		}
		if (return_val) {
			return valid;
		}
	}

function validateForm() {

	var valid = true;

	x = document.getElementsByClassName("tab");

	y = x[currentTab].querySelectorAll('input[type="text"],textarea');
	for (var i = 0; i < y.length; i++) {
	  // If a field is empty...
	  if ((y[i].value == "" || !verifyTextData(y[i], true)) && y[i].required) {
		// add an "invalid" class to the field:
		if (!(y[i].classList.contains("invalid"))){
			y[i].className += " invalid";
		}
		// and set the current valid status to false
		valid = false;
	  }
	  else {
		y[i].classList.remove("invalid");
	  }
	}


	y = x[currentTab].querySelectorAll( 'input[type="radio"], input[type="checkbox"], input[type="file"], input[type="number"], select');
	for (var i = 0; i < y.length; i++) {
	  // If a field is empty...
	  if ((y[i].value == "") && y[i].required) {
		// add an "invalid" class to the field:
		if (!(y[i].classList.contains("invalid"))){
			y[i].className += " invalid";
		}
		// and set the current valid status to false
		valid = false;
	  }
	  else {
		y[i].classList.remove("invalid");
	  }
	}

	return valid;
}

    async function addProjectUser(project_id, user_id) {
        await add_project_user(project_id, user_id, user_id);
        return true;
    }
