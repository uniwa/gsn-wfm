Ext.apply(
  Tei.Wfm.App.prototype.serverReqs,
  {
	scope : this.scope,

	cmd_get_user_info : function(reqConfs) {

		var conn = new Ext.data.Connection();
		//var urlRequest = scope.serverURL + "/cmd_get_userinfo/";
		var urlRequest = scope.CMD.cmd_get_userinfo;

		try	
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							method: 'POST',
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_get_user_info]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}		
		
	},

	cmd_tree : function(reqConfs){
		
		var conn = new Ext.data.Connection();
		var urlRequest = scope.CMD.cmd_tree;

		try	
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							method: 'POST',
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_tree]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}		
	},

	cmd_ls : function(reqConfs){
		
		var conn = new Ext.data.Connection();
		//var urlRequest = String.format(scope.CMD.cmd_ls + "?doc_id={0}&path={1}&group_id={2}", reqConfs.data.doc_id, reqConfs.data.path,reqConfs.data.group_id);
		var urlRequest = scope.CMD.cmd_ls;
		
		try	
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							
							method: 'POST',
							
							params : reqConfs.data,
							
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_ls]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},
	
	cmd_create_folder : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = String.format(scope.serverURL + "/cmd_create_folder?parent_id={0}&name={1}", reqConfs.data.parent_id, reqConfs.data.name);

		try	
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							method: 'GET',
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_create_folder]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	cmd_rename : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.CMD.cmd_rename;

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_rename]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	cmd_group_rename : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_group_rename/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_rename_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	cmd_delete : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_delete/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_rename]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	cmd_set_global : function(reqConfs){

		var conn = new Ext.data.Connection();
		//var urlRequest = String.format(scope.serverURL + "/cmd_set_global?doc_id_list={0}&global={1}",data.doc_id_list,data.global);
		//var urlRequest = scope.serverURL + "/cmd_set_global/";
		var urlRequest = scope.CMD.cmd_set_global;

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							
							method: 'POST',
							
							params : reqConfs.data,
							
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_set_global]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	/*
	arguments in reqConfs.data:
		'doc_id': The id of the document to bookmark
	*/
	cmd_set_bookmark_doc : function(reqConfs){
		var conn = new Ext.data.Connection();
		//var urlRequest = String.format(scope.serverURL + "/cmd_set_bookmark?doc_id={0}",data.doc_id);
		var urlRequest = scope.serverURL + "/cmd_set_bookmark_doc/";

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,
							
							method: 'POST',
							
							params : reqConfs.data,
							
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_set_bookmark]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	
	/*
	arguments in reqConfs.data:
		'doc_id': The id of the document to remove bookmark
	*/
	cmd_remove_bookmark_doc : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_remove_bookmark_doc/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_set_bookmark]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	/*
	arguments in reqConfs.data:
		'doc_id': Document to copy id
		'dest_id': Destination folder id
	*/
	cmd_copy : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = String.format(scope.serverURL + "/cmd_copy?doc_id={0}&dest_id={1}",reqConfs.data.doc_id,reqConfs.data.dest_id);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,

							method: 'GET',

							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_copy]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
		finally
		{
			if ((typeof(objQueue) == 'object' && objQueue.queue.length < 1) || typeof(objQueue) == 'null')
			{
				scope.helperFuncs.flushDocIdList.call(scope);
				//scope.serverReqs.cmd_ls.call(scope,data.dest_id,"anything");
				//scope.serverReqs.cmd_tree.call(scope);
			}
		}
	},
	
	/*
	arguments in reqConfs.data:
		'doc_id': Document's id to move
		'dest_id': Destination's folder id
	*/
	cmd_move : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = String.format(scope.serverURL + "/cmd_move?doc_id={0}&dest_id={1}",reqConfs.data.doc_id,reqConfs.data.dest_id);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url: urlRequest,

							method: 'GET',

							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							failure: function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_move]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
		finally
		{
			if ((typeof(objQueue) == 'object' && objQueue.queue.length < 1) || typeof(objQueue) == 'null')
			{
				scope.helperFuncs.flushDocIdList.call(scope);
			}
		}
	},
	
	cmd_get_file : function(doc_id){
		self.location = String.format(scope.serverURL + "/get/{0}",doc_id);
		/*
		try
		{
			Ext.Ajax.request({
							 url:String.format(scope.serverURL + "/cmd_get_file?doc_id={0}",doc_id),
							 method : 'GET',
							 	success: function(responseObject) {

									try
									{
										var resp = Ext.decode(responseObject.responseText);
										
										if (typeof(resp) == 'object')
										{
											if (!resp.success)
											{
												Ext.Msg.alert('File Error','Document does not exist');
												return;
											}
										}
									}
									catch(e){}
								
									try
									{
										Ext.destroy(Ext.get('downloadIframe'));
									}
									catch(e) {}
									
									Ext.DomHelper.append(document.body, {
														 tag: 'iframe',
														 id:'downloadIframe',
														 frameBorder: 0,
														 width: 0,
														 height: 0,
														 css: 'display:none;visibility:hidden;height:0px;',
														 src: String.format(scope.serverURL + "/cmd_get_file?doc_id={0}",doc_id)
									});
								},
								failure: function() {
									Ext.Msg.alert('Connection problem','cmd_get_file');
								}
			});
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_rename]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
		finally
		{
			try
			{
				Ext.destroy(Ext.get('downloadIframe'));
			}
			catch(e) {}
		}
		*/
	},

	cmd_get_thumbnail : function(title,doc_id){
		try
		{
			/*
			var url = String.format(scope.serverURL + "/cmd_get_thumbnail?doc_id={0}",doc_id);
			var wnd = new Ext.Window({
				loadMask: true,
				width: 120,
				height: 120,
				modal: true,
				title: 'Image Preview',
				items : [
					new Ext.Component({
						autoEl: { tag: 'img', src: url }
					})
				]
			});
			wnd.show();
			*/
			imageWindow = new ImageViewer({
					    				    title: title,
									        //src: String.format(scope.serverURL + "/cmd_get_thumbnail?doc_id={0}",doc_id),
											//src: String.format(scope.serverURL + "/cmd_get_file?doc_id={0}",doc_id),
											src: String.format(scope.serverURL + "/get/{0}",doc_id),
								        	hideAction: 'close',
											modal:true
					    				}).show();
		}
		catch(e)
		{
			Ext.Msg.alert('Exception Thrown[cmd_get_thumbnail]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	/*
	*/
	cmd_get_tag_list : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + "/cmd_get_tag_list/";
		//var urlRequest = "cmd_get_tag_list.html";

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_get_tag_list]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	/*
	arguments in reqConfs.data:
		'tag_list': tag/tag/...
	*/
	cmd_add_tags : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + "/cmd_add_tags/";

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_add_tags]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	/*
	arguments in reqConfs.data:
		'doc_id': Document to set tag id
		'tag_list': tag/tag/... 
	*/
	cmd_set_tags : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + "/cmd_set_tags/";
		//var urlRequest = String.format(scope.serverURL + "/cmd_set_tags?doc_id={0}&tag_list={1}",data.doc_id,data.tag_list);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_set_tags]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},
	
	/*
	Mayby useless
	
	arguments:
		'doc_id': Document to get tag id
	*/
	cmd_get_tags : function(data,objQueue,cb_start,cb_success,cb_fail,cb_eofq){

		var conn = new Ext.data.Connection();
		var urlRequest = String.format(scope.serverURL + "/cmd_get_tags?doc_id={0}",data.doc_id);
		//var urlRequest = String.format("cmd_get_tags.html?doc_id={0}",data.doc_id);

		try
		{
			if (Ext.type(cb_start) == 'function')
			cb_start.call(scope);

			conn.request({
							url: urlRequest,
							method: 'GET',
							success: function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = data;

								if (Ext.type(cb_success) == 'function')
								cb_success.call(scope,resp);
								
								if (objQueue != null && typeof(objQueue) == 'object' && objQueue.queue.length == 0 && Ext.type(cb_eofq) == 'function')
								cb_eofq.call(scope,resp);

								if (objQueue != null && typeof(objQueue) == 'object' && objQueue.queue.length > 0)
								objQueue.proccess(scope);
							},
							failure: function() {

								if (Ext.type(cb_fail) == 'function')
								cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	/*
	arguments in reqConfs.data:
		'doc_id': Document to removeet tag id
		'tag_list': tag/tag/...
	*/
	cmd_remove_tags : function(reqConfs){

		var conn = new Ext.data.Connection();
		//var urlRequest = String.format(scope.serverURL + "/cmd_remove_tags?doc_id={0}&tag_list={1}",data.doc_id,data.tag_list);
		var urlRequest = scope.serverURL + "/cmd_remove_tags/";

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_remove_tags]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},
	
	/*
	arguments in reqConfs.data:
		'tag_list': tag/tag/...
	*/
	cmd_delete_tags : function(reqConfs){
		var conn = new Ext.data.Connection();
		//var urlRequest = scope.serverURL + "/cmd_delete_tags/";
		var urlRequest = scope.CMD.cmd_delete_tags;

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_delete_tags]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},

	cmd_empty_trash : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_empty_trash/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_empty_trash]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	cmd_restore : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.CMD.cmd_restore;

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_empty_trash]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	cmd_extract : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.CMD.cmd_extract;

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_empty_trash]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	//----------------------------------------------------
	cmd_get_groups : function(reqConfs){

		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + "/cmd_get_groups/";
		//var urlRequest = "cmd_get_groups.html";

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_get_tag_list]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}	
	},
	
	cmd_create_group : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_create_group/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_empty_trash]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	cmd_group_delete : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_group_delete/';

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope,reqConfs.data);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_group_delete]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	/*--- (un)Sharing doc to group ---*/
	cmd_share_doc_group : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_share_doc_group/';
		//var urlRequest = String.format("cmd_share_doc_group.html?doc_id={0}&group_id={1}",reqConfs.data.doc_id,reqConfs.data.group_id);		

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_share_doc_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	
	cmd_unshare_doc_group : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_unshare_doc_group/';
		//var urlRequest = String.format("cmd_unshare_doc_group.html?doc_id={0}&group_id={1}",reqConfs.data.doc_id,reqConfs.data.group_id);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_unshare_doc_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	/*--- end (un)Sharing doc to group ---*/
	
	/*--- (un)Sharing doc to user ---*/
	cmd_share_doc_user : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_share_doc_user/';
		//var urlRequest = String.format("cmd_share_doc_user.html?doc_id={0}&user={1}",reqConfs.data.doc_id,reqConfs.data.user);		

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_share_doc_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	
	cmd_unshare_doc_user : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_unshare_doc_user/';
		//var urlRequest = String.format("cmd_unshare_doc_user.html?doc_id={0}&user={1}",reqConfs.data.doc_id,reqConfs.data.user);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_unshare_doc_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},

	/*--- add/remove/load group's user(s) ---*/
	cmd_get_group_users : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.CMD.cmd_get_group_users;
		
		//var urlRequest = String.format("cmd_share_doc_user.html?doc_id={0}&user={1}",reqConfs.data.doc_id,reqConfs.data.user);		

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,

							method : 'POST',

							params : reqConfs.data,

							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},

							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_add_to_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	
	cmd_add_to_group : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_add_to_group/';
		//var urlRequest = String.format("cmd_share_doc_user.html?doc_id={0}&user={1}",reqConfs.data.doc_id,reqConfs.data.user);		

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_add_to_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	},
	
	cmd_remove_from_group : function(reqConfs){
		var conn = new Ext.data.Connection();
		var urlRequest = scope.serverURL + '/cmd_remove_from_group/';
		//var urlRequest = String.format("cmd_unshare_doc_user.html?doc_id={0}&user={1}",reqConfs.data.doc_id,reqConfs.data.user);

		try
		{
			if (Ext.type(reqConfs.cb_start) == 'function')
			reqConfs.cb_start.call(scope);

			conn.request({
							url : urlRequest,
							
							method : 'POST',
							
							params : reqConfs.data,
							
							success : function(responseObject) {

								var resp = Ext.decode(responseObject.responseText);
								resp.dataSend = reqConfs.data;

								if (Ext.type(reqConfs.cb_success) == 'function')
								reqConfs.cb_success.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length == 0 && 
									Ext.type(reqConfs.cb_eofq) == 'function')
								reqConfs.cb_eofq.call(scope,resp);

								if (reqConfs.objQueue != null && 
									typeof(reqConfs.objQueue) == 'object' && 
									reqConfs.objQueue.queue.length > 0)
								reqConfs.objQueue.proccess(scope);

							},
							
							failure : function() {

								if (Ext.type(reqConfs.cb_fail) == 'function')
								reqConfs.cb_fail.call(scope);
							}
						});
		}
		catch(e)
		{
	    	Ext.Msg.alert('Exception Thrown[cmd_remove_from_group]',String.format('An exception occurred in the script. Error name: {0}. Error message: {1}',e.name,e.message));
		}
	}

	//next

  }
);
