// JavaScript Document
Ext.apply(Tei.Wfm.App.prototype.UI,
	{
		
		init_ToolBar : function(){
			
			scope.toolBar = new Ext.Toolbar({
				id : 'appToolbar',
				enableOverflow: true,

				defaults:{
					hidden: true,
					scale:'medium',
                                        xtype:'button'
				},
				items:[
					
					{id: 'tb_upload',text: Messages.upload_file, iconCls: 'addFile', tooltip: Messages.tip_uploadFiles},
					{id: 'tb_emptyTrash',text: Messages.empty_trash, iconCls: 'emptyTrash', hidden:true, tooltip: Messages.tip_emptyBin},
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
					{id: 'tb_cmd_report_content', text: Messages.cmdReportContent, iconCls: 'reportContent', anchorMenu: 'fileMenu'}, 
					'->',
                                        
                                        
                                        {xtype: 'tbseparator',hidden: false},
					
                                        {       tooltip: Messages.tip_selectAll + '/' + Messages.tip_deselectAll,
						iconCls: 'selectall',
						id: 'select',
						scale:'small',
						menu: new Ext.menu.Menu({
		    				items: 
							[
								{
                                                                        xtype:'menuitem',
									text: Messages.tip_selectAll,
									handler: function() {
										scope.listView.panel.selModel.selectAll();
									}
								},
								{
									xtype:'menuitem',
                                                                        text: Messages.tip_deselectAll,
									handler: function() {
										scope.listView.panel.selModel.clearSelections();
									}
								}
							]
						}),
						hidden:false
					},
					
					{xtype: 'tbseparator',hidden: false},

					{id: 'tbarView-thumbnails', iconCls: 'thumbs', toggleGroup: 'view', enableToggle: true, hidden: false , scale:'small', tooltip:'Thumbnails'},
					{id: 'tbarView-list', iconCls: 'detailed', toggleGroup: 'view', enableToggle: true, hidden: false, scale:'small', tooltip:'List'},					

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
                                        
                                        menu.findById('tb_cmd_report_content').setVisible(scope.state.cmd.reportContent);
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
                                                
                                                case 'tb_cmd_report_content':
                                                    scope.fireEvent('reportContent',{'doc_id_list': scope.selectedDocs.doc_id_list});
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
					{id: 'cmd_unPublish', text: Messages.cmdUnPublish, iconCls: 'unpublish'},
                                        '-',
                                        {id: 'cmd_report_content', text: Messages.cmdReportContent, iconCls: 'reportContent'}
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
							
                                                        menu.items.get('cmd_report_content').setDisabled(!scope.state.cmd.reportContent);
                                                        
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
                                                        
                                                        case 'cmd_report_content':
								scope.fireEvent('reportContent',{'doc_id_list': scope.selectedDocs.doc_id_list});
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
								scope.fireEvent('publish',{'glob' : 0, 'doc_id_list' :scope.selectedDocs.doc_id_list});
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
                            width: 60,
                            tooltip: Messages.tip_manage_files
			});

			var tbtnTagMenu = new Ext.Button({
                            text: Messages.menu_tags,
                            menu: tagMenu,
                            width: 60,
                            tooltip: Messages.tip_manage_tags
			});

			var tbtnGroupMenu = new Ext.Button({
                            text: Messages.menu_groups,
                            menu: groupMenu,
                            width: 60,
                            tooltip: Messages.tip_manage_usergroups
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
                            tooltip:Messages.tip_controlPanel,
                            handler:function(){
                                scope.UI.init_ControlPanel();
                            }
			});
                        
                        var  tbtnNot =  { xtype:'button',  id: 'tb_open_notify',
                                           text: Messages.win_title_notifications,
                                           iconCls: 'notification', hidden: false,
                                           tooltip:Messages.tip_notifications,
                                           handler : function(){
                                                scope.notificationManager.show();

                                           }
                                        };

			appMenu.add(tbtnFileMenu);
			appMenu.add(tbtnTagMenu);
			appMenu.add(tbtnGroupMenu);
			
			appMenu.add({
					text : Messages.menu_help,
					menu : [

					       {id: 'cmd_userguide', text: Messages.user_guide, iconCls: 'reportBug', handler: function(){
					    	   	window.open('user_guide_myfiles_ver3.pdf','_blank');
					       	}
					      },  
						{id: 'cmd_terms', text: Messages.terms, iconCls: 'reportBug', handler: function(){
							window.open('terms_myfiles_ver1.pdf','_blank');
						 }
						},  
					        
						{id: 'cmd_reportbug', text: Messages.report_bug, iconCls: 'reportBug', handler: function(){
									window.open('http://helpdesk.sch.gr/?category_id=9341','_blank');
								}
						}
					]
			});
			
			appMenu.add('->');
                        appMenu.add(tbtnNot);
                        appMenu.add('-');
			appMenu.add(tbtnControlPanel);
			appMenu.add('-');
			appMenu.add(tbtnUserMenu);
			
			Ext.getCmp('north_region').doLayout();
		}
	}
);
