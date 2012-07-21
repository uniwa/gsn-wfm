Ext.namespace('Ext.evtApp.Process');

Ext.evtApp.Process.TaskRec = {};

Ext.evtApp.Process.TaskRec.STATE_QUEUE = 0;
Ext.evtApp.Process.TaskRec.STATE_FINISHED = 1;
Ext.evtApp.Process.TaskRec.STATE_FAILED = 2;
Ext.evtApp.Process.TaskRec.STATE_PROCESSING = 3;

Ext.evtApp.Process.Manager = function(config)
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
    closable: false,
    maximizable: false,
    minimizable: false,
    resizable: true,
    autoDestroy: false,
    windowTitle: "title",
	layout:'fit',
	loadMask:true,
	modal:true,
    // --------
    url: '',
	autoRun : false,
	
	textLayout : {

		windowTitle : Messages.win_title_process_operation,
		waitingMsg : Messages.loading_txt_process_in_queue,
		processingMsg : Messages.loading_txt_in_process,
		abortMsg : Messages.loading_txt_process_abort,
		successMsg : Messages.loading_txt_process_success,
		errorMsg : Messages.loading_txt_process_error,
		failMsg : Messages.loading_txt_process_fail,
				
		lblBtnProcess : Messages.btn_lbl_continue_processes,
		lblBtnAbort : Messages.btn_lbl_abort_processes,
		lblBtnClose : Messages.btn_lbl_close
	}	
  };
  
  config = Ext.applyIf(config || {}, default_config);

  Ext.evtApp.Process.Manager.superclass.constructor.call(this, config);
};

Ext.extend(Ext.evtApp.Process.Manager, Ext.Window, {

	store : null,

	taskRecord : null,

	state_tpl : null,

	grid_panel : null,

	grid_panel_cols : null,

	progress_bar : null,

	is_requesting : false,

  	initial_queued_count : 0,
	
	transactionId : null,
	
	initComponent : function()
  	{
    	Ext.evtApp.Process.Manager.superclass.initComponent.call(this);
		
		this.setTitle(this.textLayout.windowTitle);
		
		this.state_tpl = new Ext.Template(
		  "<div class='ext-ajaxRequestDialog-state ext-ajaxRequestDialog-state-{state}'>&#160;</div>"
		).compile();		
		
		
		this.createTaskRecord();
		this.createTaskStore();
		this.createGrdPnlCols();
		this.createGrid();
		
		this.addEvents({
			  'ajaxReqTaskCompleteEvent': true,
			  'ajaxReqTaskFailedEvent': true,
			  'ajaxReqTaskTotalCompleteEvent':true
		});
		
		this.on('close',function(){this.hide();},this);

		this.show.call(this);
		this.hide.call(this);
	},

	createTaskRecord : function()
	{
		this.taskRecord = Ext.data.Record.create([
												  {name: 'state', type: 'int'},
												  {name: 'note'},
												  {name: 'name'},
												  {name: 'cmd'},
												  {name: 'params'},
												  {name: 'onComplete'},
												  {name: 'onStart'}											  
												  ]);
	},

	createTaskStore : function()
	{
		this.store = new Ext.data.Store({
			proxy: new Ext.data.MemoryProxy([]),
			reader: new Ext.data.JsonReader({}, this.taskRecord),
			sortInfo: {field: 'state', direction: 'DESC'},
			pruneModifiedRecords: true
		})
	},

	
	reset : function(){
		this.purgeListeners();
		this.store.removeAll();
		this.grid_panel.getStore().removeAll();
	},
	
	pushTask : function(objTask){
		this.store.add(new this.taskRecord(objTask));
	},
	
	pushTaskAt : function(index,objTask){
		var store = this.store;
		store.insert(index,new this.taskRecord(objTask));
	},

	fillTaskStore : function(tasks)
	{
		var store = this.store;
		
		for (var i = 0; i < tasks.length; i++) 
		{
			store.add(new this.taskRecord(tasks[i]));
		}
	},

	createGrdPnlCols : function()
	{
	
		var stateDefaultCol = new Array({
								hidden : false,
					        	header: Messages.hdr_lbl_state_process,
						        width: 70,
							    resizable: false,
					        	dataIndex: 'state',
						        sortable: true,
					    	    renderer: this.renderStateCell.createDelegate(this)
		});

		var nameDefaultCol = new Array({
								header: Messages.hdr_lbl_process,
								width: 150,
						        dataIndex: 'name',
					    	    sortable: true
	   	});


		var noteDefaultCol = new Array({
								header: Messages.hdr_lbl_note_process,
								width: 150,
						        dataIndex: 'note',
					    	    sortable: true
	   	});

		var cols = new Array();

		cols = cols.concat(stateDefaultCol,nameDefaultCol,noteDefaultCol);

		this.grid_panel_cols = new Ext.grid.ColumnModel(cols);
	},
	
	renderStateCell : function(data, cell, record, row_index, column_index, store)
	{
		return this.state_tpl.apply({state: data});
	},
	
	fillToolbar : function()
	{
		var tb = this.grid_panel.getBottomToolbar();
    	tb.x_buttons = {};
		
		tb.x_buttons.process = tb.addButton({
			text: this.textLayout.lblBtnProcess,
			tooltip: this.textLayout.lblBtnProcess,
			handler: function(){
				this.beginProcess();
			},
			scope: this
		});

		tb.x_buttons.abort = tb.addButton({
			text: this.textLayout.lblBtnAbort,
			tooltip: this.textLayout.lblBtnAbort,
			handler: function(){
	
				if (this.is_requesting)
					this.abortAjaxReqTask();
			},
			scope: this
		});
		
		tb.x_buttons.close = tb.addButton({
			text: this.textLayout.lblBtnClose,
			tooltip: this.textLayout.lblBtnClose,
			handler: function(){
	
				this.hide();
			},
			scope: this
		});
		
	},
	
	createGrid : function()
	{		
		this.grid_panel = new Ext.grid.GridPanel({
			ds: this.store,
			cm: this.grid_panel_cols,
			layout:'fit',
			height: this.height-50,
			x: 0,
			y: 22,
			border: true,
			viewConfig: {
				autoFill: true,
				forceFit: true
			},
			bbar : new Ext.Toolbar()
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
		if (this.autoRun)
			this.beginProcess();
	},

	beginProcess : function()
	{
		if (this.hasUnrequestedTasks() && !this.is_requesting)
		{
			this.grid_panel.getColumnModel().setHidden(0, false);
			this.setAjaxReqFlag();
			this.prepareNextAjaxReqTask()
		}
	},

	abortAllAjaxReqTask : function()
	{
		try
		{
			Ext.Ajax.abort(this.transactionId);
			this.resetAjaxReqFlag();

			var store = this.grid_panel.getStore();
			var record = null;

			store.each(function(r) {
				if (r.get('state') == Ext.evtApp.Process.TaskRec.STATE_QUEUE) 
				{
					record = r;
					
					record.set('state', Ext.evtApp.Process.TaskRec.STATE_FAILED);
					record.set('note', this.textLayout.abortMsg);
					record.commit();
				}
			},this);
		}
		catch(ex)
		{
			//ignore exception
		}

		return "exit";		
	},
	
	abortAjaxReqTask : function()
  	{
		try
		{
			Ext.Ajax.abort(this.transactionId);
			this.resetAjaxReqFlag();

			var store = this.grid_panel.getStore();
			var record = null;

			store.each(function(r) {
				if (r.get('state') == Ext.evtApp.Process.TaskRec.STATE_PROCESSING) 
				{
					record = r;
					return false;
				}
			});

			record.set('state', Ext.evtApp.Process.TaskRec.STATE_FAILED);
			record.set('note', this.textLayout.abortMsg);
			record.commit();

			if (record != null)
				this.fireEvent('ajaxReqTaskTotalCompleteEvent',this.store.indexOf(record));
		}
		catch(ex)
		{
			//ignore exception
		}
  	},

	prepareNextAjaxReqTask : function()
	{
		if (this.is_requesting) 
		{
			var store = this.store;		
			var record = null;

			store.each(function(r) {
				if (!record)
				{
					var recState = r.get('state');
						
					if (recState == Ext.evtApp.Process.TaskRec.STATE_QUEUE)
					{
						record = r;
					}
				}
			});

			record.set('state', Ext.evtApp.Process.TaskRec.STATE_PROCESSING);
			record.set('note', this.textLayout.processingMsg);
			record.commit();

			if (typeof record.get('onStart') == "function")
			record.get('onStart')(store.indexOf(record));

			this.ajaxReqTask(record);
		}
  	},
	
	ajaxReqTask : function(record)
  	{	
		this.transactionId = Ext.Ajax.request({
			url : record.get('cmd'),
			params : record.get('params'),
			method : 'POST',
			success : this.onAjaxSuccess,
			failure : this.onAjaxFailure,
			record: record,
			scope:this
		});
	},

	onAjaxSuccess : function(response, options)
  	{
		var json_response = Ext.decode(response.responseText);
		var ret = null;
		
		if (typeof options.record.get('onComplete') == "function"){
			var ret = options.record.get('onComplete')(json_response,this.store.indexOf(options.record),options.record.get('params'));
		}
		
		var data = {
			record: options.record,
			response: json_response
		};
		
		this.updateRecordState(data);
		
		if (json_response.success)
		{
			this.fireEvent('ajaxReqTaskCompleteEvent',data);
		}
		else
		{
			if (ret == "exit") return 0;
			
			data.msg = '';
			if ( json_response.status_msg ) {
				var msg = 'ret_' + json_response.status_msg;
				
				if (typeof Messages != 'undefined' && Messages[ msg ] ) 
					data.msg = Messages[ msg ];
				else data.msg = json_response.status_msg;
			}
			this.fireEvent('ajaxReqTaskFailedEvent',data);
		}
		
		if (this.hasUnrequestedTasks())
			this.prepareNextAjaxReqTask();
		else
		{
			this.resetAjaxReqFlag();
			this.fireEvent('ajaxReqTaskTotalCompleteEvent',this.store.indexOf(options.record));
		}
	},

    onAjaxFailure : function(response, options)
	{
		var data = {
			record : options.record,
			response : {
				'success' : false,
				'fail_msg' : this.textLayout.failMsg
			}
		};
		
		this.updateRecordState(data);
		
		if (this.hasUnrequestedTasks())
			this.prepareNextAjaxReqTask();
		else
		{
			this.resetAjaxReqFlag();
			this.fireEvent('ajaxReqTaskTotalCompleteEvent',this.store.indexOf(options.record));
		}
	},

	updateRecordState : function(data)
	{
		if (data.response.success) 
		{
			data.record.set('state', Ext.evtApp.Process.TaskRec.STATE_FINISHED);
			data.record.set('note', this.textLayout.successMsg || data.response.status_msg);
		}
		else 
		{
			data.record.set('state', Ext.evtApp.Process.TaskRec.STATE_FAILED);
			data.record.set('note', data.response.fail_msg || this.textLayout.errorMsg + "["+data.response.status_msg+"]" );
		}

		data.record.commit();
	},
	
	getQueuedCount : function(count_processing)
	{
		var count = 0;
		var store = this.store;

		store.each(function(r) {
			
			var recState = r.get('state');

			if (recState == Ext.evtApp.Process.TaskRec.STATE_QUEUE) 
			{
				count++;
			}
    	});

		return count;
	},
	
	hasUnrequestedTasks : function()
	{
		return this.getQueuedCount() > 0;
	},
	
	setAjaxReqFlag : function()
	{
		this.is_requesting = true;
	},
	
	resetAjaxReqFlag : function()
	{
		this.is_requesting = false;
	}
});