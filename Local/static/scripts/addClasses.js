
			const statusCheck = response => {
				if (response.status >= 200 && response.status < 300) {
					return Promise.resolve(response)
				}
				return Promise.reject(new Error(response.statusText))
			}

			const json = response => response.json()

			window.onload = loadClasses;


			 function loadClasses() {
				var user_id = document.getElementById('user_id').value
				var wb_class_div = document.getElementById("added-classes-div");
				var wb_classCount = document.getElementsByClassName("collapsible-content").length;


				let reqHeader = new Headers();
				reqHeader.append('Content-Type', 'application/json');
				reqHeader.append('Authorization', 'Bearer ' + user_id);

				let initObject = {
					method: 'GET' /*, headers: reqHeader*/
				};

				var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses", initObject);

				 fetch(userRequest)
				.then(statusCheck)
				.then(json)
				.then(async data => {
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


						let reqHeader = new Headers();
						reqHeader.append('Content-Type', 'application/json');
						reqHeader.append('Authorization', 'Bearer ' + user_id);

						let initObject = {
							method: 'GET' /*, headers: reqHeader*/
						};

						var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + data["results"][i]["id"] + "/dbusers?order_by=last_name", initObject);

						await fetch(userRequest)
						.then(statusCheck)
						.then(json)
						.then(data => {
							enrollmentCount = data["count"];
							p.innerHTML = "Enrollment Count: " + data["count"];
							for (var i=0; i <enrollmentCount; i++){
								var element2 = document.createElement("p");
								element2.innerHTML = data["results"][i]["first_name"] + " "+ data["results"][i]["last_name"] + " <a target=\"_blank\" href='https://wonderbar-cs467.ue.r.appspot.com/user/" + data["results"][i]["id"] + "'>("  + data["results"][i]["username"]  + ")</a>";
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

	function deleteWB_Class(wb_classNum) {
		var wb_class = document.getElementById("wb_class" + wb_classNum);
		var wb_classContent = document.getElementById("wb_classdiv" + wb_classNum);
		var wb_classDelete = document.getElementById("delwb_class" + wb_classNum);
		// wb_class.remove()

		var user_id = document.getElementById('user_id').value

		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');
		reqHeader.append('Authorization', 'Bearer ' + user_id);

		let initObject = {
			method: 'DELETE' /*, headers: reqHeader*/
		};

		var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses/" + wb_classNum, initObject);

		 fetch(userRequest)
		.then(statusCheck)
		.then(data => {
			wb_classContent.remove();
			wb_class.remove();
			wb_classDelete.remove();
		})
		.catch(function (err) {
				console.log("Something went wrong!", err);
		});
	}

	function addClass() {
		var wb_class_div = document.getElementById("added-classes-div");
		var wb_classCount = document.getElementsByClassName("collapsible-content").length;
		wb_class_div.style.display = "block";
		var class_code = document.getElementById('class_code').value
		var class_name = document.getElementById('class_name').value
		var user_id = document.getElementById('user_id').value


		if (wb_classCount == 11) {
			alert('No more than 10 classes');
		}
		else {


			let reqHeader = new Headers();
			reqHeader.append('Content-Type', 'application/json');
			reqHeader.append('Authorization', 'Bearer ' + user_id);

			let initObject = {
				method: 'POST', body: JSON.stringify({class_code:class_code, name:class_name} /*, headers: reqHeader */)
			};

			var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses", initObject);

			 fetch(userRequest)
			.then(statusCheck)
			.then(json)
			.then(data => {

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


				let reqHeader = new Headers();
				reqHeader.append('Content-Type', 'application/json');
				reqHeader.append('Authorization', 'Bearer ' + user_id);

				let initObject = {
					method: 'GET' /*, headers: reqHeader*/
				};

				var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + data["id"] + "/dbusers?order_by=last_name", initObject);

				 fetch(userRequest)
				.then(statusCheck)
				.then(json)
				.then(data => {
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

			function allSelected(tableID) {
			
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
					document.getElementById('selectAll').checked = true
				}
				else {
					document.getElementById('selectAll').checked = false
				}
			}
			
			function addRow(tableID, id=null, code=null, name=null) {
			
				var table = document.getElementById(tableID);
			
				var rowCount = table.rows.length;
				var row = table.getElementsByTagName('tbody')[0].insertRow(rowCount-1);

				var cell1 = row.insertCell(0);
				var element1 = document.createElement("input");
				element1.type = "checkbox";
				element1.name="chkbox" + rowCount;
				element1.setAttribute( "onClick", "javascript: allSelected('" + tableID + "');" );
				cell1.appendChild(element1);

				var cell2 = row.insertCell(1);
				var element2 = document.createElement("p");
				element2.id = id
				element2.name = "classcode" + rowCount;
				element2.innerText = code
				cell2.appendChild(element2);

				var cell3 = row.insertCell(2);
				var element3 = document.createElement("p");
				element3.name = "classname" + rowCount;
				element3.innerText = name
				cell3.appendChild(element3);

				var cell4 = row.insertCell(3);
				var element4 = document.createElement("a");
				element4.name = "enrollmentCount" + rowCount;
				element4.innerText = "0";
				element4.href = "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + id + "/dbusers"
				cell4.appendChild(element4);
			}
			
			async function deleteRow(tableID) {
				document.getElementById('id01').style.display='none'
				try {
				var table = document.getElementById(tableID);
				var rowCount = table.rows.length;
				console.log(rowCount);
				if (rowCount == 1) {
					table.style.display = "none";
				}
				else {
					table.style.display = "table";
				}
				for(var i=rowCount - 1; i>0; i--) {
					var row = table.rows[i];
					var id = row.cells[1].childNodes[0].id
					var chkbox = row.cells[0].childNodes[0];
					if(null != chkbox && true == chkbox.checked) {



						let reqHeader = new Headers();
						reqHeader.append('Content-Type', 'application/json');
						reqHeader.append('Authorization', 'Bearer ' + user_id);

						let initObject = {
							method: 'DELETE' /*, headers: reqHeader*/
						};

						var userRequest = new Request('https://wonderbar-cs467.ue.r.appspot.com/dbclasses/' + id, initObject);

						await fetch(userRequest)
						.then(statusCheck)
						.then(data => {
								table.deleteRow(i);
								console.log("deleted row " + i);
						})
						.catch(function (err) {
								console.log("Something went wrong!", err);
						});

					}
					rowCount = table.rows.length;
					if (rowCount == 1) {
						document.getElementById('selectAll').checked = false
					}
			
				}
				}catch(e) {
					console.log(e);
				}
			}
			
			function selectAllClasses(tableID) {
				var table = document.getElementById(tableID);
				var rowCount = table.rows.length;
				var all = (document.getElementById('selectAll').checked == true)
				for(var i=1; i<rowCount; i++) {
					var row = table.rows[i];
					var chkbox = row.cells[0].childNodes[0];
					if (all) {
						chkbox.checked = true;
					}
					else {
						chkbox.checked = false;
					}
				}
			}
			
