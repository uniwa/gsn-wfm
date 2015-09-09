Ext.apply(
  Tei.Wfm.App.prototype.clientHdls,
  {
	scope : this.scope,

	setAppState : function(){
		console.log("-->setAppState()");
		try
		{
			var schema =  scope.curTreeNodSel.attributes.schema; 
			schema = (schema.indexOf("sharedINusersIN") != -1)? "sharedINusersIN" : schema;
			schema = (schema.indexOf("sharedINgroupsIN") != -1)? "sharedINgroupsIN" : schema;
                        schema = (schema.indexOf("sharedINschoolsIN") != -1)? "sharedINschoolsIN" : schema;
			var type = scope.curTreeNodSel.attributes.type;

			if (scope.selectedDocs.length == 0)
				var recType = 'undefined';
			else if (scope.selectedDocs.length == 1)
				//var recType = scope.selectedDocs[0].data.type;
				var recType = scope.selectedDocs.first.type;
			else
				var recType = 'multi';
			
			var lastState = Ext.applyIf({},scope.state);
			
			scope.state = new scope.appState[schema][type][recType](lastState);
		}
		catch(e){
			
			console.log("catch");
			scope.state.cmd =  Ext.applyIf({},scope.AppCmd);
		}
		finally{
			scope.state.label = "[" + schema + "][" + type + "][" + recType + "]";
			//scope.clientHdls.refreshToolbar();
		}
		console.log("setAppState()-->");
	},
	
	refreshToolbar : function(){
		console.log("-->refreshToolbar()");
		
		Ext.each(scope.toolBar.items.items,function(btn,index){

			if (btn.type == 'button'){
				if ( scope.state.cmd[btn.cmd[0]] === true){
					btn.setVisible(true);
					btn.enable();
				}
				else{
					btn.setVisible(false);
					btn.disable();
				}
			}
		});
		
		console.log("-->refreshToolbar()");
	},
	
	maskApp : function(message){
		scope.myMask = new Ext.LoadMask(Ext.getBody(), {msg:message});
		scope.myMask.show();
	},

	unmaskApp : function(){
		scope.myMask.hide();
	},

	updateStatus : function(state,msg,maskedLayer){

		switch(state)
		{
			case 'start':
				Ext.get(maskedLayer).mask(Messages.loading, 'x-mask-loading');
				Ext.get('statusTxt').removeClass(['readyStatusBar','errorStatusBar']);
				Ext.get('statusTxt').addClass('loading');
				break;
			case 'success':
				Ext.get(maskedLayer).unmask();
				Ext.get('statusTxt').removeClass('loading');
				Ext.get('statusTxt').addClass('readyStatusBar');
				break;
			case 'fail':
			case 'connection_problem':
				Ext.get(maskedLayer).unmask();
				Ext.get('statusTxt').removeClass('loading');
				Ext.get('statusTxt').addClass('errorStatusBar');
				break;
		}
		
		Ext.get('statusTxt').update(msg);
		Ext.getCmp('statusBar').doLayout();
	},
	/*--- ---*/
	prepareDocsIdList : function(action){

		scope.helperFuncs.flushDocIdList.call(scope);

		scope.action4doc_id_list = action;
		Ext.each(scope.selectedDocs,function(rec,index){
			
			if (action == "copy" || action == "move")
			scope.doc_id_list.push(rec.data);
			else
			scope.doc_id_list.push(rec.get('realId'));
		});

		if (scope.doc_id_list.length > 0)
		scope.toolBar.items.get('tb_paste').enable();
	},
	
	updateToolbar : function(actionsID){
		
		console.log("-->updateToolbar()");
	
		Ext.each(scope.toolBar.items.items,function(btn,index){
			if (in_array(btn.actionID,actionsID))
			{
				//btn.setVisible(true);
				btn.enable();
			}
			else
			{
				//btn.setVisible(false);
				btn.disable();
			}
		});
		
		console.log("updateToolbar()-->");
	},
	
	createSelectedSet : function(selections){
	
		var totalSize = 0;
		var fileArray = new Array();
	    var folderArray = new Array();
	    var tagArray = new Array();
	    var groupArray = new Array();
		var userArray = new Array();
		var doc_id_Array = new Array();
		var tag_id_Array = new Array();
		var group_id_Array = new Array();
		var user_id_Array = new Array();

		Ext.each(selections, function(rec) {
			
			totalSize += rec.data.size;
			
			switch(rec.data.type)
			{
				case "folder":
					folderArray.push(rec.data);
					doc_id_Array.push(rec.get('realId'));
					break;
				case "file":
					fileArray.push(rec.data);
					doc_id_Array.push(rec.get('realId'));
					break;
				case "tag":
					tagArray.push(rec.data);
					tag_id_Array.push(rec.get('realId'));
					break;
				case "group":
					groupArray.push(rec.data);
					group_id_Array.push(rec.get('realId'));
					break;
				case "user":
					userArray.push(rec.data);
					user_id_Array.push(rec.get('realId'));
					break;
			}
    	});
	
		var selectedNode = scope.pnlTree.getSelectionModel().getSelectedNode();
	    var filePath = selectedNode.attributes.path;
		var selectedNodeSchema = selectedNode.attributes.schema;
		
    	var selectedSet = {};
	    selectedSet["path"] = filePath;
	    selectedSet["schemaWork"] = selectedNodeSchema;

		selectedSet["files"] = fileArray;
	    selectedSet["folders"] = folderArray;
		selectedSet["tags"] = tagArray;
		selectedSet["groups"] = groupArray;
		selectedSet["users"] = userArray;
		selectedSet["doc_id_list"] = implode("/",doc_id_Array);
		selectedSet["tag_id_list"] = implode("/",tag_id_Array);
		selectedSet["group_id_list"] = implode("/",group_id_Array);
		selectedSet["user_id_list"] = implode("/",user_id_Array);

    	selectedSet["filesCount"] = fileArray.length;
	    selectedSet["foldersCount"] = folderArray.length;
	    selectedSet["tagsCount"] = tagArray.length;
	    selectedSet["groupsCount"] = groupArray.length;
	    selectedSet["usersCount"] = userArray.length;

		selectedSet["firstAsRec"] = (selections.length > 0) ? selections[0] : null;
		selectedSet["lastAsRec"] = (selections.length > 0) ? selections[selections.length-1] : null;
		
		selectedSet["first"] = (selections.length > 0) ? selections[0].data : null;
		selectedSet["last"] = (selections.length > 0) ? selections[selections.length-1].data : null;
		selectedSet["length"] = selections.length;
		selectedSet["totalSize"] = totalSize;
		
		return selectedSet;
	},
	
	setCurrTreeNodeAttr : function(node){
		
		scope.curTreeNodSel = node;
		scope.curTreeNodSel.rootNode = scope.clientHdls.findRootNode(scope.curTreeNodSel);
		scope.curTreeNodSel.schema = split("_",scope.curTreeNodSel.id).shift();
										
		if (in_array(scope.curTreeNodSel.attributes.type,["tag","user"])) {
			scope.curTreeNodSel.realId = scope.curTreeNodSel.attributes.type;
		}
		else {
			scope.curTreeNodSel.realId = split("_",scope.curTreeNodSel.id).pop();
		}
										
		scope.curTreeNodSel.path = str_replace('/wfm_root/','root/',scope.curTreeNodSel.getPath('text'));
										
		if (scope.curTreeNodSel.id.indexOf("sharedINgroupsIN") != -1 ) {
			scope.curTreeNodSel.group_id  = split('_',split('sharedINgroupsIN',scope.curTreeNodSel.id).pop()).shift();
		}
		else {
			scope.curTreeNodSel.group_id = null;
		}
	},
	
	findRootNode : function(node){
		var currNode = node;

		while(typeof currNode.parentNode == 'object' && currNode.parentNode.text != 'wfm_root')
		{
			currNode = 	currNode.parentNode;
		}

		return currNode;
	},

	buildTree : function(nodeToFill,children,curSchema,depth){

		depth++;
		
		if ( nodeToFill == scope.pnlTree.getRootNode() ) {
			scope.treeHomeFolders = new Object();
		}

		var schema = '';

		for(var i=0; i < children.length; i++)
		{
			var child = children[i];
			var nodeText = child.node.name.toString();
			var nodeType = child.node.type.toString();
			var nodeId = (nodeType=="tag" || nodeType=="user") ? nodeText : (child.node._id).toString();

			if ( child.node.type == 'schema' ) 
			{
				schema = child.node.name;
				nodeId = schema + "_" + nodeId;
			}
			else
			{
				if (in_array(child.node.name,["users","groups","schools"]) && nodeToFill.attributes.schema == 'shared' )
				{
					schema = "sharedIN" + child.node.name;
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

			var currentNode = new Ext.tree.TreeNode({text : nodeText,
													 id : nodeId,
													 _id : nodeId,
													 type : nodeType,
													 nodeType:'async',
													 schema: schema,
													 depth : depth,
													 expandable:true,
													 leaf:true,
													 cls : 'x-tree-node-collapsed'});

			if ( nodeToFill.attributes.schema == 'home' ) 
			{
				if ( child.node.type == 'folder' ) 
					scope.treeHomeFolders[ child.node._id ] = currentNode;
			}

			if ( nodeToFill.attributes.schema == 'bookmarks' ) 
			{
				if ( child.node.type == 'folder' &&
					 scope.treeHomeFolders[ child.node._id ] ) 
				{
					currentNode.attributes.ref = scope.treeHomeFolders[ child.node._id ];		
				}
			}

			nodeToFill.appendChild(currentNode);
			
			if (typeof child["children"] != "undefined")
			{
				if (child.children.length > 0)
				{
					scope.clientHdls.buildTree.call(scope,currentNode,child.children,schema,depth);
				}
			}
			
		}
		
		depth--;

		if ( nodeToFill == scope.pnlTree.getRootNode() ) 
		{
			delete scope.treeHomeFolders;
		}
	},
	
	setViewMode : function(mode){
		
		if (mode != undefined)
			scope.viewMode = mode;
		else
			scope.viewMode = (scope.viewMode == "thumbs") ? scope.viewMode = "details" : scope.viewMode = "thumbs";

		try	
		{
			Ext.getCmp('center_region').remove(scope.filesView);
		}
		catch(e){}

		scope.UI.init_ViewMode();
		
		try
		{
			Ext.getCmp('center_region').items.add(scope.filesView);
			Ext.getCmp('center_region').fireEvent('bodyresize');
			Ext.getCmp('center_region').doLayout();
		}
		catch(e){}
	},
	
	dblClick_doc : function(dataView , rowIndex, node, e){
		
		
		//**
		if (scope.state.ls != "undefined" && scope.state.ls != null)
		{
			scope.processManager.reset();

			scope.processManager.fillTaskStore([
				{
					state : 0,
					note : scope.processManager.textLayout.waitingMsg,
					name : Messages.process_cmd_ls,
					cmd : scope.CMD.cmd_ls,
					params : scope.state.ls,
					onStart : function(){
						scope.clientHdls.updateStatus('start',Messages.in_process_cmd_ls,'center_region');
					},
					onComplete : function(response,taskIndex,sendedData){

						scope.currentLsArgs =  Ext.applyIf({},sendedData);

						if (response.success)
						{						
							scope.state.ls.path = scope.state.ls.path.substring(0,(--scope.state.ls.path.length)-scope.state.filename.length);
							scope.clientHdls.updateStatus('success',Messages.compl_process_cmd_ls,'center_region');

							scope.fireEvent('loadDirContentComplete',response);

							scope.state.nav.push(scope.state.step);
							Ext.applyIf(scope.state.nav[scope.state.nav.length-1],{'nav' : scope.state.nav.slice()});

							Ext.ComponentMgr.get('tbtLocation').updateLocationBreadcrumbs(scope.curTreeNodSel,scope.state.nav)
							
							//console.log(sendedData);
							//scope.currentLsArgs = {doc_id:};
						}
					}
				}
			]);

			scope.processManager.beginProcess();

			return 1;
		}
		//**
		
		//console.log(dataView);
		//console.log(rowIndex);
		
		var r = dataView.getStore().getAt(rowIndex);

		if (r.data.type == 'folder' || r.data.type == 'group')
		{
			if (scope.curTreeNodSel.schema == "tags")
			{
				var idNodeInHomeSchema = r.data.id;
				var wfmRootNode = scope.pnlTree.getRootNode();
				var targetNode = wfmRootNode.childNodes[0].findChild('_id',idNodeInHomeSchema,true);
				var pathOfTargetNode = targetNode.getPath('_id');
				scope.pnlTree.selectPath(pathOfTargetNode,'_id',function(a,b){scope.pnlTree.fireEvent('click',b);});
			}
			else if(scope.curTreeNodSel.schema == "bookmarks")
			{
				var idNodeInHomeSchema = "home_" + r.data.realId;
				var wfmRootNode = scope.pnlTree.getRootNode();
				var targetNode = wfmRootNode.childNodes[0].findChild('_id',idNodeInHomeSchema,true);
				var pathOfTargetNode = targetNode.getPath('_id');
				scope.pnlTree.selectPath(pathOfTargetNode,'_id',function(a,b){scope.pnlTree.fireEvent('click',b);});
			}
			else
			{
				r.data.containerNode.expand(false, true, function(node){
					
					console.log("-->Auto Expand Node");
					
					Ext.each(node.childNodes,function(treeNode,index){
						console.log(treeNode.attributes.id + " ||| " + r.data.realId);
						if (treeNode.attributes.id == r.data.realId)
						{
							scope.pnlTree.fireEvent('click',treeNode);
							return false;
						}
					});
					
					console.log("Auto Expand Node-->");
				});

				
			}
		}
		else if(r.data.type == 'tag' || r.data.type == 'user')
		{
			r.data.containerNode.expand();
			
			Ext.each(r.data.containerNode.childNodes,function(treeNode,index){
				if (treeNode.text == r.data.name)
				{
					scope.pnlTree.fireEvent('click',treeNode);
					return false;
				}
			});
		}
	}
	//next
	
  }
);
