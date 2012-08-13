Ext.apply(
	Tei.Wfm.App.prototype.CMD,
	{
		scope : this.scope,
		
		init : function(){
			
			this.cmd_get_userinfo = scope.serverURL + '/cmd_get_userinfo/';
		
                        this.cmd_regenerate_token = scope.serverURL + '/cmd_regenerate_token/';
		
			this.cmd_get_tag_list = scope.serverURL + '/cmd_get_tag_list/';
		
			this.cmd_get_groups = scope.serverURL + '/cmd_get_groups/';
		
			this.cmd_tree = scope.serverURL + '/cmd_tree/';
		
			this.cmd_ls = scope.serverURL + '/cmd_ls/';
		
			this.cmd_create_folder = scope.serverURL + '/cmd_create_folder/';
		
			this.cmd_delete = scope.serverURL + '/cmd_delete/';
			
			this.cmd_copy = scope.serverURL + '/cmd_copy/';

			this.cmd_move = scope.serverURL + '/cmd_move/';

			this.cmd_rename = scope.serverURL + '/cmd_rename/';

			this.cmd_group_delete = scope.serverURL + '/cmd_group_delete/';

			this.cmd_unshare_doc_group = scope.serverURL + '/cmd_unshare_doc_group/';

			this.cmd_share_doc_group = scope.serverURL + '/cmd_share_doc_group/';

			this.cmd_unshare_doc_school = scope.serverURL + '/cmd_unshare_doc_school/';

			this.cmd_share_doc_school = scope.serverURL + '/cmd_share_doc_school/';

			this.cmd_extract = scope.serverURL + '/cmd_extract/';

			this.cmd_restore = scope.serverURL + '/cmd_restore/';

			this.cmd_set_bookmark_doc = scope.serverURL + '/cmd_set_bookmark_doc/';

			this.cmd_remove_bookmark_doc = scope.serverURL + '/cmd_remove_bookmark_doc/';

			this.cmd_group_rename = scope.serverURL + '/cmd_group_rename/';
			
			this.cmd_delete_tags = scope.serverURL + '/cmd_delete_tags/';
			
			this.cmd_set_global = scope.serverURL + '/cmd_set_global/';
			
			this.cmd_empty_trash = scope.serverURL + '/cmd_empty_trash/';
			
			this.cmd_zip_files = scope.serverURL + '/cmd_zip_files/';
			
			this.cmd_unshare_doc_user = scope.serverURL + '/cmd_unshare_doc_user/';

                        this.cmd_search_users = scope.serverURL + '/cmd_search_users/';

			this.cmd_search_schools = scope.serverURL + '/cmd_search_schools/';
			
			this.cmd_share_doc_user = scope.serverURL + '/cmd_share_doc_user/';
			
			this.cmd_add_to_group = scope.serverURL + '/cmd_add_to_group/';
			
			this.cmd_get_group_users = scope.serverURL + '/cmd_get_group_users/';
			
			this.cmd_remove_from_group = scope.serverURL + '/cmd_remove_from_group/';
			
			this.cmd_create_file = scope.serverURL + '/cmd_create_file/';
                        
                        this.cmd_get_notifications = scope.serverURL + '/cmd_get_notifications/';
                        
                        this.cmd_mark_notifications_read = scope.serverURL + '/cmd_mark_notifications_read/';
                        
                        this.cmd_report_content = scope.serverURL + '/cmd_report_content/';
                        
		},
		
		/*--------------------------------------------------*/
		initDebug : function(){
			
			this.cmd_get_userinfo = scope.serverURL + '/tmp/cmd_get_userinfo.html';
		
			this.cmd_get_tag_list = scope.serverURL + '/tmp/cmd_get_tag_list.html';
		
			this.cmd_get_groups = scope.serverURL + '/tmp/cmd_get_groups.html';
		
			this.cmd_tree = scope.serverURL + '/tmp/cmd_tree.html';
		
			this.cmd_ls = scope.serverURL + '/tmp/cmd_ls.html';
		
			this.cmd_create_folder = scope.serverURL + '/tmp/cmd_create_folder.html';
		
			this.cmd_delete = scope.serverURL + '/tmp/cmd_delete.html';
			
			this.cmd_copy = scope.serverURL + '/tmp/cmd_copy.html';

			this.cmd_move = scope.serverURL + '/tmp/cmd_move.html';
			
			this.cmd_rename = scope.serverURL + '/tmp/cmd_rename.html';
			
			this.cmd_group_rename = scope.serverURL + '/tmp/cmd_rename.html';
			
			this.cmd_group_delete = scope.serverURL + '/tmp/cmd_group_delete.html';
			
			this.cmd_unshare_doc_group = scope.serverURL + '/tmp/cmd_unshare_doc_group.html';
			
			this.cmd_share_doc_group = scope.serverURL + '/tmp/cmd_share_doc_group.html';
			
			this.cmd_extract = scope.serverURL + '/tmp/cmd_extract.html';
			
			this.cmd_restore = scope.serverURL + '/tmp/cmd_restore.html';
			
			this.cmd_set_bookmark_doc = scope.serverURL + '/tmp/cmd_set_bookmark_doc.html';
			
			this.cmd_remove_bookmark_doc = scope.serverURL + '/tmp/cmd_remove_bookmark_doc.html';
			
			this.cmd_delete_tags =  scope.serverURL + '/tmp/cmd_delete_tags.html';
			
			this.cmd_set_global = scope.serverURL + '/tmp/cmd_set_global.html';
			
			this.cmd_empty_trash = scope.serverURL + '/tmp/cmd_empty_trash.html';
			
			this.cmd_zip_files = scope.serverURL + '/tmp/cmd_zip_files.html';
			
			this.cmd_unshare_doc_user = scope.serverURL + '/tmp/cmd_unshare_doc_user.html';

                        this.cmd_unshare_doc_school = scope.serverURL + '/tmp/cmd_unshare_doc_school.html';

			this.cmd_search_users = scope.serverURL + '/tmp/cmd_search_users.html';

                        this.cmd_search_schools = scope.serverURL + '/tmp/cmd_search_schools.html';

			this.cmd_share_doc_user = scope.serverURL + '/tmp/cmd_share_doc_user.html';

                        this.cmd_share_doc_school = scope.serverURL + '/tmp/cmd_share_doc_school.html';

			this.cmd_add_to_group = scope.serverURL + '/tmp/cmd_add_to_group.html';
			
			this.cmd_get_group_users = scope.serverURL + '/tmp/cmd_get_group_users.html';
			
			this.cmd_remove_from_group = scope.serverURL + '/tmp/cmd_remove_from_group.html';
			
			this.cmd_create_file = scope.serverURL + '/tmp/cmd_create_file.php';
                        
                        this.cmd_get_notifications =  scope.serverURL + '/tmp/cmd_get_notifications.html';
                        
                        this.cmd_mark_notifications_read = scope.serverURL + '/tmp/cmd_mark_notifications_read.html';
		}
		/*--------------------------------------------------*/
	}
);
