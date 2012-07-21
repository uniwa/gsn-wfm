/*

1st dim : under which schema we are [home,trash,sharedINgroups,sharedINgroupsIN,tags]
2nd dim : the type of current selected tree node [folder,schema]
3rd dim : the type of current selected record in dataview [undefined,folder,file,group,tag,multi]

*/

Ext.apply(
	Tei.Wfm.App.prototype.States,
	{
		scope : this.scope,
		
		group_id : null,
		
		baseParams : function(){
			return {
				
				//bookmarked : scope.selectedDocs[0].get('bookmarked') || null,
				bookmarked : scope.selectedDocs.first.bookmarked || null,
				
				//global_public : scope.selectedDocs[0].get('global_public') || null,
				global_public : scope.selectedDocs.first.global_public || null,
				
				//filename : scope.selectedDocs[0].get('name') || null,
				filename : scope.selectedDocs.first.name || null,
				
				path : str_replace('/wfm_root/','root/',scope.curTreeNodSel.getPath('text')),
				depth : 0,
				nav : new Array(),
				lastStateLs: {}
			}
		},

		init_States : function(){

			scope.appState = new Array();

			scope.appState['home'] = {
					'schema':{
								'undefined': function(lastState) {

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'paste': scope.clipboard != null ? true : false
										
									},scope.AppCmd);
								},
								'folder' :  function(lastState) {

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'renameDoc': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'share': true,
										'setTags': true,
										'addStar': !this.bookmarked,
										'removeStar': this.bookmarked,
										'publish': !this.global_public,
										'unPublish': this.global_public,
										'zip': true
										
									},scope.AppCmd);
								},
								'file' : function(lastState) {
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'renameDoc': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'unzip': filename.toLowerCase().indexOf('.zip') != -1 ? true:false,
										'share': true,
										'setTags': true,
										'publish': !this.global_public,
										'unPublish': this.global_public,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})(),
										'zip': (function(){
											return filename.toLowerCase().indexOf('.zip') != -1 ? false:true	 
										})()

									},scope.AppCmd);
								},
								'multi' :function(lastState) {

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'zip': true
									
									},scope.AppCmd);
								}
					},
					'folder':{
								'undefined': function(lastState) {

									
									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'paste': scope.clipboard != null ? true : false
										
									},scope.AppCmd);
								},
								'folder' : function(lastState) {

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'renameDoc': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'share': true,
										'setTags': true,
										'addStar': !this.bookmarked,
										'removeStar': this.bookmarked,
										'publish': !this.global_public,
										'unPublish': this.global_public,
										'zip': true										
										
									},scope.AppCmd);
								},
								'file' : function(lastState) {

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'renameDoc': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'unzip': filename.toLowerCase().indexOf('.zip') != -1 ? true:false,
										'share': true,
										'setTags': true,
										'publish': !this.global_public,
										'unPublish': this.global_public,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})(),
										'zip': (function(){
											return filename.toLowerCase().indexOf('.zip') != -1 ? false:true	 
										})()
										
									},scope.AppCmd);
								},
								'multi' : function(lastState) {

									this.cmd = Ext.applyIf({
										
										'addFile': true,
										'newFolder': true,
										'deleteDoc': true,
										'copy': true,
										'cut': true,
										'paste': scope.clipboard != null ? true : false,
										'zip': true
										
									},scope.AppCmd);
								}
					}
			};
			
			//-------------------------------------------------------
			scope.appState['trash'] = {
					'schema' :{
								'undefined' : function(lastState){

									this.cmd = Ext.applyIf({
										
										'emptyTrash': true
										
									},scope.AppCmd);

								},
								'folder' : function(lastState){

									this.cmd = Ext.applyIf({
										
										'emptyTrash': true,
										'deleteDoc': true,
										'restore': true
										
									},scope.AppCmd);
								},
								'file' : function(lastState){

									this.cmd = Ext.applyIf({
																				
										'emptyTrash': true,
										'deleteDoc': true,
										'restore': true										
										
									},scope.AppCmd);
								},
								'multi' : function(lastState){

									this.cmd = Ext.applyIf({
														   
										'emptyTrash': true,
										'deleteDoc': true										

									},scope.AppCmd);
								}
					},
					'folder' :{
								'undefined' : function(lastState){

									this.cmd = Ext.applyIf({

										'emptyTrash': true

									},scope.AppCmd);
								},
								'folder' : function(lastState){

									this.cmd = Ext.applyIf({

										'emptyTrash': true,
										'deleteDoc': true,
										'restore': true										

									},scope.AppCmd);
								},
								'file' : function(lastState){
									
									this.cmd = Ext.applyIf({

										'emptyTrash': true,
										'deleteDoc': true,
										'restore': true										
										

									},scope.AppCmd);
								},
								'multi' : function(lastState){

									this.cmd = Ext.applyIf({

										'emptyTrash': true,
										'deleteDoc': true										

									},scope.AppCmd);
								}
					}
			};
			//-------------------------------------------------------
			scope.appState['public'] = {
					'schema' :{
								'undefined' : function(lastState){

									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();

									this.cmd = Ext.applyIf({},scope.AppCmd);

								},
								'user' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = this.path + "/" + this.filename;

									var lsArgs = {
										//'doc_id'   : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path'     : path,
										'group_id' : null
									};

									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;

									if (Ext.isArray(lastState.nav));
									else
									{
										this.nav.push(step);
										Ext.applyIf(this.nav[this.nav.length-1],{'nav' : this.nav.slice()});
									}

									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = lastState.ls.path + "/" + this.filename;

									var lsArgs = {
										//'doc_id' : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path' : path,
										'group_id' : null
									};

									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;					
									this.cmd = Ext.applyIf({'copy': true},scope.AppCmd);
									this.nav = lastState.nav.slice();

								},
								'file' : function(lastState){
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									
									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();
									
									var filename = this.filename;
									
									this.cmd = Ext.applyIf({
										'copy': true,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return in_array(fileExt,WfmAppConfs.mimeTypes) ? true : false;
										})()
									},scope.AppCmd);
								},
								'multi' : function(lastState){

									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();

									this.cmd = Ext.applyIf({
										'copy': true
									},scope.AppCmd);
								}								
					}
			};
			//-------------------------------------------------------
			scope.appState['sharedINusers'] = {
					'folder' :{
								'undefined' : function(lastState){

									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();

									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'user' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = this.path + "/" + this.filename;

									var lsArgs = {
										//'doc_id'   : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path'     : path,
										'group_id' : null
									};
									
									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;
									
									if (Ext.isArray(lastState.nav));
									else
									{
										this.nav.push(step);
										Ext.applyIf(this.nav[this.nav.length-1],{'nav' : this.nav.slice()});
									}									
									
									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = lastState.ls.path + "/" + this.filename;
									
									var lsArgs = {
										//'doc_id' : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path' : path,
										'group_id' : null
									};

									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;
									this.nav = lastState.nav.slice();
									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true
									},scope.AppCmd);
								},
								'file' : function(lastState){
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									
																		var filename = this.filename;
									
									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();
									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})()
										
									},scope.AppCmd);

									
								},
								'multi' : function(lastState){

									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();
									this.cmd = Ext.applyIf({},scope.AppCmd);
								}								
					}
			};
			//-------------------------------------------------------			
			scope.appState['sharedINgroups'] = {
					'folder' :{
								'undefined' : function(lastState){
									
									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();
									this.cmd = Ext.applyIf({
										'newGroup': this.nav.length > 0 ? false : true
									},scope.AppCmd);
									
								},
								'group' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = this.path + "/" + this.filename;

									var lsArgs = {
										//'doc_id'   : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path'     : path,
										//'group_id' : scope.selectedDocs[0].get('realId')
										'group_id'   : scope.selectedDocs.first.realId
									};
									
									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;
									
									if (Ext.isArray(lastState.nav));
									else
									{
										this.nav.push(step);
										Ext.applyIf(this.nav[this.nav.length-1],{'nav' : this.nav.slice()});
									}
									
									this.cmd = Ext.applyIf({
										'newGroup' : true,
										'deleteGroup' : true,
										'renameGroup' : true,
										'manageGroupUsers' : true
									},scope.AppCmd);									
								},
								'folder' : function(lastState){
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									/**/
									var path = lastState.ls.path + "/" + this.filename;
									
									var lsArgs = {
										//'doc_id' : scope.selectedDocs[0].get('realId'),
										'doc_id'   : scope.selectedDocs.first.realId,
										'path' : path,
										'group_id' : lastState.ls.group_id
									};

									var step = {
										'text'   : this.filename,
										'params' : lsArgs
									};
									/**/
									this.step = step;
									this.ls = lsArgs;
									this.nav = lastState.nav.slice();
									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'setTags': true
									},scope.AppCmd);

								},
								'file' : function(lastState){
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;									
									
									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();
									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'setTags': true,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})
									},scope.AppCmd);

								},								
								'multi' : function(lastState){

									this.ls = Ext.isDefined(lastState.ls) ? lastState.ls : null;
									this.nav = Ext.isArray(lastState.nav) ? lastState.nav.slice() : new Array();

									this.cmd = Ext.applyIf({
										//'cmd_create_group' : this.nav.length > 0 ? false : true,
										//'cmd_group_delete' : this.nav.length > 0 ? false : true
									},scope.AppCmd);									
								}							
					}
			};
			
			//-------------------------------------------------------			
			// MAYBE USELESS
			scope.appState['sharedINgroupsIN'] = {
					'group' :{
								'undefined' : function(lastState){

									//this.cmd = Ext.applyIf({},scope.AppCmd);

								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									
									/*
									this.cmd = Ext.applyIf({
										'cmd_rename' 			: true,
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false,
										'cmd_share_doc_group' 	: true,
										'cmd_unshare_doc_group' : true,
										'cmd_share_doc_user'	: true,
										'cmd_set_global_on' 	: !this.global_public,
										'cmd_set_global_off' 	: this.global_public,
										'cmd_set_bookmark' 		: !this.bookmarked,
										'cmd_remove_bookmark' 	: this.bookmarked,
										'cmd_set_tags' 			: true,
										'cmd_remove_tags'		: true										
									},scope.AppCmd);
									*/
									/**/
									var eventData = {'doc_id' 	: scope.selectedDocs[0].get('realId'),
												 	 'path'   	: this.path,
												 	 'group_id' : scope.curTreeNodSel.group_id};

									this.ls = eventData;
									this.expandedNode = null;
									/**/

								},
								'file' : function(lastState){
									
									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;
									
									/*
									this.cmd = Ext.applyIf({
										'cmd_rename' 			: true,
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false,
										'cmd_share_doc_group' 	: true,
										'cmd_unshare_doc_group' : true,
										'cmd_share_doc_user' 	: true,
										'cmd_set_global_on' 	: !this.global_public,
										'cmd_set_global_off' 	: this.global_public,
										'cmd_set_tags' 			: true,
										'cmd_remove_tags'		: true,
										'cmd_extract' 			: (function(){ return scope.helperFuncs.isExtractable(filename); })(),
										'cmd_get_thumbnail'		: (function(){ return scope.helperFuncs.isImage(filename); })(),
										'cmd_get_file'			: true
									},scope.AppCmd);
									*/
								},
								'multi' : function(lastState){

									/*
									this.cmd = Ext.applyIf({
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false
									},scope.AppCmd);
									*/
								}								
					},
					'folder' :{
								'undefined' : function(lastState){
	
									//this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									/*
									this.cmd = Ext.applyIf({
										'cmd_rename' 			: true,
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false,
										'cmd_share_doc_group' 	: true,
										'cmd_unshare_doc_group' : true,
										'cmd_share_doc_user'	: true,
										'cmd_set_global_on' 	: !this.global_public,
										'cmd_set_global_off' 	: this.global_public,
										'cmd_set_bookmark' 		: !this.bookmarked,
										'cmd_remove_bookmark' 	: this.bookmarked,
										'cmd_set_tags' 			: true,
										'cmd_remove_tags'		: true										
									},scope.AppCmd);
									*/
								},
								'file' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;

									/*
									this.cmd = Ext.applyIf({
										'cmd_rename' 			: true,
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false,
										'cmd_share_doc_group' 	: true,
										'cmd_unshare_doc_group' : true,
										'cmd_share_doc_user' 	: true,
										'cmd_set_global_on' 	: !this.global_public,
										'cmd_set_global_off' 	: this.global_public,
										'cmd_set_tags' 			: true,
										'cmd_remove_tags'		: true,
										'cmd_extract' 			: (function(){ return scope.helperFuncs.isExtractable(filename); })(),
										'cmd_get_thumbnail'		: (function(){ return scope.helperFuncs.isImage(filename); })(),
										'cmd_get_file'			: true
									},scope.AppCmd);
									*/
								},
								'multi' : function(lastState){
									
									/*
									this.cmd = Ext.applyIf({
										'cmd_delete' 			: true,
										'cmd_copy' 				: scope.doc_id_list.length > 0 ? true : false
									},scope.AppCmd);
									*/
								}								
					}
			};
			
			//-------------------------------------------------------						

			scope.appState['tags'] = {
					'schema' :{
								'undefined' : function(lastState){
									
									this.cmd = Ext.applyIf({
										'newTag' : true
									},scope.AppCmd);
								},
								'tag' : function(lastState){
									
									this.cmd = Ext.applyIf({
										'newTag' : true,
										'deleteTag' : true
									},scope.AppCmd);
									
								},								
								'multi' : function(lastState){
									
									this.cmd = Ext.applyIf({
										'newTag' : true,
										'deleteTag' : true									
									},scope.AppCmd);
									
								}				
					},
					'tag' :{
								'undefined' : function(lastState){

									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									
									this.cmd = Ext.applyIf({
										'copy': true,
										'setTags': true
									},scope.AppCmd);
									
								},
								'file' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;

									this.cmd = Ext.applyIf({
										
										'copy': true,
										'setTags': true,
										'download': true,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})()
										
									},scope.AppCmd);
								}
					}
			};
			//-------------------------------------------------------			

			scope.appState['bookmarks'] = {
					'schema' :{
								'undefined' : function(lastState){

									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'setTags': true,
										'removeStar': true
									},scope.AppCmd);
								},								
								'multi' : function(lastState){

									this.cmd = Ext.applyIf({
										'copy': true,
										'removeStar': true

									},scope.AppCmd);
								}				
					},
					'folder' :{
								'undefined' : function(lastState){

									this.cmd = Ext.applyIf({},scope.AppCmd);
								},
								'folder' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());

									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'share': true,
										'setTags': true,
										'publish': !this.global_public,
										'unPublish': this.global_public										
									},scope.AppCmd);
								},
								'file' : function(lastState){

									Ext.applyIf(this,Tei.Wfm.App.prototype.States.baseParams());
									var filename = this.filename;

									this.cmd = Ext.applyIf({
										'renameDoc': true,
										'copy': true,
										'download': true,
										'share': true,
										'setTags': true,
										'publish': !this.global_public,
										'unPublish': this.global_public,
										'view': (function(){
											var fileExt = filename.toUpperCase().split('.').pop();
											return WfmAppConfs.mimeTypes.indexOf(fileExt) != -1 ? true : false;
										})()
									},scope.AppCmd);
								}
					}
			};
			//-------------------------------------------------------			

		}
	}
);