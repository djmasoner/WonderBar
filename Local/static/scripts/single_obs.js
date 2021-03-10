var user_id;
var project_prompts;
// var currentTab = 0;
var loader;
// var prompt_id = window.location.search.split("?")[1];
var observation_id = window.location.search.split("?")[1];
var response_type;
var obs_per_page = 10;
var total_observations = 0;
var observations_pulled = 0;
var current_page  =0;
var prompt;
var single_observation;
// var overflow = document.getElementById("overflow");
        var map;
        var marker = null;
        var pos;


        var project_data = {
            header: ["Name", "Count"],
            rows: [
        ]};
async function getObservationData() {
	const response = await get_observation(observation_id, user_id).then(async data=>{
		single_observation = data;

		if(data){
			prompt_id = data["prompt_id"];
			await getPromptData().then(testing=>{

			});
		}
		else
		{
			alert('This observation does not exist!');
			window.location.href = "/profile";
		}
			// await getObservations(project_prompts["results"][i]["id"]).then(observations=>{
			// });
		// }


		return true;
	});
	return response;
}

async function getPromptData() {
	const response = await get_project_prompt(prompt_id, user_id).then(async data=>{
		prompt = data;

		if(data){
			await create_new_tab(prompt, 0).then(testing=>{

			});
		}
		else
		{
			alert('This prompt does not exist!');
			window.location.href = "/profile";
		}
			// await getObservations(project_prompts["results"][i]["id"]).then(observations=>{
			// });
		// }


		return true;
	});
	return response;
}

var charts = {};

async function init_page (){
	// document.getElementById('map').style.display = "none";
	// overflow.style.display = "none";
		// document.getElementById("mainContent-wrap").style.display = "none";
		// loader.style.display = "block";


	await getObservationData().then(data => {
		// loader.style.display = "none";
		// showTab(currentTab)
		// overflow.style.display = "block";

		
		loader.style.display = "none";
		document.getElementById("mainContent-wrap").style.display = "block";
		var event = new Event('resize');
		window.dispatchEvent(event);

		return true;
	});
		
		// showTab(currentTab)
	}

window.addEventListener('load', (event) => {
	user_id = document.getElementById('user_id').value;
	loader = document.getElementById("loader");
	init_page().then(data=>{
		if(single_observation["location"]!=null){

			initialize();
		}
	});
});


function update_results() {
	observations_pulled = 0;
	obs_per_page = document.getElementById("obs-per-page").value;
	create_new_tab(prompt);

}

async function create_new_tab(prompt, i) {

	var step_div = document.getElementById("steps");
	var new_span = document.createElement("span");
	var new_a = document.createElement("a");
	new_a.href = "#tab" + prompt["id"];
	new_span.className = "step";
	new_span.id = "span" + prompt["id"];
	new_span.innerHTML = i + 1;
	new_a.appendChild(new_span);
	// step_div.appendChild(new_a);

	var project = document.createElement("div");
	project.className = "project";

	var tab = document.createElement("div");
	tab.className = "tab";
	tab.id = "tab" + prompt["id"];
	var projectTitle = document.createElement("div");
	projectTitle.className = "projectTitle";
	var title_row = document.createElement("div");
	title_row.className = "row";

	var title_left_column1 = document.createElement("div");
	var title_right_column1 = document.createElement("div");
	title_left_column1.className = "right-column";
	title_right_column1.className = "left-column";

	var h1 = document.createElement("h1");
	h1.innerHTML = prompt["subheading"];
	title_left_column1.appendChild(h1);


	await get_project(prompt["project_id"], user_id).then(project=>{
		if(project){
			var h2 = document.createElement("h2");
			h2.innerHTML = "Project: " + project["name"];
			title_left_column1.appendChild(h2);
		}
	});

	// var home_a = document.createElement("a");
	// home_a.href = "#steps";

	// var home_btn = document.createElement("button");
	// home_btn.innerHTML = "Back to top"
	// home_a.appendChild(home_btn);
	// home_a.style.float = "right";
	// title_right_column1.appendChild(home_a);


	// var obs_a = document.createElement("a");
	// obs_a.href = "/viewAllObservations?" + prompt["id"];

	// var obs_btn = document.createElement("button");
	// obs_btn.innerHTML = "View All Observations"
	// obs_a.appendChild(obs_btn);
	// obs_a.target = "_blank";
	// title_left_column1.appendChild(obs_a);

	title_row.appendChild(title_left_column1);
	title_row.appendChild(title_right_column1);

	var projectContent = document.createElement("div");
	projectContent.className = "projectContent";


	var content_row1 = document.createElement("div");
	content_row1.className = "row";
	var content_left_column1 = document.createElement("div");
	var content_right_column1 = document.createElement("div");
	content_left_column1.className = "left-column";
	content_right_column1.className = "right-column";


	var div = document.createElement("div");
	div.className = "media-files";

	var obs_div_blue = document.createElement("div");
	obs_div_blue.className = "obs-container";

	var label = document.createElement("h2");
	label.innerHTML = "Prompt Description";

	var p = document.createElement("p");
	p.innerHTML = prompt["description"];
	// projectContent.appendChild(p);
	obs_div_blue.appendChild(label)
	obs_div_blue.appendChild(p);




	content_right_column1.appendChild(obs_div_blue);


	await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + user_id, user_id).then(user=>{

		obs_div_blue = document.createElement("div");
		obs_div_blue.className = "obs-container";
		obs_div_blue.className += " obs-links";
		var label = document.createElement("h2");
		label.innerHTML = "User";
		obs_div_blue.appendChild(label)


			p=document.createElement("p");

			var user_link = document.createElement("a");
			user_link.href = "profile?" + user["id"];
			// user_link.href = "profile?220";

			var avatar = document.createElement("img");
			avatar.src = user["avatar"];
			if (avatar.src == null||avatar.src == "") {
				avatar.src = "/static/images/default-profile.png";
			}
			avatar.setAttribute("onerror","this.onerror=null;this.src='/static/images/default-profile.png';" );

			avatar.className = "avatar";
			user_link.appendChild(avatar);
			user_link.innerHTML += user["username"];
			// user_link.innerHTML += "monique2";

			// var span = document.createElement("span");
			// span.innerHTML = user["obs_count"];
			// // span.innerHTML = "45";
			// span.style.float = "right";
			// span.style.borderRadius = "50%";


			// user_link.appendChild(span);

			p.appendChild(user_link);
			obs_div_blue.appendChild(p);



		content_right_column1.appendChild(obs_div_blue);	
	});

	obs_div_blue = document.createElement("div");
	obs_div_blue.className = "obs-container";

	var obs_summary = document.createElement("h2");
	obs_summary.innerHTML = "Observation";
	obs_div_blue.appendChild(obs_summary);
	content_right_column1.appendChild(obs_div_blue);

	var date_p = document.createElement("p");

	var date = new Date(single_observation["time_observed"]+ ' UTC');
	console.log(date.toString());
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

	date_p.innerHTML = date;
	obs_div_blue.appendChild(date_p);




	var obs_div = document.createElement("div");
	obs_div.id = "noobs" + prompt["id"];
	obs_div_blue.appendChild(obs_div);

	var obs_sum_p = document.createElement("p");
	obs_sum_p.id = "obs-pages";
	obs_div_blue.appendChild(obs_sum_p);




		var response = await get_response_type(prompt["response_type_id"], user_id).then(async data => {
			response_type = data["name"];
			var obs_div_blue = document.createElement("div");
			obs_div_blue.className = "obs-container";
			switch (data["name"]) {
				case "checkbox":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							var new_p = document.createElement("p");
							new_p.innerHTML = single_observation["response"];
							new_page.appendChild(new_p);
						// }
						obs_sum_p.appendChild(new_page);
					// });

					break;
				case "dropdown":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							var new_p = document.createElement("p");
							new_p.innerHTML = single_observation["response"];
							new_page.appendChild(new_p);
						// }
						obs_sum_p.appendChild(new_page);
					// });
					break;
				case "radio":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							var new_p = document.createElement("p");
							new_p.innerHTML = single_observation["response"];
							new_page.appendChild(new_p);
						// }
						obs_sum_p.appendChild(new_page);
					// });
					break;
				case "numeric_entry":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							var new_p = document.createElement("p");
							new_p.innerHTML = single_observation["response"];
							new_page.appendChild(new_p);
						// }
						obs_sum_p.appendChild(new_page);
					// });
					break;
				case "text_entry":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							var new_p = document.createElement("p");
							new_p.innerHTML = single_observation["response"];
							new_page.appendChild(new_p);
						// }
						obs_sum_p.appendChild(new_page);
					// });
					break;
				case "image":

						var new_page = document.createElement("div");
						new_page.className = "page";
						// for (var i = 0; i < observations["results"].length; i++) {
							await createGalleryImage(single_observation["response"], single_observation["additional_notes"], single_observation["id"]).then(new_img=>{
								new_page.appendChild(new_img);
							});
						// }
						obs_sum_p.appendChild(new_page);
					// });
					break;

			}


	if(single_observation["additional_notes"]!=null){

		obs_div_blue = document.createElement("div");
		obs_div_blue.className = "obs-container";
		var obs_comment = document.createElement("h2");
		obs_comment.innerHTML = "Comment";
		obs_div_blue.appendChild(obs_comment);
		content_right_column1.appendChild(obs_div_blue);

		var comment_p = document.createElement("p");
		comment_p.innerHTML = single_observation["additional_notes"];
		obs_div_blue.appendChild(comment_p);
	}

	if(single_observation["location"]!=null){

		obs_div_blue = document.createElement("div");
		obs_div_blue.className = "obs-container";
		var obs_location = document.createElement("h2");
		obs_location.innerHTML = "Location";
		obs_div_blue.appendChild(obs_location);
		content_right_column1.appendChild(obs_div_blue);

		var location_p = document.createElement("p");
		var location_div = document.createElement("div");
		location_p.appendChild(location_div);
		location_div.id = "map";
		
		pos = {
			lat: Number(single_observation["location"].split(",")[0]),
			lng: Number(single_observation["location"].split(",")[1])
		}
		// initialize();
		// location_p.innerHTML = single_observation["location"];
		obs_div_blue.appendChild(location_p);
	}



	project.appendChild(tab);
	tab.appendChild(projectTitle);
	tab.appendChild(projectContent);

	projectTitle.appendChild(title_row);
	projectContent.appendChild(content_row1);
	content_row1.appendChild(content_left_column1);
	content_row1.appendChild(content_right_column1);


	overflow_div = document.createElement("div");
	overflow_div.style.overflow = "auto";
	// var project = document.getElementById("project");
	project.appendChild(overflow_div);

	step_div.parentElement.replaceChild(project, step_div.nextSibling);


	// overflow.parentElement.insertBefore(project, overflow);
	// overflow.parentElement.insertBefore(document.createElement("p"), overflow);

	await google.charts.load('current', {packages: ['corechart']}).then(async dd=>{await drawChart(prompt["id"], user_id, "obs" + prompt["id"])});




		});


return prompt;
}



        // function getLocation() {
        //    if (navigator.geolocation) {
        //        navigator.geolocation.getCurrentPosition(position => {
        //            pos = {
        //                lat: position.coords.latitude,
        //                lng: position.coords.longitude
        //            }
        //            initialize();
        //        })
        //    return pos;
        //    }
        //    else {
        //    	alert("Geolocation not supported by browser");
        //    	return false;
        //    }
        //  }


         function initialize() {
             var mapOptions = {
                 zoom: 15,
                 disableDefaultUI: true,
                 center: new google.maps.LatLng(pos), //center on sherbrooke
                 mapTypeId: google.maps.MapTypeId.ROADMAP
             };

             $("#coordinate").val(pos.lat + ", " + pos.lng);

             map = new google.maps.Map(document.getElementById('map'), mapOptions);
             marker = new google.maps.Marker({ position: pos, map: map, title: "Location"})


		// loader.style.display = "none";
		// document.getElementById('map').style.display = "block";

         }

function yesnoCheck() {

	var i;
	var materials_fields = document.getElementsByClassName("add-location");

	document.getElementById('location-radio-label').classList.remove("invalid");

	if (document.getElementById('location_yes').checked) {
		getLocation();
		for (i = 0; i < materials_fields.length; i++) {
		  materials_fields[i].style.display = "block";
		}

	}
	else {
		for (i = 0; i < materials_fields.length; i++) {
		  materials_fields[i].style.display = "none";
		}
	}
}



 
async function getData(prompt_id, user_id, element_id) {
	var data = {
	    header: ["Name", "Count"],
	    rows: [
	]};
	const response = await get_observations_count(prompt_id, user_id).then(async response_data=>{
	  var pr_prompts = response_data;
	  var total_obs = 0;
	  for (var i=0; i < pr_prompts["results"].length; i++) {
	    var new_row=[];
	    new_row.push(pr_prompts["results"][i]["response"]);
	    new_row.push(pr_prompts["results"][i]["response_count"]);
	    total_obs += parseInt(pr_prompts["results"][i]["response_count"]);
	   data["rows"].push(new_row);
	  }

	  return data;
	});

	return response;
}

async function getObservations(prompt_id, limit=0) {
	if (limit>0){
			return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id + '/dbobservations?limit=' + limit + '&offset=' + observations_pulled, user_id)
	}
			return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id + '/dbobservations', user_id)
			// return true;
}


async function drawChart(prompt_id, user_id, element_id, chart_type="ColumnChart") {

  return await getData(prompt_id, user_id, element_id).then(chart_info=>{

  // Define the chart to be drawn.
    if (chart_info["rows"].length > 0){
    	
			var colors = [
			'#3366cc',
			'#dc3912',
			'#ff9900',
			'#109618',
			'#990099',
			'#0099c6',
			'#dd4477',
			'#66aa00',
			'#b82e2e',
			'#316395'
			];

        var slice_colors = {};


		 chart_info["header"].push({ role: 'style' });
    	for(var i = 0; i < chart_info["rows"].length; i++) {
    		chart_info["rows"][i].push('color:' + colors[i%colors.length]);
    		slice_colors[i] = {color: colors[i%colors.length]}
    	}
        var data2 = new google.visualization.DataTable();
        data2.addColumn(chart_info["header"]);
        data2.addColumn('number', 'Count');
        data2.addColumn({ role: 'style' }, 'Color');
        data2.addRows(chart_info["rows"]);



         var options = {
           title: 'Prompt Response Option Count',
           width: "100%",
           height: 300,
           bar: {groupWidth: '95%'},
           vAxis: {minValue: 0},
           pieHole: 0.4,
           legend: {position: 'right'},
           slices: slice_colors
         };

        // Instantiate and draw the chart.
        try{
        	switch (chart_type) { 
        		case "ColumnChart":
        			options["legend"] = 'none';
			        var chart = new google.visualization.ColumnChart(document.getElementById(element_id));
			        chart.draw(data2, options);
			        document.getElementById("obs-per-page").remove();
			        break;
        		case "PieChart":
        			options["legend"] = {position: 'right'};
			        var chart = new google.visualization.PieChart(document.getElementById(element_id));
			        chart.draw(data2, options);
			        document.getElementById("obs-per-page").remove();
			        break;
        		case "BarChart":
        			options["legend"] = 'none';
			        var chart = new google.visualization.BarChart(document.getElementById(element_id));
			        chart.draw(data2, options);
			        document.getElementById("obs-per-page").remove();
			        break;
        	}
        	document.getElementById("chart-options-dropdown" + prompt_id).style.display = "block";
			charts[chart] = [data2, options, element_id];

        	document.getElementById("chart-options-dropdown" + prompt_id).addEventListener('change', async function() {
				  await selectHandler(chart, data2, element_id, prompt_id, options);
				});
	    }
	    catch{
	    	// document.getElementById("no" + element_id).innerHTML = "No observations yet...";
	    	return false;
	    }
	}
  });
}

function selectHandler(chart, data2, element_id,prompt_id, options) {
					// chart_input.id = "chart-options-dropdown" + prompt["id"];
					// chart_input.className = "chart-options-dropdown";

	chart_type = document.getElementById("chart-options-dropdown" + prompt_id).value;
     // var options = {
     //   title: 'Prompt Response Option Count',
     //   width: "100%",
     //   height: 300,
     //   // legend: 'none',
     //   bar: {groupWidth: '95%'},
     //   vAxis: {minValue: 0},
     //   pieHole: 0.4,
     //   legend: {position: 'top', textStyle: {color: 'blue', fontSize: 16}}
     // };

	switch (chart_type) { 
		case "ColumnChart":
			options["legend"] = 'none';
	        chart = new google.visualization.ColumnChart(document.getElementById(element_id));
	        chart.draw(data2, options);
	        break;
		case "PieChart":
			options["legend"] = {position: 'right'};
	        chart = new google.visualization.PieChart(document.getElementById(element_id));
	        chart.draw(data2, options);
	        break;
		case "BarChart":
			options["legend"] = 'none';
	        chart = new google.visualization.BarChart(document.getElementById(element_id));
	        chart.draw(data2, options);
	        break;
	}
	charts[chart] = [data2, options, element_id];

	document.getElementById("chart-options-dropdown" + prompt_id).addEventListener('change', function() {
		  selectHandler(chart, data2, element_id, prompt_id, options);
		});

	return true;
}



function resizeCharts() {

	var x = document.getElementsByClassName("chart-options-dropdown");
	for (var i = 0; i < x.length; i++){
		var event = new Event('change');
		x[i].dispatchEvent(event);
	}
	// for (let chart in charts) {
	// chart.trigger("select");
		// c = new google.visualization.BarChart(document.getElementById(charts[chart][2]));
		// c.draw(charts[chart][0],charts[chart][1]);
		// charts[c] = [charts[chart][0],charts[chart][1],charts[chart][2]];
		// delete charts[chart];
	 //  // do something for each key in the object 
	// }
}

if (document.addEventListener) {
    window.addEventListener('resize', resizeCharts);
}
else if (document.attachEvent) {
    window.attachEvent('onresize', resizeCharts);
}
else {
    window.resize = resizeCharts;
}
// <div class="responsive">
//   <div class="gallery">
//     <a target="_blank" href="img_mountains.jpg">
//       <img src="img_mountains.jpg" alt="Mountains" width="600" height="400">
//     </a>
//     <div class="desc">Add a description of the image here</div>
//   </div>
// </div>

async function createGalleryImage(src, description, observation_id) {
	responsive_div = document.createElement("div");
	gallery_div = document.createElement("div");
	obs_link = document.createElement("a");
	obs_img = document.createElement("img");

	responsive_div.className = "responsive";
	gallery_div.className = "gallery";
	obs_img.src = src;
	obs_img.width = "600";
	obs_img.height = "400";

	obs_link.appendChild(obs_img);
	gallery_div.appendChild(obs_link);
	responsive_div.appendChild(gallery_div);

	return responsive_div;

}




async function addMoreObservations(direction=true){

	var obs_sum_p = document.getElementById("obs-pages");

	var old_load_less = document.getElementById('load-less-obs');
	var old_load = document.getElementById('load-more-obs');
	var num_pages = document.getElementsByClassName("page").length;
	var pages = document.getElementsByClassName("page");

	if (direction) {
		if (current_page <= num_pages - 1){
			if (observations_pulled < total_observations && current_page==num_pages - 1) {
				current_page = current_page + 1;
				try{
					old_load.remove();
				}
				catch{}
				try{
					old_load_less.remove();
				}
				catch{}

				switch (response_type) {
					case "numeric_entry":
						await getObservations(prompt_id, obs_per_page).then(async observations=>{
							observations_pulled += observations["results"].length;
							total_observations = observations["count"];
							var new_page = document.createElement("div");
							new_page.className = "page";
							for (var i = 0; i < observations["results"].length; i++) {
								var new_p = document.createElement("p");
								new_p.innerHTML = observations["results"][i]["response"];
								new_page.appendChild(new_p);
							}
							obs_sum_p.appendChild(new_page);
							new_page.previousSibling.style.display = "none";
						});
						break;
					case "text_entry":
						await getObservations(prompt_id, obs_per_page).then(async observations=>{
							observations_pulled += observations["results"].length;
							total_observations = observations["count"];
							var new_page = document.createElement("div");
							new_page.className = "page";
							for (var i = 0; i < observations["results"].length; i++) {
								var new_p = document.createElement("p");
								new_p.innerHTML = observations["results"][i]["response"];
								new_page.appendChild(new_p);
							}
							obs_sum_p.appendChild(new_page);
							new_page.previousSibling.style.display = "none";
						});
						break;
					case "image":
						await getObservations(prompt_id, obs_per_page).then(async observations=>{
							observations_pulled += observations["results"].length;
							total_observations = observations["count"];
							var new_page = document.createElement("div");
							new_page.className = "page";
							for (var i = 0; i < observations["results"].length; i++) {
								await createGalleryImage(observations["results"][i]["response"], observations["results"][i]["additional_notes"], observations["results"][i]["id"]).then(new_img=>{
									new_page.appendChild(new_img);
								});
							}
							obs_sum_p.appendChild(new_page);
							new_page.previousSibling.style.display = "none";
						});
						break;
				}

				var load_less_btn = document.createElement("button");
				load_less_btn.id = "load-less-obs";
				load_less_btn.innerHTML = "Prev";
				load_less_btn.setAttribute("onclick", "addMoreObservations(false)");
				obs_sum_p.appendChild(load_less_btn);

				var load_more_btn = document.createElement("button");
				load_more_btn.id = "load-more-obs";
				load_more_btn.innerHTML = "Next";
				load_more_btn.setAttribute("onclick", "addMoreObservations()");
				obs_sum_p.appendChild(load_more_btn);


				if (observations_pulled >= total_observations) {
					old_load = document.getElementById('load-more-obs');
					old_load.remove();
				}
			}
			else if (current_page < num_pages - 1){
				current_page = current_page + 1;
				pages[current_page].style.display = "block";
				pages[current_page - 1].style.display = "none";


				try{
					old_load.remove();
				}
				catch{}
				try{
					old_load_less.remove();
				}
				catch{}

				var load_less_btn = document.createElement("button");
				load_less_btn.id = "load-less-obs";
				load_less_btn.innerHTML = "Prev";
				load_less_btn.setAttribute("onclick", "addMoreObservations(false)");
				obs_sum_p.appendChild(load_less_btn);

				var load_more_btn = document.createElement("button");
				load_more_btn.id = "load-more-obs";
				load_more_btn.innerHTML = "Next";
				load_more_btn.setAttribute("onclick", "addMoreObservations()");
				obs_sum_p.appendChild(load_more_btn);

				if (current_page == num_pages -1) {
					old_load = document.getElementById('load-more-obs');
					old_load.remove();
				}
			}
		}
	}
	else {
		if (current_page >0) {
			pages[current_page].style.display = "none";
			pages[current_page - 1].style.display = "block";

				try{
					old_load.remove();
				}
				catch{}
				try{
					old_load_less.remove();
				}
				catch{}


			var load_less_btn = document.createElement("button");
			load_less_btn.id = "load-less-obs";
			load_less_btn.innerHTML = "Prev";
			load_less_btn.setAttribute("onclick", "addMoreObservations(false)");
			obs_sum_p.appendChild(load_less_btn);

			var load_more_btn = document.createElement("button");
			load_more_btn.id = "load-more-obs";
			load_more_btn.innerHTML = "Next";
			load_more_btn.setAttribute("onclick", "addMoreObservations()");
			obs_sum_p.appendChild(load_more_btn);

			current_page = current_page - 1;
			if (current_page == 0) {
				old_load_less = document.getElementById('load-less-obs');
				old_load_less.remove();
			} 

		}
		else{
			old_load_less.remove();
		}


	}

}

