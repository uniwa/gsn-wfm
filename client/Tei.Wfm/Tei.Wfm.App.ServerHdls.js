Ext.apply(
  Tei.Wfm.App.prototype.serverHdls,
  {
	scope : this.scope,

	do_uploadDialog : function(){

		var upload_dialog = new Ext.ux.UploadDialog.Dialog({
			title: Messages.upload_file,
			
			//url: scope.serverURL + "/cmd_create_file/",
			url: scope.CMD.cmd_create_file,
			
			base_params: {action: 'upload', parent_id: scope.curTreeNodSel.realId},
			minWidth: 400,
			minHeight: 200,
			width: 400,
			height: 350,
			reset_on_hide: false,
			allow_close_on_upload: false,
			i18n: {
				'progress_waiting_text': Messages.ud_progress_waiting_text,
				'state_col_title': Messages.ud_state_col_title,
				'state_col_width': Messages.ud_state_col_width,
				'filename_col_title': Messages.ud_filename_col_title,
				'filename_col_width': Messages.ud_filename_col_width,
				'note_col_title': Messages.ud_note_col_title,
				'note_col_width': Messages.ud_note_col_width,
				'add_btn_text': Messages.ud_add_btn_text,
				'add_btn_tip': Messages.ud_add_btn_tip,
				'remove_btn_text': Messages.ud_remove_btn_text,
				'remove_btn_tip': Messages.ud_remove_btn_tip,
				'reset_btn_text': Messages.ud_reset_btn_text,
				'reset_btn_tip': Messages.ud_reset_btn_tip,
				'upload_btn_start_text': Messages.ud_upload_btn_start_text,
				'upload_btn_start_tip': Messages.ud_upload_btn_start_tip,
				'close_btn_text': Messages.ud_close_btn_text,
				'close_btn_tip': Messages.ud_close_btn_tip,
				'error_msgbox_title': Messages.ud_error_msgbox_title,
				'error_file_type_not_permitted': Messages.ud_error_file_type_not_permitted,
				'note_queued_to_upload': Messages.ud_note_queued_to_upload,
				'progress_uploading_text': Messages.ud_progress_uploading_text,
				'upload_btn_stop_text': Messages.ud_upload_btn_stop_text,
				'upload_btn_stop_tip': Messages.ud_upload_btn_stop_tip,
				'upload_btn_start_text': Messages.ud_upload_btn_start_text,
				'note_processing': Messages.ud_note_processing,
				'note_upload_success': Messages.ud_note_upload_success,
				'note_upload_error': Messages.ud_note_upload_error,
				'note_aborted': Messages.ud_note_aborted,
				'note_upload_failed': Messages.ud_note_upload_failed
			}
		});

		upload_dialog.show('upload_button');

		upload_dialog.on("uploadcomplete", function(){
			scope.fireEvent('loadDirContent',{'doc_id' : scope.curTreeNodSel.realId,'path' : scope.curTreeNodSel.path , 'group_id' : scope.curTreeNodSel.group_id });
		});

		upload_dialog.on("hide", function(){
				this.destroy(true);
		});
	},

	do_tagListDialog : function(){

		var list_dialog = new sch.wfm.components.ListTagDialog({
			title: 'Tag Clouds',
			id : 'tagListDialog',
			//doc_id : scope.selectedDocs[0].get('realId'),
			//doc_id : scope.propertyGrid.getSource().realId,
			doc_id : scope.selectedDocs.first.realId,
			arr_tag_list : scope.tagsStore,
			//arr_checked_tag_list : scope.selectedDocs[0].get('tags')
			//arr_checked_tag_list : scope.propertyGrid.getSource().tags
			arr_checked_tag_list : scope.selectedDocs.first.tags
		});

		list_dialog.show();

		list_dialog.on("clickCreateTag",function(){
			
			scope.fireEvent('promptCreateTag',null);
		});
												 
		list_dialog.on("clickApplyTags",function(){
			var p,r;
			var tags2remove = [];

			r = array_diff(this.arr_checked_tag_list,this.getSelectedTags());

			for(p in r)
			{
				tags2remove.push(r[p]);
			}
			
			var formatedTags2Add = implode('/',this.getSelectedTags());
			var formatedTags2Rem = implode('/',tags2remove);

			scope.fireEvent('processApplyTags',{'doc_id' : this.doc_id , 'tags2add' : formatedTags2Add, 'tags2remove' : formatedTags2Rem });
			
		});
	
		list_dialog.on("hide", function(){
			this.destroy(true);
		});		
	},
	
	/*--- SHARING TO GROUPS DIALOG WINDOW ( OBLOLETE ) ---*/
	do_groupsDialog : function(){

		var list_dialog = new sch.wfm.components.GroupsDialog({
			title: 'Groups',
			id : 'groupsDialog',
			//doc_id : scope.selectedDocs[0].get('realId'),
			//doc_id : scope.propertyGrid.getSource().realId,
			doc_id : scope.selectedDocs.first.realId,
			groupsCollection : scope.groupsStore,
			//initCheckedGroups : scope.selectedDocs[0].get('groups')
			//initCheckedGroups : scope.propertyGrid.getSource().groups
			initCheckedGroups : scope.selectedDocs.first.public.groups
		});

		list_dialog.show();

		//myabe useless
		list_dialog.on("clickCreateGroups",function(){
			
			//scope.fireEvent('promptCreateGroup',null);
		});
												 
		list_dialog.on("clickApplyGroups",function(){
			
			var p,r;
			var groups2unshare = [];
			var groups2share = this.getSelectedGroups();

			r = array_diff(this.initCheckedGroupsId,groups2share);

			for(p in r)	{
				groups2unshare.push(r[p]);
			}

			scope.fireEvent('processApplyGroups',{'doc_id' : this.doc_id , 'groups2share' : groups2share, 'groups2unshare' : groups2unshare });
		});

		list_dialog.on("hide", function(){
			this.destroy(true);
		});		
	},
	
	/*--- SHARING DIALOG WINDOW ---*/
	do_sharingDialog : function(activeTab){
		
		var pnlShareUsers = new sch.wfm.components.SharingUserPanel({
			title: Messages.users,
			id : 'pnlShareUsers',
			doc_id : scope.currDocId,
			initData : scope.selectedDocs.first.public.users,
			users2rem : [],
			hasChanges : false,
			monitorReq : null
		});

		pnlShareUsers.on("loadUsers",function(){
			pnlShareUsers.usersStore.loadData(pnlShareUsers.initData);
		});
		
		pnlShareUsers.on("addUser",function(data){

				var statusBar = pnlShareUsers.dataView.getBottomToolbar().txtAjaxMnt;
				
				var recIdx = pnlShareUsers.usersStore.find('username',data.get('uid'));
				
				if (recIdx != -1) {
					return;
				}

				scope.processManager.reset();
				
				scope.processManager.pushTask({
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_cmd_share_doc_user,
					cmd : scope.CMD.cmd_share_doc_user,
					params : {
						'doc_id' : pnlShareUsers.doc_id,
						'user' : data.get('uid')
					},
					onStart: function(){
						
						statusBar.setIconClass('loading');						
						statusBar.setText(Messages.sharing + '...');
						
						pnlShareUsers.searchField.list.mask(Messages.loading);
					},					
					onComplete : function(response,taskIndex,sendedData){
						
						if (response.success)
						{
							var objUser = {"username": sendedData.user};
							pnlShareUsers.usersStore.add( new pnlShareUsers.usersStore.recordType(objUser) );
							pnlShareUsers.hasChanges = true;
							
							statusBar.setIconClass('readyStatusBar');
							statusBar.setText(Messages.ready);
						}

						pnlShareUsers.searchField.list.unmask();
					}
				});

				scope.processManager.beginProcess();
		});

		pnlShareUsers.on("removeUser",function(data){

				var statusBar = pnlShareUsers.dataView.getBottomToolbar().txtAjaxMnt;
				
				scope.processManager.reset();
				
				scope.processManager.pushTask({
					state : 0,
					note : "scope.processManager.textLayout.waitingMsg",
					name : "Messages.process_cmd_unshare_doc_user",
					cmd : scope.CMD.cmd_unshare_doc_user,
					params : {
						'doc_id' : data.doc_id,
						'user' : data.user
					},
					onStart: function(){
						
						statusBar.setIconClass('loading');						
						statusBar.setText(Messages.loading);
					},					
					onComplete : function(response,taskIndex,sendedData){
						
						if (response.success)
						{
							var recIdx = pnlShareUsers.usersStore.find('username',sendedData.user);
							var rec2del = pnlShareUsers.usersStore.getAt(recIdx);
							pnlShareUsers.usersStore.remove(rec2del);
							
							pnlShareUsers.hasChanges = true;
							
							statusBar.setIconClass('readyStatusBar');
							statusBar.setText(Messages.ready);
						}
					}
				});

				scope.processManager.beginProcess();
		});

		var pnlShareGroups = new sch.wfm.components.SharingGroupPanel({
			title: Messages.groups,
			id : 'pnlGroups',	
			allGroups : scope.groupsStore2,
			doc_id : scope.currDocId,
			initSelectedGroups : scope.selectedDocs.first.public.groups,
			hasChanges : false
		});
		
		pnlShareGroups.on('saveChanges',function(){
												 
			/*-----------------------------------------------------------*/
			scope.processManager.reset();
			
			for (var i = 0; i < pnlShareGroups.groupsIdToUnShare.length; i++)
			{
				scope.processManager.pushTask({
					
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : "Messages.process_cmd_unshare_doc_group",
					cmd : scope.CMD.cmd_unshare_doc_group,
					params : {'doc_id': pnlShareGroups.doc_id, 'group_id': pnlShareGroups.groupsIdToUnShare[i]},
					onComplete : function(response,taskIndex,sendedData){
						if (response.success)
						{
							pnlShareGroups.groupsIdNow.remove(sendedData.group_id);
							pnlShareGroups.hasChanges = true;
						}
					}
				});
			}

			for (var i = 0; i < pnlShareGroups.groupsIdToShare.length; i++)
			{
				scope.processManager.pushTask({
					
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : "Messages.process_cmd_share_doc_group",
					cmd : scope.CMD.cmd_share_doc_group,
					params : {'doc_id': pnlShareGroups.doc_id,'group_id': pnlShareGroups.groupsIdToShare[i]},
					onComplete : function(response,taskIndex,sendedData){
						if (response.success)
						{
							pnlShareGroups.groupsIdNow.push(sendedData.group_id);
							pnlShareGroups.hasChanges = true;
						}
					}
				});
			}

			//scope.processManager.beginProcess();
			/*-----------------------------------------------------------*/	
			
			/*--- unsharing confs ---*/
			var  unshare_cb_start = function(){
				pnlShareGroups.updateStatus('start','Unsharing...');
			};

			var unshare_cb_success = function(response){
				if (response.success)
				{
					pnlShareGroups.groupsIdNow.remove(response.dataSend.group_id);
					pnlShareGroups.hasChanges = true;
				}
				else 
					pnlShareGroups.updateStatus('fail',response.status_msg);
			};

			var unshare_cb_fail = function(){
				pnlShareGroups.updateStatus('connection_problem',"Cannot connect to server");
			};

			var unshare_cb_eofq = function (response){
				if (response.success) {

					pnlShareGroups.groupsIdToUnShare.length = 0;

					//if (confs4share.groups2share.length > 0)
					if (pnlShareGroups.groupsIdToShare.length > 0)
						scope.fireEvent('shareDocGroups', confs4share);
					else
						pnlShareGroups.updateStatus('success',Messages.ready);
				}
				else 
					pnlShareGroups.updateStatus('fail',response.status_msg);
			};
			
			var confs4unshare = {
				'doc_id' : pnlShareGroups.doc_id, 
				'groups2unshare' : pnlShareGroups.groupsIdToUnShare,
				'cb_start' : unshare_cb_start,
				'cb_success' : unshare_cb_success,
				'cb_fail' : unshare_cb_fail,
				'cb_eofq' : unshare_cb_eofq
			};
			/*--- end unsharing confs ---*/
			
			/*--- sharing confs ---*/
			var  share_cb_start = function(){
				pnlShareGroups.updateStatus('start','Sharing...');
			};

			var share_cb_success = function(response){
				if (response.success)
				{
					pnlShareGroups.groupsIdNow.push(response.dataSend.group_id);
					pnlShareGroups.hasChanges = true;
				}
				else 
					pnlShareGroups.updateStatus('fail',response.status_msg);
			};

			var share_cb_fail = function(){
				pnlShareGroups.updateStatus('connection_problem',"Cannot connect to server");
			};

			var share_cb_eofq = function (response){
				if (response.success) {
					pnlShareGroups.updateStatus('success',Messages.ready);
					pnlShareGroups.groupsIdToShare.length = 0;
				}
				else 
					pnlShareGroups.updateStatus('fail',response.status_msg);
			};

			var confs4share = {
				'doc_id' : pnlShareGroups.doc_id, 
				'groups2share' : pnlShareGroups.groupsIdToShare, 
				'cb_start' : share_cb_start,
				'cb_success' : share_cb_success,
				'cb_fail' : share_cb_fail,
				'cb_eofq' : share_cb_eofq
			};
			/*--- end sharing confs ---*/			
			
			if (pnlShareGroups.groupsIdToUnShare.length > 0) {
				scope.fireEvent('unshareDocGroups', confs4unshare);
			}
			else {
				if (pnlShareGroups.groupsIdToShare.length > 0)
				scope.fireEvent('shareDocGroups', confs4share);
			}
		});
		
		var tabPanel = new Ext.TabPanel({
			activeItem : activeTab,
			border : false,
			items : [pnlShareUsers,pnlShareGroups]
		}); 

		var sharing_dialog = new Ext.Window({
			width: 700,
			layout : 'fit',
			title: Messages.share_file,
			items : tabPanel,
			modal:true
		});

		sharing_dialog.show();

		sharing_dialog.on("hide", function(){
			this.destroy(true);

			if (pnlShareUsers.hasChanges || pnlShareGroups.hasChanges)
			{
				pnlShareUsers.destroy(true);
				pnlShareGroups.destroy(true);
				
				//scope.fireEvent('loadTreeNodes',null);
				
				/*-----*/
				scope.processManager.reset();
				scope.processManager.fillTaskStore([{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_init_cmd_ls,
					cmd : scope.CMD.cmd_ls,
					params : {
						'doc_id' : scope.curTreeNodSel.realId,
						'path' : scope.curTreeNodSel.path,
						'group_id' : scope.curTreeNodSel.group_id
					},
					onStart: function(){
		
						scope.clientHdls.updateStatus('start',Messages.loading,'center_region');
					},					
					onComplete : function(response,taskIndex,sendedData){
															
						scope.currentLsArgs = sendedData;

						if (response.success)
						{
							scope.fireEvent('loadDirContentComplete',response);
							scope.clientHdls.updateStatus('success',Messages.ready,'center_region');
						}
					}
				}]);
				
				scope.processManager.beginProcess();
				/*-----*/
			}
		});
	},

	do_manageGroupUsers : function(){

		var pnlManageUsers = new sch.wfm.components.SharingUserPanel({
			title: 'User(s)',
			id : 'pnlManageUsers',
			group_id : scope.selectedDocs.first.realId,
			initData  : [],
			users2rem : [],
			hasChanges : false
		});
		
		pnlManageUsers.on("loadUsers",function(){

			var reqConfs = {
						'data' : {'group_id' : pnlManageUsers.group_id},
						'objQueue' : null,
						'cb_start' : function(){
							//pnlManageUsers.updateStatus('start',Messages.loading_users);
						},
						'cb_success' : function(response){
							if (response.success)
							{
								for(var i = 0; i < response.users.length; i++) {
									pnlManageUsers.initData.push({'username':response.users[i]});
								}

								pnlManageUsers.usersStore.loadData(pnlManageUsers.initData);

								//pnlManageUsers.updateStatus('success',Messages.ready);
							}
							else
							{
								//pnlManageUsers.updateStatus('fail',response.status_msg);
							}
						},
						'cb_fail' : function(){
							//pnlManageUsers.updateStatus('connection_problem',"Cannot connect to server");
						},
						'cb_eofq' : scope.helperFuncs.endAjaxQueue
			};

			scope.serverReqs.cmd_get_group_users(reqConfs);
			
		});
		
		pnlManageUsers.on("addUser",function(data){

				var statusBar = pnlManageUsers.dataView.getBottomToolbar().txtAjaxMnt;
				
				var recIdx = pnlManageUsers.usersStore.find('username',data.get('uid'));
				
				if (recIdx != -1) {
					return;
				}

				scope.processManager.reset();
				
				scope.processManager.pushTask({
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : "Messages.process_cmd_share_doc_user",
					cmd : scope.CMD.cmd_add_to_group,
					params : {
						'group_id' : pnlManageUsers.group_id,
						'user_list' : data.get('uid')
					},
					onStart: function(){
						
						statusBar.setIconClass('loading');						
						statusBar.setText(Messages.sharing + '...');
						
						pnlManageUsers.searchField.list.mask(Messages.loading);
					},					
					onComplete : function(response,taskIndex,sendedData){
						
						if (response.success)
						{
							var objUser = {"username": sendedData.user_list};
							pnlManageUsers.usersStore.add( new pnlManageUsers.usersStore.recordType(objUser) );
							pnlManageUsers.hasChanges = true;
							
							statusBar.setIconClass('readyStatusBar');
							statusBar.setText(Messages.ready);
						}

						pnlManageUsers.searchField.list.unmask();
					}
				});

				scope.processManager.beginProcess();
		});
		
		pnlManageUsers.on("removeUser",function(data){

				var statusBar = pnlManageUsers.dataView.getBottomToolbar().txtAjaxMnt;
				
				scope.processManager.reset();
				
				scope.processManager.pushTask({
					state : 0,
					note : "scope.processManager.textLayout.waitingMsg",
					name : "Messages.process_cmd_unshare_doc_user",
					cmd : scope.CMD.cmd_remove_from_group,
					params : {
						'group_id' : data.group_id,
						'user_list' : data.user
					},
					onStart: function(){
						
						statusBar.setIconClass('loading');						
						statusBar.setText(Messages.loading);
					},					
					onComplete : function(response,taskIndex,sendedData){
						
						if (response.success)
						{
							var recIdx = pnlManageUsers.usersStore.find('username',sendedData.user_list);
							var rec2del = pnlManageUsers.usersStore.getAt(recIdx);
							pnlManageUsers.usersStore.remove(rec2del);
							
							pnlManageUsers.hasChanges = true;
							
							statusBar.setIconClass('readyStatusBar');
							statusBar.setText(Messages.ready);
						}
					}
				});

				scope.processManager.beginProcess();
		});
		
		var manageUsers_dialog = new Ext.Window({
			width: 700,
			layout : 'fit',
			title: 'Share document',
			items : [pnlManageUsers],
			modal:true
		});

		manageUsers_dialog.show();

		manageUsers_dialog.on("hide", function(){
			this.destroy(true);

			if (pnlManageUsers.hasChanges)
				scope.fireEvent('loadTreeNodes',null);	
		});

	}
	//next fn

  }
);
