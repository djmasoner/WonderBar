function yesnoCheck() {
    if (document.getElementById('teacherType').checked) {
        document.getElementById('ifTeacher').style.display = 'block';
        document.getElementById('ifTeacher2').style.display = 'block';
        document.getElementById('ifStudent').style.display = 'none';
        document.getElementById('ifeither').style.display = 'block';
        document.getElementById('activation_code').value = ''
    }
    else {
        document.getElementById('ifTeacher').style.display = 'none';
        document.getElementById('ifTeacher2').style.display = 'none';
        document.getElementById('ifStudent').style.display = 'block';
        document.getElementById('ifeither').style.display = 'block';
        document.getElementById('teaching_certification_id').value = ''
        document.getElementById('title').value = ''
    }

}
function confirm() {
  document.getElementById('confirmTeacher').value = 'Confirmed';
  document.getElementById('confirmTeacher').disabled = true;

}
function confirmACode(confirm_name, reset_name, text_name) {

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById(confirm_name).value = 'Confirmed';
      document.getElementById(confirm_name).disabled = true;
      document.getElementById(text_name).setAttribute("readonly","")
      document.getElementById(reset_name).disabled = false;
    }
    else if (this.readyState == 4) {
      alert("Invalid Activation Code!");
    }
  };
  xhttp.open("GET", "http://127.0.0.1:8080/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
  xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
  xhttp.send();

}

function confirmUsername(confirm_name, reset_name, text_name) {

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      alert("Username already exists!");
    }
    else if (this.readyState == 4) {
      document.getElementById(confirm_name).value = 'Available!';
      document.getElementById(confirm_name).disabled = true;
      document.getElementById(text_name).setAttribute("readonly","")
      document.getElementById(reset_name).disabled = false;
    }
  };
  xhttp.open("GET", "http://127.0.0.1:8080/dbusers/" + document.getElementById('username').value + "?key=username" , true);
  xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
  xhttp.send();

}

function resetACode(confirm_name, reset_name, text_name) {

    document.getElementById(confirm_name).value = 'Verify';
    document.getElementById(confirm_name).disabled = false;
    document.getElementById(text_name).removeAttribute("readonly")
    document.getElementById(reset_name).disabled = true;

}