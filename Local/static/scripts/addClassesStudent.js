

	window.onload = loadClasses;



	 async function loadClasses(get_current = true) {
		var user_id = document.getElementById('user_id').value
		var tableID = 'available-classes-table'
		var table = document.getElementById(tableID);
		table.getElementsByTagName('tbody')[0].remove();
		var tbody = document.createElement("tbody");
		table.append(tbody);


		await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbschoolclasses", user_id).then(async data =>{
			if(data){
				var classCount = data["count"];
				for (var i = 0; i < classCount; i++){
					var row = table.getElementsByTagName('tbody')[0].insertRow();
					row.setAttribute("onclick", "clickCB(this)");
					var cell1 = row.insertCell(0);
					var element1 = document.createElement("input");
					element1.type = "checkbox";
					element1.name="chkbox" + i;
					element1.setAttribute( "onClick", "javascript: allSelected('" + tableID + "', 'selectAll');" );
					cell1.appendChild(element1);

					var cell2 = row.insertCell(1);
					var element2 = document.createElement("p");
					element2.id = data["results"][i]["id"]
					// element2.type = "text";
					element2.name = "classcode" + i;
					element2.innerText = data["results"][i]["class_code"]
					cell2.appendChild(element2);

					var cell3 = row.insertCell(2);
					var element3 = document.createElement("p");
					// element3.type = "text";
					element3.name = "classname" + i;
					element3.innerText = data["results"][i]["name"]
					cell3.appendChild(element3);


					var cell4 = row.insertCell(3);
					var element4 = document.createElement("p");
					// element3.type = "text";
					element4.name = "teacher" + i;
					element4.innerText = data["results"][i]["title"] + ' ' + data["results"][i]["last_name"]
					// element4.href = "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers"
					cell4.appendChild(element4);
				}
				if (get_current){
					getMyClasses('added-classes-table');
				}
	}
		});
	}


	function clickCB(element) {
		element.cells[0].childNodes[0].click();
	}

	function allSelected(tableID, chkboxID) {
	
		var table = document.getElementById(tableID);
		var rowCount = table.rows.length;
		var chkboxCount = 0;
		for(var i=1; i<rowCount; i++) {
			var row = table.rows[i];
			var chkbox = row.cells[0].childNodes[0];
			if (chkbox.checked == true) {
				chkboxCount++;
			}
		}
	
		if (chkboxCount == rowCount) {
			document.getElementById(chkboxID).checked = true
		}
		else {
			document.getElementById(chkboxID).checked = false
		}
	}


	async function addClass(tableFromID) {
		var wb_class_div = document.getElementById("added-classes-div");
		var wb_classCount = document.getElementsByClassName("collapsible-content").length;
		wb_class_div.style.display = "block";
		var user_id = document.getElementById('user_id').value

		var tableFrom = document.getElementById(tableFromID);
		var rowCount = tableFrom.rows.length;
		var user_id = document.getElementById('user_id').value;

		for(var i=rowCount - 1; i>0; i--) {
			wb_classCount = document.getElementsByClassName("collapsible-content").length;

			if (wb_classCount == 10) {
				alert('You can be in no more than 10 classes at one time! Delete some of your older classes and try again.');
				return;
			}
			else {

				var row = tableFrom.rows[i];
				var id = row.cells[1].childNodes[0].id
				var chkbox = row.cells[0].childNodes[0];
				var class_code = row.cells[1].childNodes[0].innerText;
				var class_name = row.cells[2].childNodes[0].innerText;
				var class_teacher = row.cells[3].childNodes[0].innerText;
				if(null != chkbox && true == chkbox.checked) {
					await putData("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + id, user_id).then(async data => {
						if (data) {
							var collapsible_button = document.createElement("button");
							collapsible_button.type = "button";
							collapsible_button.className = "collapsible";
							collapsible_button.innerHTML= '<p>' + class_name + " - " + class_code+ "(" + class_teacher + ")" + '</p><span class="deleteWB_Class" id="delwb_class' + id + '" onClick="javascript: deleteClass(' +  id + ');" + ">x</span>';
							collapsible_button.id = "wb_class" + id;
							collapsible_button.setAttribute( "onClick", "javascript: showCollapsible(" + id + ");" );


							var content_div = document.createElement("div");
							content_div.className = "collapsible-content";
							content_div.id = "wb_classdiv" + id;

							var p = document.createElement("p");

							wb_class_div.appendChild(collapsible_button);
							wb_class_div.appendChild(content_div);

							content_div.appendChild(p);
							row.remove();
							document.getElementById("selectAll").checked = false;

							await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + id + "/dbprojects", user_id).then(data=>{
								if (data) {
									projectCount = data["count"];
									p.innerHTML = "Suggested Project Count: " + data["count"];
									for (var i=0; i <projectCount; i++){
										var element2 = document.createElement("p");
										element2.innerHTML = " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/projects?" + data["results"][i]["id"] + "'>"  + data["results"][i]["name"]  + "</a>";
										content_div.appendChild(element2);
									}
								}
							});
						}
					});
				}
			}
		}
	}



	async function deleteClass(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);
		var wb_classContent = document.getElementById("wb_classdiv" + wb_classNum);
		var wb_classDelete = document.getElementById("delwb_class" + wb_classNum);
		// wb_class.remove()

		var user_id = document.getElementById('user_id').value
		await deleteData("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + wb_classNum, user_id).then(data=>{
			if (data) {
				wb_classContent.remove();
				wb_class.remove();
				wb_classDelete.remove();
				loadClasses(false);
			}
		});
	}


	function selectAllClasses(tableID, cb_id) {
		var table = document.getElementById(tableID);
		var rowCount = table.rows.length;
		var all = (document.getElementById(cb_id).checked == true)
		for(var i=1; i<rowCount; i++) {
			var row = table.rows[i];
			var chkbox = row.cells[0].childNodes[0];
			if (all) {
				if (row.style.display == ""){
					chkbox.checked = true;
				}
			}
			else {
				if (row.style.display == ""){
					chkbox.checked = false;
				}
			}
		}
	}



	 async function getMyClasses(tableID) {
		var user_id = document.getElementById('user_id').value
		var wb_class_div = document.getElementById("added-classes-div");



		await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses" ,user_id).then(async data=>{
			if (data){
				var classCount = data["count"];
				if (classCount == 0) {
					document.getElementById("wb_class0").click();
				}
				for (var i = 0; i < classCount; i++){
					var class_id = data["results"][i]["id"];
					var class_name = data["results"][i]["name"];
					var class_code = data["results"][i]["class_code"];

					var collapsible_button = document.createElement("button");
					collapsible_button.type = "button";
					collapsible_button.className = "collapsible";
					collapsible_button.id = "wb_class" + class_id ;
					collapsible_button.setAttribute( "onClick", "javascript: showCollapsible(" + class_id  + ");" );


					var content_div = document.createElement("div");
					content_div.className = "collapsible-content";
					content_div.id = "wb_classdiv" + class_id ;

					var p = document.createElement("p");

					wb_class_div.appendChild(collapsible_button);
					wb_class_div.appendChild(content_div);

					content_div.appendChild(p);

					await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + data["results"][i]["teacher_id"] ,user_id).then(data=>{
						if (data){
							var teacher;
							teacher = data["title"] + ' ' + data["last_name"];
							return teacher;
						}
					}).then(teacher =>{
						collapsible_button.innerHTML= '<p>' + class_name + "-" + class_code + "(" + teacher + ")" + '</p><span class="deleteWB_Class" id="delwb_class' + class_id + '" onClick="javascript: deleteClass(' +  class_id  + ');" + ">x</span>';
					});

					await fetchData("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + class_id  + "/dbprojects", user_id).then(data=>{
						projectCount = data["count"];
						p.innerHTML = "Suggested Project Count: " + data["count"];
						for (var i=0; i <projectCount; i++){
							var element2 = document.createElement("p");
							element2.innerHTML = " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/viewProject?" + class_id + "'>"  + class_name  + "</a>";
							content_div.appendChild(element2);
						}

					});
				}
			}
		})

	}


	function showCollapsible(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);

		var content = wb_class.nextElementSibling;
		if (content.style.display === "block") {
			content.style.display = "none";
			wb_class.classList.remove("active-collapsible");
			wb_class.className += " collapsible";
		} else {
			content.style.display = "block";
			wb_class.classList.remove("collapsible");
			wb_class.className += " active-collapsible";
		}
	}


	function closeCollapsibles() {
		var wb_class = document.getElementsByClassName("active-collapsible")
		var wb_classCount = wb_class.length;

		for (var i = 0; i < wb_classCount; i++){
			var wb_class = wb_class[i];

			wb_class.nextElementSibling.style.display = "none";
			wb_class.classList.remove("collapsible-content");
			wb_class.className += " collapsible-content";


		}
	}


function myFunction(inputname, tableID) {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById(inputname);
  filter = input.value.toUpperCase();
  table = document.getElementById(tableID);
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td1 = tr[i].getElementsByTagName("td")[1];
    td2 = tr[i].getElementsByTagName("td")[2];
    td3 = tr[i].getElementsByTagName("td")[3];
    if (td1 || td2 || td3) {
      txtValue1 = td1.textContent || td1.innerText;
      txtValue2 = td2.textContent || td2.innerText;
      txtValue3 = td3.textContent || td3.innerText;
      if (txtValue1.toUpperCase().indexOf(filter) > -1 || txtValue2.toUpperCase().indexOf(filter) > -1 || txtValue3.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

