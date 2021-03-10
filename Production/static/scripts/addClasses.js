

	window.onload = loadClasses;


	 async function loadClasses() {
		var user_id = document.getElementById('user_id').value
		var wb_class_div = document.getElementById("added-classes-div");
		var wb_classCount = document.getElementsByClassName("collapsible-content").length;

		await get_teacher_classes(user_id, user_id).then(async data =>{
			var classCount = data["count"];
			for (var i = 0; i < classCount; i++){
				var collapsible_button = document.createElement("button");
				collapsible_button.type = "button";
				collapsible_button.className = "collapsible";
				collapsible_button.innerHTML= data["results"][i]["name"] + " (" + data["results"][i]["class_code"] + ")" +'<span class="deleteWB_Class" id="delwb_class' + data["results"][i]["id"] + '" onClick="javascript: deleteWB_Class(' +  data["results"][i]["id"] + ');" + ">x</span>';
				collapsible_button.id = "wb_class" + data["results"][i]["id"];
				collapsible_button.setAttribute( "onClick", "javascript: showCollapsible(" + data["results"][i]["id"] + ");" );


				var content_div = document.createElement("div");
				content_div.className = "collapsible-content";
				content_div.id = "wb_classdiv" + data["results"][i]["id"];

				var p = document.createElement("p");

				wb_class_div.appendChild(collapsible_button);
				wb_class_div.appendChild(content_div);

				content_div.appendChild(p);

				await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + data["results"][i]["id"] + "/dbusers?order_by=last_name", user_id).then( data=>{
					enrollmentCount = data["count"];
					p.innerHTML = "Enrollment Count: " + data["count"];
					for (var i=0; i <enrollmentCount; i++){
						var element2 = document.createElement("p");
						element2.innerHTML = data["results"][i]["first_name"] + " "+ data["results"][i]["last_name"] + " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/profile?" + data["results"][i]["id"] + "'>("  + data["results"][i]["username"]  + ")</a>";
						content_div.appendChild(element2);
					}

				});
			}

		});
	}


	function showCollapsible(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);

		var content = wb_class.nextElementSibling;
		if (content.style.display === "block") {
			content.style.display = "none";
			wb_class.className = "collapsible";
		} else {
			content.style.display = "block";
			wb_class.className = "active-collapsible";
		}
	}


	function closeCollapsibles() {
		var wb_class = document.getElementsByClassName("active-collapsible")
		var wb_classCount = wb_class.length;

		for (var i = 0; i < wb_classCount; i++){
			var wb_class = wb_class[i];

			wb_class.nextElementSibling.style.display = "none";
			wb_class.className = "collapsible-content";


		}
	}

	async function deleteWB_Class(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);
		var wb_classContent = document.getElementById("wb_classdiv" + wb_classNum);
		var wb_classDelete = document.getElementById("delwb_class" + wb_classNum);
		// wb_class.remove()

		var user_id = document.getElementById('user_id').value
		await deleteData("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses/" + wb_classNum, user_id).then(data=>{
			if (data) {
				wb_classContent.remove();
				wb_class.remove();
				wb_classDelete.remove();
			}
		});
	}

	async function addClass() {
		if (!validateForm()) return false;
		var wb_class_div = document.getElementById("added-classes-div");
		var wb_classCount = document.getElementsByClassName("collapsible-content").length;
		wb_class_div.style.display = "block";
		var class_code = document.getElementById('class_code').value
		var class_name = document.getElementById('class_name').value
		var user_id = document.getElementById('user_id').value


		await postData("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses", JSON.stringify({class_code:class_code, name:class_name}), user_id).then(async data=>{
			if (data) {

				var collapsible_button = document.createElement("button");
				collapsible_button.type = "button";
				collapsible_button.className = "collapsible";
				collapsible_button.innerHTML= class_name + " (" + class_code + ")" + '<span class="deleteWB_Class" id="delwb_class' + data["id"] + '" onClick="javascript: deleteWB_Class(' +  data["id"] + ');" + ">x</span>';
				collapsible_button.id = "wb_class" + data["id"];
				collapsible_button.setAttribute( "onClick", "javascript: showCollapsible(" + data["id"] + ");" );


				var content_div = document.createElement("div");
				content_div.className = "collapsible-content";
				content_div.id = "wb_classdiv" + data["id"];

				var p = document.createElement("p");

				wb_class_div.appendChild(collapsible_button);
				wb_class_div.appendChild(content_div);

				content_div.appendChild(p);


				await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + data["id"] + "/dbusers?order_by=last_name", user_id).then( data=>{
					if (data) {
						enrollmentCount = data["count"];
						p.innerHTML = "Enrollment Count: " + data["count"];
						for (var i=0; i <enrollmentCount; i++){
							var element1 = document.getElementById(wb_classCount +1);
							var element2 = document.createElement("p");
							element2.innerHTML = data["results"][i]["first_name"] + " "+ data["results"][i]["last_name"] + " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/user/" + data["results"][i]["id"] + "'>("  + data["results"][i]["username"]  + ")</a>";
							element1.appendChild(element2);
						}

						document.getElementById('class_code').value = ""
						document.getElementById('class_name').value = ""
					}
				});
			}
		});
	}

	function verifyTextData(element, return_val = false) {
	/*
		verify min/max length requirements are met
	*/
		var min_length = element.minLength;
		var max_length = element.maxLength;
		var element_length = element.value.trim().length;
		var valid = true;


		if (((element_length < min_length) && min_length >-1) || ((element_length > max_length) && max_length > -1)){
			element.parentElement.nextElementSibling.className = "error-message";
			element.parentElement.nextElementSibling.innerHTML = "Must have between " + element.minLength + " and " + element.maxLength + " characters";
			valid = false;
		}
		else {
			element.parentElement.nextElementSibling.classList.remove("error-message");
			element.parentElement.nextElementSibling.innerHTML = "";
		}
		if (return_val) {
			return valid;
		}
	}

function validateForm() {

	var valid = true;

	x = document.getElementsByClassName("add-class-form");

	y = x[0].querySelectorAll('input[type="text"],textarea');
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

	return valid;
}
