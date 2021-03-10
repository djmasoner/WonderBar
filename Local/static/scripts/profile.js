
var user_id;
var delete_proj = false;
window.addEventListener('load', (event) => {
    user_id = document.getElementById('user_id').value;
    init_page();
});



async function init_page() {
    var id = window.location.search.split("?")[1];
    if (id==null) {
        id = user_id;
    }
    console.log(id);
    await loadUser(id);
}

async function loadUser(selected_user_id) {
    var mainContent = document.getElementById("mainContent-wrap");

    var profile_border_outer = document.createElement("div");
    profile_border_outer.className = "profile-border-outer";
    mainContent.appendChild(profile_border_outer);

    var username_header = document.createElement("h1");
    username_header.id = "username-header";
    profile_border_outer.appendChild(username_header);

    var profile_border_inner = document.createElement("div");
    profile_border_inner.className = "profile-border-inner";
    profile_border_outer.appendChild(profile_border_inner);

    var row = document.createElement("div");
    row.className = "row";
    profile_border_inner.appendChild(row);

    var left_column = document.createElement("div");
    left_column.className = "left-column";
    row.appendChild(left_column);

    var right_column = document.createElement("div");
    right_column.className = "right-column";
    row.appendChild(right_column);

    var profile_pic = document.createElement("img");
    profile_pic.className = "profile-pic";
    left_column.appendChild(profile_pic);

    var profile_info = document.createElement("div");
    profile_info.className = "profile-info";
    left_column.appendChild(profile_info);

    var saved_projects_h1 = document.createElement("h1");
    saved_projects_h1.innerHTML = "Recently Saved Projects: ";

    var saved_projects = document.createElement("div");
    saved_projects.id = "saved-projects";
    saved_projects.style.overflowY = "scroll";
    saved_projects.style.overflowX = "hidden";

    var user_type = document.createElement("p");
    var username = document.createElement("p");
    var activation_code = document.createElement("p");
    var activation_code_msg = document.createElement("p");
    var school = document.createElement("p");
    var birthday = document.createElement("p");
    var email = document.createElement("p");
    var member_since = document.createElement("p");


    profile_info.appendChild(user_type);
    profile_info.appendChild(username);
    profile_info.appendChild(email);
    profile_info.appendChild(birthday);
    profile_info.appendChild(member_since);
    profile_info.appendChild(school);
    if(selected_user_id == user_id) {
        profile_info.appendChild(activation_code);
        profile_info.appendChild(activation_code_msg);
    }

    await get_user(selected_user_id, user_id)
    .then(async user => {
        console.log(user);

        user_type.innerHTML = user["user_type"][0].toUpperCase() + user["user_type"].substring(1) ;
        username_header.innerHTML = user["first_name"] + " " + user["last_name"];
        username.innerHTML = "Username: " + user["username"];
        if (user["user_type"] == "teacher") {
            activation_code.innerHTML = "Activation Code: " + user["activation_code"];
            // activation_code_msg.innerHTML = "Send the activation code to your students so they can sign up! ";
        }
        school.innerHTML = "School: " + user["school"];
        birthday.innerHTML = "Birthday: " + user["birthdate"];
        email.innerHTML = "Email: " + user["email_address"];
        member_since.innerHTML = "Member Since: " + user["created_at"].split(" ")[0];
        if(user["avatar"] == null) {
            profile_pic.src = "/static/images/default-profile.png";
        } 
        else{
            profile_pic.src = user["avatar"];
        }

    });


    var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + selected_user_id + '/dbprojects?order_by=project_users.id%20DESC&limit=10&offset=0';

    fetchData(url, user_id).then(projects=>{
        var recent_obs = document.createElement("a");
        recent_obs.href = "/projects";
        recent_obs.className = "recent_obs";

        var obs_container = document.createElement("div");
        obs_container.className = "obs-container";

        var h2 = document.createElement("h2");
        h2.innerHTML = "Total Projects Joined";

        var count_p = document.createElement("p");
        count_p.id = "project_count_id";
        count_p.innerHTML = projects["count"];

        obs_container.appendChild(recent_obs);
        recent_obs.appendChild(h2);
        recent_obs.appendChild(count_p);
        if(selected_user_id == user_id) {
            right_column.appendChild(obs_container);
        }
        else {
            right_column.appendChild(obs_container);
            obs_container.className += " inactive";
            recent_obs.href = "";
            recent_obs.setAttribute("onclick", "return false");

        }

        projectCount = projects["results"].length;
        for (var i = 0; i < projectCount; i++) {
            var result = projects["results"][i];
            var project = document.createElement("a");
            project.className = "saved-proj";
            project.href = "/viewProject?" + result["id"];
            project.id = "project" + result["id"];

            var proj_p = document.createElement("p");
            proj_p.innerHTML = result["name"];
            project.setAttribute("onclick", "javascript: return checkDelete()")
            project.appendChild(proj_p);

            var span = document.createElement("span");
            span.className = "delete_project";
            span.id = "save-heart";
            span.setAttribute("onclick", "javascript:return deleteProject(" + result["id"] + ")")
            span.innerHTML = '<i class="fa fa-heart"style="color:red"></i>';
            span.style.fontSize = "24px";

            if(selected_user_id == user_id){
                project.appendChild(span);
            }

            saved_projects.appendChild(project);
        }

        url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + selected_user_id + '/dbobservations?order_by=id%20DESC&limit=1&offset=0';

        fetchData(url, user_id).then(observations=>{
            var recent_obs = document.createElement("a");
            recent_obs.href = "/myObservations?" + selected_user_id;
            recent_obs.className = "recent_obs";

            var obs_container = document.createElement("div");
            obs_container.className = "obs-container";

            var h2 = document.createElement("h2");
            h2.innerHTML = "Total Observations Made";

            var count_p = document.createElement("p");
            count_p.innerHTML = observations["count"];

            obs_container.appendChild(recent_obs);
            recent_obs.appendChild(h2);
            recent_obs.appendChild(count_p);
            right_column.appendChild(obs_container);


            
            if (activation_code.innerHTML != "") {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbteachers/' + selected_user_id + '/dbclasses?order_by=id%20DESC&limit=1&offset=0';
            }
            else {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + selected_user_id + '/dbclasses?order_by=id%20DESC&limit=1&offset=0';
            }
            fetchData(url, user_id).then(classes=>{
                var recent_obs = document.createElement("a");
                recent_obs.href = "/myClasses";
                recent_obs.className = "recent_obs";

                var obs_container = document.createElement("div");
                obs_container.className = "obs-container";

                var h2 = document.createElement("h2");
                h2.innerHTML = "Class Enrollment Count";
                if (activation_code.innerHTML != "") {
                    h2.innerHTML = "Number of Classes Added";
                }

                var count_p = document.createElement("p");
                count_p.innerHTML = classes["count"];

                obs_container.appendChild(recent_obs);
                recent_obs.appendChild(h2);
                recent_obs.appendChild(count_p);
                if(selected_user_id == user_id) {
                    right_column.appendChild(obs_container);
                }
                else {
                    right_column.appendChild(obs_container);
                    obs_container.className += " inactive";
                    recent_obs.href = "";
                    recent_obs.setAttribute("onclick", "return false");
                }
                right_column.appendChild(saved_projects_h1);
                right_column.appendChild(saved_projects);
            });
        });
    });
}

async function deleteProject(project_id) {
    delete_proj = true;
    var project = document.getElementById("project" + project_id);
    var project_count = document.getElementById("project_count_id");
    project_count.innerHTML = (project_count.innerHTML) - 1;
    project.href = "";
    project.target = "";
    var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects/' + project_id;
    await deleteData(url, user_id).then(data => {
        project.remove();
    });
    return false;
}

function checkDelete() {
    if (delete_proj) {
        return false;
    }
    delete_proj = false;
    return true;
}
