// JavaScript Document
Ext.apply(Tei.Wfm.App.prototype.UI,
	{
		/*
		init_MenuBar : function(){
									
			scope.menuBar = new Ext.Toolbar({
			items:
			[
			 	{
					xtype: 'tbsplit',
					text: Messages.menu_file,
					menu: [
							{
								cmd : ['cmd_create_folder'],
								text: Messages.create_folder,
								tooltip: Messages.create_folder,
								iconCls:'mkDir',
								handler: function(){
									scope.fireEvent('confirmCreateFolder',null);
								}
							},
							{
								cmd : ['cmd_create_file'],
								text: Messages.upload_file,
								tooltip: Messages.upload_file,
								iconCls:'addFile',
								
								handler: function(){
									scope.serverHdls.do_uploadDialog.call(scope);
								}
							},
							{
								cmd : ['cmd_get_file'],
								text: Messages.download_file,
								tooltip: Messages.download_file,
								iconCls:'download',
								
								handler: function(){
									scope.serverReqs.cmd_get_file(scope.selectedDocs[0].get('realId'));
								}
							}			
						   ]
				},
				'&nbsp;',
				{
					xtype: 'tbsplit',
					text: Messages.menu_edit,
					menu: [
							{
								cmd : ['prepareDocsIdList'],
								text: Messages.cut,
								tooltip: Messages.cut,
								iconCls:'cut',
								
								handler:function(){ 
									scope.clientHdls.prepareDocsIdList.call(scope,"move");
								}
							},
							{
								cmd : ['prepareDocsIdList'],
								text: Messages.copy,
								tooltip: Messages.copy,
								iconCls:'copy',
								
								handler:function(){ 
									scope.clientHdls.prepareDocsIdList.call(scope,"copy");
								}
							},
							{
								cmd : ['cmd_copy','cmd_move'],
								text: Messages.paste,
								tooltip: Messages.paste,
								iconCls:'paste',
								
								handler:function(){ 
									if (scope.action4doc_id_list == "copy")
										scope.fireEvent('copyFiles',null);
									else if (scope.action4doc_id_list == "move")
										scope.fireEvent('moveFiles',null);
								}
							},
							{
								cmd : ['cmd_rename'],
								text: Messages.rename,
								tooltip: Messages.rename,
								iconCls:'rename',
								
								handler:function(e){
									scope.listView.on('beforeedit',function(e){ scope.listView.getColumnModel().setEditable(0, true); return true; },scope.listView);
									scope.listView.getColumnModel().setEditable(0, true);
									scope.listView.startEditing(scope.gridLastSelectedRowIndex,0);
								}
							},		
							{
								cmd : ['cmd_delete'],
								text: Messages.delete_,
								tooltip: Messages.delete_,
								iconCls:'rmDoc',
								
								handler: function(){
									scope.fireEvent('confirmDeleteDocs',{'docs':scope.selectedDocs,'perm':0});
								}
							}
						   ]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_view,
					menu : [
						{
							cmd : ['cmd_ls'],
							text : Messages.details,
							tooltip : Messages.details,
							iconCls:'listView',
							handler : function(){

								scope.filesStore.removeAll();
								scope.clientHdls.setViewMode("details");
						
								var eventData = null;

								eventData = {'doc_id'   : scope.curTreeNodSel.realId,
											 'path'     : scope.curTreeNodSel.path,
											 'group_id' : scope.curTreeNodSel.group_id};
									
								scope.fireEvent('loadDirContent',eventData);
							}
						},
						{
							cmd : ['cmd_ls'],
							text : Messages.thumbnails,
							tooltip : Messages.thumbnails,
							iconCls:'listView',
							handler : function(){

								scope.filesStore.removeAll();
								scope.clientHdls.setViewMode("thumbs");
						
								var eventData = null;

								eventData = {'doc_id'   : scope.curTreeNodSel.realId,
											 'path'     : scope.curTreeNodSel.path,
											 'group_id' : scope.curTreeNodSel.group_id};
									
								scope.fireEvent('loadDirContent',eventData);
							}
						},						
						'-',
						{
							cmd : ['cmd_ls'],
							text: Messages.reload_,

							tooltip: Messages.reload_,
							iconCls:'reload',
		
							handler:function(){
		
								var eventData = null;
		
								eventData = {'doc_id'   : scope.curTreeNodSel.realId,
											 'path'     : scope.curTreeNodSel.path,
											 'group_id' : scope.curTreeNodSel.group_id};
											
								scope.fireEvent('loadDirContent',eventData);
							}
						}
					]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_tags,
					menu : [
							{
								cmd : ['cmd_set_tags'],
								text : Messages.tag_selected,
								tooltip : Messages.tag_selected,
								iconCls:'tags',
			
								handler:function(){
									scope.serverHdls.do_tagListDialog.call(scope);
								}
							},
							{
								cmd : ['cmd_add_tags'],
								text: Messages.tag_create,
								tooltip: Messages.tag_create,
								iconCls:'mkTag',
								
								handler: function(){
									scope.fireEvent('promptCreateTag',null);
								}	
							},
							{
								cmd : ['cmd_delete_tags'],
								text: Messages.tag_delete,
								tooltip: Messages.tag_delete,
								iconCls:'rmTag',
			
								handler: function(){
									scope.fireEvent('confirmDeleteTags',{'tags':scope.selectedDocs});
								}
							}
					]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_bookmarks,
					menu : [
						{
							cmd : ['cmd_set_bookmark'],
							text: Messages.bookmark_selected,
							tooltip: Messages.bookmark_selected,
							iconCls:'addBookmark',
							
							handler: function(){
								scope.fireEvent('bookmarkDoc',{'doc_id' : scope.selectedDocs[0].get('realId')});
							}
						},
						{
							cmd : ['cmd_remove_bookmark'],
							text: Messages.bookmark_delete,
							tooltip: Messages.bookmark_delete,
							iconCls:'deleteBookmark',
							
							handler: function(){
								scope.fireEvent('removeBookmarkDoc',{'bookmarks':scope.selectedDocs});
							}
						}
					]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_groups,
					menu : [
						{
							cmd : ['cmd_create_group'],
							text: Messages.group_create,
							tooltip: Messages.group_create,
							iconCls:'mkGroup',
							
							handler: function(){
								scope.fireEvent('promptCreateGroup',null);
							}
						},
						{
							cmd : ['cmd_group_delete'],
							text: Messages.group_delete,
							tooltip: Messages.group_delete,
							iconCls:'rmGroup',
							
							handler: function(){
								scope.fireEvent('confirmDeleteGroups',{'groups':scope.selectedDocs});
							}
						},
						{
							cmd : ['cmd_share_doc_group'],
							text :  Messages.group_share,
							tooltip : Messages.group_share,
							iconCls:'shareToGroups',
		
							handler:function(){
								scope.serverHdls.do_groupsDialog.call(scope);
							}
						}
					]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_tools,
					menu : [
						{
							cmd : ['cmd_empty_trash'],
							text: Messages.empty_trash,
							tooltip: Messages.empty_trash,
							iconCls:'emptyTrash',
		
							handler: function(){
								scope.fireEvent('confirmEmptyTrash',null);
							}
						},
						{
							cmd : ['cmd_restore'],
							text: Messages.restore,
							tooltip: Messages.restore,
							iconCls:'restore',
		
							handler: function(){
							}
						},
						'-',
						{
							cmd : ['cmd_get_thumbnail'],
							text: Messages.preview,
							tooltip: Messages.preview,
							iconCls:'preview',
							
							handler: function(){
								if ( !scope.selectedDocs[0] ) {
									Ext.Msg.alert( Messages.msgbox_warning, Messages.msg_no_files_selected );
									return;
								}	
								scope.serverReqs.cmd_get_thumbnail(scope.selectedDocs[0].get('realId'));
							}
						},			
						{
							cmd : ['cmd_set_global'],
							text: Messages.publish,
							tooltip: Messages.publish,
							iconCls:'publish',
		
							handler: function(){
								scope.fireEvent('publish',{'glob' : 1});
							}
						},
						{
							cmd : ['cmd_extract'],
							text: Messages.extract,
							tooltip: Messages.extract,
							iconCls:'extract',
							
							handler: function(){
								scope.fireEvent('extract',{'doc_id' : scope.selectedDocs[0].get('realId')});
							}
						}
					]
				},
				'&nbsp;',
				{
					xtype : 'tbsplit',
					text : Messages.menu_help,
					menu : [
						{
							xtype: 'box',
							autoEl: { 
								tag: 'a',
								href: 'http://helpdesk.sch.gr',
								target: '_blank',
								html: Messages.report_bug
							},
							cmd : ['cmd_report_bug'],
							text: Messages.report_bug,
							tooltip: Messages.report_bug,
							iconCls:'',
		
							handler: function(){
								scope.fireEvent('reportBug',null);
							}
						}
					]
				},
				'->',
				{
					xtype : 'tbbutton',
					text : Messages.logout,

					handler : function(){
						window.location.href = scope.serverURL + '/accounts/logout/';
					}
				}				
				
			]});			
		},
		*/
		
		init_ToolBar : function(){
			
			scope.toolBar = new Ext.Toolbar({
				id : 'appToolbar',
				enableOverflow: true,

				defaults:{
					hidden: true,
					scale:'medium'
				},
				items:[
					
					{id: 'tb_upload',text: Messages.upload_file, iconCls: 'addFile'/*,
						listeners  :{
							'click': function(){
								scope.SWFUploader.setPostParams({'parent_id' : scope.curTreeNodSel.realId, 'action': 'upload'});
								//console.log(scope.curTreeNodSel.realId);
							},
							'render' : function(btn){
								Ext.getCmp('tb_upload').el.child('em').insertFirst({tag: 'span', id: 'btnUploadHolder'});
								
								scope.SWFUploader = new SWFUpload({
														 	file_post_name : "file_data",
															
															button_placeholder_id:"btnUploadHolder", 
															
															//upload_url : "tmp/upload.php", 
															upload_url: scope.serverURL + "/cmd_create_file/",
															
															flash_url : "SWFUploadv2.2.0.1/Flash/swfupload.swf",
															
															//file_size_limit : "20 MB",
															
															button_width: 136,
															
															button_height: 24,
															
															button_cursor : SWFUpload.CURSOR.HAND,
															
															button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
															
															file_queue_error_handler : function(){},
															
															file_dialog_complete_handler : function(numFilesSelected, numFilesQueued){
																
																//console.log(numFilesSelected);
																
																if (numFilesSelected > 0){
																	scope.clientHdls.updateStatus('start',Messages.loading,'center_region');
																	this.startUpload();
																}

															},
															
															upload_progress_handler : function(file, bytesLoaded){
																//console.log(file);
															},
															
															upload_error_handler : function(){},
															
															upload_success_handler : function(file, serverData){
																
																//console.log(Ext.decode(serverData));
																//console.log(file);
															},
															
															upload_complete_handler : function(file){
																if (this.getStats().files_queued > 0){
																	this.startUpload();
																}
																else {
																	scope.clientHdls.updateStatus('success',Messages.ready,'center_region');
																	scope.fireEvent('loadDirContent',scope.currentLsArgs);
																}
															}
														});
							}
						}*/
					},
					{id: 'tb_emptyTrash',text: Messages.empty_trash, iconCls: 'emptyTrash', hidden:true},
					{id: 'tb_cmd_newFolder',text: Messages.cmdNewFolder,iconCls: 'newFolder', anchorMenu: 'fileMenu'},

					{id: 'tb_cmd_renameFile', text: Messages.cmdRename, iconCls: 'rename', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_deleteFile', text: Messages.cmdDelete, iconCls: 'delete', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_copy', text: Messages.cmdCopy, iconCls: 'copy', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_cut', text: Messages.cmdCut, iconCls: 'cut', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_paste', text: Messages.cmdPaste , iconCls: 'paste', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_zip', text: Messages.cmdZip, iconCls: 'zip', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_unzip', text: Messages.cmdUnzip, iconCls: 'unzip', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_download', text: Messages.cmdDownload, iconCls: 'download', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_view', text: Messages.cmdView, iconCls: 'view', anchorMenu: 'fileMenu'}, 
					{id: 'tb_cmd_restore', text: Messages.cmdRestore, iconCls: 'restore', anchorMenu: 'fileMenu'},

					{id: 'tb_cmd_sharing', text: Messages.cmdSharing, iconCls: 'sharing', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_tags', text: Messages.cmdTags, iconCls: 'tags', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_addStar', text: Messages.cmdAddStart, iconCls: 'addStar', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_removeStar', text: Messages.cmdRemoveStart, iconCls: 'removeStar', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_publish', text: Messages.cmdPublish, iconCls: 'publish', anchorMenu: 'fileMenu'},
					{id: 'tb_cmd_unPublish', text: Messages.cmdUnPublish, iconCls: 'unpublish', anchorMenu: 'fileMenu'},

					{id: 'tb_cmd_newTag',text: Messages.cmdNewTag,iconCls: 'newTag', anchorMenu: 'tagMenu'},
					{id: 'tb_cmd_deleteTag', text: Messages.cmdDelete, iconCls: 'deleteTag', anchorMenu: 'tagMenu'},

					{id: 'tb_cmd_newGroup',text: Messages.cmdNewGroup,iconCls: 'newGroup', anchorMenu: 'groupMenu'},
					{id: 'tb_cmd_deleteGroup', text: Messages.cmdDeleteGroup, iconCls: 'deleteGroup', anchorMenu: 'groupMenu'},
					{id: 'tb_cmd_renameGroup', text: Messages.cmdRenameGroup, iconCls: 'renameGroup', anchorMenu: 'groupMenu'},
					{id: 'tb_cmd_manageGroupUsers', text: Messages.cmdManageGroupUsers, iconCls: 'manageGroupUsers', anchorMenu: 'groupMenu'},
					
					'->',

					{
						iconCls: 'selectall',
						id: 'select',
						scale:'small',
						menu: new Ext.menu.Menu({
		    				items: 
							[
								{
									text: 'Select All',
									handler: function() {
										scope.listView.panel.selModel.selectAll();
									}
								},
								{
									text: 'Deselect All',
									handler: function() {
										scope.listView.panel.selModel.clearSelections();
									}
								}
							]
						}),
						hidden:false
					},
					
					{xtype: 'tbseparator',hidden: false},

					{id: 'tbarView-thumbnails', iconCls: 'thumbs', toggleGroup: 'view', enableToggle: true, hidden: false , scale:'small'},
					{id: 'tbarView-list', iconCls: 'detailed', toggleGroup: 'view', enableToggle: true, hidden: false, scale:'small'},					

					{xtype: 'tbseparator',hidden: false},

					{id: 'tb_reload',text: Messages.reload_, iconCls: 'reload', hidden: false}
				]
			});

			scope.toolBar.addEvents('refresh',true);

			scope.toolBar.on('afterlayout',function(){
				var w = this.ownerCt.lastSize.width;
				this.setWidth(w);
			});
			
			scope.toolBar.on('refresh',function(){

					var menu = scope.toolBar;

					menu.findById('tb_upload').setVisible(scope.state.cmd.addFile);
					menu.findById('tb_emptyTrash').setVisible(scope.state.cmd.emptyTrash);
					menu.findById('tb_cmd_newFolder').setVisible(scope.state.cmd.newFolder);
					menu.findById('tb_cmd_renameFile').setVisible(scope.state.cmd.renameDoc);
					menu.findById('tb_cmd_deleteFile').setVisible(scope.state.cmd.deleteDoc);
					menu.findById('tb_cmd_copy').setVisible(scope.state.cmd.copy);
					menu.findById('tb_cmd_cut').setVisible(scope.state.cmd.cut);
					menu.findById('tb_cmd_paste').setVisible(scope.state.cmd.paste);
					menu.findById('tb_cmd_zip').setVisible(scope.state.cmd.zip);
					menu.findById('tb_cmd_unzip').setVisible(scope.state.cmd.unzip);
					menu.findById('tb_cmd_download').setVisible(scope.state.cmd.download);
					menu.findById('tb_cmd_view').setVisible(scope.state.cmd.view);
					menu.findById('tb_cmd_restore').setVisible(scope.state.cmd.restore);
					menu.findById('tb_cmd_sharing').setVisible(scope.state.cmd.share);
					menu.findById('tb_cmd_tags').setVisible(scope.state.cmd.setTags);
					menu.findById('tb_cmd_addStar').setVisible(scope.state.cmd.addStar);
					menu.findById('tb_cmd_removeStar').setVisible(scope.state.cmd.removeStar);
					menu.findById('tb_cmd_publish').setVisible(scope.state.cmd.publish);
					menu.findById('tb_cmd_unPublish').setVisible(scope.state.cmd.unPublish);
					menu.findById('tb_cmd_newTag').setVisible(scope.state.cmd.newTag);
					menu.findById('tb_cmd_deleteTag').setVisible(scope.state.cmd.deleteTag);
					menu.findById('tb_cmd_newGroup').setVisible(scope.state.cmd.newGroup);
					menu.findById('tb_cmd_renameGroup').setVisible(scope.state.cmd.renameGroup);
					menu.findById('tb_cmd_deleteGroup').setVisible(scope.state.cmd.deleteGroup);
					menu.findById('tb_cmd_manageGroupUsers').setVisible(scope.state.cmd.manageGroupUsers);
					//menu.findById('tb_cmd_logout').setVisible(scope.state.cmd.logout);
			}); 			

			Ext.each(scope.toolBar.items,function(item,index){

				scope.toolBar.get(index).on('click',function(){

					switch (this.id) 
					{		
						case 'tb_reload':
							scope.fireEvent('loadDirContent',scope.currentLsArgs);
						break;

						case 'tb_upload':
							scope.serverHdls.do_uploadDialog.call(scope);
						break;

						case 'tb_emptyTrash':
							scope.fireEvent('confirmEmptyTrash',null);
						break;

						case 'tbarView-thumbnails':
							scope.UI.changeView('thumbnails');
						break;

						case 'tbarView-list':
							scope.UI.changeView('list');
						break;

						case 'select':
						break;

						default:
							var refId = substr(this.id,3,100);
							var refMenu = Ext.getCmp(this.anchorMenu);
							var refItem = refMenu.items.get(refId)
							refItem.fireEvent('click',null);
							refMenu.fireEvent('itemclick',refItem);
						break;	
					}					
					
				},scope.toolBar.get(index));
			});

			//scope.toolBar.fireEvent('refresh',null);
		},

		init_fileMenu : function(){

			return new Ext.menu.Menu({
				id : 'fileMenu',
				items : [
					{id: 'cmd_newFolder',text: Messages.cmdNewFolder,iconCls: 'newFolder'}, '-',
					{id: 'cmd_renameFile', text: Messages.cmdRename, iconCls: 'rename'},
					{id: 'cmd_deleteFile', text: Messages.cmdDelete, iconCls: 'delete'},
					{id: 'cmd_copy', text: Messages.cmdCopy, iconCls: 'copy'},
					{id: 'cmd_cut', text: Messages.cmdCut, iconCls: 'cut'},
					{id: 'cmd_paste', text: Messages.cmdPaste , iconCls: 'paste'},
					{id: 'cmd_zip', text: Messages.cmdZip, iconCls: 'zip'},
					{id: 'cmd_unzip', text: Messages.cmdUnzip, iconCls: 'unzip'},
					{id: 'cmd_download', text: Messages.cmdDownload, iconCls: 'download'},
					{id: 'cmd_view', text: Messages.cmdView, iconCls: 'view'}, 
					{id: 'cmd_restore', text: Messages.cmdRestore, iconCls: 'restore'},
					'-',
					{id: 'cmd_sharing', text: Messages.cmdSharing, iconCls: 'sharing'},
					{id: 'cmd_tags', text: Messages.cmdTags, iconCls: 'tags'},
					{id: 'cmd_addStar', text: Messages.cmdAddStart, iconCls: 'addStar'},
					{id: 'cmd_removeStar', text: Messages.cmdRemoveStart, iconCls: 'removeStar'},
					
					{id: 'cmd_publish', text: Messages.cmdPublish, iconCls: 'publish'},
					{id: 'cmd_unPublish', text: Messages.cmdUnPublish, iconCls: 'unpublish'}
					//'-',
					//{id: 'cmd_select-all-files', text: Messages.cmdSelectAll, iconCls: 'selectall'},
					//'-'
					//{id: 'cmd_logout', text: Messages.logout, iconCls: 'logout'}
				],
				listeners : {
					beforeshow : function(menu){
							menu.items.get('cmd_newFolder').setDisabled(!scope.state.cmd.newFolder);
							menu.items.get('cmd_renameFile').setDisabled(!scope.state.cmd.renameDoc);
							menu.items.get('cmd_deleteFile').setDisabled(!scope.state.cmd.deleteDoc);
							menu.items.get('cmd_copy').setDisabled(!scope.state.cmd.copy);
							menu.items.get('cmd_cut').setDisabled(!scope.state.cmd.cut);
							menu.items.get('cmd_paste').setDisabled(!scope.state.cmd.paste);
							menu.items.get('cmd_zip').setDisabled(!scope.state.cmd.zip);							
							menu.items.get('cmd_unzip').setDisabled(!scope.state.cmd.unzip);
							menu.items.get('cmd_download').setDisabled(!scope.state.cmd.download);
							menu.items.get('cmd_view').setDisabled(!scope.state.cmd.view);
							menu.items.get('cmd_sharing').setDisabled(!scope.state.cmd.share);
							menu.items.get('cmd_tags').setDisabled(!scope.state.cmd.setTags);
							
							menu.items.get('cmd_addStar').setDisabled(!scope.state.cmd.addStar);
							menu.items.get('cmd_addStar').setVisible(scope.state.cmd.addStar);
														
							menu.items.get('cmd_removeStar').setDisabled(!scope.state.cmd.removeStar);
							menu.items.get('cmd_removeStar').setVisible(scope.state.cmd.removeStar);
							
							menu.items.get('cmd_restore').setDisabled(!scope.state.cmd.restore);
							menu.items.get('cmd_restore').setVisible(scope.state.cmd.restore);
																					
							
							menu.items.get('cmd_publish').setDisabled(!scope.state.cmd.publish);
							menu.items.get('cmd_publish').setVisible(scope.state.cmd.publish);
														
							menu.items.get('cmd_unPublish').setDisabled(!scope.state.cmd.unPublish);
							menu.items.get('cmd_unPublish').setVisible(scope.state.cmd.unPublish);
							
							//menu.items.get('cmd_logout').setVisible(scope.state.cmd.logout);
						
					},//end beforeshow
					itemclick : function(item){

						var grid = scope.listView.panel;

						switch (item.id)
						{
							case 'cmd_newFolder':
								scope.fireEvent('confirmCreateFolder',null);
							break;

							case 'cmd_renameFile':
								if (scope.listView.currentView == "list")
								{
									grid.on('beforeedit',function(e){ grid.getColumnModel().setEditable(0, true); return true; },grid);
									grid.getColumnModel().setEditable(0, true);
									grid.startEditing(scope.gridLastSelectedRowIndex,0);
								}
								else // thumbnails
								{
									m = Ext.Msg.show({
									    minWidth: 250,
										titke: "Rename",
										buttons: Ext.MessageBox.OKCANCEL,
										closable: false, modal: false, prompt: true,
										value: scope.selectedDocs.first.name,
										fn: function (btn, txt) {
											if (btn == 'ok') {
												scope.fireEvent('renameFile',{'doc': scope.selectedDocs.firstAsRec,'newname': txt});
											}
										}
									});
								}
							break;

							case 'cmd_deleteFile':
								scope.fireEvent('confirmDeleteDocs',{'doc_id_list': scope.selectedDocs.doc_id_list,'perm': 0});
							break;

							case 'cmd_copy':
								//scope.clipboard = scope.clientHdls.createSelectedSet();
								scope.clipboard = scope.selectedDocs;
        	    	            scope.clipboard.isCut = false;
							break;

							case 'cmd_cut':
								//scope.clipboard = scope.clientHdls.createSelectedSet();
								scope.clipboard = scope.selectedDocs;
        	    	            scope.clipboard.isCut = true;
							break;

							case 'cmd_paste':
								if (!scope.clipboard.isCut)
									scope.fireEvent('copyFiles',null);
								else if (scope.clipboard.isCut)
									scope.fireEvent('moveFiles',null);
							break;

							case 'cmd_zip':
								scope.fireEvent('zip',{'doc_id_list' : scope.selectedDocs.doc_id_list});
							break;

							case 'cmd_unzip':
								//scope.fireEvent('extract',{'doc_id' : scope.selectedDocs[0].get('realId')});
								scope.fireEvent('extract',{'doc_id' : scope.selectedDocs.first.realId});
							break;

							case 'cmd_download':
								//scope.serverReqs.cmd_get_file(scope.selectedDocs[0].get('realId'));
								scope.serverReqs.cmd_get_file(scope.selectedDocs.first.realId);
							break;

							case 'cmd_view':
								//scope.serverReqs.cmd_get_thumbnail(scope.state.filename,scope.selectedDocs[0].get('realId'));
								scope.serverReqs.cmd_get_thumbnail(scope.state.filename,scope.selectedDocs.first.realId);
							break;

							case 'cmd_restore':
								//scope.fireEvent('restoreDoc',{'doc_id' : scope.selectedDocs[0].get('realId')});
								scope.fireEvent('restoreDoc',{'doc_id' : scope.selectedDocs.first.realId});
							break;

							case 'cmd_sharing':
								scope.serverHdls.do_sharingDialog(0);
							break;

							case 'cmd_tags':
								scope.serverHdls.do_tagListDialog.call(scope);
							break;
							
							case 'cmd_addStar':
								//scope.fireEvent('bookmarkDoc',{'doc_id' : scope.selectedDocs[0].get('realId')});
								scope.fireEvent('bookmarkDoc',{'doc_id' : scope.selectedDocs.first.realId});
							break;

							case 'cmd_removeStar':
								//scope.selectedDocs = scope.clientHdls.createSelectedSet();
								scope.fireEvent('removeBookmarkDoc',{'bookmarks':scope.selectedDocs});
								//scope.fireEvent('removeBookmarkDoc',{'doc_id' : scope.selectedDocs[0].get('realId')});
							break;
							
							case 'cmd_publish':
								scope.fireEvent('publish',{'glob' : 1,'doc_id_list' :scope.selectedDocs.doc_id_list});
							break;

							case 'cmd_unPublish':
								scope.fireEvent('publish',{'glob' : 0});
							break;
							
							/*
							case 'cmd_select-all-files':
	    	                    grid.getSelectionModel().selectAll();
    	                    break;
							*/
							
							case 'cmd_logout':
								window.location.href = scope.serverURL + '/accounts/logout/';
							break;
						}//end switch

					}//end itemclick
				}
			});
		},
		
		init_tagMenu : function(){
			
			return new Ext.menu.Menu({
				id : 'tagMenu',
				items : [
					{id: 'cmd_newTag',text: Messages.cmdNewTag,iconCls: 'newTag'}, 
					{id: 'cmd_deleteTag', text: Messages.cmdDelete, iconCls: 'deleteTag'}
				],
				listeners : {
					beforeshow : function(menu){
						
						menu.items.get('cmd_newTag').setDisabled(!scope.state.cmd.newTag);
						menu.items.get('cmd_deleteTag').setDisabled(!scope.state.cmd.deleteTag);
						
					},//end beforeshow
					itemclick : function(item){
						
						var grid = scope.listView;
						
						switch (item.id) 
						{						
							case 'cmd_newTag':
								scope.fireEvent('promptCreateTag',null);
							break;
							
							case 'cmd_deleteTag':
								scope.fireEvent('confirmDeleteTags',{'tags':scope.selectedDocs.tags});
							break;
						}//end switch
						
					}//end itemclick
				}
			});
		},		

		init_groupMenu : function(){
			
			return new Ext.menu.Menu({
				id : 'groupMenu',
				items : [
					{id: 'cmd_newGroup',text: Messages.cmdNewGroup,iconCls: 'newGroup'}, 
					{id: 'cmd_deleteGroup', text: Messages.cmdDeleteGroup, iconCls: 'deleteGroup'},
					{id: 'cmd_renameGroup', text: Messages.cmdRenameGroup, iconCls: 'renameGroup'},
					'-',
					{id: 'cmd_manageGroupUsers', text: Messages.cmdManageGroupUsers, iconCls: 'manageGroupUsers'}
				],
				listeners : {
					beforeshow : function(menu){
						
						menu.items.get('cmd_newGroup').setDisabled(!scope.state.cmd.newGroup);
						menu.items.get('cmd_deleteGroup').setDisabled(!scope.state.cmd.deleteGroup);
						menu.items.get('cmd_renameGroup').setDisabled(!scope.state.cmd.renameGroup);
						menu.items.get('cmd_manageGroupUsers').setDisabled(!scope.state.cmd.manageGroupUsers);
						
					},//end beforeshow
					itemclick : function(item){

						var grid = scope.listView.panel;

						switch (item.id)
						{						
							case 'cmd_newGroup':
								scope.fireEvent('promptCreateGroup',null);
							break;
							
							case 'cmd_deleteGroup':
								scope.fireEvent('confirmDeleteGroups',{'groups':scope.selectedDocs.groups});
							break;

							case 'cmd_renameGroup':
								if (scope.listView.currentView == "list")
								{
									grid.on('beforeedit',function(e){ grid.getColumnModel().setEditable(0, true); return true; },grid);
									grid.getColumnModel().setEditable(0, true);
									grid.startEditing(scope.gridLastSelectedRowIndex,0);
								}
								else // thumbnails
								{
									m = Ext.Msg.show({
									    minWidth: 250,
										titke: "Rename",
										buttons: Ext.MessageBox.OKCANCEL,
										closable: false, modal: false, prompt: true,
										value: scope.selectedDocs.groups[0].name,
										fn: function (btn, txt) {
											if (btn == 'ok') {
												scope.fireEvent('renameFile',{'doc': scope.selectedDocs.firstAsRec,'newname': txt});
											}
										}
									});
								}
								
							break;
							
							case 'cmd_manageGroupUsers':
								scope.serverHdls.do_manageGroupUsers.call(scope);
							break;
							
						}//end switch
					}
				}
			});
		},
		
		init_userMenu : function(){
			return new Ext.menu.Menu({
				id : 'userMenu',
				items : [
					{id: 'cmd_logout',text: Messages.logout,iconCls: 'logout'}
					//{id: 'cmd_controlPanel',text: "Control Panel",iconCls: ''}
				],
				listeners : {
					beforeshow : function(menu){
					},//end beforeshow
					itemclick : function(item){

						switch (item.id)
						{						
							case 'cmd_logout':
								window.location.href = scope.serverURL + '/accounts/logout/';
							break;
							/*
							case 'cmd_controlPanel':
								scope.UI.init_ControlPanel();
							break;
							*/
							
						}//end switch
					}
				}
			});			
		},

		init_menu : function(){
			
			var appMenu = Ext.getCmp('appMenu');
			var fileMenu = scope.UI.init_fileMenu();
			var tagMenu = scope.UI.init_tagMenu();
			var groupMenu = scope.UI.init_groupMenu();
			var userMenu = scope.UI.init_userMenu();

			appMenu.removeAll();

			var tbtnFileMenu = new Ext.Button({
    	    	text: Messages.menu_edit,
                menu: fileMenu,
				width: 60
			});

			var tbtnTagMenu = new Ext.Button({
    	    	text: Messages.menu_tags,
                menu: tagMenu,
				width: 60
			});

			var tbtnGroupMenu = new Ext.Button({
    	    	text: Messages.menu_groups,
                menu: groupMenu,
				width: 60
			});

			var tbtnUserMenu = new Ext.Button({
    	    	text: "Συνδεδεμένος ως <b>" + scope.userInfo.username+ "</b>",
                menu: userMenu,
				width: 60
			});


			var tbtnControlPanel = new Ext.Button({
				iconCls: 'control-panel',
				scale:'small',
				hidden: false,
				handler:function(){
					scope.UI.init_ControlPanel();
				}
				
			});

			appMenu.add(tbtnFileMenu);
			appMenu.add(tbtnTagMenu);
			appMenu.add(tbtnGroupMenu);
			
			appMenu.add({
					text : Messages.menu_help,
					menu : [

						{id: 'cmd_reportbug', text: Messages.report_bug, iconCls: 'reportBug', handler: function(){
									window.open('http://helpdesk.sch.gr','_blank');
								}
						}
					]
			});
			
			appMenu.add('->');
			appMenu.add(tbtnControlPanel);
			appMenu.add('-');
			appMenu.add(tbtnUserMenu);
			
			Ext.getCmp('north_region').doLayout();
		}
	}
);