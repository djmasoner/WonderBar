
var session_user_id;
var delete_proj = false;
window.addEventListener('load', (event) => {
    init_page();
});
var selected_user_id=null;



async function init_page() {
    session_user_id = document.getElementById('user_id').value;
    selected_user_id = window.location.search.split("?")[1];
    if (selected_user_id == null || selected_user_id=="") {
        selected_user_id = session_user_id;
        id = selected_user_id;
    }
    else{
        id=selected_user_id;
    }
    await tableFromJson(id);
}





    async function tableFromJson(user_id) {
        await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbobservations', session_user_id).then(obs=>{

            if (obs["count"] > 0) {
        		// the json data. (you can change the values for output.)
                var myObs = obs["results"];

                var col = [];
                for (var key in myObs[0]) {
                    if (col.indexOf(key) === -1) {
                        col.push(key);
                    }
                }
                var currentProject = myObs[0][col[0]];
                var currentPrompt = myObs[0][col[4]];


                var divShowData = document.getElementById('my-observations');
                var project = create_new_project(divShowData, myObs[0][col[5]], myObs[0][col[0]]);
                var prompt_content = create_new_prompt(project, myObs[0][col[6]], myObs[0][col[7]], myObs[0][col[4]]);
                // project_outer.appendChild(prompt);


                // add json data to the table as rows.
                for (var i = 0; i < myObs.length; i++) {


                    // for (var j = 5; j < col.length - 2; j++) {
                        if (currentProject != myObs[i][col[0]]){
                        //create new project div
                            project = create_new_project(divShowData, myObs[i][col[5]], myObs[i][col[0]]);
                            currentProject = myObs[i][col[0]];
                            if (currentPrompt != myObs[i][col[4]]){
                            //create new prompt div
                                prompt_content = create_new_prompt(project, myObs[i][col[6]], myObs[i][col[7]], myObs[i][col[4]]);
                                currentPrompt = myObs[i][col[4]];
                            }
                        }
                        else{
                            if (currentPrompt != myObs[i][col[4]]){
                            //create new prompt div
                                prompt_content = create_new_prompt(project, myObs[i][col[6]], myObs[i][col[7]], myObs[i][col[4]]);
                                currentPrompt = myObs[i][col[4]];
                            }
                        }
                        create_new_observation(prompt_content, myObs[i][col[1]], myObs[i][col[9]], myObs[i][col[8]], myObs[i][col[2]])
                    // }
                }
            }
            else {
                alert("This user has made no observations.")
                window.location = "/profile";
            }
        });

    }


function create_new_project(doc, project_name, project_id) {
    var project_outer = document.createElement("div");
    project_outer.className = "projects-border-outer";

    var project_inner = document.createElement("div");
    project_inner.className = "projects-border-inner";

    var project_header = document.createElement("h1");
    project_header.className = "project-header";
    project_header.innerHTML = project_name;

    var project_button_a = document.createElement("a");
    project_button_a.href = "/viewProject?" + project_id;
    project_button_a.innerHTML = "Go To Project";

    var project_button = document.createElement("button");
    project_button.appendChild(project_button_a);
    project_button.className = "obsButtons";

    project_outer.appendChild(project_header);
    project_outer.appendChild(project_button);

    project_outer.appendChild(project_inner);
    doc.appendChild(project_outer);

    return project_inner;
}

function create_new_prompt(project, prompt_name, prompt_desc, prompt_id) {

        var prompt = document.createElement("div");
        prompt.className = "project";

        var prompt_title_div = document.createElement("div");
        prompt_title_div.className = "projectTitle";

        var prompt_title_row = document.createElement("div");
        prompt_title_row.className = "row";

        var prompt_title_left = document.createElement("div");
        prompt_title_left.className = "left-column";

        var prompt_header = document.createElement("h1");
        prompt_header.className = "prompt-header";
        prompt_header.innerHTML = prompt_name;

        var prompt_button_a = document.createElement("a");
        prompt_button_a.href = "/viewAllObservations?" + prompt_id;
        prompt_button_a.innerHTML = "Go To Prompt";

        var prompt_button = document.createElement("button");
        prompt_button.appendChild(prompt_button_a);
        prompt_button.className = "obsButtons";




        var prompt_title_right = document.createElement("div");
        prompt_title_right.className = "right-column";

        var prompt_description = document.createElement("p");
        prompt_description.innerHTML = prompt_desc;

        prompt_title_right.appendChild(prompt_description);
        prompt_title_left.appendChild(prompt_header);
        prompt_title_left.appendChild(prompt_button);
        prompt_title_row.appendChild(prompt_title_left);
        prompt_title_row.appendChild(prompt_title_right);
        prompt_title_div.appendChild(prompt_title_row);
        prompt.appendChild(prompt_title_div)
        project.appendChild(prompt);

        var prompt_content_div = document.createElement("div");
        prompt_content_div.className = "projectContent";
        prompt.appendChild(prompt_content_div);
        return prompt_content_div;
}

function create_new_observation(prompt_content, observation_type, observation_response, observation_date, observation_id) {
    var observation = document.createElement("div");
    observation.className = "observation";

    var obs_row = document.createElement("div");
    obs_row.className = "row";


    var obs_span = document.createElement("span");
    obs_span.className = "obs-span";
    obs_span.innerHTML = "x";
    obs_span.setAttribute("onclick", "delete_observation(this, " + observation_id+ ")")
    obs_span.title = "Delete observation";


    var obs_left = document.createElement("div");
    obs_left.className = "left-column";

    var obs_right = document.createElement("div");
    obs_right.className = "right-column";


    var obs_response;
    var obs_date = document.createElement("p");

    if (observation_type == 'image'){
        obs_response = document.createElement("img");
        obs_response.className = "projectImage";
        obs_response.src = observation_response;
    }
    else {
        obs_response = document.createElement("p");
        obs_response.innerHTML = observation_response;
    }

    if(selected_user_id == session_user_id) {
        prompt_content.appendChild(obs_span);
    }
    obs_date.innerHTML = formatDate(observation_date);
    obs_left.appendChild(obs_date);
    obs_right.appendChild(obs_response);
    obs_row.appendChild(obs_left);
    obs_row.appendChild(obs_right);
    observation.appendChild(obs_row);
    prompt_content.appendChild(observation);
    // return observation;

}

function formatDate(unformatted_date){
    var date = new Date(unformatted_date+ ' UTC');
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    var hh;
    var am_pm;
    if (date.getHours() > 12) {
        hh = String(date.getHours() - 12).padStart(2, '0');
        am_pm = "PM";
    }
    else if (date.getHours() == 0){
        hh = '12';
        am_pm = "AM";
    }
    else {
        hh = String(date.getHours()).padStart(2, '0');
        am_pm = "AM";
    }
    var min = String(date.getMinutes()).padStart(2, '0');

    date = mm + '/' + dd + '/' + yyyy + ' ' + hh + ':' + min + ' ' + am_pm;

    return date;
}

async function delete_observation(element, element_id) {
    await deleteData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations/' + element_id ,user_id).then(data=>{
        var prompts = element.parentElement.parentElement.parentElement.getElementsByClassName("project");
        if(prompts.length == 1) {
            element.parentElement.parentElement.parentElement.parentElement.remove()
            return;
        }

        var observations = element.parentElement.getElementsByClassName("observation");
        if(observations.length == 1) {
            element.parentElement.parentElement.remove()
            return;
        }

        element.nextSibling.remove();
        element.remove();
    });
}
