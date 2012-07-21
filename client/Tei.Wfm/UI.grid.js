// JavaScript Document
Ext.apply(Tei.Wfm.App.prototype.UI,
	{
		init_EditorGridPanel2 : function(){

			scope.listView.thumbnailTpl = new Ext.Template(
				'<div class="thumbnailWraper {cls}" style="height:'+(Settings.thumbnail_size+25)+'px;width:'+(Settings.thumbnail_size+20)+'px;">' +
				'<div class="thumb" style="	height:'+(Settings.thumbnail_size)+'px;width:'+(Settings.thumbnail_size+10)+'px;">{thumbnail}</div>' +
				'<div class="filename"><span ext:qtip="{name}" unselectable="on">{name}</span></div></div>');

			scope.listView.thumbnailView = Ext.extend(Ext.grid.GridView, {
				
				tpl: (Settings.ui_default_view == 'thumbnails') ? scope.listView.thumbnailTpl : null,

				initTemplates : function(){

					scope.listView.thumbnailView.superclass.initTemplates.call(this);

					if(!this.templatedNode){
						this.templatedNode = new Ext.Template('<div class="thumbnailedItem x-unselectable">{content}</div>');
					}

					this.templatedNode.compile();
				},

				onRowSelect : function(row){
					if(this.tpl === null) {
						this.addRowClass(row, "x-grid3-row-selected");
					}
					this.addRowClass(row, "thumbnailedItemSelected");
					
					scope.gridLastSelectedRowIndex = row;
				},

				onRowDeselect : function(row){

					if(this.tpl === null) {
						this.removeRowClass(row, "x-grid3-row-selected");
					}
					this.removeRowClass(row, "thumbnailedItemSelected");
				},

				prepareData : function(data){
					data.thumbnail = this.getThumbnail(data);
					return data;
				},

				getThumbnail : function(data) {
					
					var getFileExtension = function(fname) {

						var dot = fname.lastIndexOf("."); 

						if( dot == -1 ) return "";

						var extension = fname.substr(dot+1,fname.length);

						return extension.toLowerCase(); 
					}
					
					var ext = scope.helperFuncs.getFileExtension( data.name );
					
					var imgSrc =  String.format('img/thumbs/big/{0}.png',ext);
					
					switch ( ext ) 
					{
						case 'gif': 
						case 'jpg':
						case 'jpeg':
						case 'png': 
							imgSrc = String.format(scope.serverURL + '/cmd_get_thumbnail/?doc_id={0}',data.realId);
							break;
						case 'bmp':
						case 'pdf':
						case 'zip':
						case 'mp3':
						case 'avi':
						case 'wmv':
						case 'mov':
						case 'mpg':
						case 'mpeg':
						case 'html':
						case 'ppt':
						case 'pptx':
						case 'txt':
							break;		
						case '':
						case null:
							imgSrc = "img/thumbs/big/folder.png";
							break;
						default:
							imgSrc = "img/thumbs/big/txt2.png";
					}	

					
					imgTag = '<img src="'+imgSrc+'" />';
					
					return '<div style="position:relative;height:0px;"><div style="position:absolute;bottom:-'+(Settings.thumbnail_size)+'px;left:1px;height:16px;"></div></div><table border="0" cellpadding="0" cellspacing="0"><tr><td class="lthumb">'+imgTag+'</td></tr></table>';
				},

				doRender : function(cs, rs, ds, startRow, colCount, stripe){

					if(this.tpl === null) {
						return scope.listView.thumbnailView.superclass.doRender.apply(this, arguments);
					}
					
					// buffers
					var buf = [], rp = {}, r;
					for(var j = 0, len = rs.length; j < len; j++){
						r = rs[j];
						r.data = this.prepareData(r.data);
						rp.content = this.tpl.apply(r.data);
						buf[buf.length] =  this.templatedNode.apply(rp);
					}
					return buf.join("") + '<div style="clear:both"></div>';
				},

				refresh: function(headersToo) {

					if (this.tpl !== null) {
						this.rowSelector = 'div.thumbnailedItem';
					} else {
						this.rowSelector = 'div.x-grid3-row';
					}
					return scope.listView.thumbnailView.superclass.refresh.apply(this, arguments);
				},

				updateAllColumnWidths : function(){

					if (this.tpl === null) {
						return scope.listView.thumbnailView.superclass.updateAllColumnWidths.apply(this);
					}

					var tw = this.getTotalWidth();
					var clen = this.cm.getColumnCount();
					var ws = [];
					for(var i = 0; i < clen; i++){
						ws[i] = this.getColumnWidth(i);
					}
					this.innerHd.firstChild.firstChild.style.width = tw;
					for(var i = 0; i < clen; i++){
						var hd = this.getHeaderCell(i);
						hd.style.width = ws[i];
					}
					this.onAllColumnWidthsUpdated(ws, tw);
				},

				updateColumnWidth : function(col, width){

					if (this.tpl === null) {
						return scope.listView.thumbnailView.superclass.updateColumnWidth.apply(this, arguments);
					}
					
					var w = this.getColumnWidth(col);
					var tw = this.getTotalWidth();
					this.innerHd.firstChild.firstChild.style.width = tw;
					var hd = this.getHeaderCell(col);
					hd.style.width = w;
					this.onColumnWidthUpdated(col, w, tw);
					
					//this.layout();
					this.updateHeaderWidth();
					
				},

				updateColumnHidden : function(col, hidden){
					
					if (this.tpl === null) {
						return scope.listView.thumbnailView.superclass.updateColumnHidden.apply(this, arguments);
					}
					
					var tw = this.getTotalWidth();				
					this.innerHd.firstChild.firstChild.style.width = tw;
					var display = hidden ? 'none' : '';
					var hd = this.getHeaderCell(col);
					hd.style.display = display;
					this.onColumnHiddenUpdated(col, hidden, tw);
					delete this.lastViewWidth; // force recalc
					
					this.layout();
					//this.updateHeaderWidth();
				}
			});
			
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
				return implode(", ",groups);
			}			

			//DATA STORE
			var ds = scope.filesStore;
			
			//FILE EDITOR FOR RENAME ACTION
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
			});
			
			//COLUMNS
			var cm = new Ext.grid.ColumnModel({
				defaults: {
					sortable: true
				},
				columns: [{
					id:'col_name',	  
					header: Messages.name,
					dataIndex: 'name',
					width: 120,
					//css: 'white-space:normal;',
					hideable: false,
					editor: fileEditor,
					renderer : renderFileTypeIcon
					},
					{
					id: 'size',
					header: Messages.size,
					dataIndex: 'size',
					width: 120,
					hideable: false,
					renderer: renderFileSize
					},
					{
					id: 'type',
					header: Messages.type,
					dataIndex: 'type',
					width: 120,
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
					{id: 'id', dataIndex: 'id', hidden: true}
				]
			});
			
			cm.defaultSortable = true;

			scope.listView.columnModel = cm;
			
			//EDITORGRIDPANEL
			scope.listView.panel = new Ext.grid.EditorGridPanel({
				id: 'listView',
				stateful: true,
				stateEvents: ['columnresize', 'columnmove', 'sortchange'],
				ds: ds,
				cm: cm,
				stripeRows: false,
				enableColLock:false,
				selModel: new Ext.grid.RowSelectionModel({
					singleSelect:false
				}),
				autoExpandColumn: 'col_name',
				autoExpandMax: 5000,
				view: new scope.listView.thumbnailView({}),
				bbar:{
					items: [
								//{ xtype: 'tbtext', text: '&#160;',id:'statusTxt',ref: '../statusTxt'},
								//'->',
								{ xtype: 'tbtext', text: '&#160;',id:'tbtTotalFiles' },
								{ xtype: 'tbtext', text: '&#160;',id:'tbtTotalFilesMsg' },
								'->',
								{ xtype: 'tbtext', text: '&#160;',id:'tbtTotalSize' }
					]
				}
			});


			var gsm = scope.listView.panel.getSelectionModel();

		    //SELECTION CHANGE
			gsm.on('selectionchange', function(sm, rowIndex){				
				scope.UI.gridSelectionChange(sm.getSelections());				
			},scope,{buffer:50});

			//RENDER
			scope.listView.panel.on('render', function() {
				Ext.getBody().on("contextmenu", Ext.emptyFn, null, { preventDefault: true });
        	});
			
			scope.listView.panel.on('click',function(){
				var none = {
					'name' : '',
					'type' : '',
					'realId' : '',
					'size' : '',
					'groups' : '',
					'users': '',
					'public' : ''
				};
				scope.infoPanel.update(scope.selectedDocs.last || none );
			});
					
			
			//ROWCONTEXTMENU
			scope.listView.panel.on('rowdblclick',scope.clientHdls.dblClick_doc);

			//ROWCONTEXTMENU
			scope.listView.panel.on('rowcontextmenu', function(grid, index, e) {
		                
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
					(scope.curTreeNodSel.schema == "sharedINusers" && Ext.ComponentMgr.get('tbtLocation').items.length > 2)
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
			});
			
			//AFTEREDIT
			scope.listView.panel.on('afteredit',function(e){

				scope.fireEvent('renameFile',{'doc': e.record,'newname': e.value});
			});
			
			
			
			var HDL_celldblclick = function(Grid, rowIndex, columnIndex, e){

				//e.stopEvent();
				

				scope.listView.panel.on('beforeedit', function(e){
					var ed = e.grid.colModel.getCellEditor(0, e.row);
					if (typeof(ed) == 'object')
					{
						scope.listView.panel.getColumnModel().setEditable(0, false);
					}
				});
			};
			
			scope.listView.panel.on('celldblclick', HDL_celldblclick);
		}
	}
);
