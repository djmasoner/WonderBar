var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

			function loadClasses() {
				var user_id = document.getElementById('user_id').value



				// var new_tbody = document.createElement('tbody');
				// populate_with_new_rows(new_tbody);
				// old_tbody.parentNode.replaceChild(new_tbody, old_tbody)


				// console.log (user_id)
				getMyClasses('myClassTable');
				var xhttp = new XMLHttpRequest();
				var myArr;
				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						myArr = JSON.parse(this.responseText)
																			// console.log("got Class");
						var tableID = 'dataTable'
						var table = document.getElementById(tableID);
				
						var new_tbody = document.createElement('tbody');
						table.getElementsByTagName('tbody')[0].parentNode.replaceChild(new_tbody, table.getElementsByTagName('tbody')[0]);

						if (myArr["count"] > 0) {
							tableRowCount = myArr["count"]
							var enrollmentCount;
							for(var i=0; i<tableRowCount; i++) {

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
									var element4 = document.createElement("p");
									// element3.type = "text";
									element4.name = "teacher" + i;
									element4.innerText = myArr["results"][i]["title"] + ' ' + myArr["results"][i]["last_name"]
									// element4.href = "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers"
									cell4.appendChild(element4);
							}
						}

					}
				};
				// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + user_id + "/dbclasses" , true);
				xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbschoolclasses" , true);
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
			
			function addClass(tableID) {
				// document.getElementById('id01').style.display='none'
				try {
					var table = document.getElementById(tableID);
					var rowCount = table.rows.length;
					var user_id = document.getElementById('user_id').value;

					for(var i=1; i<rowCount; i++) {
						var row = table.rows[i];
						var id = row.cells[1].childNodes[0].id
						var chkbox = row.cells[0].childNodes[0];
						if(null != chkbox && true == chkbox.checked) {


						var xhttp = new XMLHttpRequest();
						var myArr;
						xhttp.onreadystatechange = (function(user_id, id) {
							return function() {

								if (this.readyState == 4 && this.status == 201) {

									loadClasses();
								}
							

							}
						})(user_id, id);
						// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
						xhttp.open("PUT", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + id , true);
						// xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/1/dbclasses" , true);
						xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
						xhttp.setRequestHeader("Content-Type", "application/json");
						xhttp.send();
						// xhttp.send(JSON.stringify({class_code:class_code, name:class_name}));
						}
					}
				}catch(e) {
					console.log(e);
				}
			}


			function deleteClass(tableID) {
				// document.getElementById('id01').style.display='none'
				try {
					var table = document.getElementById(tableID);
					var rowCount = table.rows.length;
					var user_id = document.getElementById('user_id').value;

					for(var i=1; i<rowCount; i++) {
						var row = table.rows[i];
						var id = row.cells[1].childNodes[0].id
						var chkbox = row.cells[0].childNodes[0];
						if(null != chkbox && true == chkbox.checked) {


						var xhttp = new XMLHttpRequest();
						var myArr;
						xhttp.onreadystatechange = (function(user_id, id) {
							return function() {

								if (this.readyState == 4 && this.status == 204) {

									loadClasses();

								}
							}
						})(user_id, id);
						// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
						xhttp.open("DELETE", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses/" + id , true);
						// xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/1/dbclasses" , true);
						xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
						xhttp.setRequestHeader("Content-Type", "application/json");
						xhttp.send();
						// xhttp.send(JSON.stringify({class_code:class_code, name:class_name}));
						}
					}
				}catch(e) {
					console.log(e);
				}
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
				// document.getElementById('id01').style.display='none'
				try {
					var user_id = document.getElementById('user_id').value;
					var myArr;
						var xhttp = new XMLHttpRequest();
						xhttp.onreadystatechange = (function(user_id) {
							return function() {
								if (this.readyState == 4 && this.status == 200) {
									myArr = JSON.parse(this.responseText)

									var table = document.getElementById(tableID);
									var new_tbody = document.createElement('tbody');
									table.getElementsByTagName('tbody')[0].parentNode.replaceChild(new_tbody, table.getElementsByTagName('tbody')[0]);

									if (myArr["count"] > 0) {
										tableRowCount = myArr["count"]
										for(var i=0; i<tableRowCount; i++) {


											var xhttp2 = new XMLHttpRequest();
											var myArr2;


											xhttp2.onreadystatechange = (function(x, i) {
												return function() {
													if (this.readyState == 4 && this.status == 200) {
														myArr2 = JSON.parse(this.responseText);

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
														element2.name = "classcode" + i;
														element2.innerText = myArr["results"][i]["class_code"]
														cell2.appendChild(element2);

														var cell3 = row.insertCell(2);
														var element3 = document.createElement("p");
														element3.name = "classname" + i;
														element3.innerText =  myArr["results"][i]["name"]
														cell3.appendChild(element3);

														var cell4 = row.insertCell(3);
														var element4 = document.createElement("p");
														// element4.name = "enrollmentCount" + rowCount;
														element4.innerText =  myArr2["title"] + ' ' + myArr2["last_name"]
														// element4.href = "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + id + "/dbusers"
														cell4.appendChild(element4);

														// }
													}
												}
											})(myArr, i);

											// xhttp2.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbclasses/" + myArr["results"][i]["id"] + "/dbusers" , true);
											xhttp2.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/" + myArr["results"][i]["teacher_id"] , true);
											xhttp2.setRequestHeader('Authorization', 'Bearer ' + 'abc');
											xhttp2.send();



										}
									}
								}
							}
						})(user_id);
						// xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
						xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + user_id + "/dbclasses", true);
						// xhttp.open("POST", "https://wonderbar-cs467.ue.r.appspot.com/dbteachers/1/dbclasses" , true);
						xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
						xhttp.setRequestHeader("Content-Type", "application/json");
						xhttp.send();
						// xhttp.send(JSON.stringify({class_code:class_code, name:class_name}));

				}catch(e) {
					console.log(e);
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

