# -*- coding: utf-8 -*-

# django imports
from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth import *
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import Http404

# python imports
import datetime
import time
from uuid import uuid4
import Image
import StringIO
import mimetypes
import ldap

# pymongo imports
import pymongo
from pymongo import Connection

# wfm imports
from local_settings import *
from api  import *

@myuser_login_required
def init(request):
	username = request.user.username

	log_msg = "%s :: user %s :: request: %s" % (whoami(), username, request.path)
	wfm_logger.debug(log_msg)
	
	#Test if username already present
	fs = db.user_fs.find_one({'owner': username}, ['home_id', 'trash_id'])
	
	if fs:
		#User already present, redirect to main page - unlock filesystem
		
		size = compute_space(fs['home_id'])
		size += compute_space(fs['trash_id'])
		db.user_fs.update({'owner': username}, {'$set': {'used_space': size} })

		# set admin flag
		update_admin_info(username)

		# remove all read notificaations
		remove_notification(username)

		# retrieve school / grade / class and save in db
		info_dict = get_student_info(username)
		if info_dict is not None:
			update_student_info(username, info_dict)

		release_fs(username, 0)
		create_special_groups(request)
		return HttpResponseRedirect("/")
	
	#User not present, create entries
	if not register_user(username):
		HttpResponse('Unable to register new user')		
	
	create_special_groups(request)
	return HttpResponseRedirect("/")
	
	
def user_register(request):
	if request.method == 'POST':
		form = RegistrationForm(request.POST, request.FILES)
		if form.is_valid():
			#Check if user already registered
			try:
				User.objects.get(username=form.cleaned_data['username'])
			except User.DoesNotExist:
				
				#Create new user
				username = form.cleaned_data['username']
				password = form.cleaned_data['password']
				user = User.objects.create_user(username, '', password)
				user.first_name = form.cleaned_data['first_name']
				user.last_name = form.cleaned_data['last_name']
				user.email = form.cleaned_data['email']
				user.save()

				home_id = 'd' + uuid4().hex
				trash_id = 'd' + uuid4().hex
				#Create user filesystem &  base directories
				fs_doc = {'type': 'fs', 'owner': username, '_id': uuid4().hex, 'quota': quota, 'used_space': 0, 'locked': False, 'share_list': [], 'tag_list': [], 'home_id': home_id, 'trash_id': trash_id, 'bookmarks': [] }
				db.user_fs.insert([fs_doc] , safe=True )
				
				home_file = db_gridfs.new_file(type = 'schema', content_type = 'folder', name = 'home', owner = username, tags =[], parent_id = 'root', public = {'users': [], 'groups': []}, _id = home_id, global_public = False, old_parent_id = '0', deleted = False, thumbnail = [], subtree_size = 0, bookmarked = False)
				home_file.close()
				
				#db_gridfs = GridFS(db)
				
				trash_file = db_gridfs.new_file(type = 'schema', content_type='folder', name = 'trash', owner = username, tags =[], parent_id = 'root', public = {'users': [], 'groups': []}, _id = trash_id, global_public = False, old_parent_id = '0', deleted = True, thumbnail = [], subtree_size = 0, bookmarked = False)
				trash_file.close()
		
				#home_doc = {'type': 'schema', 'mime_type':'folder',  'name':'home',  'owner': username, 'tags':[], 'parent_id': 'root','public' : {'users': [], 'groups': []}, '_id': 'd' + uuid4().hex, 'size': 0, 'global': False, 'old_parent_id': '0', 'deleted': False}
				
				#trash_doc = {'type': 'schema', 'mime_type':'folder',  'name':'trash',  'owner': username, 'tags':[], 'parent_id': 'root','public' : {'users': [], 'groups': []},  '_id': 'd' + uuid4().hex, 'size': 0, 'global': False, 'old_parent_id': '0', 'deleted': True}
				
				
				#db.files.insert([home_doc, trash_doc] , safe=True )
				
				return HttpResponse('<b>Registration Complete</b> <p>  <a href="../login/">Login</a></p>')
			else:
				return HttpResponse('<b>User already registered</b> <p>  <a href="../register/">Register</a></p>')
	else:
		form = RegistrationForm()
	return render_to_response('registration_form.html', {'form': form})

def create_special_groups(request):
	username = request.user.username

	specialgroups = []
	specialgroups.append({'owner': username, '_id': 'gs_1_'+username, 'group_name': 'Το Σχολείο μου', 'users': search_special_group_users('gs_1_'+username)})
	specialgroups.append({'owner': username, '_id': 'gs_2_'+username, 'group_name': 'Η Τάξη μου', 'users': search_special_group_users('gs_2_'+username)})
	specialgroups.append({'owner': username, '_id': 'gs_3_'+username, 'group_name': 'Το Τμήμα μου', 'users': search_special_group_users('gs_3_'+username)})
	for group in specialgroups:
		group_exists = db.groups.find_one( { 'owner': username, 'group_name': group['group_name'] } )
		if group_exists:
			# Remove users from group
			db.groups.update({'owner': username, '_id': group['_id']}, { '$pullAll' : { 'users' :  []  } })
			# Remove the group
			db.groups.remove({'owner': username, '_id': group['_id']})
		db.groups.insert(group)

def search_special_group_users(group_id):
	params = group_id.split('_')
	filtertype = params[1]
	username = params[2]

	try:
		# connect
		con = ldap.initialize(ldap_server)
		con.simple_bind_s(dn, pw)

		# build search filter
		#sfilter = 'uid=%s' % ldap.filter.escape_filter_chars(username)
		if(filtertype == '1'):
			sfilter = 'uid=ifo*'
		elif(filtertype == '2'):
			sfilter = 'uid=fasol*'
		elif(filtertype == '3'):
			sfilter = 'uid=fel*'
		else:
			raise Exception('Invalid special group specified')

		users = []

		try:
			# send search request
			ldap_result_id = con.search(base_dn, scope, sfilter, ['uid'])
			# get results
			while 1:
				result_type, result_data = con.result(ldap_result_id, 0)
				if (result_data == []):
					break
				else:
					if result_type == ldap.RES_SEARCH_ENTRY:
						users.append(result_data[0][1]['uid'][0])

			return users
		finally:
			# close
			con.unbind_s()

	except ldap.LDAPError, e:
		raise Exception(e)

# vim: set noexpandtab:
