var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

			function loadClasses() {
				var user_id = document.getElementById('user_id').value
				// console.log (user_id)
				var xhttp = new XMLHttpRequest();
				var myArr;
				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						myArr = JSON.parse(this.responseText)
																			// console.log("got Class");
						var tableID = 'dataTable'
						var table = document.getElementById(tableID);
			
			
						if (myArr["count"] > 0) {
							tableRowCount = myArr["count"]
							var enrollmentCount;
							for(var i=0; i<tableRowCount; i++) {
			
								var xhttp2 = new XMLHttpRequest();
								var myArr2;


								xhttp2.onreadystatechange = (function(x, i) {
									return function() {
										if (this.readyState == 4 && this.status == 200) {
																				// console.log("got Enrollments");
											myArr2 = JSON.parse(this.responseText);
											enrollmentCount = myArr2["count"];

											var row = table.getElementsByTagName('tbody')[0].insertRow();
											var cell1 = row.insertCell(0);
											var element1 = document.createElement("input");
											element1.type = "checkbox";
											element1.name="chkbox" + i;
											element1.setAttribute( "onClick", "javascript: allSelected('" + tableID + "');" );
											cell1.appendChild(element1);

											var cell2 = row.insertCell(1);
											var element2 = document.createElement("p");
											element2.id = myArr["results"][i]["id"]
											// element2.type = "text";
											element2.name = "classcode" + i;
											element2.innerText = myArr["results"][i]["class_code"]
											cell2.appendChild(element2);

											var cell3 = row.insertCell(2);
											var element3 = document.createElement("p");
											// element3.type = "text";
											element3.name = "classname" + i;
											element3.innerText = myArr["results"][i]["name"]
											cell3.appendChild(element3);


											var cell4 = row.insertCell(3);
											var element4 = document.createElement("a");
											// element3.type = "text";
											element4.name = "enrollmentCount" + i;
											element4.innerText = enrollmentCount
											element4.href = "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers"
											cell4.appendChild(element4);
										}
									}
								})(myArr, i);

								// xhttp2.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers" , true);
								xhttp2.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers" , true);
								xhttp2.setRequestHeader('Authorization', 'Bearer ' + 'abc');
								xhttp2.send();
							}
						}
			
					}
				};
				// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses" , true);
				xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses" , true);
				xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
				xhttp.send();
			}
			
			window.onload = loadClasses;

			function addClass(tableID) {
				var user_id = document.getElementById('user_id').value
				var class_code = document.getElementById('class_code').value
				var class_name = document.getElementById('class_name').value
				var class_id;
				var table = document.getElementById(tableID);
				var rowCount = table.rows.length;

				if (rowCount == 11) {
					alert('No more than 10 classes');
				}
				else {
					// alert("https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses")
					var xhttp = new XMLHttpRequest();
					var myArr;
					xhttp.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 201) {
							// loadClasses();
							addRow(tableID, JSON.parse(this.responseText)["id"], class_code, class_name, class_id)
							document.getElementById('class_code').value = ""
							document.getElementById('class_name').value = ""
						}
					};
					// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
					xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses" , true);
					// xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/1/dbclasses" , true);
					xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
					xhttp.setRequestHeader("Content-Type", "application/json");
					xhttp.send(JSON.stringify({class_code:class_code, name:class_name}));
					// xhttp.send();
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
				// console.log(rowCount)
				// if (rowCount == 11) {
				// 	alert('No more than 10 classes');
				// }
				// else {
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
			
			function deleteRow(tableID) {
				document.getElementById('id01').style.display='none'
				try {
				var table = document.getElementById(tableID);
				var rowCount = table.rows.length;

				for(var i=1; i<rowCount; i++) {
					var row = table.rows[i];
					var id = row.cells[1].childNodes[0].id
					var chkbox = row.cells[0].childNodes[0];
					if(null != chkbox && true == chkbox.checked) {



					var xhttp = new XMLHttpRequest();
					var myArr;
					xhttp.onreadystatechange = (function(i, rowCount) {
						return function() {
						if (this.readyState == 4 && this.status == 204) {
							// loadClasses();
							// addRow(tableID, JSON.parse(this.responseText)["id"], class_code, class_name, class_id)
							// document.getElementById('class_code').value = ""
							// document.getElementById('class_name').value = ""

							table.deleteRow(i);
							rowCount--;
							i--;
										}
									}
								})(i, rowCount);
					// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
					xhttp.open("DELETE", "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + id , true);
					// xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/1/dbclasses" , true);
					xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
					xhttp.setRequestHeader("Content-Type", "application/json");
					xhttp.send(JSON.stringify({class_code:class_code, name:class_name}));



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
			
			
		