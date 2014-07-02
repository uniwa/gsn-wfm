# -*- coding: utf-8 -*-

# django imports
from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import *
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import Http404
from django.utils import simplejson as json
from django.core.servers.basehttp import FileWrapper
from django.utils.encoding import smart_unicode
from django.utils.encoding import smart_str
from django.conf import settings
from django.core.files import File

# basic python imports
import datetime
import time
from uuid import uuid4
import Image
import mimetypes
import os
import tempfile
import zipfile
import base64
import re
import sys
from PIL import Image
from PIL import ImageOps
# Fall back to StringIO in environments where cStringIO is not available
try:
	from cStringIO import StringIO
except ImportError:
	from StringIO import StringIO

import imghdr
import urllib
import inspect
import shutil
from subprocess import Popen
from subprocess import PIPE

# pymongo imports
import pymongo
from pymongo import Connection
from pymongo import binary
from gridfs import GridFS

# ldap imports
import ldap
from ldap import filter

# settings
from local_settings import *

#-[ logging ]-------------------------------------------------------------------
import logging
import logging.handlers

# set LOG_DIR in local_settings
LOG_PATH = os.path.abspath(LOG_DIR)
LOG_FILENAME = 'wfm.log'
LOG_FILE = os.path.join(LOG_PATH, LOG_FILENAME)

# create folder
try:
	os.mkdir(LOG_PATH)
except OSError:
	pass

wfm_logger = logging.getLogger('wfm')
if settings.DEBUG:
	wfm_logger.setLevel(logging.DEBUG)
else:
	wfm_logger.setLevel(logging.INFO)

# cofigure handler and formatter
handler = logging.handlers.RotatingFileHandler(LOG_FILE, maxBytes=1000000,
				backupCount=7 )
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

# Add the log message handler to the logger
wfm_logger.addHandler(handler)

#-[ import pyclamd ]------------------------------------------------------------
if VIRUS_SCAN:
	try:
		import pyclamd
	except:
		VIRUS_SCAN = False
		log_msg = "Could not load python clamAV library but virus scan enabled in settings"
		wfm_logger.error(log_msg)

#-[ mongo db init ]-------------------------------------------------------------
db = Connection(MONGO_HOST, MONGO_PORT, slave_okay=MONGO_SLAVE_OK).database
db_gridfs = GridFS(db)

result_num = 20
search_attrs = ['name', 'tags']


#----- EXTRA FUNCTIONS-----------------------------
def whoami():
	'''Return the name of the function that called me'''
	return inspect.stack()[1][3]

def  user_loged_in(user):
	return user.is_authenticated()
	
#the decorator
def myuser_login_required(f):
	def wrap(request, *args, **kwargs):
		#Do some session checking
		if not request.user.is_authenticated():
			ret = {'success': False, 'status_msg': 'user_authentication_failed'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		return f(request, *args, **kwargs)
		wrap.__doc__=f.__doc__
		wrap.__name__=f.__name__
	return wrap


def register_user(username):
	try:
		con = ldap.initialize(ldap_server)
		con.simple_bind_s(dn,pw)
		
		search_obj = '(|(umdobject=teacher)(umdobject=student)(umdobject=personel)(umdobject=account))'
		ldapfilter = '(&(uid=%s)%s)' % (username, search_obj)
		
		ldap_result_id = con.search(base_dn, scope, ldapfilter, ['ftpquota', 'cn'])
		result_type, result_data = con.result(ldap_result_id,0)
		if not result_data or len( result_data ) == 0:
			return False
		quota = int(result_data[0][1]['FTPQUOTA'][0].rsplit(',')[2])
		name = result_data[0][1]['cn'][0]
		con.unbind_s()
	except:
		return False
	
	home_id = 'd' + uuid4().hex
	trash_id = 'd' + uuid4().hex
	#Create user filesystem &  base directories
	fs_doc = {'type': 'fs', 'owner': username, '_id': uuid4().hex, 'quota': quota, 'used_space': 0, 'locked': False, 'share_list': [], 'tag_list': [], 'home_id': home_id, 'trash_id': trash_id, 'bookmarks': [], 'users': [], 'name' : name }
	db.user_fs.insert([fs_doc] , safe=True )
	
	home_file = db_gridfs.new_file(type = 'schema', content_type = 'folder', name = 'home', owner = username, tags =[], parent_id = 'root', public = {'users': [], 'groups': []}, _id = home_id, global_public = False, old_parent_id = '0', deleted = False, thumbnail = [], subtree_size = 0, bookmarked = False)
	home_file.close()
		
	trash_file = db_gridfs.new_file(type = 'schema', content_type='folder', name = 'trash', owner = username, tags =[], parent_id = 'root', public = {'users': [], 'groups': []}, _id = trash_id, global_public = False, old_parent_id = '0', deleted = True, thumbnail = [], subtree_size = 0, bookmarked = False)
	trash_file.close()
	
	return True


#Unique-fy a list
def unique(s):
	n = len(s)
	if n == 0:
		return []

	#List elements are hashable
	u = {}
	try:
		for x in s:
			u[x] = 1
	except TypeError:
		del u  # move on to the next method
	else:
		return u.keys()

	#List elements are comparable
	try:
		t = list(s)
		t.sort()
	except TypeError:
		del t  # move on to the next method
	else:
		assert n > 0
		last = t[0]
		lasti = i = 1
		while i < n:
			if t[i] != last:
				t[lasti] = last = t[i]
				lasti += 1
			i += 1
		return t[:lasti]

	# Brute force is all that's left.
	u = []
	for x in s:
		if x not in u:
			u.append(x)
	return u
	

def read_in_chunks(file_object, chunk_size=8*1024):
	"""Lazy function (generator) to read a file piece by piece.
	Default chunk size: 8k."""
	while True:
		data = file_object.read(chunk_size)
		if not data:
			break
		yield data

#Test if filename is valid
def name_not_valid(name):
	for i in name:
		if i in ('<', '>', ';', '\\', '/'):
			return True
	return False
	
#Test if taglist is valid	- do not care for delimiter '/''
def taglist_not_valid(taglist):
	for i in taglist:
		if i in ('<', '>', ';', '\\'):
			return True
	return False

#Test for doc owner
def is_not_owner(doc, username):
	if doc['owner'] == username:
		return False
	return True

#Test whether a user has document access - Obsolete after v1.6 of mongo
def has_not_access(doc, username):
	if doc['global_public']:
		return False
	if doc['owner'] == username:
		return False
	for i in doc['public']['users']:
		if i['username'] == username:
			return False
	for group_id in get_group_ids(username, doc['owner']):
		for entry in doc['public']['groups']:
			if group_id == entry['group_id']:
				return False
	return True
	

#Convert a path list to a path string
def lst2path(path_list):
	path = ''
	for entry in path_list:
		path+=entry+'/'
	return path[:-1]

	
# Try to lock user's filesystem
def tsl(username, size):
	
	fs = db.user_fs.find_one({'owner': username}, ['quota'])
	if not fs:
		return False
	
	quota = fs['quota']

	for i in range(0,5):
		#Test if path not already locked, lock path
		db.user_fs.update({'owner': username, 'used_space': {'$lte': quota-size}, 'locked': False}, { '$set' : { 'locked' : True } })
	
		err = db.command({'getlasterror':1})
	
		#Test if update succedded
		if err['updatedExisting']:
			return True
		
		time.sleep(3)
	return False

#Unlock user's filesystem and apply changes in user's used space
def release_fs(username, size):
	db.user_fs.update({'owner': username}, {'$set': {'locked': False}, '$inc': {'used_space':size}})

#create thumbnail
def create_thumb(f):
	#Create thumbnail
	image_size = thumbnail_size = (0,0)
	thumbnail = []
	image = Image.open(f)
	image_size = image.size
	# ImageOps compatible mode
	if image.mode not in ("L", "RGB"):
		image = image.convert("RGB")
	image.thumbnail((140,140), Image.ANTIALIAS)
	buf = StringIO()
	f.seek(0)
	image.save(buf, imghdr.what(f))
	thumbnail = binary.Binary(buf.getvalue())
	thumbnail_size = image.size
	
	return thumbnail, thumbnail_size, image_size

#Propagate size
def size_propagation(username, parent_id, size):
	#Get parent
	parent = db.fs.files.find_one({'owner': username, '_id': parent_id}, ['parent_id'])
	if parent:
		#Increase size
		db.fs.files.update({'_id': parent['_id']}, {'$inc': {'subtree_size': size}})
		#Propagate to parent's parent
		size_propagation(username, parent['parent_id'], size)


#Find (home schema) size of subtree rooted at root_id - root size excluded
def determine_home_size(root_id):
	size = 0
	for doc in db.fs.files.find({'parent_id': root_id}, ['length']):
		size += doc['length']
		size += determine_home_size(doc['_id'])
	
	return size
	

#Find (public) size of subtree rooted at root_id - root size excluded
def determine_public_size(username, owner, root_id, group_ids):
	size = 0
	for doc in public_access_docs(username,  {'parent_id': root_id}, ['length'], group_ids):
		size += doc['length']
		size += determine_public_size(username, owner, doc['_id'], group_ids)
	
	return size

#Find (user shared) size of subtree rooted at root_id - root size excluded
def determine_user_shared_size(username, user, root_id, group_ids):
	return determine_public_size(user, username, root_id, group_ids)

#Find (group shared) size of subtree rooted at root_id - root size excluded
def determine_group_shared_size(group_id, root_id):
	size = 0
	for doc in db.fs.files.find({'parent_id': root_id, 'public.groups.group_id': group_id}, ['length']):
		size += doc['length']
		size += determine_group_shared_size(group_id, doc['_id'])
	
	return size

	
def public_access_docs(username, access_doc, field_list, group_ids):
	group_ids.append('__null__')
	return db.fs.files.find(dict(access_doc, **{'$or': [{'global_public': True}, {'public.users.username': username}, {'public.groups.group_id': {'$in': group_ids} }]}), field_list )

#Get the ids of groups of owner that username appears
def get_group_ids(username, owner):
	group_ids = []
	for group in db.groups.find({'owner': owner, 'users': username},[]):
		group_ids.append(group['_id'])
	return group_ids

#Get a list of users that share docs with username - to change after mongodb v1.6
def get_public_users(username):
	
	users = []
	#Document share to user himself
	for doc in db.fs.files.find({'public.users': { '$elemMatch' : { 'username' : username, 'published' : True}}},['owner']):
		users.append(doc['owner'])
	
	#Document share to groups that user is member
	for group in db.groups.find({'users': username},['owner']):
		#if a file has been shared with this group
		if db.fs.files.find_one({'public.groups' : {'$elemMatch' : {'group_id' : group['_id']}}}) is not None:	
			users.append(group['owner'])
	
	log_msg = "%s :: user %s :: userlist: %s" % (whoami(), username, users)
	wfm_logger.debug(log_msg)

	return unique(users)
	
#Get a list of users that have access to your documents
def get_shared_users(username):
	users = []
	#Users that have direct access to my documents
	for doc in db.fs.files.find({'owner': username, 'public.users.published': True}, ['public.users.username']):
		#Correct
		for public_entry in doc['public']['users']:
			users.append(public_entry['username'])

	#Users that have access through groups
	for group in db.groups.find({'owner': username}):
		#if a file has been shared with this group
		if db.fs.files.find_one({'public.groups' : {'$elemMatch' : {'group_id' : group['_id']}}}) is not None:	
			users += group['users']
	
	log_msg = "%s :: user %s :: userlist: %s" % (whoami(), username, users)
	wfm_logger.debug(log_msg)

	return unique(users)

def build_return(flag, status_message, return_doc):
	ret = {'success': flag, 'status_msg': status_message, 'return_doc': return_doc}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
#-----THE API ITSELF------------------

def cmd_logout(request):
	logout(request)
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
def cmd_login(request):
	try:
		username = request.REQUEST[ 'username' ]
		password = request.REQUEST[ 'password' ]
		user = authenticate( username=username, password=password )
		if user is not None:
			if user.is_active:
				login(request, user)
				request.session['username']=username
				ret = {'success': True, 'status_msg': ''}
			else:
				ret = {'success': False, 'status_msg': 'inactive_account'}
		else:
			ret = {'success': False, 'status_msg': 'invalid_login'}
	except Exception:
		ret = {'success': False, 'status_msg': 'bad_parameters'}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

@myuser_login_required
def cmd_get_userinfo(request):
	username = request.user.username
	fs = db.user_fs.find_one({'owner': username}, ['name'])
	if fs:
		ret = {'success': True, 'username': username, 'name' : fs['name']}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	else:
		ret = {'success': False}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

@myuser_login_required
def cmd_get_space(request):
	username = request.user.username
	
	fs = db.user_fs.find_one({'owner': username}, ['quota', 'used_space'])
	if not fs:
		ret = {'success': False}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript") 
	
	ret = {'success': True, 'total_space': fs['quota'], 'used_space': fs['used_space']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
@myuser_login_required
def cmd_search(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('query') and request.REQUEST.__contains__('count')):
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	contents = []
	for doc in db.users.find( build_query_doc(query) , ['name', 'type', 'owner', 'public', 'global_public']).skip(results_num * count).limit(results_num):
		if not has_not_access(doc, username):
			del doc['public']
			del doc['global_public']
			contents.append(doc)
	
	ret = {'success': True, 'results':contents}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Search attributes: name, tag, owner, 
def build_query_doc(query):
	doc = {}
	for entry in query.split(','):
		attr,value = entry.split('=')
		if attr in search_attrs:
			doc['attr'] = value
	return doc


# handle fs folder creating and let cmd_create_folder handle the requests
def create_folder(username, parent_id, name):
	#Verify validity of doc_name
	if name_not_valid(name):
		# return 'bad_document_name'
		return 1
	
	#Lock the appropriate filesystem branch to insert new folder
	if  not tsl(username, 0):
		# return 'op_failed_quota_exceeded'
		return 2
		
	#Verify that parent folder exists and user is owner
	parent_folder = db.fs.files.find_one({'_id': parent_id, 'owner': username, 'deleted': False, 'type': {'$ne': 'file'}}, ['public', 'name', 'global_public'])
	if not parent_folder:
		release_fs(username, 0)
		# return 'parent_folder_does_not_exist'
		return 3
	
	#Set inhereted attributes
	
	#public
	public_users = []
	for public_user in parent_folder['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in parent_folder['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}
	doc_id = 'd' + uuid4().hex
	
	#Insert new folder
	new_folder = db_gridfs.new_file(type= 'folder', content_type = 'folder', name = name, owner = username, public = public, tags = [], _id = doc_id, parent_id = parent_id, old_parent_id = '0', deleted = False, global_public = parent_folder['global_public'], thumbnail = [], subtree_size = 0, bookmarked = False )
	new_folder.close()
	
	#Release
	release_fs(username, 0)

	return doc_id


#Create a folder with name 'name' under the folder with id 'parent_id'
@myuser_login_required
def cmd_create_folder(request):
	username = request.user.username

	folder_errors = { 	1: 'bad_document_name',
						2: 'op_failed_quota_exceeded',
						3: 'parent_folder_does_not_exist'}
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('parent_id') and request.REQUEST.__contains__('name')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	parent_id = smart_unicode(request.REQUEST['parent_id'], encoding='utf-8', strings_only=False, errors='strict')
	name = smart_unicode(request.REQUEST['name'], encoding='utf-8', strings_only=False, errors='strict')

	doc_id = create_folder(username, parent_id, name)

	if doc_id in folder_errors:
		log_msg = "%s :: user %s :: %s" % (whoami(), username, folder_errors[doc_id])
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': folder_errors[doc_id]}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: created folder %s" % (whoami(), username, name)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'status_msg': 'folder_successfully_created', 'doc_id': doc_id, 'name': name}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# handle fs create file operations and let cmd_create_file to handle requests
def create_file(username, parent_id, fdata):
	# scan uploaded files
	if VIRUS_SCAN:
		# connect to clamAV, quit early on error
		try:
			pyclamd.init_unix_socket(clamd_SOCKET)
		except:
			try:
				pyclamd.init_network_socket(clamd_HOST, clamd_PORT)
			except:
				log_msg = "%s :: user %s :: cannot connect to ClamAV daemon" % (whoami(), username)
				wfm_logger.error(log_msg)
				# return 'antivirus_service_error'
				return 4

	name = smart_unicode(fdata.name, encoding='utf-8', strings_only=False, errors='strict')
	size = fdata.size

	# verify we have disc space
	# tsl below will catch it anyway but we need to properly inform users
	if not available_space(username, size):
		return 6
	
	#Verify validity of doc_name
	if name_not_valid(name):
		# return 'bad_document_name'
		return 1
	
	#Lock the appropriate filesystem branch to insert new file
	if  not tsl(username, size):
		# return 'op_failed_quota_exceeded'
		return 2
	
	parent_folder = db.fs.files.find_one({'_id': parent_id, 'owner': username, 'deleted': False, 'type': {'$ne': 'file'}}, ['public', 'name', 'global_public'])
	
	if not parent_folder:
		release_fs(username, 0)
		# return 'parent_folder_id_does_not_exist'
		return 3
		
	#Set inhereted attributes
	
	#public
	public_users = []
	for public_user in parent_folder['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in parent_folder['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}
	
	#Guess mime type
	mime_type = mimetypes.guess_type(name)[0]
	
	if not mime_type:
		mime_type = 'Unknown'
	
	#Create file - atomic operation
	file_id = 'd' + uuid4().hex
	
	new_file = db_gridfs.new_file(_id = file_id, type = 'file', content_type = mime_type, name = name, owner = username, public = public, tags = [], parent_id = parent_id, old_parent_id = '0', deleted = False, global_public = parent_folder['global_public'], subtree_size = size, bookmarked = False)
	
	fdata.seek(0)
	if VIRUS_SCAN:
		for chunk in fdata.chunks():
			if pyclamd.scan_stream(chunk) is None:
				new_file.write(chunk)
			else:
				new_file.close()
				db_gridfs.delete(file_id)
				release_fs(username, size)
				
				# log incident
				log_msg = "%s :: user %s :: deleted infected file '%s'" % (whoami(), username, name)
				wfm_logger.info(log_msg)
				
				# return infected_file_found
				return 5
	else:
		for chunk in fdata.chunks():
			new_file.write(chunk)
	
	new_file.close()
	
	size_propagation(username, parent_id, size)
	release_fs(username, size)
	
	return file_id


@myuser_login_required
def cmd_create_file(request):
	username = request.user.username

	file_errors = { 1: 'bad_document_name',
					2: 'op_failed_quota_exceeded',
					3: 'parent_folder_id_does_not_exist',
					4: 'antivirus_service_error',
					5: 'infected_file_found',
					6: 'not_enough_disk_space'}

	xwfm_errors = { 1: 'bad-name',
					2: 'quota-full',
					3: 'parent-id-not-exists',
					4: 'antivirus-service-error',
					5: 'infected-file-found',
					6: 'not-enough-disk-space'}
	
	#Verify parameter identifiers
	if not (request.POST.__contains__('parent_id') and request.FILES):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		resp = HttpResponse(json.dumps(ret), mimetype="application/javascript")
		resp[ 'X-WFM' ] = 'bad-param'
		return resp
	
	parent_id = smart_unicode(request.POST['parent_id'], encoding='utf-8', strings_only=False, errors='strict')
	name =  smart_unicode(request.FILES['file_data'].name, encoding='utf-8', strings_only=False, errors='strict')
	size = request.FILES['file_data'].size
	
	file_id = create_file(username, parent_id, request.FILES['file_data'])
	
	if file_id in file_errors:
		log_msg = "%s :: user %s :: %s" % (whoami(), username, file_errors[file_id])
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': file_errors[file_id]}
		resp = HttpResponse(json.dumps(ret), mimetype="application/javascript")
		resp[ 'X-WFM' ] = xwfm_errors[file_id]
		return resp

	log_msg = "%s :: user %s :: uploaded file %s" % (whoami(), username, name)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True,'doc_id': file_id, 'name': name, 'size': size}
	# WORKAROUND: use text/html instead of js return type to avoid IE8 bug
	# http://stackoverflow.com/questions/4471920/extjs-fileupload-problem-with-ie8-security-bar
	resp = HttpResponse(json.dumps(ret), mimetype="text/html")
	resp[ 'X-WFM' ] = 'ok'
	return resp


# Extract a zip file
def extract_zip(f, username, public, gl_public, parent_id):
  
	zip_file = zipfile.ZipFile(f)
	id_dict = {'/': parent_id}
	top_id =''
  
	#Verify the validity of file names
	zip_names = zip_file.namelist()
	for zip_name in zip_names:
		if taglist_not_valid(zip_name):
			ret = {'success': False, 'status_msg': 'bad_document_name'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
  
	for zip_name in sorted(zip_names):
		pathlist = zip_name.rpartition('/')
		doc_id = 'd' + uuid4().hex
		id_dict[zip_name] = doc_id
		
		if not top_id:
			top_id = doc_id
    
		if pathlist[2] == '':
			pathlist = pathlist[0].rpartition('/')
			subparent_id = id_dict[pathlist[0]+'/']
			#Insert new folder
			new_folder = db_gridfs.new_file(type= 'folder',
											content_type = 'folder',
											name = pathlist[2],
											owner = username, 
											public = public,
											tags = [],
											_id = doc_id,
											parent_id = subparent_id,
											old_parent_id = '0',
											deleted = False,
											global_public = gl_public,
											thumbnail = [],
											subtree_size = 0,
											bookmarked = False)
			new_folder.close()
      
		else:
			subparent_id = id_dict[pathlist[0]+'/']
			zip_subfile = zip_file.open(zip_name)
			subsize = zip_file.getinfo(zip_name).file_size
			
			#Guess mime type
			mime_type = mimetypes.guess_type(pathlist[2])[0]
	
			if not mime_type:
				mime_type = 'Unknown'

			new_file = db_gridfs.new_file(  _id = doc_id,
											type = 'file',
											content_type = mime_type,
											name = pathlist[2],
											owner = username,
											public = public,
											tags = [],
											parent_id = subparent_id,
											old_parent_id = '0',
											deleted = False,
											global_public = gl_public,
											subtree_size = subsize,
											bookmarked = False)
      
			for chunk in read_in_chunks(zip_subfile):
				new_file.write(chunk)

			zip_subfile.close()
			new_file.close()
	
	return top_id
	

#Extract archive in server - heavy operation
@myuser_login_required
def cmd_extract(request):
	username = request.user.username
  
  #Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
  #Lock the appropriate filesystem branch to insert new file
	if  not tsl(username,0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_quota_exceeded'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc = db.fs.files.find_one({'_id': doc_id, 'owner': username, 'deleted': False, 'type': 'file'}, ['public', 'name', 'global_public', 'parent_id', 'contentType'])
	if not doc:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: doc not found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'doc_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
  
	#Verify document type
	if doc['contentType'].rpartition('/')[2] == 'zip':
		
		#Extract zip
		top_id = extract_zip(db_gridfs.get(doc_id), username, doc['public'], doc['global_public'], doc['parent_id'])
		#Update size of subtree documents
		size = compute_space(top_id)
		#Propagate size to parents
		size_propagation(username, doc['parent_id'], size)
		release_fs(username, size)
		
		log_msg = "%s :: user %s :: extracted file" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': True}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	else:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: doc_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'doc_is_not_zip'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

def get(request, doc_id):
	username = request.user.username

	if not username:
		username = '__null__'

	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['global_public', 'public', 'owner', 'name', 'length'])
	
	if not doc:
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has read access
	if has_not_access(doc, username):
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Serve file
	fdata = db_gridfs.get(doc_id)
	response = HttpResponse(FileWrapper(fdata), mimetype=fdata.content_type)
	response['Content-Type'] = fdata.content_type
	response['Content-Disposition'] = smart_str('attachment; filename="' + doc['name'] + '"', encoding='utf-8', strings_only=False, errors='strict') 
	response['Content-Length'] = doc['length']
	return response
	
	
def cmd_get_file(request):
	username = request.user.username

	if not username:
		username = '__null__'
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id')):
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')

	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['global_public', 'public', 'owner', 'name', 'length'])
	
	if not doc:
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has read access
	if has_not_access(doc, username):
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Serve file
	fdata = db_gridfs.get(doc_id)
	response = HttpResponse(FileWrapper(fdata), mimetype=fdata.content_type)
	response['Content-Type'] = fdata.content_type
	response['Content-Disposition'] = smart_str('attachment; filename="' + doc['name'] + '"', encoding='utf-8', strings_only=False, errors='strict') 
	response['Content-Length'] = doc['length']
	return response
	
	#response = HttpResponse(mimetype= smart_str(doc['mime_type'], encoding='utf-8', strings_only=False, errors='strict'))
	#response['Content-Disposition'] = smart_str('attachment; filename="' + doc['name'] + '"', encoding='utf-8', strings_only=False, errors='strict') 
	#response['Content-Length'] = doc['length']
	#response.write(db_gridfs.get(doc_id).read())
	#return response

@myuser_login_required
def cmd_get_thumbnail(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['global_public', 'public', 'owner', 'thumbnail', 'name', 'contentType'])
	
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has file access
	if has_not_access(doc, username):
		log_msg = "%s :: user %s :: user has no access to file" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

	#Verify that document is image
	if not doc['contentType'].rsplit('/')[0] == 'image':
		log_msg = "%s :: user %s :: document_is_not_image" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_is_not_image'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#First time, create thumbnail
	if not doc.has_key('thumbnail'):
		f = db_gridfs.get(doc_id)
		thumbnail,thumbnail_size, image_size = create_thumb(f)
		db.fs.files.update({'_id': doc_id}, {'$set':{'thumbnail': thumbnail, 'thumb_size': thumbnail_size, 'image_size': image_size} })
	else:
		thumbnail = doc['thumbnail']

	log_msg = "%s :: user %s :: returned thumbnail" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	response = HttpResponse(mimetype= smart_str(doc['contentType'], encoding='utf-8', strings_only=False, errors='strict'))
	response['Content-Disposition'] = smart_str('attachment; filename=' + doc['name'], encoding='utf-8', strings_only=False, errors='strict') 
	response.write(thumbnail)
	return response
		

#Return the size of a thumbnail
@myuser_login_required
def cmd_get_thumb_size(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['global_public', 'public', 'owner', 'thumb_size', 'name', 'contentType'])
	
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has file access
	if has_not_access(doc, username):
		log_msg = "%s :: user %s :: user has no access to file" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	#Verify that document is image
	if not doc['contentType'].rsplit('/')[0] == 'image':
		log_msg = "%s :: user %s :: document_is_not_image" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_is_not_image'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#First time, create thumbnail
	if not doc.has_key('thumb_size'):
		f = db_gridfs.get(doc_id)
		thumbnail,thumbnail_size, image_size = create_thumb(f)
		db.fs.files.update({'_id': doc_id}, {'$set':{'thumbnail': thumbnail, 'thumb_size': thumbnail_size, 'image_size': image_size} })
		
		log_msg = "%s :: user %s :: created thumbanail" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': True, 'size': thumbnail_size}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	else:
		log_msg = "%s :: user %s :: returned thumbanail size" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': True, 'size': doc['thumb_size']}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")


#Return the size of n image
@myuser_login_required
def cmd_get_image_size(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['global_public', 'public', 'owner', 'image_size', 'name', 'contentType'])
	
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has file access
	if has_not_access(doc, username):
		log_msg = "%s :: user %s :: user cannot access file" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that document is image
	if not doc['contentType'].rsplit('/')[0] == 'image':
		log_msg = "%s :: user %s :: document_is_not_image" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_is_not_image'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#First time, create thumbnail
	if not doc.has_key('image_size'):
		f = db_gridfs.get(doc_id)
		thumbnail,thumbnail_size, image_size = create_thumb(f)
		db.fs.files.update({'_id': doc_id}, {'$set':{'thumbnail': thumbnail, 'thumb_size': thumbnail_size, 'image_size': image_size} })
		
		log_msg = "%s :: user %s :: created thumbnail" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': True, 'size': image_size}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	else:
		log_msg = "%s :: user %s :: returned image size" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': True, 'size': doc['image_size']}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")



#Insert new bookmark
@myuser_login_required
def cmd_set_bookmark_doc(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock the appropriate filesystem branch to insert new bookmarks
	if  not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_quota_exceeded'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'folder', 'deleted': False},[])
	if not doc:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Insert the bookmark
	db.fs.files.update({'_id': doc_id}, {'$set': {'bookmarked' :True}})
	db.user_fs.update({'owner': username}, {'$addToSet': {'bookmarks': doc_id}})
	
	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: interted bookmark" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_get_bookmarks_doc(request):
	username = request.user.username
	
	fs = db.user_fs.find_one({'owner': username}, ['bookmarks'])
	
	if not fs:
		log_msg = "%s :: user %s :: no bookmarks" % (whoami(), username)
		wfm_logger.debug(log_msg)
		
		ret = {'success': False, 'status_msg': 'fs_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: got (%d) user bookmarks" % (whoami(), username, len(fs['bookmarks']))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'bookmarks': fs['bookmarks']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
@myuser_login_required
def cmd_remove_bookmark_doc(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Remove the bookmark
	db.fs.files.update({'_id': doc_id}, {'$set': {'bookmarked' :False}})
	db.user_fs.update({'owner': username}, {'$pull': {'bookmarks': doc_id}})
	
	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: deleted bookmark" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
# ***USERS ****
#Insert new bookmark
@myuser_login_required
def cmd_set_bookmark_user(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('user') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	user = smart_unicode(request.REQUEST['user'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock the appropriate filesystem branch to insert new bookmarks
	if  not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_quota_exceeded'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
	#Ensure that user exists in the filesystem
	if not db.user_fs.find_one({'owner': user}):
		if not register_user(user):
			log_msg = "%s :: user %s :: user not found" % (whoami(), username)
			wfm_logger.error(log_msg)
			
			ret = {'success': False, 'status_msg': 'user_not_found'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Insert the bookmark
	db.user_fs.update({'owner': username}, {'$addToSet': {'users': user}})
	
	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: set bookmark" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_get_bookmarks_user(request):
	username = request.user.username
	
	fs = db.user_fs.find_one({'owner': username}, ['users'])
	
	if not fs:
		ret = {'success': False, 'status_msg': 'fs_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	ret = {'success': True, 'bookmarks': fs['users']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
@myuser_login_required
def cmd_remove_bookmark_user(request):
	username = request.user.username
	
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('user') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	user = smart_unicode(request.REQUEST['user'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Remove the bookmark
	db.user_fs.update({'owner': username}, {'$pull': {'users': user}})
	
	release_fs(username, 0)

	log_msg = "%s :: user %s :: removed bookmarked user" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


@myuser_login_required
def cmd_set_tags(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('tag_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	taglist = smart_unicode(request.REQUEST['tag_list'], encoding='utf-8', strings_only=False, errors='strict')
	
	if taglist_not_valid(taglist):
		log_msg = "%s :: user %s :: bad_taglist_argument" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_taglist_argument'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	tags = list(set(taglist.rsplit('/')))
	
	#Lock the appropriate filesystem branch to insert new tags
	if  not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'op_failed_quota_exceeded'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
		
	#Push new tag ensuring uniquness - atomic operation
	db.fs.files.update( { '_id': doc_id , 'owner' : username, 'deleted': False},{ '$addToSet' : { 'tags' : { '$each' : tags } } })
	db.user_fs.update( { 'owner' : username},{ '$addToSet' : { 'tag_list' : { '$each' : tags } } })
	
	err = db.command({'getlasterror':1})
	
	release_fs(username,0)
	
	#Test if update succedded
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_add_tag" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_add_tag'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: tags set" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


	
@myuser_login_required
def cmd_get_tags(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not request.REQUEST.__contains__('doc_id'):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id})
	
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that user has file access
	if has_not_access(doc, username):
		log_msg = "%s :: user %s :: user cannot acess file" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: returned (%d) tags for doc" % (whoami(), username, len(doc['tags']))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'tag_list': doc['tags']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_remove_tags(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('tag_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	taglist = smart_unicode(request.REQUEST['tag_list'], encoding='utf-8', strings_only=False, errors='strict')
	
	if taglist_not_valid(taglist):
		log_msg = "%s :: user %s :: bad_taglist_argument" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'bad_taglist_argument'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	tags = list(set(taglist.rsplit('/')))
	
	# Remove tags
	db.fs.files.update({'owner': username, '_id': doc_id}, { '$pullAll' : { 'tags' :  tags  } })
		
	err = db.command({'getlasterror':1})
	
	#Test if update failed
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_remove_tag" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_remove_tag'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: tags removed" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Create tags - do not associate them with any documents
@myuser_login_required
def cmd_add_tags(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not ( request.REQUEST.__contains__('tag_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	taglist = smart_unicode(request.REQUEST['tag_list'], encoding='utf-8', strings_only=False, errors='strict')
	
	if taglist_not_valid(taglist):
		log_msg = "%s :: user %s :: bad_taglist_argument" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'bad_taglist_argument'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	tags = list(set(taglist.rsplit('/')))
	
	db.user_fs.update( { 'owner' : username},{ '$addToSet' : { 'tag_list' : { '$each' : tags } } })

	log_msg = "%s :: user %s :: created tags" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Delete tags and remove from all documents
@myuser_login_required
def cmd_delete_tags(request):
	username = request.user.username
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('tag_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	taglist = smart_unicode(request.REQUEST['tag_list'], encoding='utf-8', strings_only=False, errors='strict')
	
	if taglist_not_valid(taglist):
		log_msg = "%s :: user %s :: bad_taglist_argument" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'bad_taglist_argument'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	tags = list(set(taglist.rsplit('/')))
	
	#Lock the appropriate filesystem branch to insert new file
	if  not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_quota_exceeded'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	# Remove tags
	db.user_fs.update({'owner': username }, { '$pullAll' : { 'tag_list' :  tags  } })
	db.fs.files.update({'owner': username, 'tags': {'$in': tags} }, { '$pullAll' : { 'tags' :  tags  } })
	

	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: deleted tags" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
#Get tag list
@myuser_login_required
def cmd_get_tag_list(request):
	username = request.user.username
	
	fs =db.user_fs.find_one({'owner': username}, ['tag_list'])
	
	if not fs:
		log_msg = "%s :: user %s :: doc does not exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: returned (%d) tags" % (whoami(), username, len(fs['tag_list']))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'tag_list': fs['tag_list']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


@myuser_login_required
def cmd_rename(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('name')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	name = smart_unicode(request.REQUEST['name'], encoding='utf-8', strings_only=False, errors='strict')
		
	#Verify validity of doc_name
	if name_not_valid(name):
		log_msg = "%s :: user %s :: bad_document_name" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_document_name'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get document to be renamed
	doc = db.fs.files.find_one({'_id': doc_id, 'owner': username}, ['name', 'parent_id'])
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Ensure that user is not trying to rename home or trash folder
	if doc['parent_id'] == 'root':
		log_msg = "%s :: user %s :: cannot_rename_home_folder" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'cannot_rename_home_folder'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	db.fs.files.update({'_id': doc['_id']}, {'$set':{'name':name}})

	log_msg = "%s :: user %s :: renamed file/folder" % (whoami(), username)
	wfm_logger.debug(log_msg)
		
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


#Empty trash
@myuser_login_required
def cmd_empty_trash(request):
	username = request.user.username
	
	#Lock user's filesystem to ensure that documents are deleted in one step
	if not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	size = 0
	#Get documents in trash
	for deleted_doc in db.fs.files.find({'owner': username, 'deleted': True, 'parent_id': {'$ne': 'root'} }, ['length']):
		size += deleted_doc['length']
		db_gridfs.delete(deleted_doc['_id'])
	
	fs = db.user_fs.find_one({'owner': username}, ['trash_id'])
	size_propagation(username, fs['trash_id'], -size)
	release_fs(username, -size)

	log_msg = "%s :: user %s :: empty_trash" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
#Delete a document
@myuser_login_required
def cmd_delete(request):
	username = request.user.username
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id_list') and request.REQUEST.__contains__('perm')) :
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id_list =  list(set(smart_unicode(request.REQUEST['doc_id_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	permanent = smart_unicode(request.REQUEST['perm'], encoding='utf-8', strings_only=False, errors='strict') == '1'

	
	#Lock user's filesystem to ensure that documents are deleted in one step
	if not tsl(username, 0):
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	total_size = 0
	is_bookmarked = False
	for doc_id in doc_id_list:
		#Get root document of the deletion tree
		doc = db.fs.files.find_one({'owner': username, '_id': doc_id , 'parent_id': {'$ne': 'root' } }, ['parent_id', 'length', 'deleted', 'subtree_size', 'bookmarked'])
		if not doc:
			continue
		is_bookmarked = doc.__contains__('bookmarked') and doc[ 'bookmarked' ]
		size = doc['subtree_size']
		fs = db.user_fs.find_one({'owner': username}, ['trash_id'])
		
		#Permanent delete
		if doc['deleted'] or permanent:
			recursive_delete(username, doc_id, is_bookmarked)
			total_size += size
			size_propagation(username, fs['trash_id'], -size)

		#Else move to trash
		else:
			#Set root document's attributes
			db.fs.files.update({'owner': username, '_id': doc_id}, {'$set': {'parent_id': fs['trash_id'], 'old_parent_id': doc['parent_id']} })
			#Update document and subdocuments
			recursive_update_trash(username, doc_id, [{'$set': {'deleted': True, 'tags': [], 'public': {'users': [], 'groups': [] }, 'global_public' : False, 'bookmarked': False}}], is_bookmarked)
		
			size_propagation(username, fs['trash_id'], size)
			size_propagation(username, doc['parent_id'], -size)
	
	release_fs(username, -total_size)

	log_msg = "%s :: user %s :: deleted file/folder" % (whoami(), username)
	wfm_logger.debug(log_msg)

	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Delete subtree recursively
def recursive_delete(username, doc_id, bookmarked):
	db_gridfs.delete(doc_id)
	
	if bookmarked:
		#Remove the bookmark
		db.user_fs.update({'owner': username}, {'$pull': {'bookmarks': doc_id}})
		
	size = 0
	for doc_to_delete in db.fs.files.find({'parent_id': doc_id}, ['length', 'bookmarked']):
		size += doc_to_delete['length']
		size += recursive_delete(username, doc_to_delete['_id'], doc_to_delete['bookmarked'])
	
	return size


#Move to trash - apply multiple updates to the same document
def recursive_update_trash(username, doc_id, list_update, bookmarked):
	#Perform the document updates
	for doc_update in list_update:
		db.fs.files.update({ '_id': doc_id}, doc_update)
	
	if bookmarked:
		#Remove the bookmark
		db.user_fs.update({'owner': username}, {'$pull': {'bookmarks': doc_id}})
		
	#Recursion on subdocuments
	size = 0
	for doc_to_update in db.fs.files.find({'parent_id': doc_id}, ['length', 'bookmarked']):
		size += doc_to_update['length']
		size += recursive_update_trash(username, doc_to_update['_id'], list_update, doc_to_update['bookmarked'])
	
	return size	
	
	
#Update subtree recursively - apply multiple updates to the same document
def recursive_update(doc_id, list_update):
	#Perform the document updates
	for doc_update in list_update:
		db.fs.files.update({ '_id': doc_id}, doc_update)
	#Recursion on subdocuments
	size = 0
	for doc_to_update in db.fs.files.find({'parent_id': doc_id}, ['length']):
		size += doc_to_update['length']
		size += recursive_update(doc_to_update['_id'], list_update)
	
	return size	
	
#Update subtree recursively - apply multiple updates to the same document - exclude deleted files
def recursive_update_home(doc_id, list_update):
	#Perform the document updates
	for doc_update in list_update:
		db.fs.files.update({ '_id': doc_id, 'deleted': False}, doc_update)
	#Recursion on subdocuments
	size = 0
	for doc_to_update in db.fs.files.find({'parent_id': doc_id}, ['length']):
		size += doc_to_update['length']
		size += recursive_update(doc_to_update['_id'], list_update)
	
	return size	

@myuser_login_required
def cmd_restore(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not request.REQUEST.__contains__('doc_id'):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock user's filesystem to ensure that documents are restored in one step
	if not tsl(username, 0):
		release_fs(username, 0)
	
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document of the restoration tree
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'deleted': True}, ['old_parent_id', 'parent_id', 'length', 'subtree_size'])
		
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: document_not_found_or_not_deleted" % (whoami(), username)
		wfm_logger.error(log_msg)

		ret = {'success': False, 'status_msg': 'document_not_found_or_not_deleted'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Ensure that restoration folder exists
	dest = db.fs.files.find_one({'owner': username, '_id': doc['old_parent_id'], 'deleted': False }, ['public', 'global_public'])
	if not dest:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: could_not_restore_parent_folder_deleted" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_restore_parent_folder_deleted'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	#public
	public_users = []
	for public_user in dest['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in dest['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}
	
	#Restore document and subdocuments
	db.fs.files.update({'owner': username, '_id': doc_id}, {'$set': {'old_parent_id': '0', 'parent_id': dest['_id']}})
	recursive_update(doc_id, [{'$set': {'public': public, 'global_public': dest['global_public'], 'deleted': False}}])

	size_propagation(username, doc['parent_id'], -doc['subtree_size'])
	size_propagation(username, doc['old_parent_id'], doc['subtree_size'])
	release_fs(username, 0)

	log_msg = "%s :: user %s :: restored file/folder" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_move(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('dest_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	dest_id = smart_unicode(request.REQUEST['dest_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock user's filesystem to ensure that documents are moved in one step
	if not tsl(username, 0):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannnot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document of the move tree
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id}, ['parent_id', 'length', 'subtree_size'])
	dest = db.fs.files.find_one({'owner': username, '_id': dest_id, 'deleted': False}, ['parent_id', 'public', 'name', 'global_public'])
		
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: source_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'source_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	if not dest:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: destination_not_found_or_in_trash" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'destination_not_found_or_in_trash'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Not move trash or home doc, not create cycles
	if doc['parent_id'] == 'root' or determine_cycle(username, dest_id, dest['parent_id'], doc_id):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot_move_document" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'cannot_move_document'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#public
	public_users = []
	for public_user in dest['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in dest['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}
	
	#Set root document's new parent
	db.fs.files.update({'owner': username, '_id': doc_id}, {'$set': {'parent_id': dest['_id']}})
	#Update document and subdocuments
	recursive_update(doc_id, [{'$set': {'public': public, 'global_public': dest['global_public'], 'deleted': False}}])
	
	size_propagation(username, doc['parent_id'], -doc['subtree_size'])
	size_propagation(username, dest_id, doc['subtree_size'])
	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: moved doc/file" % (whoami(), username)
	wfm_logger.error(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

# Determines whether search_id indicates subdocument of current_id (O(logn) implementation)
def determine_cycle(username, current_id, parent_id, search_id):
	if current_id == search_id:
		return True
	else:
		parent = db.fs.files.find_one({'owner': username, '_id': parent_id}, ['parent_id'])
		if parent:
			return determine_cycle(username,  parent_id, parent['parent_id'], search_id)
		else:
			return False
	

@myuser_login_required
def cmd_copy(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('dest_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	dest_id = smart_unicode(request.REQUEST['dest_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	
	#Get document to be copied
	doc = db.fs.files.find_one({'_id': doc_id}, ['parent_id', 'length', 'public', 'global_public', 'owner', 'subtree_size'])
	#Test if document copy is permitted
	if not doc or has_not_access(doc, username):
		log_msg = "%s :: user %s :: source_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'source_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	if doc['owner'] == username:
		return home_copy(username, doc_id, dest_id)
	elif not has_not_access(doc, username):
		time.sleep(3)
		return public_copy(username, doc['owner'], doc_id, dest_id)
	else:
		log_msg = "%s :: user %s :: destination_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'destination_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
def home_copy(username, doc_id, dest_id):
	
	#Lock user's filesystem to ensure that documents are copied in one step
	if not tsl(username, 0):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	
	#Get root document of the copy tree
	doc = db.fs.files.find_one({'owner':username,  '_id': doc_id}, ['parent_id', 'length', 'public', 'global_public', 'subtree_size'])
	dest = db.fs.files.find_one({'owner':username,  '_id': dest_id, 'deleted': False}, ['parent_id', 'public', 'name', 'global_public'])
	
	if not (dest and doc):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: destination_not_found_or_in_trash" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'destination_not_found_or_in_trash'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	size = doc['subtree_size']
	
	#Determine if free space suffices
	fs = db.user_fs.find_one({'owner': username}, ['quota', 'used_space'])
	if not fs or fs['used_space'] > fs['quota']-size:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: not_enough_user_space" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'not_enough_user_space'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	#Not copy to trash, not copy trash or home doc, not create cycles
	if doc['parent_id'] == 'root' or determine_cycle(username, dest_id, dest['parent_id'], doc_id):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannot_copy_document" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'cannot_copy_document'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#public
	public_users = []
	for public_user in dest['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in dest['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}
	

	#Recursive copy - Recursion must not involve bin data
	new_id = recursive_copy(username, doc_id, dest_id, public, dest['global_public'])
	
	size_propagation(username, dest_id, size)
	release_fs(username, size)

	log_msg = "%s :: user %s :: copied file/folder" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'doc_id': new_id}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
def public_copy(username, user, doc_id, dest_id):
	
	#Lock user's filesystem to ensure that documents are copied in one step
	if not (tsl(username, 0) and tsl(user, 0)):
		release_fs(username, 0)
		release_fs(user, 0)
		
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	
	#Get root document of the copy tree
	doc = db.fs.files.find_one({'owner':user,  '_id': doc_id}, ['parent_id', 'length', 'public', 'global_public'])
	dest = db.fs.files.find_one({'owner':username,  '_id': dest_id, 'deleted': False}, ['parent_id', 'public', 'name', 'global_public'])	
	
	if not (dest and doc):
		release_fs(username, 0)
		release_fs(user, 0)

		log_msg = "%s :: user %s :: destination_not_found_or_in_trash" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'destination_not_found_or_in_trash'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	size = doc['length']
	size += determine_public_size(username, user, doc_id, get_group_ids(username, user))
	
	
	#Determine if free space suffices
	fs = db.user_fs.find_one({'owner': username}, ['quota', 'used_space'])
	if not fs or fs['used_space'] > fs['quota']-size:
		release_fs(username, 0)
		release_fs(user, 0)

		log_msg = "%s :: user %s :: not_enough_user_space" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'not_enough_user_space'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	
	#Not copy to trash, not copy trash or home doc, not create cycles
	if doc['parent_id'] == 'root':
		release_fs(username, 0)
		release_fs(user, 0)

		log_msg = "%s :: user %s :: cannot_copy_document" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'cannot_copy_document'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#public
	public_users = []
	for public_user in dest['public']['users']:
		public_user['published'] = False
		public_users.append(public_user)
	
	public_groups = []
	for public_group in dest['public']['groups']:
		public_group['published'] = False
		public_groups.append(public_group)
	
	public = {'users': public_users, 'groups': public_groups}

	#Recursive copy - source may not belong to username
	#Recursion must not involve bin data
	new_id = recursive_copy(username, doc_id, dest_id, public, dest['global_public'])
	
	size_propagation(username, dest_id, size)
	compute_space(dest_id)
	
	release_fs(user, 0)
	release_fs(username, size)	

	log_msg = "%s :: user %s :: copied doc from public" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'doc_id': new_id}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
#Copy doc to dest
#Each document is visited twice. Better this than passing bin_data as an argument
#Should be slightly changed under mongo v 1.6
def recursive_copy(username, doc_id, dest_id, public, glob):
	#Get document to be copied
	doc = db.fs.files.find_one({'_id': doc_id})

	#Insert copy of document
	_id = 'd' + uuid4().hex
	
	if doc.has_key('thumbnail'):		
		new_doc = db_gridfs.new_file(_id = _id, parent_id = dest_id, public = public, global_public = glob, deleted = False, owner = username, type = doc['type'], content_type = doc['contentType'], name = doc['name'], tags = [], old_parent_id = '0', thumbnail = doc['thumbnail'], subtree_size = doc['subtree_size'], bookmarked = False )
	
	else:
		new_doc = db_gridfs.new_file(_id = _id, parent_id = dest_id, public = public, global_public = glob, deleted = False, owner = username, type = doc['type'], content_type = doc['contentType'], name = doc['name'], tags = [], old_parent_id = '0', subtree_size = doc['subtree_size'], bookmarked = False )
	
	#Write in chunks
	for chunk in read_in_chunks(db_gridfs.get(doc_id)):
		new_doc.write(chunk)
		
	new_doc.close()
	
	for doc_to_copy in db.fs.files.find({'parent_id': doc_id}, ['owner', 'public', 'global_public']):
		#Only those documents that are accessible
		if not has_not_access(doc_to_copy, username):
			recursive_copy(username, doc_to_copy['_id'], _id, public, glob)

	return _id


@myuser_login_required
def cmd_share_doc_user(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('user')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	user = smart_unicode(request.REQUEST['user'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Ensure that user exists in the filesystem
	if not db.user_fs.find_one({'owner': user}):
		if not register_user(user):
			log_msg = "%s :: user %s :: user_not_found" % (whoami(), username)
			wfm_logger.error(log_msg)
			
			ret = {'success': False, 'status_msg': 'user_not_found'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document - must not be already shared
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'deleted': False, 'public.users': {'$not': {'$elemMatch': {'username': user}}}}, [])
		
	#Document not existing
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: document_not_found_or_not_able_to_share" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'document_not_found_or_not_able_to_share'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	#Share the root document
	db.fs.files.update({'owner': username, '_id': doc_id}, {'$push': {'public.users': {'username': user, 'published': True}}})

	# add a notification on the recipier's notification queue
	create_notification([user], username, doc_id)
	
	#Recursively share subdocuments
	for subdoc in db.fs.files.find({'owner': username, 'parent_id': doc_id}):
		recursive_update(subdoc['_id'], [{'$pull':{'public.users':{'username': user}}}, {'$push': {'public.users': {'username': user, 'published': False}}}] )
		
	release_fs(username, 0)

	log_msg = "%s :: user %s :: document shared to user" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	

@myuser_login_required
def cmd_share_doc_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('group_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Ensure that user exists in the filesystem
	if not db.groups.find_one({'owner': username, '_id': group_id }):
		log_msg = "%s :: user %s :: group_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'group_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document - must not be already shared
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'deleted': False, 'public.groups': {'$not': {'$elemMatch': {'group_id': group_id}}}}, [])
		
	#Document not existing
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: document_not_found_or_not_able_to_share" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'document_not_found_or_not_able_to_share'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
	#Share the root document
	db.fs.files.update({'owner': username, '_id': doc_id}, {'$push': {'public.groups': {'group_id': group_id, 'published': True}}})
	
	#Recursively share subdocuments
	for subdoc in db.fs.files.find({'owner': username, 'parent_id': doc_id}):
		recursive_update(subdoc['_id'], [{'$pull':{'public.groups':{'group_id': group_id}}}, {'$push': {'public.groups': {'group_id': group_id, 'published': False}}}] )
		
	release_fs(username, 0)

	# get users in group
	try:
		user = db.groups.find_one({'_id': group_id}, ['users'])['users']
	except:
		user = []

	# add a notification on the recipier's notification queue
	create_notification(user, username, doc_id)

	log_msg = "%s :: user %s :: document shared to group" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_unshare_doc_user(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('user')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	user =smart_unicode(request.REQUEST['user'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document if shared
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'public.users.username': user}, [])
	
	#Document not existing or not shared
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: document_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'document_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Unshare root document and subdocuments
	recursive_update(doc_id,  [{'$pull': {'public.users': {'username': user}}}])

	release_fs(username, 0)
	
	log_msg = "%s :: user %s :: doc unshared from user" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

@myuser_login_required
def cmd_unshare_doc_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('group_id')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Get root document if shared
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'public.groups.group_id': group_id}, [])
	
	#Document not existing or not shared
	if not doc:
		release_fs(username, 0)

		log_msg = "%s :: user %s :: document_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'document_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Unshare root document and subdocuments
	recursive_update(doc_id, [{'$pull': {'public.groups': {'group_id': group_id}}}])

	# get users in group
	try:
		users = db.groups.find_one({'_id': group_id}, ['users'])['users']
	except:
		users = []

	release_fs(username, 0)

	log_msg = "%s :: user %s :: doc unshared from group" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

@myuser_login_required
def cmd_tree(request):
	username = request.user.username
	fs = db.user_fs.find_one({'owner': username}, ['home_id', 'trash_id', 'quota', 'used_space'])
	#Build home schema
	home = build_home(username, fs['home_id'])
	#Build trash schema
	trash = build_trash(username, fs['trash_id'])
	#Build public schema
	public = build_public(username)
	#Build shared schema
	shared = build_shared(username)
	#Build tags schema
	tags = build_tags(username)
	#Build bookmarks
	bookmarks = build_bookmarks(username)

	log_msg = "%s :: user %s :: returned tree" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	tree = {'node': {'type': 'root', '_id': 'root', 'name': 'root'}, 'children': [home, trash, public, shared, tags, bookmarks]}
	ret = {'success': True, 'tree': tree, 'quota': fs['quota'], 'used_space': fs['used_space'] }
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


def build_bookmarks(username):
	fs = db.user_fs.find_one({'owner': username}, ['bookmarks', 'users'])
	
	if not fs:
		return {}
	bookmarks = []
	for doc in db.fs.files.find({'_id': {'$in': fs['bookmarks'] }},['name', 'type'] ):
		bookmarks.append({'node': doc, 'children': []})
	
	for user in fs['users']:
		bookmarks.append({'node': {'_id': 'user', 'name': user, 'type': 'user'} , 'children': []})
	
	return {'node': {'_id': 'bookmarks', 'name': 'bookmarks', 'type': 'schema'}, 'children': bookmarks }
		

def build_tags(username):
	
	fs = db.user_fs.find_one({'owner': username}, ['tag_list'])
	if not fs:
		return {}
		
	children = []
	for tag in fs['tag_list']:
		children.append({'node': {'_id': 'tag', 'type': 'tag', 'name': tag }, 'children': [] })
		
	return {'node': {'_id': 'tags', 'name': 'tags', 'type': 'schema'}, 'children': children }
	
def build_home(username, home_id):
	return {'node': {'_id': home_id, 'name': 'home', 'type': 'schema'} , 'children': build_contents(home_id)}

def build_trash(username, trash_id):
	return {'node': {'_id': trash_id, 'name': 'trash', 'type': 'schema'}, 'children': build_contents(trash_id)}
	
#Get a list of documents that are published from owner to user - to change after mongodb v1.6
def get_published_docs(user, owner, group_ids, field_list):
	docs = []
	#User public
	for doc in db.fs.files.find( {'owner': owner, 'public.users' : { '$elemMatch' : { 'username' : user, 'published' : True}}}, field_list ):
		docs.append(doc)
	
	for doc in db.fs.files.find( {'owner': owner, 'public.groups' : { '$elemMatch' : { 'group_id' : {'$in': group_ids} , 'published' : True}}}, field_list):
		docs.append(doc)

	log_msg = "%s :: user %s :: doclist: %s" % (whoami(), owner, docs)
	wfm_logger.debug(log_msg)

	return unique(docs)
	
#Get a list of folders that are published from owner to user - to change after mongodb v1.6
def get_published_folders(user, owner, group_ids, field_list):
	docs = []
	#User public
	for doc in db.fs.files.find( {'owner': owner, 'public.users' : { '$elemMatch' : { 'username' : user, 'published' : True}}, 'type': 'folder'}, field_list ):
		docs.append(doc)
	
	for doc in db.fs.files.find( {'owner': owner, 'public.groups' : { '$elemMatch' : { 'group_id' : {'$in': group_ids} , 'published' : True}}, 'type': 'folder'}, field_list):
		docs.append(doc)
	
	log_msg = "%s :: user %s :: doclist: %s" % (whoami(), owner, docs)
	wfm_logger.debug(log_msg)

	return unique(docs)


def build_public(username):
	return {'node': {'type': 'schema', 'name': 'public', '_id': 'public'}, 'children': []}
	
#def build_public(username):
	#contents = []
	#users = []
	#for user in get_public_users(username):
		#user_contents = []
		#subtree = []
		#group_ids = get_group_ids(username, user)
		#for published_doc in get_published_folders(username, user, group_ids, ['type', 'name']):
			#subtree = build_public_contents(username, published_doc['_id'], group_ids)
			#user_contents.append({'node': published_doc, 'children': subtree})
		#contents.append({'node': {'name': user, '_id': 'user', 'type': 'user'}, 'children': user_contents})
		
	#return {'node': {'type': 'schema', 'name': 'public', '_id': 'public'}, 'children': contents}

def build_shared(username):
	contents = [{'node': {'type': 'folder', 'name': 'users', '_id': 'users'}, 'children': []}, {'node': {'type': 'folder', 'name': 'groups', '_id': 'groups'}, 'children': []} ]
	return {'node': {'type': 'schema', 'name': 'shared', '_id': 'shared'}, 'children': contents}
	
#def build_shared(username):
	#contents = [{'node': {'type': 'folder', 'name': 'users', '_id': 'users'}, 'children': []}, {'node': {'type': 'folder', 'name': 'groups', '_id': 'groups'}, 'children': []} ]

	##shared/users
	#for user in get_shared_users(username):
		#user_contents = []
		#subtree = []
		#group_ids = get_group_ids(user, username)
		#for shared_doc in get_published_folders(user, username, group_ids, ['name', 'type']):
			#subtree = build_user_shared_contents(user, shared_doc['_id'], group_ids)
			#user_contents.append({'node': shared_doc, 'children': subtree})
		#contents[0]['children'].append({'node': {'name': user, '_id': 'user', 'type': 'user'}, 'children': user_contents})
		
	##shared/groups
	#for group in db.groups.find({'owner': username}, ['group_name']):
		#group_contents = []
		#subtree = []
		#for shared_doc in db.fs.files.find({'owner': username, 'public.groups' : { '$elemMatch' : { 'group_id' : group['_id'], 'published' : True}}, 'type': 'folder'},['type', 'name', 'owner']):
			#subtree = build_group_shared_contents(group['_id'], shared_doc['_id'])
			#group_contents.append({'node': shared_doc, 'children': subtree})
		#contents[1]['children'].append({'node': {'name': group['group_name'], '_id': group['_id'], 'type': 'group'}, 'children': group_contents})
		
	#return {'node': {'type': 'schema', 'name': 'shared', '_id': 'shared'}, 'children': contents}
	

#For home and trash - folders only
def build_contents(parent_id):
	contents = []
	subtree = []
	for doc in db.fs.files.find({'parent_id': parent_id, 'type': 'folder'}, ['name', 'type']):
		subtree = build_contents(doc['_id'])
		contents.append({'node': doc, 'children': subtree})
	
	return contents

#Public contents through user or  group or global sharing
def build_public_contents(username, parent_id, group_ids):
	children = []
	subtree = []
	for child in public_access_docs(username, {'parent_id': parent_id, 'type': 'folder'}, ['type', 'name'], group_ids):
		subtree = build_public_contents(username, child['_id'], group_ids)
		children.append({'node': child, 'children': subtree})
	return children
	
#Shared contents through user or group sharing
def build_user_shared_contents(username, parent_id, group_ids):
	return build_public_contents(username, parent_id, group_ids)

# Shared contents through group sharing only (no global)
def build_group_shared_contents(group_id, parent_id):
	children = []
	subtree = []
	for child in db.fs.files.find({'parent_id': parent_id, 'type': 'folder', 'public.groups.group_id': group_id}, ['type', 'name']):
		subtree = build_group_shared_contents(group_id, child['_id'])
		children.append({'node': child, 'children': subtree})
	return children


#Re-compute used space
@myuser_login_required
def cmd_compute_space(request):
	username = request.user.username
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)

		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	fs = db.user_fs.find_one({'owner': username}, ['home_id', 'trash_id'])
	space = compute_space(fs['home_id'])
	space += compute_space(fs['trash_id'])
	db.user_fs.update({'owner': username}, {'$set': {'used_space': space}})
	
	release_fs(username, 0)

	log_msg = "%s :: user %s :: success computing space" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True }
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Compute the size of document doc_id and subdocuments
def compute_space(doc_id):
	space = 0
	for doc in db.fs.files.find({'parent_id': doc_id},['length', 'type']):
		if doc['type'] == 'file':
			space += doc['length']
		else:
			space += compute_space(doc['_id'])
	
	#Update document size
	db.fs.files.update({'_id': doc_id}, { '$set': {'subtree_size': space}})
	return space
		

#Set or unset global documents
@myuser_login_required
def cmd_set_global(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id_list') and request.REQUEST.__contains__('glob') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id_list =  list(set(smart_unicode(request.REQUEST['doc_id_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	flag = smart_unicode(request.REQUEST['glob'], encoding='utf-8', strings_only=False, errors='strict') == '1'
	
	#Lock user's filesystem to ensure that documents are updated in one step
	if not tsl(username, 0):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	fail_list = []
	#Set public access to documents
	for doc_id in doc_id_list:
		# check document access and that it exists
		doc = db.fs.files.find_one({'owner': username, '_id': doc_id})
		if doc is None:
			fail_list.append(doc_id)
			continue
		recursive_update_home(doc_id, [{'$set': {'global_public': flag }}])
	
	release_fs(username, 0)

	log_msg = "%s :: user %s :: updated global doc status" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	if len(fail_list) == len(doc_id_list):
		ret = {'success': False, 'failed_ids': fail_list}
	else:
		ret = {'success': True, 'failed_ids': fail_list}

	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


@myuser_login_required
def cmd_ls(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('path') and request.REQUEST.__contains__('group_id')):
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	path = smart_unicode(request.REQUEST['path'], encoding='utf-8', strings_only=False, errors='strict')
	
	
	#Determine schema
	schema_ls = {'public': public_ls, 'shared': shared_ls, 'root': root_ls, 'users': users_ls, 'groups': groups_ls, 'tags': tags_ls, 'bookmarks': bookmarks_ls}
	pathlist = path.rsplit('/')
	#if True:
	try:
		if doc_id in schema_ls:
			#Ls in top structure documents
			ret = schema_ls[doc_id](username)
		elif doc_id == 'tag':
			#LS in tag folder
			ret = tag_ls(username, pathlist[2:], path)
		#Ls in user folder, public or shared?
		elif doc_id == 'user':
			user_ls = {'public': user_public_ls, 'shared': user_shared_ls}
			#User public or user shared?	
			if pathlist[1] == 'public' or pathlist[1] == 'bookmarks':
				#ret = user_public_ls(username, pathlist[2])
				# debug
				log_msg = "%s :: user %s :: will run user_shared_ls" % (whoami(), username)
				wfm_logger.debug(log_msg)

				ret = user_public_ls_mininal(username, pathlist[2])
			elif pathlist[1] == 'shared':
				# debug
				log_msg = "%s :: user %s :: will run user_shared_ls" % (whoami(), username)
				wfm_logger.debug(log_msg)

				ret = user_shared_ls(username, pathlist[3])
		else:
			#Ls in document, determine if it is group or file document
			if doc_id[0] == 'g':
				#Ls on group folder
				ret = group_shared_ls(username, doc_id)	
			else:
				#Regular ls on document - Determine schema
				if pathlist[1] == 'home' or pathlist[1] == 'bookmarks' or pathlist[1] == 'trash':
					ret = document_ls_home(username, doc_id)
				elif pathlist[1] == 'public':
					ret = document_ls_public(username, doc_id)
				elif pathlist[1] == 'shared' and pathlist[2] == 'users':
					ret = document_ls_shared_users(username, pathlist[3], doc_id)
				elif pathlist[1] == 'shared' and pathlist[2] == 'groups':
					ret = document_ls_shared_groups(username, group_id, doc_id)
				else:
					ret = {'success':False, 'status_msg': 'invalid_ls'}
	except:
		e = sys.exc_info()[1]
		log_msg = "%s :: user %s :: CMD_LS EXCEPTION %s" % (whoami(), username, e)
		wfm_logger.error(log_msg)
	#	ret = {'success': False, 'status_msg': 'bad_parameters'}
	#	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		ret = {'success':False, 'status_msg': 'unhandled_cmd_ls_exception'}

	log_msg = "%s :: user %s :: run ls command for doc_id=%s" % (whoami(), username, doc_id)
	wfm_logger.debug(log_msg)
	
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#root/bookmarks:
def bookmarks_ls(username):
	fs = db.user_fs.find_one({'owner': username}, ['bookmarks', 'users'])

	contents = []
	for doc in db.fs.files.find({'_id': {'$in': fs['bookmarks'] }},['name', 'type', 'subtree_size', 'tags'] ):
		doc['length'] = doc['subtree_size']
		del doc['subtree_size']
		contents.append(doc)
	
	for user in fs['users']:
		contents.append({'_id': 'user', 'name': user, 'type': 'user', 'length': 0, 'tags': []})
	
	return {'success': True, 'ls': {'name': 'bookmarks', 'type': 'schema', '_id': 'bookmarks', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []} , 'global_public': False, 'contents': contents }}
	
#root/tags
def tags_ls(username):
	
	fs = db.user_fs.find_one({'owner': username}, ['tag_list'])
	contents = []
	for tag in fs['tag_list']:
		contents.append({'type': 'tag', 'name': tag, 'length': 0, '_id': tag, 'tags': []})
	
	return {'success': True, 'ls': {'name': 'tags', 'type': 'schema', '_id': 'tags', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []} , 'global_public': False, 'contents': contents }}

#root/tags/tag
def tag_ls(username, tag_list, path):
	
	contents = []
	for doc in db.fs.files.find({'owner': username, 'tags':  {'$all': tag_list}}, ['name', 'type', 'tags']):
		contents.append(doc)
	
	return {'success': True, 'ls': {'name': path, 'type': 'tag', '_id': 'tag', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []} , 'global_public': False, 'contents': contents }}
	

#root/public
def public_ls(username):
	contents = []
	total_size = 0
	#Build public contents
	for user in get_public_users(username):
		contents.append({'type': 'user', 'length': 0, '_id': 'user', 'name': user})		
	
	return {'success': True, 'ls': {'name': 'public', 'type': 'schema', '_id': 'public', 'length': total_size, 'tags': [], 'public': {'users': [], 'groups': []} , 'global_public': False, 'contents': contents }}


#root/shared
def shared_ls(username):
	return {'success': True, 'ls': {'name': 'shared', 'type': 'schema', 'length': 0,  '_id': 'shared', 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': [{'type': 'folder', '_id': 'groups', 'name': 'groups'}, {'type': 'folder', '_id': 'users', 'name': 'users'}] }}
	
	
#root/shared/users
def users_ls(username):
	contents = []
	total_size = 0
	for user in get_shared_users(username):
		contents.append({'type': 'user', '_id': 'user', 'length': 0, 'name': user})	
			
	return {'success': True, 'ls': {'name': 'users', 'type': 'folder', 'length': 0, '_id': 'users', 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }}
	
#root/shared/groups
def groups_ls(username):
	contents = []
	total_size = 0
	for group in db.groups.find({'owner': username}, ['group_name']):
		contents.append({'type': 'group', '_id': group['_id'], 'length': 0, 'name': group['group_name']})

	# Append Special Groups: School, Class and Division
	for group in get_special_groups(username):
		contents.append({'type': 'group', '_id': group['_id'], 'length': 0, 'name': group['group_name']})

	return {'success': True, 'ls': {'name': 'groups', 'type': 'folder', 'length': 0, '_id': 'groups', 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }}
	
#root
def root_ls(username):
	fs = db.user_fs.find_one({'owner': username}, ['home_id', 'trash_id'])
	home = db.fs.files.find_one({'_id': fs['home_id']}, ['name', 'type', 'length', 'tags'])
	trash = db.fs.files.find_one({'_id': fs['trash_id']}, ['name', 'type', 'length', 'tags'])
	contents = [home, trash, {'type': 'schema', 'name': 'public', 'length': 0, '_id': 'public', 'tags': []},{'type': 'schema', 'name': 'shared', 'length': 0, '_id': 'shared', 'tags': []}]
	return {'success': True, 'ls': {'name': 'root', 'type': 'root', '_id': 'root', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }}

#root/public/user
def user_public_ls(username, user):
	contents = []
	group_ids = get_group_ids(username, user)
	for doc in get_published_docs(username, user, group_ids, ['length', 'name', 'type', 'tags']):
		size = doc['length']
		size += determine_public_size(username, user, doc['_id'], group_ids)
		doc['length'] = size
		contents.append(doc)
	
	if contents:
		log_msg = "%s :: user %s :: returned content OK" % (whoami(), username)
		wfm_logger.debug(log_msg)
		return {'success': True, 'ls': {'name': user, 'type': 'folder', '_id': 'user', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }} 
	else:
		log_msg = "%s :: user %s :: no content for user: %s :: group_ids (%d)" % (whoami(), username, user, len(group_ids))
		wfm_logger.debug(log_msg)
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}


#root/public/user
def user_public_ls_mininal(username, user):
	contents = []
	group_ids = get_group_ids(username, user)
	for doc in get_published_docs(username, user, group_ids, ['length', 'name', 'type', 'tags']):
		#size = doc['length']
		#size += determine_public_size(username, user, doc['_id'], group_ids)
		#doc['length'] = size
		contents.append(doc)
	
	if contents:
		log_msg = "%s :: user %s :: returned content OK" % (whoami(), username)
		wfm_logger.debug(log_msg)
		return {'success': True, 'ls': {'name': user, 'type': 'folder', '_id': 'user', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }} 
	else:
		log_msg = "%s :: user %s :: no content for user: %s :: group_ids (%d)" % (whoami(), username, user, len(group_ids))
		wfm_logger.debug(log_msg)
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}


#root/shared/users/user
def user_shared_ls(username, user):
	contents = []
	group_ids = get_group_ids(user, username)
	# debug
	log_msg = "%s :: user %s :: returned group_ids %s" % (whoami(), username, group_ids)
	wfm_logger.debug(log_msg)

	for doc in get_published_docs(user, username, group_ids, ['name', 'type' ,'tags', 'length']):
		size = doc['length']
		size += determine_public_size(user, username, doc['_id'], group_ids)
		doc['length'] = size
		contents.append(doc)
	
	if contents:
		log_msg = "%s :: user %s :: returned content OK" % (whoami(), username)
		wfm_logger.debug(log_msg)
		return {'success': True, 'ls': {'name': user, 'type': 'folder', '_id': 'user', 'length': 0, 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }} 
	else:
		log_msg = "%s :: user %s :: no content for user: %s :: group_ids (%d)" % (whoami(), username, user, len(group_ids))
		wfm_logger.debug(log_msg)
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
		
#root/shared/groups/group_id
def group_shared_ls(username, group_id):
	group = db.groups.find_one({'_id': group_id}, ['group_name'])
	if not group:
		#Group not found
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
		
	contents = []
	for doc in db.fs.files.find({'owner': username, 'public.groups': { '$elemMatch' : { 'group_id' : group_id, 'published' : True}} }, ['name', 'type', 'tags']):
		doc['length'] = 0
		contents.append(doc)
	
	group = db.groups.find_one({'_id': group_id}, ['group_name'])
	return {'success': True, 'ls': {'name': group['group_name'], 'type': 'folder', 'length': 0, '_id': group_id, 'tags': [], 'public': {'users': [], 'groups': []}, 'global_public': False, 'contents': contents }} 


#Document ls in home schema
def document_ls_home(username, doc_id):
	doc = db.fs.files.find_one({ '_id': doc_id, 'owner': username}, ['name', 'length', 'type', 'public', 'tags', 'global_public', 'subtree_size','bookmarked' ])
	
	if not doc:
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
		
	contents = []
	doc['length'] = doc['subtree_size']
	del doc['subtree_size']
	
	for subdoc in db.fs.files.find({'parent_id': doc_id}, ['name', 'length', 'type', 'public', 'global_public', 'subtree_size', 'tags', 'bookmarked']):
		subdoc['length'] = subdoc['subtree_size']
		del subdoc['subtree_size']
		contents.append(subdoc)
	doc['contents'] = contents
	return {'success': True, 'ls': doc}
	
	
#Document ls in shared/users schema
def document_ls_shared_users(username, user, doc_id):
	group_ids = get_group_ids(user, username)
	
	temp = public_access_docs(user,  {'_id': doc_id}, ['name', 'length', 'type', 'public', 'tags', 'global_public','bookmarked' ], group_ids)
		
	try:
		doc = temp.next()
	except:
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
		
	contents = []
	size = 0
	
	for subdoc in public_access_docs(user,  {'parent_id': doc_id}, ['name', 'length', 'type', 'public', 'tags', 'global_public','bookmarked' ], group_ids):
		sub_size = determine_public_size(user, username, subdoc['_id'], group_ids )
		sub_size += subdoc['length']
		size += sub_size
		subdoc['length'] = sub_size
		contents.append(subdoc)
	doc['contents'] = contents
	doc['length'] = size
	return {'success': True, 'ls': doc}
	

#Document ls in shared/groups schema
def document_ls_shared_groups(username, group_id, doc_id):
	doc = db.fs.files.find_one({ '_id': doc_id, 'owner': username, 'public.groups.group_id': group_id}, ['name', 'length', 'type', 'public', 'tags', 'global_public','bookmarked' ])
	
	if not doc:
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
	
	contents = []
	size = 0
	
	for subdoc in db.fs.files.find({'parent_id': doc_id, 'public.groups.group_id': group_id }, ['name', 'length', 'type', 'public', 'tags' 'global_public', 'bookmarked']):
		sub_size = determine_group_shared_size(group_id, subdoc['_id'])
		sub_size += subdoc['length']
		size += sub_size
		subdoc['length'] = sub_size
		contents.append(subdoc)
	doc['contents'] = contents
	doc['length'] = size
	return {'success': True, 'ls': doc}
	

#Document ls in public schema
def document_ls_public(username, doc_id):

	try_doc = db.fs.files.find_one({ '_id': doc_id}, ['owner'])
	
	if not try_doc:
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
	
	user = try_doc['owner']
	group_ids = get_group_ids(username, user)
	temp = public_access_docs(username,  {'_id': doc_id}, ['name', 'length', 'type'], group_ids)
	
	try:
		doc = temp.next()
	except:
		return {'success': False, 'status_msg': 'document_not_found', 'ls': {}}
	
	contents = []
	size = 0
	
	for subdoc in public_access_docs(username,  {'parent_id': doc_id}, ['name', 'length', 'type'], group_ids):
		sub_size = determine_public_size(username, user, subdoc['_id'], group_ids )
		sub_size += subdoc['length']
		size += sub_size
		subdoc['length'] = sub_size
		contents.append(subdoc)
	doc['contents'] = contents
	doc['length'] = size
	return {'success': True, 'ls': doc}
	
		
#Create a custom user group
#Allow group name collisions
@myuser_login_required
def cmd_create_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_name') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_name = smart_unicode(request.REQUEST['group_name'], encoding='utf-8', strings_only=False, errors='strict')
	if name_not_valid(group_name):
		log_msg = "%s :: user %s :: group_name_not_valid" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'group_name_not_valid'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	group_exists = db.groups.find_one( { 'owner': username, 'group_name': group_name } )
	if group_exists:
		log_msg = "%s :: user %s :: grout already exists" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'group_exists'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = 'g' + uuid4().hex
	group = {'owner': username, '_id': group_id, 'group_name': group_name, 'users': []}
	db.groups.insert(group)

	log_msg = "%s :: user %s :: created group %s" % (whoami(), username, group_name)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'group_id': group_id ,'name': group_name}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	
#Remove a custom user group - unshare all documents shared to that group
@myuser_login_required
def cmd_delete_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	if not tsl(username, 0):
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'op_failed_try_again'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	#Unshare all documents shared to that group
	db.fs.files.update({'owner': username, 'public.groups.group_id': group_id}, {'$pull': {'public.groups': {'group_id': group_id} } })
	
	db.groups.remove({'owner': username, '_id': group_id})

	release_fs(username, 0)

	log_msg = "%s :: user %s :: deleted group" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
#Insert a list of users in a group
#user list delimiter is '/'
@myuser_login_required
def cmd_add_to_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') and request.REQUEST.__contains__('user_list') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	users = list(set(smart_unicode(request.REQUEST['user_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	
	#Verify that users exist in the filesystem
	for user in users:
		if not db.user_fs.find_one({'owner': user}, []):
			if not register_user(user):
				log_msg = "%s :: user %s :: user_not_found" % (whoami(), username)
				wfm_logger.error(log_msg)
				
				ret = {'success': False, 'status_msg': 'user_not_found'}
				return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	# Add users to group
	db.groups.update({'owner': username, '_id': group_id}, { '$addToSet' : { 'users' : { '$each' : users } } })
	
	err = db.command({'getlasterror':1})
	
	#Test if update succedded
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_add_users_to_group" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_add_users_to_group'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: add user(s) to group" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

#Remove a list of users from a group
#user list delimiter is '/'
@myuser_login_required
def cmd_remove_from_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') and request.REQUEST.__contains__('user_list') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	users = list(set(smart_unicode(request.REQUEST['user_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	
	# Remove users from group
	db.groups.update({'owner': username, '_id': group_id}, { '$pullAll' : { 'users' :  users  } })
	
	err = db.command({'getlasterror':1})
	
	#Test if update succedded
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_remove_users_from_group" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'could_not_remove_users_from_group'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: removed user(s) from group" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

#Include a group to another
@myuser_login_required
def cmd_include_group(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') and request.REQUEST.__contains__('subgroup_id') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	subgroup_id = smart_unicode(request.REQUEST['subgroup_id'], encoding='utf-8', strings_only=False, errors='strict')
	
	subgroup = db.groups.find_one({'owner': username, '_id': subgroup_id}, ['users'])
	
	if not subgroup:
		log_msg = "%s :: user %s :: group_not_found" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'group_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	# Add users to group
	db.groups.update({'owner': username, '_id': group_id}, { '$addToSet' : { 'users' : { '$each' : subgroup['users'] } } })
	
	err = db.command({'getlasterror':1})
	
	#Test if update succedded
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_add_users_to_group" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'could_not_add_users_to_group'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: merged groups" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

#Rename a group
@myuser_login_required
def cmd_group_rename(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') and request.REQUEST.__contains__('group_name') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
	
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	group_name = smart_unicode(request.REQUEST['group_name'], encoding='utf-8', strings_only=False, errors='strict')
	
	if name_not_valid(group_name):
		log_msg = "%s :: user %s :: group_name_not_valid" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'group_name_not_valid'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	group_exists = db.groups.find_one( { 'owner': username, 'group_name': group_name } )
	if group_exists:
		log_msg = "%s :: user %s :: grout already exists" % (whoami(), username)
		wfm_logger.error(log_msg)

		ret = {'success': False, 'status_msg': 'group_exists'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	# Add users to group
	db.groups.update({'owner': username, '_id': group_id}, { '$set' : { 'group_name' :  group_name } })
	
	err = db.command({'getlasterror':1})
	
	#Test if update succedded
	if not err['updatedExisting']:
		log_msg = "%s :: user %s :: could_not_rename_group" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_rename_group'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: group renamed" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

#Get a list of users in a specific group
@myuser_login_required
def cmd_get_group_users(request):
	username = request.user.username
	
	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('group_id') ):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
	group = db.groups.find_one({'owner': username, '_id': group_id}, ['users'])
	
	if not group:
		release_fs(username, 0)
		
		log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'group_not_found'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: returned (%d) users in group" % (whoami(), username, len(group['users']))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'users': group['users']}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
#Get a list of groups by a specific user
@myuser_login_required
def cmd_get_groups(request):
	username = request.user.username
	groups = []
	for group in db.groups.find({'owner': username}, ['group_name']):
		groups.append(group)
	
	# Append Special Groups: School, Class and Division
	for group in get_special_groups(username):
		groups.append(group)
	
	log_msg = "%s :: user %s :: returned (%d) user groups" % (whoami(), username, len(groups))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'groups': groups}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

#Get a list of groups that user is member
@myuser_login_required
def cmd_get_group_membership(request):
	username = request.user.username
	groups = []
	for group in db.groups.find({'users': username}, ['group_name', 'owner']):
		groups.append( {'group_name': group['group_name'], 'group_owner': group['owner'] })

	log_msg = "%s :: user %s :: user member of (%d) groups" % (whoami(), username, len(groups))
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'groups': groups}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# Get the list of Special Groups. These should be School, Class and Division
def get_special_groups(username):
	groups = []
	groups.append({'_id': 's1', 'group_name': 'Το Σχολείο μου'})
	groups.append({'_id': 's2', 'group_name': 'Η Τάξη μου'})
	groups.append({'_id': 's3', 'group_name': 'Το Τμήμα μου'})
	return groups

# search for schools in ldap
def search_schools(search_arg):
	search_results = []

	try:
		# connect
		con = ldap.initialize(ldap_server)
		con.simple_bind_s(dn, pw)

		# build search filter
		# accounts that start with 'search_arg' and are teachers or students
		sfilter = '(&(uid=%s*)(umdobject=accounts))' % ldap.filter.escape_filter_chars(search_arg)

		try:
			# send search request
			ldap_result_id = con.search(base_dn, scope, sfilter, None)
			# get results
			result_type, result_data = con.result(ldap_result_id, 1)
		finally:
			# close
			con.unbind_s()

	except ldap.LDAPError, e:
		# return empty list
		return search_results

	for entry in result_data:
		search_results.append(entry[0].split(',')[0].split('=')[1])

	return search_results


# returns information about students school, class and grade in a dictionary
def get_student_info(username):
	try:
		# connect
		con = ldap.initialize(ldap_server)
		con.simple_bind_s(dn, pw)

		# build search filter
		sfilter = 'uid=%s' % ldap.filter.escape_filter_chars(username)

		try:
			# send search request
			ldap_result_id = con.search(base_dn, scope, sfilter, ['UMDVALIDATORSNAME', 'GSNGRADE', 'GSNCLASS'])
			# get results
			result_type, result_data = con.result(ldap_result_id, 0)
		finally:
			# close
			con.unbind_s()
	except ldap.LDAPError:
		return None

	info_dict = {}

	try:
		info_dict['grade'] = s_grade = result_data[0][1]['GSNGRADE'][0]
	except (KeyError, IndexError):
		info_dict['grade'] = None

	try:
		info_dict['class'] = result_data[0][1]['GSNCLASS'][0]
	except (KeyError, IndexError):
		info_dict['class'] = None

	try:
		info_dict['school'] = result_data[0][1]['UMDVALIDATORSNAME'][0].split(',')[0].split('=')[1]
	except (KeyError, IndexError):
		info_dict['school'] = None

	return info_dict


# return users's school/class/grade - debug function
@myuser_login_required
def cmd_get_student_info(request):
	if not (request.REQUEST.__contains__('user')):
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	info_dict = get_student_info(request.REQUEST['user'])

	# we need more chars to make the search
	if info_dict is None:
		ret = {'success': False, 'status_msg': 'cannot_retrive_student_info'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	ret = {'success': True }
	ret.update(info_dict) # merge 2 dictionaries
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")

# return users's school/class/grade from db - debug function
@myuser_login_required
def cmd_get_db_student_info(request):
	username = request.user.username
	fs = db.user_fs.find_one( {'owner': username}, ['name', 'school', 'grade', 'class'] )
	if fs:
		ret = {
			'success': True,
			'username': username,
			'name' : fs['name'],
			'school' : fs['school'],
			'grade' : fs['grade'],
			'class' : fs['class']
			}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	else:
		ret = {'success': False}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# save school, grade and class in db
def update_student_info(username, info):
	db.user_fs.update(
		{ 'owner': username},
		{ '$set': { 'school': info['school'], 'grade' : info['grade'], 'class' : info['class'] } }
	)


# search users
def search_users(stype, name=None):
	"""Search for users in ldap

	parameters:
		stype: search type, 'uid' for user id and 'cn' for canonical name
		name: name to search, can be username, full name or partial name

	returns:
		search_results: a tuple with the results

	each result in the tuple is in the form: {"uid": "username", "cn": "first_name last_name"}
	"""
	search_results = []

	if name is None:
		return search_results

	# unquote search argument - html escape chars -> chars
	name = urllib.unquote(name)
	try:
		# try to encode to utf8 in case browser sent other encodings
		name = name.encode("utf-8")
	except UnicodeError:
		pass

	# sanitise user input
	name = ldap.filter.escape_filter_chars(name)
	# search for teachers, students and staff
	search_obj = '(|(umdobject=teacher)(umdobject=student)(umdobject=personel)(umdobject=account))'

	# build search filters based on search type: by uid or name
	if stype == 'uid':
		one_filter = '(&(uid=%s)%s)' % (name, search_obj)
		many_filter = '(&(uid=%s*)%s)' % (name, search_obj)

	elif stype == 'cn':
		try:
			fname, lname = name.split(' ') # maybe user gave first and last name
			one_filter = '(&(&(cn=%s)(cn=%s))%s)' % (fname, lname, search_obj)
			many_filter = '(&(&(cn=*%s*)(cn=*%s*))%s)' % (fname, lname, search_obj)
		except ValueError:
			# user gave only first or last name, use string as is
			one_filter = '(&(cn=%s)%s)' % (name, search_obj)
			many_filter = '(&(cn=*%s*)%s)' % (name, search_obj)

	else:
		# on unknown search type return empty list - just in case
		return search_results

	try:
		# connect
		con = ldap.initialize(ldap_server)
		con.simple_bind_s(dn, pw)

		try:
			# use 'one_filter' : search for specific value
			ldap_result_id = con.search(base_dn, scope, one_filter, ['uid', 'cn'])
			result_type, result_data = con.result(ldap_result_id, 0)

			# split uid and name and append to dictionary results
			if result_data:
				res_uid = result_data[0][0].split(',')[0].split('=')[1]
				res_cn = result_data[0][1]['cn'][0]
				search_results.append({'uid': res_uid, 'cn': res_cn})
			
			# use 'many_filter' : search with wildcard
			ldap_result_id = con.search(base_dn, scope, many_filter, ['uid', 'cn'])

			# loop to get one result at a time before hitting ldap return cap
			while True:
				result_type, result_data = con.result(ldap_result_id, 0)

				if result_data == []:
					break;
				
				res_uid = result_data[0][0].split(',')[0].split('=')[1]
				res_cn = result_data[0][1]['cn'][0]
				res_dict = { 'uid': res_uid, 'cn': res_cn }
				
				if res_dict not in search_results:
					search_results.append(res_dict)
			
		finally:
			# close
			con.unbind_s()

	except ldap.LDAPError, e:
		# return empty or partial list
		return search_results

	return search_results


# test new search function
@myuser_login_required
def cmd_search_users(request):
	username = request.user.username
	if not (request.REQUEST.__contains__('stype') and request.REQUEST.__contains__('name')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	search_results = search_users(request.REQUEST['stype'], request.REQUEST['name'])

	# we need more chars to make the search
	if not search_results:
		log_msg = "%s :: user %s :: need more characters to search" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'need_more_chars'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	log_msg = "%s :: user %s :: returned search results" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'search_results': search_results}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


def zip_files(zipfile, doc_list, parent):
	'''Create a zip archive from the given file/folder list'''
	for doc in doc_list:
		if len(parent) != 0:
			# use full path as document
			doc_path = ""
			for p in parent:
			   doc_path = os.path.join(doc_path, p)
			full_doc = os.path.join(doc_path, doc)
		else:
			# no parent, full document path is the filename
			full_doc = doc 

		if os.path.isdir(full_doc):
			# if target is folder get its contents and call call zip_files again

			# zip should contain empty folders
			zipfile.write(full_doc)

			sublist = os.listdir(full_doc)
			parent.append(doc)

			zip_files(zipfile, sublist, parent)

			parent.pop()
		else:
			# zip file
			zipfile.write(full_doc)


def mongo_to_disk(username, doc_list, destination):
	'''Transfer selected files/folders and subfiles from mongodb to a unique
	temporary directory in /tmp

	argyments:
		username: username of user calling parent function
		doc_list: list of mongodb _id for files/folders
		destination: folder in fs to save the contents
	'''
	for doc_id in doc_list:
		doc = db.fs.files.find_one({'owner': username, '_id': doc_id , 'parent_id': {'$ne': 'root' } }, ['type', 'name'])

		if not doc:
			continue

		full_path = os.path.join(destination, doc['name'])
		
		if doc['type'] == 'folder':
			if not os.path.exists(full_path):
				os.mkdir(full_path)

			sub_list_cursor = db.fs.files.find({'owner': username, 'parent_id': doc['_id']}, ['_id'])
			sub_list = list([l['_id'] for l in sub_list_cursor])
			
			mongo_to_disk(username, sub_list, full_path)
		else:
			fdata = db_gridfs.get(doc_id)
			f = open(full_path, 'w')
			f.write(fdata.read())
			f.close()


@myuser_login_required
def cmd_zip_files(request):
	'''Zip selected files online'''
	username = request.user.username

	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id_list') and request.REQUEST.__contains__('name')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id_list =  list(set(smart_unicode(request.REQUEST['doc_id_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	zip_name = smart_unicode(request.REQUEST['name'], encoding='utf-8', strings_only=False, errors='strict')

	if len(zip_name) == 0:
		# create random name
		zip_name = "%s-%s.zip" % ('z', uuid4())
	else:
		# check for valid filename
		if name_not_valid(zip_name):
			log_msg = "%s :: user %s :: bad_document_name" % (whoami(), username)
			wfm_logger.error(log_msg)
			
			ret = {'success': False, 'status_msg': 'bad_document_name'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")

		if os.path.splitext(zip_name)[1] != ".zip":
			zip_name = zip_name + '.zip'
	
	# source for files to zip, we also use it as destination for mongo_to_disk function
	source = tempfile.mkdtemp(suffix=username)
	# destination folder where zip file will be created
	destination = tempfile.mkdtemp(suffix=username)

	# create proper fs tree in source folder from doc_id_list
	mongo_to_disk(username, doc_id_list, source)

	# build path of zip file and open it
	zfile_path = os.path.join(destination, zip_name)
	zfile = zipfile.ZipFile(zfile_path, 'w', zipfile.ZIP_DEFLATED)

	# get file/folder list
	source_ls = os.listdir(source)

	# go into folder with files
	os.chdir(source)

	# no parent by default
	parent = []

	# recursively add stuff to zip
	zip_files(zfile, source_ls, parent)

	# close archive
	zfile.close()

	# store zip file in user's wfm home directory
	fs = db.user_fs.find_one({'owner': username}, ['home_id'])

	# create a django file object from zip file because that is what create_file expects
	f = open(zfile_path, 'r')
	fdata = File(f)
	fdata.name = fdata.name.rsplit('/')[-1]
	log_msg = "%s :: user %s :: created zip '%s' with size '%s'" % (whoami(), username, fdata.name, fdata.size)
	wfm_logger.debug(log_msg)
	file_id = create_file(username, fs['home_id'], fdata)


	# all done close open files
	f.close()
	fdata.close()

	# cleanup
	try:
		shutil.rmtree(source)
		shutil.rmtree(destination)
	except OSError:
		log_msg = "%s :: user %s :: cannot remove temporary folders" % (whoami(), username)
		wfm_logger.error(log_msg)

	log_msg = "%s :: user %s :: compressed file(s)" % (whoami(), username)
	wfm_logger.debug(log_msg)

	file_errors = { 1: 'bad_document_name',
					2: 'op_failed_quota_exceeded',
					3: 'parent_folder_id_does_not_exist',
					4: 'antivirus_service_error',
					5: 'infected_file_found',
					6: 'not_enough_disk_space'}

	if file_id in file_errors:
		log_msg = "%s :: user %s :: %s" % (whoami(), username, file_errors[file_id])
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': file_errors[file_id]}

	ret = {'success': True, 'doc_id': file_id}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# check if a file is flagged
def is_flagged_inappropriate(doc_id):
	doc = db.fs.files.find_one({'_id': doc_id}, ['inappropriate'])
	if 'inappropriate' in doc:
		if doc['inappropriate']:
			return True
	return False


@myuser_login_required
def cmd_report_content(request):
	"""Send email notifications for inapropriate content"""
	username = request.user.username
	
	if not (request.REQUEST.__contains__('doc_id_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	doc_id_list =  list(set(smart_unicode(request.REQUEST['doc_id_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))

	# gather report info
	msg = "User '%s' reported file(s) as inappropriate:\n\n" % username

	counter = 0
	for doc_id in doc_id_list:
		doc = db.fs.files.find_one({ '_id': doc_id }, ['name', 'owner'])
		
		if not doc:
			msg = msg + "%d Could not get filename/owner of file '%s' due to an error." % (counter, doc_id)
			log_msg = "%s :: user %s :: could not get info for %s" % (whoami(), username, doc_id)
			wfm_logger.error(log_msg)
		else:
			if not is_flagged_inappropriate(doc_id):
				counter += 1
				
				dl_url = '%s/server/admin_get/%s' % (IP_DJ.rstrip('/'), doc_id)
				uf_url = '%s/server/cmd_unflag_reported_content?doc_id_list=%s' % (IP_DJ.rstrip('/'), doc_id)
				del_url = '%s/server/admin_delete/%s' % (IP_DJ.rstrip('/'), doc_id)
				
				msg = msg + "--[ file # %d ]---------------\n\
Name: '%s'\n\
File id : '%s'\n\
Owner : '%s'\n\
Download url: %s \n\
Un-flag url: %s \n\
Delete url: %s \n\n" % (counter, doc['name'], doc_id, doc['owner'], dl_url, uf_url, del_url)
				flag_inappropriate(doc_id)

	if counter == 0:
		log_msg = "%s :: user %s :: files_already_reported %s" % (whoami(), username, doc_id_list)
		wfm_logger.info(log_msg)

		ret = {'success': False, 'status_msg': 'files_already_reported'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	# send email
	subject = '[WFM] inappropriate content report'
	mfrom = 'wfm'
	to = ['edudevel@edu.teiath.gr']
	send_mail(subject, msg, mfrom, to)

	log_msg = "%s :: user %s :: reported content for doc_ids %s" % (whoami(), username, doc_id_list)
	wfm_logger.info(log_msg)
	
	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


def is_admin(username):
	"""Check if user is an admin"""
	user = db.user_fs.find_one({ 'owner': username }, ['admin'])
	if 'admin' in user:
		return user['admin'] # return true or false from db
	
	return False


# set inappropriate flag to true of false for file
def flag_inappropriate(doc_id, flag=True):
	db.fs.files.update({'_id': doc_id}, {'$set': {'inappropriate': flag}})


# unflags a file or list of files from being inappropriate (admin only)
@myuser_login_required
def cmd_unflag_reported_content(request):
	username = request.user.username
	
	if not (request.REQUEST.__contains__('doc_id_list')):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	if not is_admin(username):
		log_msg = "%s :: user %s :: unprivileged user tried to unflag content" % (whoami(), username)
		wfm_logger.info(log_msg)
		
		ret = {'success': False, 'status_msg': 'only_admin_can_do_that'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id_list =  list(set(smart_unicode(request.REQUEST['doc_id_list'], encoding='utf-8', strings_only=False, errors='strict').rsplit('/')))
	
	for doc_id in doc_id_list:
		doc = db.fs.files.find_one({ '_id': doc_id }, ['_id'])
		
		if not doc:
			log_msg = "%s :: user %s :: could not get file %s for unflag" % (whoami(), username, doc_id)
			wfm_logger.error(log_msg)
		else:
			log_msg = "%s :: user %s :: unflagged file %s" % (whoami(), username, doc_id)
			wfm_logger.info(log_msg)
			# unflag file
			flag_inappropriate(doc_id, False)

	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


def update_admin_info(username):
	# TODO: put code for ldap here
	
	tmp_admins = ('tlatsas', 'xenofon')
	
	if username in tmp_admins:
		db.user_fs.update({'owner': username}, {'$set': {'admin': True}})
		return True

	db.user_fs.update({'owner': username}, {'$set': {'admin': False}})
	return False

@myuser_login_required
def admin_get(request, doc_id):
	username = request.user.username

	if not is_admin(username):
		log_msg = "%s :: user %s :: unprivileged user tried to access files" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'only_admin_can_do_that'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	

	#Verify that document exists and is file 
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['name', 'length'])
	
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	#Verify that file is flagged an inappropriate
	if is_flagged_inappropriate(doc_id):
		#Serve file
		fdata = db_gridfs.get(doc_id)
		response = HttpResponse(FileWrapper(fdata), mimetype=fdata.content_type)
		response['Content-Type'] = fdata.content_type
		response['Content-Disposition'] = smart_str('attachment; filename="' + doc['name'] + '"', encoding='utf-8', strings_only=False, errors='strict') 
		response['Content-Length'] = doc['length']
		return response

	# file has inappropriate flag set to False or has no field inappropriate
	log_msg = "%s :: user %s :: document_is_not_flagged_as_inappropriate" % (whoami(), username)
	wfm_logger.error(log_msg)
	ret = {'success': False, 'status_msg': 'document_not_flagged_as_inappropriate'}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


@myuser_login_required
def admin_delete(request, doc_id):
	adm_username = request.user.username

	# check privileges
	if not is_admin(adm_username):
		log_msg = "%s :: user %s :: unprivileged user tried to delete files" % (whoami(), adm_username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'only_admin_can_do_that'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	# check if file exists
	doc = db.fs.files.find_one({'_id': doc_id, 'type': 'file'}, ['_id'])
	permanent = True
	if not doc:
		log_msg = "%s :: user %s :: document_does_not_exist" % (whoami(), adm_username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'document_does_not_exist'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	# get owner's name
	user = db.fs.files.find_one({ '_id': doc_id }, ['owner'])
	if 'owner' not in user:
		log_msg = "%s :: user %s :: cannot_find_owner" % (whoami(), adm_username)
		wfm_logger.error(log_msg)
		ret = {'success': False, 'status_msg': 'cannot_find_owner'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	username = user['owner']
	
	#Verify that file is flagged an inappropriate
	if is_flagged_inappropriate(doc_id):
		#Lock user's filesystem to ensure that documents are deleted in one step
		if not tsl(username, 0):
			log_msg = "%s :: user %s :: cannot lock fs" % (whoami(), username)
			wfm_logger.error(log_msg)
		
			ret = {'success': False, 'status_msg': 'op_failed_try_again'}
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
		
		total_size = 0
		is_bookmarked = False
		
		#Get root document of the deletion tree
		doc = db.fs.files.find_one({'owner': username, '_id': doc_id , 'parent_id': {'$ne': 'root' } }, ['parent_id', 'length', 'deleted', 'subtree_size', 'bookmarked'])
		is_bookmarked = doc.__contains__('bookmarked') and doc[ 'bookmarked' ]
		size = doc['subtree_size']
		
		recursive_delete(username, doc_id, is_bookmarked)
		total_size = size
		size_propagation(username, doc['parent_id'], -size)
		
		release_fs(username, -total_size)

		log_msg = "%s :: user %s :: offending document deleted" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': True}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	# file has inappropriate flag set to False or has no field inappropriate
	log_msg = "%s :: user %s :: document_is_not_flagged_as_inappropriate" % (whoami(), username)
	wfm_logger.error(log_msg)
	ret = {'success': False, 'status_msg': 'document_not_flagged_as_inappropriate'}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# check for available desk space
def available_space(username, size=0):
	"""Check for available disk space

	space is calculated using quota - size
	where size can be the total size you need to copy or upload
	"""
	fs = db.user_fs.find_one({'owner': username}, ['quota'])
	if not fs:
		return False
	quota = fs['quota']
	fs = db.user_fs.find_one({'owner': username, 'used_space': {'$lte': quota - size}})
	if fs is None:
		return False
	return True

@myuser_login_required
def cmd_calculate_size(request):
	"""Recursively calculate size of given doc_id"""
	username = request.user.username
	
	#Verify parameter identifiers
	if not request.REQUEST.__contains__('doc_id'):
		log_msg = "%s :: user %s :: bad_parameters" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'bad_parameters'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')

	doc = db.fs.files.find_one({ '_id': doc_id }, ['length', 'name', 'type', 'tags', 'owner'])

	if doc is None:
		log_msg = "%s :: user %s :: could_not_find_doc" % (whoami(), username)
		wfm_logger.error(log_msg)
		
		ret = {'success': False, 'status_msg': 'could_not_find_doc'}
		return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
	group_ids = get_group_ids(username, doc['owner'])
	size = doc['length']
	size += determine_public_size(username, doc['owner'], doc['_id'], group_ids)

	log_msg = "%s :: user %s :: returned size OK" % (whoami(), username)
	wfm_logger.debug(log_msg)
	
	ret = {'success': True, 'size': size}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


def create_notification(notification_owners, notification_sender, doc_id):
	"""Insert notifications in the notification collection

	Keyword arguments:
	notification_owners -- list of usernames to receive the notification
	notification_sender -- username of user who shared the document
	doc_id -- the id of the shared document
	"""
	#get the required info
	doc = db.fs.files.find_one({'_id' : doc_id}, ['name', 'type'])
	sender_name = db.user_fs.find_one({'owner': notification_sender}, ['name'])['name']

	notifications = []
	for owner in notification_owners:
		# owners exist as they get the files from the sharing feature
		# also you cannot share an already shared document
		notifications.append({'_id': 'n' + uuid4().hex, 'owner': owner,'sender': sender_name, 'doc_name' : doc['name'],
								'doc_type' : doc['type'] , 'doc_id' : doc_id, 'read': False})

	# batch insert notifications
	db.notifications.insert(notifications)


def remove_notification(owner=None, doc_id_list=None):
	"""Removes notifications based on owner or document IDs

	If owner is set then this funtion should be called from login
	to remove all read notifications.

	If owner is None then check for doc_id_list
	doc_id_list contains a list of document ids,
	these documents are unshared or deleted and so should
	the notifications be
	"""
	if owner is not None:
		db.notifications.remove({'owner': owner, 'read': True})
		return

	if doc_id_list is None:
		# on error fail silently
		return

	for doc in doc_id_list:
		db.notifications.remove({'_id': doc})

	return


@myuser_login_required
def cmd_mark_notifications_read(request):
	"""Mark notifications in doc id list as read, if list is empty mark them all"""
	username = request.user.username

	doc_id_list = None
	if request.REQUEST.__contains__('doc_id_list'):
		doc_id_list =  list (
			set (
				smart_unicode(
					request.REQUEST['doc_id_list'],
					encoding='utf-8',
					strings_only=False,
					errors='strict'
				).rsplit('/')
			)
		)

	update = {'$set' : { 'read': True }}

	if doc_id_list is None:
		# mark them all
		q = {'owner': username, 'read': False}
		db.notifications.update(q, update, multi=True)
	else:
		for doc in doc_id_list:
			db.notifications.update({'_id': doc, 'owner': username}, update)

	ret = {'success': True}
	return HttpResponse(json.dumps(ret), mimetype="application/javascript")


@myuser_login_required
def cmd_get_notifications(request):
    username = request.user.username

    q = {'owner': username, 'read': False}
    notifications = []
    for notification in db.notifications.find(q, ['sender', 'doc_name', 'doc_type']):
        notifications.append(notification)

    ret = {'success': True, 'notifications': notifications}
    return HttpResponse(json.dumps(ret), mimetype="application/javascript")


# vim: set noexpandtab:
