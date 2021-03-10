
function get_topics(user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbtopics', user_id);
}


async function get_locations(user_id) {
/*
	fetch locations from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dblocations', user_id);
}

async function get_response_types(user_id) {
/*
	fetch response types from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbresponse_types', user_id);
}


async function get_response_type(response_type_id, user_id) {
/*
	fetch response types from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbresponse_types/' + response_type_id, user_id);
}


async function get_users(user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbusers', user_id);
}


async function get_user(selected_user_id, user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbusers/' + selected_user_id, user_id);
}

async function get_observation(observation_id, user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations/' + observation_id, user_id);
}

async function get_teacher(teacher_id, user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbteachers/' + teacher_id, user_id);
}
async function get_projects(user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects', user_id);
}

async function get_project(project_id, user_id) {
/*
	fetch topics from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id, user_id);
}

async function get_teacher_classes(teacher_id, user_id) {
/*
	fetch project classes from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbteachers/' + user_id + '/dbclasses', user_id);
}


async function get_project_prompts(project_id, user_id) {
/*
	fetch project prompts from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbprompts', user_id);
}

async function get_project_prompt(prompt_id, user_id) {
/*
	fetch project prompts from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id, user_id);
}

async function get_project_materials(project_id, user_id) {
/*
	fetch project prompts from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbmaterials', user_id);
}


async function get_project_topics(project_id, user_id) {
/*
	fetch project prompts from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbtopics', user_id);
}


async function get_project_locations(project_id, user_id) {
/*
	fetch project prompts from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dblocations', user_id);
}

async function get_prompt_observations(prompt_id, user_id) {
/*
	fetch prompt classes from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id + '/dbobservations', user_id);
}


async function get_project_observations(project_id, user_id) {
/*
	fetch project observations from database
	user_id parameter will be used to authenticate
*/
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbobservations', user_id);
}

async function get_observations_count(prompt_id, user_id) {
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprompts/' + prompt_id + '/dbobservations/count', user_id);
}


async function add_project_user(project_id, selected_user_id, user_id) {
	return await putData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbusers' + '/' + selected_user_id, user_id);
}

async function get_project_user(project_id, selected_user_id, user_id) {
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbusers' + '/' + selected_user_id, user_id);
}


async function remove_project_user(project_id, selected_user_id, user_id) {
	return await deleteData('https://wonderbar-cs467.ue.r.appspot.com/dbprojects/' + project_id + '/dbusers' + '/' + selected_user_id, user_id);
}


async function get_observation_stats (prompt_id, user_id) {
	return await fetchData('https://wonderbar-cs467.ue.r.appspot.com/dbobservations/' + prompt_id + '/stats', user_id);
}
