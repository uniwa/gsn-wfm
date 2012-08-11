# -*- coding: utf-8 -*-

# django imports
from django.shortcuts import render_to_response
from django.shortcuts import redirect
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import *
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import Http404
from django.conf import settings

# python stuff
import time
from uuid import uuid4
import datetime
import Image
import StringIO
import mimetypes
import ldap

# python mongo driver
import pymongo
from pymongo import Connection

# wfm imports
from local_settings import *
from api  import *

CAS_REDIRECT_URL = '/server/m/init/'

# redefine the decorator to support login redirection
def myuser_login_required(f):
	def wrap(request, *args, **kwargs):
		#Do some session checking
		if not request.user.is_authenticated():
			# handle redirection
			settings.CAS_REDIRECT_URL = '/server/m/init' # Fixme: BAD HACK
			return redirect(IP_DJ.rstrip('/') + '/server/m/accounts/login/')
		return f(request, *args, **kwargs)
		wrap.__doc__=f.__doc__
		wrap.__name__=f.__name__
	return wrap


@myuser_login_required
def init(request):
	username = request.user.username
	
	#Test if username already present
	fs = db.user_fs.find_one({'owner': username}, ['home_id', 'trash_id'])
	
	if fs:
		#User already present, redirect to main page - unlock filesystem
		
		size = compute_space(fs['home_id'])
		size += compute_space(fs['trash_id'])
		db.user_fs.update({'owner': username}, {'$set': {'used_space': size} })

		# set admin flag
		update_admin_info(username)

		# retrieve school / grade / class and save in db
		info_dict = get_student_info(username)
		if info_dict is not None:
			update_student_info(username, info_dict)

		release_fs(username, 0)
		return redirect(IP_DJ.rstrip('/') + '/server/m/cmd_ls/')
	
	#User not present, create entries
	if not register_user(username):
		HttpResponse('Unable to register new user')
	
	return redirect(IP_DJ.rstrip('/') + '/server/m/cmd_ls/')


def get_std_info(username):
	ret = {}
	
	fs = db.user_fs.find_one({'owner': username}, ['name', 'home_id', 'trash_id', 'quota', 'used_space'])
	if fs:
		ret['username'] = username
		ret['name'] = fs['name']
		ret['home_id'] = fs['home_id']
		ret['trash_id'] = fs['trash_id']
		ret['quota'] = fs['quota']
		ret['used_space'] = fs['used_space']
		ret['free_space'] = fs['quota'] - fs['used_space']

		# return application server url
		ret['appurl'] = '%s%s' % (IP_DJ.rstrip('/'), '/server/m/')
		ret['fullapp'] = IP_DJ
	else:
		ret ['success'] = False
		return ret

	ret ['success'] = True
	return ret


def get_curr_path_id(doc_id, home_id, bcrumb):
	"""get folder path plus the folder id (aka breadcrumbs) for current document view (doc_id)"""
	if doc_id != home_id:
		doc = db.fs.files.find_one({'_id': doc_id}, ['name', 'parent_id', 'type'])
		bcrumb.append({'name': doc['name'], '_id': doc['_id'], 'type': doc['type']})
		get_curr_path_id(doc['parent_id'], home_id, bcrumb)


def get_curr_path(doc_id, home_id, bcrumb):
	"""get folder path (aka breadcrumbs) for current document view (doc_id)"""
	if doc_id != home_id:
		doc = db.fs.files.find_one({'_id': doc_id}, ['name', 'parent_id'])
		bcrumb.append(doc['name'])
		get_curr_path(doc['parent_id'], home_id, bcrumb)


def get_file_path(top_id, file_list, schema):
	"""wrapper function of get_curr_path

	append relative path to each folder
		e.g ret['path']= 'folder/innerfolder1/innerfolder2'

	@param top_id    : top lvl id, can be home/trash/public id etc
	@param file_list : list of dictionaries with file/folder info
	"""
	for f in file_list:
		if f['type'] == 'folder':
			fpath = []
			get_curr_path(f['_id'], top_id, fpath)
			fpath.append(schema)
			fpath.append('root')
			f['path'] = '/'.join(reversed(fpath))


@myuser_login_required
def m_cmd_ls(request):
	username = request.user.username

	std_info = get_std_info(username)

	#Verify parameter identifiers
	if not (request.REQUEST.__contains__('doc_id') and request.REQUEST.__contains__('path') and (request.REQUEST.__contains__('group_id') or request.REQUEST.__contains__('school_id'))):
		doc_id = std_info['home_id']
		group_id = ''
		school_id = ''
		path = 'root/home'
	else:
		doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
		if(request.REQUEST.__contains__('group_id')):
			group_id = smart_unicode(request.REQUEST['group_id'], encoding='utf-8', strings_only=False, errors='strict')
		elif(request.REQUEST.__contains__('school_id')):
			school_id = smart_unicode(request.REQUEST['school_id'], encoding='utf-8', strings_only=False, errors='strict')
		path = smart_unicode(request.REQUEST['path'], encoding='utf-8', strings_only=False, errors='strict')

	# return current doc_id
	std_info['curr_doc_id'] = doc_id

	# set default values to avoid template errors
	bcrumb = []
	bcrumb_schema = ''
	bcrumb_schema_id = ''
	ret = {}

	#Determine schema
	schema_ls = {'public': public_ls, 'root': root_ls, 'users': users_ls, 'groups': groups_ls}
	pathlist = path.rsplit('/')
	#if True:
	try:
		if doc_id in schema_ls:
			#Ls in top structure documents
			ret = schema_ls[doc_id](username)

			log_msg = "ls in top structure docs\n"
			log_msg = "%s%s" % (log_msg, str(ret))
			wfm_logger.debug(log_msg)

			schema_template = "public.html"

		elif doc_id == 'tag':
			#LS in tag folder
			ret = tag_ls(username, pathlist[2:], path)
		#Ls in user folder, public or shared?
		elif doc_id == 'user':
			user_ls = {'public': user_public_ls, 'shared': user_shared_ls}
			#User public or user shared?	
			if pathlist[1] == 'public' or pathlist[1] == 'bookmarks':
				#ret = user_public_ls(username, pathlist[2])
				ret = user_public_ls_mininal(username, pathlist[2])

				log_msg = "ls in top structure docs\n"
				log_msg = "%s%s" % (log_msg, str(ret))
				wfm_logger.debug(log_msg)

				schema_template = "public.html"

			elif pathlist[1] == 'shared':
				ret = user_shared_ls(username, pathlist[3])
		else:
			#Ls in document, determine if it is group or file document
			if doc_id[0] == 'g':
				#Ls on group folder
				ret = group_shared_ls(username, doc_id)	
			elif request.REQUEST.__contains__('school_id'):
				ret = school_shared_ls(username, doc_id)
			else:
				#Regular ls on document - Determine schema
				if pathlist[1] == 'home':
					ret = document_ls_home(username, doc_id)
					get_curr_path_id(doc_id, std_info['home_id'], bcrumb)
					get_file_path(std_info['home_id'], ret['ls']['contents'], pathlist[1])
					bcrumb_schema = 'home'
					bcrumb_schema_id = std_info['home_id']
					get_file_path(std_info['home_id'], bcrumb, pathlist[1])

					log_msg = "bcrumb >>> %s\n" % bcrumb
					wfm_logger.debug(log_msg)

					schema_template = "ls.html"
					
				elif  pathlist[1] == 'bookmarks':
					ret = document_ls_home(username, doc_id)
					
				elif pathlist[1] == 'trash':
					ret = document_ls_home(username, doc_id)

					log_msg = "="*60 + "\nRUN: get_curr_path_id()\n" + '='*60 # debug
					wfm_logger.debug(log_msg) # debug

					get_curr_path_id(doc_id, std_info['trash_id'], bcrumb)

					wfm_logger.debug(str(bcrumb)) # debug


					log_msg = "="*60 + "\nRUN #1: get_file_path()\n" + '='*60 # debug
					wfm_logger.debug(log_msg) # debug

					get_file_path(std_info['trash_id'], ret['ls']['contents'], pathlist[1])

					wfm_logger.debug(str(ret['ls']['contents'])) # debug


					bcrumb_schema = 'trash'
					bcrumb_schema_id = std_info['trash_id']


					log_msg = "="*60 + "\nRUN #2: get_file_path()\n" + '='*60 # DEBUG
					wfm_logger.debug(log_msg) # DEBUG

					get_file_path(std_info['trash_id'], bcrumb, pathlist[1])

					wfm_logger.debug(str(bcrumb)) # DEBUG

					schema_template = "trash.html"

					
				elif pathlist[1] == 'public':
					ret = document_ls_public(username, doc_id)
					#get_curr_path_id(doc_id, std_info['public_id'], bcrumb)
					get_file_path('public', ret['ls']['contents'], pathlist[1])
					bcrumb_schema = 'public'
					#bcrumb_schema_id = std_info['public_id']
					#get_file_path(std_info['public_id'], bcrumb, pathlist[1])

					schema_template = "public.html"
					
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
		ret = {'success':False, 'status_msg': e}

	# return some standr session info
	ret['info'] = std_info
	ret['bcrumb'] = bcrumb
	ret['bcrumb_schema'] = bcrumb_schema
	ret['bcrumb_schema_id'] = bcrumb_schema_id

	log_msg = "%s :: user %s :: run ls command for doc_id=%s" % (whoami(), username, doc_id)
	wfm_logger.debug(log_msg)
	wfm_logger.debug(str(ret))

	return render_to_response(schema_template, ret)


#Delete a document
@myuser_login_required
def m_cmd_delete(request):
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

	ret = {'success': True, 'msg': 'Deleted successfully'}
	ret['info'] = get_std_info(username)
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	return render_to_response('response.html', ret)


@myuser_login_required
def m_cmd_rename(request):
	username = request.user.username
	
	ret = {}
	ret['info'] = get_std_info(username)
	
	#Verify parameter identifiers
	if		(request.REQUEST.__contains__('action') and
			request.REQUEST.__contains__('doc_id') and
			request.REQUEST.__contains__('old_name')):
		if request.REQUEST['action'] == 'do_rename':
			doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
			old_name = smart_unicode(request.REQUEST['old_name'], encoding='utf-8', strings_only=False, errors='strict')
			ret['doc_id'] = doc_id
			ret['old_name'] = old_name
			return render_to_response('rename.html', ret)
		else:
			ret['success'] = False
			ret['status_msg'] = 'bad_parameters'
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
			
	
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
		
	#ret = {'success': True}
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	#ret = {'success': True, 'msg': 'Deleted successfully'}
	ret['success'] = True
	ret['msg'] = 'File renamed successfully to "%s"' % name
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	return render_to_response('response.html', ret)


@myuser_login_required
def m_cmd_restore(request):
	username = request.user.username
	
	ret = {}
	ret['info'] = get_std_info(username)
	
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
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id, 'deleted': True}, ['old_parent_id', 'parent_id', 'length', 'subtree_size', 'name'])
		
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
	
	#ret = {'success': True}
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	ret['success'] = True
	ret['msg'] = 'File "%s" restored successfully' % doc['name']
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	return render_to_response('response.html', ret)


@myuser_login_required
def m_cmd_create_folder(request):
	username = request.user.username

	ret = {}
	ret['info'] = get_std_info(username)

	folder_errors = { 	1: 'bad_document_name',
						2: 'op_failed_quota_exceeded',
						3: 'parent_folder_does_not_exist'}

	if request.REQUEST.__contains__('parent_id') and request.REQUEST.__contains__('action'):
		if request.REQUEST['action'] == 'do_folder':
			parent_id = smart_unicode(request.REQUEST['parent_id'], encoding='utf-8', strings_only=False, errors='strict')
			ret['parent_id'] = parent_id
			return render_to_response('new_folder.html', ret)
		else:
			ret['success'] = False
			ret['status_msg'] = 'bad_parameters'
			return HttpResponse(json.dumps(ret), mimetype="application/javascript")
	
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
	
	ret['success'] = True
	ret['msg'] = 'folder "%s" created successfully' % name
	#ret = {'success': True, 'status_msg': 'folder_successfully_created', 'doc_id': doc_id, 'name': name}
	#return HttpResponse(json.dumps(ret), mimetype="application/javascript")

	return render_to_response('response.html', ret)


@myuser_login_required
def m_cmd_detail(request):
	username = request.user.username

	ret = {}
	ret['info'] = get_std_info(username)
	
	if not request.REQUEST.__contains__('doc_id'):
		ret['success'] = False
		ret['msg'] = 'bad_parameters'
		return render_to_response('response.html', ret)

	doc_id = smart_unicode(request.REQUEST['doc_id'], encoding='utf-8', strings_only=False, errors='strict')
	doc = db.fs.files.find_one({'owner': username, '_id': doc_id})

	group = []
	if doc['public']['groups']:
		# build group list
		for group_data in doc['public']['groups']:
			group.append(db.groups.find_one({'_id': group_data['group_id']}))

	ret['doc'] = doc
	ret['doc_group'] = group
	return render_to_response('details.html', ret)


#Empty trash
@myuser_login_required
def m_cmd_empty_trash(request):
	username = request.user.username

	ret = {}
	ret['info'] = get_std_info(username)
	
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

	ret['success'] = True
	ret['msg'] = 'Trash cleared successfully'

	return render_to_response('response.html', ret)

# vim: set noexpandtab:
