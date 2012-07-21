// JavaScript Document
Ext.apply(Tei.Wfm.App.prototype.UI,
	{
		init_TreePanel : function(){
			
				scope.pnlTree = new Ext.tree.TreePanel({
							id:'pnlTree',
							region: 'north',
							height: 250,
							minSize: 150,
							autoScroll: true,
							lines: false,
							containerScroll: true,
							animate: true,							
							loadMask: true,
							border: false,
							title : '<b>' + Messages.directory_tree + '</b>',
							rootVisible: false,
							loader: new Ext.tree.TreeLoader(),
							root: new Ext.tree.TreeNode({
									text: 'wfm_root',
									draggable: false,
									id: 'wfm_root',
									expanded: true
							}),
							tools:[{
                            	id:'refresh',
	                            on:{
    	                            click: function(){
										//scope.fireEvent('loadTreeNodes',null);
										
										/*---------process ajax reqs-------------*/
										scope.processManager.reset();
										scope.processManager.fillTaskStore([
											{
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
																	
																	scope.clientHdls.unmaskApp();
																	scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_ls,'center_region');
																}
															}
														});
													}
												}
											}
											
										]);
										scope.processManager.beginProcess();
                                	}
                            	}
                        	}],							
							listeners: {

								'click': function(node, e) {
									
									Ext.ComponentMgr.get('tbtLocation').updateLocation(node,null);
									node.select();
									
									scope.clientHdls.setCurrTreeNodeAttr(node);

									var eventData = null;
																			
									eventData = {'doc_id' 	: scope.curTreeNodSel.realId,
												 'path'   	: scope.curTreeNodSel.path,
												 'group_id' : scope.curTreeNodSel.group_id};
									
									/*---------process ajax reqs-------------*/
									scope.processManager.reset();
									scope.processManager.fillTaskStore([
										
										{
											state : 0,
											note : scope.processManager.textLayout.waitingMsg,
											name : Messages.process_cmd_ls,
											cmd : scope.CMD.cmd_ls,
											params : {
												'doc_id' : scope.curTreeNodSel.realId,
												'path' : scope.curTreeNodSel.path,
												'group_id' : scope.curTreeNodSel.group_id
											},
											onStart : function(){

												scope.clientHdls.updateStatus('start',Messages.in_process_cmd_ls,'center_region');
											},

											onComplete : function(response,taskIndex,sendedData){
																
												scope.currentLsArgs = sendedData;

												if (response.success)
												{
													scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_ls,'center_region');

													scope.fireEvent('loadDirContentComplete',response);
								

													delete scope.state.ls;
													delete scope.state.nav;

													scope.currDocId = scope.curTreeNodSel.realId;										
												}
											}
										}										
										
									]);
									scope.processManager.beginProcess();
									/*--------------------------------*/

									scope.clientHdls.setAppState();
									scope.toolBar.fireEvent('refresh',null);

									delete scope.state.ls;
									delete scope.state.nav;

									scope.currDocId = scope.curTreeNodSel.realId;
								}
							}
					});
		}

	}
);