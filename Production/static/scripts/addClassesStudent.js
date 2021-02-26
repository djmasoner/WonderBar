

			const statusCheck = response => {
				if (response.status >= 200 && response.status < 300) {
					return Promise.resolve(response)
				}
				return Promise.reject(new Error(response.statusText))
			}
			const json = response => response.json()

			window.onload = loadClasses;

			 function loadClasses(get_current = true) {
				var user_id = document.getElementById('user_id').value
				var tableID = 'available-classes-table'
				var table = document.getElementById(tableID);
				table.getElementsByTagName('tbody')[0].remove();
				var tbody = document.createElement("tbody");
				table.append(tbody);

				let reqHeader = new Headers();
				reqHeader.append('Content-Type', 'application/json');
				reqHeader.append('Authorization', 'Bearer ' + user_id);

				let initObject = {
					method: 'GET', headers: reqHeader
				};

				var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbschoolclasses", initObject);

				 fetch(userRequest)
				.then(statusCheck)
				.then(json)
				.then(async data => {
					var classCount = data["count"];
					for (var i = 0; i < classCount; i++){
						var row = table.getElementsByTagName('tbody')[0].insertRow();
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

				})
				.catch(function (err) {
						console.log("Something went wrong!", err);
				});
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

			if (wb_classCount == 11) {
				alert('No more than 10 classes');
			}
			else {

				var row = tableFrom.rows[i];
				var id = row.cells[1].childNodes[0].id
				var chkbox = row.cells[0].childNodes[0];
				var class_code = row.cells[1].childNodes[0].innerText;
				var class_name = row.cells[2].childNodes[0].innerText;
				var class_teacher = row.cells[3].childNodes[0].innerText;
				if(null != chkbox && true == chkbox.checked) {

					let reqHeader = new Headers();
					reqHeader.append('Content-Type', 'application/json');
					reqHeader.append('Authorization', 'Bearer ' + user_id);

					let initObject = {
						method: 'PUT', headers: reqHeader
					};

					var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + id, initObject);

					 await fetch(userRequest)
					.then(statusCheck)
					.then(json)
					.then(data => {

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

						let reqHeader = new Headers();
						reqHeader.append('Content-Type', 'application/json');
						reqHeader.append('Authorization', 'Bearer ' + user_id);

						let initObject = {
							method: 'GET', headers: reqHeader
						};

						var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + id + "/dbprojects", initObject);

						 fetch(userRequest)
						.then(statusCheck)
						.then(json)
						.then(data => {
							projectCount = data["count"];
							p.innerHTML = "Suggested Project Count: " + data["count"];
							for (var i=0; i <projectCount; i++){
								var element2 = document.createElement("p");
								element2.innerHTML = " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/projects/" + data["results"][i]["id"] + "'>"  + data["results"][i]["name"]  + "</a>";
								content_div.appendChild(element2);
							}

						})
						.catch(function (err) {
								console.log("Something went wrong!", err);
						});
					})
					.catch(function (err) {
							
							console.log("Something went wrong!", err);
					});
				}
			}
		}
	}


	function deleteClass(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);
		var wb_classContent = document.getElementById("wb_classdiv" + wb_classNum);
		var wb_classDelete = document.getElementById("delwb_class" + wb_classNum);
		// wb_class.remove()

		var user_id = document.getElementById('user_id').value

		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
			method: 'DELETE', headers: reqHeader
		};

		var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + wb_classNum, initObject);

		 fetch(userRequest)
		.then(statusCheck)
		.then(data => {
			wb_classContent.remove();
			wb_class.remove();
			wb_classDelete.remove();
			loadClasses(false);
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
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
			



			 function getMyClasses(tableID) {
				var user_id = document.getElementById('user_id').value
				var wb_class_div = document.getElementById("added-classes-div");

				let reqHeader = new Headers();
				reqHeader.append('Content-Type', 'application/json');
				reqHeader.append('Authorization', 'Bearer ' + user_id);

				let initObject = {
					method: 'GET', headers: reqHeader
				};

				var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses", initObject);

				 fetch(userRequest)
				.then(statusCheck)
				.then(json)
				.then(async data => {
					var classCount = data["count"];
					for (var i = 0; i < classCount; i++){
						var teacher;
						let reqHeader = new Headers();
						reqHeader.append('Content-Type', 'application/json');
						reqHeader.append('Authorization', 'Bearer ' + user_id);

						let initObject = {
							method: 'GET', headers: reqHeader
						};

						var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + data["results"][i]["teacher_id"], initObject);

						await fetch(userRequest)
						.then(statusCheck)
						.then(json)
						.then(data => {
							teacher = data["title"] + data["last_name"];

						})
						.catch(function (err) {
								console.log("Something went wrong!", err);
						});

						var collapsible_button = document.createElement("button");
						collapsible_button.type = "button";
						collapsible_button.className = "collapsible";
						collapsible_button.innerHTML= '<p>' + data["results"][i]["name"] + "-" + data["results"][i]["class_code"] + "(" + teacher + ")" + '</p><span class="deleteWB_Class" id="delwb_class' + data["results"][i]["id"] + '" onClick="javascript: deleteClass(' +  data["results"][i]["id"]  + ');" + ">x</span>';
						collapsible_button.id = "wb_class" + data["results"][i]["id"] ;
						collapsible_button.setAttribute( "onClick", "javascript: showCollapsible(" + data["results"][i]["id"]  + ");" );


						var content_div = document.createElement("div");
						content_div.className = "collapsible-content";
						content_div.id = "wb_classdiv" + data["results"][i]["id"] ;

						var p = document.createElement("p");

						wb_class_div.appendChild(collapsible_button);
						wb_class_div.appendChild(content_div);

						content_div.appendChild(p);

						let reqHeader2 = new Headers();
						reqHeader2.append('Content-Type', 'application/json');
						reqHeader2.append('Authorization', 'Bearer ' + user_id);

						let initObject2 = {
							method: 'GET', headers: reqHeader2
						};

						var userRequest2 = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + data["results"][i]["id"]  + "/dbprojects", initObject2);

						await fetch(userRequest2)
						.then(statusCheck)
						.then(json)
						.then(data => {
							projectCount = data["count"];
							p.innerHTML = "Suggested Project Count: " + data["count"];
							for (var i=0; i <projectCount; i++){
								var element2 = document.createElement("p");
								element2.innerHTML = " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/projects/" + data["results"][i]["id"] + "'>"  + data["results"][i]["name"]  + "</a>";
								content_div.appendChild(element2);
							}

						})
						.catch(function (err) {
								console.log("Something went wrong!", err);
						});
					}
				})
				.catch(function (err) {
						
						console.log("Something went wrong!", err);
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

