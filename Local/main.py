from datetime import datetime, timedelta, date
import logging
import os
from flask import Flask, render_template, request, Response, make_response, url_for, redirect, session
import sqlalchemy
from requests_oauthlib import OAuth2Session
import json
from google.oauth2 import id_token
from google.auth import crypt
from google.auth import jwt
from google.auth.transport import requests
import requests as requ
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Table, event, select, func
from sqlalchemy.orm import sessionmaker
import constants
import random
import string
from random import seed, randint

from sqlalchemy import MetaData, Table, Column, ForeignKey
from sqlalchemy.ext.automap import automap_base
from google.cloud import storage
from google.cloud import secretmanager

seed()

app = Flask(__name__)

# secrets = secretmanager.SecretManagerServiceClient()

# app.secret_key = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/app_secret_key/versions/1"}).payload.data.decode("utf-8")
# print (app.secret_key)
# max items returned from a select query
MAX_LIMIT = 25


# Configure this environment variable via app.yaml
CLOUD_STORAGE_BUCKET = "wonderbar-cs467.appspot.com"
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

logger = logging.getLogger()

def logged_in():
    if 'logged_in' in session:
        if 'user_id' in session:
            user_id = session['user_id']
            response = list_one('users', 'id', user_id)
            if response.status_code == 200:
                return True
            else:
                end_session()
                return False
        else:
            end_session()
            return False
    else:
        return False

def end_session():
     session.pop('logged_in', None)
     session.pop('user_id', None)
     session.pop('user_type', None)

# create select SQL statement
# parameter table_name: name of the table being queried
# parameter attributes: list of attributes to return; 
#   if none specified, all will be returned
def create_select(table_name, attributes=None):
    if attributes == None:
        attribute_str = "* "
    else:
        attribute_str = ','.join(attributes)
    select_statement = "SELECT " + attribute_str + "from " + table_name
    return select_statement

# create delete SQL statement
# parameter table_name: name of the table being queried
def create_delete(table_name):

    delete_statement = "DELETE FROM " + table_name
    return delete_statement


# create insert SQL statement
# parameter table_name: name of the table being queried
# parameter values: dictionary of attributes and values to be added to table
def create_insert(table_name, values):
    key_str = []
    values_str = ""
    for key, value in values.items():
        values_str = values_str + " {},".format(format_values(value, True))
        key_str.append(key)

    key_str = ','.join(key_str)
    insert_statement = "INSERT INTO " + table_name + " (" + key_str + ") VALUES (" + values_str[:-1] + ")"
    return insert_statement

# create update SQL statement
# parameter table_name: name of the table being queried
# parameter values: dictionary of attributes and values to be updated in table
def create_update(table_name, values):
    updates = ""
    for key, value in values.items():
        updates = updates + " " + key + "='" + format_values(value) + "',"
    updates = updates[:-1]
    update_statement = "UPDATE " + table_name + " SET " + updates
    return update_statement


# format datetime/string values
# parameter include_quotes: if true, string values will be returned with quotations
def format_values(o, include_quotes=False):
    if isinstance(o, datetime) or isinstance(o,date):
        return o.__str__()
    elif isinstance(o, str):
        if include_quotes:
            return '"' + o.__str__() + '"'
        else:
            return o.__str__()
    else:
        return o

def createLinks(json_item, table_name, table_id):
    json_item["self"] = constants.app_url  + "db" + table_name + "/" + table_id
    if table_name == 'projects':
       json_item["users"] = constants.app_url  + "db" + table_name + "/" + table_id + "/dbusers"
       json_item["prompts"] = constants.app_url  +  "db" + table_name + "/" + table_id + "/dbprompts"
       json_item["locations"] = constants.app_url  +  "db" + table_name + "/" +  table_id + "/dblocations"
       json_item["topics"] = constants.app_url  + "db" +  table_name + "/" + table_id + "/dbtopics"
       json_item["observations"] = constants.app_url  + "db" +  table_name + "/" + table_id + "/dbobservations"

    if table_name == 'users':
       json_item["projects"] = constants.app_url  + "db" +  table_name + "/" + table_id + "/dbprojects"
       json_item["observations"] = constants.app_url  +  "db" + table_name + "/" + table_id + "/dbobservations"

    if table_name == 'prompts':
       json_item["observations"] = constants.app_url  +  "db" + table_name + "/" + table_id + "/dbobservations"
       json_item["multientry_items"] = constants.app_url  +  "db" + table_name + "/" + table_id + "/dbmultientry_items"

    if table_name == 'classes':
       json_item["users"] = constants.app_url  + "db" +  table_name + "/" + table_id + "/dbusers"

    return json_item

# taken from google code example (https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/cloud-sql/mysql/sqlalchemy/main.py)
def init_connection_engine():
    db_config = {
        # [START cloud_sql_mysql_sqlalchemy_limit]
        # Pool size is the maximum number of permanent connections to keep.
        "pool_size": 5,
        # Temporarily exceeds the set pool_size if no connections are available.
        "max_overflow": 2,
        # The total number of concurrent connections for your application will be
        # a total of pool_size and max_overflow.
        # [END cloud_sql_mysql_sqlalchemy_limit]

        # [START cloud_sql_mysql_sqlalchemy_backoff]
        # SQLAlchemy automatically uses delays between failed connection attempts,
        # but provides no arguments for configuration.
        # [END cloud_sql_mysql_sqlalchemy_backoff]

        # [START cloud_sql_mysql_sqlalchemy_timeout]
        # 'pool_timeout' is the maximum number of seconds to wait when retrieving a
        # new connection from the pool. After the specified amount of time, an
        # exception will be thrown.
        "pool_timeout": 30,  # 30 seconds
        # [END cloud_sql_mysql_sqlalchemy_timeout]

        # [START cloud_sql_mysql_sqlalchemy_lifetime]
        # 'pool_recycle' is the maximum number of seconds a connection can persist.
        # Connections that live longer than the specified amount of time will be
        # reestablished
        "pool_recycle": 1800,  # 30 minutes
        # [END cloud_sql_mysql_sqlalchemy_lifetime]

    }
    if os.environ.get("DB_HOST"):
        return init_tcp_connection_engine(db_config)
    else:
        return init_unix_connection_engine(db_config)

# taken from google code example (https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/cloud-sql/mysql/sqlalchemy/main.py)
def init_tcp_connection_engine(db_config):
    # [START cloud_sql_mysql_sqlalchemy_create_tcp]
    # Remember - storing secrets in plaintext is potentially unsafe. Consider using
    # something like https://cloud.google.com/secret-manager/docs/overview to help keep
    # secrets secret.

    db_user = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_USER/versions/1"}).payload.data.decode("utf-8")
    db_pass = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_PASS/versions/1"}).payload.data.decode("utf-8")
    db_name = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_NAME/versions/1"}).payload.data.decode("utf-8")
    db_host = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_HOST/versions/1"}).payload.data.decode("utf-8")


    # Extract host and port from db_host
    host_args = db_host.split(":")
    db_hostname, db_port = host_args[0], int(host_args[1])

    pool = sqlalchemy.create_engine(
        # Equivalent URL:
        # mysql+pymysql://<db_user>:<db_pass>@<db_host>:<db_port>/<db_name>
        sqlalchemy.engine.url.URL(
            drivername="mysql+pymysql",
            username=db_user,  # e.g. "my-database-user"
            password=db_pass,  # e.g. "my-database-password"
            host=db_hostname,  # e.g. "127.0.0.1"
            port=db_port,  # e.g. 3306
            database=db_name,  # e.g. "my-database-name"
        ),
        **db_config
    )
    # [END cloud_sql_mysql_sqlalchemy_create_tcp]

    return pool

# taken from google code example (https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/cloud-sql/mysql/sqlalchemy/main.py)
def init_unix_connection_engine(db_config):
    # [START cloud_sql_mysql_sqlalchemy_create_socket]
    # Remember - storing secrets in plaintext is potentially unsafe. Consider using
    # something like https://cloud.google.com/secret-manager/docs/overview to help keep
    # secrets secret.
    db_user = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_USER/versions/1"}).payload.data.decode("utf-8")
    db_pass = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_PASS/versions/1"}).payload.data.decode("utf-8")
    db_name = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/DB_NAME/versions/1"}).payload.data.decode("utf-8")
    db_socket_dir = os.environ.get("DB_SOCKET_DIR", "/cloudsql")
    cloud_sql_connection_name = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/CLOUD_SQL_CONNECTION_NAME/versions/1"}).payload.data.decode("utf-8")

    pool = sqlalchemy.create_engine(
        # Equivalent URL:
        # mysql+pymysql://<db_user>:<db_pass>@/<db_name>?unix_socket=<socket_path>/<cloud_sql_instance_name>
        sqlalchemy.engine.url.URL(
            drivername="mysql+pymysql",
            username=db_user,  # e.g. "my-database-user"
            password=db_pass,  # e.g. "my-database-password"
            database=db_name,  # e.g. "my-database-name"
            query={
                "unix_socket": "{}/{}".format(
                    db_socket_dir,  # e.g. "/cloudsql"
                    cloud_sql_connection_name)  # i.e "<PROJECT-NAME>:<INSTANCE-REGION>:<INSTANCE-NAME>"
            }
        ),
        **db_config
    )
    # [END cloud_sql_mysql_sqlalchemy_create_socket]

    return pool

# initialize database engine
# db = init_connection_engine()

# produce MetaData object to load existing database (not being used right now)

@event.listens_for(Table, "column_reflect")
def column_reflect(inspector, table, column_info):
    # set column.key = "attr_<lower_case_name>"
    column_info['key'] = column_info['name']


metadata = MetaData()
# metadata.reflect(bind=db)
# Base = automap_base(metadata=metadata)
# Base.prepare()
# activation_codes, users, teachers, projects, project_users,\
#    topics, project_topics, locations, project_locations, \
#    response_types, prompts, multientry_items, observations, \
#    materials, classes, enrollments = \
#    Base.classes.activation_codes, Base.classes.users, Base.classes.teachers, \
#    Base.classes.projects, Base.classes.project_users, Base.classes.topics, \
#    Base.classes.project_topics, Base.classes.locations, Base.classes.project_locations, \
#    Base.classes.response_types, Base.classes.prompts, Base.classes.multientry_items, Base.classes.observations, \
#    Base.classes.materials, Base.classes.classes, Base.classes.enrollments


# verify that the user_content matches what is expected/allowed; 
#    optional_content can be excluded from user content
# returns list of missing items
def verify_contents(user_content, allowed_content, optional_content=None):
    content_error = []
    for key in user_content.keys():
        if key not in allowed_content and key not in optional_content:
            content_error.append(key)
    if optional_content!=None:
        for value in allowed_content:
            if value not in user_content.keys() and value not in optional_content:
                content_error.append(value)
    else:
        for value in allowed_content:
            if value not in user_content.keys():
                content_error.append(value)
    return content_error


# generates random string of character of specified length
# returns string
def generate_random_string(length):
    # Random string with the combination of lower and upper case
    letters = string.ascii_letters
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str


# routes start ------------------------------------------------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    # logged_in()
    return render_template('index.html')

@app.route("/api", methods=["GET"])
def api_info():
    return render_template('api.html')



# client_id = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/client_id/versions/1"}).payload.data.decode("utf-8")
# client_secret = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/client_secret/versions/1"}).payload.data.decode("utf-8")
# redirect_uri = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/redirect_uri_app/versions/1"}).payload.data.decode("utf-8")
# # redirect_uri = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/redirect_uri_local/versions/1"}).payload.data.decode("utf-8")
# auth_uri = secrets.access_secret_version(request={"name": "projects/wonderbar-cs467/secrets/auth_uri/versions/1"}).payload.data.decode("utf-8")

# scope = ['https://www.googleapis.com/auth/userinfo.email', 'openid', 'https://www.googleapis.com/auth/userinfo.profile']
# oauth = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)

@app.route('/oauth')
def oauth():
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)

    # if logged_in():
    #      return redirect(url_for('profile'))
    authorization_url, state = oauth.authorization_url(
        'https://accounts.google.com/o/oauth2/auth',
        # access_type and prompt are Google specific extra
        # parameters.
        access_type="offline", prompt="select_account")
    return redirect(authorization_url)

@app.route('/logout')
def logout():
    # if logged_in():
    end_session()
    return redirect(url_for('index'))



@app.route('/login')
def login():
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)
    if logged_in():
         return redirect(url_for('profile'))

    token = oauth.fetch_token(
        'https://accounts.google.com/o/oauth2/token',
        authorization_response=request.url,
        client_secret=client_secret)
    req = requests.Request()

    id_info = id_token.verify_oauth2_token( 
    token['id_token'], req, client_id)

    sub = id_info["sub"]


    x = oauth.get('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses')
    # print(x.json())
    lastname = x.json()["names"][0]["familyName"]
    firstname = x.json()["names"][0]["givenName"]
    emailAddress = x.json()["emailAddresses"][0]["value"]
    # birthday = x.json()["birthdays"]["date"][1]["year"] + "/" + json()["birthdays"]["date"][1]["month"] + "/" + x.json()["birthdays"]["date"][1]["day"]

    try:
        with db.connect() as conn:
            # Execute the query and fetch all results
            recent_users = conn.execute(
                "SELECT id, username, first_name, last_name, user_type FROM users " "WHERE sub = %s", sub
            ).fetchall()
            # Convert the results into a list of dicts representing votes
            # print(recent_users)
            results = []
            for v in recent_users:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                results.append(project)
            if len(results) > 0 :
                session["user_id"] = (results[0]["id"])
                session["user_type"] = (results[0]["user_type"])
    except Exception as e:

        logger.exception(e)
        return Response(
            status=500,
            response=token['id_token'] + "\nUnable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )

    if len(recent_users) == 0:
        # return render_template("project_list.html", last_name = lastname, first_name =firstname, emailAddress=emailAddress)
        messages = (json.dumps({"sub": sub, "last_name": lastname, "first_name": firstname, "emailAddress": emailAddress}))
        return redirect(url_for('signup', messages=messages))

    else:
        session['logged_in'] = True
        return redirect(url_for('profile'))


@app.route("/profile", methods=["GET"])
def profile():
    # if logged_in():
    #     return redirect(url_for('oauth'))
    return render_template('profile.html')

@app.route("/addClass", methods=["GET"])
def addClass():
    # if not logged_in():
    #     return redirect(url_for('oauth'))
    if 'user_type' in session:
        if session['user_type'] == 'teacher':
            return render_template('addClasses.html')
        else:
            return render_template('addClassesStudent.html')
    # return redirect(url_for('oauth'))
    return render_template('addClasses.html')


@app.route("/addProject", methods=["GET"])
def addProject():
    # if not logged_in():
    #     return redirect(url_for('oauth'))
    return render_template('createProject.html')

@app.route("/projects", methods=["GET", "POST"])
def getProjects():
    # if not logged_in():
    #     return redirect(url_for('oauth'))
    return render_template('projects.html')



@app.route("/projects/<project_id>", methods=["GET"])
def getProject(project_id):
    # if not logged_in():
    #     return redirect(url_for('oauth'))
    return render_template('indvproj.html')

@app.route('/signup', methods = ['GET'])
def signup():
    # if logged_in():
    #     return redirect(url_for('profile'))
    if len(request.args)>0:
        params = json.loads(request.args['messages'])
        # print(params)
        sub = params["sub"]
        lastname = params["last_name"]
        firstname = params["first_name"]
        emailAddress = params["emailAddress"]
        return render_template('signup.html', sub = sub, last_name=lastname, first_name=firstname, emailAddress=emailAddress)
    return render_template('signup.html')

@app.route("/empty", methods=["GET"])
def empty():
    return render_template('empty.html')

@app.route("/tempProject", methods=["GET"])
def tempProject():
    return render_template('tempProject.html')

@app.route("/teachers", methods=["GET"])
def teachers():
    return render_template('teachers.html')

@app.route("/about", methods=["GET"])
def about():
    return render_template('about.html')


@app.route("/<page_name>", methods=["GET"])
def other_pages(page_name):
    try: 
        return render_template(page_name + '.html')
    except:
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

@app.route("/<page_name>/<page_id>", methods=["GET"])
def other_pages_specific(page_name, page_id):
    try: 
        return render_template(page_name + '.html')
    except:
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

@app.route("/viewObservations", methods=["GET"])
def view_observations():
    try: 
        return render_template('observations.html')
    except:
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

@app.route("/addObservations", methods=["GET"])
def add_observations():
    try: 
        return render_template('prompts.html')
    except:
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

@app.route("/viewProject", methods=["GET"])
def view_project():
    try: 
        return render_template('single_project.html')
    except:
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

# API routes start ------------------------------------------------------------------------------------------------------------------

@app.route('/db<table_id>', methods = ['GET', 'OPTIONS'])
def get_items(table_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res


    if table_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

    return list_all_general(table_id, constants.table_pks[table_id])


@app.route('/db<table_id>/<project_id>', methods = ['GET', 'OPTIONS'])
def get_item(table_id, project_id):

#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res

    if table_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res
    return list_one(table_id, constants.table_pks[table_id], project_id)

@app.route('/db<table_id>', methods = ['POST'])
def post_item(table_id):

    if table_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res
    return insert_item(table_id, constants.table_pks[table_id], constants.table_auto[table_id])


    # if logged_in():
    #     if "Authorization" not in request.headers:
    #        return Response(
    #            status=403,
    #            response=json.dumps({"Error":"Access Denied"}),
    #        )
    #     elif request.headers["Authorization"].split("Bearer ")[1] != str(session["user_id"]):
    #        return Response(
    #            status=403,
    #            response=json.dumps({"Error":"Access Denied"}),
    #        )
    #     else:
    #         return insert_item(table_id, constants.table_pks[table_id], constants.table_auto[table_id])
    # else:
    #    return Response(
    #        status=403,
    #        response=json.dumps({"Error":"Access Denied"}),
    #    )


@app.route('/db<table_id>/<project_id>', methods = ['PATCH'])
def patch_item(table_id, project_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if table_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res
    return update_item(table_id, constants.table_pks[table_id], project_id)

@app.route('/db<table_id>', methods = ['DELETE'])
def delete_item(table_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if table_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res
    return delete_all(table_id)


@app.route('/dbusers/<project_id>/dbschoolclasses')
def get_school_classes(project_id):


    # get limit and offset
    try:
        q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
    except:
        q_limit = MAX_LIMIT

    try:
        q_offset = int(request.args.get('offset', '0'))
    except:
        q_offset = 0

    #get order by column or use default
    q_order_by = (request.args.get('order_by', "id"))


    stmt = """SELECT users.school, users.last_name, teachers.title, classes.* 
        FROM classes
        INNER JOIN users
        ON classes.teacher_id = users.id
        INNER JOIN teachers
        ON teachers.user_id = users.id
        WHERE users.school = (
       SELECT school from users where users.id = (Select users.id from users where activation_code = (SELECT users.activation_code from users where users.id=""" + project_id + """) and user_type ='teacher') order by id limit 1)
        and classes.id not in (SELECT class_id from enrollments where user_id=""" + project_id + ")"


    # print(stmt)

    # query database
    try:
        with db.connect() as conn:

            count = conn.execute("""SELECT COUNT(*) FROM classes
        INNER JOIN users
        ON classes.teacher_id = users.id
        WHERE users.school = (
       SELECT school from users where users.id = (Select users.id from users where activation_code = (SELECT users.activation_code from users where users.id=""" + project_id + """) and user_type ='teacher') order by id limit 1)and classes.id not in (SELECT class_id from enrollments where user_id=""" + project_id + ")")
            id_count =0
            for v in count:
                for column, value in v.items():
                        id_count = value
            if q_limit == 0:
                # print(stmt + " order by " + q_order_by)
                projects = conn.execute(
                   stmt + " order by " + q_order_by
                ).fetchall()
            else:
                projects = conn.execute(
                   stmt + " order by " + q_order_by + " limit %s offset %s", q_limit, q_offset
                ).fetchall()

        results = []
        for v in projects:
            project ={}
            for column, value in v.items():
                project[column] = format_values(value)
            project = createLinks(project, 'users', str(v[constants.table_pks['users']]))
            results.append(project)

        if len(results) < q_limit or q_limit==0:
            next_set = None
        else:
            next_set = (constants.app_url  + 'dbusers' + "/" + project_id + "/" + 'dbschoolclasses' + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

        if q_offset == 0:
            prev_set = None
        else:
            prev_set = (constants.app_url  + 'dbusers' + "/" + project_id + "/" + 'dbschoolclasses' + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

        all_projects=dict({"count":id_count, 
                            "prev": prev_set, 
                            "next": next_set, 
                            "limit": q_limit,
                            "offset": q_offset,
                            "results":results})


    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(all_projects))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 200
    return res


@app.route('/db<table_id>/<project_id>', methods = ['DELETE'])
def delete_items(table_id, project_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if table_id not in constants.table_attributes.keys():



        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res
    return delete_one(table_id, constants.table_pks[table_id], project_id)


@app.route('/dbprojects/<project_id1>/dbusers/<project_id2>', methods = ['GET','OPTIONS'])
def get_project_users(project_id1, project_id2):
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res

    # stmt = create_select(constants.table_fks[table1_id+"_"+table2_id][0]) + " WHERE " + constants.table_fks[table1_id+"_"+table2_id][2] + "=%s AND " + constants.table_fks[table1_id+"_"+table2_id][1] + "=%s"
    # query database
    try:
        with db.connect() as conn:
            projects = conn.execute(
               "Select * from project_users where project_id = %s and user_id = %s", project_id1, project_id2
            ).fetchall()

        if len(projects) == 0:
            res = make_response(json.dumps({"Error": "Project Users does not exist."}))
            res.mimetype = 'application/json'
            res.headers.set('Access-Control-Allow-Origin', '*')
            res.headers.set('Content-Type', 'application/json')
            res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
            res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
            res.status_code = 404
            return res
        else:
            return list_one("users", constants.table_pks["users"], project_id2)

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )




@app.route('/db<table1_id>/<project_id1>/db<table2_id>/<project_id2>', methods = ['GET','OPTIONS'])
def get_existing(table1_id, project_id1, table2_id, project_id2):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res

    try:
        with db.connect() as conn:
            projects = conn.execute(
               "Select * from " + constants.table_fks[table1_id+"_"+table2_id][0] + " where " + constants.table_fks[table1_id+"_"+table2_id][2] + " = %s and " + constants.table_fks[table1_id+"_"+table2_id][1] + " = %s", project_id1, project_id2
            ).fetchall()

        if len(projects) == 0:
            res = make_response(json.dumps({"Error": "Resource does not exist."}))
            res.mimetype = 'application/json'
            res.headers.set('Access-Control-Allow-Origin', '*')
            res.headers.set('Content-Type', 'application/json')
            res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
            res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
            res.status_code = 404
            return res
        else:
            return list_one(table2_id, constants.table_pks[table2_id], project_id2)

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )




@app.route('/db<table1_id>/<project_id1>/db<table2_id>/<project_id2>', methods = ['PUT'])
def add_to_existing(table1_id, project_id1, table2_id, project_id2):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    valuesDict = {}
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][1]] = project_id2
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][2]] = project_id1
    # print (valuesDict)
    return insert_item(constants.table_fks[table1_id+"_"+table2_id][0], constants.table_pks[constants.table_fks[table1_id+"_"+table2_id][0]], constants.table_auto[constants.table_fks[table1_id+"_"+table2_id][0]], valuesDict)

@app.route('/db<table1_id>/<project_id1>/db<table2_id>', methods = ['POST'])
def add_to_specific(table1_id, project_id1, table2_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    valuesDict = {}
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][2]] = project_id1
    # print (valuesDict)
    return insert_item(constants.table_fks[table1_id+"_"+table2_id][0], constants.table_pks[constants.table_fks[table1_id+"_"+table2_id][0]], constants.table_auto[constants.table_fks[table1_id+"_"+table2_id][0]], valuesDict)

@app.route('/db<table1_id>/<project_id1>/db<table2_id>/<project_id2>', methods = ['DELETE'])
def remove_from_existing(table1_id, project_id1, table2_id, project_id2):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res

    return delete_one_join(table1_id, project_id1, table2_id, project_id2)

@app.route('/db<table1_id>/<project_id1>/db<table2_id>', methods = ['DELETE'])
def remove_from_table(table1_id, project_id1, table2_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    return delete_all_specific(table1_id, project_id1, table2_id)


@app.route('/db<table1_id>/<project_id>/db<table2_id>/count', methods = ['GET', 'OPTIONS'])
def get_other_table_count(table1_id, project_id, table2_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res

    if table2_id == "observations" and table1_id == "prompts":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))



        stmt = """SELECT COUNT(observations.response) as response_count, 
        observations.response, observations.prompt_id 
        FROM observations 
        GROUP BY observations.response, observations.prompt_id HAVING observations.prompt_id= %s"""
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*)" + """ FROM observations
                    WHERE observations.prompt_id = %s""", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute(stmt+ " order by observations.response", project_id).fetchall()
                else:
                    projects = conn.execute(stmt+ " order by observations.response" + " limit %s offset %s", project_id, q_limit, q_offset).fetchall()


            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                # project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/dbobservations"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/dbobservations"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res


@app.route('/db<table1_id>/<project_id>/db<table2_id>', methods = ['GET', 'OPTIONS'])
def get_other_table(table1_id, project_id, table2_id):
#    if "Authorization" not in request.headers:
#        res = make_response(json.dumps({"Error":"Page does not exist"}))
#        res.mimetype = 'application/json'
#        res.headers.set('Access-Control-Allow-Origin', '*')
#        res.headers.set('Content-Type', 'application/json')
#        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
#        res.status_code = 404
#        return res
    if request.method == 'OPTIONS':
        res = make_response(json.dumps({"Success":"Success"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 204
        return res

    if table2_id == "prompts" and table1_id == "projects":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["prompts"]))


        stmt = "SELECT * FROM  prompts WHERE prompts.project_id=%s"
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*) FROM prompts" + " WHERE prompts.project_id=%s", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by, project_id
                    ).fetchall()
                else:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by + " limit %s offset %s", specific_id, q_limit, q_offset
                    ).fetchall()

            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res

    elif table2_id == "classes" and table1_id == "teachers":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))


        stmt = "SELECT * FROM  classes WHERE classes.teacher_id=%s"
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*) FROM classes" + " WHERE classes.teacher_id=%s", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by, project_id
                    ).fetchall()
                else:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by + " limit %s offset %s", specific_id, q_limit, q_offset
                    ).fetchall()

            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res

    elif table2_id == "observations" and table1_id == "projects":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))



        stmt = """SELECT projects.name, prompts.subheading, prompts.description, observations.* 
        FROM observations
        INNER JOIN prompts
        ON observations.prompt_id = prompts.id
        INNER JOIN projects
        ON prompts.project_id = projects.id
        WHERE projects.id = %s"""
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*)" + """ FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    INNER JOIN projects
                    ON prompts.project_id = projects.id
                    WHERE projects.id = %s""", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute("""SELECT projects.name, prompts.subheading, prompts.description, observations.* FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    INNER JOIN projects
                    ON prompts.project_id = projects.id
                    WHERE projects.id = %s"""+ " order by observations.id DESC", project_id).fetchall()
                else:
                    projects = conn.execute("""SELECT projects.name, prompts.subheading, prompts.description, observations.* FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    INNER JOIN projects
                    ON prompts.project_id = projects.id
                    WHERE projects.id = %s"""+ " order by observations.id DESC" + " limit %s offset %s", project_id, q_limit, q_offset).fetchall()


            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res

    elif table2_id == "observations" and table1_id == "prompts":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))



        stmt = """SELECT prompts.subheading, prompts.description, observations.* 
        FROM observations
        INNER JOIN prompts
        ON observations.prompt_id = prompts.id

        WHERE prompts.id = %s"""
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*)" + """ FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    WHERE prompts.id = %s""", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute("""SELECT prompts.subheading, prompts.description, observations.* FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    WHERE prompts.id = %s"""+ " order by observations.id DESC", project_id).fetchall()
                else:
                    projects = conn.execute("""SELECT prompts.subheading, prompts.description, observations.* FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    WHERE prompts.id = %s"""+ " order by observations.id DESC" + " limit %s offset %s", project_id, q_limit, q_offset).fetchall()


            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/dbobservations"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/dbobservations"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res

    elif table2_id == "observations" and table1_id == "users":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))



        stmt = """SELECT projects.name, prompts.subheading, prompts.description, observations.* 
        FROM observations
        INNER JOIN prompts
        ON observations.prompt_id = prompts.id
        INNER JOIN projects
        ON prompts.project_id = projects.id
        INNER JOIN project_users
        ON project_users.project_id = projects.id
        INNER JOIN users
        ON users.id = project_users.user_id
        WHERE users.id = %s"""
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*)" + """ 
                    FROM observations
                    INNER JOIN prompts
                    ON observations.prompt_id = prompts.id
                    INNER JOIN projects
                    ON prompts.project_id = projects.id
                    INNER JOIN project_users
                    ON project_users.project_id = projects.id
                    INNER JOIN users
                    ON users.id = project_users.user_id
                    WHERE users.id = %s""", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute(stmt + " order by observations.id", project_id).fetchall()
                else:
                    projects = conn.execute(stmt + " order by observations.id" + " limit %s offset %s", project_id, q_limit, q_offset).fetchall()


            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res

    elif table2_id == "multientry_items" and table1_id == "prompts":

        # get limit and offset
        try:
            q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
        except:
            q_limit = MAX_LIMIT

        try:
            q_offset = int(request.args.get('offset', '0'))
        except:
            q_offset = 0

        #get order by column or use default
        q_order_by = (request.args.get('order_by', constants.table_pks["classes"]))


        stmt = "SELECT * FROM  multientry_items WHERE multientry_items.prompt_id=%s"

        # stmt = """SELECT prompts.*, observations.* 
        # FROM observations
        # INNER JOIN prompts
        # ON observations.prompt_id = prompts.id
        # INNER JOIN projects
        # ON prompts.project_id = projects.id
        # WHERE projects.id = %s"""
        # print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*) FROM  multientry_items WHERE multientry_items.prompt_id=%s", project_id)
                id_count =0
                for v in count:
                    for column, value in v.items():
                            id_count = value
                if q_limit == 0:
                    projects = conn.execute("SELECT * FROM  multientry_items WHERE multientry_items.prompt_id=%s"+ " order by multientry_items.entry_text", project_id).fetchall()
                else:
                    projects = conn.execute("SELECT * FROM  multientry_items WHERE multientry_items.prompt_id=%s"+ " order by multientry_items.entry_text" + " limit %s offset %s", project_id, q_limit, q_offset).fetchall()


            results = []
            for v in projects:
                project ={}
                for column, value in v.items():
                    project[column] = format_values(value)
                project = createLinks(project, table2_id, str(v[constants.table_pks[table2_id]]))
                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + 'db' + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

            all_projects=dict({"count":id_count, 
                                "prev": prev_set, 
                                "next": next_set, 
                                "limit": q_limit,
                                "offset": q_offset,
                                "results":results})


        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )


        res = make_response(json.dumps(all_projects))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res



    if table1_id not in constants.table_attributes.keys() or table2_id not in constants.table_attributes.keys():
        res = make_response(json.dumps({"Error":"Page does not exist"}))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 404
        return res

    return list_all_specific(table2_id, constants.table_pks[table2_id], constants.table_fks[table1_id + "_" + table2_id], project_id)

# routes end ------------------------------------------------------------------------------------------------------------------


@app.route('/upload', methods=['POST'])
def upload():

    # content = request.args.dict_of_lists()
    """Process the uploaded file and upload it to Google Cloud Storage."""
    for key in request.files.keys():
        print(key)
    uploaded_file = request.files['avatar']
    # print(uploaded_file)

    if not uploaded_file:
            res = make_response(json.dumps({"Error": "invalid image"}))
            res.mimetype = 'application/json'
            res.headers.set('Access-Control-Allow-Origin', '*')
            res.headers.set('Content-Type', 'application/json')
            res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
            res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
            res.status_code = 404
            return res

    # Create a Cloud Storage client.
    gcs = storage.Client()

    # Get the bucket that the file will be uploaded to.
    bucket = gcs.get_bucket(CLOUD_STORAGE_BUCKET)

    # Create a new blob and upload the file's content.
    blob = bucket.blob(uploaded_file.filename)

    blob.upload_from_string(
        uploaded_file.read(),
        content_type=uploaded_file.content_type
    )

    print(blob.public_url)
    # The public URL can be used to directly access the uploaded file via HTTP.
    # return blob.public_url

    res = make_response(json.dumps({"URL":blob.public_url}))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 201
    return res


@app.errorhandler(500)
def server_error(e):
    logging.exception('An error occurred during a request.')
    return """
    An internal error occurred: <pre>{}</pre>
    See logs for full stacktrace.
    """.format(e), 500



def list_all_general(table_name, order_by):

    # get limit and offset
    try:
        q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
    except:
        q_limit = MAX_LIMIT

    try:
        q_offset = int(request.args.get('offset', '0'))
    except:
        q_offset = 0

    #get order by column or use default
    q_order_by = (request.args.get('order_by', order_by))


    # query database
    try:
        with db.connect() as conn:
            stmt = select([func.count()]).select_from(metadata.tables[table_name])
            id_count = conn.execute(stmt).first().values()[0]
            # id_count = count.first().values()[0]
            # print(count)
            # count = conn.execute("SELECT COUNT(*) FROM " + table_name)
            # id_count =0
            # for v in count:
            #     for column, value in v.items():
            #             id_count = value
            if table_name == 'teachers':
                if q_limit == 0:
                    projects = conn.execute(
                       "Select users.*, teachers.* from teachers inner join users on users.id = teachers.user_id" + " order by " + q_order_by
                    ).fetchall()
                else:
                    projects = conn.execute(
                       "Select users.*, teachers.* from teachers inner join users on users.id = teachers.user_id" + " order by " + q_order_by + " limit %s offset %s", q_limit, q_offset
                    ).fetchall()
            elif table_name == 'projects':
                if q_limit == 0:
                    projects = conn.execute(
                       "Select projects.*, teachers.title, users.first_name, users.last_name from projects inner join teachers on projects.creator_id = teachers.user_id inner join users on users.id = teachers.user_id" + " order by " + q_order_by
                    ).fetchall()
                else:
                    projects = conn.execute(
                       "Select projects.*, teachers.title, users.first_name, users.last_name from projects inner join teachers on projects.creator_id = teachers.user_id inner join users on users.id = teachers.user_id" + " order by " + q_order_by + " limit %s offset %s", q_limit, q_offset
                    ).fetchall()
            else:
                if q_limit == 0:
                    projects = conn.execute(
                       create_select(table_name) + " order by " + q_order_by
                    ).fetchall()
                else:
                    projects = conn.execute(
                       create_select(table_name) + " order by " + q_order_by + " limit %s offset %s", q_limit, q_offset
                    ).fetchall()

        results = []
        for v in projects:
            project ={}
            for column, value in v.items():
                project[column] = format_values(value)
            project = createLinks(project, table_name, str(v[order_by]))
            results.append(project)

        if len(results) < q_limit or q_limit==0:
            next_set = None
        else:
            next_set = (constants.app_url  + "db" + table_name + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

        if q_offset == 0:
            prev_set = None
        else:
            prev_set = (constants.app_url  + "db" + table_name + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

        all_projects=dict({"count":id_count, 
                            "prev": prev_set, 
                            "next": next_set, 
                            "limit": q_limit,
                            "offset": q_offset,
                            "results":results})


    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )

    res = make_response(json.dumps(all_projects))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 200
    return res

    # return Response(
    #     status=200,
    #     response=json.dumps(all_projects),
    # )


def list_all_specific(table_name, primary_key, foreign_key, specific_id):
    # print(foreign_key)
    # q = session.query(users).all()

    # for row in q:
    #     print(row)
        # for column in users.__table__.columns:
        #     print (row[column.key])
        # for column, value in row:
        #     print(column + ":" + value)

    # get limit and offset
    try:
        q_limit = min(int(request.args.get('limit', '0')),MAX_LIMIT)
    except:
        q_limit = MAX_LIMIT

    try:
        q_offset = int(request.args.get('offset', '0'))
    except:
        q_offset = 0

    #get order by column or use default
    q_order_by = (request.args.get('order_by', primary_key))


    stmt = "SELECT " + table_name + ".* FROM " + table_name + " INNER JOIN " + foreign_key[0] + " as x ON " + table_name + "." + constants.table_pks[table_name] + "=x." + foreign_key[1] + " WHERE " + "x." + foreign_key[2] + "=%s"
    # print(stmt)

    # query database
    try:
        with db.connect() as conn:

            count = conn.execute("SELECT COUNT(*) FROM " + foreign_key[0] + " WHERE " + foreign_key[0] + "." + foreign_key[2] + "=%s", specific_id)
            id_count =0
            for v in count:
                for column, value in v.items():
                        id_count = value

            if table_name == 'teachers':
                if q_limit == 0:
                    projects = conn.execute(
                       create_select("Select users.* teachers.* from teachers inner join users on users.id = teachers.user_id where id=" + specific_id) + " order by " + q_order_by
                    ).fetchall()
                else:
                    projects = conn.execute(
                       create_select("Select users.* teachers.* from teachers inner join users on users.id = teachers.user_id where id=" + specific_id) + " order by " + q_order_by + " limit %s offset %s", q_limit, q_offset
                    ).fetchall()
            else:

                if q_limit == 0:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by , specific_id
                    ).fetchall()
                else:
                    projects = conn.execute(
                       stmt + " order by " + q_order_by + " limit %s offset %s", specific_id, q_limit, q_offset
                    ).fetchall()

        results = []
        for v in projects:
            project ={}
            for column, value in v.items():
                project[column] = format_values(value)
            project = createLinks(project, table_name, str(v[constants.table_pks[table_name]]))
            results.append(project)

        if len(results) < q_limit or q_limit==0:
            next_set = None
        else:
            next_set = (constants.app_url  + "db" + table_name + "/" + specific_id + "/" + foreign_key[0] + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

        if q_offset == 0:
            prev_set = None
        else:
            prev_set = (constants.app_url  + "db" + table_name + "/" + specific_id + "/" + foreign_key[0] + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

        all_projects=dict({"count":id_count, 
                            "prev": prev_set, 
                            "next": next_set, 
                            "limit": q_limit,
                            "offset": q_offset,
                            "results":results})


    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(all_projects))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 200
    return res

def list_one(table_name, table_pk, key_val, post=False):

    table_pk = (request.args.get('key', table_pk))


    stmt = create_select(table_name) + " WHERE " + table_pk + "=%s"
    # query database
    try:
        with db.connect() as conn:
            if table_name == 'teachers':
                projects = conn.execute(
                   "Select users.*, teachers.* from teachers inner join users on users.id=teachers.user_id where " + table_pk + "=%s", key_val
                ).fetchall()
            else: 
                projects = conn.execute(
                   stmt, key_val
                ).fetchall()

        if len(projects) == 0:

            res = make_response(json.dumps({"Error": "ID (" + str(key_val) + ") does not exist in table (" + table_name + ")."}))
            res.mimetype = 'application/json'
            res.headers.set('Access-Control-Allow-Origin', '*')
            res.headers.set('Content-Type', 'application/json')
            res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
            res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
            res.status_code = 404
            return res

        for v in projects:

            project ={}
            for column, value in v.items():
                project[column] = format_values(value)
                project[column] = format_values(value)
            project = createLinks(project, table_name, str(v[table_pk]))

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )

    if post:
        res = make_response(json.dumps(project))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 201
        return res
    else:
        res = make_response(json.dumps(project))
        res.mimetype = 'application/json'
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Content-Type', 'application/json')
        res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
        res.status_code = 200
        return res




def update_item(table_name, table_pk, key_val):
    content = request.get_json(force=True)
    if content != None:
        error_list = verify_contents(content, constants.table_updates[table_name], constants.table_attributes_optional[table_name])
        if error_list:
            return Response(
                status=400,
                response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
            )

        stmt = create_update(table_name, content) + " WHERE " + table_pk + "=%s"
        # print(stmt)
        # query database
        try:
            with db.connect() as conn:
                projects = conn.execute(
                   stmt, key_val
                )

            # if len(projects) == 0:
            #     return Response(
            #         status=404,
            #         response=json.dumps({"Error": "ID (" + str(key_val) + ") does not exist in table (" + table_name + ")."}),
            #     )



        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )

        return list_one(table_name, constants.table_pks[table_name], key_val)
        # return Response(
        #     status=200,
        #     response=json.dumps(project),
        # )



def delete_all(table_name):


    stmt = create_delete(table_name)
    # query database
    try:
        with db.connect() as conn:
            projects = conn.execute(
               stmt
            )

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(''))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 204
    return res

def delete_one(table_name, table_pk, key_val):


    stmt = create_delete(table_name) + " WHERE " + table_pk + "=%s"
    # query database
    try:
        with db.connect() as conn:
            projects = conn.execute(
               stmt, key_val
            )

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(''))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 204
    return res


def delete_one_join(table1_name, table1_pk, table2_name, table2_pk):


    stmt = create_delete(constants.table_fks[table1_name+"_"+table2_name][0]) + " WHERE " + constants.table_fks[table1_name+"_"+table2_name][2] + "=%s and " + constants.table_fks[table1_name+"_"+table2_name][1]  + "=%s"
    try:
        with db.connect() as conn:
            projects = conn.execute(
               stmt, table1_pk, table2_pk
            )

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(''))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 204
    return res

def delete_all_specific(table1_name, table1_pk, table2_name):


    stmt = create_delete(constants.table_fks[table1_name+"_"+table2_name][0]) + " WHERE " + constants.table_fks[table1_name+"_"+table2_name][2] + "=%s"
    try:
        with db.connect() as conn:
            projects = conn.execute(
               stmt, table1_pk
            )

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    res = make_response(json.dumps(''))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 204
    return res


def insert_item(table_name, table_pk, auto_inc=True, valuesDict={}):
    empty = (request.get_data().decode("utf-8") == "")
    # print(request.get_data().decode("utf-8"))
    if empty:
        content = valuesDict
    else:
        content = request.get_json(force=True)
        # print(content)
        if content == None:
            content = valuesDict
        elif valuesDict != None:
            content.update(valuesDict)
    # if content == "":
    #     content = valuesDict
    # print(content)
    # print(content)
    if content != None:
        teacher_content={}
        if table_name != "users":
            error_list = verify_contents(content, constants.table_attributes[table_name], constants.table_attributes_optional[table_name])
            if error_list:
                return Response(
                    status=400,
                    response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
                )


        if table_name == 'users':
            # content["avatar"] = upload()

            error_list = verify_contents(content, constants.table_attributes[table_name], constants.table_attributes_optional[table_name] +  constants.table_attributes['teachers'])
            if error_list:
                return Response(
                    status=400,
                    response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
                )
            if (content["user_type"] == "student"):
                error_list = verify_contents(content,constants.table_attributes[table_name], constants.table_attributes_optional[table_name])
                if error_list:
                    return Response(
                        status=400,
                        response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
                    )


            if (content["user_type"] == "teacher"):
                error_list = verify_contents(content,constants.table_attributes['teachers'], constants.table_attributes[table_name] + constants.table_attributes_optional['teachers'] + ['user_id'])
                if error_list:
                    return Response(
                        status=400,
                        response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
                    )
                # print(content)
                for key in constants.table_attributes["teachers"]:
                    if key in content.keys():
                        print(key)
                        teacher_content[key] = content[key]
                        print(teacher_content)
                        content.pop(key, None)
                content['activation_code'] = generate_random_string(randint(15, 20))
                stmt = create_select('activation_codes') + " WHERE activation_code" + "=%s"
                end = 6
                while end:
                    try:
                        with db.connect() as conn:
                            projects = conn.execute(
                                stmt, content['activation_code']
                            )
                            if projects.first() == None:
                                end = 0
                                stmt = create_insert('activation_codes', {"activation_code":content['activation_code'], "start_date":str(datetime.now()), "end_date":str(datetime.now() + timedelta(days=365) )})
                                conn.execute(
                                   stmt
                                )

                    except Exception as e:
                        logger.exception(e)
                        return Response(
                            status=500,
                            response="Unable to successfully cast vote! Please check the "
                            "application logs for more details. '{}'".format(e),
                        )


        stmt = create_insert(table_name, content)
        # print(str(metadata.tables[table_name].insert(), [content]))
        new_id = ""
        try:
            with db.connect() as conn:
                # projects = conn.execute(
                #    stmt
                # )
                # data = []
                # data.append(content)
                ins = metadata.tables[table_name].insert()
                projects = conn.execute(ins.values(content))

            new_id = projects.inserted_primary_key[0]
            sel = select([metadata.tables[table_name]]).where(metadata.tables[table_name].columns[table_pk] == new_id)
            if auto_inc:
                stmt = create_select(table_name) + " WHERE " + table_pk + "=" + str(projects.inserted_primary_key[0])
            else:
                stmt = create_select(table_name) + " WHERE " + table_pk + "=\"" + content[table_pk] + "\""
            # query database
            try:
                with db.connect() as conn:
                    projects = conn.execute(
                       sel
                    )
                print(projects.rowcount)
                project ={}
                for v in projects:
                    print(v)
                    for column, value in v.items():
                        project[column] = format_values(value)
                    new_id = v[table_pk]
                    print("before lnks: " + json.dumps(project))
                    project = createLinks(project, table_name, str(new_id))
                    print("after lnks: " + json.dumps(project))

            except Exception as e:
                logger.exception(e)
                return Response(
                    status=500,
                    response="Unable to successfully cast vote! Please check the "
                    "application logs for more details. '{}'".format(e),
                )

            if table_name == 'users' and (content["user_type"] == "teacher"):

                teacher_content["user_id"] = int(new_id)
                stmt = create_insert('teachers', teacher_content)
                # print(stmt)
                try:
                    with db.connect() as conn:
                        projects = conn.execute(
                            stmt
                        )

                except Exception as e:
                    logger.exception(e)
                    return Response(
                        status=500,
                        response="Unable to successfully cast vote! Please check the "
                        "application logs for more details. '{}'".format(e),
                    )

        except Exception as e:
            logger.exception(e)
            return Response(
                status=500,
                response="Unable to successfully cast vote! Please check the "
                "application logs for more details. '{}'".format(e),
            )

    

    else:
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details.",
        )

    res = make_response(json.dumps(project))
    res.mimetype = 'application/json'
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Content-Type', 'application/json')
    res.headers.set('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin')
    res.status_code = 201
    return res

@app.route('/signup', methods = ['POST'])
def worknow():
    valuesDict = {}

    valuesDict["user_type"] = request.form['user_type']
    valuesDict["sub"] = request.form['sub']
    # print(valuesDict["sub"])
    valuesDict["first_name"] = request.form['first_name']
    valuesDict["last_name"] = request.form['last_name']
    birthdate = request.form['birthdate']
    birthdate = datetime.strptime(birthdate, '%Y-%m-%d')
    valuesDict["birthdate"] = (birthdate.strftime('%Y-%m-%d'))
    valuesDict["email_address"] = request.form['email_address']
    valuesDict["school"] = request.form['school']
    valuesDict["username"] = request.form['username']

    if valuesDict["user_type"] == 'student':
        valuesDict["activation_code"] = request.form['activation_code']

    else:
        valuesDict["teaching_certification_id"] = request.form['teaching_certification_id']
        valuesDict["title"] = request.form['title']

    # print(valuesDict)


    response = insert_item('users', 'id', auto_inc=True, valuesDict=valuesDict)
    # print (response.status)

    if response.status_code == 201:

        # return render_template("project_list.html", last_name = lastname, first_name =firstname, emailAddress=emailAddress)
        session['logged_in'] = True
        # print(json.loads(response.data))
        session["user_id"] = json.loads(response.data)["id"]
        session["user_type"] = json.loads(response.data)["user_type"]
        # print (session["user_id"])

        return redirect(url_for('addClass'))
    else:
         return redirect(url_for('oauth'))
    # return Response(
    #     status=200,
    #     response="User successfully added '{}' at time!".format(valuesDict["username"]),
    # )



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)