shelters = "shelters"
app_url = "https://wonderbar-cs467.ue.r.appspot.com/"
test_url = "http://127.0.0.1:8080/"

table_attributes = {
	"activation_codes" : ["activation_code", "start_date", "end_date"],
	"users" : ["sub", "first_name", "last_name", "username", "birthdate", "avatar", "school", "email_address", "activation_code", "user_type"],
	"teachers": ["user_id", "title", "teaching_certification_id"],
	"projects" :["creator_id", "name", "short_description", "long_description", "avatar"],
	"project_users": ["user_id", "project_id"],
	"topics" : ["name"],
	"project_topics": ["project_id", "topic_id"],
	"locations" :["name"],
	"project_locations" :["project_id", "location_id"],
	"response_types" : ["name", "can_multi_select"],
	"prompts" : ["project_id", "subheading", "description", "response_type_id"],
	"multientry_items" : ["prompt_id", "entry_text"],
	"observations": ["user_id", "prompt_id", "response", "time_observed", "location"],
	"classes": ["teacher_id", "class_code", "name"],
	"enrollments": ["user_id", "class_id"],
	"materials": ["project_id", "name", "quantity"]
}

table_attributes_optional = {
	"activation_codes" : ["start_date", "end_date"],
	"users" : ["activation_code", "avatar"],
	"teachers": ["title"],
	"projects" :["long_description", "avatar"],
	"project_users": [],
	"topics" : [],
	"project_topics": [],
	"locations" :[],
	"project_locations" :[],
	"response_types" : ["can_multi_select"],
	"prompts" : ["subheading"],
	"multientry_items" : [],
	"observations": ["location"],
	"classes": [],
	"enrollments": [],
	"materials": []
}

table_updates = {
	"activation_codes" : [],
	"users" : ["first_name", "last_name", "username", "birthdate", "avatar", "school", "email_address", "activation_code"],
	"teachers": ["title", "teaching_certification_id"],
	"projects" :["name", "short_description", "long_description", "materials", "avatar"],
	"project_users": [],
	"topics" : ["name"],
	"project_topics": [],
	"locations" :["name"],
	"project_locations" :[],
	"response_types" : ["name", "can_multi_select"],
	"prompts" : ["subheading", "description", "response_type_id"],
	"multientry_items" : ["entry_text"],
	"observations": ["response", "time_observed", "location"],
	"classes": ["class_code", "name"],
	"enrollments": [],
	"materials": ["quantity"]
}

table_pks = {
	"activation_codes" : "id",
	"users" : "id",
	"teachers": "user_id",
	"projects" : "id",
	"project_users": "id",
	"topics" : "id",
	"project_topics": "id",
	"locations" :"id",
	"project_locations" :"id",
	"response_types" : "id",
	"prompts" : "id",
	"multientry_items" : "id",
	"observations": "id",
	"classes": "id",
	"enrollments": "id",
	"materials" : "id"
}

table_fks = {
	"projects_users" : ["project_users", "user_id", "project_id"],
	"projects_locations" : ["project_locations", "location_id", "project_id"],
	"projects_topics" : ["project_topics", "topic_id", "project_id"],
	"users_projects" : ["project_users", "project_id", "user_id"],
	"users_classes" : ["enrollments", "class_id", "user_id"],
	"classes_users" : ["enrollments", "user_id", "class_id"],
	"teachers_classes" : ["classes", "id", "teacher_id"],
	"projects_prompts" : ["prompts", "id", "project_id"],
	"projects_materials" : ["materials", "id", "project_id"],
	"prompts_multientry_items" :["multientry_items", "id", "prompt_id"],
	"users" : "id",
	"teachers": "user_id",
	"projects" : "id",
	"project_users": "id",
	"topics" : "id",
	"project_topics": "id",
	"locations" :"id",
	"project_locations" :"id",
	"response_types" : "id",
	"prompts" : "id",
	"multientry_items" : "id",
	"observations": "id"
}

table_joins = {
	"enrollments":["classes", "users", "class_id", "user_id"],
	"project_users":["projects", "users", "project_id", "user_id"],
	"project_locations":["projects", "locations", "project_id", "location_id"],
	"project_topics":["projects", "topics", "project_id", "topic_id"],
	"projects_prompts":["projects", "prompts", "project_id", "id"],
	"projects_materials":["projects", "materials", "project_id", "id"],
	"prompts_multientry_items" :["prompts", "multientry_items", "prompt_id", "id"],
}


table_auto = {
	"activation_codes" : True,
	"users" : True,
	"teachers": True,
	"projects" : True,
	"project_users": True,
	"topics" : True,
	"project_topics": True,
	"locations" : True,
	"project_locations" : True,
	"response_types" : True,
	"prompts" : True,
	"multientry_items" : True,
	"observations": True,
	"classes": True,
	"enrollments": True,
	"materials": True
}