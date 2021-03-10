        var slideIndex = 1;


        var user_id;

        window.addEventListener('load', (event) => {
            user_id = document.getElementById('user_id').value;
            init_page();
        });


        function currentSlide(n) {
            showSlides(slideIndex = n);
        }

        function showSlides(n) {
            var i;
            var slides = document.getElementsByClassName("galleryImage");
            var dots = document.getElementsByClassName("demo");
            // var captionText = document.getElementById("caption");
            if (n > slides.length) { slideIndex = 1 }
            if (n < 1) { slideIndex = slides.length }
            for (i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
            }
            for (i = 0; i < dots.length; i++) {
                dots[i].className = dots[i].className.replace(" active", "");
            }
            slides[slideIndex - 1].style.display = "block";
            dots[slideIndex - 1].className += " active";
            // captionText.innerHTML = dots[slideIndex - 1].alt;
        }

        async function init_page() {
            var id = window.location.search.split("?")[1];
            console.log(id);
            await loadProject(id);
            // showSlides(slideIndex);
        }

        async function loadProject(project_id) {
            var mainContent = document.getElementById("mainContent-wrap");
            var project = document.createElement("div");
            var projectTitle = document.createElement("div");
            var projectContent = document.createElement("div");
            var projectRow = document.createElement("div");
            var projectLeft = document.createElement("div");
            var projectRight = document.createElement("div");
            var projectInfo = document.createElement("div");
            var projectGallery = document.createElement("div");
            var imgNumber = document.createElement("div");
            var galleryImage_img = document.createElement("img");
            var galleryRow = document.createElement("div");
            var galleryRow_img = document.createElement("img");
            var galleryImage = document.createElement("div");
            var galleryColumn = document.createElement("div");
            var projectName = document.createElement("p");
            var projectShortDescription = document.createElement("p");
            var projectLongDescription = document.createElement("p");
            var obsButtons = document.createElement("div");
            var obsButtonView = document.createElement("a");
            var obsButtonSubmit = document.createElement("a");
            var captionContainer = document.createElement("div");
            var caption = document.createElement("p");

            var projectNameHeader = document.createElement("h1");
            var projectTeacherHeader = document.createElement("h2");
            var projectShortDescriptionHeader = document.createElement("h4");
            var projectLongDescriptionHeader = document.createElement("h4");
            var projectMaterialsHeader = document.createElement("h4");
            var projectTopicsHeader = document.createElement("h4");
            var projectLocationsHeader = document.createElement("h4");

            projectTitle.append(projectNameHeader);
            projectTitle.append(projectTeacherHeader);
            projectShortDescriptionHeader.innerHTML = "<b>Project Description:</b>";
            projectLongDescriptionHeader.innerHTML = "<b>Project Notes:</b>";
            projectMaterialsHeader.innerHTML = "<b>Project Materials:</b>";
            projectTopicsHeader.innerHTML = "<b>Project Topics:</b>";
            projectLocationsHeader.innerHTML = "<b>Project Locations:</b>";

            await get_project_user(project_id, user_id, user_id).then(user_info => {
                if(user_info){
                    imgNumber.innerHTML = '<span id="save-heart" onclick="javascript: if (this.childNodes[0].style.color==\'red\') {this.childNodes[0].style.color=\'white\'; removeProjectUser(' + project_id +',' + user_id+ ')} else{this.childNodes[0].style.color=\'red\'; addProjectUser(' + project_id +',' + user_id+ ')} return true;" style="font-size:24px"><i class="fa fa-heart"style="color:red"></i></span>';
                }
                else {
                    imgNumber.innerHTML = '<span id="save-heart" onclick="javascript: if (this.childNodes[0].style.color==\'red\') {this.childNodes[0].style.color=\'white\'; removeProjectUser(' + project_id +',' + user_id+ ')} else{this.childNodes[0].style.color=\'red\'; addProjectUser(' + project_id +',' + user_id+ ')} return true;" style="font-size:24px"><i class="fa fa-heart"style="color:white"></i></span>';
                }
            })

            project.className = "project";
            projectRow.className = "row";
            projectLeft.className = "left-column";
            projectRight.className = "right-column";
            projectTitle.className = "projectTitle";
            projectContent.className = "projectContent";
            projectInfo.className = "projectInfo";
            captionContainer.className = "caption-container";
            caption.id="caption";
            captionContainer.append(caption);

            projectGallery.className = "projectGallery";




            imgNumber.className = "imgNumber";
            galleryRow.className = "galleryRow";
            galleryImage.className = "galleryImage";
            galleryColumn.className = "galleryColumn";
            obsButtons.className = "obsButtons";
            galleryRow_img.className = "demo cursor";

            galleryImage_img.style.width = "100%";
            obsButtonView.href = "https://wonderbar-cs467.ue.r.appspot.com/viewObservations?" + project_id;
            obsButtonSubmit.href = "https://wonderbar-cs467.ue.r.appspot.com/addObservations?" + project_id;
            obsButtonSubmit.setAttribute("onclick", "return addProjectUser(" + project_id + "," + user_id + ")");
            obsButtonView.innerText = "View Observations";
            obsButtonSubmit.innerText = "Add New Observation";

            mainContent.append(project);
            project.append(projectTitle);
            project.append(projectContent);
            projectInfo.append(projectShortDescriptionHeader);
            projectInfo.append(projectShortDescription);
            projectInfo.append(projectLongDescriptionHeader);
            projectInfo.append(projectLongDescription);
            projectContent.append(projectRow);
            projectRow.append(projectLeft);
            projectRow.append(projectRight);
            projectLeft.append(projectGallery);
            projectRight.append(projectInfo);
            projectGallery.append(galleryImage);
            // projectGallery.append(captionContainer);
            // galleryImage.append(imgNumber);

            if (user_id != "" && user_id != null) {
                galleryImage.append(imgNumber);

            }

            galleryImage.append(galleryImage_img);
            // projectGallery.append(galleryRow);
            galleryRow.append(galleryColumn);
            galleryColumn.append(galleryRow_img);
            projectGallery.append(obsButtons);
            obsButtons.append(obsButtonView);
            obsButtons.append(obsButtonSubmit);



            var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbusers?limit=1&offset=0';

            await fetchData(url, user_id).then(project_users=>{
                var recent_obs = document.createElement("a");
                recent_obs.href = "";
                recent_obs.setAttribute("onclick", "return false");
                recent_obs.className = "recent_obs";

                var obs_container = document.createElement("div");
                obs_container.className = "obs-container";

                var h2 = document.createElement("h2");
                h2.innerHTML = "Project User Count";

                var count_p = document.createElement("p");
                count_p.id = "project_count_id";
                count_p.innerHTML = project_users["count"];

                obs_container.appendChild(recent_obs);
                recent_obs.appendChild(h2);
                recent_obs.appendChild(count_p);

                projectGallery.appendChild(obs_container);
            });

            var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbobservations?limit=1&offset=0';

            await fetchData(url, user_id).then(project_users=>{
                var recent_obs = document.createElement("a");
                recent_obs.href = "";
                recent_obs.setAttribute("onclick", "return false");
                recent_obs.className = "recent_obs";

                var obs_container = document.createElement("div");
                obs_container.className = "obs-container";

                var h2 = document.createElement("h2");
                h2.innerHTML = "Observation Count";

                var count_p = document.createElement("p");
                count_p.id = "project_count_id";
                count_p.innerHTML = project_users["count"];

                obs_container.appendChild(recent_obs);
                recent_obs.appendChild(h2);
                recent_obs.appendChild(count_p);

                projectGallery.appendChild(obs_container);
            });


            var url = 'https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbprompts?limit=1&offset=0';

            await fetchData(url, user_id).then(project_users=>{
                var recent_obs = document.createElement("a");
                recent_obs.href = "";
                recent_obs.setAttribute("onclick", "return false");
                recent_obs.className = "recent_obs";

                var obs_container = document.createElement("div");
                obs_container.className = "obs-container";

                var h2 = document.createElement("h2");
                h2.innerHTML = "Prompt Count";

                var count_p = document.createElement("p");
                count_p.id = "project_count_id";
                count_p.innerHTML = project_users["count"];

                obs_container.appendChild(recent_obs);
                recent_obs.appendChild(h2);
                recent_obs.appendChild(count_p);

                projectGallery.appendChild(obs_container);
            });


                await get_project(project_id, user_id)
                .then(async data => {
                    console.log(data);
                    await get_teacher(data["creator_id"], user_id)
                    .then(data=>{
                        projectTeacherHeader.innerHTML = data["title"] + ' ' + data["last_name"];
                    });
                    projectNameHeader.innerHTML = data["name"];
                    projectShortDescription.innerHTML = data["short_description"];
                    projectLongDescription.innerHTML = data["long_description"];
                    galleryImage_img.src = data["avatar"];
                });

                 projectInfo.append(projectMaterialsHeader);
                await get_project_materials(project_id, user_id)
                .then(data => {
                    console.log(data);
                    var materialCount = data["count"]
                    var projectMaterial = document.createElement("p");
                   if (materialCount == 0) {
                        projectMaterial.innerHTML = "None";
                        projectInfo.append(projectMaterial);
                    }
                    else {
                        projectMaterial = document.createElement("p");
                        for(var i=0; i<materialCount; i++) {
                            projectMaterial.innerHTML += data["results"][i]["quantity"] + " " + data["results"][i]["name"] + ", ";
                        }
                        projectMaterial.innerHTML = projectMaterial.innerHTML.substring(0, projectMaterial.innerHTML.length - 2);
                        projectInfo.append(projectMaterial);
                    }

                });

                projectInfo.append(projectTopicsHeader);
                await get_project_topics(project_id, user_id)
                .then(data => {
                    console.log(data);
                    var materialCount = data["count"]
                    var projectMaterial = document.createElement("p");
                   if (materialCount == 0) {
                        projectMaterial.innerHTML = "None";
                        projectInfo.append(projectMaterial);
                    }
                    else {
                        projectMaterial = document.createElement("p");
                        for(var i=0; i<materialCount; i++) {
                            projectMaterial.innerHTML += data["results"][i]["name"] +", ";
                        }
                        projectMaterial.innerHTML = projectMaterial.innerHTML.substring(0, projectMaterial.innerHTML.length - 2);
                        projectInfo.append(projectMaterial);
                    }

                });


                projectInfo.append(projectLocationsHeader);
                await get_project_locations(project_id, user_id)
                .then(data => {
                    console.log(data);
                    var materialCount = data["count"]
                    var projectMaterial = document.createElement("p");
                   if (materialCount == 0) {
                        projectMaterial.innerHTML = "None";
                        projectInfo.append(projectMaterial);
                    }
                    else {
                        projectMaterial = document.createElement("p");
                        for(var i=0; i<materialCount; i++) {
                            projectMaterial.innerHTML += data["results"][i]["name"] +", ";
                        }
                        projectMaterial.innerHTML = projectMaterial.innerHTML.substring(0, projectMaterial.innerHTML.length - 2);
                        projectInfo.append(projectMaterial);
                    }

                });
        }


    async function addProjectUser(project_id, user_id) {
        await add_project_user(project_id, user_id, user_id);
        return true;
    }


    async function removeProjectUser(project_id, user_id) {
        await remove_project_user(project_id, user_id, user_id);
        return true;
    }

