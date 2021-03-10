var user_id;
var project_prompts;
var loader;
var project_id = window.location.search.split("?")[1];

var project_data = {
	header: ["Name", "Count"],
	rows: [
]};


async function getPromptData() {
	const response = await get_project_prompts(project_id, user_id).then(async data=>{
		project_prompts = data;
		for (var i=0; i < project_prompts["count"]; i++) {
			await create_new_tab(project_prompts["results"][i], i).then(testing=>{

			});
		}


		return true;
	});
	return response;
}
var charts = {};

async function init_page (){
		document.getElementById("mainContent-wrap").style.display = "none";
		loader.style.display = "block";


	await getPromptData().then(data => {
		loader.style.display = "none";
		document.getElementById("mainContent-wrap").style.display = "block";
		var event = new Event('resize');
		window.dispatchEvent(event);

		return true;
	});

}

window.addEventListener('load', (event) => {
	user_id = document.getElementById('user_id').value;
	loader = document.getElementById("loader");
	init_page();
});


async function create_new_tab(prompt, i) {

	var step_div = document.getElementById("steps");
	var new_span = document.createElement("span");
	var new_a = document.createElement("a");
	new_a.href = "#tab" + prompt["id"];
	new_span.className = "step";
	new_span.id = "span" + prompt["id"];
	new_span.innerHTML = i + 1;
	new_a.appendChild(new_span);
	step_div.appendChild(new_a);

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


	await get_project(project_id, user_id).then(project=>{
		if(project){
			var h2 = document.createElement("h2");
			h2.innerHTML = "Project: " + project["name"];
			title_left_column1.appendChild(h2);
		}
	});

	var home_a = document.createElement("a");
	home_a.href = "#steps";

	var home_btn = document.createElement("button");
	home_btn.innerHTML = "Back to top"
	home_a.appendChild(home_btn);
	home_a.style.float = "right";
	title_right_column1.appendChild(home_a);


	var obs_a = document.createElement("a");
	obs_a.href = "/viewAllObservations?" + prompt["id"];

	var obs_btn = document.createElement("button");
	obs_btn.innerHTML = "View All Observations"
	obs_a.appendChild(obs_btn);
	obs_a.target = "_blank";
	title_left_column1.appendChild(obs_a);

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
	label.innerHTML = "Description";

	var p = document.createElement("p");
	p.innerHTML = prompt["description"];
	obs_div_blue.appendChild(label)
	obs_div_blue.appendChild(p);




	content_left_column1.appendChild(obs_div_blue);
	obs_div_blue = document.createElement("div");
	obs_div_blue.className = "obs-container";

	if(prompt["media_type"] != null) {

		switch (prompt["media_type"].toLowerCase()) {
			case "audio":
				var p2 = document.createElement("h2");
				p2.innerHTML = "Instructions Media"
				var obs_div_p = document.createElement("p");
				var audio = document.createElement("audio");
				var source = document.createElement("source");
				source.src = prompt["instructions_media"];
				audio.controls = true;
				audio.className = "media-file";
				audio.appendChild(source);
				div.appendChild(audio);
				obs_div_blue.appendChild(p2);
				obs_div_p.appendChild(div);
				obs_div_blue.appendChild(obs_div_p);
				content_left_column1.appendChild(obs_div_blue);
				break;
			case "video":
				var p2 = document.createElement("h2");
				p2.innerHTML = "Instructions Media"
				var obs_div_p = document.createElement("p");
				var source = document.createElement("source");
				source.src = prompt["instructions_media"];
				var video = document.createElement("video");
				video.controls = true;
				video.className = "media-file";
				video.appendChild(source);
				div.appendChild(video);
				obs_div_blue.appendChild(p2);
				obs_div_p.appendChild(div);
				obs_div_blue.appendChild(obs_div_p);
				content_left_column1.appendChild(obs_div_blue);
				break;
			case "image":
				var p2 = document.createElement("h2");
				p2.innerHTML = "Instructions Media"
				var obs_div_p = document.createElement("p");
				var picture = document.createElement("picture");
				var img = document.createElement("img");
				img.src = prompt["instructions_media"];
				img.className = "media-file";
				picture.appendChild(img);
				div.appendChild(picture);
				obs_div_blue.appendChild(p2);
				obs_div_p.appendChild(div);
				obs_div_blue.appendChild(obs_div_p);
				content_left_column1.appendChild(obs_div_blue);
				break;
			}
		}




	obs_div_blue = document.createElement("div");
	obs_div_blue.className = "obs-container";

	var obs_summary = document.createElement("h2");
	obs_summary.innerHTML = "Observations Summary";
	obs_div_blue.appendChild(obs_summary);
	content_right_column1.appendChild(obs_div_blue);


	var obs_sum_p = document.createElement("p");
	obs_div_blue.appendChild(obs_sum_p);

	var obs_div = document.createElement("div");
	obs_div.id = "noobs" + prompt["id"];
	obs_sum_p.appendChild(obs_div);



	var response = await get_response_type(prompt["response_type_id"], user_id).then(async data => {

		var obs_div_blue = document.createElement("div");
		obs_div_blue.className = "obs-container";
		switch (data["name"]) {
		case "checkbox":
		case "dropdown":
		case "radio":
			content_left_column1.appendChild(obs_div_blue);
			await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt["id"] + '/dbmultientry_items', user_id).then(options=>{
				var label = document.createElement("h2");
				label.innerHTML = "Options";
				obs_div_blue.appendChild(label);
				for(var i=0; i< options["count"];i++){
					var p = document.createElement("p");
					p.innerHTML = options["results"][i]["entry_text"]
					obs_div_blue.appendChild(p);
				}
			});
			var chart_input = document.createElement("select");
			chart_input.id = "chart-options-dropdown" + prompt["id"];
			chart_input.className = "chart-options-dropdown";
			chart_input.style.display = "none";

			var chart_input_option = document.createElement("option");
			chart_input_option = document.createElement("option");
			chart_input_option.value = "ColumnChart";
			chart_input_option.innerHTML = "Column";
			chart_input_option.selected = true;
			chart_input.appendChild(chart_input_option);


			chart_input_option = document.createElement("option");
			chart_input_option.value = "BarChart";
			chart_input_option.innerHTML = "Bar";
			chart_input.appendChild(chart_input_option);

			chart_input_option = document.createElement("option");
			chart_input_option.value = "PieChart";
			chart_input_option.innerHTML = "Pie";
			chart_input.appendChild(chart_input_option);

			obs_sum_p.appendChild(chart_input);

			var obs_div = document.createElement("div");
			obs_div.id = "obs" + prompt["id"];
			obs_div.className = "obs_charts";
			obs_sum_p.appendChild(obs_div);

			break;
		case "numeric_entry":
			await get_observation_stats(prompt["id"], user_id).then(async stats=>{
				var recent_p = document.createElement("h3");
				var new_p = document.createElement("p");
				new_p.innerHTML = "MIN: " + stats["results"][0]["min"];
				obs_sum_p.appendChild(new_p);
				var new_p = document.createElement("p");
				new_p.innerHTML = "MAX: " + stats["results"][0]["max"];
				obs_sum_p.appendChild(new_p);
				var new_p = document.createElement("p");
				new_p.innerHTML = "AVG: " +stats["results"][0]["avg"];
				obs_sum_p.appendChild(new_p);
				var new_p = document.createElement("p");
				new_p.innerHTML = "SUM: " + stats["results"][0]["sum"];
				obs_sum_p.appendChild(new_p);
			});
			break;
		case "text_entry":
			await getObservations(prompt["id"], 12).then(async observations=>{
				var recent_p = document.createElement("h3");
				if (observations["count"]>0) {
					recent_p.innerHTML = "Latest Observations";
					obs_sum_p.appendChild(recent_p);
				}
				for (var i = 0; i < observations["results"].length; i++) {
					var obs_link = document.createElement("a");
					obs_link.target = "_blank";
					obs_link.href = "/viewObservation?" + observations["results"][i]["id"];
					var new_p = document.createElement("p");
					new_p.innerHTML = observations["results"][i]["response"];
					obs_link.appendChild(new_p);
					obs_sum_p.appendChild(obs_link);
				}
			});
			break;
		case "image":
			await getObservations(prompt["id"], 12).then(async observations=>{
				var recent_p = document.createElement("h3");
				if (observations["count"]>0) {
					recent_p.innerHTML = "Latest Observations";
					obs_sum_p.appendChild(recent_p);
				}
				for (var i = 0; i < observations["results"].length; i++) {
					await createGalleryImage(observations["results"][i]["response"], observations["results"][i]["additional_notes"], observations["results"][i]["id"]).then(new_img=>{
						obs_sum_p.appendChild(new_img);
					});
				}
			});
			break;
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
	project.appendChild(overflow_div);

	step_div.parentElement.appendChild(project);

	await google.charts.load('current', {packages: ['corechart']}).then(async dd=>{await drawChart(prompt["id"], user_id, "obs" + prompt["id"])});
		});
	return prompt;
}

var map;
var marker = null;
var pos;



function getLocation() {
   if (navigator.geolocation) {
	   navigator.geolocation.getCurrentPosition(position => {
		   pos = {
			   lat: position.coords.latitude,
			   lng: position.coords.longitude
		   }
		   initialize();
	   })
   return pos;
   }
   else {
	alert("Geolocation not supported by browser");
	return false;
   }
 }


function initialize() {
	 var mapOptions = {
		 zoom: 15,
		 disableDefaultUI: true,
		 center: new google.maps.LatLng(pos),
		 mapTypeId: google.maps.MapTypeId.ROADMAP
	 };

	 $("#coordinate").val(pos.lat + ", " + pos.lng);

	 map = new google.maps.Map(document.getElementById('map'), mapOptions);
	 marker = new google.maps.Marker({ position: pos, map: map, title: "Your location"})

	 google.maps.event.addListener(map, 'click', function(event) {
	   //call function to create marker
	   $("#coordinate").val(event.latLng.lat() + ", " + event.latLng.lng());
	   $("#coordinate").select();

	   //delete the old marker
	   if (marker) { marker.setMap(null); }

	   //creer à la nouvelle emplacement
		marker = new google.maps.Marker({ position: event.latLng, map: map});
	 });
loader.style.display = "none";
document.getElementById('map').style.display = "block";

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



		var p = document.createElement("p");
		p.innerHTML = "Total Observations: " + total_obs.toString();
	

		var aref = document.createElement("a")
		aref.appendChild(p);
		aref.target = "_blank";
		aref.href = "/viewAllObservations?" +  prompt_id;
		document.getElementById("no" + element_id).appendChild(aref);
	// }
	  return data;
	});

	return response;
}

async function getObservations(prompt_id, limit=0) {
	if (limit>0){
			return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id + '/dbobservations?limit=' + limit, user_id)
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
					break;
				case "PieChart":
					options["legend"] = {position: 'right'};
					var chart = new google.visualization.PieChart(document.getElementById(element_id));
					chart.draw(data2, options);
					break;
				case "BarChart":
					options["legend"] = 'none';
					var chart = new google.visualization.BarChart(document.getElementById(element_id));
					chart.draw(data2, options);
					break;
			}
			document.getElementById("chart-options-dropdown" + prompt_id).style.display = "block";
			charts[chart] = [data2, options, element_id];

			document.getElementById("chart-options-dropdown" + prompt_id).addEventListener('change', async function() {
				  await selectHandler(chart, data2, element_id, prompt_id, options);
				});
		}
		catch{
			return false;
		}
	}
  });
}

function selectHandler(chart, data2, element_id,prompt_id, options) {

	chart_type = document.getElementById("chart-options-dropdown" + prompt_id).value;

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


async function createGalleryImage(src, description, observation_id) {
	responsive_div = document.createElement("div");
	gallery_div = document.createElement("div");
	obs_link = document.createElement("a");
	obs_img = document.createElement("img");

	responsive_div.className = "responsive";
	gallery_div.className = "gallery";
	obs_link.target = "_blank";
	obs_link.href = "/viewObservation?" + observation_id;
	obs_img.src = src;
	obs_img.width = "600";
	obs_img.height = "400";

	obs_link.appendChild(obs_img);
	gallery_div.appendChild(obs_link);
	// gallery_div.appendChild(obs_desc);
	responsive_div.appendChild(gallery_div);

	return responsive_div;

}
