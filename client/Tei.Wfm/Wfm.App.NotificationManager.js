Ext.namespace('Ext.Wfm.App.NotificationManager');


Ext.Wfm.App.NotificationManager = function(config)
{
    var default_config = {
        border: false,
        width: 500,
        height: 300,
        minWidth: 400,
        minHeight: 300,
        plain: true,
        constrainHeader: true,
        draggable: true,
        closable: true,
        maximizable: false,
        minimizable: false,
        resizable: true,
        autoDestroy: false,
        title: Messages.win_title_notifications,
        layout:'fit',
        loadMask:true,
        modal:true,
        url: '',
        autoRun : false
  };
  
  config = Ext.applyIf(config || {}, default_config);

  Ext.Wfm.App.NotificationManager.superclass.constructor.call(this, config);
};

Ext.extend(Ext.Wfm.App.NotificationManager, Ext.Window, {

	store : null,

	notificationRecord : null,

	state_tpl : null,

	grid_panel : null,

	grid_panel_cols : null,

	progress_bar : null,

	is_requesting : false,

  	initial_queued_count : 0,
	
	transactionId : null,
        
        checkboxSel : new Ext.grid.CheckboxSelectionModel({checkOnly:true,header:''}),
        
	docsIdToMarkAsRead : new Array(),
        
        id: 'win_NotificationManager',
        
        closeAction: 'hide',
        
        timer: null,
        
        //poll every 5 min
        pollInterval: 300000,
        
        // testing at 10 sec
        //pollInterval: 10000,
	
	initComponent : function()
  	{
                Ext.Wfm.App.NotificationManager.superclass.initComponent.call(this);
		
		this.state_tpl = new Ext.Template(
		  "<div class='ext-ajaxRequestDialog-state ext-ajaxRequestDialog-state-{state}'>&#160;</div>"
		).compile();		
		
		
		this.createNotificationRecord();
		this.createNotificationStore();
		this.createGrdPnlCols();
		this.createGrid();
               
		this.show();
		this.hide();
	},

	createNotificationRecord : function()
	{
		this.notificationRecord = Ext.data.Record.create([
							 {name: 'doc_name'},
							 {name: 'doc_type'},
							 {name: '_id'},
							 {name: 'sender'}											  
							 ]);
	},

	createNotificationStore : function()
	{
		this.store = new Ext.data.Store({
			proxy: new Ext.data.MemoryProxy([]),
			reader: new Ext.data.JsonReader({}, this.notificationRecord),
			sortInfo: {field: 'sender', direction: 'DESC'},
			pruneModifiedRecords: true
		})
	},

	
	reset : function(){
		this.purgeListeners();
		this.store.removeAll();
		this.grid_panel.getStore().removeAll();
	},
	
	pushNotification : function(objNotification){
		this.store.add(new this.notificationRecord(objNotification));
	},
	
	pushNotificationAt : function(index,objNotification){
		var store = this.store;
		store.insert(index,new this.notificationRecord(objNotification));
	},

	fillNotificationStore : function(notifications)
	{
		var store = this.store;
		
		for (var i = 0; i < notifications.length; i++) 
		{
			store.add(new this.notificationRecord(notifications[i]));
		}
	},

	createGrdPnlCols : function()
	{
                
		var stateDefaultCol = new Array({
                                                    hidden : true,
                                                    header: '',
                                                    dataIndex: '_id',
						    sortable: true
		});

		var nameDefaultCol = new Array({
                                                    header: Messages.hdr_lbl_sender,
                                                    width: 150,
						    dataIndex: 'sender',
					    	    sortable: true
	   	});


		var noteDefaultCol = new Array({
                                                    header: Messages.hdr_lbl_filename,
                                                    width: 150,
						    dataIndex: 'doc_name',
					    	    sortable: true
	   	});

		var cols = new Array();

		cols = cols.concat(this.checkboxSel, stateDefaultCol,nameDefaultCol,noteDefaultCol);

                
                
		this.grid_panel_cols = new Ext.grid.ColumnModel(cols);
	},
	
	renderStateCell : function(data, cell, record, row_index, column_index, store)
	{
		return this.state_tpl.apply({state: data});
	},
	
	fillToolbar : function()
	{
		var tb = this.grid_panel.getTopToolbar();
                tb.x_buttons = {};
		
		tb.x_buttons.markAsRead = tb.addButton({
			text: Messages.btn_lbl_markAsRead,
			tooltip: Messages.btn_lbl_markAsRead,
			handler: function(){
                                this.beginProcess();
			},
			scope: this
		});
                
                
                tb.x_buttons.loadNotifies = tb.addButton({
			text: Messages.reload_,
			tooltip: Messages.reload_,
			handler: function(){
                                scope.fireEvent('loadNotifications',null);
			},
			scope: this
		});
                
                

	},
	
	createGrid : function()
	{		
            this.grid_panel = new Ext.grid.GridPanel({
                    ds: this.store,
                    cm: this.grid_panel_cols,
                    selModel:this.checkboxSel,
                    layout:'fit',
                    x: 0,
                    y: 22,
                    border: true,
                    viewConfig: {
                        autoFill: true,
                        forceFit: true
                    },
                    tbar : new Ext.Toolbar(),
                    bbar : {
                        //id : 'pnlGroup_statusbar',
			items: [
                            { xtype: 'tbtext', text: '&nbsp;',id:'win_notification_state'}
			]
                    }
		});

		this.grid_panel.on('render', this.onGridRender, this);

		this.grid_panel.on('viewready', this.onGridViewReady, this);

		this.add(this.grid_panel);
	},
	
	onGridRender : function()
	{
		this.fillToolbar();
	},
	
	onGridViewReady : function()
	{
		
            var gsm = this.grid_panel.getSelectionModel();
                    
            gsm.on('rowselect', function(SelectionModel ,  rowIndex,  r){

		var docRecId = r.get("_id");
				
                if (!in_array(docRecId,this.docsIdToMarkAsRead))
                    this.docsIdToMarkAsRead.push(docRecId);
                                
				
            },this);
                    
            gsm.on('rowdeselect', function(SelectionModel ,  rowIndex,  r){
				
                var docRecId = r.get("_id");

		this.docsIdToMarkAsRead.remove(docRecId);
                                
            },this);

	},
	
        beginProcess : function()
	{
            this.updateStatus('start',Messages.loading);
            
            this.transactionId = Ext.Ajax.request({
                url : scope.CMD.cmd_mark_notifications_read,
		params : {'doc_id_list' : implode("/", this.docsIdToMarkAsRead) },
		method : 'POST',
		success : this.onAjaxSuccess,
		failure : this.onAjaxFailure,
		scope:this
            });
	},
        
        onAjaxSuccess : function(response){
            
            var resp = Ext.decode(response.responseText);
            
            if (resp.success)
            {
                
                for( var i= 0; i< this.docsIdToMarkAsRead.length; i++)
                {
                    var recIdx = this.grid_panel.getStore().find('_id',this.docsIdToMarkAsRead[i]);
                    var rec2del = this.grid_panel.getStore().getAt(recIdx);
                    
                    this.grid_panel.getStore().remove(rec2del);
		}
                
                this.docsIdToMarkAsRead = new Array();
                this.updateStatus('success', Messages.ready);
                
                Ext.getCmp('tb_open_notify').setText(Messages.win_title_notifications + ' [' +this.grid_panel.getStore().data.getCount()+ ']');
            }
        },
        
        onAjaxFailure : function(response, options){
            
            this.docsIdToMarkAsRead = new Array();
            this.updateStatus('fail', response.message);
        },
        
        updateStatus : function(state,msg){

		switch(state)
		{
			case 'start':
				Ext.get('win_notification_state').removeClass('readyStatusBar');
				Ext.get('win_notification_state').removeClass('errorStatusBar');							
				
                                Ext.get('win_notification_state').addClass('loading');
                                this.getEl().mask(Messages.loading, 'x-mask-loading');
                                
				break;
			case 'success':
				Ext.get('win_notification_state').removeClass('loading');
				
                                Ext.get('win_notification_state').addClass('readyStatusBar');
                                this.getEl().unmask();
				break;
			case 'fail':
			case 'connection_problem':
				Ext.get('win_notification_state').removeClass('loading');
				
                                Ext.get('win_notification_state').addClass('errorStatusBar');
                                this.getEl().unmask();
                                
				break;
		}

		Ext.get('win_notification_state').update(msg);
	}

});