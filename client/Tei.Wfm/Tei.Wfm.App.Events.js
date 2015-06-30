Ext.apply(
  Tei.Wfm.App.prototype.Events,
  {
	scope : this.scope,

	//***************************************************************************************************************
	onGetUserInfo : function(eventData){

		var reqConfs = {
				'data' : eventData,
				'objQueue' : null,
				'cb_start' : function() {
					scope.clientHdls.maskApp(Messages.process_get_userinfo);
				},
				'cb_success' : function(userInfo){ 
					
					if (userInfo.success)
					{
						
						//scope.clientHdls.unmaskApp();
						//scope.fireEvent('getUserInfoComplete',userInfo);
						scope.userInfo = userInfo;
						scope.fireEvent('createUI');
					}
					else
					{
						scope.clientHdls.unmaskApp();
						//window.location.href = scope.serverURL + '/accounts/login/';
						window.location.href = '/index.html';
					}
				},
				'cb_fail' : function(){
					Ext.Msg.alert('failure','Cannot retrieve user info from server');
				},
				'cb_eofq' : null
		}

		scope.serverReqs.cmd_get_user_info(reqConfs);
	},
	
	onGetUserInfoComplete : function(userInfo){
		scope.fireEvent('createUI',userInfo);
	},
	//***************************************************************************************************************
	onCreateUI : function(){

			scope.UI.init_Header();

			scope.UI.init_TreePanel();
			//scope.UI.init_EditorGridPanel();
			scope.UI.init_ToolBar();
			//scope.UI.init_MenuBar();
			
			//scope.UI.init_ViewMode();
			scope.UI.init_EditorGridPanel2();
			
			scope.UI.init_spaceIndicator();
			scope.UI.init_infoPanel();
			
			
			//scope.UI.init_PropertyGrid();
			scope.UI.init_quotaInfoChart();
			scope.fireEvent('createUIComplete');
	},

	onCreateUIComplete : function(){
		
		var appMenu = new Ext.Toolbar(
									{
										id: 'appMenu',
										defaults:{
											scale:'medium'
										},
										items:[
												{
													text: "fsfsdfs"
												}									  
										]
									});
			
		this.fmViewport = new Ext.Viewport({
				id : 'fmViewport',
				layout:'border',
				stateful: true,	
				stateEvents: ['resize'],
				border:false, 
				hideBorders: true,
				constrain: true,
				defaults: {
					split: true
				},
				items:
						[
							
							{
								ref: 'north_region',
								id: 'north_region',
								region:'north',
								//layout: 'border',
								margins: '0 5 0 5',
								border: false, 
								hideBorders: false,
								lines: false,
								autoHeight:true,
								bodyStyle:'background:none;border-width:0px;border-style:none;border-collapse:collapse;',
								defaults: {
									split: true,
									style: 'border-width:1px;border-style:solid;margin:5px 0px 0px 0px;'
								},
								items:[
									scope.pnlHeader,
									appMenu,
									scope.toolBar
								],
								collapsible: false
							},
							{
								id:'west_region',
								region:'west',
								layout:'border',
								border: false, 
								hideBorders: true,
								ref : 'west_region',
								width: 280,
								minSize: 250,
								maxSize: 400,
								collapsible: true,
								hideCollapseTool: true, 
								collapseMode: 'mini',
								margins:'0 0 0 5',
								cmargins:'0 5 5 5',
								autoScroll: true,
								defaults: {
									split: true,
									border: true
								},
								items: [
									
										 scope.pnlTree,
										 scope.infoPanel.panel
									
								],
								listeners :{}
							},
							{
								ref : 'center_region',
								id:'center_region',
								layout:'border',
								border: true, 
								hideBorders: true,
								region:'center',
								margins:'0 5 0 0',
								collapsible: false,
								items: [
									{
										region:'center',
										layout: 'fit',
										border: false, 
										hideBorders: true,
										items: scope.listView.panel,
										tbar: {
											id: 'sBar',
											items: [ new sch.wfm.components.LocationBar( {id:'tbtLocation'} ) ]
										}
									}
								]								
							},
							{
								region: 'south',
								//layout: 'vBox',
								margins: '0 5 5 5',
								border: true, 
								hideBorders: true,
								id: 'south_region',
								bodyStyle: 'display:none;border:none;',
								//items: scope.pnlHeader,
								tbar:
								{
									ref: 'statusBar',
									id : 'statusBar',
									style: 'border-width:1px;border-style:solid;',
									items: [
											{xtype: 'tbtext', text: '&#160;',id:'statusTxt',ref: '../statusTxt'},
											'->',
											scope.spaceQuotaIndicator
									]
								}
							}
						]
			});

			scope.UI.init_menu();
			scope.States.init_States();
			
			//scope.UI.changeView(Settings.ui_default_view, 1);
			scope.UI.restoreView();

			/*---------------- process manager------------------*/
			return;
			scope.processManager.reset();

			scope.processManager.fillTaskStore([
				{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_get_tag_list,
					cmd : scope.CMD.cmd_get_tag_list,
					params : null,
					onStart: function(){

						scope.clientHdls.maskApp(Messages.process_get_tag_list);
					},
					onComplete: function(response,taskIndex,sendedData){

						if (response.success)
						scope.fireEvent('loadTagListComplete',response);
					}
				},
				{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_get_groups,
					cmd : scope.CMD.cmd_get_groups,
					params : null,
					onStart: function(){

						scope.clientHdls.maskApp(Messages.process_get_groups);
					},					
					onComplete : function(response,taskIndex,sendedData){
						if (response.success)
						scope.fireEvent('loadGroupsComplete',response);
					}
				},				
				/*{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_cmd_tree,
					cmd : scope.CMD.cmd_tree,
					params : null,
					onStart: function(){

						scope.clientHdls.maskApp(Messages.process_cmd_tree);
					},					
					onComplete : function(response,taskIndex,sendedData){
						
						if (response.success)
						{
							scope.fireEvent('loadTreeNodesComplete',response);

							scope.processManager.pushTaskAt(++taskIndex,{
								state : 0,
								note : scope.processManager.textLayout.waitingMsg,
								name : Messages.process_cmd_ls,
								cmd : scope.CMD.cmd_ls,
								params : {
									'doc_id' : scope.curTreeNodSel.realId,
									'path' : scope.curTreeNodSel.path,
									'group_id' : scope.curTreeNodSel.group_id
								},
								onStart: function(){

									scope.clientHdls.maskApp(Messages.process_cmd_ls);
								},					
								onComplete : function(response,taskIndex,sendedData){
																		
									scope.currentLsArgs = sendedData;

									if (response.success)
									{
										scope.fireEvent('loadDirContentComplete',response);
																				
										delete scope.state.ls;
										delete scope.state.nav;

										scope.currDocId = scope.curTreeNodSel.realId;										
									}
								}
							});
						}
					}
				},*/
                                {
                                    state : 0,
                                    note : scope.processManager.textLayout.waitingMsg,
                                    name : Messages.process_cmd_get_notifications,
                                    cmd : scope.CMD.cmd_get_notifications,
                                    params : null,
                                    onStart: function(){
                                        scope.clientHdls.maskApp(Messages.process_cmd_get_notifications);
                                    },					
                                    onComplete : function(response,taskIndex,sendedData){
                                        if (response.success)
                                            scope.fireEvent('loadNotificationsComplete',response);
                                    }
                                }
							
			]);
			
			scope.processManager.on('ajaxReqTaskTotalCompleteEvent',function(taskIndex){
				
				Ext.getCmp('center_region').doLayout();
				Ext.getCmp('north_region').doLayout();
				scope.clientHdls.unmaskApp();
				scope.clientHdls.updateStatus('success',Messages.complete_txt_app_init,'center_region');
			});
			
			scope.processManager.beginProcess();
			/*-----------------end process manager-------------------*/
	},
	//***************************************************************************************************************
	onLoadTreeNodes : function(eventData){
		return;
		var reqConfs = {
				'data' : eventData,
				'objQueue' : null,
				'cb_start' : function() {
					Ext.get('west_region').mask(Messages.loading, 'x-mask-loading');
				},
				'cb_success' : function(response){ 
					
					Ext.get('west_region').unmask();
					if (response.success)
					{
						scope.fireEvent('loadTreeNodesComplete',response);
					}
				},
				'cb_fail' : null,
				'cb_eofq' : null
		}
		
		scope.serverReqs.cmd_tree(reqConfs);
	},
	
	onLoadTreeNodesComplete : function(jsonResp){
		return;
		var jsonDirTree = jsonResp.tree;

		if (scope.curTreeNodSel != null)
			scope.treeExpandedPath = scope.curTreeNodSel.getPath();

		scope.pnlTree.getLoader().load(scope.pnlTree.getRootNode());
		scope.clientHdls.buildTree.call(scope,scope.pnlTree.getRootNode(),jsonDirTree.children,'',-1);
		
		if (scope.curTreeNodSel != null)
			scope.pnlTree.expandPath(scope.treeExpandedPath,'id');
	
		
		var node = null;
		
		if (scope.treeExpandedPath != null)
		{
			scope.pnlTree.selectPath(scope.treeExpandedPath,'id',function(bSuccess,oSelNode){
				node = oSelNode;
			});
		}
		else
		{
			node = scope.pnlTree.getRootNode().childNodes[0]
			node.select();
		}

		Ext.ComponentMgr.get('tbtLocation').updateLocation(node,null);
		scope.clientHdls.setCurrTreeNodeAttr(node);
		scope.spaceQuotaIndicator.updateQuota( jsonResp.used_space, jsonResp.quota );
		
	},
        //***************************************************************************************************************
        onLoadNotifications : function(){
            
            if (scope.notificationManager.timer){ clearTimeout(scope.notificationManager.timer); }
                            
            scope.notificationManager.timer = setTimeout(function(){
                scope.fireEvent('loadNotifications',null);
            }, scope.notificationManager.pollInterval  );


            var reqConfs = {
                	'data' : null,
			'objQueue' : null,
			'cb_start' : function() {
                            //scope.clientHdls.updateStatus('start','loading notifications','win_NotificationManager');
                            
                            if (scope.notificationManager.isVisible()){
                                scope.notificationManager.updateStatus('start',Messages.loading);
                            }
                                
			},
			'cb_success' : function(response){ 
				
                            if (response.success)
                            {
                                if (scope.notificationManager.isVisible()){
                                    scope.notificationManager.updateStatus('success', Messages.ready);
                                }

				scope.fireEvent('loadNotificationsComplete',response);
                            }
                            else
                            {
                                if (scope.notificationManager.isVisible()){
                                    scope.notificationManager.updateStatus('fail', response.message);
                                }
                                
				scope.clientHdls.updateStatus('fail',response.status_msg,'win_NotificationManager');
                            }
                            
                            
                        },
			'cb_fail' : function(){
                            
                            if (scope.notificationManager.isVisible()){
                                scope.notificationManager.updateStatus('connection_problem', 'Connection problem');
                            }
                                
                            scope.clientHdls.updateStatus('connection_problem',"Cannot connect to server",'win_NotificationManager');								
			},
			'cb_eofq' : null
            }

            scope.serverReqs.cmd_get_notifications(reqConfs);
	},
        
        onLoadNotificationsComplete : function(jsonResp){
            
            if (scope.notificationManager.timer){ clearTimeout(scope.notificationManager.timer); }
                            
            scope.notificationManager.timer = setTimeout(function(){
                scope.fireEvent('loadNotifications',null);
            }, scope.notificationManager.pollInterval  );
            
            if (jsonResp.success){
                
                var howmany = jsonResp.notifications.length;
                Ext.getCmp('tb_open_notify').setText(Messages.win_title_notifications + ' [<b>' +howmany+ '</b>]');
                
                scope.notificationManager.reset();
                
                if (jsonResp.notifications.length > 0)
                {
                    scope.notificationManager.reset();
                    
                    scope.notificationManager.fillNotificationStore(jsonResp.notifications);
                    
                    var balloon = new Ext.ToolTip({
                        floating: {
                            shadow: true
                        },
                        anchor: 'bottom',
                        target: 'tb_open_notify',
                        anchorToTarget: true,
                        title: '',
                        html: '<span style="font-weight:bold;font-size:12px;">'+ howmany + ' ' + Messages.win_title_notifications  + '</span>',
                        hideDelay: 30000,
                        closable: true,
                        style: {
                        }
                    });
                    
                    balloon.on('hide', function() {
                        balloon.destroy();
                    });
                    
                    balloon.show();
                }
            }
        },
        
	//***************************************************************************************************************	
	onLoadDirContent : function(eventData){

		var reqConfs = {
						'data' : eventData,
						'objQueue' : null,
						'cb_start' : function() {
							scope.clientHdls.updateStatus('start',Messages.loading,'center_region');
						},
						'cb_success' : function(response){ 
							
							scope.currentLsArgs = response.dataSend;
							
							if (response.success)
							{
								scope.clientHdls.updateStatus('success',Messages.ready,'center_region');
								scope.fireEvent('loadDirContentComplete',response);
							}
							else
							{
								scope.clientHdls.updateStatus('fail',response.status_msg,'center_region');
							}
						},
						'cb_fail' : function(){
							scope.clientHdls.updateStatus('connection_problem',"Cannot connect to server",'center_region');								
						},
						'cb_eofq' : null
		}

		scope.serverReqs.cmd_ls(reqConfs);
	},

	onLoadDirContentComplete : function(jsonResp){
		
		if (jsonResp.success)
		{
			scope.filesStore.removeAll();

			var jsonDirContent = jsonResp.ls;
			var ln = jsonDirContent.contents.length;
			var j = 0;
			var recs = Array();
			var curSchema = scope.curTreeNodSel.schema;
			var prefix_id = '';	

			//var objPropGrd = Ext.applyIf(jsonDirContent,{'realId': jsonDirContent._id});
			//scope.clientHdls.fillPropertyGrid(objPropGrd);

			for(var i=0; i < ln; i++)
			{
				if (jsonDirContent.contents[i] != null)
				{
					//***********************
					if (scope.curTreeNodSel.attributes.schema == 'tags')
					{
						prefix_id = "home_";
					}
					else if (scope.curTreeNodSel.attributes.schema == 'shared' && 
							 in_array(jsonDirContent.contents[i].name,["users","groups","schools"]) )
					{
						prefix_id = "sharedIN" + jsonDirContent.contents[i].name + "_";
					}
					else if (in_array(scope.curTreeNodSel.attributes.schema,['sharedINgroups','sharedINusers','sharedINschools']))
					{
						prefix_id = curSchema + 'IN' + jsonDirContent.contents[i]._id + "_";
					}
					else
					{
						prefix_id = curSchema + '_';
					}
					//***********************
					
					recs[j++] = new scope.filesStore.recordType({
																containerNode: scope.curTreeNodSel,
																id: prefix_id + jsonDirContent.contents[i]._id,
																realId: jsonDirContent.contents[i]._id,
																name: jsonDirContent.contents[i].name,
																bookmarked: jsonDirContent.contents[i].bookmarked,
																owner: jsonDirContent.contents[i].owner, 
																type: jsonDirContent.contents[i].type, 
																size: jsonDirContent.contents[i].length,
																global_public: jsonDirContent.contents[i].global_public,																
																public: jsonDirContent.contents[i].public,
																tags: jsonDirContent.contents[i].tags,
																groups : (function(){
																	if (jsonDirContent.contents[i].public != undefined)
																	{
																		if (jsonDirContent.contents[i].public.groups != undefined)
																			return jsonDirContent.contents[i].public.groups;
																	}

																	return new Array();
																})(),
																users : (function(){
																	if (jsonDirContent.contents[i].public != undefined)
																	{
																		if (jsonDirContent.contents[i].public.users != undefined)
																			return jsonDirContent.contents[i].public.users;
																	}

																	return new Array();
																})()
																});
				}
			}
			
			scope.filesStore.add( recs );
			scope.filesStore.sort('type','DESC');

			scope.clientHdls.setAppState();
			scope.toolBar.fireEvent('refresh',null);
		}
		else
		{
			Ext.Msg.alert('Fail',resp.status_msg);
		}
	},
	onReportBug : function(eventData) {
			
	},

	//***************************************************************************************************************	
	onConfirmCreateFolder : function(eventData){
		
		Ext.MessageBox.prompt( Messages.create_folder, Messages.name, function(response, text) {
			if (response == "ok")
			{
				//scope.fireEvent('createFolder',{'parent_id' : scope.curTreeNodSel.realId, 'name' : text  });
				/*-------------------------------*/
				scope.processManager.reset();
				scope.processManager.fillTaskStore([
					{
						state : 0,
						note : scope.processManager.textLayout.waitingMsg,
						name : Messages.process_cmd_create_folder,
						cmd : scope.CMD.cmd_create_folder,
						params : {'parent_id': scope.curTreeNodSel.realId, 'name': text},
						onStart: function(){

							scope.clientHdls.updateStatus('start',Messages.in_process_cmd_create_folder,'center_region');
						},
						onComplete: function(response,taskIndex,sendedData){
							if (response.success)
							{
								scope.processManager.pushTaskAt(++taskIndex,{
									state : 0,
									note : scope.processManager.textLayout.waitingMsg,
									name : Messages.process_cmd_tree,
									cmd : scope.CMD.cmd_tree,
									params : null,
									onComplete : function(response,taskIndex,sendedData){

										if (response.success)
										{
											scope.fireEvent('loadTreeNodesComplete',response);
											
											scope.processManager.pushTaskAt(++taskIndex,{
												state : 0,
												note : scope.processManager.textLayout.waitingMsg,
												name : Messages.process_cmd_ls,
												cmd : scope.CMD.cmd_ls,
												params : {
													'doc_id' : scope.curTreeNodSel.realId,
													'path' : scope.curTreeNodSel.path,
													'group_id' : scope.curTreeNodSel.group_id
												},
												onComplete : function(response,taskIndex,sendedData){

													scope.currentLsArgs = sendedData;

													if (response.success)
													{
														scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_create_folder,'center_region');
														scope.fireEvent('loadDirContentComplete',response);

														delete scope.state.ls;
														delete scope.state.nav;

														scope.currDocId = scope.curTreeNodSel.realId;										
													}
												}
											});
										}
									}
								});
							}
							else
							{
								return scope.processManager.abortAllAjaxReqTask();
							}
							
						}
					}
				]);
				scope.processManager.beginProcess();
				/*-------------------------------*/
			}
		});

	},

	//must remove
	onCreateFolder : function(eventData){
		
		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : function(){
						scope.clientHdls.updateStatus('start','Creating folder...','center_region');
					},
					'cb_success' : function(response){
						if (response.success)
						{
							scope.clientHdls.updateStatus('success','Creating folder success','center_region');
							scope.fireEvent('createFolderComplete',response);
						}
						else
						{
							scope.clientHdls.updateStatus('fail',response.status_msg,'center_region');
						}
					},
					'cb_fail' : function(){
						scope.clientHdls.updateStatus('connection_problem',"Cannot connect to server",'center_region');	
					},
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_create_folder(reqConfs);
	},

	onCreateFolderComplete : function(jsonResp){
		
		var newNode = new Ext.tree.TreeNode({text : jsonResp.name, id : jsonResp.doc_id, '_id' : jsonResp.doc_id, cls : 'x-tree-node-collapsed'});
		scope.curTreeNodSel.appendChild(newNode);
		scope.pnlTree.doLayout();
			
		//scope.fireEvent('loadDirContent',{'doc_id' : scope.curTreeNodSel.realId,'path' : scope.curTreeNodSel.path });
		scope.fireEvent('loadTreeNodes',null);
	},
	//***************************************************************************************************************
        
        onReportContent : function(eventData){
            var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : function() {
						scope.clientHdls.updateStatus('start', + Messages.cmdReportContent + '...','center_region');
					},
					'cb_success' : function(response){
						if (response.success) {
							scope.clientHdls.updateStatus('success',Messages.ready,'center_region');
						}
						else {
							scope.clientHdls.updateStatus('fail',response.status_msg,'center_region');
						}
					},
					'cb_fail' : function(){
						scope.clientHdls.updateStatus('connection_problem',"Cannot connect to server",'center_region');								
					},
					'cb_eofq' : null
		}

		scope.serverReqs.cmd_report_content(reqConfs);
        },
        
        //***************************************************************************************************************
	onConfirmDeleteDocs : function(eventData){

		Ext.Msg.show({
						title: 'Delete?',
						msg: String.format('Are you sure you want to delete selected file(s)?'),
						buttons: Ext.Msg.YESNOCANCEL,
						fn: function(response, text) {
							if (response == "yes")
							{		
								scope.processManager.reset();
								scope.processManager.fillTaskStore([
									{
										state : 0,
										note : scope.processManager.textLayout.waitingMsg,
										name : Messages.process_cmd_delete,
										cmd : scope.CMD.cmd_delete,
										params : {'doc_id_list': eventData.doc_id_list, 'perm': eventData.perm},
										onStart: function(){

											scope.clientHdls.updateStatus('start',Messages.in_process_cmd_delete,'center_region');
										},
										onComplete: function(response,taskIndex,sendedData){

											if (response.success)
											{
												scope.processManager.pushTaskAt(++taskIndex,{
													state : 0,
													note : scope.processManager.textLayout.waitingMsg,
													name : Messages.process_cmd_tree,
													cmd : scope.CMD.cmd_tree,
													params : null,
													onComplete : function(response,taskIndex,sendedData){

														if (response.success)
														{
															scope.fireEvent('loadTreeNodesComplete',response);
															
															scope.processManager.pushTaskAt(++taskIndex,{
																state : 0,
																note : scope.processManager.textLayout.waitingMsg,
																name : Messages.process_cmd_ls,
																cmd : scope.CMD.cmd_ls,
																params : {
																	'doc_id' : scope.curTreeNodSel.realId,
																	'path' : scope.curTreeNodSel.path,
																	'group_id' : scope.curTreeNodSel.group_id
																},
																onComplete : function(response,taskIndex,sendedData){
																					
																	scope.currentLsArgs = sendedData;
			
																	if (response.success)
																	{
																		scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_delete,'center_region');

																		scope.fireEvent('loadDirContentComplete',response);
													
			
																		delete scope.state.ls;
																		delete scope.state.nav;
			
																		scope.currDocId = scope.curTreeNodSel.realId;										
																	}
																}
															});
														}
													}
												});
											}
											else
											{
												return scope.processManager.abortAllAjaxReqTask();
											}
										}
									}
								]);
								scope.processManager.beginProcess();
								/*------------------*/
							}
						},
						icon: Ext.MessageBox.QUESTION
		});
	},


	//***************************************************************************************************************
	onCopyFiles : function(eventData){
	
		
		scope.processManager.reset();
		
		for (var i = 0; i < scope.clipboard.files.length; i++)
		{
			scope.processManager.pushTask({
				
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_copy + " '" + scope.clipboard.files[i].name + "'",
				cmd : scope.CMD.cmd_copy,
				params : {'doc_id': scope.clipboard.files[i].realId, 'dest_id': scope.curTreeNodSel.realId},
				onStart: function(idx){
					scope.clientHdls.updateStatus('start',Messages.process_cmd_copy + " '" + scope.clipboard.files[idx].name + "'...",'center_region');					
				}
			});
		}

		for (var i = 0; i < scope.clipboard.folders.length; i++)
		{
			scope.processManager.pushTask({
				
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_copy + " '" + scope.clipboard.folders[i].name + "'",
				cmd : scope.CMD.cmd_copy,
				params : {'doc_id': scope.clipboard.folders[i].realId, 'dest_id': scope.curTreeNodSel.realId},
				onStart: function(idx){
					idx = idx - scope.clipboard.filesCount;
					scope.clientHdls.updateStatus('start',Messages.process_cmd_copy + " '" + scope.clipboard.folders[idx].name + "'...",'center_region');					
				}
			});
		}

		scope.processManager.on('ajaxReqTaskTotalCompleteEvent',function(taskIndex){

			var tmp = taskIndex + 1;
			
			scope.processManager.pushTaskAt(++taskIndex,{
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_tree,
				cmd : scope.CMD.cmd_tree,
				params : null,
				onComplete : function(response,taskIndex,sendedData){
					
					if (response.success)
					{
						scope.clipboard = null;
						
						scope.fireEvent('loadTreeNodesComplete',response);
															
						scope.processManager.pushTaskAt(++taskIndex,{
							state : 0,
							note : scope.processManager.textLayout.waitingMsg,
							name : Messages.process_cmd_ls,
							cmd : scope.CMD.cmd_ls,
							params : {
								'doc_id' : scope.curTreeNodSel.realId,
								'path' : scope.curTreeNodSel.path,
								'group_id' : scope.curTreeNodSel.group_id
							},
							onComplete : function(response,taskIndex,sendedData){
																		
								scope.currentLsArgs = sendedData;
			
								if (response.success)
								{
									scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_copy,'center_region');

									scope.fireEvent('loadDirContentComplete',response);
													
			
									delete scope.state.ls;
									delete scope.state.nav;
			
									scope.currDocId = scope.curTreeNodSel.realId;
									
									scope.processManager.purgeListeners();
								}
							}
						});
					}
				}
			});
			
			scope.processManager.setAjaxReqFlag();
			scope.processManager.prepareNextAjaxReqTask();
		});
		
		scope.processManager.beginProcess();
	},
	//***************************************************************************************************************
	onMoveFiles : function(eventData){
		
		scope.processManager.reset();

		for (var i = 0; i < scope.clipboard.files.length; i++)		
		{
			scope.processManager.pushTask({
				
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_move + " '" + scope.clipboard.files[i].name + "'",
				cmd : scope.CMD.cmd_move,
				params : {'doc_id': scope.clipboard.files[i].realId, 'dest_id': scope.curTreeNodSel.realId},
				onStart: function(idx){
					scope.clientHdls.updateStatus('start',Messages.process_cmd_move + " '" + scope.clipboard.files[idx].name + "'...",'center_region');
				}
			});
		}
		
		for (var i = 0; i < scope.clipboard.folders.length; i++)
		{
			scope.processManager.pushTask(
				{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_cmd_move + " '" + scope.clipboard.folders[i].name + "'",
					cmd : scope.CMD.cmd_move,
					params : {'doc_id': scope.clipboard.folders[i].realId, 'dest_id': scope.curTreeNodSel.realId},
					onStart: function(idx){
						idx = idx - scope.clipboard.filesCount;
						scope.clientHdls.updateStatus('start',Messages.process_cmd_move + " '" + scope.clipboard.folders[idx].name + "'...",'center_region');					
					}
				}
			);
		}
		
		scope.processManager.on('ajaxReqTaskTotalCompleteEvent',function(taskIndex){
			
			scope.processManager.pushTaskAt(++taskIndex,{
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_tree,
				cmd : scope.CMD.cmd_tree,
				params : null,
				onComplete : function(response,taskIndex,sendedData){
	
					if (response.success)
					{
						scope.fireEvent('loadTreeNodesComplete',response);
																
						scope.processManager.pushTaskAt(++taskIndex,{
							state : 0,
							note : scope.processManager.textLayout.waitingMsg,
							name : Messages.process_cmd_ls,
							cmd : scope.CMD.cmd_ls,
							params : {
								'doc_id' : scope.curTreeNodSel.realId,
								'path' : scope.curTreeNodSel.path,
								'group_id' : scope.curTreeNodSel.group_id
							},
							onComplete : function(response,taskIndex,sendedData){
																			
								scope.currentLsArgs = sendedData;
				
								if (response.success)
								{
									scope.clipboard = null;
									
									scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_move,'center_region');
	
									scope.fireEvent('loadDirContentComplete',response);
														
				
									delete scope.state.ls;
									delete scope.state.nav;
				
									scope.currDocId = scope.curTreeNodSel.realId;
					
									scope.processManager.purgeListeners();
								}
							}
						});
					}
				}
			});
			
			scope.processManager.setAjaxReqFlag();
			scope.processManager.prepareNextAjaxReqTask();
		});

		scope.processManager.beginProcess();		
	},
	//***************************************************************************************************************
	onRenameFile : function(eventArgs){
		
				var doc = eventArgs.doc;
				
				//RESET TASK MANAGER
				scope.processManager.reset();
				
				//ADD TASK
				scope.processManager.pushTask({
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_cmd_rename,
					cmd : doc.data['type'] == 'group' ? scope.CMD.cmd_group_rename : scope.CMD.cmd_rename,
					params : doc.data['type'] == 'group' ? {'group_id': doc.data['realId'], 'group_name': eventArgs.newname} : {'doc_id': doc.data['realId'], 'name': eventArgs.newname},
					onStart: function(idx){
						//scope.clientHdls.updateStatus('start',Messages.in_process_cmd_set_bookmark_doc,'center_region');
					},
					onComplete: function(response,taskIndex,sendedData){
						if (response.success)
						{
							//if (scope.listView.currentView == "list")
							//doc.commit();

							var realId = doc.data['realId'];
							nodeInHome = scope.pnlTree.getNodeById('home_' + realId);
							nodeInBookMrks = scope.pnlTree.getNodeById('bookmarks_' + realId);
						
							if (Ext.isObject(nodeInHome))
								nodeInHome.setText(eventArgs.newname);

							if (Ext.isObject(nodeInBookMrks))
								nodeInBookMrks.setText(eventArgs.newname);

							scope.fireEvent('loadDirContent',scope.currentLsArgs);
						}
						else
						{
							doc.reject();
						}
					}
				});
				//PROCESS TASK
				scope.processManager.beginProcess();	
	},
	
	onRestoreDoc : function(eventData){

		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : function() {
						scope.clientHdls.updateStatus('start','Restore document...','center_region');
					},
					'cb_success' : function(response){
						if (response.success) {
							scope.clientHdls.updateStatus('success',Messages.ready,'center_region');
							scope.fireEvent('loadTreeNodes',null);
						}
						else {
							scope.clientHdls.updateStatus('fail',response.status_msg,'center_region');
						}
					},
					'cb_fail' : function(){
						scope.clientHdls.updateStatus('connection_problem',"Cannot connect to server",'center_region');								
					},
					'cb_eofq' : null
		}

		scope.serverReqs.cmd_restore(reqConfs);
	},

	//***************************************************************************************************************
	onConfirmEmptyTrash : function(eventData){

		Ext.Msg.show({
						title:'Delete?',
						msg: 'Are you sure you want to delete all the items in the trash',
						buttons: Ext.Msg.YESNOCANCEL,
						fn: function(response, text) {
							if (response == "yes")
							{		
								//scope.fireEvent('emptyTrash',eventData);
								
								scope.processManager.reset();
								scope.processManager.fillTaskStore([
									{
										state : 0,
										note : scope.processManager.textLayout.waitingMsg,
										name : Messages.process_empty_trash,
										cmd : scope.CMD.cmd_empty_trash,
										params : eventData,
										onStart: function(){

											scope.clientHdls.updateStatus('start',Messages.in_process_cmd_empty_trash,'center_region');
										},
										onComplete: function(response,taskIndex,sendedData){

											if (response.success)
											{
												scope.processManager.pushTaskAt(++taskIndex,{
													state : 0,
													note : scope.processManager.textLayout.waitingMsg,
													name : Messages.process_cmd_tree,
													cmd : scope.CMD.cmd_tree,
													params : null,
													onComplete : function(response,taskIndex,sendedData){

														if (response.success)
														{
															scope.fireEvent('loadTreeNodesComplete',response);
															
															scope.processManager.pushTaskAt(++taskIndex,{
																state : 0,
																note : scope.processManager.textLayout.waitingMsg,
																name : Messages.process_cmd_ls,
																cmd : scope.CMD.cmd_ls,
																params : {
																	'doc_id' : scope.curTreeNodSel.realId,
																	'path' : scope.curTreeNodSel.path,
																	'group_id' : scope.curTreeNodSel.group_id
																},
																onComplete : function(response,taskIndex,sendedData){
																					
																	scope.currentLsArgs = sendedData;
			
																	if (response.success)
																	{
																		scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_empty_trash,'center_region');

																		scope.fireEvent('loadDirContentComplete',response);
													
			
																		delete scope.state.ls;
																		delete scope.state.nav;
			
																		scope.currDocId = scope.curTreeNodSel.realId;										
																	}
																}
															});
														}
													}
												});
											}
											else
											{
												return scope.processManager.abortAllAjaxReqTask();
											}
										}
									}
								]);
								scope.processManager.beginProcess();
							}
						},
						icon: Ext.MessageBox.QUESTION
		});

	},
	
	onEmptyTrash : function(eventData){
		
		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							scope.fireEvent('emptyTrashComplete',response);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_empty_trash(reqConfs);
	},

	onEmptyTrashComplete : function(jsonResp){
		scope.fireEvent('loadTreeNodes',null);
	},
	//***************************************************************************************************************
	onLoadTagListComplete : function(jsonResp){

		Ext.each(jsonResp.tag_list,function(tag,index){
			scope.tagsStore.push(tag);
		});
	},
	//***************************************************************************************************************	
	onPromptCreateTag : function(eventData){
		
		Ext.MessageBox.prompt(Messages.cmdNewTag, Messages.cmdNewTagName, function(response, text) {
			if (response == "ok")
			{
				if (in_array(text,scope.tagsStore))
				{
					Ext.MessageBox.alert('Error Creating Tag', 'A tag with the name you specified already exists. Specify a different tag name.');
				}
				else
				{
					scope.fireEvent('createTag',{'tag_list':text});
				}
			}
		});
	},

	onCreateTag : function(eventData){
		
		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							scope.fireEvent('createTagComplete',response);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_add_tags(reqConfs);
	},

	onCreateTagComplete : function(jsonResp){
		
		//------------
		var tagName = jsonResp.dataSend.tag_list;

		//var newNode = new Ext.tree.TreeNode({text : tagName, id : tagName, '_id' : tagName, type : "tag", cls : 'x-tree-node-collapsed'});
		var newNode = new Ext.tree.TreeNode({text : tagName, 
											 id : "tags_" + tagName, 
											 _id : "tags_" + tagName, 
											 type : "tag", 
											 schema: "tags", 
											 cls : 'x-tree-node-collapsed'});

		
		scope.pnlTree.getRootNode().childNodes[4].appendChild(newNode);
		scope.tagsStore.push(tagName);
		
		//------------
		var tagListDialog = Ext.getCmp('tagListDialog');
		
		if (typeof tagListDialog == "object")
		{
			tagListDialog.addTagListCheckBox(tagName);
		}
		//-------------
		var cur_Tags  = (scope.curTreeNodSel.attributes.type == "schema" && scope.curTreeNodSel.text == "tags") ?true:false;

		if (cur_Tags)
		scope.fireEvent('loadDirContent',scope.currentLsArgs);
		//scope.fireEvent('loadDirContent',{'doc_id' : scope.curTreeNodSel.realId,'path' : scope.curTreeNodSel.path, 'group_id' : scope.curTreeNodSel.group_id });
	},
	//***********************************************************************************************************************************
	onConfirmDeleteTags : function(eventData){
		
		Ext.Msg.show({
						title:'Delete?',
						msg: String.format('Are you sure you want to delete these {0} tag(s)?',eventData.tags.length),
						buttons: Ext.Msg.YESNOCANCEL,
						fn: function(response, text) {
							if (response == "yes")
							{		
								scope.fireEvent('deleteTags',eventData);
							}
						},
						icon: Ext.MessageBox.QUESTION
		});
	},

	onDeleteTags : function(eventData){

		//------------
		var arr_tag_list = [];

		Ext.each(eventData.tags,function(rec,index){
											//arr_tag_list.push(rec.get('realId'));
											arr_tag_list.push(rec.realId);
										});

		var str_tag_list = implode("/",arr_tag_list);
		//------------
		var objReqQ = new Ext.ux.MyUtils.RequestQueue();

		var objConf = {
				'action': scope.serverReqs.cmd_delete_tags,
				'reqConfs' : {
					'data': {'tag_list':str_tag_list},
					'objQueue': objReqQ,
					'cb_start':	scope.helperFuncs.ajaxStart,
					'cb_success': scope.helperFuncs.ajaxSuccess,
					'cb_fail': scope.helperFuncs.ajaxFail,
					'cb_eofq': function(response){
						if (response.success)
						{
							scope.fireEvent('deleteTagsComplete',response);
						}
					}
				}
			}

		objReqQ.postRequest(objConf);

		objReqQ.proccess(scope);
	},

	onDeleteTagsComplete : function(response){
		
                var listViewStore = Ext.getCmp('listView').getStore();
                
		var arr_tag_id = explode("/",response.dataSend.tag_list);
		
                Ext.each(arr_tag_id,function(item, index){
                        
			scope.tagsStore.remove(item);
                        
                        //console.log(item);
                        var idxInListView = listViewStore.find("realId", item);
                        if (idxInListView != -1)
                            listViewStore.removeAt(idxInListView);
                        
                        Ext.getCmp('pnlTree').getNodeById("tags_" + item).remove(true);
                        
		});
		
		//scope.fireEvent('loadTreeNodes',null);
	},
	//***********************************************************************************************************************************
	onProcessApplyTags : function(eventData){
		var reqConfs = {
					'data' : {'doc_id' : eventData.doc_id, 'tag_list' : eventData.tags2remove},
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							scope.fireEvent('applyTags',{'doc_id' : eventData.doc_id, 'tag_list' : eventData.tags2add});
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_remove_tags(reqConfs);		
		
	},

	onApplyTags : function(eventData){
		
		if (eventData.tag_list != "" && eventData.tag_list != null && eventData.tag_list != " ")
		{
			var reqConfs = {
						'data' : {'doc_id' : eventData.doc_id, 'tag_list' : eventData.tag_list},
						'objQueue' : null,
						'cb_start' : scope.helperFuncs.ajaxStart,
						'cb_success' : function(response){
							if (response.success)
							{
								scope.fireEvent('applyTagsComplete',{'doc_id' : eventData.doc_id, 'tag_list' : eventData.tag_list});
							}
						},
						'cb_fail' : scope.helperFuncs.ajaxFail,
						'cb_eofq' : scope.helperFuncs.endAjaxQueue
			}

			scope.serverReqs.cmd_set_tags(reqConfs);		
		}
		else
		scope.fireEvent('applyTagsComplete',{'doc_id' : eventData.doc_id, 'tag_list' : eventData.tag_list});

	},
	
	onApplyTagsComplete : function(eventData){
		
			var d = scope.listView.panel.getStore().getAt(scope.gridLastSelectedRowIndex).get('tags');
			var tags2add = explode("/",eventData.tag_list);
					
			while(d.length > 0) 
			{
				d.shift();
			}
			
			for(var i = 0; i < tags2add.length; i++)
			{
				d.push(tags2add[i]);
			}
			
			scope.listView.panel.getStore().commitChanges();
			scope.listView.panel.getView().refresh();
	},
	
	onRemoveTags : function(eventData){
		
		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							//nothing to do
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_remove_tags(reqConfs);
	},
	//***********************************************************************************************************************************
	onBookmarkDoc : function(eventData){
		
		scope.processManager.reset();
		
		scope.processManager.pushTask({
				
			state : 0,
			note : scope.processManager.textLayout.waitingMsg,
			name : Messages.process_cmd_set_bookmark_doc,
			cmd : scope.CMD.cmd_set_bookmark_doc,
			params : eventData,
			onStart: function(idx){
				scope.clientHdls.updateStatus('start',Messages.in_process_cmd_set_bookmark_doc,'center_region');					
			},
			onComplete: function(response,taskIndex,sendedData){
				if (response.success)
				{
					scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_set_bookmark_doc,'center_region');
											
					var rec = scope.filesStore.data.items[scope.gridLastSelectedRowIndex];
					rec.set('bookmarked',true);		
					rec.commit();
					
					scope.listView.panel.getView().refresh();
					scope.toolBar.fireEvent('refresh',null);
					
					if (rec.get('type') == 'folder')
					{
						var newNode = new Ext.tree.TreeNode({text : rec.get('name'), 
											 id : "bookmarks_" + rec.get('realId'), 
											 _id : "bookmarks_" + rec.get('realId'), 
											 type : "folder", 
											 schema: "bookmarks", 
											 cls : 'x-tree-node-collapsed'});

						scope.pnlTree.getRootNode().childNodes[5].appendChild(newNode);
					}
				}
			}			
		});
		
		scope.processManager.beginProcess();
	},

	// MARK FOR FUTURE REMOVE
	onBookmarkDocComplete : function(jsonResp){
		scope.fireEvent('loadTreeNodes',null);
	},
	//***********************************************************************************************************************************
	onRemoveBookmarkDoc : function(eventData){

		scope.processManager.reset();

		for(var i = 0; i < eventData.bookmarks.foldersCount; i++)
		{
			scope.processManager.pushTask({
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_remove_bookmark_doc + " '" + scope.selectedDocs.folders[i].name +"' ",
				cmd : scope.CMD.cmd_remove_bookmark_doc,
				params : {'doc_id': eventData.bookmarks.folders[i].realId},
				onStart: function(idx){
					scope.clientHdls.updateStatus('start',Messages.process_cmd_remove_bookmark_doc + " '" + scope.selectedDocs.folders[idx].name +"' ",'center_region');
				},
				onComplete: function(response,taskIndex,sendedData){
					if (response.success)
					{
						if (scope.state.label.indexOf("[bookmarks][schema]") != -1)
						{
						}
						else
						{
							var rec = scope.filesStore.data.items[scope.gridLastSelectedRowIndex];

							rec.set('bookmarked',false);		
							rec.commit();

							scope.listView.panel.getView().refresh();
						}
						
						var bookmark_Node = scope.pnlTree.getRootNode().childNodes[5];
						var node2Rem = bookmark_Node.findChild('_id',"bookmarks_" + sendedData.doc_id);

						bookmark_Node.removeChild(node2Rem,true);
					}
				}
			});
		}

		scope.processManager.on('ajaxReqTaskTotalCompleteEvent',function(taskIndex){
			
			scope.clientHdls.updateStatus('success', Messages.compl_process_cmd_remove_bookmark_doc,'center_region');
			scope.toolBar.fireEvent('refresh',null);
		});
		
		scope.processManager.beginProcess();
	},
	//***********************************************************************************************************************************
	onPublish : function(eventData){

		var reqConfs = {
					'data' : {'doc_id_list' : eventData.doc_id_list, 'glob' : eventData.glob},
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							//scope.fireEvent('publishComplete',response);
                                                        Ext.getCmp('listView').getSelectionModel().getSelections()[0].set("global_public",eventData.glob);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_set_global(reqConfs);
	},
	
	onPublishComplete : function(jsonResp){
		scope.fireEvent('loadTreeNodes',null);
	},
	//***********************************************************************************************************************************
	
	onZip : function(eventData){
		
		Ext.MessageBox.prompt('Zip Files', 'Archive name', function(response, text) {
			if (response == "ok")
			{
				scope.processManager.reset();
				scope.processManager.fillTaskStore([
									{
										state : 0,
										note : scope.processManager.textLayout.waitingMsg,
										name : Messages.process_cmd_zip,
										cmd : scope.CMD.cmd_zip_files,
										params : {'doc_id_list': eventData.doc_id_list, 'name': text},
										onStart: function(){

											scope.clientHdls.updateStatus('start',Messages.in_process_cmd_zip,'center_region');
										},
										onComplete: function(response,taskIndex,sendedData){

											if (response.success)
											{
												scope.processManager.pushTaskAt(++taskIndex,{
																state : 0,
																note : scope.processManager.textLayout.waitingMsg,
																name : Messages.process_cmd_ls,
																cmd : scope.CMD.cmd_ls,
																params : {
																	'doc_id' : scope.curTreeNodSel.realId,
																	'path' : scope.curTreeNodSel.path,
																	'group_id' : scope.curTreeNodSel.group_id
																},
																onComplete : function(response,taskIndex,sendedData){
																					
																	scope.currentLsArgs = sendedData;
			
																	if (response.success)
																	{
																		scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_zip,'center_region');

																		scope.fireEvent('loadDirContentComplete',response);
													
			
																		delete scope.state.ls;
																		delete scope.state.nav;
			
																		scope.currDocId = scope.curTreeNodSel.realId;										
																	}
																}
															});
											}
											else
											{
												return scope.processManager.abortAllAjaxReqTask();
											}
										}
									}
								]);
				scope.processManager.beginProcess();				
			}
		});
	},	
	
	onExtract : function(eventData){

		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							//scope.fireEvent('extractComplete',response);
							scope.fireEvent('loadTreeNodes',null);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_extract(reqConfs);
	},

	onExtractComplete : function(jsonResp){
		scope.fireEvent('loadDirContent',{'doc_id' : scope.curTreeNodSel.realId,'path' : scope.curTreeNodSel.path, 'group_id' : scope.curTreeNodSel.group_id});
	},
	//***************************************************************************************************************
	onLoadGroups : function(eventData){

		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							scope.fireEvent('loadGroupsComplete',response);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}

		scope.serverReqs.cmd_get_groups(reqConfs);
	},
	
	onLoadGroupsComplete : function(jsonResp){
		
		Ext.each(jsonResp.groups,function(group,index){
				scope.groupsStore[group._id.toString()] = group;
				
				/**/
				scope.groupsStore2.add( new scope.groupsStore2.recordType(group) );
				/**/
		});
	},
	//***************************************************************************************************************
	onPromptCreateGroup : function(eventData){
		
		Ext.MessageBox.prompt( Messages.group_create, Messages.name, function(response, text) {
			if (response == "ok")
			{
				if (scope.groupsStore2.find('group_name',text) != -1)
				{
					Ext.MessageBox.alert( Messages.error_group_create, Messages.error_group_exists );
				}
				else
				{
					scope.fireEvent('createGroup',{'group_name':text});
				}
			}
		});
	},

	onCreateGroup : function(eventData){
		
		var reqConfs = {
					'data' : eventData,
					'objQueue' : null,
					'cb_start' : scope.helperFuncs.ajaxStart,
					'cb_success' : function(response){
						if (response.success)
						{
							//scope.fireEvent('createGroupComplete',response);
							
							scope.groupsStore2.add( new scope.groupsStore2.recordType({_id : response.group_id,group_name : response.name}) );
							
							scope.groupsStore[response.group_id.toString()] = {_id : response.group_id,group_name : response.name};

							scope.fireEvent('loadDirContent',scope.currentLsArgs);
						}
					},
					'cb_fail' : scope.helperFuncs.ajaxFail,
					'cb_eofq' : scope.helperFuncs.endAjaxQueue
		}
		
		scope.serverReqs.cmd_create_group(reqConfs);
	},
	
	
	onCreateGroupComplete : function(jsonResp){

		
		scope.groupsStore[jsonResp.group_id.toString()] = {"_id": jsonResp.group_id, 
														   "group_name": jsonResp.name};
		
		var nodeId = "sharedINgroupsIN" + jsonResp.group_id + "_" + jsonResp.group_id;
		var nodeSchema = "sharedINgroupsIN" + jsonResp.group_id;
		
		var newNode = new Ext.tree.TreeNode({text : jsonResp.name, 
											 id : nodeId, 
											 _id : nodeId, 
											 type : "folder", 
											 schema: nodeSchema, 
											 cls : 'x-tree-node-collapsed'});
		
		scope.pnlTree.getRootNode().childNodes[3].childNodes[1].appendChild(newNode);
		

		scope.fireEvent('loadDirContent',{'doc_id' : scope.curTreeNodSel.realId,'path' : scope.curTreeNodSel.path, 'group_id' : scope.curTreeNodSel.group_id});
	},
	//***********************************************************************************************************************************
	onUnshareDocGroups : function(eventData){

		var objReqQ = new Ext.ux.MyUtils.RequestQueue();
		
		for (var i = 0; i < eventData.groups2unshare.length; i++) 
		{
			var objConf = {
				'action': scope.serverReqs.cmd_unshare_doc_group,
				'reqConfs' : {
					'data': {'doc_id' : eventData.doc_id,'group_id' : eventData.groups2unshare[i]},
					'objQueue': objReqQ,
					'cb_start': eventData.cb_start || scope.helperFuncs.ajaxStart,
					'cb_success': eventData.cb_success || scope.helperFuncs.ajaxSuccess,
					'cb_fail': eventData.cb_fail || scope.helperFuncs.ajaxFail,
					'cb_eofq': eventData.cb_eofq || function(response){
					}
				}
			}

			objReqQ.postRequest(objConf);
		}
			
		objReqQ.proccess(scope);
	},
	
	onShareDocGroups : function(eventData){
		
		var objReqQ = new Ext.ux.MyUtils.RequestQueue();
		
		for (var i = 0; i < eventData.groups2share.length; i++) 
		{
			var objConf = {
				'action': scope.serverReqs.cmd_share_doc_group,
				'reqConfs' : {
					'data': {'doc_id' : eventData.doc_id,'group_id' : eventData.groups2share[i]},
					'objQueue': objReqQ,
					'cb_start':	eventData.cb_start || scope.helperFuncs.ajaxStart,
					'cb_success': eventData.cb_success || scope.helperFuncs.ajaxSuccess,
					'cb_fail': eventData.cb_fail || scope.helperFuncs.ajaxFail,
					'cb_eofq': eventData.cb_eofq ||  function(response){
					}
				}
			}

			objReqQ.postRequest(objConf);
		}

		objReqQ.proccess(scope);
	},	
	//***********************************************************************************************************************************
	onProcessApplyGroups : function(eventData){

		var objReqQ = new Ext.ux.MyUtils.RequestQueue();
		
		if (eventData.groups2unshare.length > 0)
		{
			for (var i = 0; i <= eventData.groups2unshare.length-1; i++) 
			{
				var objConf = {
					'action': scope.serverReqs.cmd_unshare_doc_group,
					'reqConfs' : {
						'data': {'doc_id' : eventData.doc_id,'group_id' : eventData.groups2unshare[i]},
						'objQueue': objReqQ,
						'cb_start': eventData.cb_start || scope.helperFuncs.ajaxStart,
						'cb_success': eventData.cb_success || scope.helperFuncs.ajaxSuccess,
						'cb_fail': eventData.cb_fail || scope.helperFuncs.ajaxFail,
						'cb_eofq':eventData.cb_eofq || function(response){
							if (response.success)
							scope.fireEvent('applyGroups',{'doc_id' : eventData.doc_id, 'groups2share' : eventData.groups2share});
						}
					}
				}
	
				objReqQ.postRequest(objConf);
			}
			
			objReqQ.proccess(scope);
		}
		else
		scope.fireEvent('applyGroups',{'doc_id' : eventData.doc_id, 'groups2share' : eventData.groups2share});
	},

	onApplyGroups : function(eventData){
		
		var objReqQ = new Ext.ux.MyUtils.RequestQueue();
		
		if (eventData.groups2share.length > 0)
		{
			for (var i = 0; i <= eventData.groups2share.length-1; i++) 
			{
				var objConf = {
					'action': scope.serverReqs.cmd_share_doc_group,
					'reqConfs' : {
						'data': {'doc_id' : eventData.doc_id,'group_id' : eventData.groups2share[i]},
						'objQueue': objReqQ,
						'cb_start':	scope.helperFuncs.ajaxStart,
						'cb_success': scope.helperFuncs.ajaxSuccess,
						'cb_fail': scope.helperFuncs.ajaxFail,
						'cb_eofq': function(response){
							if (response.success)
							scope.fireEvent('applyGroupsComplete',{'doc_id' : eventData.doc_id, 'group_list' : eventData.groups2share});
						}
					}
				}

				objReqQ.postRequest(objConf);
			}

			objReqQ.proccess(scope);
		}
		else
		scope.fireEvent('applyGroupsComplete',{'doc_id' : eventData.doc_id, 'group_list' : eventData.groups2share});
	},
	
	onApplyGroupsComplete : function(eventData){
		scope.fireEvent('loadTreeNodes',null);
	},
	//***********************************************************************************************************************************
	onConfirmDeleteGroups : function(eventData){
		
		
		Ext.Msg.show({
						title:'Delete?',
						msg: String.format('Are you sure you want to delete these {0} group(s)?',eventData.groups.length),
						buttons: Ext.Msg.YESNOCANCEL,
						fn: function(response, text) {
							if (response == "yes")
							{		
								scope.fireEvent('deleteGroups',eventData.groups);
							}
						},
						icon: Ext.MessageBox.QUESTION
		});
	},
	/*****************/
	onDeleteGroups : function(arrayGroups){
		
		scope.processManager.reset();
		
		for (var i = 0; i < arrayGroups.length; i++)
		{
			scope.processManager.pushTask({
				
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_group_delete + " '" + arrayGroups[i].name + "'",
				cmd : scope.CMD.cmd_group_delete,
				params : {'group_id' : arrayGroups[i].realId, 'group_name' : arrayGroups[i].name},
				onStart: function(idx){
					scope.clientHdls.updateStatus('start',Messages.process_cmd_group_delete + " '" + arrayGroups[idx].name + "'...",'center_region');
				},
				onComplete: function(response,taskIndex,sendedData){
					
					//console.log(sendedData);
					
					delete scope.groupsStore[sendedData.group_id.toString()];
							
					var rowIdx = scope.groupsStore2.find('_id',sendedData.group_id);
		
					if (rowIdx >= 0 ) 
					{
						var rec = scope.groupsStore2.getAt(rowIdx);
						scope.groupsStore2.remove(rec);
					}
				}
			});
		}
		
		scope.processManager.on('ajaxReqTaskTotalCompleteEvent',function(taskIndex){
			
			scope.processManager.pushTaskAt(++taskIndex,{
				state : 0,
				note : scope.processManager.textLayout.waitingMsg,
				name : Messages.process_cmd_ls,
				cmd : scope.CMD.cmd_ls,
				params : {
					'doc_id' : scope.curTreeNodSel.realId,
					'path' : scope.curTreeNodSel.path,
					'group_id' : scope.curTreeNodSel.group_id
				},
				onComplete : function(response,taskIndex,sendedData){
																
					scope.currentLsArgs = sendedData;
	
					if (response.success)
					{
						scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_group_delete,'center_region');

						scope.fireEvent('loadDirContentComplete',response);
											
	
						delete scope.state.ls;
						delete scope.state.nav;
	
						scope.currDocId = scope.curTreeNodSel.realId;
		
						scope.processManager.purgeListeners();
					}
				}
			});
			
			scope.processManager.setAjaxReqFlag();
			scope.processManager.prepareNextAjaxReqTask();
		});

		scope.processManager.beginProcess();
	},
	
	/*****************/

	onDeleteGroupsComplete : function(response){

		delete scope.state.ls;
		delete scope.state.nav;

		scope.fireEvent('loadDirContent',scope.currentLsArgs);
	}

}
);
