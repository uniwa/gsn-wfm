Ext.namespace('sch.wfm.components');

//sch.wfm.components.QuotaInfo = Ext.extend(Ext.BoxComponent, {
sch.wfm.components.QuotaInfo = Ext.extend(Ext.ProgressBar, {											
	//tpl: new Ext.Template( "<b>" + Messages.used_space + ": </b> {0} / {1}", { compiled: true } ),
	//autoEl: {
		//cls: 'header quota_panel'
		autoHeight: true,
		id: 'spaceQuotaIndicator',
		style: 'width:200px;',
		autoEl: 'div',
	//},
	initComponent: function() {
		sch.wfm.components.QuotaInfo.superclass.initComponent.apply(this,arguments);
		//this.quota = this.tpl.insertFirst( this.el, [ Messages.loading, '' ] );
	},
	updateQuota: function( quotaCurrent, quotaMax ) {
		var current = quotaCurrent ? scope.helperFuncs.formatSize( quotaCurrent ) : '0';
		var max = scope.helperFuncs.formatSize( quotaMax );
		//this.quota = this.tpl.overwrite( this.el, [ current, max ] );
		this.updateProgress(quotaCurrent/quotaMax, 'Χώρος : '+' '+current+' / '+max);		
	}
});

sch.wfm.components.LocationBar = Ext.extend(Ext.Container, {
	layout: 'toolbar',
	autoDestroy: true,
	autoEl: {
		cls: 'location_panel'
	},
	onRender: function() {
		sch.wfm.components.LocationBar.superclass.onRender.apply(this,arguments);
	},
	initComponent: function() {
		sch.wfm.components.LocationBar.superclass.initComponent.apply(this,arguments);
	},
	updateLocationBreadcrumbs: function( node,more ) {
		if ( node.attributes.ref ) node = node.attributes.ref;
		var locations = new Array();
		var i = 0;
		var tree = node.getOwnerTree();
		while ( node && node.parentNode ) {
			locations[ i ] = new Ext.Button( {
				text: node.attributes.text,
				enableToggle: true,
				allowDepress: false,
				pressed: ( i == 0 && !Ext.isArray(more) ) ? true : false,
				curNode: node,
				toggle: function( obj, pressed ) {
					delete scope.state.ls;
					delete scope.state.nav;
					tree.fireEvent( 'click', this.curNode );
				}
			} );
			i++;
			node = node.parentNode;
		}
		this.removeAll();
		for ( var j = i - 1; j >= 0; j-- ) {
			this.add( locations[ j ] );
		}
		this.doLayout();
		
		if (Ext.isArray(more))
		Ext.ComponentMgr.get('tbtLocation').updateLocationBreadcrumbs2(scope.curTreeNodSel,more)
	},
	updateLocationBreadcrumbs2: function(node ,nav ) {

		var locations = new Array();
		//this.removeAll();

		for(var i = 0; i < nav.length; i++) {

			locations[ i ] = new Ext.Button( {
				text: nav[i].text,
				enableToggle: true,
				allowDepress: false,
				pressed: ( i == nav.length-1 ) ? true : false,
				params : nav[i].params,
				nav :  nav[i].nav,
				idx : i,
				total : nav.length,
				node : node,
				toggle: function( obj, pressed ) {

					//scope.state.nav = this.nav;
					//scope.state.ls = this.params;
					Ext.ComponentMgr.get('tbtLocation').updateLocationBreadcrumbs(this.node,this.nav);
					scope.fireEvent('loadDirContent',this.params);

					scope.state.nav = this.nav.slice();
					scope.state.ls = Ext.applyIf({},this.params);
				}
			} );

			this.add( locations[ i ] );
		}

		this.doLayout();
	},
	updateLocationText: function( node ) {
		this.update( node.getPath( 'text' ) );
	},
	updateLocation: function( node ) {
		this.updateLocationBreadcrumbs( node );
	}
});

//*******************************************************************************************************
sch.wfm.components.ListTagDialog = function(config){
	
	var default_config = {
	    width: 200,
    	height: 200,
	    closable: true,
    	maximizable: false,
	    minimizable: false,
    	resizable: true,
	    autoDestroy: true,
    	closeAction: 'hide',
	    title: "Tags",
		autoScroll:true,
		modal:true,
		bbar : new Ext.Toolbar(),
	    // --------
		doc_id : null,
		arr_tag_list : [],
		arr_checked_tag_list : []
  	}
	config = Ext.applyIf(config || {}, default_config);
	
	sch.wfm.components.ListTagDialog.superclass.constructor.call(this, config);
}

Ext.extend(sch.wfm.components.ListTagDialog, Ext.Window,{
	
	checkboxGroup : null,
	
	initComponent : function(){
		
		sch.wfm.components.ListTagDialog.superclass.initComponent.call(this);
		
		this.addEvents({
		      'clickApplyTags': true,
			  'clickCreateTag' : true
	    });		

		this.on('render', this.onWindowRender, this);
	},
	
	onWindowRender : function()
	{
		this.createCheckBoxGroup.call(this);
		this.createToolBar.call(this);
	},
	
	createCheckBoxGroup : function(){
		
		this.checkboxGroup = new Ext.form.CheckboxGroup({
				id : 'tagSelector',
				ref : 'tagSelector',
				columns: 1,
				width: '90%',
				style : 'padding:5px 0px 2px 5px',
				itemCls: 'x-check-group-alt',
				items : [{boxlabel: 'Standard', hidden: true}],
				definedTags : []
		});
		
		this.checkboxGroup.on('render', this.onCheckBoxGroupRender, this);
		
		this.add(this.checkboxGroup);
	},
	
	createToolBar : function(){
		
		var tb = this.getBottomToolbar();
	    tb.x_buttons = {};
		
		tb.x_buttons.applyTag = tb.addButton({
			text: Messages.cmdApplyTags,
			handler: function(){
				this.fireEvent('clickApplyTags');
			},
			scope: this
		});

		tb.x_buttons.createTag = tb.addButton({
			text: Messages.cmdNewTag,
			handler: function(){
				this.fireEvent('clickCreateTag');
			},
			scope: this
		});

	},

	onCheckBoxGroupRender : function(){
		
		this.fillTagListCheckBoxes.call(this);
		
	},
	
	fillTagListCheckBoxes : function(){
		
		Ext.each(this.arr_tag_list,function(tagName,index){
			var checkbox = new Ext.form.Checkbox({boxLabel:tagName.toString(), inputValue: tagName.toString(), id:tagName.toString(), checked: false});
			var col = this.checkboxGroup.panel.items.get(this.checkboxGroup.items.getCount() % this.checkboxGroup.panel.items.getCount());
			
			this.checkboxGroup.items.add(checkbox);
			
			col.add(checkbox);
		},this);
		
		var strDefinedTags = implode(",",this.arr_checked_tag_list);
		this.checkboxGroup.setValue(strDefinedTags);
	},

	addTagListCheckBox : function(tagName){
		
		var checkbox = new Ext.form.Checkbox({boxLabel:tagName.toString(), inputValue: tagName.toString(), id:tagName.toString(), checked: false});
		var col = this.checkboxGroup.panel.items.get(this.checkboxGroup.items.getCount() % this.checkboxGroup.panel.items.getCount());

		this.checkboxGroup.items.add(checkbox);
		col.add(checkbox);

		this.checkboxGroup.panel.doLayout();
	},

	getSelectedTags : function(){
		
		var tags = [];
		Ext.each(this.checkboxGroup.getValue(),function(item,index){
			tags[index] = item.inputValue;
		});
		
		return tags;
	}
	
});

//*******************************************************************************************************

sch.wfm.components.GroupsDialog = function(config){
	
	var default_config = {
	    width: 300,
    	height: 300,
	    closable: true,
    	maximizable: false,
	    minimizable: false,
    	resizable: true,
	    autoDestroy: true,
    	closeAction: 'hide',
	    title: "Groups",
		autoScroll:true,
		modal:true,
		bbar : new Ext.Toolbar(),
	    // --------
		doc_id : null,
		groupsCollection : {},
		initCheckedGroups : [],
		initCheckedGroupsId : []
  	}
	config = Ext.applyIf(config || {}, default_config);
	
	sch.wfm.components.GroupsDialog.superclass.constructor.call(this, config);
}

Ext.extend(sch.wfm.components.GroupsDialog, Ext.Window,{
	
	checkboxGroup : null,
	
	initComponent : function(){
		
		sch.wfm.components.GroupsDialog.superclass.initComponent.call(this);
		
		this.addEvents({
		      'clickApplyGroups': true,
			  'clickCreateGroup' : true
	    });		

		this.on('render', this.onWindowRender, this);
	},
	
	onWindowRender : function()
	{
		this.createCheckBoxGroup.call(this);
		this.createToolBar.call(this);
	},
	
	createCheckBoxGroup : function(){
		
		this.checkboxGroup = new Ext.form.CheckboxGroup({
				id : 'groupSelector',
				ref : 'groupSelector',
				columns: 1,
				width: '90%',
				style : 'padding:5px 0px 2px 5px',
				itemCls: 'x-check-group-alt',
				items : [{boxlabel: 'Standard', hidden: true}]
		});
		
		this.checkboxGroup.on('render', this.onCheckBoxGroupRender, this);
		
		this.add(this.checkboxGroup);
	},
	
	createToolBar : function(){
		
		var tb = this.getBottomToolbar();
	    tb.x_buttons = {};
		
		tb.x_buttons.applyGroup = tb.addButton({
			text: "Share/Unshare to Group(s)",
			handler: function(){
				this.fireEvent('clickApplyGroups');
			},
			scope: this
		});
	},

	onCheckBoxGroupRender : function(){
		
		this.fillGroupsCheckBoxes.call(this);
		
	},
	
	fillGroupsCheckBoxes : function(){

		for(var group_id in this.groupsCollection)
		{
			var checkbox = new Ext.form.Checkbox({boxLabel  : this.groupsCollection[group_id].group_name.toString(), 
												  inputValue: this.groupsCollection[group_id]._id.toString(),
												  id:this.groupsCollection[group_id]._id.toString(),
												  checked: false});

			var col = this.checkboxGroup.panel.items.get(this.checkboxGroup.items.getCount() % this.checkboxGroup.panel.items.getCount());
			
			this.checkboxGroup.items.add(checkbox);
			
			col.add(checkbox);
		}
		
		Ext.each(this.initCheckedGroups,function(group,index){
			this.initCheckedGroupsId.push(group.group_id.toString());
		},this);
		
		var initCheckedGroupsIdFormated = implode(",",this.initCheckedGroupsId);
		this.checkboxGroup.setValue(initCheckedGroupsIdFormated);
	},

	addGroupsCheckBox : function(groupName){
		
		var checkbox = new Ext.form.Checkbox({boxLabel:groupName.toString(), inputValue: groupName.toString(), id:groupName.toString(), checked: false});
		var col = this.checkboxGroup.panel.items.get(this.checkboxGroup.items.getCount() % this.checkboxGroup.panel.items.getCount());

		this.checkboxGroup.items.add(checkbox);
		col.add(checkbox);

		this.checkboxGroup.panel.doLayout();
	},

	getSelectedGroups : function(){
		
		var groups = [];
		Ext.each(this.checkboxGroup.getValue(),function(item,index){
			groups[index] = item.inputValue;
		});
		
		return groups;
	}
	
});


//*******************************************************************************************************

sch.wfm.components.SharingUserPanel = function(config){

	var default_config = {
	    width: 700,
    	height: 400,
	    closable: true,
    	maximizable: false,
	    minimizable: false,
    	resizable: true,
		plain:true,
		layout:'fit',
		border:false,
	    autoDestroy: true,
    	closeAction: 'hide',
	    title: "Users",
		autoScroll:true,
		modal:true,
		//bbar : new Ext.Toolbar(),
	    // --------
		doc_id : null,
		group_id : null,
		initData : []
  	}

	config = Ext.applyIf(config || {}, default_config);

	sch.wfm.components.SharingUserPanel.superclass.constructor.call(this, config);
}


Ext.extend(sch.wfm.components.SharingUserPanel, Ext.Panel,{

	//self : this,
	
	dataView : null,
	
	searchField : null,
	
	typeSearch: null,

	usersStore : new Ext.data.JsonStore({fields:[{name: 'username'}]}),

	initComponent : function(){
		sch.wfm.components.SharingUserPanel.superclass.initComponent.call(this);

		this.addEvents({
		      'addUser': true,
			  'promptAddUser': true,
			  'removeUser' : true,
			  'loadUsers' : true
	    });		

		this.usersStore.removeAll();
		
		this.usersStore.on('datachanged', this.dataStoreChanged);
		this.usersStore.on('add', this.dataStoreChanged);
		this.usersStore.on('remove', this.dataStoreChanged);

		this.on('render', this.onWindowRender, this);
	},
	
	dataStoreChanged : function(Store ,  records, index){
		var count = Store.getCount();
		//Ext.get('userDgbox_totalUsers').update(count + " user(s)");
	},

	onWindowRender : function(){
		this.createDataview.call(this);	
	},

	createSearchField : function(){

		this.typeSearch = new Ext.form.ComboBox({
				id : 'cbxTypeUserSearch',
				fieldLabel: 'Search',
				store: new Ext.data.ArrayStore({
	        		id: 0,
			        fields: [
        			    'stype',
		    	        'displayText'
        			],
		        	data: [['uid', 'Συνθηματικό χρήστη (username)'], ['cn', 'Ονοματεπώνυμο χρήστη']]
    			}),
				valueField: 'stype',
				displayField: 'displayText',
				typeAhead: false,
				mode: 'local',
				triggerAction: 'all',
				selectOnFocus:true
		});		
		
		this.typeSearch.setValue("uid");
		this.typeSearch.setRawValue("uid");
		
		this.typeSearch.on('select',function(ddl,rec,idx){
			this.searchField.getStore().setBaseParam('stype',Ext.getCmp('cbxTypeUserSearch').getValue());
		},this);
		
		var ds = new Ext.data.Store({

			proxy: new Ext.data.HttpProxy({
            	url: scope.CMD.cmd_search_users,
				method: 'POST'
        	}),

			baseParams: {'stype':Ext.getCmp('cbxTypeUserSearch').getValue()},

			reader: new Ext.data.JsonReader({root: "search_results"},[{name: 'uid', mapping: 'uid'},{name: 'cn', mapping: 'cn'}])
    	});
		
		var resultTpl = new Ext.XTemplate(
        	'<tpl for="."><div class="search-item" style="padding:20px" ext:qtip="Κάντε \'κλικ\' για να διαμοιράσετε το αρχείο στον/στην \'{cn}\' ">',
            '<h3>{cn}</h3>',
			'<h3>{[this.getUsername(values.uid)]}</h3>',
    	    '</div></tpl>',
			{
				compiled: true,
				
				getUsername: function(username){
            		return username;
        		}
			}
    	);		

		this.searchField = new Ext.form.ComboBox({
        	store: ds,
			id:'cbxSearchUsers',
			triggerClass: 'x-form-search-trigger',
	        displayField:'cn',
			queryParam: 'name',
    	    typeAhead: false,
        	loadingText: Messages.loading_text_search_user,
	        width: 370,
	        hideTrigger:false,
    	    tpl: resultTpl,
	        itemSelector: 'div.search-item',
			
			onSelect: function(record){
				this.ownerCt.ownerCt.ownerCt.fireEvent('addUser',record);
			}
			
    	});
	},
	
	createDataview : function(){
		
		var doc_id = this.doc_id;
		var group_id = this.group_id;

		var self = this;
		
		// Column header
		var cm = new Ext.grid.ColumnModel({
			defaults: {
				sortable: true,
				menuDisabled: true
			},
			columns: [
				{
					header: Messages.hdr_lbl_username,
					dataIndex: 'username',
					id : 'name',
					width: 550,
					css: 'white-space:normal;',
					hideable: false
				},
				{
					xtype: 'actioncolumn',
					width: 30,
					items: [
						{
		                    icon   : 'img/delete.gif',
							tooltip:'',
			                handler: function(grid, rowIndex, colIndex) {
								var rec = grid.getStore().getAt(rowIndex);
								//console.log(rec.get('username'));
								//console.log(doc_id);
								
								self.fireEvent("removeUser",{'user': rec.get('username'), 'doc_id': doc_id, 'group_id': group_id});
                    		}
                		}
					]
				}
			]
		});
		
		// GridPanel Object
		this.dataView = new Ext.grid.EditorGridPanel({
			store: this.usersStore,
			layout:'fit',
			border:false,
			cm: cm,
			stripeRows: true,
			stateful:true,
			autoExpandColumn: 'name',
			enableColLock : false,
			scope:this,
			tbar : new Ext.Toolbar(),
			bbar : {
					id : 'userDgbox_statusbar',
					items: [
							{ xtype: 'button', text: '',ref:'txtAjaxMnt'},
							
							{ xtype: 'tbtext', text: '&nbsp;',id:'userDgbox_state'},
							
							'->',
							
							{ xtype: 'tbtext', text: '&nbsp;',id:'userDgbox_totalUsers'}
					]
			},
			selModel: new Ext.grid.RowSelectionModel()
		});

		// GridPanel SelectionModel
		var gsm = this.dataView.getSelectionModel();

		gsm.on('selectionchange', function(sm, rowIndex){
			this.users2rem = sm.getSelections();
		},this,{buffer:50});		

		// GridPanel Toolbar
		var tb = this.dataView.getTopToolbar();
	    tb.x_buttons = {};

		this.createSearchField.call(this);

		
		tb.add(this.typeSearch);
		tb.add(this.searchField);
		

		// GridPanel Events
		this.dataView.on('afterrender',function(){
			this.fireEvent("loadUsers");
		},this);

		this.add(this.dataView);
	}

});


//*******************************************************************************************************

sch.wfm.components.SharingSchoolPanel = function(config){

	var default_config = {
	    width: 700,
    	height: 400,
	    closable: true,
    	maximizable: false,
	    minimizable: false,
    	resizable: true,
		plain:true,
		layout:'fit',
		border:false,
	    autoDestroy: true,
    	closeAction: 'hide',
	    title: "Users",
		autoScroll:true,
		modal:true,
		//bbar : new Ext.Toolbar(),
	    // --------
		doc_id : null,
		group_id : null,
		initData : []
  	}

	config = Ext.applyIf(config || {}, default_config);

	sch.wfm.components.SharingUserPanel.superclass.constructor.call(this, config);
}


Ext.extend(sch.wfm.components.SharingSchoolPanel, Ext.Panel,{

	//self : this,
	
	dataView : null,
	
	searchField : null,
	
	typeSearch: null,

	schoolsStore : new Ext.data.JsonStore({fields:['school_id', 'grade_id', 'class_id']}),

	initComponent : function(){
		sch.wfm.components.SharingUserPanel.superclass.initComponent.call(this);

		this.addEvents({
		      'addSchool': true,
			  'promptAddSchool': true,
			  'removeSchool' : true,
			  'loadSchools' : true
	    });		

		this.schoolsStore.removeAll();
		
		this.schoolsStore.on('datachanged', this.dataStoreChanged);
		this.schoolsStore.on('add', this.dataStoreChanged);
		this.schoolsStore.on('remove', this.dataStoreChanged);

		this.on('render', this.onWindowRender, this);
	},
	
	dataStoreChanged : function(Store ,  records, index){
		var count = Store.getCount();
		//Ext.get('userDgbox_totalUsers').update(count + " user(s)");
	},

	onWindowRender : function(){
		this.createDataview.call(this);	
	},

	createSearchField : function(){

		this.typeSearch = new Ext.form.ComboBox({
				id : 'cbxTypeSchoolSearch',
				fieldLabel: 'Search',
				store: new Ext.data.ArrayStore({
	        		id: 0,
			        fields: [
        			    'stype',
		    	        'displayText'
        			],
		        	data: [['uid', 'Συνθηματικό σχολείου (uid)'], ['cn', 'Όνομα Σχολείου']]
    			}),
				valueField: 'stype',
				displayField: 'displayText',
				typeAhead: false,
				mode: 'local',
				triggerAction: 'all',
				selectOnFocus:true
		});
		
		this.typeSearch.setValue("uid");
		this.typeSearch.setRawValue("uid");
                
                this.addAllButton = new Ext.form.Label({
                    id:'ShareAllLabel',
                    text: 'Διαμοιρασμός σε όλους',
                    style:'margin-left: 10px; padding: 2px 2px 2px 2px; border: 1px outset;',
                    listeners: {
                        render: function(c){
                            c.getEl().on('click', function(){
                                dontaddnew = false;
                                var data = function() {
                                    this.uid = '*';
                                    this.sgrade = '*';
                                    this.sclass = '*';
                                }
                                data.prototype.get = function(id) {
                                    return this[id];
                                }
				this.ownerCt.ownerCt.ownerCt.fireEvent('addSchool',new data());
                            }, c);
                        }
                    }
                });

		
		this.typeSearch.on('select',function(ddl,rec,idx){
			this.searchField.getStore().setBaseParam('stype',Ext.getCmp('cbxTypeSchoolSearch').getValue());
		},this);
		
		var ds = new Ext.data.Store({

			proxy: new Ext.data.HttpProxy({
            	url: scope.CMD.cmd_search_schools,
				method: 'POST'
        	}),

			baseParams: {'stype':Ext.getCmp('cbxTypeSchoolSearch').getValue()},

			reader: new Ext.data.JsonReader({root: "search_results"},[{name: 'uid', mapping: 'uid'},{name: 'cn', mapping: 'cn'},{name: 'sgrade', mapping: 'sgrade'},{name: 'sclass', mapping: 'sclass'}])
    	});
		
		var resultTpl = new Ext.XTemplate(
        	'<tpl for="."><div class="search-item" style="padding:20px" ext:qtip="Κάντε \'κλικ\' για να διαμοιράσετε το αρχείο στον/στην \'{cn}\' ">',
            '<h3>{cn}</h3>',
			'<h3>{[this.getSchool(values.uid)]}</h3>',
    	    '</div></tpl>',
			{
				compiled: true,
				
				getSchool: function(school){
            		return school;
        		}
			}
    	);		

		this.searchField = new Ext.form.ComboBox({
        	store: ds,
			id:'cbxSearchSchools',
			triggerClass: 'x-form-search-trigger',
	        displayField:'cn',
			queryParam: 'name',
    	    typeAhead: false,
        	loadingText: Messages.loading_text_search_school,
	        width: 370,
	        hideTrigger:false,
    	    tpl: resultTpl,
	        itemSelector: 'div.search-item',
			
			onSelect: function(record){
                                dontaddnew = false;
				this.ownerCt.ownerCt.ownerCt.fireEvent('addSchool',record);
			}
			
    	});
	},
	
	createDataview : function(){
		
		var doc_id = this.doc_id;
		var self = this;
                var grades = [
                    ['*', 'Όλες'],
                    [1, 'Α'],
                    [2, 'Β'],
                    [3, 'Γ']
                ];
                var classes = [
                    ['*', 'Όλες'],
                    [1, '1'],
                    [2, '2'],
                    [3, '3'],
                    [4, '4'],
                    [5, '5'],
                    [6, '6'],
                    [7, '7'],
                    [8, '8'],
                    [9, '9'],
                    [10, '10'],
                    [11, '11'],
                    [12, '12'],
                ];
		
		// Column header
		var cm = new Ext.grid.ColumnModel({
			defaults: {
				sortable: true,
				menuDisabled: true
			},
			columns: [
				{
					header: Messages.hdr_lbl_school,
					dataIndex: 'school_id',
					id : 'school',
					width: 550,
					css: 'white-space:normal;',
					hideable: false
				},
				{
					header: Messages.hdr_lbl_sgrade,
					dataIndex: 'grade_id',
					id : 'sgradee',
					width: 150,
					css: 'white-space:normal;',
					hideable: false,
                                        editor: new Ext.grid.GridEditor(new Ext.form.ComboBox({
                                            store: new Ext.data.SimpleStore({
                                                id: 0,
                                                fields:
                                                    [
                                                        'grade_id',   //numeric value is the key
                                                        'grade_text' //the text value is the value
                                                    ],
                                                data: grades
                                            }),
                                            valueField:'grade_id',
                                            displayField:'grade_text',
                                            mode:'local',
                                            typeAhead: false,
                                            editable: false,
                                            triggerAction: "all"
                                        }))
				},
				{
					header: Messages.hdr_lbl_sclass,
					dataIndex: 'class_id',
					id : 'sclass',
					width: 150,
					css: 'white-space:normal;',
					hideable: false,
                                        editor: new Ext.grid.GridEditor(new Ext.form.ComboBox({
                                            store: new Ext.data.SimpleStore({
                                                id: 1,
                                                fields:
                                                    [
                                                        'class_id',   //numeric value is the key
                                                        'class_text' //the text value is the value
                                                    ],
                                                data: classes
                                            }),
                                            valueField:'class_id',
                                            displayField:'class_text',
                                            mode:'local',
                                            typeAhead: false,
                                            editable: false,
                                            triggerAction: "all"
                                        }))
				},
				{
					xtype: 'actioncolumn',
					width: 30,
					items: [
						{
		                    icon   : 'img/delete.gif',
							tooltip:'',
			                handler: function(grid, rowIndex, colIndex) {
								var rec = grid.getStore().getAt(rowIndex);
                                                                srowIndexToUnshare = rowIndex;
								self.fireEvent("removeSchool",{'school_id': rec.get('school_id'),'grade_id': rec.get('grade_id'),'class_id': rec.get('class_id'), 'doc_id': doc_id});
                    		}
                		}
					]
				}
			]
		});
		
		// GridPanel Object
                var otherthis = this;
		this.dataView = new Ext.grid.EditorGridPanel({
			store: this.schoolsStore,
			layout:'fit',
			border:false,
			cm: cm,
			stripeRows: true,
			stateful:true,
			autoExpandColumn: 'school',
			enableColLock : false,
			scope:this,
			tbar : new Ext.Toolbar(),
			bbar : {
					id : 'schoolDgbox_statusbar',
					items: [
							{ xtype: 'button', text: '',ref:'txtAjaxMnt'},
							
							{ xtype: 'tbtext', text: '&nbsp;',id:'schoolDgbox_state'},
							
							'->',
							
							{ xtype: 'tbtext', text: '&nbsp;',id:'schoolDgbox_totalSchools'}
					]
			},
			selModel: new Ext.grid.RowSelectionModel(),
                        listeners: {
                            afteredit: function (e) {
                                /*
                                    Properties of 'e' include:
                                    e.grid - This grid
                                    e.record - The record being edited
                                    e.field - The field name being edited
                                    e.value - The value being set
                                    e.originalValue - The original value for the field, before the edit.
                                    e.row - The grid row index
                                    e.column - The grid column index
                                */
                                var rec = e.grid.getStore().getAt(e.row);
                                srowIndexToUnshare = undefined;
                                dontaddnew = true;
                                if(e.field == 'grade_id') {
                                    self.fireEvent("removeSchool",{'school_id': rec.get('school_id'),'grade_id': e.originalValue,'class_id': rec.get('class_id'), 'doc_id': doc_id});
                                } else if(e.field == 'class_id') {
                                    self.fireEvent("removeSchool",{'school_id': rec.get('school_id'),'grade_id': rec.get('grade_id'),'class_id': e.originalValue, 'doc_id': doc_id});
                                }
                                self.fireEvent('addSchool',{'uid': rec.get('school_id'),'sgrade': rec.get('grade_id'),'sclass': rec.get('class_id'), 'get': function(varname){return this[varname];}});
                                return true;
                            }
                        }
		});

		// GridPanel SelectionModel
		var gsm = this.dataView.getSelectionModel();

		gsm.on('selectionchange', function(sm, rowIndex){
			this.schools2rem = sm.getSelections();
		},this,{buffer:50});		

		// GridPanel Toolbar
		var tb = this.dataView.getTopToolbar();
                tb.x_buttons = {};

		this.createSearchField.call(this);

		
		tb.add(this.typeSearch);
		tb.add(this.searchField);
                tb.add(this.addAllButton);
		

		// GridPanel Events
		this.dataView.on('afterrender',function(){
			this.fireEvent("loadSchools");
		},this);

		this.add(this.dataView);
	}

});


//*******************************************************************************************************

sch.wfm.components.SharingGroupPanel = function(config){

	var default_config = {
	    width: 700,
    	height: 400,
	    closable: true,
    	maximizable: false,
	    minimizable: false,
    	resizable: true,
		plain:true,
		layout:'fit',
	    autoDestroy: true,
    	closeAction: 'hide',
	    title: "Groups",
		autoScroll:true,
		modal:true,
		bbar : new Ext.Toolbar(),
	    // --------
		doc_id : null
  	}

	config = Ext.applyIf(config || {}, default_config);

	sch.wfm.components.SharingGroupPanel.superclass.constructor.call(this, config);
}

Ext.extend(sch.wfm.components.SharingGroupPanel, Ext.Panel,{

	dataView : null,
	
	groupsIdNow : new Array(),
	
	groupsIdToShare : new Array(),
	
	groupsIdToUnShare : new Array(),

	initComponent : function(){

		sch.wfm.components.SharingGroupPanel.superclass.initComponent.call(this);
		
		this.groupsIdNow = new Array();
		this.groupsIdToShare = new Array();
		this.groupsIdToUnShare = new Array();

		this.addEvents({
			  'saveChanges' : true
	    });		

		this.on('render', this.onWindowRender, this);
	},

	dataStoreChanged : function(Store ,  records, index){
		var count = Store.getCount();
	},

	onWindowRender : function()
	{
		this.createDataview();
	},

	createDataview : function(){

		var checkboxSel = new Ext.grid.CheckboxSelectionModel({checkOnly:true,header:''});

		// Column headers
		var cm = new Ext.grid.ColumnModel({
			defaults: {
				sortable: true,
				menuDisabled: true
			},
			columns: [
				checkboxSel,	  
				{
					header: Messages.hdr_lbl_groups,
					dataIndex: 'group_name',
					id : 'group_name',
					width: 150,
					css: 'white-space:normal;',
					hideable: false
				}
			]
		});

		// GridPanel Object
		this.dataView = new Ext.grid.EditorGridPanel({
			store: this.allGroups,
			layout:'fit',
			border:false,
			stateful:false,
			cm: cm,
			selModel:checkboxSel,
			stripeRows: true,
			autoExpandColumn: 'group_name',
			tbar : new Ext.Toolbar(),
			bbar : {
					id : 'pnlGroup_statusbar',
					items: [
							{ xtype: 'tbtext', text: '&nbsp;',id:'pnlGroup_state'}
					]
			}
		});

		// GridPanel SelectionModel
		var gsm = this.dataView.getSelectionModel();

		// GridPanel Toolbar
		var tb = this.dataView.getTopToolbar();
	    tb.x_buttons = {};

		tb.x_buttons.save = tb.addButton({
			text: Messages.btn_lbl_saveChanges,
			handler: function(){
				this.fireEvent('saveChanges');
			},
			scope: this
		}); 

		// GridPanel Events
		this.dataView.on('viewready',function(){

			var recs = new Array();
			//this.groupsIdNow = new Array();

			Ext.each(this.initSelectedGroups,function(objGroup,index){
				var recIdx = this.dataView.getStore().find('_id',objGroup.group_id);
				recs.push(this.dataView.getStore().getAt(recIdx));

				this.groupsIdNow.push(objGroup.group_id);
			},this);

			gsm.selectRecords(recs,true);

			gsm.on('rowselect', function(SelectionModel ,  rowIndex,  r){

				var groupRecId = r.get("_id");

				this.groupsIdToUnShare.remove(groupRecId);
				
				if (!in_array(groupRecId,this.groupsIdNow))
				this.groupsIdToShare.push(groupRecId);
				
			},this);

			gsm.on('rowdeselect', function(SelectionModel ,  rowIndex,  r){
				
				var groupRecId = r.get("_id");

				this.groupsIdToShare.remove(groupRecId);
				
				if (in_array(groupRecId,this.groupsIdNow))
				this.groupsIdToUnShare.push(groupRecId);
				
			},this);
			
		},this);
		
		this.add(this.dataView);
	},

	updateStatus : function(state,msg){

		switch(state)
		{
			case 'start':
				Ext.get('pnlGroup_state').removeClass('readyStatusBar');
				Ext.get('pnlGroup_state').removeClass('errorStatusBar');							
				Ext.get('pnlGroup_state').addClass('loading');
				break;
			case 'success':
				Ext.get('pnlGroup_state').removeClass('loading');
				Ext.get('pnlGroup_state').addClass('readyStatusBar');
				break;
			case 'fail':
			case 'connection_problem':
				Ext.get('pnlGroup_state').removeClass('loading');
				Ext.get('pnlGroup_state').addClass('errorStatusBar');
				break;
		}

		Ext.get('pnlGroup_state').update(msg);
		Ext.getCmp('pnlGroup_statusbar').doLayout();
	}

});

//*******************************************************************************************************


sch.wfm.components.thumbView = Ext.extend(Ext.DataView, {

	initComponent : function(){
		sch.wfm.components.thumbView.superclass.initComponent.call(this);
		
		this.on('activate',function(grid){
			grid.clearSelections();
		});
	},
	
	tpl: new Ext.XTemplate(
            '<ul>',
                '<tpl for=".">',
                    '<li class="thumb">',
						'{thumbnail}',
						'<strong class="x-editable">{name}</strong>',
                    '</li>',
                '</tpl>',
            '</ul>',
			{compiled: false}
	),
	
	itemSelector: 'li.thumb',
    singleSelect: true,
    multiSelect : true,
    autoScroll  : true,
	
	mtime: new Date().getTime(),
	
	renderThumb : function(doc_id){
										
		return String.format(scope.serverURL + "/cmd_get_thumbnail/?doc_id={0}&mtime={1}",doc_id,this.mtime);
	},	
	
	prepareData : function(data){

		var ext = this.getFileExtension( data.name );
		var icon = '';
		var thumbnail = '';
		
		switch ( ext ) 
		{
			case 'gif': 
			case 'jpg':
			case 'png': 
				
				//thumbnail = '<img src="'+String.format(scope.serverURL + '/cmd_get_thumbnail?doc_id={0}&mtime={1}',data.realId,this.mtime)+'"/>';		
				thumbnail = '<img src="'+ this.renderThumb(data.realId) +'"/>';
			//case 'png': 
			case 'bmp':
				icon = "img/thumbs/image.png";
				//icon = String.format(scope.serverURL + "/cmd_get_file?doc_id={0}",data.realId)
				break
			case 'pdf':
				icon = "img/thumbs/pdf.png";
				break;
			case '':
			case null:
				icon = "img/thumbs/folder.png";
				break;
			default:
				icon = "img/thumbs/txt2.png";
		}	
		
		data.thumb = icon;
		data.ext = ext;
		data.thumbnail = thumbnail;
		
        return data;
	},
	
	// --- private methods ---
	getFileExtension : function(fname) {

		var dot = fname.lastIndexOf("."); 

		if( dot == -1 ) return "";

		var extension = fname.substr(dot+1,fname.length);

		return extension.toLowerCase(); 
	}

});

//*******************************************************************************************************


sch.wfm.components.DialogSearchUsers = function(config){
  var default_config = {
    width: 450,
    height: 400,
    minWidth: 450,
    minHeight: 400,
    plain: true,
    constrainHeader: true,
    draggable: true,
    closable: true,
    maximizable: true,
    minimizable: true,
    resizable: true,
    autoDestroy: true,
    title: Messages.win_title_search_users,
	layout:'fit',
	loadMask:true,
	modal:true,
	border: true,
	id : 'DialogSearchUsers'
  };
  
  config = Ext.applyIf(config || {}, default_config);
  sch.wfm.components.DialogSearchUsers.superclass.constructor.call(this, config);
};

Ext.extend(sch.wfm.components.DialogSearchUsers, Ext.Window, {

	usersStore : null,

	grid_panel : null,

	grid_panel_cols : null,
	
	mntSearchUsers : null,

	initComponent : function()
  	{
    	sch.wfm.components.DialogSearchUsers.superclass.initComponent.call(this);
		this.state_tpl = new Ext.Template(
		  "<div class='ext-ajaxRequestDialog-state ext-ajaxRequestDialog-state-{state}'>&#160;</div>"
		).compile();		
		
		this.createGrdDataView();

		this.on('close',function(){

			if (this.mntSearchUsers != null)
				this.mntSearchUsers.close();
				
			this.grid_panel.getStore().removeAll();

		},this);
		
		this.addEvents({
			  'addUsers': true
		});
	},
	
	createGrdDataView : function(){

		this.usersStore = new Ext.data.JsonStore({fields:[{name: 'username'},{name: 'uid'},{name: 'cn'}]});
		
		// Column header
		var cm = new Ext.grid.ColumnModel({
			defaults: {
				sortable: true,
				menuDisabled: true
			},
			columns: [
				{
					header: Messages.hdr_lbl_username,
					dataIndex: 'username',
					id : 'name',
					width: 275,
					css: 'white-space:normal;',
					hideable: false
				},
				{
					header: Messages.hdr_lbl_usercanonical,
					dataIndex: 'cn',
					id : 'canonical_name',
					width: 275,
					css: 'white-space:normal;',
					hideable: false
				}
			]
		});
		
		// GridPanel Object
		this.grid_panel = new Ext.grid.EditorGridPanel({
			store: this.usersStore,
			layout:'fit',
			height: this.height-50,
			border:false,
			cm: cm,
			stripeRows: true,
			autoExpandColumn: 'name',
			enableColLock : false,
			//scope:this,
			tbar : new Ext.Toolbar(),
			bbar : {
				items: [
							{ xtype: 'button', 
							  text: '&nbsp;',
							  ref:'txtAjaxMnt',
							  listeners: {
								  click : function(){
		
									if (this.ownerCt.ownerCt.ownerCt.mntSearchUsers != null)
										this.ownerCt.ownerCt.ownerCt.mntSearchUsers.show();
								  }
							  }
							},
							'->'
						]
			},
			selModel: new Ext.grid.RowSelectionModel()
		});

		// GridPanel SelectionModel
		var gsm = this.grid_panel.getSelectionModel();
				
		gsm.on('selectionchange', function(sm, rowIndex){
			if (sm.selections.length>0)
			{
				//tb.x_buttons.addUsers.show();
				Ext.getCmp('btnAddUsers').enable();
			}
			else
			{
				//tb.x_buttons.addUsers.hide();
				Ext.getCmp('btnAddUsers').disable();				
			}
			
		},this.grid_panel,{buffer:50});		
		
		// GridPanel Toolbar
		var tb = this.grid_panel.getTopToolbar();
		
		var txtSearchField = new Ext.form.TriggerField({
			emptyText: Messages.prompt_lbl_enter_username,
			width : 350,
			triggerClass: 'x-form-search-trigger',
			onTriggerClick: function() {
				//this.ownerCt.ownerCt.ownerCt.ownerCt.searchUsers(this.getValue());
				if (this.getValue().length > 0)
				{
					var stype = Ext.getCmp('stype').getValue().getGroupValue();				
					Ext.getCmp('DialogSearchUsers').searchUsers(this.getValue(),stype);
				}
			},
			scope :this
		});

		tb.addField(
			{
				xtype: 'fieldset',
				style :{
						'border':0
				},
				layout:'anchor',
				items : [
					txtSearchField,
					{
						xtype: 'radiogroup',
						columns : 1,
						id: 'stype',
				        items: [
					              {boxLabel: Messages.msg_search_by_username, name: 'opt-1', inputValue: 'uid'},
					              {boxLabel: Messages.msg_search_by_user_name, name: 'opt-1', inputValue: 'cn', checked: true}
        	    		]
					},
					{
						xtype: 'button',
						text: Messages.btn_lbl_share,
						disabled:true,
						id: 'btnAddUsers',
						handler: function(){
							Ext.getCmp('DialogSearchUsers').fireEvent('addUsers',gsm.getSelections());
						}
					}
						
				]
			}
		);
		this.add(this.grid_panel);
	},

	searchUsers : function(strSearch,sType)
	{
		var sta = this.grid_panel.getBottomToolbar().txtAjaxMnt;
		sta.setText(Messages.loading_text_search_user);

		this.mntSearchUsers = new Ext.uEvt.AjaxReq.Monitor({
		
			url : scope.CMD.cmd_search_users,
		
			dataParams : [{'taskName' : strSearch.toString()}],
			
			buildPostParams : function(data){
				return {'name' : strSearch.toString(), 'stype': sType};
			},

			taskRecordCustomValues : new Array('taskName'),

			taskRecordCustomFields : new Array({name: 'task_name'}),

			customCols : new Array(

				{
					header: Messages.hdr_lbl_user4search,
					width: 200,
					dataIndex: 'task_name',
					sortable: true
				}
			),

			textLayout : {
		
				windowTitle : Messages.win_title_opcode_searchUsers,
				waitingMsg : Messages.loading_txt_process_in_queue,
				processingMsg : Messages.loading_txt_in_process,
				abortMsg : Messages.loading_txt_process_abort,
				successMsg : Messages.loading_txt_process_success,
				errorMsg : Messages.loading_txt_process_error,
				failMsg : Messages.loading_txt_process_fail,

				lblBtnProcess : Messages.btn_lbl_continue_processes,
				lblBtnAbort : Messages.btn_lbl_abort_processes,
				lblBtnClose : Messages.btn_lbl_close
			},	
			
			autoRun : true
		});
		
		this.mntSearchUsers.on("ajaxReqTaskCompleteEvent", function(data){

			if (data.response.success)
			{
				var initData = [];
				for(var i = 0; i < data.response.search_results.length; i++) 
				{
					//initData.push({'username':data.response.search_results[i]});
					initData.push({'username': data.response.search_results[i].uid,
									'uid': data.response.search_results[i].uid,
									'cn': data.response.search_results[i].cn
									});
				}
				
				this.usersStore.loadData(initData);			
			}
		},this);		

		this.mntSearchUsers.on("ajaxReqTaskFailedEvent", function(data){
			sta.setText(Messages.msgbox_no_users, data.msg);
		},this);

		this.mntSearchUsers.on("ajaxReqTaskTotalCompleteEvent", function(){
			//do nothing
			sta.setText(Messages.loading_text_done);
			
		},this.mntSearchUsers);
	}
	
});
