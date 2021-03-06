const statusCheck = response => {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  }
  return Promise.reject(new Error(response.statusText))
}

const json = response => response.json()

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

var date = mm + '/' + dd + '/' + yyyy;
function yesnoCheck() {

    var i;
    var teacher_fields = document.getElementsByClassName("teachers_only");
    var student_fields = document.getElementsByClassName("students_only");



    if (document.getElementById('teacherType').checked) {
        for (i = 0; i < teacher_fields.length; i++) {
          teacher_fields[i].style.display = "block";
        }

        for (i = 0; i < student_fields.length; i++) {
          student_fields[i].style.display = "none";
        }
        document.getElementById('teaching_certification_id').required = true
        document.getElementById('title').required = true
        document.getElementById('activation_code').required = false

    }
    else {
        for (i = 0; i < teacher_fields.length; i++) {
          teacher_fields[i].style.display = "none";
        }

        for (i = 0; i < student_fields.length; i++) {
          student_fields[i].style.display = "block";
        }

        document.getElementById('teaching_certification_id').required = false
        document.getElementById('title').required = false
        document.getElementById('activation_code').required = true
    }
    var student_teacher_fields = document.getElementsByClassName("student_teacher_fields");
    for (i = 0; i < student_teacher_fields.length; i++) {
      student_teacher_fields[i].style.display = "block";
    }
document.getElementById('birthdate').max = date;
}

function confirm() {
  document.getElementById('confirmTeacher').value = 'Confirmed';
  document.getElementById('confirmTeacher').disabled = true;

}

function confirmCert() {
  document.getElementById('teaching_certification_id').style.border = '1px solid green';
  document.getElementById('teaching_certification_id').title = 'Teaching Certification is Valid';


}


function confirmActivationCode() {
    // var user_id = document.getElementById('user_id').value

    let reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    // reqHeader.append('Authorization', 'Bearer ' + user_id);

    let initObject = {
      method: 'GET', headers: reqHeader
    };

    var userRequest = new Request("https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code", initObject);

     fetch(userRequest)
    .then(statusCheck)
    .then(data => {
        // document.getElementById('activation_code').style.border = '2px solid green';
        document.getElementById('activation_code').style.backgroundColor = 'green';
    })
    .catch(function (err) {
        document.getElementById('activation_code').style.backgroundColor = 'red';
        console.log("Something went wrong!", err);
    });



  // var xhttp = new XMLHttpRequest();
  // xhttp.onreadystatechange = function() {
  //   if (this.readyState == 4 && this.status == 200) {
  //     document.getElementById('activation_code').style.border = '2px solid green';
  //     document.getElementById('activation_code').title =  'Activation code is valid';
  //     // myArr = JSON.parse(this.responseText)
  //     // document.getElementById('school').value =  myArr["school"];
  //     // document.getElementById('school').setAttribute("readonly",true)

  //     // document.getElementById(confirm_name).value = 'Confirmed';
  //     // document.getElementById(confirm_name).disabled = true;
  //     // document.getElementById(text_name).setAttribute("readonly","")
  //     // document.getElementById(reset_name).disabled = false;
  //   }
  //   else if (this.readyState == 4) {
  //     document.getElementById('activation_code').style.border = '2px solid red';
  //     document.getElementById('activation_code').title =  'Activation code is not valid';
  //     // document.getElementById('school').value =  "";
  //     // document.getElementById('school').setAttribute("readonly","")
  //   }
  // };
  // xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
  // xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbactivation_codes/" + document.getElementById('activation_code').value + "?key=activation_code" , true);
  // xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
  // xhttp.send();

}

function confirmUsername() {

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById('username').style.border = '2px solid red';
      document.getElementById('username').title =  'Username already exists';
    }
    else if (this.readyState == 4) {
      document.getElementById('username').style.border = '2px solid green';
      document.getElementById('username').title =  'Username is valid';

      // document.getElementById(confirm_name).value = 'Available!';
      // document.getElementById(confirm_name).disabled = true;
      // document.getElementById(text_name).setAttribute("readonly","")
      // document.getElementById(reset_name).disabled = false;
    }
  };
    // xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + document.getElementById('username').value + "?key=username" , true);
    xhttp.open("GET", "https://wonderbar-cs467.ue.r.appspot.com/dbusers/" + document.getElementById('username').value + "?key=username" , true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + 'abc');
    xhttp.send();

    if (document.getElementById('username').value.length < 5 || document.getElementById('username').value.length > 50){
      document.getElementById('username').style.border = '2px solid red';
      document.getElementById('username').title =  'Username should be between 5 and 50 characters. It should only contain alphanumeric characters or underscores.';
    }

}

function resetConfirmation(confirm_name, reset_name, text_name) {

    document.getElementById(confirm_name).value = 'Verify';
    document.getElementById(confirm_name).disabled = false;
    document.getElementById(text_name).removeAttribute("readonly")
    document.getElementById(reset_name).disabled = true;

}