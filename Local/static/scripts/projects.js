
var recent_projects = document.getElementById("project-list");
let page = 1;
let currentscrollHeight = 0;
let lockScroll = false;
var limit= 10;
var offset = 0;
var prev_url;
var maxScrollPos = 0;
var projects_pulled = 0;
var scrollPos = $(window).height() + $(window).scrollTop();
var new_div;
var loading = false;
var numpages;
var current_page = 1;
var order_by= "id%20DESC";
var user_id;
var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?limit=' + limit + '&offset=' + offset + '&order_by=' + order_by;;
var filter = true;
var additional_filters = false;
var locations;
var topics;
var material;
var school;
var saving = false;
$(window).on("scroll", setMaxScroll);

var project_locations;
var project_topics;



// getData();
$(window).on("load", (event) => {

    document.getElementById("loader").style.display = "block";
    getData();
    getInitialData();


    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function() {
        this.classList.toggle("active");

        if (user_id == "" || user_id == null) {
            document.getElementById("proj_school").style.display = "none";
            user_id = 0;
        }
        else {
            document.getElementById("proj_school").style.display = "block";
        }
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
      });
    }
});
// window.addEventListener('load', (event) => {
//     user_id = document.getElementById('user_id').value;
//     showTab(currentTab);
// });

async function getData() {

    await get_topics(user_id).then(data => {project_topics = data;});
    if (project_topics) {
        add_project_checkboxes('proj_topics', 'topic', 'project_topics');
    }

    await get_locations(user_id).then(data => {project_locations = data;})
    if (project_locations){
        add_project_checkboxes('proj_locations', 'location', 'project_locations');
    }

}


function add_project_checkboxes(element_id, project_info_type, varname) {
    var x = document.getElementById(element_id);


    var rowCount = window[varname]["count"]
    for (var i=0; i<rowCount;i++){
        p = document.createElement("p");
        label = document.createElement("label");
        var input = document.createElement("input");
        input.type = "checkbox";
        input.style.margin = "0 1%"
        input.id = project_info_type + (i+1);
        input.name = project_info_type + (i+1);
        input.value= window[varname]["results"][i]["id"];
        label.innerHTML= window[varname]["results"][i]["name"];
        label.htmlFor= project_info_type + (i+1);
        p.appendChild(input);
        p.appendChild(label);
        x.appendChild(p);
    }
}




function getScrollableData() {
 //page height
 var scrollHeight = $(document).height();
 //scroll position
 scrollPos = $(window).height() + $(window).scrollTop();
 // fire if the scroll position is 300 pixels above the bottom of the page
 if (!loading){
     if (scrollPos >= maxScrollPos){
         if((((scrollHeight - 300) >= scrollPos) / scrollHeight == 0) ){
            console.log("height:" + scrollHeight.toString() + ",scrollPos:" + scrollPos.toString()+ ",max:" + maxScrollPos.toString() + ",calc: " + (((scrollHeight - 300) >= scrollPos) / scrollHeight).toString());
            console.log(offset.toString() + "," + projects_pulled.toString());
                if(url!=null){
                    loading = true;
                    fetchData(url, user_id).then(projects=>{
                        console.log(url);
                        url = projects["next"];
                        prev_url = projects["next"];
                        if (offset >= projects["count"]) {
                            offset = limit;
                        }
                        else {
                            offset = projects_pulled;
                        }
                        var project_count = projects["results"].length;
                        projects_pulled += project_count;
                        for(var i = 0; i < project_count; i++) {
                            createProject(projects["results"][i], Math.ceil(projects_pulled/(projects["count"]/numpages)));
                        }
                        loading = false;
                    });
                }
                else {
                    var y = document.getElementsByClassName("page");
                    for (var t = 0; t < y.length; t++){
                        y[t].style.display = "block";
                    }
                }
                // maxScrollPos = $(document).height();
            }
            maxScrollPos = scrollPos;
        }
    }
}

function setMaxScroll() {

 scrollPos = $(window).height() + $(window).scrollTop();
    if(maxScrollPos < scrollPos){
        maxScrollPos = scrollPos;
    }
}


function getInitialData(replace = false) {
    user_id =document.getElementById("user_id").value;
    if (user_id == "" || user_id==null || user_id==0) {
        filter=false;
        user_id = 0;
    }
    else {
        if(!additional_filters){
            url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=0';
        }
        if(filter){
            document.getElementById("all-proj").classList.remove("active");
            document.getElementById("my-proj").className += " active";
        }
    }
    order_by= document.getElementById("order_by").value;
    recent_projects = document.getElementById("project-list");
    new_div = document.createElement("div");
    if (replace){
        limit = parseInt(document.getElementById("results_number").value);
        var parentNode = recent_projects.parentElement;
        new_div.id = "project-list";
        parentNode.replaceChild(new_div, recent_projects)
        recent_projects = new_div;
        if(!additional_filters){
            if(!filter){
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=0';
            }
            else {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=0';

            }
        }
        else {
            if (filter) {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbfilteredprojects/' + user_id + '?locations=' + locations + '&topics=' + topics + '&material=' + material + '&school=' + school + '&mine=True&order_by=' + order_by + '&limit=10' + '&offset=0';
            }
            else {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbfilteredprojects/' + user_id + '?locations=' + locations + '&topics=' + topics + '&material=' + material + '&school=' + school + '&order_by=' + order_by + '&limit=10' + '&offset=0';
            }
        }
        projects_pulled = 0;
        console.log(url);
        if (url!=null) {
            fetchData(url, user_id).then(async projects=>{
                if(projects["count"]>0){

                    create_pages(Math.ceil(Number(projects["count"])/limit), true);
                    numpages = Math.ceil(Number(projects["count"])/limit);
                    url = projects["next"];
                    prev_url = projects["next"];
                    offset = projects["offset"];
                    var project_count = projects["results"].length;
                    projects_pulled += project_count;
                    for(var i = 0; i < project_count; i++) {
                        await createProject(projects["results"][i], 1, true);
                    }
                    addButtons();
                    createSteps(Math.ceil(Number(projects["count"])/limit));
                    if(filter){
                        showTab(0,1,true);
                    }
                    else{
                        showTab(0,1);
                    }
                }
                else{
                    if (!additional_filters) {
                        url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?limit=' + limit + '&offset=' + offset;
                        if(filter) {
                            document.getElementById("my-proj").classList.remove("active");
                            document.getElementById("my-proj").className += " inactive";
                            document.getElementById("all-proj").className += " active";
                        }
                        filter = false;

                        fetchData(url, user_id).then(async projects=>{
                            create_pages(Math.ceil(Number(projects["count"])/limit), true);
                            numpages = Math.ceil(Number(projects["count"])/limit);
                            url = projects["next"];
                            prev_url = projects["next"];
                            offset = projects["offset"];
                            var project_count = projects["results"].length;
                            projects_pulled += project_count;
                            for(var i = 0; i < project_count; i++) {
                                await createProject(projects["results"][i], 1, true);
                            }
                            addButtons();
                            createSteps(Math.ceil(Number(projects["count"])/limit));
                            if(filter){
                                showTab(0,1,true);
                            }
                            else{
                                showTab(0,1);
                            }
                        });
                    }
                    else {
                        document.getElementById("filter-error").style.display = "block";
                    }
                }
            });
        }
    }
    else {
        if (url!=null){
            fetchData(url, user_id).then(async projects=>{
                if(projects["count"]>0){

                    create_pages(Math.ceil(Number(projects["count"])/limit));
                    numpages = Math.ceil(Number(projects["count"])/limit);
                    console.log(url);
                    url = projects["next"];
                    prev_url = projects["next"];
                    offset = projects["offset"];
                    var project_count = projects["results"].length;
                    projects_pulled += project_count;
                    for(var i = 0; i < project_count; i++) {
                        await createProject(projects["results"][i], Math.ceil((i+1)/limit));
                    }
                    addButtons();
                    createSteps(Math.ceil(Number(projects["count"])/limit));
                    if(filter){
                        showTab(0,1,true);
                    }
                    else{
                        showTab(0,1);
                    }
                }
                else {

                    if(!additional_filters){
                        url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?limit=' + limit + '&offset=' + offset + '&order_by=' + order_by;
                    
                        if(filter) {
                            document.getElementById("my-proj").classList.remove("active");
                            document.getElementById("my-proj").className += " inactive";
                            document.getElementById("all-proj").className += " active";
                        }
                        filter = false;
                            fetchData(url, user_id).then(async projects=>{

                            create_pages(Math.ceil(Number(projects["count"])/limit));
                            numpages = Math.ceil(Number(projects["count"])/limit);
                            console.log(url);
                            url = projects["next"];
                            prev_url = projects["next"];
                            offset = projects["offset"];
                            var project_count = projects["results"].length;
                            projects_pulled += project_count;
                            for(var i = 0; i < project_count; i++) {
                                await createProject(projects["results"][i], Math.ceil((i+1)/limit));
                            }
                            addButtons();
                            createSteps(Math.ceil(Number(projects["count"])/limit));
                            if(filter){
                                showTab(0,1,true);
                            }
                            else{
                                showTab(0,1);
                            }
                        });
                    }
                    else {
                        document.getElementById("filter-error").style.display = "block";
                    }

                }
            });
        }
    }
}


function getMoreData(new_page = false) {
    order_by= document.getElementById("order_by").value;
    recent_projects = document.getElementById("project-list");
    var newLimit= document.getElementById("results_number").value;
    if (newLimit < limit) {
        getInitialData(true);
    }
    else if(newLimit != "All") {
        offset = limit;
        limit = parseInt(newLimit);

        if(!additional_filters){
            if(projects_pulled >= limit) {
                if (!filter){
                    url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?order_by=' + order_by + '&limit=' + limit + '&offset=' + projects_pulled;
                }
                else {
                    url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=' + projects_pulled;

                }
            }
            else {
                if (!filter){
                    url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?order_by=' + order_by + '&limit=' + limit + '&offset=' + limit;
                }
                else {
                    url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=' + limit;

                }
            }
        }
        if (url!=null) {
            fetchData(url, user_id).then(async projects=>{
                console.log(url);
                url = projects["next"];
                prev_url = projects["next"];
                offset = projects["offset"];
                var project_count = projects["results"].length;
                projects_pulled += project_count;
                for(var i = 0; i < project_count; i++) {
                    await createProject(projects["results"][i], Math.ceil(projects_pulled/limit));
                }
            });
        }
    }

}

function create_pages(num_of_pages, replace=false) {
    for (var i = 0; i < num_of_pages; i++) {
        var new_page = document.createElement("div");
        new_page.className = "page";
        new_page.id = "project_page" + (i + 1);
        new_page.style.display = "none";
        // if (replace) {
        //     new_div.appendChild(new_page);
        // }
        // else{
        recent_projects.appendChild(new_page);
    // }

    }
}

function update_results() {
    recent_projects = document.getElementById("project-list");
    var newLimit= document.getElementById("results_number").value;
    order_by= document.getElementById("order_by").value;
    loading = false;
    maxScrollPos = 0;
    saving = false;

    if(newLimit == "All") {
        limit = 1000;
        document.getElementById("prevnext-buttons").style.display = "none";

        if(!additional_filters){
            if (!filter){
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects?order_by=' + order_by + '&limit=' + limit + '&offset=' + projects_pulled;
            }
            else {
                url = 'https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id + '/dbprojects?order_by=projects.' + order_by + '&limit=' + limit + '&offset=' + projects_pulled;

            }
        }


        var y = document.getElementsByClassName("page");
        for (var t = 0; t < y.length; t++){
            y[t].style.display = "block";
        }
        $(window).off("scroll");
        $(window).on("scroll", getScrollableData);
        // }
    }
    else{
        try{
            document.getElementById("prevnext-buttons").style.display = "block";
        }
        catch {}
        var y = document.getElementsByClassName("page");
        for (var t = 0; t < y.length; t++){
            y[t].style.display = "none";
        }
        $(window).off("scroll");
        $(window).on("scroll", setMaxScroll);
        getInitialData(true);
    }
}

async function createProject(project, page_num=1, replace=false) {
    recent_projects = document.getElementById("project-list");
    var project_div = document.createElement("div");
    project_div.className = "project";

    var project_ref = document.createElement("a");
    project_ref.setAttribute("onclick", "javascript: return checkSave();");
    project_ref.href = "/viewProject?" + project["id"];
    project_ref.target = "_blank";

    var project_title_div = document.createElement("div");
    project_title_div.className = "projectTitle";

    var project_content_div = document.createElement("div");
    project_content_div.className = "projectContent";

    var project_title_h1 = document.createElement("h1");
    project_title_h1.innerHTML = project["name"];
    var project_title_h2 = document.createElement("h2");
    var project_title_h3 = document.createElement("h2");

    var teacher_name;
    if(project["title"]==null){
        teacher_name = project["first_name"] + " " + project["last_name"]
    }
    else {
        teacher_name = project["title"] + " " + project["first_name"] + " " + project["last_name"]
    }
    project_title_h2.innerHTML = "Creator: " + teacher_name
    project_title_h3.innerHTML = "Date Created: " + project["created_at"].split(" ")[0]

    var project_right = document.createElement("div");
    var project_left = document.createElement("div");

    var column_div = document.createElement("div");
    column_div.className = "row";

    project_right.className = "right-column";
    project_left.className = "left-column";

    var project_content_image_div = document.createElement("div");
    project_content_image_div.className = "projectImage";

    var project_content_text_div = document.createElement("div");
    project_content_text_div.className = "projectText";

    var project_image= document.createElement("img");
    project_image.src = project["avatar"];
    project_image.setAttribute("onerror","this.onerror=null;this.src='/static/images/default-project.png';" );


    var project_text= document.createElement("p");
    project_text.innerHTML = project["short_description"];


    var imgNumber = document.createElement("div");
    // imgNumber.className = "imgNumber";

    await get_project_user(project["id"] , user_id).then(user_info => {
        if(user_info){
            imgNumber.innerHTML = '<span class="save-heart" onclick="saveProject(this, event, ' + project["id"] + ',' + user_id + ')" style="font-size:24px; float:left;"><i class="fa fa-heart"style="color:red"></i></span>';
        }
        else {
            imgNumber.innerHTML = '<span class="save-heart" onclick="saveProject(this, event, ' + project["id"] + ',' + user_id + ')" style="font-size:24px; float:left;"><i class="fa fa-heart"style="color:white"></i></span>';
        }
    })

    if (user_id == "" || user_id == null) {
        project_content_image_div.appendChild(project_image);

    }
    else{
        project_content_image_div.appendChild(imgNumber);
        imgNumber.appendChild(project_image);
    }


    project_content_text_div.appendChild(project_text);
    column_div.appendChild(project_left);
    column_div.appendChild(project_right);
    project_content_div.appendChild(column_div);
    project_left.appendChild(project_content_image_div);
    project_right.appendChild(project_content_text_div);
    project_title_div.appendChild(project_title_h1);
    project_title_div.appendChild(project_title_h2);
    project_title_div.appendChild(project_title_h3);

    project_ref.appendChild(project_title_div);
    project_ref.appendChild(project_content_div);
    project_div.appendChild(project_ref);

    var page = document.getElementById("project_page" + page_num);
    page.appendChild(project_div);

}

function addButtons() {
    var btns_div = document.createElement("div");
    btns_div.style.overflow = "auto";
    btns_div.className = "prevnext-buttons";
    btns_div.id = "prevnext-buttons";

    var btns_div2 = document.createElement("div");
    btns_div2.className= "row";

    btns_div.appendChild(btns_div2);

    var prevBtn = document.createElement("a");
    var nextBtn = document.createElement("a");

    prevBtn.id = "prevBtn";
    nextBtn.id = "nextBtn";

    // prevBtn.setAttribute("onclick", "showTab(1,2)");
    // nextBtn.setAttribute("onclick", "showTab(2,1)");
    var btns_a = document.createElement("a");
    btns_a.href = "#projects-header";
    btns_a.id = "proj-buttons";

    prevBtn.innerHTML = "<";
    nextBtn.innerHTML = ">";

    var btns_left = document.createElement("div");
    btns_left.className= "left-column";

    var btns_right = document.createElement("div");
    btns_right.className= "right-column";


    btns_left.appendChild(prevBtn);
    btns_right.appendChild(nextBtn);
    btns_a.appendChild(btns_left);
    btns_a.appendChild(btns_right);
    btns_div2.appendChild(btns_a);
    recent_projects.appendChild(btns_div);


}

function createSteps(num_of_steps) {
    var steps_div = document.createElement("div");
    steps_div.style.textAlign = "center";
    // steps_div.style.marginTop = "40px";

    for (var i = 0; i < num_of_steps; i++) {
        var new_step = document.createElement("span");
        new_step.className = "step";
        new_step.id = "project_step" + (i + 1);
        steps_div.appendChild(new_step);
    }
    recent_projects.appendChild(steps_div);

}



function showTab(current_page, new_page) {
/*
    adopted from: https://www.w3schools.com/howto/howto_js_form_steps.asp
    display tab element specified by parameter n
    show completed step indicator
*/
if(filter){
   getMoreData(true, true);
}
else{
   getMoreData(true);
}

if (current_page == 0 || new_page == 0) {
    var current = document.getElementById("project_page1");
    current.style.display = "block";
}


if(current_page > 0 ){
    var current = document.getElementById("project_page" + current_page);
    if (new_page > 0) {
        var new_pg = document.getElementById("project_page" + new_page);
        if (new_pg!=null){
            current.style.display = "none";
            new_pg.style.display = "block";
        }
    }
}
    var prevBtn = document.getElementById("prevBtn");
    var nextBtn = document.getElementById("nextBtn");

    //... and fix the Previous/Next buttons:
    if (new_page == 1) {
        prevBtn.style.display = "none";
    } else {
        prevBtn.style.display = "inline";
    }
    if (new_page == (numpages)) {
        nextBtn.style.display = "none";
    } else {
        nextBtn.style.display = "inline";
    }


    document.getElementById("loader").style.display = "none";
    prevBtn.setAttribute("onclick", "showTab(" + (new_page) +","+ (new_page - 1)+")");
    nextBtn.setAttribute("onclick", "showTab(" + (new_page) +","+ (new_page + 1)+")");

}



function filterProjectsTab(evt, project_filter) {
    clearFilterSelections(false);
    if(filter != project_filter){
        if (project_filter){
            filter = true;
        }
        else {
            filter = false;
            // getInitialData(true);
        }
    }
    document.getElementById("results_number").value = "10";
      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active")
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      evt.currentTarget.className += " active";
      update_results();

}

function filterProjects() {

    document.getElementById("filter-error").style.display = "none";
    if (user_id == "" || user_id == null) {
        document.getElementById("proj_school").style.display = "none";
        user_id = 0;
    }
    else {
        document.getElementById("proj_school").style.display = "block";
    }

    locations = add_cb_selections_to_query('proj_locations', true);
    topics = add_cb_selections_to_query('proj_topics', true);
    material = add_cb_selections_to_query('proj_material', false, true);
    school = add_cb_selections_to_query('proj_school', false, true);

    var locations_count = get_cb_selections_count('proj_locations');
    var topics_count = get_cb_selections_count('proj_topics');


    if ((locations_count + topics_count) > 0) {
        if (locations_count == 0) locations = '0';
        if (topics_count == 0) topics = '0';
    }

    console.log(locations);
    console.log(topics);
    console.log(material);
    console.log(school);

    if (filter) {
        url = 'https://wonderbar-cs467.ue.r.appspot.com/dbfilteredprojects/' + user_id + '?locations=' + locations + '&topics=' + topics + '&material=' + material + '&school=' + school + '&mine=True&order_by=' + order_by + '&limit=10' + '&offset=0';
    }
    else {
        url = 'https://wonderbar-cs467.ue.r.appspot.com/dbfilteredprojects/' + user_id + '?locations=' + locations + '&topics=' + topics + '&material=' + material + '&school=' + school + '&order_by=' + order_by + '&limit=10' + '&offset=0';
    }
    additional_filters = true;
    update_results();
    return false;
}


function clearFilterSelections(update_result=true) {

    document.getElementById("filter-error").style.display = "none";

    locations = null;
    topics = null;
    material = null;
    school = null;

     remove_cb_selections('proj_locations');
     remove_cb_selections('proj_topics');
     remove_cb_selections('proj_material');
     remove_cb_selections('proj_school');
    
    additional_filters = false;
    if (update_result) {
        update_results();
    }
    return false;
}


function add_cb_selections_to_query(element_id, use_all_string_if_blank=false, use_false_if_blank = false) {
    var x = document.getElementById(element_id);
    var cbs = x.getElementsByTagName("input");
    var rowCount = cbs.length;
    var filterString = ''
    var allString = '';

    for(var i=0; i<rowCount; i++) {
        var cb_id = cbs[i].value;
        if(null != cbs[i] && true == cbs[i].checked) {
            filterString += cb_id + ',';
        }
        allString+= cb_id + ',';
    }

    filterString = filterString.substring(0, filterString.length -1);

    if (use_all_string_if_blank) {
        if (filterString == "") {
            filterString = allString.substring(0, allString.length -1);
        }
    }
    if (use_false_if_blank) {
        if (filterString == "") {
            filterString = "False";
        }
    }
    return filterString;
}

function get_cb_selections_count(element_id) {
    var x = document.getElementById(element_id);
    var cbs = x.getElementsByTagName("input");
    var rowCount = cbs.length;
    var selected_count=0;


    for(var i=0; i<rowCount; i++) {
        if(null != cbs[i] && true == cbs[i].checked) {
            selected_count += 1;
        }
    }

    return selected_count;
}

function remove_cb_selections(element_id) {
    var x = document.getElementById(element_id);
    var cbs = x.getElementsByTagName("input");
    var rowCount = cbs.length;
    var filterString = ''

    for(var i=0; i<rowCount; i++) {
        if(null != cbs[i] && true == cbs[i].checked) {
            cbs[i].checked = false;
        }
    }
}


    async function addProjectUser(project_id, user_id) {
        await add_project_user(project_id, user_id, user_id);
        return true;
    }


    async function removeProjectUser(project_id, user_id) {
        await remove_project_user(project_id, user_id, user_id);
        return true;
    }


async function saveProject(element,e_event, project_id, user_id){
    saving = true;
    if (element.childNodes[0].style.color=='red') {
        element.childNodes[0].style.color='white'; 
        await removeProjectUser(project_id, user_id).then(data=>{
            // if(data) update_results(); 
        });
    } 
    else{
        element.childNodes[0].style.color='red'; 
         await addProjectUser(project_id, user_id).then(data=>{
            // if(data) update_results(); 
        });
    } 
    
    return false;

}

function checkSave(){
    if (saving) {
        return false;
    }

    return true;

}


