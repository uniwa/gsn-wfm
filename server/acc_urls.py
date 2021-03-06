# -*- coding: utf-8 -*-

from django.conf.urls.defaults import *
from views import *
from api import *
from django.contrib.auth.views import login
from django.contrib.auth.views import logout
from django.contrib import admin
from django.conf import settings
from acc_views import *

urlpatterns = patterns('',
#	('^test/$',test),
	('^init/$',init),
#	('^register/$',user_register),
#	('^login/$',user_login),
#	('^logout/$',user_logout),
#	#(r'^admin/', include(admin.site.urls)),
#	#('^dir/root/$',root_dir),
#	#('^add_file_api/$',add_file_api),
#	#('^add_zip_api/$',add_zip_api),
	(r'^accounts/login/$', 'django_cas.views.login'),
	(r'^accounts/logout/$', 'django_cas.views.logout'),
## The api itself
	('^get/([a-zA-Z0-9]{33})/$', get),
#	('^cmd_login/$', cmd_login),
#	('^cmd_logout/$', cmd_logout),	
#	('^cmd_tree/$', cmd_tree),
#	('^cmd_get_userinfo/$', cmd_get_userinfo),
#	('^cmd_get_space/$', cmd_get_space),
#	('^cmd_compute_space/$', cmd_compute_space),
#	('^cmd_extract/$', cmd_extract),
#	('^cmd_create_folder/$', cmd_create_folder),
#	('^cmd_create_file/$', cmd_create_file),
#	('^cmd_set_tags/$', cmd_set_tags),
#	('^cmd_get_tags/$', cmd_get_tags),
#	('^cmd_remove_tags/$', cmd_remove_tags),
#	('^cmd_delete_tags/$', cmd_delete_tags),
#	('^cmd_add_tags/$', cmd_add_tags),
#	('^cmd_get_tag_list/$', cmd_get_tag_list),
#	('^cmd_set_bookmark_doc/$', cmd_set_bookmark_doc),
#	('^cmd_get_bookmarks_doc/$', cmd_get_bookmarks_doc),
#	('^cmd_remove_bookmark_doc/$', cmd_remove_bookmark_doc),
#	('^cmd_set_bookmark_user/$', cmd_set_bookmark_user),
#	('^cmd_get_bookmarks_user/$', cmd_get_bookmarks_user),
#	('^cmd_remove_bookmark_user/$', cmd_remove_bookmark_user),
#	('^cmd_delete/$', cmd_delete),
#	('^cmd_empty_trash/$', cmd_empty_trash),
#	('^cmd_restore/$', cmd_restore),
#	('^cmd_rename/$', cmd_rename),
#	('^cmd_copy/$', cmd_copy),
#	('^cmd_move/$', cmd_move),
#	('^cmd_share_doc_user/$', cmd_share_doc_user),
#	('^cmd_share_doc_group/$', cmd_share_doc_group),
#	('^cmd_unshare_doc_user/$', cmd_unshare_doc_user),
#	('^cmd_unshare_doc_group/$', cmd_unshare_doc_group),
#	('^cmd_set_global/$', cmd_set_global),
#	('^cmd_search/$', cmd_search),
#	('^cmd_get_file/$', cmd_get_file),
#	('^cmd_get_thumbnail/$', cmd_get_thumbnail),
#	('^cmd_get_thumb_size/$', cmd_get_thumb_size),
#	('^cmd_get_image_size/$', cmd_get_image_size),
#	('^cmd_ls/$', cmd_ls),	
#	('^cmd_tree/$', cmd_tree),
#	('^cmd_create_group/$', cmd_create_group),
#	('^cmd_group_delete/$', cmd_delete_group),
#	('^cmd_add_to_group/$', cmd_add_to_group),
#	('^cmd_remove_from_group/$', cmd_remove_from_group),
#	('^cmd_include_group/$', cmd_include_group),
#	('^cmd_group_rename/$', cmd_group_rename),
#	('^cmd_get_group_users/$', cmd_get_group_users),
#	('^cmd_get_groups/$', cmd_get_groups),
#	('^cmd_get_group_membership/$', cmd_get_group_membership),
#	('^cmd_search_users/$', cmd_search_users),
#	('^cmd_wfm_version/$', cmd_wfm_version),
#	('^cmd_zip_files/$', cmd_zip_files),
#	('^cmd_report_content/$', cmd_report_content),
#	('^cmd_unflag_reported_content/$', cmd_unflag_reported_content),
#	('^admin_get/([a-zA-Z0-9]{33})/$', admin_get),
#	('^admin_delete/([a-zA-Z0-9]{33})/$', admin_delete),
#	('^cmd_calculate_size/$', cmd_calculate_size),
#)
)

urlpatterns += patterns('',
	('^cmd_ls/$', m_cmd_ls),
	('^cmd_detail/$', m_cmd_detail),
	('^cmd_delete/$', m_cmd_delete),
	('^cmd_rename/$', m_cmd_rename),
	('^cmd_restore/$', m_cmd_restore),
	('^cmd_create_folder/$', m_cmd_create_folder),
	('^cmd_empty_trash/$', m_cmd_empty_trash),
	('^init/$', init),
	(r'^accounts/login/$', 'django_cas.views.login'),
	(r'^accounts/logout/$', 'django_cas.views.logout'),
)

# vim: set noexpandtab:
