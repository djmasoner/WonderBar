from datetime import datetime, timedelta, date
import logging
import os
from flask import Flask, render_template, request, Response, make_response, url_for, redirect
import sqlalchemy
from requests_oauthlib import OAuth2Session
import json
from google.oauth2 import id_token
from google.auth import crypt
from google.auth import jwt
from google.auth.transport import requests
import requests as requ
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import sessionmaker
import constants
import random
import string
from random import seed, randint

from sqlalchemy import MetaData, Table, Column, ForeignKey
from sqlalchemy.ext.automap import automap_base
from google.cloud import storage

seed()

app = Flask(__name__)

# max items returned from a select query
MAX_LIMIT = 25


# Configure this environment variable via app.yaml
CLOUD_STORAGE_BUCKET = "wonderbar-cs467.appspot.com"


logger = logging.getLogger()

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
    db_user = os.environ["DB_USER"]
    db_pass = os.environ["DB_PASS"]
    db_name = os.environ["DB_NAME"]
    db_host = os.environ["DB_HOST"]

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
    db_user = os.environ["DB_USER"]
    db_pass = os.environ["DB_PASS"]
    db_name = os.environ["DB_NAME"]
    db_socket_dir = os.environ.get("DB_SOCKET_DIR", "/cloudsql")
    cloud_sql_connection_name = os.environ["CLOUD_SQL_CONNECTION_NAME"]

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
db = init_connection_engine()

# produce MetaData object to load existing database (not being used right now)
metadata = MetaData()
metadata.reflect(db)
Base = automap_base(metadata=metadata)
Base.prepare()
activation_codes, users, teachers, projects, project_users,\
    topics, project_topics, locations, project_locations, \
    response_types, prompts, multientry_items, observations, \
    materials, classes, enrollments = \
    Base.classes.activation_codes, Base.classes.users, Base.classes.teachers, \
    Base.classes.projects, Base.classes.project_users, Base.classes.topics, \
    Base.classes.project_topics, Base.classes.locations, Base.classes.project_locations, \
    Base.classes.response_types, Base.classes.prompts, Base.classes.multientry_items, Base.classes.observations, \
    Base.classes.materials, Base.classes.classes, Base.classes.enrollments


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
    return render_template('index.html')

@app.route('/<table_id>', methods = ['GET'])
def get_items(table_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )

    return list_all_general(table_id, constants.table_pks[table_id])


@app.route('/<table_id>/<project_id>', methods = ['GET'])
def get_item(table_id, project_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )
    return list_one(table_id, constants.table_pks[table_id], project_id)

@app.route('/<table_id>', methods = ['POST'])
def post_item(table_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )
    return insert_item(table_id, constants.table_pks[table_id], constants.table_auto[table_id])

@app.route('/<table_id>/<project_id>', methods = ['PATCH'])
def patch_item(table_id, project_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )
    return update_item(table_id, constants.table_pks[table_id], project_id)

@app.route('/<table_id>', methods = ['DELETE'])
def delete_item(table_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )
    return delete_all(table_id)

@app.route('/<table_id>/<project_id>', methods = ['DELETE'])
def delete_items(table_id, project_id):
    if table_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )
    return delete_one(table_id, constants.table_pks[table_id], project_id)

@app.route('/<table1_id>/<project_id1>/<table2_id>/<project_id2>', methods = ['PUT'])
def add_to_existing(table1_id, project_id1, table2_id, project_id2):
    valuesDict = {}
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][1]] = project_id2
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][2]] = project_id1
    # print (valuesDict)
    return insert_item(constants.table_fks[table1_id+"_"+table2_id][0], constants.table_pks[constants.table_fks[table1_id+"_"+table2_id][0]], constants.table_auto[constants.table_fks[table1_id+"_"+table2_id][0]], valuesDict)

@app.route('/<table1_id>/<project_id1>/<table2_id>', methods = ['POST'])
def add_to_specific(table1_id, project_id1, table2_id):
    valuesDict = {}
    valuesDict[constants.table_fks[table1_id+"_"+table2_id][2]] = project_id1
    # print (valuesDict)
    return insert_item(constants.table_fks[table1_id+"_"+table2_id][0], constants.table_pks[constants.table_fks[table1_id+"_"+table2_id][0]], constants.table_auto[constants.table_fks[table1_id+"_"+table2_id][0]], valuesDict)

@app.route('/<table1_id>/<project_id1>/<table2_id>/<project_id2>', methods = ['DELETE'])
def remove_from_existing(table1_id, project_id1, table2_id, project_id2):

    return delete_one_join(table1_id, project_id1, table2_id, project_id2)

@app.route('/<table1_id>/<project_id1>/<table2_id>', methods = ['DELETE'])
def remove_from_table(table1_id, project_id1, table2_id):
    return delete_all_specific(table1_id, project_id1, table2_id)


@app.route('/<table1_id>/<project_id>/<table2_id>', methods = ['GET'])
def get_other_table(table1_id, project_id, table2_id):

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
        print(stmt)

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
                project["self"] = constants.app_url  + table2_id + "/" + str(project_id)
                if table1_id == 'projects':
                   project["users"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/users"
                   project["prompts"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/prompts"
                   project["locations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/locations"
                   project["topics"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/topics"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'users':
                   project["projects"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/projects"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'prompts':
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"
                   project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/multientry_items"


                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

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


        return Response(
            status=200,
            response=json.dumps(all_projects),
        )

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
        print(stmt)

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
                project["self"] = constants.app_url  + table2_id + "/" + str(project_id)
                if table1_id == 'projects':
                   project["users"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/users"
                   project["prompts"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/prompts"
                   project["locations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/locations"
                   project["topics"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/topics"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'users':
                   project["projects"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/projects"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'prompts':
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"
                   project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/multientry_items"


                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

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


        return Response(
            status=200,
            response=json.dumps(all_projects),
        )

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


        stmt = "SELECT * FROM  classes WHERE classes.teacher_id=%s"

        stmt = """SELECT projects.name, prompts.subheading, prompts.description, observations.* 
        FROM observations
        INNER JOIN prompts
        ON observations.prompt_id = prompts.id
        INNER JOIN projects
        ON prompts.project_id = projects.id
        WHERE projects.id = %s"""
        print(stmt)

        # query database
        try:
            with db.connect() as conn:

                count = conn.execute("SELECT COUNT(*)" + """FROM observations
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
                project["self"] = constants.app_url  + table2_id + "/" + str(project_id)
                if table1_id == 'projects':
                   project["users"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/users"
                   project["prompts"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/prompts"
                   project["locations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/locations"
                   project["topics"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/topics"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'users':
                   project["projects"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/projects"
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"

                if table1_id == 'prompts':
                   project["observations"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/observations"
                   project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[project_id]) + "/multientry_items"


                results.append(project)

            if len(results) < q_limit or q_limit==0:
                next_set = None
            else:
                next_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

            if q_offset == 0:
                prev_set = None
            else:
                prev_set = (constants.app_url  + table1_id + "/" + project_id + "/prompts"  + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

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


        return Response(
            status=200,
            response=json.dumps(all_projects),
        )




    if table1_id not in constants.table_attributes.keys() or table2_id not in constants.table_attributes.keys():
        return Response(
            status=404,
            response=json.dumps({"Error":"Page does not exist"}),
        )

    return list_all_specific(table2_id, constants.table_pks[table2_id], constants.table_fks[table1_id + "_" + table2_id], project_id)

# routes end ------------------------------------------------------------------------------------------------------------------


# @app.route('/upload', methods=['POST'])
def upload():

    content = request.args.dict_of_lists()
    """Process the uploaded file and upload it to Google Cloud Storage."""
    # uploaded_file = request.files.get('avatar')

    if not uploaded_file:
        return content

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

    # The public URL can be used to directly access the uploaded file via HTTP.
    return blob.public_url


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

            count = conn.execute("SELECT COUNT(*) FROM " + table_name)
            id_count =0
            for v in count:
                for column, value in v.items():
                        id_count = value
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
            project["self"] = constants.app_url  + table_name + "/" + str(v[order_by])
            if table_name == 'projects':
               project["users"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/users"
               project["prompts"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/prompts"
               project["locations"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/locations"
               project["topics"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/topics"
               project["observations"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/observations"

            if table_name == 'users':
               project["projects"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/projects"
               project["observations"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/observations"

            if table_name == 'prompts':
               project["observations"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/observations"
               project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[order_by]) + "/multientry_items"


            results.append(project)

        if len(results) < q_limit or q_limit==0:
            next_set = None
        else:
            next_set = (constants.app_url  + table_name + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

        if q_offset == 0:
            prev_set = None
        else:
            prev_set = (constants.app_url  + table_name + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

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


    return Response(
        status=200,
        response=json.dumps(all_projects),
    )


def list_all_specific(table_name, primary_key, foreign_key, specific_id):
    print(foreign_key)
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


    stmt = "SELECT " + table_name + ".* FROM " + table_name + " INNER JOIN " + foreign_key[0] + " ON " + table_name + "." + constants.table_pks[table_name] + "=" + foreign_key[0] + "." + foreign_key[1] + " WHERE " + foreign_key[0] + "." + foreign_key[2] + "=%s"
    print(stmt)

    # query database
    try:
        with db.connect() as conn:

            count = conn.execute("SELECT COUNT(*) FROM " + foreign_key[0] + " WHERE " + foreign_key[0] + "." + foreign_key[2] + "=%s", specific_id)
            id_count =0
            for v in count:
                for column, value in v.items():
                        id_count = value
            if q_limit == 0:
                projects = conn.execute(
                   stmt + " order by " + q_order_by, specific_id
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
            project["self"] = constants.app_url  + table_name + "/" + str(specific_id)
            if table_name == 'projects':
               project["users"] = constants.app_url  + table_name + "/" + str(specific_id) + "/users"
               project["prompts"] = constants.app_url  + table_name + "/" + str(specific_id) + "/prompts"
               project["locations"] = constants.app_url  + table_name + "/" + str(specific_id) + "/locations"
               project["topics"] = constants.app_url  + table_name + "/" + str(specific_id) + "/topics"
               project["observations"] = constants.app_url  + table_name + "/" + str(specific_id) + "/observations"

            if table_name == 'users':
               project["projects"] = constants.app_url  + table_name + "/" + str(specific_id) + "/projects"
               project["observations"] = constants.app_url  + table_name + "/" + str(specific_id) + "/observations"

            if table_name == 'prompts':
               project["observations"] = constants.app_url  + table_name + "/" + str(specific_id) + "/observations"
               project["multientry_items"] = constants.app_url  + table_name + "/" + str(specific_id) + "/multientry_items"


            results.append(project)

        if len(results) < q_limit or q_limit==0:
            next_set = None
        else:
            next_set = (constants.app_url  + table_name + "/" + specific_id + "/" + foreign_key[0] + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset + q_limit))

        if q_offset == 0:
            prev_set = None
        else:
            prev_set = (constants.app_url  + table_name + "/" + specific_id + "/" + foreign_key[0] + "?" + "order_by=" + q_order_by + "&limit=" + str(q_limit) + "&offset=" + str(q_offset - q_limit))

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


    return Response(
        status=200,
        response=json.dumps(all_projects),
    )

def list_one(table_name, table_pk, key_val):


    stmt = create_select(table_name) + " WHERE " + table_pk + "=%s"
    # query database
    try:
        with db.connect() as conn:
            projects = conn.execute(
               stmt, key_val
            ).fetchall()

        if len(projects) == 0:
            return Response(
                status=404,
                response=json.dumps({"Error": "ID (" + str(key_val) + ") does not exist in table (" + table_name + ")."}),
            )

        for v in projects:

            project ={}
            for column, value in v.items():
                project[column] = format_values(value)
            project["self"] = constants.app_url  + table_name + "/" + str(v[table_pk])

            if table_name == 'projects':
               project["users"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/users"
               project["prompts"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/prompts"
               project["locations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/locations"
               project["topics"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/topics"
               project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"

            if table_name == 'users':
               project["projects"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/projects"
               project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"

            if table_name == 'prompts':
               project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"
               project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/multientry_items"

    except Exception as e:
        logger.exception(e)
        return Response(
            status=500,
            response="Unable to successfully cast vote! Please check the "
            "application logs for more details. '{}'".format(e),
        )


    return Response(
        status=200,
        response=json.dumps(project),
    )




def update_item(table_name, table_pk, key_val):
    content = request.get_json()
    if content != None:
        error_list = verify_contents(content, constants.table_updates[table_name], constants.table_attributes_optional[table_name])
        if error_list:
            return Response(
                status=400,
                response=json.dumps({"Error": "The request object contains invalid attributes or is missing attributes: " + ", ".join(error_list)}),
            )

        stmt = create_update(table_name, content) + " WHERE " + table_pk + "=%s"
        print(stmt)
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


    return Response(
        status=204,
        response=json.dumps(''),
    )

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


    return Response(
        status=204,
        response=json.dumps(''),
    )


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


    return Response(
        status=204,
        response=json.dumps(''),
    )

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


    return Response(
        status=204,
        response=json.dumps(''),
    )


def insert_item(table_name, table_pk, auto_inc=True, valuesDict={}):
    empty = (request.get_data().decode("utf-8") == "")

    if empty:
        content = valuesDict
    else:
        content = request.get_json()
        if valuesDict != None:
            content.update(valuesDict)
    # if content == "":
    #     content = valuesDict
    # print(content)
    # print(content)
    if content != None:
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
                error_list = verify_contents(content,constants.table_attributes[table_name])
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

                for key in constants.table_attributes["teachers"]:
                    if key in content.keys():
                        teacher_content = {key: content[key]}
                        content.pop(key, None)

                content['activation_code'] = generate_random_string(randint(10, 15))
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
        try:
            with db.connect() as conn:
                projects = conn.execute(
                   stmt
                )

            # new_id = conn.insert_id()
            if auto_inc:
                stmt = create_select(table_name) + " WHERE " + table_pk + "=(SELECT LAST_INSERT_ID())"
            else:
                stmt = create_select(table_name) + " WHERE " + table_pk + "=\"" + content[table_pk] + "\""
            # query database
            try:
                with db.connect() as conn:
                    projects = conn.execute(
                       stmt
                    )
                for v in projects:

                    project ={}
                    for column, value in v.items():
                        project[column] = format_values(value)
                    project["self"] = constants.app_url  + table_name + "/" + str(v[table_pk])

                    if table_name == 'projects':
                       project["users"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/users"
                       project["prompts"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/prompts"
                       project["locations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/locations"
                       project["topics"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/topics"
                       project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"

                    if table_name == 'users':
                       project["projects"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/projects"
                       project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"

                    if table_name == 'prompts':
                       project["observations"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/observations"
                       project["multientry_items"] = constants.app_url  + table_name + "/" + str(v[table_pk]) + "/multientry_items"



            except Exception as e:
                logger.exception(e)
                return Response(
                    status=500,
                    response="Unable to successfully cast vote! Please check the "
                    "application logs for more details. '{}'".format(e),
                )

            if table_name == 'users' and (content["user_type"] == "teacher"):

                teacher_content["user_id"] = v[table_pk]

                stmt = create_insert('teachers', teacher_content)
                print(stmt)
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


    return Response(
        status=201,
        response=json.dumps(project),
    )



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)