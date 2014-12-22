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
							//loader: new Ext.tree.TreeLoader(),
							loader: new Ext.tree.TreeLoader({
								dataUrl: scope.CMD.cmd_tree,
								nodeParameter: "doc_id",
								processResponse : function(response, node, callback, scope){

									console.log('-->loader processResponse');

									//console.log(node);

									var loader = this;

									var json = response.responseText;

									try {

										var o = response.responseData || Ext.decode(json);

										// myfiles custom path to children
										o = o.tree.children;

										var createNodeRecur = function(cNode, nChilds, depth){
											cNode.beginUpdate();
											for(var i = 0, len = nChilds.length; i < len; i++){
												
												var n = loader.createNode(nChilds[i]);
												
												//console.log(n);
												if(n){
													
													n.attributes["depth"] = depth;
													
													cNode.appendChild(n);
													
													if (typeof n.attributes.childNodes != "undefined" && n.attributes.childNodes.length > 0){
														createNodeRecur(n, n.attributes.childNodes, (n.attributes["depth"] + 1));
													}
												}
												//console.log(n.text + " : " + n.attributes.depth);
											}
											cNode.endUpdate();
										};

										if (typeof node.attributes.depth != "undefined"){
											var depth = node.attributes.depth + 1;
										}
										else {
											var depth = 0;
										}
										
										createNodeRecur(node, o, depth);

										this.runCallback(callback, scope || node, [node]);
									}catch(e){
										this.handleFailure(response);
									}

									console.log('loader processResponse-->');
								},
								createNode: function(obj) {

									console.log('-->loader createNode ' + obj.name);
									
									var objNode = obj.node;
									
									var objChildren = obj.children;
									
									var loader = this;
									
									var schema = '';
									
									var nodeToFill = scope.pnlTree.nodeToFill;
																		
									if ( nodeToFill == scope.pnlTree.getRootNode() ) {
										scope.treeHomeFolders = new Object();
									}
									
									var curSchema = (nodeToFill.getPath()).split("/",3)[2] || "";
									
									//console.log( "Current Schema :" +  curSchema);
																		
									var nodeText = objNode.name.toString();
									var nodeType = objNode.type.toString();
									var nodeId = (nodeType=="tag" || nodeType=="user") ? nodeText : (objNode._id).toString();

									if ( objNode.type == 'schema' )
									{		
										schema = objNode.name;
										nodeId = schema + "_" + nodeId;
									}
									else
									{
										if (in_array(objNode.name,["users","groups","schools"]) && nodeToFill.attributes.schema == 'shared' )
										{
											schema = "sharedIN" + objNode.name;
											nodeId = schema + "_" + nodeId;
										}
										else if (in_array(nodeToFill.attributes.schema,['sharedINgroups','sharedINusers','sharedINschools']))
										{
											schema = curSchema + "IN" + nodeId;
											nodeId = schema + "_" + nodeId;
										}
										else
										{	
											schema = curSchema;
											nodeId = schema + "_" + nodeId;
										}
									}
									
									/*if (typeof obj.children != "undefined" && obj.children.length > 0){
										nodeProperties = Ext.extend(nodeProperties,{
											childNodes: obj.children
										});
									}
									*/

									if (typeof obj.children != "undefined" && obj.children.length > 0){	

										var currentNode = new Ext.tree.TreeNode({
											text : nodeText,
											id : objNode._id,
											_id : nodeId,
											type : nodeType,
											schema: schema,
											childNodes: obj.children,
											expandable:true
											//depth : depth
										});
									}
									else {

										var currentNode = new Ext.tree.AsyncTreeNode({
											text : nodeText,
											id : objNode._id,
											_id : nodeId,
											type : nodeType,
											schema: schema,
											childNodes: obj.children,
											expandable:true
											//depth : depth
										});
									}

									if (typeof nodeToFill.attributes.schema != "undefined")
									{
										if ( nodeToFill.attributes.schema == 'home' ) 
										{	
											if ( objNode.type == 'folder' ) 
												scope.treeHomeFolders[ objNode._id ] = currentNode;
										}

										if ( nodeToFill.attributes.schema == 'bookmarks' ) 
										{
											if ( objNode.type == 'folder' && scope.treeHomeFolders[ objNode._id ] ) 
											{
												currentNode.attributes.ref = scope.treeHomeFolders[ objNode._id ];		
											}
										}
									}

									console.log('loader createNode ' + objNode.name + ' -->');

									return currentNode;
								}
							}),
							//expanded: true,
							root: new Ext.tree.AsyncTreeNode({
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
												params : {'doc_id':'wfm_root'},
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
								'beforeload': function(node){
									console.log("-->beforeload");

									this.nodeToFill = node;
									
									console.log("beforeload-->");
								},
								'expandnode': function(node){
									console.log("-->Expand Node");
									console.log("Expand Node-->");
								},
								'click': function(node, e) {
									console.log('-->Click Node');
									
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
									
									console.log('Click Node-->');
								},
								load: function(loader,node,response) {
									//console.log(node);
								}
							}
					});
					
					scope.pnlTree.getLoader().on("beforeload", function(treeLoader, node) {					
						//this.baseParams["doc_id"] = node.id;
					}, scope.pnlTree.getLoader());
		}

	}
);