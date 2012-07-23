Ext.apply(

	Tei.Wfm.App.prototype.UI,
	{
		//scope : this.scope,
		
		//********************************************* HEADER ********************/
		/*
		init_Header : function() {
			
			//var name = userInfo.first + ' ' + userInfo.last;
			
			var name = scope.userInfo.name;
			
			scope.pnlHeader = new Ext.Panel({
				cls: 'header',
				autoScroll: false,
				layout: 'column',
				items: [ 
					{ cls: '', title: '', columnWidth: .30,
						items: [ {
							ref : '//box_user_canonical_name',
							id : 'box_user_canonical_name',
							xtype: 'box',
							cls: ' username',
							//html : '&nbsp;'
							html: name
						} ] 
					} ,
					{ cls: '', title: '', columnWidth: .50,
						items: [ {
							xtype: 'box',
							cls: '',
							html: '&nbsp;'
						} ]
					},
					{ cls: '', title: '', columnWidth: .20, items: [
						new sch.wfm.components.QuotaInfo( { id: 'quotaBar' } )
					] 
					}
				 ]
			});
		},
		*/
		//********************************************************************************
		
		/*
		init_quotaInfoChart : function(){
			scope.quotaInfoChart = new Ext.chart.PieChart({
				store : scope.quotaInfoStore,
				categoryField : 'status',
				dataField : 'total',
				data:[],
				extraStyle:
				{
					legend:
					{
						display: 'bottom',
						padding: 10,
						border:{
							color: '#CBCBCB',
							size: 1
						}
					}
	            },
				tipRenderer : function(chart, record, index, series){
					return record.data.status + " : " + scope.helperFuncs.formatSize(record.data.total);
				},
				labelRenderer : function(){
				}

				
			});
		},
		*/
		

		//*****************************************************************************************************************
		/*
		init_PropertyGrid : function(){

			scope.propertyGrid = new Ext.ux.grid.PropertyGrid({
					                        //title: '&nbsp;',
											nameText: Messages.field,
											valueText: Messages.value,
                    					    closable: true,
											border:false,
					                        store: {},
											fields:[]
										});

			scope.propertyGrid.on('cellclick', function(Grid, rowIndex, columnIndex, e){
				
				var r = Grid.getStore().getAt(rowIndex);
				
				if (r.id == "prop_groups" && columnIndex == 1)
				{
					scope.serverHdls.do_sharingDialog(1);
				}
				else if(r.id == "prop_users" && columnIndex == 1)
				{
					scope.serverHdls.do_sharingDialog(0);
				}
				
			});

			scope.propertyGrid.on('afteredit', function(e){

				var grid = e.grid;
				var prop_id = grid.getStore().getAt(e.row).id;
		        var src = grid.getSource();
				var propertyValue = grid.getStore().getAt(e.row).data.value;
        
        		if (prop_id == "prop_name" && (src.type == "folder" || src.type == "file")) {
				
					//console.log("Rename doc");
					var reqConfs = {
						'data' : {'doc_id': src.realId ,'name': propertyValue},
						'objQueue' : null,
						'cb_start' : function(){

						},
						'cb_success' : function(response){
							if (response.success)
							{
								
								var realId = src.realId;
								var rowIdx = scope.listView.getStore().find('realId',realId);
								var newName = propertyValue;
								
								if (rowIdx >= 0 ) {
									var rec = scope.listView.getStore().getAt(rowIdx);
									rec.set('name',newName);
									rec.commit();
								}
								
								nodeInHome = scope.pnlTree.getNodeById('home_' + realId);
								nodeInBookMrks = scope.pnlTree.getNodeById('bookmarks_' + realId);
								
								if (Ext.isObject(nodeInHome))
								nodeInHome.setText(newName);

								if (Ext.isObject(nodeInBookMrks))
								nodeInBookMrks.setText(newName);
								
							}
						},
						'cb_fail' : scope.helperFuncs.ajaxFail,
						'cb_eofq' : scope.helperFuncs.endAjaxQueue
					}

					scope.serverReqs.cmd_rename(reqConfs);
					
				}
		        else if (prop_id == "prop_name" && src.type == "group") {
					
					//console.log("Rename group");
					var reqConfs = {
						'data' : {'group_id': src.realId ,'group_name': propertyValue},
						'objQueue' : null,
						'cb_start' : function(){

						},
						'cb_success' : function(response){
							if (response.success){
								
								var realId = src.realId;
								var newName = propertyValue;

								
								var rowIdx = scope.listView.getStore().find('realId',realId);

								if (rowIdx >= 0 ) {
									var rec = scope.listView.getStore().getAt(rowIdx);
									rec.set('name',newName);
									rec.commit();
								}
								
								var rowIdx = scope.groupsStore2.find('_id',realId);
								
								if (rowIdx >= 0 ) {
									var rec = scope.groupsStore2.getAt(rowIdx);
									rec.set('name',newName);
									rec.commit();
								}
								

							}
						},
						'cb_fail' : scope.helperFuncs.ajaxFail,
						'cb_eofq' : scope.helperFuncs.endAjaxQueue
					}

					scope.serverReqs.cmd_group_rename(reqConfs);
				}
				else if ( prop_id == "prop_bookmarked" ) {

					if (propertyValue) 
					{
						scope.fireEvent('bookmarkDoc',{'doc_id' : src.realId});
					}
					else
					{
						scope.fireEvent('removeBookmarkDoc',{'bookmarks' : [src.realId]});
					}
				}

			});
		},
		*/
		
		//*****************************************************************************************************************

		init_EditorGridPanel : function(){
			var fileEditor = new Ext.form.TextField({allowBlank: false});
			
			var createSelection = function(field, start, end) {
    			if( field.createTextRange ) {
        			var selRange = field.createTextRange();
        			selRange.collapse(true);
        			selRange.moveStart('character', start);
        			selRange.moveEnd('character', end-start);
        			selRange.select();
    			} else if( field.setSelectionRange ) {
        			field.setSelectionRange(start, end);
    			} else if( field.selectionStart ) {
        			field.selectionStart = start;
        			field.selectionEnd = end;
    			}
			}

			fileEditor.on( 'focus', function( field ) {
				var dot = field.value.lastIndexOf( '.' );
				var nameSize = ( dot == -1 ) ? field.value.length : dot;
				createSelection( field.el.dom, 0, nameSize );
			} );
			
			var getFileExtension = function(fname) {
				return fname.split( '.' ).pop().toLowerCase();
			}
			var getFileClass = function(fname) {
				var ext = getFileExtension( fname );
				switch ( ext ) {
					case 'gif': case 'jpg': case 'png': case 'bmp':
						return 'type_file_img';
					case 'pdf':
						return 'type_file_pdf';
					default:
						return 'type_file_default';
				}	
			}
			var renderFileTypeIcon = function(value,p, record){
				
				var fClass = "type_file_default";
				switch(record.get('type'))
				{
					case "folder":
						fClass = "type_folder";
					break;
					case "file":
						fClass = "type_file " + getFileClass( value );
					break;
					case "tag":
						fClass = "type_tag";
					break;	
					case "user":
						fClass = "type_user";
					break;	
					case "group":
						fClass = "type_group";						
					break;
					case "school":
						fClass = "type_school";						
					break;	
					
				}
				//return String.format( '<span class="listview_item {0}">{1}</span>', fClass, value );	
				return String.format( '<img src="img/filetypes/cleardot.gif" class="fileTypeIcon {0}" /> {1}', fClass, value );	
			}

			var renderFileSize = function(value, p, record){
				return scope.helperFuncs.formatSize(value);
			}

			var renderFileTypeLC = function(value, p, record) {
				if ( value == 'file' ) return Messages.file_lc;
				if ( value == 'folder' ) return Messages.folder_lc;
				return value;
			}

			var renderFileShares = function(value, p, record) {
				var str = '';
				if ( record.data.global_public ) {
					var id = record.data.realId;
					var url = scope.serverURL + '/get/' + id;
					el = '<a href="' + url + '">public</a>';
					str += el;
				}
				return str;
			}
			
			var renderGroupsName = function(value, p, record){
				
				var groups = [];
				
				Ext.each(value,function(group,index){
					
					if ( scope.groupsStore[group.group_id.toString()] != undefined )
						groups.push(scope.groupsStore[group.group_id.toString()].group_name);
					else
						groups.push("Undefined group with id : " + group.group_id.toString());
				});
				
				return implode(",",groups);
			}

			var cm = new Ext.grid.ColumnModel({
				defaults: {
					sortable: true,
					menuDisabled: true
				},
				columns: [{
					id:'col_name',	  
					header: Messages.name,
					dataIndex: 'name',
					width: 250,
					css: 'white-space:normal;',
					hideable: false,
					editor: fileEditor,
					renderer : renderFileTypeIcon
					},
					{
					header: Messages.size,
					dataIndex: 'size',
					hideable: false,
					renderer: renderFileSize
					},
					{
					header: Messages.type,
					dataIndex: 'type',
					width: 70,
					align: 'right',
					hideable: false,
					renderer: renderFileTypeLC
					},
					{
					header: Messages.tags,
					dataIndex: 'tags',
					hideable: false,
					width: 135
					},
					{
					header: Messages.groups,
					dataIndex: 'groups',
					hideable: false,
					width: 135,
					renderer: renderGroupsName
					},
					{
					id:'col_sharing',
					header: Messages.sharing,
					hideable: false,
					renderer: renderFileShares
					},
					
					{dataIndex: 'id', hidden: true, hideable: false }
				]
			});
		
			cm.defaultSortable = true;
			
			scope.listView = new Ext.grid.EditorGridPanel({
				id:'listView',
				autoScroll: true,
				containerScroll: true,
				animate: true,							
				loadMask: true,
				store: scope.filesStore,
				cm: cm,
				border: false,
				enableColLock : false,
				stripeRows: true,
				autoExpandColumn: 'col_name',
				trackMouseOver:true,
				tbar: {
    					//id: 'sBar',
					    //items: [ new sch.wfm.components.LocationBar( { id:'tbtLocation' } ) ]
  				},
				selModel: new Ext.grid.RowSelectionModel(),
				listeners: {
					'activate': function(grid){
						grid.selModel.clearSelections();
					},
					'render': function() {
		                Ext.getBody().on("contextmenu", Ext.emptyFn, null, { preventDefault: true });
        		    },
					'rowcontextmenu': function(grid, index, e) {
		                
						var selModel = grid.getSelectionModel();
        		        if (!selModel.isSelected(index)) 
						selModel.selectRow(index, false);
                		
		                if (
							scope.curTreeNodSel.schema == "home" || 
							scope.curTreeNodSel.schema == "trash" || 
							scope.curTreeNodSel.schema == "bookmarks" ||
							(scope.curTreeNodSel.schema == "public" && Ext.ComponentMgr.get('tbtLocation').items.length > 1) ||
							(scope.curTreeNodSel.schema == "tags" && Ext.ComponentMgr.get('tbtLocation').items.length > 1) ||
							(scope.curTreeNodSel.schema == "sharedINgroups" && Ext.ComponentMgr.get('tbtLocation').items.length > 2) ||
							(scope.curTreeNodSel.schema == "sharedINusers" && Ext.ComponentMgr.get('tbtLocation').items.length > 2) ||
                                                        (scope.curTreeNodSel.schema == "sharedINschools" && Ext.ComponentMgr.get('tbtLocation').items.length > 2)
						)
						{
							Ext.getCmp('fileMenu').showAt(e.getXY());
							return;
						}
						
		                if (
							scope.curTreeNodSel.schema == "tags" && Ext.ComponentMgr.get('tbtLocation').items.length == 0
						)
						{
							Ext.getCmp('tagMenu').showAt(e.getXY());
							return;
						}

		                if (
							scope.curTreeNodSel.schema == "sharedINgroups" && Ext.ComponentMgr.get('tbtLocation').items.length == 2
						)
						{
							Ext.getCmp('groupMenu').showAt(e.getXY());
							return;
						}
            		},
					'rowselect' : function(grid, rowIndex, e){
						//var r = grid.getStore().getAt(rowIndex);
						scope.gridLastSelectedRowIndex = rowIndex;
					},
					'afteredit': function(e){

						scope.processManager.reset();

						scope.processManager.pushTask({
								state : 0,
								note : scope.processManager.textLayout.waitingMsg,
								name : Messages.process_cmd_rename,
								cmd : e.record.data['type'] == 'group' ? scope.CMD.cmd_group_rename : scope.CMD.cmd_rename,
								params : e.record.data['type'] == 'group' ? {group_id: e.record.data['realId'], group_name: e.value} : {doc_id: e.record.data['realId'], name: e.value},
								onStart: function(idx){
									//scope.clientHdls.updateStatus('start',Messages.in_process_cmd_set_bookmark_doc,'center_region');
								},
								onComplete: function(response,taskIndex,sendedData){
									if (response.success)
									{
										e.record.commit();
										var realId = e.record.data['realId'];
										nodeInHome = scope.pnlTree.getNodeById('home_' + realId);
										nodeInBookMrks = scope.pnlTree.getNodeById('bookmarks_' + realId);
								
										if (Ext.isObject(nodeInHome))
											nodeInHome.setText(e.value);

										if (Ext.isObject(nodeInBookMrks))
											nodeInBookMrks.setText(e.value);
									}
									else
									{
										e.record.reject();
									}
								}
						});					

						scope.processManager.beginProcess();
						/*
						var data = {
									doc_id : e.record.data['realId'],
									name:e.value
						};
	
						var cb_success = function(jsonResp){

							if (jsonResp.success)
							{
								e.record.commit();

								var realId = e.record.data['realId'];

								nodeInHome = scope.pnlTree.getNodeById('home_' + realId);
								nodeInBookMrks = scope.pnlTree.getNodeById('bookmarks_' + realId);
								
								if (Ext.isObject(nodeInHome))
								nodeInHome.setText(e.value);

								if (Ext.isObject(nodeInBookMrks))
								nodeInBookMrks.setText(e.value);
							}
							else
							{
								e.record.reject();
								Ext.Msg.alert('Fail', 'Rename cannot take place');
							}
						}

						var cb_fail = function(){
							e.record.reject();
							scope.listView.stopEditing();
						}
	
						scope.fireEvent('renameFile',{'data' : data, 'cb_success' : cb_success, 'cb_fail' : cb_fail});
						*/

					},
					'keydown' : function(e){
						if (e.shiftKey && e.keyCode == 46)
                		{
                    		var rootNode = scope.curTreeNodSel.rootNode;
							var cur_Home  = (scope.curTreeNodSel.attributes.type == "schema" && scope.curTreeNodSel.text == "home") ? true : false;
							var into_Home = (rootNode.attributes.type == "schema" && rootNode.text == "home")?true:false;
							
							if (cur_Home || into_Home)
							{
								if( scope.selectedDocs.length >= 1 )
								{
									scope.fireEvent('confirmDeleteDocs',{'docs':scope.selectedDocs,'perm':1});
								}
							}
                		}
					}
				}//end of listeners
			});//end of panel
			
			var gsm = scope.listView.getSelectionModel();
		    gsm.on('selectionchange', function(sm, rowIndex){				
				scope.UI.gridSelectionChange(sm.getSelections());
				
			},scope,{buffer:50});
			
			scope.listView.on('celldblclick', scope.UI.HDL_celldblclick);
		},
		
		HDL_celldblclick : function(Grid, rowIndex, columnIndex, e){
			
			scope.listView.on('beforeedit', function(e){
				var ed = e.grid.colModel.getCellEditor(0, e.row);
				if (typeof(ed) == 'object')
				{
					scope.listView.getColumnModel().setEditable(0, false); 	
				}
			});
		},
		//*****************************************************************************************************************
		init_ViewMode : function(){
			
			/*
			if (scope.viewMode == "thumbs")
			{
				scope.filesView = new sch.wfm.components.thumbView({
					id : 'files',
					store : scope.filesStore
				});
				
				scope.filesView.on('dblclick',scope.clientHdls.dblClick_doc);
				
				scope.filesView.on('selectionchange',function(dataView,selections ){
					scope.selectedDocs = dataView.getSelectedRecords();
					scope.clientHdls.setAppState();
					scope.toolBar.fireEvent('refresh',null);
					
					if (scope.selectedDocs.length > 0)
					scope.clientHdls.fillPropertyGrid(scope.selectedDocs[scope.selectedDocs.length-1].data);
				});
			}
			else if (scope.viewMode == "details")
			{
			
				scope.UI.init_EditorGridPanel();
				scope.filesView = scope.listView;
				
				scope.filesView.on('rowdblclick',scope.clientHdls.dblClick_doc);
			}
			*/
			//scope.UI.init_EditorGridPanel2();

			/*
			scope.UI.init_EditorGridPanel();
			scope.listView.on('rowdblclick',scope.clientHdls.dblClick_doc);
			
			
						
			scope.thumbView = new sch.wfm.components.thumbView({
					id : 'files',
					store : scope.filesStore
			});

			scope.thumbView.on('dblclick',scope.clientHdls.dblClick_doc);
			scope.thumbView.on('selectionchange',function(dataView,selections ){
				scope.UI.gridSelectionChange(dataView.getSelectedRecords());
			});
			*/
		},
		//*****************************************************************************************************************
		
		gridSelectionChange : function(selections){
			
			scope.selectedDocs = scope.clientHdls.createSelectedSet(selections);
			scope.clientHdls.setAppState();
			scope.toolBar.fireEvent('refresh',null);
			
			if (scope.selectedDocs.length > 0)
			{
				//scope.clientHdls.fillPropertyGrid(scope.selectedDocs.first);
				scope.currDocId = scope.selectedDocs.first.realId;
			}
			else
			{
				scope.currDocId = scope.curTreeNodSel.realId;
			}
		},
		
		changeView : function(view, toggle){

			scope.cookieProvider.set('wfm-view-mode', view);

			if (toggle) {
				Ext.getCmp('tbarView-'+view).toggle('pressed');
			}
			if (view == 'thumbnails') {
				scope.listView.panel.getView().tpl = scope.listView.thumbnailTpl;
				scope.listView.panel.getView().refresh(true);
			} else {
				scope.listView.panel.getView().tpl = null;
				scope.listView.panel.getView().refresh(true);
			}	scope.listView.currentView = view;
			
		},
		
		restoreView : function() {
		
			var savedViewMode = scope.cookieProvider.get('wfm-view-mode', 'list');
		
			Ext.getCmp('tbarView-'+savedViewMode).toggle('pressed');
			scope.UI.changeView(savedViewMode);
		}
		
		
		//*****************************************************************************************************************		
		//next
	}
);